use super::Pk7;
use crate::encryption;
use crate::log;
use crate::result::{Error, Result};
use crate::traits::{PkmBytes, SaveData};
use crate::util;

use pkm_rs_types::BinaryGender;
use pkm_rs_types::OriginGame;
use pkm_rs_types::read_u16_le;
use pkm_rs_types::strings::SizedUtf16String;

use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use crate::encryption::MemeCrypto;

const SM_SIZE_BYTES: usize = 0x6be00;
const USUM_SIZE_BYTES: usize = 0x6cc00;

const SM_TRAINER_DATA_OFFSET: usize = 0x1200;
const USUM_TRAINER_DATA_OFFSET: usize = 0x1400;
const TRAINER_DATA_SIZE: usize = 0xc0;

const SM_BOX_DATA_OFFSET: usize = 0x04e00;
const USUM_BOX_DATA_OFFSET: usize = 0x05200;
const BOX_DATA_SIZE: usize = 0x36600;

const BOX_COUNT: usize = 32;
const BOX_ROWS: usize = 5;
const BOX_COLS: usize = 6;
const BOX_SLOTS: usize = BOX_ROWS * BOX_COLS;

#[cfg(feature = "wasm")]
const USUM_PC_CHECKSUM_OFFSET: usize = USUM_SIZE_BYTES - 0x200 + 0x14 + (14 * 8) + 6;
#[cfg(feature = "wasm")]
const SM_PC_CHECKSUM_OFFSET: usize = SM_SIZE_BYTES - 0x200 + 0x14 + (14 * 8) + 6;

const SINGLE_BOX_SIZE_BYTES: usize = BOX_SLOTS * Pk7::BOX_SIZE;

#[derive(Serialize, Debug)]
enum SaveType {
    SunMoon,
    UltraSunMoon,
}

impl SaveType {
    const fn file_size_bytes(&self) -> usize {
        match self {
            SaveType::SunMoon => SM_SIZE_BYTES,
            SaveType::UltraSunMoon => USUM_SIZE_BYTES,
        }
    }

    const fn trainer_data_offset(&self) -> usize {
        match self {
            SaveType::SunMoon => SM_TRAINER_DATA_OFFSET,
            SaveType::UltraSunMoon => USUM_TRAINER_DATA_OFFSET,
        }
    }

    const fn box_data_offset(&self) -> usize {
        match self {
            SaveType::SunMoon => SM_BOX_DATA_OFFSET,
            SaveType::UltraSunMoon => USUM_BOX_DATA_OFFSET,
        }
    }

    const fn pc_checksum_offset(&self) -> usize {
        match self {
            SaveType::SunMoon => SM_PC_CHECKSUM_OFFSET,
            SaveType::UltraSunMoon => USUM_PC_CHECKSUM_OFFSET,
        }
    }

    const fn meme_crypto(&self) -> MemeCrypto {
        match self {
            SaveType::SunMoon => MemeCrypto::SunMoon,
            SaveType::UltraSunMoon => MemeCrypto::UltraSunUltraMoon,
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = Gen7AlolaSaveRust))]
#[derive(Serialize, Debug)]
pub struct Gen7AlolaSave {
    save_type: SaveType,
    #[serde(skip_serializing)]
    bytes: Vec<u8>,
    size: usize,
}

impl Gen7AlolaSave {
    fn from_byte(bytes: &[u8], save_type: SaveType) -> Result<Self> {
        if bytes.len() < save_type.file_size_bytes() {
            Err(Error::buffer_size_with_source(
                "gen 7 alola save file",
                save_type.file_size_bytes(),
                bytes.len(),
            ))
        } else {
            Ok(Self {
                save_type,
                bytes: bytes.to_vec(),
                size: bytes.len(),
            })
        }
    }

    pub fn from_bytes_sunmoon(bytes: &[u8]) -> Result<Self> {
        Self::from_byte(bytes, SaveType::SunMoon)
    }

    pub fn from_bytes_ultra(bytes: &[u8]) -> Result<Self> {
        Self::from_byte(bytes, SaveType::UltraSunMoon)
    }

    #[cfg(feature = "wasm")]
    pub fn prepare_bytes_for_saving(&self) -> Vec<u8> {
        let mut bytes = self.bytes.clone();

        let pc_checksum_offset = self.save_type.pc_checksum_offset();
        bytes[pc_checksum_offset..pc_checksum_offset + 2]
            .copy_from_slice(&self.calc_checksum().to_le_bytes());
        self.save_type.meme_crypto().sign_in_place(&mut bytes);

        bytes
    }

    fn calculate_pc_checksum(&self) -> u16 {
        encryption::crc16_ccitt_invert(&self.bytes, self.save_type.box_data_offset(), BOX_DATA_SIZE)
    }

    fn get_trainer_data(&self) -> TrainerDataGen7Alola {
        let offset = self.save_type.trainer_data_offset();
        TrainerDataGen7Alola::from_bytes(
            &self.bytes[offset..offset + TRAINER_DATA_SIZE]
                .try_into()
                .unwrap(),
        )
    }
}

