use std::collections::BTreeMap;
use std::ops::{Deref, DerefMut};

use super::{BOX_NAME_LENGTH, BOX_SLOTS, BoxName, Pa9};
use crate::encryption::swish_crypto::{
    self, Block, BlockData, NumericBlock, ObjectBlock, SwishBlocks, SwishError,
};
use crate::gen9_lza::{BoxIndex, BoxSlot, MAX_BOX_COUNT};
use crate::items::{ItemDataTs, LzaItemStorage};
use crate::result::{Error, Result, StdResult};
use crate::traits::PkmBytes;
use crate::util::{self, vec_into_box};

use arrayref::array_ref;
use num_enum::{IntoPrimitive, TryFromPrimitive, TryFromPrimitiveError};
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{FlagSet, Language};
use static_assertions::const_assert_eq;
use strum::{Display, EnumIter, EnumString};
use zerocopy::{
    FromBytes, Immutable, IntoBytes, KnownLayout, LittleEndian, TryFromBytes, Unaligned,
};

#[derive(Debug, Clone)]
pub(super) struct LzaBlocks {
    pub(super) my_status: MyStatusFields,
    pub(super) pokemon_boxes: BoxData,
    pub(super) box_layouts: BoxLayout,
    pub(super) current_box: NumericBlock,
    pub(super) items: ItemInventoryBlock,
    pub(super) other_blocks: SwishBlocks<LzaBlockKey>,
}

impl LzaBlocks {
    pub fn from_blocks(mut blocks: SwishBlocks<LzaBlockKey>) -> Result<Self> {
        let my_status =
            MyStatusFields::read(blocks.try_pop_object(LzaBlockKey::MyStatus)?.bytes())?;
        let pokemon_boxes = BoxData(
            vec_into_box::<BoxDataInner>(blocks.try_pop_object(LzaBlockKey::Box)?.into_bytes())
                .map_err(|bytes| {
                    Error::Other(format!(
                        "failed to transmute pc boxes block (byte length {})",
                        bytes.len()
                    ))
                })?,
        );
        let box_layouts = BoxLayout(blocks.try_pop_array(LzaBlockKey::BoxLayout)?);
        let current_box = blocks.try_pop_numeric(LzaBlockKey::CurrentBox)?;
        let item_inventory =
            vec_into_box::<ItemInventory>(blocks.try_pop_object(LzaBlockKey::Item)?.into_bytes())
                .map_err(|bytes| {
                Error::Other(format!(
                    "failed to transmute items block (byte length {})",
                    bytes.len()
                ))
            })?;

        Ok(Self {
            my_status,
            pokemon_boxes,
            box_layouts,
            current_box,
            items: ItemInventoryBlock(item_inventory),
            other_blocks: blocks,
        })
    }

    pub fn to_blocks(&self) -> BTreeMap<u32, Block> {
        let mut all_blocks = self.other_blocks.clone().into_inner();
        for block in [
            self.my_status.to_block(),
            self.pokemon_boxes.to_block(),
            self.box_layouts.to_block(),
            self.items.0.to_block(),
            Block::new(LzaBlockKey::CurrentBox, BlockData::Value(self.current_box)),
        ] {
            all_blocks.insert(block.key(), block);
        }
        all_blocks
    }
}

#[derive(
    Debug,
    PartialEq,
    Eq,
    Clone,
    Copy,
    EnumIter,
    EnumString,
    Display,
    TryFromPrimitive,
    IntoPrimitive,
)]
#[repr(u32)]
pub enum LzaBlockKey {
    MyStatus = 0xe3e89bd1,
    TeamIndexes = 0x33f39467,
    BoxLayout = 0x19722c89,
    BoxWallpapers = 0x2eb1b190,
    CurrentBox = 0x017c3cbb,

    Box = 0x0d66012c,
    MysteryGift = 0xbec26cd5,
    Item = 0x21c9bd44,
    Party = 0x3aa1a9ad,
    Money = 0x4f35d0dd, // u32
    PlayTime = 0xedaff794,
    Pokedex = 0x2d87be5c,

    InfiniteRoyale = 0x8929bfb6,
    Donuts = 0xbe007476,
}

