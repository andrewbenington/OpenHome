use super::Pk8;
use crate::encryption::swish_crypto;
use crate::gen8_swsh::pk8_buffer::Pk8Buffer;
use crate::result::{Error, Result};
use crate::traits::{PkmBytes, SaveData};

use pkm_rs_types::{BinaryGender, Language, read_u16_le};
use pkm_rs_types::{OriginGame, read_u32_le};

use pkm_rs_types::strings::SizedUtf16String;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const SAVE_SIZE_BYTES_MIN: usize = 0x171500;
const SAVE_SIZE_BYTES_MAX: usize = 0x187800;

const MAX_BOX_COUNT: usize = 32;
const BOX_ROWS: usize = 5;
const BOX_COLS: usize = 6;
const BOX_SLOTS: usize = BOX_ROWS * BOX_COLS;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = SwordShieldSaveRust))]
#[derive(Debug)]
pub struct SwordShieldSave {
    bytes: Box<[u8]>,
    blocks: Blocks,
}

impl SwordShieldSave {
    pub fn from_bytes(bytes: Box<[u8]>) -> Result<Self> {
        if bytes.len() < SAVE_SIZE_BYTES_MIN {
            return Err(Error::buffer_size_with_source(
                "sword/shield save file min",
                SAVE_SIZE_BYTES_MIN,
                bytes.len(),
            ));
        } else if bytes.len() > SAVE_SIZE_BYTES_MAX {
            return Err(Error::buffer_size_with_source(
                "sword/shield save file max",
                SAVE_SIZE_BYTES_MAX,
                bytes.len(),
            ));
        }

        let blocks = Blocks::from_vec(swish_crypto::decrypt_blocks(&bytes)?)?;

        Ok(Self { bytes, blocks })
    }

    const fn my_status(&self) -> &MyStatusBlock {
        &self.blocks.my_status
    }

    const fn box_data(&self) -> &BoxBlock {
        &self.blocks.pokemon_boxes
    }

    const fn box_data_mut(&mut self) -> &mut BoxBlock {
        &mut self.blocks.pokemon_boxes
    }

    pub fn trainer_name(&self) -> SizedUtf16String<{ MyStatusBlock::NAME_BYTE_LENGTH }> {
        self.my_status().trainer_name()
    }

    pub fn trainer_id(&self) -> u16 {
        self.my_status().trainer_id()
    }

    pub fn secret_id(&self) -> u16 {
        self.my_status().secret_id()
    }

    fn language(&self) -> Language {
        self.my_status().language().unwrap_or_default()
    }

    fn copy_pokemon_bytes_to(&mut self, box_index: usize, box_slot: usize, data: &[u8]) {
        if let Some(box_bytes) = self.box_data_mut().mon_bytes_at_mut(box_index, box_slot) {
            box_bytes.copy_from_slice(data);
        }
    }

    fn get_mon_bytes_decrypted(&self, box_index: usize, box_slot: usize) -> Option<Box<[u8]>> {
        let pokemon_bytes = self.box_data().mon_bytes_at(box_index, box_slot)?;
        let mut copied_bytes = Box::from(pokemon_bytes);
        Pk8Buffer::new_mut(&mut copied_bytes).decrypt();

        Some(copied_bytes)
    }

    fn get_mon_at(&self, box_num: usize, box_slot: usize) -> Option<Pk8> {
        if box_num >= Self::box_count() || box_slot >= Self::box_slots() {
            return None;
        }

        let decrypted_bytes = self.get_mon_bytes_decrypted(box_num, box_slot)?;
        let national_dex = Pk8Buffer::new(&decrypted_bytes).species_ndex();

        if national_dex > 0 {
            Pk8::from_bytes(&decrypted_bytes)
                .inspect_err(|err| {
                    crate::log!("malformed pkm at box {box_num}, slot {box_slot}: {err}")
                })
                .ok()
        } else {
            None
        }
    }

    fn set_mon_at(&mut self, box_num: usize, box_slot: usize, mut mon: Option<Pk8>) {
        let mon_bytes = if let Some(mon) = &mut mon {
            mon.refresh_checksum();
            let mut bytes = mon.to_box_bytes();
            Pk8Buffer::new_mut(&mut bytes).decrypt();

            bytes
        } else {
            Pk8::empty_box_slot_bytes(&self.trainer_name().resize())
        };

        // write bytes to box slot
        self.copy_pokemon_bytes_to(box_num, box_slot, &mon_bytes);
    }