impl SaveData for Gen7AlolaSave {
    type PkmType = Pk7;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        match bytes.len() {
            ..SM_SIZE_BYTES => Err(Error::buffer_size_with_source(
                "gen 7 alola save file",
                SM_SIZE_BYTES,
                bytes.len(),
            )),
            SM_SIZE_BYTES..USUM_SIZE_BYTES => Self::from_bytes_sunmoon(bytes),
            USUM_SIZE_BYTES.. => Self::from_bytes_ultra(bytes),
        }
    }

    fn get_decrypted_mon_bytes(&self, box_num: usize, offset: usize) -> Vec<u8> {
        self.get_mon_bytes_decrypted(box_num, offset)
    }

    fn get_mon_at(&self, box_num: usize, offset: usize) -> Option<Pk7> {
        if box_num >= Self::box_count() || offset >= Self::box_slots() {
            return None;
        }

        let decrypted_bytes = self.get_decrypted_mon_bytes(box_num, offset);
        let national_dex = read_u16_le!(decrypted_bytes, 8);

        if national_dex > 0 {
            Pk7::from_bytes(&decrypted_bytes)
                .inspect_err(|err| log!("malformed pkm at box {box_num}, slot {offset}: {err}"))
                .ok()
        } else {
            None
        }
    }

    fn set_mon_at(&mut self, box_num: usize, offset: usize, mut mon: Option<Pk7>) {
        let mon_bytes = if let Some(mon) = &mut mon {
            mon.refresh_checksum();
            let bytes = mon.to_box_bytes();

            encryption::decrypt_pkm_bytes_gen_6_7(&encryption::shuffle_blocks_gen_6_7(&bytes))
        } else {
            Pk7::empty_box_slot_bytes(&self.get_trainer_data().trainer_name)
        };

        // write bytes to box slot
        let box_offset = self.save_type.box_data_offset() + box_num * SINGLE_BOX_SIZE_BYTES;
        let mon_offset = box_offset + offset * Pk7::BOX_SIZE;
        self.bytes[mon_offset..mon_offset + Pk7::BOX_SIZE].copy_from_slice(&mon_bytes);

        // refresh pc checksum
        let checksum_offset = self.save_type.pc_checksum_offset();
        let calculated_checksum = self.calculate_pc_checksum();
        self.bytes[checksum_offset..checksum_offset + 2]
            .copy_from_slice(&calculated_checksum.to_le_bytes());
    }

    fn convert_ohpkm(
        &self,
        ohpkm: crate::ohpkm::OhpkmV2,
        strategy: crate::convert_strategy::ConvertStrategy,
    ) -> Self::PkmType {
        use crate::ohpkm::OhpkmConvert;
        Pk7::from_ohpkm(&ohpkm, strategy)
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
        BOX_COUNT
    }

    fn max_box_count() -> usize {
        32
    }

    fn current_pc_box_idx(&self) -> usize {
        if self.bytes[0] >= 32 {
            0
        } else {
            self.bytes[0].into()
        }
    }

    fn is_save(bytes: &[u8]) -> bool {
        bytes.len() == SM_SIZE_BYTES || bytes.len() == USUM_SIZE_BYTES
    }

    fn display_tid(&self) -> String {
        let trainer_data = self.get_trainer_data();
        crate::util::six_digit_trainer_display(trainer_data.trainer_id, trainer_data.secret_id)
    }

    fn game_of_origin(&self) -> Option<OriginGame> {
        Some(OriginGame::from(self.get_trainer_data().game_code))
    }

    fn includes_origin(origin: OriginGame) -> bool {
        matches!(
            origin,
            OriginGame::Sun | OriginGame::Moon | OriginGame::UltraSun | OriginGame::UltraMoon
        )
    }
}

