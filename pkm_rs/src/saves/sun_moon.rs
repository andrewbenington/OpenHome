use serde::Serialize;

use crate::encryption::crc16_ccitt_invert;
use crate::encryption::decrypt_pkm_bytes_gen_6_7;
use crate::encryption::unshuffle_blocks_gen_6_7;
use crate::pkm::Pk7;
use crate::pkm::PkmResult;
use crate::substructures::Gender;
use crate::util::get_flag;

use super::SaveDataTrait;
use crate::pkm::Pkm;
use crate::strings::SizedUtf16String;

const TRAINER_DATA_OFFSET: usize = 0x1200;
const TRAINER_DATA_SIZE: usize = 0xc0;
const BOX_DATA_OFFSET: usize = 0x04e00;
const BOX_DATA_SIZE: usize = 0x36600;
// const BOX_CHECKSUM_OFFSET: usize = 0x75fda;
const BOX_ROWS: usize = 6;
const BOX_COLS: usize = 5;
const BOX_SLOTS: usize = BOX_ROWS * BOX_COLS;

const SAVE_FILE_SIZE: usize = 0x6be00;

#[derive(Serialize)]
pub struct SunMoonSave {
    #[serde(skip_serializing)]
    bytes: Vec<u8>,
    size: usize,
    pub trainer: TrainerData,
}

impl SaveDataTrait for SunMoonSave {
    type PkmType = Pk7;

    fn from_bytes(bytes: Vec<u8>) -> Result<Self, String> {
        let size = bytes.len();
        let my_status = TrainerData::from_bytes(&bytes);
        Ok(Self {
            bytes,
            size,
            trainer: my_status,
        })
    }

    fn get_mon_bytes_at(&self, box_num: usize, offset: usize) -> PkmResult<Vec<u8>> {
        let decrypted_bytes = decrypt_pkm_bytes_gen_6_7(&self.get_mon_bytes(box_num, offset))?;
        unshuffle_blocks_gen_6_7(&decrypted_bytes)
    }

    fn get_mon_at(&self, box_num: usize, offset: usize) -> PkmResult<Pk7> {
        Pk7::from_bytes(&self.get_mon_bytes_at(box_num, offset)?)
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

    fn calc_checksum(&self) -> u16 {
        crc16_ccitt_invert(&self.bytes, BOX_DATA_OFFSET, BOX_DATA_SIZE)
    }

    fn is_valid_save(bytes: &[u8]) -> bool {
        bytes.len() == SAVE_FILE_SIZE
    }
}

impl SunMoonSave {
    fn get_mon_bytes(&self, box_num: usize, offset: usize) -> Vec<u8> {
        let box_offset = BOX_DATA_OFFSET + BOX_SLOTS * Pk7::box_size() * box_num;
        let mon_offset = box_offset + offset * Pk7::box_size();
        self.bytes[mon_offset..mon_offset + Pk7::box_size()].to_vec()
    }
}

#[derive(Default, Debug, Serialize)]
pub struct TrainerData {
    pub trainer_id: u16,
    pub secret_id: u16,
    pub game_code: u8,
    pub trainer_gender: Gender,
    pub trainer_name: SizedUtf16String<24>,
}

impl TrainerData {
    fn from_bytes(bytes: &[u8]) -> Self {
        let block_bytes = &bytes[TRAINER_DATA_OFFSET..TRAINER_DATA_OFFSET + TRAINER_DATA_SIZE];
        Self {
            trainer_id: u16::from_le_bytes(block_bytes[0..2].try_into().unwrap()),
            secret_id: u16::from_le_bytes(block_bytes[2..4].try_into().unwrap()),
            game_code: block_bytes[4],
            trainer_gender: Gender::from(get_flag(block_bytes, 5, 0)),
            trainer_name: SizedUtf16String::from_bytes(block_bytes[56..80].try_into().unwrap()),
        }
    }
}
