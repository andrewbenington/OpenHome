use super::save_blocks::{BoxBlock, MyStatusBlock, SwShBlocks};
use super::{BOX_COLS, BOX_ROWS, BoxName, MAX_BOX_COUNT, Pk8, Pk8Buffer};
use crate::checksum::RefreshChecksum;
use crate::encryption::swish_crypto;
use crate::gen8_swsh::{BoxIndex, BoxSlot};
use crate::result::{Error, Result};
use crate::traits::PkmBytes;

#[cfg(feature = "wasm")]
use pkm_rs_types::BoundViolated;
use pkm_rs_types::OriginGame;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{BinaryGender, Language};
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const SAVE_SIZE_BYTES_MIN: usize = 0x171500;
const SAVE_SIZE_BYTES_MAX: usize = 0x187800;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = SwordShieldSaveRust))]
#[derive(Debug)]
pub struct SwordShieldSave {
    bytes: Box<[u8]>,
    blocks: SwShBlocks,
}

impl SwordShieldSave {
    pub fn from_bytes(bytes: Box<[u8]>) -> Result<Self> {
        if bytes.len() < SAVE_SIZE_BYTES_MIN {
            return Err(Error::buffer_size_with_source(
                "sword/shield save file min",
                SAVE_SIZE_BYTES_MIN,
                bytes.len(),
            ));
        } else if bytes.len() > SAVE_SIZE_BYTES_MAX {
            return Err(Error::buffer_size_with_source(
                "sword/shield save file max",
                SAVE_SIZE_BYTES_MAX,
                bytes.len(),
            ));
        }

        let blocks = SwShBlocks::from_vec(swish_crypto::decrypt_blocks(&bytes)?)?;

        Ok(Self { bytes, blocks })
    }

    const fn my_status(&self) -> &MyStatusBlock {
        &self.blocks.my_status
    }

    const fn box_data(&self) -> &BoxBlock {
        &self.blocks.pokemon_boxes
    }

    const fn box_data_mut(&mut self) -> &mut BoxBlock {
        &mut self.blocks.pokemon_boxes
    }

    fn box_name(&self, box_index: BoxIndex) -> BoxName {
        self.blocks.box_layouts.get_box_name(box_index)
    }

    pub fn trainer_name(&self) -> SizedUtf16String<{ MyStatusBlock::NAME_BYTE_LENGTH }> {
        self.my_status().trainer_name()
    }

    pub fn trainer_id(&self) -> u16 {
        self.my_status().trainer_id()
    }

    pub fn secret_id(&self) -> u16 {
        self.my_status().secret_id()
    }

    fn language(&self) -> Language {
        self.my_status().language().unwrap_or_default()
    }

    fn copy_pokemon_bytes_to(&mut self, box_index: BoxIndex, box_slot: BoxSlot, data: &[u8]) {
        self.box_data_mut()
            .mon_bytes_at_mut(box_index, box_slot)
            .copy_from_slice(data)
    }

    fn get_mon_bytes_decrypted(&self, box_index: BoxIndex, box_slot: BoxSlot) -> Box<[u8]> {
        let mut pokemon_bytes = self.get_mon_bytes_raw(box_index, box_slot);
        Pk8Buffer::new_mut(&mut pokemon_bytes).decrypt();

        pokemon_bytes
    }

    fn get_mon_bytes_raw(&self, box_index: BoxIndex, box_slot: BoxSlot) -> Box<[u8]> {
        Box::from(self.box_data().mon_bytes_at(box_index, box_slot))
    }

    fn get_mon_at(&self, box_index: BoxIndex, box_slot: BoxSlot) -> Option<Pk8> {
        let decrypted_bytes = self.get_mon_bytes_decrypted(box_index, box_slot);
        let national_dex = Pk8Buffer::new(&decrypted_bytes).species_ndex();

        if national_dex > 0 {
            Pk8::from_bytes(&decrypted_bytes)
                .inspect_err(|err| {
                    crate::log!("malformed pkm at box {box_index}, slot {box_slot}: {err}")
                })
                .ok()
        } else {
            None
        }
    }

    fn set_mon_at(&mut self, box_index: BoxIndex, box_slot: BoxSlot, mut mon: Option<Pk8>) {
        let mon_bytes = if let Some(mon) = &mut mon {
            // stored stats and checksum should always be up-to-date in the box data
            mon.recalculate_stats();
            mon.refresh_checksum();

            mon.to_box_bytes_encrypted()
        } else {
            println!(
                "name {:?} resized {:?}",
                self.trainer_name(),
                self.trainer_name().resize::<28>()
            );
            Self::empty_box_slot_bytes()
        };

        // write bytes to box slot
        self.copy_pokemon_bytes_to(box_index, box_slot, &mon_bytes);
    }

    pub fn empty_box_slot_bytes() -> Box<[u8]> {
        let mut bytes = Box::new([0u8; Pk8::BOX_SIZE]);
        let mut buffer = Pk8Buffer::new_mut(bytes.as_mut_slice());

        buffer.refresh_checksum();
        buffer.encrypt();

        bytes
    }