    #[cfg(feature = "wasm")]
    pub fn prepare_bytes_for_saving(&self) -> Vec<u8> {
        todo!()
    }
}

impl SaveData for SwordShieldSave {
    type PkmType = Pk8;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::from_bytes(bytes.to_owned().into_boxed_slice())
    }

    fn get_decrypted_mon_bytes(&self, _box_num: usize, _offset: usize) -> Vec<u8> {
        todo!()
    }

    fn get_mon_at(&self, box_index: usize, box_slot: usize) -> Option<Pk8> {
        let mon_bytes = self.box_data().mon_bytes_at(box_index, box_slot)?;
        Pk8::from_bytes(mon_bytes).ok()
    }

    fn set_mon_at(&mut self, box_index: usize, box_slot: usize, mon: Option<Pk8>) {
        match mon {
            Some(mut mon) => {
                mon.refresh_checksum();
                self.box_data_mut()
                    .mon_bytes_at_mut(box_index, box_slot)
                    .map(|bytes| bytes.copy_from_slice(&mon.to_box_bytes_encrypted()))
            }
            None => todo!(),
        };
    }

    fn convert_ohpkm(
        &self,
        ohpkm: crate::ohpkm::OhpkmV2,
        strategy: crate::convert_strategy::ConvertStrategy,
    ) -> Self::PkmType {
        use crate::ohpkm::OhpkmConvert;
        Pk8::from_ohpkm(&ohpkm, strategy)
    }

    fn box_rows() -> usize {
        BOX_ROWS
    }

    fn box_cols() -> usize {
        BOX_COLS
    }

    fn box_slots() -> usize {
        BOX_SLOTS
    }

    fn box_count() -> usize {
        MAX_BOX_COUNT
    }

    fn max_box_count() -> usize {
        MAX_BOX_COUNT
    }

    fn current_pc_box_idx(&self) -> usize {
        if self.bytes[0] as usize >= MAX_BOX_COUNT {
            0
        } else {
            self.bytes[0].into()
        }
    }

    fn is_save(bytes: &[u8]) -> bool {
        bytes.len() >= SAVE_SIZE_BYTES_MIN && bytes.len() <= SAVE_SIZE_BYTES_MAX
    }

    fn display_tid(&self) -> String {
        crate::util::six_digit_trainer_id_from_full(self.blocks.my_status.tid_sid_u32())
    }

    fn game_of_origin(&self) -> Option<OriginGame> {
        self.my_status().origin_game()
    }

    fn includes_origin(origin: OriginGame) -> bool {
        origin.is_swsh()
    }
}

#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen(js_class = SwordShieldSaveRust))]
#[allow(clippy::missing_const_for_fn)]
impl SwordShieldSave {
    #[wasm_bindgen(js_name = getMonAt)]
    pub fn get_mon_at_wasm(&self, box_num: usize, offset: usize) -> Option<Pk8> {
        self.get_mon_at(box_num, offset)
    }

    #[wasm_bindgen(js_name = setMonAt)]
    pub fn set_mon_at_wasm(&mut self, box_num: usize, offset: usize, mon: Option<Pk8>) {
        self.set_mon_at(box_num, offset, mon)
    }

    #[wasm_bindgen(js_name = convertOhpkm)]
    pub fn convert_ohpkm_wasm(
        &self,
        ohpkm: crate::ohpkm::OhpkmV2,
        strategy: crate::convert_strategy::ConvertStrategy,
    ) -> Pk8 {
        self.convert_ohpkm(ohpkm, strategy)
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Box<[u8]>) -> Result<Self> {
        Self::from_bytes(bytes)
    }

    #[wasm_bindgen]
    pub fn calc_checksum(&self) -> u16 {
        todo!()
    }

    #[wasm_bindgen(js_name = isValidSave)]
    pub fn is_valid_save_wasm(bytes: &[u8]) -> bool {
        Self::is_save(bytes)
    }

    #[wasm_bindgen(getter = displayId)]
    pub fn display_tid_wasm(&self) -> String {
        self.display_tid()
    }

    #[wasm_bindgen(getter = trainerName)]
    pub fn trainer_name_wasm(&self) -> String {
        self.trainer_name().to_string()
    }

    #[wasm_bindgen(getter = trainerId)]
    pub fn trainer_id_wasm(&self) -> u16 {
        self.trainer_id()
    }

