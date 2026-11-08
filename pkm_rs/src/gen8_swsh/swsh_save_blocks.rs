//! Item storage for Pokémon Sword / Shield.
//!
//! Port of PKHeX's `PKHeX.Core/Items/ItemStorage8SWSH.cs`.

use std::collections::BTreeMap;
use std::ops::{Deref, DerefMut};

use super::{BOX_NAME_LENGTH, BOX_SLOTS, BoxName, Pk8};
use crate::encryption::swish_crypto::{self, NumericBlock, ObjectBlock, SwishBlocks};
use crate::gen8_swsh::{BoxIndex, BoxSlot};
use crate::items::{ItemDataTs, SwshItemPouch, SwshItemStorage};
use crate::result::{Error, Result, StdResult};
use crate::traits::PkmBytes;
use crate::util::{self, vec_into_box};

use arbitrary_int::traits::Integer;
use arbitrary_int::u15;
use arrayref::array_ref;
use num_enum::{IntoPrimitive, TryFromPrimitive};
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{BinaryGender, Language, read_u16_le};
use pkm_rs_types::{OriginGame, read_u32_le};
use static_assertions::const_assert_eq;
use strum::{Display, EnumIter, EnumString};
use zerocopy::{
    FromBytes, Immutable, IntoBytes, KnownLayout, LittleEndian, TryFromBytes, Unaligned,
};

#[derive(Debug, Clone)]
pub(super) struct SwordShieldBlocks {
    pub(super) my_status: MyStatusBlock,
    pub(super) trainer_card: TrainerCard,
    pub(super) pokemon_boxes: BoxBlock,
    pub(super) box_layouts: BoxLayout,
    pub(super) current_box: NumericBlock,
    pub(super) items: ItemInventoryBlock,
    pub(super) other_blocks: SwishBlocks<SwShBlockKey>,
}

impl SwordShieldBlocks {
    pub fn from_blocks(mut blocks: SwishBlocks<SwShBlockKey>) -> Result<Self> {
        let my_status = MyStatusBlock(blocks.try_pop_object(SwShBlockKey::MyStatus)?);
        let trainer_card = TrainerCard(blocks.try_pop_object(SwShBlockKey::TrainerCard)?);
        let pokemon_boxes = BoxBlock(blocks.try_pop_object(SwShBlockKey::Box)?);
        let box_layouts = BoxLayout(blocks.try_pop_array(SwShBlockKey::BoxLayout)?);
        let current_box = blocks.try_pop_numeric(SwShBlockKey::CurrentBox)?;

        let item_inventory =
            vec_into_box::<ItemInventory>(blocks.try_pop_object(SwShBlockKey::Item)?.into_bytes())
                .map_err(|_| Error::other("failed to transmute items block"))?;

        Ok(Self {
            my_status,
            trainer_card,
            pokemon_boxes,
            box_layouts,
            current_box,
            items: ItemInventoryBlock(item_inventory),
            other_blocks: blocks,
        })
    }

