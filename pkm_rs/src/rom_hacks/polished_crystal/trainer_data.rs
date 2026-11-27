use crate::rom_hacks::polished_crystal::array_utils::as_sized_array;
use crate::rom_hacks::polished_crystal::string_conversion::get_gb_char_from_byte;
use pkm_rs_types::BinaryGender::Male;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{BinaryGender, read_u16_be};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::wasm_bindgen;

pub const POLISHED_CRYSTAL_TRAINER_DATA_OFFSET: usize = 4616;

// Trainer data field offsets
pub const TRAINER_ID_SUB_OFFSET: usize = 0;
pub const TRAINER_GENDER_SUB_OFFSET: usize = 2;
pub const TRAINER_NAME_SUB_OFFSET: usize = 3;
pub const TRAINER_NAME_SUB_END_OFFSET: usize = 10;
pub const TRAINER_DATA_SIZE: usize = 10;

// Gender bytes
pub const MALE_GENDER_BYTE: u8 = 0;
pub const FEMALE_GENDER_BYTE: u8 = 1;
pub const NON_BINARY_GENDER_BYTE: u8 = 2;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Default, Debug, Serialize, Clone, Copy)]
pub struct TrainerDataGen2PolishedCrystal {
  pub trainer_id: u16,
  pub trainer_gender: BinaryGender,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub trainer_name: SizedUtf16String<26>,
  pub is_non_binary: bool,
}

impl TrainerDataGen2PolishedCrystal {
  pub(crate) fn from_bytes(block_bytes: &[u8; TRAINER_DATA_SIZE]) -> Self {
    let trainer_id = read_u16_be!(block_bytes, TRAINER_ID_SUB_OFFSET);

    // Trainer name stuff
    let trainer_name_as_array =
      as_sized_array::<7>(&block_bytes[TRAINER_NAME_SUB_OFFSET..TRAINER_NAME_SUB_END_OFFSET]);
    let trainer_name = Self::parse_gb_name(trainer_name_as_array);

    // Polished Crystal supports non-binary genders. To store this knowledge without altering
    // the existing BinaryGender structs (ugh!), we store a separate is_non_binary flag to
    // track if the player is non-binary.
    let gender_byte = block_bytes[TRAINER_GENDER_SUB_OFFSET];
    let trainer_gender = if gender_byte != NON_BINARY_GENDER_BYTE {
      BinaryGender::from_byte(gender_byte)
    } else {
      Male
    };

    Self {
      trainer_id,
      trainer_gender,
      trainer_name,
      is_non_binary: gender_byte == NON_BINARY_GENDER_BYTE,
    }
  }

  fn parse_gb_name(name_arr: &[u8; 7]) -> SizedUtf16String<26> {
    // Note that we call get_gb_char_from_byte() when processing the stored name, since
    // player names in Game Boy games have a different mapping to Latin characters than
    // other main series games.
    let vec_char: Vec<char> = name_arr.iter().map(|x| get_gb_char_from_byte(x)).collect();
    let name_as_string: String = vec_char.iter().cloned().collect::<String>();

    SizedUtf16String::from(name_as_string.as_str())
  }

  fn get_gender_byte(self) -> u8 {
    // Polished Crystal supports non-binary genders. To store this knowledge without altering
    // the existing BinaryGender structs (ugh!), we store a separate is_non_binary flag to
    // track if the player is non-binary. Within Polished Crystal, though, 2 represents non-binary,
    // 0 represents male, and 1 represents female.
    if self.is_non_binary {
      NON_BINARY_GENDER_BYTE
    } else if self.trainer_gender == Male {
      MALE_GENDER_BYTE
    } else {
      FEMALE_GENDER_BYTE
    }
  }

  fn to_bytes(self) -> [u8; TRAINER_DATA_SIZE] {
    let mut bytes = [0u8; TRAINER_DATA_SIZE];
    bytes[TRAINER_ID_SUB_OFFSET..TRAINER_GENDER_SUB_OFFSET]
      .copy_from_slice(&self.trainer_id.to_le_bytes());
    bytes[TRAINER_GENDER_SUB_OFFSET] = self.get_gender_byte();
    bytes[TRAINER_NAME_SUB_OFFSET..TRAINER_NAME_SUB_END_OFFSET]
      .copy_from_slice(&self.trainer_name.bytes());
    bytes
  }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl TrainerDataGen2PolishedCrystal {
  #[wasm_bindgen]
  pub fn get_name_wasm(&self) -> String {
    self.trainer_name.to_string()
  }
}