    #[wasm_bindgen(getter = secretId)]
    pub fn secret_id_wasm(&self) -> u16 {
        self.secret_id()
    }

    #[wasm_bindgen(getter = trainerGender)]
    pub fn trainer_gender_wasm(&self) -> BinaryGender {
        self.my_status().trainer_gender()
    }

    #[wasm_bindgen(getter = MAX_BOX_COUNT)]
    pub fn max_box_count() -> usize {
        MAX_BOX_COUNT
    }

    #[wasm_bindgen(getter = BOX_ROWS)]
    pub fn box_rows() -> usize {
        BOX_ROWS
    }

    #[wasm_bindgen(getter = BOX_COLS)]
    pub fn box_cols() -> usize {
        BOX_COLS
    }

    #[wasm_bindgen(getter = SLOTS_PER_BOX)]
    pub fn box_size() -> usize {
        BOX_COLS * BOX_ROWS
    }

    #[wasm_bindgen(getter = currentPcBoxIdx)]
    pub fn current_pc_box_idx(&self) -> usize {
        SaveData::current_pc_box_idx(self)
    }

    #[wasm_bindgen(getter = gameOfOrigin)]
    pub fn game_of_origin_wasm(&self) -> OriginGame {
        self.game_of_origin().unwrap_or_default()
    }

    #[wasm_bindgen(getter = language)]
    pub fn language_wasm(&self) -> Language {
        self.language()
    }

    #[wasm_bindgen(js_name = includesOrigin)]
    pub fn includes_origin_wasm(origin: OriginGame) -> bool {
        Self::includes_origin(origin)
    }

    #[wasm_bindgen(js_name = fileIsSave)]
    pub fn file_is_save_wasm(bytes: &[u8]) -> bool {
        Self::is_save(bytes)
    }

    #[wasm_bindgen(js_name = prepareBytesForSaving)]
    pub fn prepare_bytes_for_saving_wasm(&self) -> Vec<u8> {
        self.prepare_bytes_for_saving()
    }

    #[wasm_bindgen(js_name = boxesBlock)]
    pub fn boxes_block_wasm(&self) -> swish_crypto::Block {
        self.box_data().clone().into_block()
    }
}

#[derive(Debug)]
struct Blocks {
    my_status: MyStatusBlock,
    pokemon_boxes: BoxBlock,
}

impl Blocks {
    fn from_vec(blocks: impl IntoIterator<Item = swish_crypto::Block>) -> Result<Self> {
        let mut my_status: Option<MyStatusBlock> = None;
        let mut pokemon_boxes: Option<BoxBlock> = None;

        for block in blocks {
            let Some(key) = BlockKey::try_from(block.key()) else {
                continue;
            };

            if key == BlockKey::MyStatus {
                let swish_crypto::BlockData::Object(object_block) = block.into_data() else {
                    return Err(Error::build_save(
                        "MyStatus should be an object block",
                        None,
                    ));
                };
                my_status = Some(MyStatusBlock(object_block));
            } else if key == BlockKey::Box {
                let swish_crypto::BlockData::Object(object_block) = block.into_data() else {
                    return Err(Error::build_save("Boxes should be an object block", None));
                };
                pokemon_boxes = Some(BoxBlock(object_block));
            }
        }

        let Some(my_status) = my_status else {
            return Err(Error::build_save("missing MyStatus block", None));
        };

        let Some(pokemon_boxes) = pokemon_boxes else {
            return Err(Error::build_save("missing Boxes block", None));
        };

        Ok(Self {
            my_status,
            pokemon_boxes,
        })
    }
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
enum BlockKey {
    MyStatus,
    TeamNames,
    TeamIndexes,
    BoxLayout,
    BoxWallpapers,
    MenuButtons,

    Box,
    MysteryGift,
    Item,
    Coordinates,
    Misc,
    Party,
    Daycare,
    Record,
    Zukan,
    ZukanR1,
    ZukanR2,
    PokedexRecommendation,
    CurryDex,
    TrainerCard,
    PlayTime,

