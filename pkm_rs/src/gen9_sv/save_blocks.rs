use std::collections::BTreeMap;

use super::{BOX_NAME_LENGTH, BOX_SLOTS, BoxName, Pk9};
use crate::encryption::swish_crypto::{
    self, Block, BlockData, NumericBlock, ObjectBlock, SwishBlocks, SwishError,
};
use crate::gen9_sv::{BoxIndex, BoxSlot, MAX_BOX_COUNT};
use crate::result::{Result, StdResult};
use crate::traits::PkmBytes;

use num_enum::{IntoPrimitive, TryFromPrimitive};
use pkm_rs_types::Language;
use pkm_rs_types::strings::SizedUtf16String;
use static_assertions::const_assert_eq;
use strum::{Display, EnumIter, EnumString};
use zerocopy::{Immutable, IntoBytes, KnownLayout, LittleEndian, TryFromBytes};

#[derive(Debug, Clone)]
pub(super) struct SvBlocks {
    pub(super) my_status: MyStatusFields,
    pub(super) pokemon_boxes: BoxData,
    pub(super) box_layouts: BoxLayout,
    pub(super) current_box: NumericBlock,
    pub(super) other_blocks: SwishBlocks,
}

impl SvBlocks {
    pub fn from_blocks(mut blocks: SwishBlocks) -> Result<Self> {
        let my_status =
            MyStatusFields::read(&blocks.try_pop_block(SvBlockKey::MyStatus)?.to_bytes())?;

        let pokemon_boxes = BoxData::read(&blocks.try_pop_block(SvBlockKey::Box)?.to_bytes())?;

        let box_layouts = BoxLayout(
            blocks
                .try_pop_block(SvBlockKey::BoxLayout)?
                .into_array_data()?,
        );
        let current_box = blocks
            .try_pop_block(SvBlockKey::CurrentBox)?
            .into_numeric_data()?;

        Ok(Self {
            my_status,
            pokemon_boxes,
            box_layouts,
            current_box,
            other_blocks: Default::default(),
        })
    }

    pub fn to_blocks(&self) -> BTreeMap<u32, Block> {
        let Self {
            my_status,
            pokemon_boxes,
            box_layouts,
            current_box,
            other_blocks,
        } = self.clone();

        // the game will read the file fine if the blocks aren't sorted, but PKHeX expects them to be in key order.
        // an iterator from a btree will preserve key order.
        let mut all_blocks = other_blocks.into_inner();
        for block in [
            my_status.into_block(),
            pokemon_boxes.into_block(),
            box_layouts.into_block(),
            Block::new(SvBlockKey::CurrentBox, BlockData::Value(current_box)),
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
pub enum SvBlockKey {
    MyStatus = 0xE3E89BD1,
    TeamNames = 0x1920c1e4,
    TeamIndexes = 0x33F39467,
    BoxLayout = 0x19722c89,
    BoxWallpapers = 0x2EB1B190,
    CurrentBox = 0x017C3CBB,

    Box = 0x0d66012c,
    MysteryGift = 0x99E1625E,
    Item = 0x21C9BD44,
    Party = 0x2985fe5d,
    Money = 0x4F35D0DD,
    Zukan = 0x0DEAAEBD,
    ZukanT1 = 0xF5D7C0E2,
    PlayTime = 0xEDAFF794,

    BlueberryPoints = 0x66A33824,
    TeraRaidDlc = 0x100B93DA,
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
    _remaining: [u8; 62],
}

const_assert_eq!(std::mem::offset_of!(MyStatusFields, game_raw), 0x04);

const_assert_eq!(std::mem::offset_of!(MyStatusFields, trainer_name), 0x10);

impl MyStatusFields {
    pub const NAME_BYTE_LENGTH: usize = 26;

    pub fn into_block(self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            SvBlockKey::MyStatus,
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

const PK9_PARTY_SIZE: usize = 0x158;

type Pk9PartyBytes = [u8; PK9_PARTY_SIZE];
type PcBoxBytes = [Pk9PartyBytes; BOX_SLOTS as usize];

#[derive(Debug, Clone, TryFromBytes, IntoBytes, KnownLayout, Immutable)]
#[repr(C, packed)]
pub struct BoxDataInner {
    pub boxes: [PcBoxBytes; MAX_BOX_COUNT as usize],
    pub ride_legendary_bytes: Pk9PartyBytes,
    _remaining_bytes: [u8; 9976],
}

#[derive(Debug, Clone)]
pub struct BoxData(Box<BoxDataInner>); // boxed to not overflow the stack

impl BoxData {
    pub const fn box_bytes(&self, box_index: BoxIndex) -> &PcBoxBytes {
        &self.0.boxes[box_index.to_usize()]
    }

    pub const fn mon_bytes_at(&self, box_index: BoxIndex, box_slot: BoxSlot) -> &[u8] {
        &self.box_bytes(box_index)[box_slot.to_usize()]
    }

    pub const fn mon_bytes_at_mut(&mut self, box_index: BoxIndex, box_slot: BoxSlot) -> &mut [u8] {
        &mut self.0.boxes[box_index.to_usize()][box_slot.to_usize()]
    }

    fn into_block(self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            SvBlockKey::Box,
            swish_crypto::BlockData::Object(ObjectBlock::new(self.as_bytes().to_vec())),
        )
    }

    pub fn read(bytes: &[u8]) -> StdResult<Self, SwishError> {
        let Ok(box_bytes) = BoxDataInner::try_ref_from_bytes(bytes) else {
            return Err(SwishError::ByteLength {
                context: "BoxData".to_owned(),
                expected: size_of::<Self>(),
                actual: bytes.len(),
            });
        };

        Ok(Self(Box::new(box_bytes.clone())))
    }
}

impl std::ops::Deref for BoxData {
    type Target = BoxDataInner;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

const_assert_eq!(
    std::mem::offset_of!(BoxDataInner, ride_legendary_bytes),
    MAX_BOX_COUNT as usize * BOX_SLOTS as usize * Pk9::BOX_SIZE
);

#[derive(Debug, Clone)]
pub(super) struct BoxLayout(swish_crypto::ArrayBlock);

impl BoxLayout {
    pub fn get_box_name(&self, box_index: BoxIndex) -> BoxName {
        let start = BOX_NAME_LENGTH * box_index.get() as usize;
        let end = start + BOX_NAME_LENGTH;
        let name_bytes: [u8; BOX_NAME_LENGTH] = self.0.bytes()[start..end]
            .try_into()
            .expect("end should be exactly BOX_NAME_LENGTH after start");

        let box_name = SizedUtf16String::from_bytes(name_bytes);
        if box_name.is_empty() {
            format!("Box {}", box_index.to_usize() + 1).into()
        } else {
            box_name
        }
    }

    fn into_block(self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            SvBlockKey::BoxLayout,
            swish_crypto::BlockData::Array(self.0),
        )
    }
}
