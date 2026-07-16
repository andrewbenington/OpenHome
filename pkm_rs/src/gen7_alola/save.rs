use super::{BOX_COLS, BOX_COUNT, BOX_ROWS, BOX_SLOTS, BoxIndex, BoxSlot, Pk7, Pk7Buffer};
use crate::encryption;
use crate::log;
use crate::result::{Error, Result};
use crate::traits::PkmBytes;
use crate::util;

use pkm_rs_types::BinaryGender;
use pkm_rs_types::Language;
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

#[cfg(feature = "wasm")]
const USUM_PC_CHECKSUM_OFFSET: usize = USUM_SIZE_BYTES - 0x200 + 0x14 + (14 * 8) + 6;
#[cfg(feature = "wasm")]
const SM_PC_CHECKSUM_OFFSET: usize = SM_SIZE_BYTES - 0x200 + 0x14 + (14 * 8) + 6;

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

    const fn mon_byte_offset(&self, box_index: BoxIndex, box_slot: BoxSlot) -> usize {
        let box_offset =
            self.box_data_offset() + box_index.to_usize() * BOX_SLOTS as usize * (Pk7::BOX_SIZE);
        box_offset + box_slot.to_usize() * Pk7::BOX_SIZE
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
    bytes: Box<[u8]>,
    size: usize,
}