    CurrentBox,
    BoxesUnlocked,
}

impl BlockKey {
    const fn try_from(value: u32) -> Option<Self> {
        match value {
            0xf25c070e => Some(Self::MyStatus),
            0x1920c1e4 => Some(Self::TeamNames),
            0x33f39467 => Some(Self::TeamIndexes),
            0x19722c89 => Some(Self::BoxLayout),
            0x2eb1b190 => Some(Self::BoxWallpapers),
            0xb1dddca8 => Some(Self::MenuButtons),

            0x0d66012c => Some(Self::Box),
            0x112d5141 => Some(Self::MysteryGift),
            0x1177c2c4 => Some(Self::Item),
            0x16aaa7fa => Some(Self::Coordinates),
            0x1b882b09 => Some(Self::Misc),
            0x2985fe5d => Some(Self::Party),
            0x2d6fba6a => Some(Self::Daycare),
            0x37da95a3 => Some(Self::Record),
            0x4716c404 => Some(Self::Zukan),
            0x3f936ba9 => Some(Self::ZukanR1),
            0x3c9366f0 => Some(Self::ZukanR2),
            0xc3fb9e77 => Some(Self::PokedexRecommendation),
            0x6eb72940 => Some(Self::CurryDex),
            0x874da6fa => Some(Self::TrainerCard),
            0x8cbbfd90 => Some(Self::PlayTime),

            0x017c3cbb => Some(Self::CurrentBox),
            0x71825204 => Some(Self::BoxesUnlocked),

            _ => None,
        }
    }

    const fn to_u32(self) -> u32 {
        match self {
            Self::MyStatus => 0xf25c070e,
            Self::TeamNames => 0x1920c1e4,
            Self::TeamIndexes => 0x33f39467,
            Self::BoxLayout => 0x19722c89,
            Self::BoxWallpapers => 0x2eb1b190,
            Self::MenuButtons => 0xb1dddca8,

            Self::Box => 0x0d66012c,
            Self::MysteryGift => 0x112d5141,
            Self::Item => 0x1177c2c4,
            Self::Coordinates => 0x16aaa7fa,
            Self::Misc => 0x1b882b09,
            Self::Party => 0x2985fe5d,
            Self::Daycare => 0x2d6fba6a,
            Self::Record => 0x37da95a3,
            Self::Zukan => 0x4716c404,
            Self::ZukanR1 => 0x3f936ba9,
            Self::ZukanR2 => 0x3c9366f0,
            Self::PokedexRecommendation => 0xc3fb9e77,
            Self::CurryDex => 0x6eb72940,
            Self::TrainerCard => 0x874da6fa,
            Self::PlayTime => 0x8cbbfd90,

            Self::CurrentBox => 0x017c3cbb,
            Self::BoxesUnlocked => 0x71825204,
        }
    }
}

#[derive(Debug)]
struct MyStatusBlock(swish_crypto::ObjectBlock);

impl MyStatusBlock {
    const NAME_OFFSET: usize = 0xb0;
    const NAME_BYTE_LENGTH: usize = 24;

    const TID_OFFSET: usize = 0xa0;
    const SID_OFFSET: usize = 0xa2;
    const LANGUAGE_OFFSET: usize = 0xa7;
    const ORIGIN_OFFSET: usize = 0xa4;
    const GENDER_OFFSET: usize = 0xa5;

    const BUFFER_ERROR: &'static str = "MyStatusBlock buffer is not the correct size";

    fn trainer_name(&self) -> SizedUtf16String<{ MyStatusBlock::NAME_BYTE_LENGTH }> {
        SizedUtf16String::from_bytes(
            self.0.bytes()[Self::NAME_OFFSET..Self::NAME_OFFSET + Self::NAME_BYTE_LENGTH]
                .try_into()
                .expect(Self::BUFFER_ERROR),
        )
    }

    fn trainer_id(&self) -> u16 {
        read_u16_le!(self.0.bytes(), Self::TID_OFFSET)
    }

    fn secret_id(&self) -> u16 {
        read_u16_le!(self.0.bytes(), Self::SID_OFFSET)
    }

    fn tid_sid_u32(&self) -> u32 {
        read_u32_le!(self.0.bytes(), Self::TID_OFFSET)
    }

    fn language(&self) -> Result<Language> {
        let language_byte = self.0.bytes()[Self::LANGUAGE_OFFSET];
        Ok(Language::try_from(language_byte)?)
    }

    fn origin_game(&self) -> Option<OriginGame> {
        let origin_game_raw = self.0.bytes()[Self::ORIGIN_OFFSET];
        OriginGame::try_from_u8(origin_game_raw)
    }

