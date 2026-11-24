use super::{array_utils, BoxIndex};
use super::BoxSlot;
use super::PK2PolishedCrystal;
use super::BOX_COLS;
use super::BOX_COUNT;
use super::BOX_ROWS;
use super::BOX_SLOTS;
use crate::result::{Error, Result};
use crate::traits::PkmBytes;
#[cfg(feature = "wasm")]
use crate::{encryption, log};
use arrayref::array_ref;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::OriginGame;
use pkm_rs_types::{read_u16_be, BinaryGender, BoundViolated};
use pkm_rs_types::read_u16_le;

use serde::Serialize;

use crate::traits::OhpkmV2;
use tsify::Ts;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
use array_utils::with_sized;
use BinaryGender::Male;

#[cfg(feature = "wasm")]
use crate::rom_hacks::polished_crystal::pk2_polished_crystal_buffer::PK2PolishedCrystalBuffer;
use crate::rom_hacks::polished_crystal::string_conversion::get_gb_char_from_byte;

const POLISHED_CRYSTAL_SIZE_BYTES: usize = 32_816;

const POLISHED_CRYSTAL_SAVE_VERSION_INFO_OFFSET: usize = 3_042;

const POLISHED_CRYSTAL_TRAINER_DATA_OFFSET: usize = 4616;

const TRAINER_ID_SUB_OFFSET: usize = 0;
const TRAINER_NAME_SUB_OFFSET: usize = 3;
const TRAINER_NAME_SUB_END_OFFSET: usize = 10;
const TRAINER_GENDER_SUB_OFFSET: usize = 2;

const TRAINER_DATA_SIZE: usize = 10;

const NON_BINARY_GENDER_BYTE: u8 = 2;

const POLISHED_CRYSTAL_BOX_DATA_OFFSET: usize = 300;
const POLISHED_CRYSTAL_BOX_NAMES_OFFSET: usize = 300;

const POLISHED_CRYSTAL_NUM_BOXES : usize = 20;

const BOX_DATA_SIZE: usize = 300;
const BOX_NAME_BYTE_LENGTH: usize = 300;

const POLISHED_CRYSTAL_SAVE_VERSION_INFO_SIZE: usize = 2;

type BoxName = SizedUtf16String<BOX_NAME_BYTE_LENGTH>;

#[cfg(feature = "wasm")]
const POLISHED_CRYSTAL_PC_CHECKSUM_OFFSET: usize = 300;

#[derive(Serialize, Debug)]
enum SaveType {
  PolishedCrystal,
}

#[cfg(feature = "wasm")]
impl SaveType {
  const fn file_size_bytes(&self) -> usize {
    match self {
      SaveType::PolishedCrystal => POLISHED_CRYSTAL_SIZE_BYTES,
    }
  }

  const fn trainer_data_offset(&self) -> usize {
    match self {
      SaveType::PolishedCrystal => POLISHED_CRYSTAL_TRAINER_DATA_OFFSET,
    }
  }

  const fn box_data_offset(&self) -> usize {
    match self {
      SaveType::PolishedCrystal => POLISHED_CRYSTAL_BOX_DATA_OFFSET,
    }
  }

  #[cfg(feature = "wasm")]
  const fn mon_byte_offset(&self, box_index: BoxIndex, box_slot: BoxSlot) -> usize {
    let box_offset = self.box_data_offset()
      + box_index.to_usize() * BOX_SLOTS as usize * (PK2PolishedCrystal::BOX_SIZE);
    box_offset + box_slot.to_usize() * PK2PolishedCrystal::BOX_SIZE
  }

  #[cfg(feature = "wasm")]
  const fn pc_checksum_offset(&self) -> usize {
    match self {
      SaveType::PolishedCrystal => POLISHED_CRYSTAL_PC_CHECKSUM_OFFSET,
    }
  }

  const fn box_names_offset(&self) -> usize {
    match self {
      SaveType::PolishedCrystal => POLISHED_CRYSTAL_BOX_NAMES_OFFSET,
    }
  }
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = Gen2PolishedCrystalSaveRust))]
#[derive(Serialize, Debug)]
pub struct Gen2PolishedCrystalSave {
  save_type: SaveType,
  #[serde(skip_serializing)]
  bytes: Box<[u8]>,
  size: usize,
}

#[cfg(feature = "wasm")]
impl Gen2PolishedCrystalSave {
  fn from_bytes_for_type(bytes: &[u8], save_type: SaveType) -> Result<Self> {
    if bytes.len() < save_type.file_size_bytes() {
      Err(Error::buffer_size_with_source(
        "The loaded Gen 2 Polished Crystal save file did not have the right expected size!",
        save_type.file_size_bytes(),
        bytes.len(),
      ))
    } else {
      Ok(Self {
        save_type,
        bytes: bytes.into(),
        size: bytes.len(),
      })
    }
  }