    pub fn to_blocks(&self) -> BTreeMap<u32, swish_crypto::Block> {
        let Self {
            my_status,
            trainer_card,
            pokemon_boxes,
            box_layouts,
            current_box,
            items,
            other_blocks,
        } = &self;

        let current_box_block = swish_crypto::Block::new(
            SwShBlockKey::CurrentBox,
            swish_crypto::BlockData::Value(*current_box),
        );

        // the game will read the file fine if the blocks aren't sorted, but PKHeX expects them to be in key order.
        // an iterator from a btree will preserve key order.
        let mut all_blocks = other_blocks.clone().into_inner();
        for block in [
            my_status.clone().into_block(),
            trainer_card.clone().into_block(),
            pokemon_boxes.clone().into_block(),
            box_layouts.clone().into_block(),
            items.0.to_block(),
            current_box_block,
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
pub enum SwShBlockKey {
    MyStatus = 0xf25c070e,
    TeamNames = 0x1920c1e4,
    TeamIndexes = 0x33f39467,
    BoxLayout = 0x19722c89,
    BoxWallpapers = 0x2eb1b190,
    MenuButtons = 0xb1dddca8,

    Box = 0x0d66012c,
    MysteryGift = 0x112d5141,
    Item = 0x1177c2c4,
    Coordinates = 0x16aaa7fa,
    Misc = 0x1b882b09,
    Party = 0x2985fe5d,
    Daycare = 0x2d6fba6a,
    Record = 0x37da95a3,
    Zukan = 0x4716c404,
    ZukanR1 = 0x3f936ba9,
    ZukanR2 = 0x3c9366f0,
    PokedexRecommendation = 0xc3fb9e77,
    CurryDex = 0x6eb72940,
    TrainerCard = 0x874da6fa,
    PlayTime = 0x8cbbfd90,

    CurrentBox = 0x017c3cbb,
    BoxesUnlocked = 0x71825204,
}

#[derive(Debug, Clone)]
pub(super) struct MyStatusBlock(pub(super) swish_crypto::ObjectBlock);

impl MyStatusBlock {
    const NAME_OFFSET: usize = 0xb0;
    pub const NAME_BYTE_LENGTH: usize = 24;

    const TID_OFFSET: usize = 0xa0;
    const SID_OFFSET: usize = 0xa2;
    const LANGUAGE_OFFSET: usize = 0xa7;
    const ORIGIN_OFFSET: usize = 0xa4;
    const GENDER_OFFSET: usize = 0xa5;

    const BUFFER_ERROR: &'static str = "MyStatusBlock buffer is not the correct size";

    pub fn trainer_name(&self) -> SizedUtf16String<{ MyStatusBlock::NAME_BYTE_LENGTH }> {
        SizedUtf16String::from_bytes(
            self.0.bytes()[Self::NAME_OFFSET..Self::NAME_OFFSET + Self::NAME_BYTE_LENGTH]
                .try_into()
                .expect(Self::BUFFER_ERROR),
        )
    }

    pub fn trainer_id(&self) -> u16 {
        read_u16_le!(self.0.bytes(), Self::TID_OFFSET)
    }

    pub fn secret_id(&self) -> u16 {
        read_u16_le!(self.0.bytes(), Self::SID_OFFSET)
    }

    pub fn tid_sid_u32(&self) -> u32 {
        read_u32_le!(self.0.bytes(), Self::TID_OFFSET)
    }

    pub fn language(&self) -> Result<Language> {
        let language_byte = self.0.bytes()[Self::LANGUAGE_OFFSET];
        Ok(Language::try_from(language_byte)?)
    }

    pub fn origin_game(&self) -> Option<OriginGame> {
        let origin_game_raw = self.0.bytes()[Self::ORIGIN_OFFSET];
        OriginGame::try_from_u8(origin_game_raw)
    }

    pub fn trainer_gender(&self) -> BinaryGender {
        let gender_raw = self.0.bytes()[Self::GENDER_OFFSET] & 1;
        BinaryGender::from(gender_raw == 1)
    }

    pub fn into_block(self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            SwShBlockKey::MyStatus,
            swish_crypto::BlockData::Object(self.0),
        )
    }
}

#[derive(Debug, Clone)]
pub(super) struct BoxBlock(swish_crypto::ObjectBlock);

impl BoxBlock {
    const BOX_SIZE_BYTES: usize = Pk8::BOX_SIZE * (BOX_SLOTS as usize);

    pub const fn box_bytes_start(box_index: BoxIndex) -> usize {
        Self::BOX_SIZE_BYTES * box_index.get() as usize
    }

    pub const fn pokemon_bytes_start(box_index: BoxIndex, box_slot: BoxSlot) -> usize {
        let box_start = Self::box_bytes_start(box_index);
        box_start + Pk8::BOX_SIZE * box_slot.get() as usize
    }

    pub fn mon_bytes_at(&self, box_index: BoxIndex, box_slot: BoxSlot) -> &[u8] {
        let start = Self::pokemon_bytes_start(box_index, box_slot);
        &self.0.bytes()[start..start + Pk8::BOX_SIZE]
    }

    pub fn mon_bytes_at_mut(&mut self, box_index: BoxIndex, box_slot: BoxSlot) -> &mut [u8] {
        let start = Self::pokemon_bytes_start(box_index, box_slot);
        &mut self.0.bytes_mut()[start..start + Pk8::BOX_SIZE]
    }

    fn into_block(self) -> swish_crypto::Block {
        swish_crypto::Block::new(SwShBlockKey::Box, swish_crypto::BlockData::Object(self.0))
    }
}

#[derive(Debug, Clone)]
pub(super) struct BoxLayout(swish_crypto::ArrayBlock);

impl BoxLayout {
    pub fn get_box_name(&self, box_index: BoxIndex) -> BoxName {
        let start = BOX_NAME_LENGTH * box_index.get() as usize;
        let name_bytes = array_ref![self.0.bytes(), start, BOX_NAME_LENGTH];

        SizedUtf16String::from_bytes(*name_bytes)
    }

    fn into_block(self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            SwShBlockKey::BoxLayout,
            swish_crypto::BlockData::Array(self.0),
        )
    }
}

#[derive(Debug, Clone)]
pub(super) struct TrainerCard(swish_crypto::ObjectBlock);

impl TrainerCard {
    pub fn into_block(self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            SwShBlockKey::TrainerCard,
            swish_crypto::BlockData::Object(self.0.clone()),
        )
    }

