use super::BOX_COLS;
use super::BOX_COUNT;
use super::BOX_ROWS;
use super::BOX_SLOTS;
use super::BoxIndex;
use super::BoxSlot;
use super::PK2PolishedCrystal;
use crate::result::{Error, Result};
use crate::traits::PkmBytes;
use arrayref::array_ref;
use pkm_rs_types::OriginGame;
use pkm_rs_types::read_u16_le;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{BinaryGender, BoundViolated};
use std::collections::HashMap;
use std::path::Path;
use std::sync::LazyLock;

use serde::Serialize;

use crate::log;
use crate::rom_hacks::polished_crystal::array_utils::as_sized_array;
pub(crate) use crate::rom_hacks::polished_crystal::trainer_data::TrainerDataGen2PolishedCrystal;
use crate::rom_hacks::polished_crystal::trainer_data::{
  POLISHED_CRYSTAL_TRAINER_DATA_OFFSET, TRAINER_DATA_SIZE,
};
use crate::traits::OhpkmV2;
use BinaryGender::Male;
use tsify::Ts;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const POLISHED_CRYSTAL_SIZE_BYTES: usize = 32_816;

const POLISHED_CRYSTAL_SAVE_VERSION_INFO_OFFSET: usize = 3_042;

const POLISHED_CRYSTAL_BOX_METADATA_OFFSET: usize = 0x2f20;
const POLISHED_CRYSTAL_BOX_NAMES_OFFSET: usize = 13176;

const POLISHED_CRYSTAL_NUM_BOXES: u8 = 20;

const BOX_NAME_BYTE_LENGTH: usize = 9;

const BOX_MON_DATA_SIZE: usize = 49;
const BOX_SIZE: usize = 33;

const POLISHED_CRYSTAL_SAVE_VERSION_INFO_SIZE: usize = 2;

type BoxName = SizedUtf16String<BOX_NAME_BYTE_LENGTH>;

const NATIONAL_DEX_BYTE: usize = 0;
#[cfg(feature = "wasm")]
const POLISHED_CRYSTAL_PC_CHECKSUM_OFFSET: usize = 11533;

#[derive(Serialize, Debug)]
enum SaveType {
  PolishedCrystal,
}

static BOX_MON_SECTOR_ADDRESSES: LazyLock<HashMap<&str, usize>> = LazyLock::new(|| {
  HashMap::from([
    ("sBoxMons1A", 16384),
    ("sBoxMons1B", 0),
    ("sBoxMons1C", 13836),
    ("sBoxMons2A", 24576),
    ("sBoxMons2B", 3057),
    ("sBoxMons2C", 14424),
  ])
});