  pub fn from_bytes_polished_crystal(bytes: &[u8]) -> Result<Self> {
    Self::from_bytes_for_type(bytes, SaveType::PolishedCrystal)
  }

  #[cfg(feature = "wasm")]
  pub fn prepare_bytes_for_saving(&self) -> Box<[u8]> {
    let mut bytes = self.bytes.clone();

    let pc_checksum_offset = self.save_type.pc_checksum_offset();
    bytes[pc_checksum_offset..pc_checksum_offset + 2]
      .copy_from_slice(&self.calc_checksum().to_le_bytes());

    bytes
  }

  fn calculate_pc_checksum(&self) -> u16 {
    encryption::crc16_ccitt_invert(&self.bytes, self.save_type.box_data_offset(), BOX_DATA_SIZE)
  }

  fn get_trainer_data(&self) -> TrainerDataGen2PolishedCrystal {
    let offset = self.save_type.trainer_data_offset();
    let target_bytes = &self.bytes[offset..offset + TRAINER_DATA_SIZE]
      .try_into()
      .unwrap();
    TrainerDataGen2PolishedCrystal::from_bytes(target_bytes)
  }

  fn copy_pokemon_bytes_to(&mut self, box_index: BoxIndex, box_slot: BoxSlot, data: &[u8]) {
    let byte_offset = self.save_type.mon_byte_offset(box_index, box_slot);
    self.bytes[byte_offset..byte_offset + PK2PolishedCrystal::BOX_SIZE].copy_from_slice(data);
  }

  fn get_mon_bytes_raw(&self, box_index: BoxIndex, box_slot: BoxSlot) -> &[u8] {
    let byte_offset = self.save_type.mon_byte_offset(box_index, box_slot);
    &self.bytes[byte_offset..byte_offset + PK2PolishedCrystal::BOX_SIZE]
  }

  fn get_mon_bytes_decrypted(&self, box_index: BoxIndex, box_slot: BoxSlot) -> Box<[u8]> {
    let mut copied_bytes = Box::from(self.get_mon_bytes_raw(box_index, box_slot));
    PK2PolishedCrystalBuffer::box_span_mut(&mut copied_bytes).decrypt();

    copied_bytes
  }

  fn from_bytes(bytes: &[u8]) -> Result<Self> {
    match bytes.len() {
      POLISHED_CRYSTAL_SIZE_BYTES => Self::from_bytes_polished_crystal(bytes),
      _ => Err(Error::buffer_size_with_source(
        "The loaded Gen 2 Polished Crystal save file did not have the right expected size!",
        POLISHED_CRYSTAL_SIZE_BYTES,
        bytes.len(),
      )),
    }
  }

  #[cfg(feature = "wasm")]
  fn get_mon_at(
    &self,
    box_index: BoxIndex,
    box_slot: BoxSlot,
  ) -> Result<Option<PK2PolishedCrystal>> {
    let decrypted_bytes = self.get_mon_bytes_decrypted(box_index, box_slot);
    let national_dex = read_u16_le!(decrypted_bytes, 8);

    if national_dex > 0 {
      PK2PolishedCrystal::from_bytes(&decrypted_bytes)
        .map(Some)
        .inspect_err(|err| log!("malformed pkm at box {box_index}, slot {box_slot}: {err}"))
    } else {
      Ok(None)
    }
  }

  fn set_mon_at(
    &mut self,
    box_index: BoxIndex,
    box_slot: BoxSlot,
    mut mon: Option<PK2PolishedCrystal>,
  ) {
    let mon_bytes = if let Some(mon) = &mut mon {
      // checksum should always be up-to-date in the box data
      mon.refresh_checksum();
      mon.to_box_bytes_encrypted()
    } else {
      PK2PolishedCrystal::empty_box_slot_bytes(&self.get_trainer_data().trainer_name)
    };

    // write bytes to box slot
    self.copy_pokemon_bytes_to(box_index, box_slot, &mon_bytes);

    // refresh pc checksum
    let checksum_offset = self.save_type.pc_checksum_offset();
    let calculated_checksum = self.calculate_pc_checksum();
    self.bytes[checksum_offset..checksum_offset + 2]
      .copy_from_slice(&calculated_checksum.to_le_bytes());
  }

