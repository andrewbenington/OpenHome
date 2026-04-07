use crate::log;
use pkm_rs_types::BinaryGender;
use pkm_rs_types::OriginGame;
use pkm_rs_types::read_u16_le;
use pkm_rs_types::strings::SizedUtf16String;

use serde::Serialize;

use super::Pk7;
use crate::encryption;
use crate::result::Result;
use crate::traits::PkmBytes;
use crate::traits::SaveData;
use crate::util;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use crate::encryption::MemeCrypto;

const SM_TRAINER_DATA_OFFSET: usize = 0x1200;
const TRAINER_DATA_SIZE: usize = 0xc0;
const SM_BOX_DATA_OFFSET: usize = 0x04e00;

const BOX_DATA_SIZE: usize = 0x36600;

const BOX_COUNT: usize = 32;
const BOX_ROWS: usize = 6;
const BOX_COLS: usize = 5;
const BOX_SLOTS: usize = BOX_ROWS * BOX_COLS;

const SINGLE_BOX_SIZE_BYTES: usize = BOX_SLOTS * Pk7::BOX_SIZE;

const SM_SIZE_BYTES: usize = 0x6be00;

#[cfg(feature = "wasm")]
const SM_PC_CHECKSUM_OFFSET: usize = SM_SIZE_BYTES - 0x200 + 0x14 + (14 * 8) + 6;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Serialize, Debug)]
pub struct SunMoonSave {
    #[serde(skip_serializing)]
    bytes: Vec<u8>,
    size: usize,
    pub trainer: TrainerDataGen7Alola,
}

impl SunMoonSave {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        let my_status = TrainerDataGen7Alola::from_bytes(
            &bytes[SM_TRAINER_DATA_OFFSET..SM_TRAINER_DATA_OFFSET + TRAINER_DATA_SIZE]
                .try_into()
                .unwrap(),
        );
        Ok(Self {
            bytes: bytes.to_vec(),
            size,
            trainer: my_status,
        })
    }

    #[cfg(feature = "wasm")]
    pub fn prepare_bytes_for_saving(&self) -> Vec<u8> {
        let mut bytes = self.bytes.clone();
        // let trainer_bytes = self.trainer.to_bytes();
        // bytes[SM_TRAINER_DATA_OFFSET..SM_TRAINER_DATA_OFFSET + TRAINER_DATA_SIZE]
        //     .copy_from_slice(&trainer_bytes);

        bytes[SM_PC_CHECKSUM_OFFSET..SM_PC_CHECKSUM_OFFSET + 2]
            .copy_from_slice(&self.calc_checksum().to_le_bytes());
        MemeCrypto::SunMoon.sign_in_place(&mut bytes);

        bytes
    }

    fn calculate_pc_checksum(&self) -> u16 {
        encryption::crc16_ccitt_invert(&self.bytes, SM_BOX_DATA_OFFSET, BOX_DATA_SIZE)
    }
}

impl SaveData for SunMoonSave {
    type PkmType = Pk7;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::from_bytes(bytes)
    }

    fn get_decrypted_mon_bytes(&self, box_num: usize, offset: usize) -> Vec<u8> {
        let decrypted_bytes =
            encryption::decrypt_pkm_bytes_gen_6_7(&self.get_mon_bytes(box_num, offset));
        encryption::unshuffle_blocks_gen_6_7(&decrypted_bytes)
    }

    fn get_mon_at(&self, box_num: usize, offset: usize) -> Option<Pk7> {
        if box_num >= Self::box_count() || offset >= Self::box_slots() {
            return None;
        }

        let decrypted_bytes = self.get_decrypted_mon_bytes(box_num, offset);
        let national_dex = read_u16_le!(decrypted_bytes, 8);

        if national_dex > 0 {
            Pk7::from_bytes(&decrypted_bytes)
                .inspect_err(|err| log!("malformed pkm at bot {box_num}, slot {offset}: {err}"))
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
            vec![0u8; Pk7::BOX_SIZE]
        };

        // write bytes to box slot
        let box_offset = SM_BOX_DATA_OFFSET + box_num * SINGLE_BOX_SIZE_BYTES;
        let mon_offset = box_offset + offset * Pk7::BOX_SIZE;
        self.bytes[mon_offset..mon_offset + Pk7::BOX_SIZE].copy_from_slice(&mon_bytes);

        // refresh pc checksum
        let calculated_checksum = self.calculate_pc_checksum();
        self.bytes[SM_PC_CHECKSUM_OFFSET..SM_PC_CHECKSUM_OFFSET + 2]
            .copy_from_slice(&calculated_checksum.to_le_bytes());
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

    fn current_pc_box_idx(&self) -> usize {
        if self.bytes[0] >= 32 {
            0
        } else {
            self.bytes[0].into()
        }
    }

    fn is_valid_save(bytes: &[u8]) -> bool {
        bytes.len() == SM_SIZE_BYTES
    }

    fn display_tid(&self) -> String {
        crate::save::six_digit_trainer_display(self.trainer.trainer_id, self.trainer.secret_id)
    }

    fn game_of_origin(&self) -> Option<OriginGame> {
        Some(OriginGame::from(self.trainer.game_code))
    }
}