#[derive(Debug, Clone, TryFromBytes, IntoBytes, KnownLayout, Immutable)]
#[repr(C, packed)]
pub struct MyStatusFields {
    pub trainer_id: zerocopy::U16<LittleEndian>,
    pub secret_id: zerocopy::U16<LittleEndian>,
    pub game_raw: u8,
    pub gender_raw: u8,
    _gap1: u8,
    pub language: Language,
    _gap2: [u8; 8],
    pub trainer_name: SizedUtf16String<{ Self::NAME_BYTE_LENGTH }>,
    _remaining: [u8; 78],
}

const_assert_eq!(std::mem::offset_of!(MyStatusFields, game_raw), 0x04);

const_assert_eq!(std::mem::offset_of!(MyStatusFields, trainer_name), 0x10);

impl MyStatusFields {
    pub const NAME_BYTE_LENGTH: usize = 26;

    pub fn to_block(&self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            LzaBlockKey::MyStatus,
            swish_crypto::BlockData::Object(ObjectBlock::new(self.as_bytes().to_vec())),
        )
    }

    pub fn read(bytes: &[u8]) -> StdResult<Self, SwishError> {
        Self::try_read_from_bytes(bytes).or(Err(SwishError::ByteLength {
            context: "MyStatusFields".to_owned(),
            expected: size_of::<Self>(),
            actual: bytes.len(),
        }))
    }
}

const BOX_SLOT_GAP_BYTES: usize = 0x40;
const BOX_SLOT_SIZE_BYTES: usize = Pa9::BOX_SIZE + BOX_SLOT_GAP_BYTES;

type Pa9BoxSlotBytes = [u8; Pa9::BOX_SIZE + BOX_SLOT_GAP_BYTES];
type PcBoxBytes = [Pa9BoxSlotBytes; BOX_SLOTS as usize];

#[derive(Debug, Clone, FromBytes, IntoBytes, KnownLayout, Immutable, Unaligned)]
#[repr(C, packed)]
pub struct BoxDataInner {
    pub boxes: [PcBoxBytes; MAX_BOX_COUNT as usize],
}

#[derive(Debug, Clone)]
pub struct BoxData(Box<BoxDataInner>); // boxed to not overflow the stack

impl BoxData {
    pub const fn box_bytes(&self, box_index: BoxIndex) -> &PcBoxBytes {
        &self.0.boxes[box_index.to_usize()]
    }

    pub const fn mon_bytes_at(&self, box_index: BoxIndex, box_slot: BoxSlot) -> &[u8] {
        self.box_bytes(box_index)[box_slot.to_usize()]
            .split_at(Pa9::BOX_SIZE) // ignore gap between slots
            .0
    }

    pub fn mon_bytes_at_mut(&mut self, box_index: BoxIndex, box_slot: BoxSlot) -> &mut [u8] {
        &mut self.0.boxes[box_index.to_usize()][box_slot.to_usize()][0..Pa9::BOX_SIZE]
    }

    fn to_block(&self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            LzaBlockKey::Box,
            swish_crypto::BlockData::Object(ObjectBlock::new(self.as_bytes().to_vec())),
        )
    }
}

impl std::ops::Deref for BoxData {
    type Target = BoxDataInner;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

const_assert_eq!(
    std::mem::size_of::<BoxDataInner>(),
    MAX_BOX_COUNT as usize * BOX_SLOTS as usize * BOX_SLOT_SIZE_BYTES
);

#[derive(Debug, Clone)]
pub(super) struct BoxLayout(swish_crypto::ArrayBlock);

impl BoxLayout {
    pub fn get_box_name(&self, box_index: BoxIndex) -> BoxName {
        let start = BOX_NAME_LENGTH * box_index.get() as usize;
        let name_bytes = array_ref![self.0.bytes(), start, BOX_NAME_LENGTH];

        let box_name = SizedUtf16String::from_bytes(*name_bytes);
        if box_name.is_empty() {
            format!("Box {}", box_index.to_usize() + 1).into()
        } else {
            box_name
        }
    }

    fn to_block(&self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            LzaBlockKey::BoxLayout,
            swish_crypto::BlockData::Array(self.0.clone()),
        )
    }
}

const ITEM_INVENTORY_MAX_COUNT: usize = 3008;
const ITEM_INVENTORY_SIZE: usize = ITEM_INVENTORY_MAX_COUNT * std::mem::size_of::<ItemDataLza>();