    pub fn fields(
        &self,
    ) -> StdResult<TrainerCardFields, zerocopy::TryReadError<&[u8], TrainerCardFields>> {
        TrainerCardFields::try_read_from_bytes(&self.0.bytes()[..size_of::<TrainerCardFields>()])
    }
}

#[derive(Debug, Clone, TryFromBytes, IntoBytes, KnownLayout, Immutable)]
#[repr(C, packed)]
pub struct TrainerCardFields {
    pub trainer_name: SizedUtf16String<26>,
    _gap1: u8,
    pub language: Language,
    pub trainer_id: zerocopy::U16<LittleEndian>,
    pub secret_id: zerocopy::U16<LittleEndian>,
    pub pokedex_owned: zerocopy::U16<LittleEndian>,
    pub shiny_pokemon_found: zerocopy::U16<LittleEndian>,
    game_raw: u8,
    pub starter_index: u8,
    _gap2: [u8; 0x12],
    pub gender: bool,
}

use std::mem::offset_of;
const_assert_eq!(offset_of!(TrainerCardFields, trainer_name), 0x00);
const_assert_eq!(offset_of!(TrainerCardFields, language), 0x1B);
const_assert_eq!(offset_of!(TrainerCardFields, pokedex_owned), 0x20);
const_assert_eq!(offset_of!(TrainerCardFields, starter_index), 0x25);
const_assert_eq!(offset_of!(TrainerCardFields, gender), 0x38);

#[derive(Debug, Clone, Copy, Default, FromBytes, IntoBytes, KnownLayout, Immutable, Unaligned)]
#[repr(C, packed)]
pub struct ItemDataSwsh([u8; 4]);

const U15_MASK: u32 = 0x7FFF;
const INDEX_MASK: u32 = U15_MASK;
const COUNT_MASK: u32 = U15_MASK << 15;

impl ItemDataSwsh {
    const fn as_u32_le(&self) -> u32 {
        u32::from_le_bytes(self.0)
    }

    const fn set_u32(&mut self, v: u32) {
        self.0 = v.to_le_bytes()
    }

    pub const fn get_index(&self) -> u15 {
        u15::extract_u32(self.as_u32_le(), 0)
    }

    pub const fn is_obtained(&self) -> bool {
        self.0[0] != 0
    }