impl SunMoonSave {
    fn get_mon_bytes(&self, box_num: usize, offset: usize) -> Vec<u8> {
        let box_offset = SM_BOX_DATA_OFFSET + BOX_SLOTS * Pk7::BOX_SIZE * box_num;
        let mon_offset = box_offset + offset * Pk7::BOX_SIZE;
        self.bytes[mon_offset..mon_offset + Pk7::BOX_SIZE].to_vec()
    }
}

#[cfg(feature = "wasm")]
impl encryption::Crc16CcittInvertChecksum for SunMoonSave {
    const RANGE_START: usize = SM_BOX_DATA_OFFSET;
    const RANGE_SIZE: usize = BOX_DATA_SIZE;

    fn get_bytes(&self) -> &[u8] {
        &self.bytes
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl SunMoonSave {
    #[wasm_bindgen(js_name = getMonAt)]
    pub fn get_mon_at_js(&self, box_num: usize, offset: usize) -> Option<Pk7> {
        self.get_mon_at(box_num, offset)
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Vec<u8>) -> Result<Self> {
        Self::from_bytes(&bytes)
    }

    #[wasm_bindgen]
    pub fn calc_checksum(&self) -> u16 {
        encryption::crc16_ccitt_invert(&self.bytes, SM_BOX_DATA_OFFSET, BOX_DATA_SIZE)
    }

    #[wasm_bindgen]
    pub fn is_valid_save(bytes: &[u8]) -> bool {
        bytes.len() == SM_SIZE_BYTES
    }

    #[wasm_bindgen]
    pub fn display_tid(&self) -> String {
        crate::save::six_digit_trainer_display(self.trainer.trainer_id, self.trainer.secret_id)
    }

    #[wasm_bindgen]
    pub fn box_count() -> usize {
        BOX_COUNT
    }

    #[wasm_bindgen]
    pub fn box_cols() -> usize {
        BOX_COLS
    }

    #[wasm_bindgen]
    pub fn box_size() -> usize {
        BOX_COLS * BOX_ROWS
    }

    #[wasm_bindgen]
    pub fn current_pc_box_idx(&self) -> usize {
        SaveData::current_pc_box_idx(self)
    }

    #[wasm_bindgen]
    pub fn game_of_origin(&self) -> OriginGame {
        OriginGame::from(self.trainer.game_code)
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
    pub trainer_name: SizedUtf16String<24>,
}

impl TrainerDataGen7Alola {
    fn from_bytes(block_bytes: &[u8; TRAINER_DATA_SIZE]) -> Self {
        Self {
            trainer_id: read_u16_le!(block_bytes, 0),
            secret_id: read_u16_le!(block_bytes, 2),
            game_code: block_bytes[4],
            trainer_gender: BinaryGender::from(util::get_flag(block_bytes, 5, 0)),
            trainer_name: SizedUtf16String::from_bytes(block_bytes[56..80].try_into().unwrap()),
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

const USUM_SIZE_BYTES: usize = 0x6cc00;
const USUM_TRAINER_DATA_OFFSET: usize = 0x1400;
const USUM_BOX_DATA_OFFSET: usize = 0x05200;

const USUM_PC_CHECKSUM_OFFSET: usize = USUM_SIZE_BYTES - 0x200 + 0x14 + (14 * 8) + 6;

#[derive(Serialize, Debug)]
pub struct UltraSunMoonSave {
    #[serde(skip_serializing)]
    bytes: Vec<u8>,
    size: usize,
    pub trainer: TrainerDataGen7Alola,
}

impl UltraSunMoonSave {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        let my_status = TrainerDataGen7Alola::from_bytes(
            &bytes[USUM_TRAINER_DATA_OFFSET..USUM_TRAINER_DATA_OFFSET + TRAINER_DATA_SIZE]
                .try_into()
                .unwrap(),
        );
        Ok(Self {
            bytes: bytes.to_vec(),
            size,
            trainer: my_status,
        })
    }

    fn calculate_pc_checksum(&self) -> u16 {
        encryption::crc16_ccitt_invert(&self.bytes, USUM_BOX_DATA_OFFSET, BOX_DATA_SIZE)
    }
}

impl SaveData for UltraSunMoonSave {
    type PkmType = Pk7;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::from_bytes(bytes)
    }

    fn get_decrypted_mon_bytes(&self, box_num: usize, offset: usize) -> Vec<u8> {
        let decrypted_bytes =
            encryption::decrypt_pkm_bytes_gen_6_7(&self.get_mon_bytes(box_num, offset));
        encryption::unshuffle_blocks_gen_6_7(&decrypted_bytes)
    }

    fn get_mon_at(&self, box_num: usize, offset: usize) -> Option<Pk7> {
        let decrypted_bytes = self.get_decrypted_mon_bytes(box_num, offset);
        let national_dex = read_u16_le!(decrypted_bytes, 8);
        if national_dex == 0 {
            return None;
        }

        if national_dex > 0 {
            Pk7::from_bytes(&decrypted_bytes)
                .inspect_err(|err| log!("malformed pkm at bot {box_num}, slot {offset}: {err}"))
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
            vec![0u8; Pk7::BOX_SIZE]
        };

        // write bytes to box slot
        let box_offset = USUM_BOX_DATA_OFFSET + box_num * SINGLE_BOX_SIZE_BYTES;
        let mon_offset = box_offset + offset * Pk7::BOX_SIZE;
        self.bytes[mon_offset..mon_offset + Pk7::BOX_SIZE].copy_from_slice(&mon_bytes);

        // refresh pc checksum
        let calculated_checksum = self.calculate_pc_checksum();
        self.bytes[USUM_PC_CHECKSUM_OFFSET..USUM_PC_CHECKSUM_OFFSET + 2]
            .copy_from_slice(&calculated_checksum.to_le_bytes());
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

    fn current_pc_box_idx(&self) -> usize {
        if self.bytes[0] >= 32 {
            0
        } else {
            self.bytes[0].into()
        }
    }

    fn is_valid_save(bytes: &[u8]) -> bool {
        bytes.len() == USUM_SIZE_BYTES
    }

    fn display_tid(&self) -> String {
        util::six_digit_trainer_display(self.trainer.trainer_id, self.trainer.secret_id)
    }

    fn game_of_origin(&self) -> Option<OriginGame> {
        Some(OriginGame::from(self.trainer.game_code))
    }
}

impl UltraSunMoonSave {
    fn get_mon_bytes(&self, box_num: usize, offset: usize) -> Vec<u8> {
        let box_offset = USUM_BOX_DATA_OFFSET + BOX_SLOTS * Pk7::BOX_SIZE * box_num;
        let mon_offset = box_offset + offset * Pk7::BOX_SIZE;
        self.bytes[mon_offset..mon_offset + Pk7::BOX_SIZE].to_vec()
    }
}

#[cfg(feature = "wasm")]
impl encryption::Crc16CcittInvertChecksum for UltraSunMoonSave {
    const RANGE_START: usize = USUM_BOX_DATA_OFFSET;
    const RANGE_SIZE: usize = BOX_DATA_SIZE;

    fn get_bytes(&self) -> &[u8] {
        &self.bytes
    }
}

#[cfg(feature = "wasm")]
#[cfg(test)]
mod tests {
    use std::path::Path;

    use crate::result::Result;
    use crate::tests::save_bytes_from_file;

    use super::*;

    #[test]
    fn test_sm_encryption() -> std::result::Result<(), Box<dyn std::error::Error>> {
        use crate::checksum::{ChecksumAlgorithm, ChecksumU16Le};

        let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
        let save = SunMoonSave::from_bytes(&moon_bytes)?;
        assert_eq!(save.calc_checksum(), 0xb28d);

        let after_serialized_bytes = save.prepare_bytes_for_saving();
        let reserialized = SunMoonSave::from_bytes(&after_serialized_bytes)?;
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
        let save = SunMoonSave::from_bytes(&moon_bytes)?;

        assert_eq!(save.calc_checksum(), 0xb28d);
        Ok(())
    }
}