  fn box_name(&self, box_index: BoxIndex) -> BoxName {
    let start =
      self.save_type.box_names_offset() + BOX_NAME_BYTE_LENGTH * box_index.get() as usize;
    let end = start + BOX_NAME_BYTE_LENGTH;
    let name_bytes: [u8; BOX_NAME_BYTE_LENGTH] = self.bytes[start..end]
      .try_into()
      .expect("end should be exactly BOX_NAME_BYTE_LENGTH after start");

    SizedUtf16String::from_bytes(name_bytes)
  }

  pub fn box_mon_count(&self, box_index: BoxIndex) -> usize {
    BoxSlot::all()
      .filter(|&box_slot| {
        !PK2PolishedCrystal::is_empty_slot(self.get_mon_bytes_raw(box_index, box_slot))
      })
      .count()
  }

  pub fn pc_mon_count(&self) -> usize {
    BoxIndex::all()
      .map(|box_index| self.box_mon_count(box_index))
      .sum()
  }

  fn convert_ohpkm(
    &self,
    ohpkm: OhpkmV2,
    strategy: crate::convert_strategy::ConvertStrategy,
  ) -> Result<PK2PolishedCrystal> {
    use crate::ohpkm::OhpkmConvert;
    PK2PolishedCrystal::from_ohpkm(&ohpkm, strategy)
  }

  fn current_pc_box_idx(&self) -> usize {
    if self.bytes[0] >= POLISHED_CRYSTAL_NUM_BOXES {
      0
    } else {
      self.bytes[0].into()
    }
  }

  fn is_save(bytes: &[u8]) -> bool {
    if bytes.len() != POLISHED_CRYSTAL_SIZE_BYTES {
      return false;
    }

    let bytes1 = *array_ref![
            bytes,
            POLISHED_CRYSTAL_SAVE_VERSION_INFO_OFFSET,
            POLISHED_CRYSTAL_SAVE_VERSION_INFO_SIZE
        ];
    u16::from_be_bytes(bytes1) == 10u16
  }

  const fn includes_origin(origin: OriginGame) -> bool {
    matches!(origin, OriginGame::Crystal)
  }
}

#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen(js_class = Gen2PolishedCrystalSaveRust))]
#[allow(clippy::missing_const_for_fn)]
impl Gen2PolishedCrystalSave {
  #[wasm_bindgen(js_name = getMonAt)]
  pub fn get_mon_at_wasm(
    &self,
    box_index: u8,
    box_slot: u8,
  ) -> Result<Option<PK2PolishedCrystal>> {
    self.get_mon_at(
      box_index.try_into().or(Err(Error::BoxIndex(box_index)))?,
      box_slot.try_into().or(Err(Error::BoxSlot(box_index)))?,
    )
  }

  #[wasm_bindgen(js_name = setMonAt)]
  pub fn set_mon_at_wasm(
    &mut self,
    box_index: u8,
    box_slot: u8,
    mon: Option<PK2PolishedCrystal>,
  ) {
    if let Ok(box_index) = box_index.try_into()
      && let Ok(box_slot) = box_slot.try_into()
    {
      self.set_mon_at(box_index, box_slot, mon)
    }
  }

  #[wasm_bindgen(js_name = getBoxMonCount)]
  pub fn box_mon_count_wasm(&mut self, box_index: u8) -> std::result::Result<usize, JsError> {
    match BoxIndex::check_bound(box_index) {
      Ok(index) => Ok(self.box_mon_count(index)),
      Err(BoundViolated) => Err(BoundViolated.into()),
    }
  }

  #[wasm_bindgen(js_name = getPcMonCount)]
  pub fn pc_mon_count_wasm(&mut self) -> usize {
    self.pc_mon_count()
  }

  #[wasm_bindgen(js_name = convertOhpkm)]
  pub fn convert_ohpkm_wasm(
    &self,
    ohpkm: OhpkmV2,
    strategy: Ts<crate::convert_strategy::ConvertStrategy>,
  ) -> Result<PK2PolishedCrystal> {
    self.convert_ohpkm(ohpkm, strategy.to_rust()?)
  }

  #[wasm_bindgen(js_name = fromBytes)]
  pub fn from_bytes_wasm(bytes: Box<[u8]>) -> Result<Self> {
    Self::from_bytes(&bytes)
  }

  #[wasm_bindgen]
  pub fn calc_checksum(&self) -> u16 {
    encryption::crc16_ccitt_invert(&self.bytes, self.save_type.box_data_offset(), BOX_DATA_SIZE)
  }

  #[wasm_bindgen(js_name = isValidSave)]
  pub fn is_valid_save_wasm(bytes: &[u8]) {
    Self::is_save(bytes);
  }