    pub const fn set_index(&mut self, v: u15) {
        let mut value_u32 = self.as_u32_le();
        value_u32 = (value_u32 & !INDEX_MASK) | (v.value() as u32 & INDEX_MASK);
        self.set_u32(value_u32);
    }

    pub const fn get_count(&self) -> u15 {
        u15::extract_u32(self.as_u32_le(), 15)
    }

    fn set_count(&mut self, v: u15) {
        let mut value_u32 = self.as_u32_le();
        value_u32 = (value_u32 & !COUNT_MASK) | ((v.as_u32() << 15) & COUNT_MASK);
        self.set_u32(value_u32);
    }

    pub fn get_is_new(&self) -> bool {
        util::get_flag(&self.0, 0, 30)
    }

    fn set_is_new(&mut self, v: bool) {
        util::set_flag(&mut self.0, 0, 30, v)
    }

    pub fn get_is_favorite(&self) -> bool {
        util::get_flag(&self.0, 0, 31)
    }

    fn set_is_favorite(&mut self, v: bool) {
        util::set_flag(&mut self.0, 0, 31, v)
    }

    pub fn to_ts(self) -> ItemDataTs {
        ItemDataTs {
            index: self.get_index().as_u16(),
            count: self.get_count().as_u32(),
            is_new: self.get_is_new(),
            is_obtained: self.is_obtained(),
            is_favorite: self.get_is_favorite(),
        }
    }

    fn update_from_ts(&mut self, update: ItemDataTs) {
        if !self.is_obtained() {
            self.set_index(u15::extract_u16(update.index, 0));
            self.set_is_new(true);
        }
        self.set_count(u15::extract_u32(update.count, 0));
        self.set_is_favorite(update.is_favorite);
    }
}

#[derive(Debug, Clone, FromBytes, IntoBytes, KnownLayout, Immutable, Unaligned)]
#[repr(C)]
pub struct ItemPouch<const SIZE: usize> {
    pub items: [ItemDataSwsh; SIZE],
}

impl<const SIZE: usize> ItemPouch<SIZE> {
    pub fn all(&self) -> impl Iterator<Item = ItemDataSwsh> {
        (0..SIZE)
            .map(|index| self.items[index])
            .filter(|item| item.get_index() != u15::ZERO)
    }

    const fn clear_item(&mut self, index: usize) {
        if index < SIZE {
            self.items[index] = ItemDataSwsh([0u8; 4])
        }
    }

    fn find_item_slot_index(&self, index: u15) -> Option<usize> {
        self.items.iter().position(|d| d.get_index() == index)
    }

    fn next_empty_slot_index(&self) -> Option<usize> {
        self.items.iter().position(|d| d.get_index() == u15::ZERO)
    }

    fn find_item_slot_or_first_empty_mut(&mut self, index: u15) -> Option<&mut ItemDataSwsh> {
        if let Some(index) = self
            .find_item_slot_index(index)
            .or_else(|| self.next_empty_slot_index())
        {
            self.items.get_mut(index)
        } else {
            None
        }
    }

    #[cfg(feature = "wasm")]
    pub fn update_item_from_ts(&mut self, data: ItemDataTs) {
        if let Some(item_slot) =
            self.find_item_slot_or_first_empty_mut(u15::extract_u16(data.index, 0))
        {
            item_slot.update_from_ts(data);
        };
    }
}