    #[cfg(feature = "wasm")]
    pub fn prepare_bytes_for_saving(&self) -> Vec<u8> {
        swish_crypto::encrypt_blocks(&self.blocks.clone().into_vec(), self.bytes.len())
    }

    fn convert_ohpkm(
        &self,
        ohpkm: crate::ohpkm::OhpkmV2,
        strategy: crate::convert_strategy::ConvertStrategy,
    ) -> Result<Pk8> {
        use crate::ohpkm::OhpkmConvert;
        Pk8::from_ohpkm(&ohpkm, strategy)
    }

    const fn is_save(bytes: &[u8]) -> bool {
        bytes.len() >= SAVE_SIZE_BYTES_MIN && bytes.len() <= SAVE_SIZE_BYTES_MAX
    }

    fn display_tid(&self) -> String {
        crate::util::six_digit_trainer_id_from_full(self.blocks.my_status.tid_sid_u32())
    }

    fn game_of_origin(&self) -> Option<OriginGame> {
        self.my_status().origin_game()
    }

    fn current_pc_box_idx(&self) -> usize {
        if self.bytes[0] >= MAX_BOX_COUNT {
            0
        } else {
            self.bytes[0].into()
        }
    }

    fn includes_origin(origin: OriginGame) -> bool {
        origin.is_swsh()
    }
}

#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen(js_class = SwordShieldSaveRust))]
#[allow(clippy::missing_const_for_fn)]
impl SwordShieldSave {
    #[wasm_bindgen(js_name = getMonAt)]
    pub fn get_mon_at_wasm(&self, box_index: u8, box_slot: u8) -> Option<Pk8> {
        self.get_mon_at(box_index.try_into().ok()?, box_slot.try_into().ok()?)
    }

    #[wasm_bindgen(js_name = setMonAt)]
    pub fn set_mon_at_wasm(&mut self, box_index: u8, box_slot: u8, mon: Option<Pk8>) {
        if let Ok(box_index) = box_index.try_into()
            && let Ok(box_slot) = box_slot.try_into()
        {
            self.set_mon_at(box_index, box_slot, mon)
        }
    }

    #[wasm_bindgen(js_name = emptyBoxSlotBytes)]
    pub fn empty_box_slot_bytes_wasm() -> Box<[u8]> {
        Self::empty_box_slot_bytes()
    }

    #[wasm_bindgen(js_name = getBoxName)]
    pub fn box_name_wasm(&mut self, box_index: u8) -> std::result::Result<String, JsError> {
        match BoxIndex::check_bound(box_index) {
            Ok(index) => Ok(self.box_name(index).to_string()),
            Err(BoundViolated) => Err(BoundViolated.into()),
        }
    }

    #[wasm_bindgen(js_name = convertOhpkm)]
    pub fn convert_ohpkm_wasm(
        &self,
        ohpkm: crate::ohpkm::OhpkmV2,
        strategy: crate::convert_strategy::ConvertStrategy,
    ) -> Result<Pk8> {
        self.convert_ohpkm(ohpkm, strategy)
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Box<[u8]>) -> Result<Self> {
        Self::from_bytes(bytes)
    }

    #[wasm_bindgen]
    pub fn calc_checksum(&self) -> u16 {
        todo!()
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
        self.trainer_name().to_string()
    }

    #[wasm_bindgen(getter = trainerId)]
    pub fn trainer_id_wasm(&self) -> u16 {
        self.trainer_id()
    }

    #[wasm_bindgen(getter = secretId)]
    pub fn secret_id_wasm(&self) -> u16 {
        self.secret_id()
    }

    #[wasm_bindgen(getter = trainerGender)]
    pub fn trainer_gender_wasm(&self) -> BinaryGender {
        self.my_status().trainer_gender()
    }

    #[wasm_bindgen(getter = MAX_BOX_COUNT)]
    pub fn max_box_count() -> u8 {
        MAX_BOX_COUNT
    }

    #[wasm_bindgen(getter = BOX_ROWS)]
    pub fn box_rows() -> u8 {
        BOX_ROWS
    }

    #[wasm_bindgen(getter = BOX_COLS)]
    pub fn box_cols() -> u8 {
        BOX_COLS
    }

    #[wasm_bindgen(getter = SLOTS_PER_BOX)]
    pub fn box_size() -> u8 {
        BOX_COLS * BOX_ROWS
    }

    #[wasm_bindgen(getter = currentPcBoxIdx)]
    pub fn current_pc_box_idx_wasm(&self) -> usize {
        self.current_pc_box_idx()
    }

    #[wasm_bindgen(getter = gameOfOrigin)]
    pub fn game_of_origin_wasm(&self) -> OriginGame {
        self.game_of_origin().unwrap_or_default()
    }

