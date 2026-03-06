use super::Pb7;
use crate::encryption::decrypt_pkm_bytes_gen_6_7;
use crate::encryption::unshuffle_blocks_gen_6_7;
use crate::result::Result;
use crate::traits::PkmBytes;
use crate::traits::SaveData;
use crate::util;

use pkm_rs_types::Gender;
use pkm_rs_types::OriginGame;
use pkm_rs_types::read_u16_le;
use pkm_rs_types::read_u32_le;
use pkm_rs_types::strings::SizedUtf16String;
use serde::Serialize;

const BOX_DATA_OFFSET: usize = 0x5c00;
const BOX_ROWS: usize = 6;
const BOX_COLS: usize = 5;
const BOX_SLOTS: usize = BOX_ROWS * BOX_COLS;
const BOX_SLOTS_TOTAL: usize = 1000;
const BOX_COUNT: usize = (BOX_SLOTS_TOTAL / 30) + 1;

const SAVE_FILE_SIZE: usize = 0x100000;
const EMPTY_SLOT_CHECKSUM: u16 = 0;

#[derive(Serialize)]
pub struct LetsGoSave {
    #[serde(skip_serializing)]
    bytes: Vec<u8>,
    size: usize,
    pub trainer: TrainerData,
    poke_list_header: PokeListHeader,
}

impl LetsGoSave {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        let my_status = TrainerData::from_bytes(&bytes);
        let poke_list_header = PokeListHeader::from_bytes(&bytes);
        Ok(Self {
            bytes: bytes.to_vec(),
            size,
            trainer: my_status,
            poke_list_header,
        })
    }
}

impl SaveData for LetsGoSave {
    type PkmType = Pb7;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::from_bytes(bytes)
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
        0
    }

    fn get_decrypted_mon_bytes(&self, _: usize, offset: usize) -> Result<Vec<u8>> {
        let decrypted_bytes = decrypt_pkm_bytes_gen_6_7(&self.get_mon_bytes(offset))?;
        unshuffle_blocks_gen_6_7(&decrypted_bytes)
    }

    fn get_mon_at(&self, box_num: usize, offset: usize) -> Result<Option<Pb7>> {
        let decrypted_bytes = self.get_decrypted_mon_bytes(box_num, offset)?;

        let encryption_constant = read_u32_le!(decrypted_bytes, 0);
        let checksum = read_u16_le!(decrypted_bytes, 6);
        if checksum == EMPTY_SLOT_CHECKSUM && encryption_constant == 0 {
            return Ok(None);
        }

        Some(Pb7::from_bytes(
            &self.get_decrypted_mon_bytes(box_num, offset)?,
        ))
        .transpose()
    }

    fn is_valid_save(bytes: &[u8]) -> bool {
        bytes.len() == SAVE_FILE_SIZE
    }

    fn display_tid(&self) -> String {
        util::six_digit_trainer_display(self.trainer.trainer_id, self.trainer.secret_id)
    }

    fn game_of_origin(&self) -> Option<OriginGame> {
        Some(OriginGame::from(self.trainer.game_code))
    }
}

impl LetsGoSave {
    fn get_mon_bytes(&self, offset: usize) -> Vec<u8> {
        let mon_offset = BOX_DATA_OFFSET + offset * Pb7::BOX_SIZE;
        self.bytes[mon_offset..mon_offset + Pb7::BOX_SIZE].to_vec()
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
        let block_bytes = &bytes[0x1000..0x1168];
        Self {
            trainer_id: u16::from_le_bytes(block_bytes[0..2].try_into().unwrap()),
            secret_id: u16::from_le_bytes(block_bytes[2..4].try_into().unwrap()),
            game_code: block_bytes[4],
            trainer_gender: Gender::from(util::get_flag(block_bytes, 5, 0)),
            trainer_name: SizedUtf16String::from_bytes(block_bytes[56..80].try_into().unwrap()),
        }
    }
}

const PARTY_SIZE: usize = 6;

#[derive(Default, Debug, Serialize)]
struct PokeListHeader {
    pub party_indices: [u16; PARTY_SIZE],
    pub starter_index: u16,
    pub count: u16,
}

impl PokeListHeader {
    fn from_bytes(bytes: &[u8]) -> Self {
        let block_bytes = &bytes[0x5A00..0x5A12];

        let starter_index = u16::from_le_bytes(block_bytes[0..2].try_into().unwrap());

        let mut party_indices: [u16; PARTY_SIZE] = [0u16; PARTY_SIZE];
        for (i, party_slot) in party_indices.iter_mut().enumerate() {
            let byte_index = 2 + (i * 2);
            *party_slot =
                u16::from_le_bytes(block_bytes[byte_index..byte_index + 2].try_into().unwrap());
        }

        let count = u16::from_le_bytes(block_bytes[14..16].try_into().unwrap());

        Self {
            starter_index,
            party_indices,
            count,
        }
    }
}
