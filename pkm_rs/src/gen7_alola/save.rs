use pkm_rs_types::Gender;
use pkm_rs_types::OriginGame;
use pkm_rs_types::read_u16_le;
use pkm_rs_types::strings::SizedUtf16String;

use serde::Serialize;

use super::Pk7;
use crate::encryption::{
    Crc16CcittInvertChecksum, crc16_ccitt_invert, decrypt_pkm_bytes_gen_6_7,
    unshuffle_blocks_gen_6_7,
};
use crate::result::Result;
use crate::traits::PkmBytes;
use crate::traits::SaveData;
use crate::util;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const SM_TRAINER_DATA_OFFSET: usize = 0x1200;
const TRAINER_DATA_SIZE: usize = 0xc0;
const SM_BOX_DATA_OFFSET: usize = 0x04e00;
const BOX_DATA_SIZE: usize = 0x36600;

const BOX_COUNT: usize = 32;
const BOX_ROWS: usize = 6;
const BOX_COLS: usize = 5;
const BOX_SLOTS: usize = BOX_ROWS * BOX_COLS;

const SM_SIZE_BYTES: usize = 0x6be00;

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
}

impl SaveData for SunMoonSave {
    type PkmType = Pk7;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::from_bytes(bytes)
    }

    fn get_decrypted_mon_bytes(&self, box_num: usize, offset: usize) -> Result<Vec<u8>> {
        let decrypted_bytes = decrypt_pkm_bytes_gen_6_7(&self.get_mon_bytes(box_num, offset))?;
        unshuffle_blocks_gen_6_7(&decrypted_bytes)
    }

    fn get_mon_at(&self, box_num: usize, offset: usize) -> Result<Option<Pk7>> {
        let decrypted_bytes = self.get_decrypted_mon_bytes(box_num, offset)?;
        let national_dex = read_u16_le!(decrypted_bytes, 8);

        if national_dex == 0 {
            return Ok(None);
        }

        Ok(Some(Pk7::from_bytes(&decrypted_bytes)?))
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

impl Crc16CcittInvertChecksum for SunMoonSave {
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
    pub fn get_mon_at_js(&self, box_num: usize, offset: usize) -> Result<Option<Pk7>> {
        self.get_mon_at(box_num, offset)
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Vec<u8>) -> Result<Self> {
        Self::from_bytes(&bytes)
    }

    #[wasm_bindgen]
    pub fn calc_checksum(&self) -> u16 {
        crc16_ccitt_invert(&self.bytes, SM_BOX_DATA_OFFSET, BOX_DATA_SIZE)
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
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Default, Debug, Serialize, Clone, Copy)]
pub struct TrainerDataGen7Alola {
    pub trainer_id: u16,
    pub secret_id: u16,
    pub game_code: u8,
    pub trainer_gender: Gender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub trainer_name: SizedUtf16String<24>,
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
}

impl SaveData for UltraSunMoonSave {
    type PkmType = Pk7;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::from_bytes(bytes)
    }

    fn get_decrypted_mon_bytes(&self, box_num: usize, offset: usize) -> Result<Vec<u8>> {
        let decrypted_bytes = decrypt_pkm_bytes_gen_6_7(&self.get_mon_bytes(box_num, offset))?;
        unshuffle_blocks_gen_6_7(&decrypted_bytes)
    }

    fn get_mon_at(&self, box_num: usize, offset: usize) -> Result<Option<Pk7>> {
        let decrypted_bytes = self.get_decrypted_mon_bytes(box_num, offset)?;
        let national_dex = read_u16_le!(decrypted_bytes, 8);
        if national_dex == 0 {
            return Ok(None);
        }

        Some(Pk7::from_bytes(
            &self.get_decrypted_mon_bytes(box_num, offset)?,
        ))
        .transpose()
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

impl Crc16CcittInvertChecksum for UltraSunMoonSave {
    const RANGE_START: usize = USUM_BOX_DATA_OFFSET;
    const RANGE_SIZE: usize = BOX_DATA_SIZE;

    fn get_bytes(&self) -> &[u8] {
        &self.bytes
    }
}

impl TrainerDataGen7Alola {
    fn from_bytes(block_bytes: &[u8; TRAINER_DATA_SIZE]) -> Self {
        Self {
            trainer_id: read_u16_le!(block_bytes, 0),
            secret_id: read_u16_le!(block_bytes, 2),
            game_code: block_bytes[4],
            trainer_gender: Gender::from(util::get_flag(block_bytes, 5, 0)),
            trainer_name: SizedUtf16String::from_bytes(block_bytes[56..80].try_into().unwrap()),
        }
    }
}