impl<const SIZE: usize> Default for ItemPouch<SIZE> {
    fn default() -> Self {
        Self {
            items: [ItemDataSwsh::default(); SIZE],
        }
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

#[derive(Debug, Default, Clone, FromBytes, IntoBytes, KnownLayout, Immutable, Unaligned)]
#[repr(C)]
pub struct ItemInventory {
    pub medicine: ItemPouch<60>,
    pub balls: ItemPouch<30>,
    pub battle_items: ItemPouch<20>,
    pub berries: ItemPouch<80>,
    pub general: ItemPouch<550>,
    pub tms_trs: ItemPouch<210>,
    pub treasure: ItemPouch<100>,
    pub ingredients: ItemPouch<100>,
    pub key_items: ItemPouch<64>,
}

const_assert_eq!(offset_of!(ItemInventory, medicine), 0x0000);
const_assert_eq!(offset_of!(ItemInventory, balls), 0x00F0);
const_assert_eq!(offset_of!(ItemInventory, battle_items), 0x0168);
const_assert_eq!(offset_of!(ItemInventory, berries), 0x01B8);
const_assert_eq!(offset_of!(ItemInventory, general), 0x02F8);
const_assert_eq!(offset_of!(ItemInventory, tms_trs), 0x0B90);
const_assert_eq!(offset_of!(ItemInventory, treasure), 0x0ED8);
const_assert_eq!(offset_of!(ItemInventory, ingredients), 0x1068);
const_assert_eq!(offset_of!(ItemInventory, key_items), 0x11F8);

impl ItemInventory {
    pub fn all(&self) -> impl Iterator<Item = ItemDataSwsh> {
        let ItemInventory {
            medicine,
            balls,
            battle_items,
            berries,
            general: items,
            tms_trs: tmh_ms,
            treasure,
            ingredients: candy,
            key_items,
        } = self;

        medicine.all().chain(
            balls.all().chain(
                battle_items.all().chain(
                    berries.all().chain(
                        items.all().chain(
                            tmh_ms
                                .all()
                                .chain(treasure.all().chain(candy.all().chain(key_items.all()))),
                        ),
                    ),
                ),
            ),
        )
    }

    fn to_block(&self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            SwShBlockKey::Item,
            swish_crypto::BlockData::Object(ObjectBlock::new(self.as_bytes().to_vec())),
        )
    }

    fn clear_item(&mut self, item_index: usize) {
        let Some(pouch) = SwshItemStorage::pouch_for(item_index as u16) else {
            return;
        };

        match pouch {
            SwshItemPouch::Medicine => self.medicine.clear_item(item_index),
            SwshItemPouch::Balls => self.balls.clear_item(item_index),
            SwshItemPouch::Battle => self.battle_items.clear_item(item_index),
            SwshItemPouch::Berries => self.berries.clear_item(item_index),
            SwshItemPouch::General => self.general.clear_item(item_index),
            SwshItemPouch::TmsTrs => self.tms_trs.clear_item(item_index),
            SwshItemPouch::Treasure => self.treasure.clear_item(item_index),
            SwshItemPouch::Ingredients => self.ingredients.clear_item(item_index),
            SwshItemPouch::KeyItems => self.key_items.clear_item(item_index),
        }
    }

    #[cfg(feature = "wasm")]
    fn update_from_ts(&mut self, data: ItemDataTs) {
        let Some(pouch) = SwshItemStorage::pouch_for(data.index) else {
            return;
        };

        match pouch {
            SwshItemPouch::Medicine => self.medicine.update_item_from_ts(data),
            SwshItemPouch::Balls => self.balls.update_item_from_ts(data),
            SwshItemPouch::Battle => self.battle_items.update_item_from_ts(data),
            SwshItemPouch::Berries => self.berries.update_item_from_ts(data),
            SwshItemPouch::General => self.general.update_item_from_ts(data),
            SwshItemPouch::TmsTrs => self.tms_trs.update_item_from_ts(data),
            SwshItemPouch::Treasure => self.treasure.update_item_from_ts(data),
            SwshItemPouch::Ingredients => self.ingredients.update_item_from_ts(data),
            SwshItemPouch::KeyItems => self.key_items.update_item_from_ts(data),
        }
    }

    #[cfg(feature = "wasm")]
    pub fn update_item_from_ts(&mut self, data: ItemDataTs) {
        let index = data.index as usize;
        if data.count == 0 {
            self.clear_item(index);
        } else {
            self.update_from_ts(data);
        }
    }
}