impl Gen7AlolaSave {
    fn from_bytes_for_type(bytes: &[u8], save_type: SaveType) -> Result<Self> {
        if bytes.len() < save_type.file_size_bytes() {
            Err(Error::buffer_size_with_source(
                "gen 7 alola save file",
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

    pub fn from_bytes_sunmoon(bytes: &[u8]) -> Result<Self> {
        Self::from_bytes_for_type(bytes, SaveType::SunMoon)
    }

    pub fn from_bytes_ultra(bytes: &[u8]) -> Result<Self> {
        Self::from_bytes_for_type(bytes, SaveType::UltraSunMoon)
    }

    #[cfg(feature = "wasm")]
    pub fn prepare_bytes_for_saving(&self) -> Box<[u8]> {
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

    fn copy_pokemon_bytes_to(&mut self, box_index: BoxIndex, box_slot: BoxSlot, data: &[u8]) {
        let byte_offset = self.save_type.mon_byte_offset(box_index, box_slot);
        self.bytes[byte_offset..byte_offset + Pk7::BOX_SIZE].copy_from_slice(data);
    }

    fn pokemon_bytes_raw(&self, box_index: BoxIndex, box_slot: BoxSlot) -> &[u8] {
        let byte_offset = self.save_type.mon_byte_offset(box_index, box_slot);
        &self.bytes[byte_offset..byte_offset + Pk7::BOX_SIZE]
    }

    fn get_mon_bytes_decrypted(&self, box_index: BoxIndex, box_slot: BoxSlot) -> Box<[u8]> {
        let mut copied_bytes = Box::from(self.pokemon_bytes_raw(box_index, box_slot));
        Pk7Buffer::box_span_mut(&mut copied_bytes).decrypt();

        copied_bytes
    }

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

    fn get_mon_at(&self, box_index: BoxIndex, box_slot: BoxSlot) -> Result<Option<Pk7>> {
        let decrypted_bytes = self.get_mon_bytes_decrypted(box_index, box_slot);
        let national_dex = read_u16_le!(decrypted_bytes, 8);

        if national_dex > 0 {
            Pk7::from_bytes(&decrypted_bytes)
                .map(Some)
                .inspect_err(|err| log!("malformed pkm at box {box_index}, slot {box_slot}: {err}"))
        } else {
            Ok(None)
        }
    }

    fn set_mon_at(&mut self, box_index: BoxIndex, box_slot: BoxSlot, mut mon: Option<Pk7>) {
        let mon_bytes = if let Some(mon) = &mut mon {
            // checksum should always be up-to-date in the box data
            mon.refresh_checksum();
            mon.to_box_bytes_encrypted()
        } else {
            Pk7::empty_box_slot_bytes(&self.get_trainer_data().trainer_name)
        };

        // write bytes to box slot
        self.copy_pokemon_bytes_to(box_index, box_slot, &mon_bytes);

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
    ) -> Result<Pk7> {
        use crate::ohpkm::OhpkmConvert;
        Pk7::from_ohpkm(&ohpkm, strategy)
    }

    fn current_pc_box_idx(&self) -> usize {
        if self.bytes[0] >= 32 {
            0
        } else {
            self.bytes[0].into()
        }
    }

    const fn is_save(bytes: &[u8]) -> bool {
        bytes.len() == SM_SIZE_BYTES || bytes.len() == USUM_SIZE_BYTES
    }

    fn display_tid(&self) -> String {
        let trainer_data = self.get_trainer_data();
        crate::util::six_digit_trainer_id_from_parts(
            trainer_data.trainer_id,
            trainer_data.secret_id,
        )
    }

    const fn includes_origin(origin: OriginGame) -> bool {
        matches!(
            origin,
            OriginGame::Sun | OriginGame::Moon | OriginGame::UltraSun | OriginGame::UltraMoon
        )
    }
}

#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen(js_class = Gen7AlolaSaveRust))]
#[allow(clippy::missing_const_for_fn)]
impl Gen7AlolaSave {
    #[wasm_bindgen(js_name = getMonAt)]
    pub fn get_mon_at_wasm(&self, box_index: u8, box_slot: u8) -> Result<Option<Pk7>> {
        self.get_mon_at(
            box_index.try_into().or(Err(Error::BoxIndex(box_index)))?,
            box_slot.try_into().or(Err(Error::BoxSlot(box_index)))?,
        )
    }

    #[wasm_bindgen(js_name = setMonAt)]
    pub fn set_mon_at_wasm(&mut self, box_index: u8, box_slot: u8, mon: Option<Pk7>) {
        if let Ok(box_index) = box_index.try_into()
            && let Ok(box_slot) = box_slot.try_into()
        {
            self.set_mon_at(box_index, box_slot, mon)
        }
    }

    #[wasm_bindgen(js_name = convertOhpkm)]
    pub fn convert_ohpkm_wasm(
        &self,
        ohpkm: crate::ohpkm::OhpkmV2,
        strategy: crate::convert_strategy::ConvertStrategy,
    ) -> Result<Pk7> {
        self.convert_ohpkm(ohpkm, strategy)
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_bytes_js(bytes: Box<[u8]>) -> Result<Self> {
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
    pub fn max_box_count_js() -> u8 {
        BOX_COUNT
    }

    #[wasm_bindgen(getter = BOX_ROWS)]
    pub fn box_rows_js() -> u8 {
        BOX_ROWS
    }

    #[wasm_bindgen(getter = BOX_COLS)]
    pub fn box_cols_js() -> u8 {
        BOX_COLS
    }

    #[wasm_bindgen(getter = SLOTS_PER_BOX)]
    pub fn box_size() -> u8 {
        BOX_SLOTS
    }

    #[wasm_bindgen(getter = currentPcBoxIdx)]
    pub fn current_pc_box_idx_js(&self) -> usize {
        self.current_pc_box_idx()
    }

    #[wasm_bindgen(getter = gameOfOrigin)]
    pub fn game_of_origin_wasm(&self) -> OriginGame {
        OriginGame::from(self.get_trainer_data().game_code)
    }

    #[wasm_bindgen(getter = language)]
    pub fn language_wasm(&self) -> Language {
        self.get_trainer_data().language
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
pub struct TrainerDataGen7Alola {
    pub trainer_id: u16,
    pub secret_id: u16,
    pub game_code: u8,
    pub language: Language,
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
            language: Language::try_from(block_bytes[0x35]).unwrap_or(Language::None),
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
    use crate::convert_strategy::ConvertStrategy;
    use crate::gen7_alola::pk7_buffer::Pk7Buffer;
    use crate::ohpkm::{OhpkmConvert, OhpkmV2};
    use crate::result::Result;
    use crate::tests::{pkm_from_file, save_bytes_from_file};

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

        for box_index in BoxIndex::all() {
            for slot in BoxSlot::all() {
                let mon_bytes = save.get_mon_bytes_decrypted(box_index, slot);
                let buffer = Pk7Buffer::box_span(&mon_bytes);
                if buffer.checksum() != buffer.calculate_checksum() {
                    return Err(Error::other(&format!(
                        "Invalid checksum for mon at box {box_index}, slot {slot}: expected {:#06x}, got {:#06x}",
                        buffer.calculate_checksum(),
                        buffer.checksum()
                    )));
                }
            }
        }
        Ok(())
    }

    #[test]
    fn pokemon_is_same_before_after_setting_in_box() -> Result<()> {
        let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
        let mut save = Gen7AlolaSave::from_bytes(&moon_bytes)?;

        let ribbon_master_ohpkm =
            pkm_from_file::<OhpkmV2>(&Path::new("ohpkm").join("ribbon-master.ohpkm"))?;

        let ribbon_master_pk7 =
            Pk7::from_ohpkm(&ribbon_master_ohpkm.0, ConvertStrategy::default())?;

        let box_index = BoxIndex::check_bound(0).expect("should be valid");
        let box_slot = BoxSlot::check_bound(9).expect("should be valid");

        save.set_mon_at(box_index, box_slot, Some(ribbon_master_pk7));
        let retrieved_ribbon_master = save
            .get_mon_at(box_index, box_slot)?
            .expect("ribbon master is present");

        if retrieved_ribbon_master.calculate_checksum() != ribbon_master_pk7.calculate_checksum() {
            return Err(Error::other(
                "pokemon changed between setting and retrieving",
            ));
        }

        Ok(())
    }
}