pub fn get_box_sector_address(sector_name: &str) -> Result<usize> {
  let map: HashMap<&str, usize> = BOX_MON_SECTOR_ADDRESSES.clone();
  if map.contains_key(sector_name) {
    Ok(map[sector_name])
  } else {
    Err(Error::other(&format!(
      "No mapping found for sector \"{}\"",
      sector_name
    )))
  }
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
      SaveType::PolishedCrystal => POLISHED_CRYSTAL_BOX_METADATA_OFFSET,
    }
  }

  /**
  Return the address of the metadata for the Pokémon at the given box and slot.
  */
  #[cfg(feature = "wasm")]
  const fn mon_byte_offset(&self, box_index: BoxIndex, box_slot: BoxSlot) -> usize {
    POLISHED_CRYSTAL_BOX_METADATA_OFFSET
      + (box_slot.get() as usize * BOX_SIZE)
      + box_index.get() as usize
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
        "The loaded Gen 2 Pol\
        ished Crystal save file did not have the right expected size!",
        save_type.file_size_bytes(),
        bytes.len(),
      ))
    } else {
      let mut result = Ok(Self {
        save_type,
        bytes: bytes.into(),
        size: bytes.len(),
      });
      result
    }
  }

  pub fn from_bytes_polished_crystal(bytes: &[u8]) -> Result<Self> {
    Self::from_bytes_for_type(bytes, SaveType::PolishedCrystal)
  }

  #[cfg(feature = "wasm")]
  pub fn prepare_bytes_for_saving(&self) -> Box<[u8]> {
    // let mut bytes = self.bytes.clone();

    todo!("Do checksum calcs");
    // let pc_checksum_offset = self.save_type.pc_checksum_offset();
    // bytes[pc_checksum_offset..pc_checksum_offset + 2]
    //   .copy_from_slice(&self.calc_checksum().to_le_bytes());

    // bytes
  }

  // fn calculate_pc_checksum(&self) -> u16 {
  //   encryption::crc16_ccitt_invert(&self.bytes, self.save_type.box_data_offset(), BOX_DATA_SIZE)
  // }

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

    todo!("Must perform a special calculation to get the address of the stored mon.")
  }

  fn get_mon_bytes_raw(&self, _box_index: BoxIndex, _box_slot: BoxSlot) -> &[u8] {
    // After getting all the metadata for a Pokémon, extract the by

    todo!("Mons are stored differently so this needs to be redone");
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
    let bytes = self.bytes.clone();

    // Get information on the address of the Pokémon, by looking up the information from an index
    // in the save file.
    let slot_index = box_slot.get();
    let box_index_unwrapped = box_index.get();
    let mon_metadata_index = bytes[POLISHED_CRYSTAL_BOX_METADATA_OFFSET
      + (33u8 * box_index_unwrapped + slot_index) as usize];

    if mon_metadata_index == 0 {
      return Ok(None);
    }

    let mon_flag = (bytes[POLISHED_CRYSTAL_BOX_METADATA_OFFSET
      + (33usize * box_index_unwrapped as usize)
      + 20usize
      + (slot_index / 8) as usize]
      >> (slot_index % 8))
      & 1;

    let mon_flag_number = if mon_flag == 0 { 1 } else { 2 };
    let mon_block_name = match mon_metadata_index {
      ..167 => 'A',
      167..195 => 'B',
      _ => 'C',
    };

    let sector_name = format!("sBoxMons{}{}", mon_flag_number, mon_block_name);
    let result = get_box_sector_address(&*sector_name);
    let mut address = bytes[result?] as usize;

    if mon_block_name == 'A' {
      address += bytes[mon_metadata_index as usize] as usize * 49usize;
    } else if mon_block_name == 'B' {
      address += (bytes[mon_metadata_index as usize] - 167) as usize * 49usize;
    } else {
      address += (bytes[mon_metadata_index as usize] - 195) as usize * 49usize;
    }

    let mon_address = address;
    let mon_bytes: [u8; BOX_MON_DATA_SIZE] =
      *as_sized_array::<49>(&bytes[mon_address..mon_address + BOX_MON_DATA_SIZE]);

    let national_dex = read_u16_le!(mon_bytes, NATIONAL_DEX_BYTE);

    if national_dex > 0 {
      PK2PolishedCrystal::from_bytes(&mon_bytes)
        .map(Some)
        .inspect_err(|err| log!("malformed pkm at box {box_index}, slot {box_slot}: {err}"))
    } else {
      Ok(None)
    }

    // let decrypted_bytes = self.get_mon_bytes_decrypted(box_index, box_slot);
    //
    // let has_mon = Self::slot_has_mon(&decrypted_bytes);
    //
    // if has_mon {
    //   PK2PolishedCrystal::from_bytes(&decrypted_bytes)
    //     .map(Some)
    //     .inspect_err(|err| log!("malformed pkm at box {box_index}, slot {box_slot}: {err}"))
    // } else {
    //   Ok(None)
    // }
  }

  fn slot_has_mon(decrypted_bytes: &Box<[u8]>) -> bool {
    let national_dex = read_u16_le!(decrypted_bytes, 0);
    national_dex > 0
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
    // let checksum_offset = self.save_type.pc_checksum_offset();
    // let calculated_checksum = self.calculate_pc_checksum();
    // self.bytes[checksum_offset..checksum_offset + 2]
    //   .copy_from_slice(&calculated_checksum.to_le_bytes());
  }

  fn box_name(&self, _box_index: BoxIndex) -> BoxName {
    todo!()
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

  // #[wasm_bindgen]
  // pub fn calc_checksum(&self) -> u16 {
  //   encryption::crc16_ccitt_invert(&self.bytes, self.save_type.box_data_offset(), BOX_DATA_SIZE)
  // }

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

#[cfg(feature = "wasm")]
#[cfg(test)]
mod tests {
  use super::*;
  use crate::tests::save_bytes_from_file;
  use pkm_rs_types::NationalDex;

  #[test]
  fn valid_trainer_data() -> std::result::Result<(), Box<dyn std::error::Error>> {
    let save = get_polished_crystal_save()?;

    let trainer_data = save.get_trainer_data();

    assert_eq!(String::from(&trainer_data.trainer_name), "Richard");
    assert_eq!(trainer_data.trainer_id, 23239);
    assert_eq!(trainer_data.trainer_gender, Male);

    Ok(())
  }

  #[test]
  fn valid_trainer_data_2() -> std::result::Result<(), Box<dyn std::error::Error>> {
    let save = get_polished_crystal_save()?;

    let trainer_data = save.get_trainer_data();

    assert_eq!(String::from(&trainer_data.trainer_name), "Richard");
    assert_eq!(trainer_data.trainer_id, 23239);
    assert_eq!(trainer_data.trainer_gender, Male);

    Ok(())
  }

  #[test]
  fn valid_box_data() -> std::result::Result<(), Box<dyn std::error::Error>> {
    let save = get_polished_crystal_save()?;

    let target_mon = save.get_mon_at(box_index(0)?, box_slot(0)?)?;

    assert_eq!(
      target_mon.unwrap().species_and_form.0.get_ndex(),
      NationalDex::Caterpie
    );

    Ok(())
  }

  fn box_slot(slot_index: u8) -> Result<BoxSlot> {
    slot_index.try_into().or(Err(Error::BoxSlot(slot_index)))
  }

  fn box_index(ind: u8) -> Result<BoxIndex> {
    ind.try_into().or(Err(Error::BoxIndex(ind)))
  }

  fn get_polished_crystal_save() -> Result<Gen2PolishedCrystalSave> {
    let bytes = save_bytes_from_file(&Path::new("gen2-polished-crystal").join("standard.sav"));

    let save: Gen2PolishedCrystalSave = Gen2PolishedCrystalSave::from_bytes(&*bytes?)?;
    Ok(save)
  }
}