    fn trainer_gender(&self) -> BinaryGender {
        let gender_raw = self.0.bytes()[Self::GENDER_OFFSET] & 1;
        BinaryGender::from(gender_raw == 1)
    }

    fn into_block(self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            BlockKey::MyStatus.to_u32(),
            swish_crypto::BlockData::Object(self.0),
        )
    }
}

#[derive(Debug, Clone)]
struct BoxBlock(swish_crypto::ObjectBlock);

impl BoxBlock {
    const BOX_SIZE_BYTES: usize = Pk8::BOX_SIZE * BOX_SLOTS;

    const fn box_bytes_start(box_index: usize) -> Option<usize> {
        match box_index {
            ..MAX_BOX_COUNT => Some(Self::BOX_SIZE_BYTES * box_index),
            _ => None,
        }
    }

    const fn pokemon_bytes_start(box_index: usize, box_slot: usize) -> Option<usize> {
        let Some(box_start) = Self::box_bytes_start(box_index) else {
            return None;
        };
        match box_slot {
            ..BOX_SLOTS => Some(box_start + Pk8::BOX_SIZE * box_slot),
            _ => None,
        }
    }

    fn mon_bytes_at(&self, box_index: usize, box_slot: usize) -> Option<&[u8]> {
        Self::pokemon_bytes_start(box_index, box_slot)
            .map(|start| &self.0.bytes()[start..start + Pk8::BOX_SIZE])
    }

    fn mon_bytes_at_mut(&mut self, box_index: usize, box_slot: usize) -> Option<&mut [u8]> {
        let start = Self::pokemon_bytes_start(box_index, box_slot)?;
        Some(&mut self.0.bytes_mut()[start..start + Pk8::BOX_SIZE])
    }

    fn into_block(self) -> swish_crypto::Block {
        swish_crypto::Block::new(
            BlockKey::Box.to_u32(),
            swish_crypto::BlockData::Object(self.0),
        )
    }
}

// #[cfg(feature = "wasm")]
// #[cfg(test)]
// mod tests {
//     use std::path::Path;

//     use crate::checksum::Checksum;
//     use crate::gen8_swsh::pk8_buffer::Pk8Buffer;
//     use crate::result::Result;
//     use crate::tests::save_bytes_from_file;

//     use super::*;

// #[test]
// fn test_sm_encryption() -> std::result::Result<(), Box<dyn std::error::Error>> {
//     use crate::checksum::{ChecksumAlgorithm, ChecksumU16Le};

//     let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
//     let save = SwordShieldSave::from_bytes(&moon_bytes)?;
//     assert_eq!(save.calc_checksum(), 0xb28d);

//     let after_serialized_bytes = save.prepare_bytes_for_saving();
//     let reserialized = Gen7AlolaSave::from_bytes(&after_serialized_bytes)?;
//     assert_eq!(reserialized.calc_checksum(), 0xb28d);

//     assert_eq!(
//         ChecksumU16Le::calc_over_bytes(&after_serialized_bytes),
//         0x3065
//     );
//     Ok(())
// }

// #[test]
// fn sm_save_calculate_checksum() -> Result<()> {
//     let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
//     let save = Gen7AlolaSave::from_bytes(&moon_bytes)?;

//     assert_eq!(save.calc_checksum(), 0xb28d);
//     Ok(())
// }

// #[test]
// fn usum_save_calculate_checksum() -> Result<()> {
//     let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("ultrasun"))?;
//     let save = Gen7AlolaSave::from_bytes(&moon_bytes)?;

//     assert_eq!(save.calc_checksum(), 0x4d97);
//     Ok(())
// }

// #[test]
// fn pkm_checksum_calculation_is_correct() -> Result<()> {
//     let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
//     let save = Gen7AlolaSave::from_bytes(&moon_bytes)?;

//     for box_num in 0..Gen7AlolaSave::box_count() {
//         for slot in 0..Gen7AlolaSave::box_slots() {
//             let mon_bytes = save.get_mon_bytes_decrypted(box_num, slot);
//             let buffer = Pk8BufferRef::box_span(&mon_bytes);
//             if buffer.checksum() != buffer.calculate_checksum() {
//                 return Err(Error::other(&format!(
//                     "Invalid checksum for mon at box {box_num}, slot {slot}: expected {:#06x}, got {:#06x}",
//                     buffer.calculate_checksum(),
//                     buffer.checksum()
//                 )));
//             }
//         }
//     }
//     Ok(())
// }
// }
