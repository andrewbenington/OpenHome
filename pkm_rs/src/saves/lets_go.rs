use serde::Serialize;

use crate::encryption::decrypt_pkm_bytes_gen_6_7;
use crate::encryption::unshuffle_blocks_gen_6_7;
use crate::substructures::Gender;
use crate::util::get_flag;

use super::SaveDataTrait;
use crate::pkm::Pb7;
use crate::pkm::Pkm;
use crate::strings::SizedUtf16String;

const BOX_DATA_OFFSET: usize = 0x5c00;
const BOX_ROWS: usize = 6;
const BOX_COLS: usize = 5;
const BOX_SLOTS: usize = BOX_ROWS * BOX_COLS;

const SAVE_FILE_SIZE: usize = 0x100000;

#[derive(Serialize)]
pub struct LetsGoSave {
    #[serde(skip_serializing)]
    bytes: Vec<u8>,
    size: usize,
    pub trainer: TrainerData,
    poke_list_header: PokeListHeader,
}

impl LetsGoSave {
    pub fn from_bytes(bytes: Vec<u8>) -> Result<Self, String> {
        let size = bytes.len();
        let my_status = TrainerData::from_bytes(&bytes);
        let poke_list_header = PokeListHeader::from_bytes(&bytes);
        Ok(Self {
            bytes,
            size,
            trainer: my_status,
            poke_list_header,
        })
    }
}

impl SaveDataTrait for LetsGoSave {
    type PkmType = Pb7;

    fn box_rows() -> usize {
        BOX_ROWS
    }

    fn box_cols() -> usize {
        BOX_COLS
    }

    fn box_slots() -> usize {
        BOX_SLOTS
    }

    fn get_mon_bytes_at(&self, _: usize, offset: usize) -> Result<Vec<u8>, String> {
        let decrypted_bytes = decrypt_pkm_bytes_gen_6_7(&self.get_mon_bytes(offset))
            .map_err(|err| err.to_string())?;
        unshuffle_blocks_gen_6_7(&decrypted_bytes).map_err(|err| err.to_string())
    }

    fn get_mon_at(&self, box_num: usize, offset: usize) -> Result<Pb7, String> {
        Pb7::from_bytes(
            &self
                .get_mon_bytes_at(box_num, offset)
                .map_err(|err| err.to_string())?,
        )
        .map_err(|err| err.to_string())
    }

    fn calc_checksum(&self) -> u16 {
        todo!()
    }

    fn is_valid_save(bytes: &[u8]) -> bool {
        bytes.len() == SAVE_FILE_SIZE
    }
}

impl LetsGoSave {
    fn get_mon_bytes(&self, offset: usize) -> Vec<u8> {
        let mon_offset = BOX_DATA_OFFSET + offset * Pb7::box_size();
        self.bytes[mon_offset..mon_offset + Pb7::box_size()].to_vec()
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
            trainer_gender: Gender::from(get_flag(block_bytes, 5, 0)),
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