impl Gen7AlolaSave {
    fn get_mon_bytes_decrypted(&self, box_num: usize, offset: usize) -> Vec<u8> {
        let box_offset = self.save_type.box_data_offset() + BOX_SLOTS * Pk7::BOX_SIZE * box_num;
        let mon_offset = box_offset + offset * Pk7::BOX_SIZE;
        let decrypted_bytes = encryption::decrypt_pkm_bytes_gen_6_7(
            &self.bytes[mon_offset..mon_offset + Pk7::BOX_SIZE],
        );
        encryption::unshuffle_blocks_gen_6_7(&decrypted_bytes)
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl Gen7AlolaSave {
    #[wasm_bindgen(js_name = getMonAt)]
    pub fn get_mon_at_wasm(&self, box_num: usize, offset: usize) -> Option<Pk7> {
        self.get_mon_at(box_num, offset)
    }

    #[wasm_bindgen(js_name = setMonAt)]
    pub fn set_mon_at_wasm(&mut self, box_num: usize, offset: usize, mon: Option<Pk7>) {
        self.set_mon_at(box_num, offset, mon)
    }

    #[wasm_bindgen(js_name = convertOhpkm)]
    pub fn convert_ohpkm_wasm(
        &self,
        ohpkm: crate::ohpkm::OhpkmV2,
        strategy: crate::convert_strategy::ConvertStrategy,
    ) -> Pk7 {
        self.convert_ohpkm(ohpkm, strategy)
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Vec<u8>) -> Result<Self> {
        Self::from_bytes(&bytes)
    }

    #[wasm_bindgen]
    pub fn calc_checksum(&self) -> u16 {
        encryption::crc16_ccitt_invert(&self.bytes, self.save_type.box_data_offset(), BOX_DATA_SIZE)
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
        self.get_trainer_data().trainer_name.to_string()
    }

    #[wasm_bindgen(getter = trainerId)]
    pub fn trainer_id_wasm(&self) -> u16 {
        self.get_trainer_data().trainer_id
    }

    #[wasm_bindgen(getter = secretId)]
    pub fn secret_id_wasm(&self) -> u16 {
        self.get_trainer_data().secret_id
    }

    #[wasm_bindgen(getter = trainerGender)]
    pub fn trainer_gender_wasm(&self) -> u16 {
        self.get_trainer_data().trainer_gender as u16
    }

    #[wasm_bindgen(getter = MAX_BOX_COUNT)]
    pub fn max_box_count() -> usize {
        BOX_COUNT
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
        OriginGame::from(self.get_trainer_data().game_code)
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
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Default, Debug, Serialize, Clone, Copy)]
pub struct TrainerDataGen7Alola {
    pub trainer_id: u16,
    pub secret_id: u16,
    pub game_code: u8,
    pub trainer_gender: BinaryGender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub trainer_name: SizedUtf16String<26>,
}

impl TrainerDataGen7Alola {
    fn from_bytes(block_bytes: &[u8; TRAINER_DATA_SIZE]) -> Self {
        Self {
            trainer_id: read_u16_le!(block_bytes, 0),
            secret_id: read_u16_le!(block_bytes, 2),
            game_code: block_bytes[4],
            trainer_gender: BinaryGender::from(util::get_flag(block_bytes, 5, 0)),
            trainer_name: SizedUtf16String::from_bytes(block_bytes[56..82].try_into().unwrap()),
        }
    }

    // fn to_bytes(self) -> [u8; TRAINER_DATA_SIZE] {
    //     let mut bytes = [0u8; TRAINER_DATA_SIZE];
    //     bytes[0..2].copy_from_slice(&self.trainer_id.to_le_bytes());
    //     bytes[2..4].copy_from_slice(&self.secret_id.to_le_bytes());
    //     bytes[4] = self.game_code;
    //     util::set_flag(&mut bytes, 5, 0, self.trainer_gender);
    //     bytes[56..80].copy_from_slice(&self.trainer_name.bytes());
    //     bytes
    // }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl TrainerDataGen7Alola {
    #[wasm_bindgen]
    pub fn get_name_js(&self) -> String {
        self.trainer_name.to_string()
    }
}

#[cfg(feature = "wasm")]
#[cfg(test)]
mod tests {
    use std::path::Path;

    use crate::checksum::Checksum;
    use crate::gen7_alola::pk7_buffer::Pk7BufferRef;
    use crate::result::Result;
    use crate::tests::save_bytes_from_file;

    use super::*;

    #[test]
    fn test_sm_encryption() -> std::result::Result<(), Box<dyn std::error::Error>> {
        use crate::checksum::{ChecksumAlgorithm, ChecksumU16Le};

        let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
        let save = Gen7AlolaSave::from_bytes(&moon_bytes)?;
        assert_eq!(save.calc_checksum(), 0xb28d);

        let after_serialized_bytes = save.prepare_bytes_for_saving();
        let reserialized = Gen7AlolaSave::from_bytes(&after_serialized_bytes)?;
        assert_eq!(reserialized.calc_checksum(), 0xb28d);

        assert_eq!(
            ChecksumU16Le::calc_over_bytes(&after_serialized_bytes),
            0x3065
        );
        Ok(())
    }

    #[test]
    fn sm_save_calculate_checksum() -> Result<()> {
        let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
        let save = Gen7AlolaSave::from_bytes(&moon_bytes)?;

        assert_eq!(save.calc_checksum(), 0xb28d);
        Ok(())
    }

    #[test]
    fn usum_save_calculate_checksum() -> Result<()> {
        let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("ultrasun"))?;
        let save = Gen7AlolaSave::from_bytes(&moon_bytes)?;

        assert_eq!(save.calc_checksum(), 0x4d97);
        Ok(())
    }

    #[test]
    fn pkm_checksum_calculation_is_correct() -> Result<()> {
        let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
        let save = Gen7AlolaSave::from_bytes(&moon_bytes)?;

        for box_num in 0..Gen7AlolaSave::box_count() {
            for slot in 0..Gen7AlolaSave::box_slots() {
                let mon_bytes = save.get_mon_bytes_decrypted(box_num, slot);
                let buffer = Pk7BufferRef::box_span(&mon_bytes);
                if buffer.checksum() != buffer.calculate_checksum() {
                    return Err(Error::other(&format!(
                        "Invalid checksum for mon at box {box_num}, slot {slot}: expected {:#06x}, got {:#06x}",
                        buffer.calculate_checksum(),
                        buffer.checksum()
                    )));
                }
            }
        }
        Ok(())
    }
}
