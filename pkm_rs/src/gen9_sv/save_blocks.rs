use std::collections::BTreeMap;

use crate::encryption::swish_crypto;
use crate::gen9_sv::{BOX_NAME_LENGTH, BOX_SLOTS, BoxIndex, BoxName, BoxSlot, Pk9};
use crate::result::{Error, Result};
use crate::traits::PkmBytes;

use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{BinaryGender, Language, read_u16_le};
use pkm_rs_types::{OriginGame, read_u32_le};

#[derive(Debug, Clone)]
pub(super) struct SvBlocks {
    pub(super) my_status: MyStatusBlock,
    pub(super) pokemon_boxes: BoxBlock,
    pub(super) box_layouts: BoxLayout,
    pub(super) other_blocks: Vec<swish_crypto::Block>,
}

impl SvBlocks {
    pub fn from_vec(blocks: impl IntoIterator<Item = swish_crypto::Block>) -> Result<Self> {
        let mut my_status: Option<MyStatusBlock> = None;
        let mut pokemon_boxes: Option<BoxBlock> = None;
        let mut box_layouts: Option<BoxLayout> = None;
        let mut other_blocks: Vec<swish_crypto::Block> = Vec::new();

        for block in blocks {
            match BlockKey::try_from(block.key()) {
                Some(BlockKey::MyStatus) => {
                    let block_data = block.into_object_data()?;
                    my_status = Some(MyStatusBlock(block_data));
                }
                Some(BlockKey::Box) => {
                    let block_data = block.into_object_data()?;
                    pokemon_boxes = Some(BoxBlock(block_data));
                }
                Some(BlockKey::BoxLayout) => {
                    let block_data = block.into_array_data()?;
                    box_layouts = Some(BoxLayout(block_data));
                }
                _ => {
                    other_blocks.push(block);
                }
            };
        }

        let Some(my_status) = my_status else {
            return Err(Error::build_save("missing MyStatus block", None));
        };

        let Some(pokemon_boxes) = pokemon_boxes else {
            return Err(Error::build_save("missing Boxes block", None));
        };

        let Some(box_layouts) = box_layouts else {
            return Err(Error::build_save("missing BoxLayouts block", None));
        };

        Ok(Self {
            my_status,
            pokemon_boxes,
            box_layouts,
            other_blocks,
        })
    }

    pub fn into_vec(self) -> Vec<swish_crypto::Block> {
        let Self {
            my_status,
            pokemon_boxes,
            box_layouts,
            other_blocks,
        } = self;

        // the game will read the file fine if the blocks aren't sorted, but PKHeX expects them to be in key order.
        // an iterator from a btree will preserve key order.
        let blocks_btree: BTreeMap<u32, swish_crypto::Block> = other_blocks
            .into_iter()
            .chain([
                my_status.into_block(),
                pokemon_boxes.into_block(),
                box_layouts.into_block(),
            ])
            .map(|block| (block.key(), block))
            .collect();

        blocks_btree.into_values().collect()
    }
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
enum BlockKey {
    TeamNames,
    TeamIndexes,
    BoxLayout,
    BoxWallpapers,

    Box,
    Party,
    Zukan,
    ZukanT1,
    MyStatus,
    PlayTime,

    CurrentBox,

    TeraRaidDlc,
    BlueberryPoints,

    CompassLevelcap,
}

impl BlockKey {
    pub const fn try_from(value: u32) -> Option<Self> {
        match value {
            0x1920c1e4 => Some(Self::TeamNames),
            0x33f39467 => Some(Self::TeamIndexes),
            0x19722c89 => Some(Self::BoxLayout),
            0x2eb1b190 => Some(Self::BoxWallpapers),

            0x0d66012c => Some(Self::Box),
            0x3aa1a9ad => Some(Self::Party),
            0x0deaaebd => Some(Self::Zukan),
            0xf5d7c0e2 => Some(Self::ZukanT1),
            0xe3e89bd1 => Some(Self::MyStatus),
            0xedaff794 => Some(Self::PlayTime),

            0x017c3cbb => Some(Self::CurrentBox),

            0x100b93da => Some(Self::TeraRaidDlc),
            0x66a33824 => Some(Self::BlueberryPoints),

            0xcc806ed6 => Some(Self::CompassLevelcap),
            _ => None,
        }
    }

    pub const fn to_u32(self) -> u32 {
        match self {
            Self::TeamNames => 0x1920c1e4,
            Self::TeamIndexes => 0x33f39467,
            Self::BoxLayout => 0x19722c89,
            Self::BoxWallpapers => 0x2eb1b190,

            Self::Box => 0x0d66012c,
            Self::Party => 0x3aa1a9ad,
            Self::Zukan => 0x0deaaebd,
            Self::ZukanT1 => 0xf5d7c0e2,
            Self::MyStatus => 0xe3e89bd1,
            Self::PlayTime => 0xedaff794,

            Self::CurrentBox => 0x017c3cbb,

            Self::TeraRaidDlc => 0x100b93da,
            Self::BlueberryPoints => 0x66a33824,

            Self::CompassLevelcap => 0xcc806ed6,
        }
    }
}

#[derive(Debug, Clone)]
pub(super) struct MyStatusBlock(swish_crypto::ObjectBlock);

impl MyStatusBlock {
    const NAME_OFFSET: usize = 0x10;
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
            BlockKey::MyStatus.to_u32(),
            swish_crypto::BlockData::Object(self.0.clone()),
        )
    }
}

#[derive(Debug, Clone)]
pub(super) struct BoxBlock(swish_crypto::ObjectBlock);

impl BoxBlock {
    const BOX_SIZE_BYTES: usize = Pk9::BOX_SIZE * (BOX_SLOTS as usize);

    pub const fn box_bytes_start(box_index: BoxIndex) -> usize {
        Self::BOX_SIZE_BYTES * box_index.get() as usize
    }

    pub const fn pokemon_bytes_start(box_index: BoxIndex, box_slot: BoxSlot) -> usize {
        let box_start = Self::box_bytes_start(box_index);
        box_start + Pk9::BOX_SIZE * box_slot.get() as usize
    }

    pub fn mon_bytes_at(&self, box_index: BoxIndex, box_slot: BoxSlot) -> &[u8] {
        let start = Self::pokemon_bytes_start(box_index, box_slot);
        &self.0.bytes()[start..start + Pk9::BOX_SIZE]
    }

    pub fn mon_bytes_at_mut(&mut self, box_index: BoxIndex, box_slot: BoxSlot) -> &mut [u8] {
        let start = Self::pokemon_bytes_start(box_index, box_slot);
        &mut self.0.bytes_mut()[start..start + Pk9::BOX_SIZE]
    }

    fn into_block(self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            BlockKey::Box.to_u32(),
            swish_crypto::BlockData::Object(self.0),
        )
    }
}

#[derive(Debug, Clone)]
pub(super) struct BoxLayout(swish_crypto::ArrayBlock);

impl BoxLayout {
    pub fn get_box_name(&self, box_index: BoxIndex) -> BoxName {
        let start = BOX_NAME_LENGTH * box_index.get() as usize;
        let end = start + BOX_NAME_LENGTH;
        let name_bytes: [u8; BOX_NAME_LENGTH] = self.0.bytes()[start..end]
            .try_into()
            .expect("end should be exactly BOX_NAME_LENGTH after start");

        SizedUtf16String::from_bytes(name_bytes)
    }

    fn into_block(self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            BlockKey::BoxLayout.to_u32(),
            swish_crypto::BlockData::Array(self.0),
        )
    }
}