    #[wasm_bindgen(getter = language)]
    pub fn language_wasm(&self) -> Language {
        self.language()
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

#[cfg(feature = "wasm")]
#[cfg(test)]
mod tests {
    use std::collections::HashMap;
    use std::path::Path;

    use super::*;
    use crate::convert_strategy::ConvertStrategy;
    use crate::ohpkm::{OhpkmConvert, OhpkmV2};
    use crate::tests;

    #[test]
    fn blocks_identical_after_serde() -> std::result::Result<(), Box<dyn std::error::Error>> {
        let save_path = Path::new("gen8-swsh").join("sword");
        let save_bytes = tests::save_bytes_from_file(&save_path)?;
        let block_vec = swish_crypto::decrypt_blocks(&save_bytes)?;

        let mut original_blocks_by_key: HashMap<u32, swish_crypto::Block> = HashMap::new();
        for block in &block_vec {
            original_blocks_by_key.insert(block.key(), block.clone());
        }

        assert_eq!(block_vec.len(), 4741);

        let save = SwordShieldSave::from_bytes(save_bytes.into_boxed_slice())?;

        let after_serialized_bytes = save.prepare_bytes_for_saving();

        let block_vec = swish_crypto::decrypt_blocks(&after_serialized_bytes)?;
        for block in &block_vec {
            let key = block.key();
            let Some(original_block) = original_blocks_by_key.get(&key) else {
                return Err(format!("Block missing for key {key}").into());
            };

            tests::assert_unchanged(
                &block,
                &original_block,
                Some(tests::context(
                    &format!("SwishCrypto block with key {key}"),
                    &save_path,
                )),
            )?;
        }

        Ok(())
    }

    #[test]
    fn pkm_checksum_calculation_is_correct() -> Result<()> {
        use crate::checksum::Checksum;

        let save_path = Path::new("gen8-swsh").join("sword");
        let save_bytes = tests::save_bytes_from_file(&save_path)?;
        let save = SwordShieldSave::from_bytes(save_bytes.into_boxed_slice())?;

        for box_index in BoxIndex::all() {
            for box_slot in BoxSlot::all() {
                let mon_bytes = save.get_mon_bytes_decrypted(box_index, box_slot);
                let buffer = Pk8Buffer::new(&mon_bytes);
                if buffer.checksum() != buffer.calculate_checksum() {
                    return Err(Error::other(&format!(
                        "Invalid checksum for mon at box {box_index}, slot {box_slot}: expected {:#06x}, got {:#06x}",
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
        let save_bytes = tests::save_bytes_from_file(&Path::new("gen8-swsh").join("sword"))?;
        let mut save = SwordShieldSave::from_bytes(save_bytes.into_boxed_slice())?;

        let ohpkm =
            tests::pkm_from_file::<OhpkmV2>(&Path::new("ohpkm").join("cinderace-mint.ohpkm"))?;

        let pk8 = Pk8::from_ohpkm(&ohpkm.0, ConvertStrategy::default())?;

        let box_index = BoxIndex::check_bound(0).expect("should be valid");
        let box_slot = BoxSlot::check_bound(9).expect("should be valid");

        save.set_mon_at(box_index, box_slot, Some(pk8));
        let retrieved_pk8 = save
            .get_mon_at(box_index, box_slot)
            .expect("ribbon master is present");

        if retrieved_pk8.calculate_checksum() != pk8.calculate_checksum() {
            return Err(Error::other(
                "pokemon changed between setting and retrieving",
            ));
        }

        Ok(())
    }

    #[test]
    fn empty_box_slot_bytes() -> tests::TestResult<()> {
        let save_bytes = tests::save_bytes_from_file(&Path::new("gen8-swsh").join("sword2"))?;
        let mut save = SwordShieldSave::from_bytes(save_bytes.into_boxed_slice())?;

        let empty_slot_box_index = BoxIndex::check_bound(9).expect("should be valid");
        let empty_slot = BoxSlot::check_bound(4).expect("should be valid");

        let initially_full_box_index = BoxIndex::check_bound(1).expect("should be valid");
        let initially_full_slot = BoxSlot::check_bound(1).expect("should be valid");

        assert!(save.get_mon_at(empty_slot_box_index, empty_slot).is_none());
        assert!(
            save.get_mon_at(initially_full_box_index, initially_full_slot)
                .is_some()
        );

        save.set_mon_at(initially_full_box_index, initially_full_slot, None);
        assert!(
            save.get_mon_at(initially_full_box_index, initially_full_slot)
                .is_none()
        );

        let mut expected_bytes = save.get_mon_bytes_raw(empty_slot_box_index, empty_slot);
        println!("{}", tests::bytes_to_hex_string(&expected_bytes));
        let mut actual_bytes =
            save.get_mon_bytes_raw(initially_full_box_index, initially_full_slot);
        Pk8Buffer::new_mut(&mut expected_bytes).decrypt();
        Pk8Buffer::new_mut(&mut actual_bytes).decrypt();

        println!("{:?}", expected_bytes);
        println!("{actual_bytes:?}");

        tests::ensure_ranges_match(&actual_bytes, &expected_bytes, None)
    }
}