  #[wasm_bindgen(getter = trainerName)]
  pub fn trainer_name_wasm(&self) -> String {
    self.get_trainer_data().trainer_name.to_string()
  }

  #[wasm_bindgen(getter = trainerId)]
  pub fn trainer_id_wasm(&self) -> u16 {
    self.get_trainer_data().trainer_id
  }

  #[wasm_bindgen(getter = trainerGender)]
  pub fn trainer_gender_wasm(&self) -> u16 {
    self.get_trainer_data().trainer_gender as u16
  }


  #[wasm_bindgen(getter = gameOfOrigin)]
  pub fn game_of_origin_wasm(&self) -> OriginGame {
    OriginGame::Crystal
  }

  #[wasm_bindgen(getter = secretId)]
  pub fn secret_id_wasm(&self) -> u16 {


    // Polished Crystal has no concept of a secret ID, so we return 0 as a placeholder.
    0u16

  }


  #[wasm_bindgen(getter = displayId)]
  pub fn display_tid_wasm(&self) -> String {

    // The older games do not have the concept of a display ID or a secret ID, so we just return the
    // trainer ID.
    self.trainer_id_wasm().to_string()
  }

  #[wasm_bindgen(js_name = getBoxName)]
  pub fn box_name_wasm(&mut self, box_index: u8) -> std::result::Result<String, JsError> {
    match BoxIndex::check_bound(box_index) {
      Ok(index) => Ok(self.box_name(index).to_string()),
      Err(BoundViolated) => Err(BoundViolated.into()),
    }
  }

  #[wasm_bindgen(getter = MAX_BOX_COUNT)]
  pub fn max_box_count_wasm() -> u8 {
    BOX_COUNT
  }

  #[wasm_bindgen(getter = BOX_ROWS)]
  pub fn box_rows_wasm() -> u8 {
    BOX_ROWS
  }

  #[wasm_bindgen(getter = BOX_COLS)]
  pub fn box_cols_wasm() -> u8 {
    BOX_COLS
  }

  #[wasm_bindgen(getter = SLOTS_PER_BOX)]
  pub fn box_size() -> u8 {
    BOX_SLOTS
  }

  #[wasm_bindgen(getter = currentPcBoxIdx)]
  pub fn current_pc_box_idx_wasm(&self) -> usize {
    self.current_pc_box_idx()
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
  pub fn prepare_bytes_for_saving_wasm(&self) -> Box<[u8]> {
    self.prepare_bytes_for_saving()
  }
}

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
  fn from_bytes(block_bytes: &[u8; TRAINER_DATA_SIZE]) -> Self {

    let trainer_id = read_u16_be!(block_bytes, TRAINER_ID_SUB_OFFSET);

    // Trainer name stuff
    let trainer_name_arr = with_sized::<7>(&block_bytes[
      TRAINER_NAME_SUB_OFFSET..TRAINER_NAME_SUB_END_OFFSET]);
    let trainer_name = Self::parse_gb_name(trainer_name_arr);


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
      is_non_binary: gender_byte == 2,
    }
  }

  fn parse_gb_name(name_arr: &[u8; 7]) -> SizedUtf16String<26> {

    // Note that we call get_gb_char_from_byte() when processing the stored name, since
    // player names in Game Boy games have a different mapping to Latin characters than
    // other main series games.
    let vec_char : Vec<char> = name_arr
      .iter()
      .map(|x| get_gb_char_from_byte(x))
      .collect();
    let name_as_string : String = vec_char.iter().cloned().collect::<String>();

    SizedUtf16String::from(name_as_string.as_str())
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
impl TrainerDataGen2PolishedCrystal {
  #[wasm_bindgen]
  pub fn get_name_wasm(&self) -> String {
    self.trainer_name.to_string()
  }
}
#[cfg(feature = "wasm")]
#[cfg(test)]
mod tests {
  use std::path::Path;

  use crate::tests::save_bytes_from_file;

  use super::*;

  #[test]
  fn valid_trainer_data() -> std::result::Result<(), Box<dyn std::error::Error>> {
    let bytes = save_bytes_from_file(
      &Path::new("gen2-polished-crystal")
        .join("standard.sav"));

    let save: Gen2PolishedCrystalSave = Gen2PolishedCrystalSave::from_bytes(&*bytes?)?;

    let trainer_data = save.get_trainer_data();

    assert_eq!(String::from(&trainer_data.trainer_name), "Richard");
    assert_eq!(trainer_data.trainer_id, 23239);
    assert_eq!(trainer_data.trainer_gender, Male);

    Ok(())
  }
}