#[derive(Debug, Clone, Copy, IntoBytes, TryFromPrimitive, KnownLayout, Immutable)]
#[repr(u8)]
pub enum ItemIs {
    New,
    Favorite,
    Obtained,
}

impl From<ItemIs> for usize {
    fn from(value: ItemIs) -> Self {
        value as usize
    }
}

impl TryFrom<usize> for ItemIs {
    type Error = TryFromPrimitiveError<Self>;

    fn try_from(value: usize) -> StdResult<Self, Self::Error> {
        Self::try_from(value as u8)
    }
}

#[derive(Debug, Clone, Copy, Default, FromBytes, IntoBytes, KnownLayout, Immutable)]
#[repr(C, packed)]
pub struct ItemDataLza {
    pub pouch: zerocopy::U32<LittleEndian>,
    pub count: zerocopy::I32<LittleEndian>,
    flags: [u8; 4],
    _padding: [u8; 4],
}

impl ItemDataLza {
    pub fn get_count(&self) -> u32 {
        self.count.get().max(0) as u32
    }

    pub fn get_flag(&self, flag: ItemIs) -> bool {
        FlagSet::from_bytes(self.flags).get_flag((flag as u8) as usize)
    }

    fn set_flag(&mut self, flag: ItemIs, v: bool) {
        util::set_flag(&mut self.flags, 0, flag as usize, v);
    }

    pub fn to_ts(self, index: u16) -> ItemDataTs {
        ItemDataTs {
            index,
            count: self.get_count(),
            is_new: self.get_flag(ItemIs::New),
            is_obtained: self.get_flag(ItemIs::Obtained),
            is_favorite: self.get_flag(ItemIs::Favorite),
        }
    }

    fn mark_as_obtained(&mut self) {
        let already_obtained = self.get_flag(ItemIs::Obtained);
        self.set_flag(ItemIs::Obtained, true);
        self.set_flag(ItemIs::New, !already_obtained);
    }

    fn update_count(&mut self, updated: i32) {
        let prev_count = self.count.get();
        if prev_count < 0 {
            return;
        }

        self.count.set(updated);
        if updated > 0 {
            self.mark_as_obtained();
        }
    }

    fn update_from_ts(&mut self, update: ItemDataTs) {
        self.update_count(i32::try_from(update.count).unwrap_or(i32::MAX));
        self.set_flag(ItemIs::Favorite, update.is_favorite);
        self.pouch.set(
            LzaItemStorage::pouch_for(update.index)
                .map(u32::from)
                .unwrap_or(0),
        )
    }
}

#[derive(Debug, Clone, Default)]
pub struct ItemInventoryBlock(pub(crate) Box<ItemInventory>); // boxed to not overflow the stack

impl Deref for ItemInventoryBlock {
    type Target = Box<ItemInventory>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for ItemInventoryBlock {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

#[derive(Debug, Clone, FromBytes, IntoBytes, KnownLayout, Immutable, Unaligned)]
#[repr(C, packed)]
pub struct ItemInventory {
    pub items: [ItemDataLza; ITEM_INVENTORY_MAX_COUNT],
}

impl ItemInventory {
    pub fn all(&self) -> impl Iterator<Item = ItemDataLza> {
        (0..ITEM_INVENTORY_MAX_COUNT).map(|index| self.items[index])
    }

    fn to_block(&self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            LzaBlockKey::Item,
            swish_crypto::BlockData::Object(ObjectBlock::new(self.as_bytes().to_vec())),
        )
    }

    const fn empty(&self) -> ItemDataLza {
        self.items[0]
    }

    const fn clear_item(&mut self, index: usize) {
        if index < ITEM_INVENTORY_MAX_COUNT {
            self.items[index] = self.empty()
        }
    }

    #[cfg(feature = "wasm")]
    pub fn update_item_from_ts(&mut self, data: ItemDataTs) {
        let index = data.index as usize;
        if data.count == 0 {
            self.clear_item(index);
        } else {
            self.items[data.index as usize].update_from_ts(data);
        }
    }
}

impl Default for ItemInventory {
    fn default() -> Self {
        Self {
            items: [ItemDataLza::default(); ITEM_INVENTORY_MAX_COUNT],
        }
    }
}

const_assert_eq!(std::mem::size_of::<ItemInventory>(), ITEM_INVENTORY_SIZE);
