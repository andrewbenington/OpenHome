use super::save_blocks::{BoxData, MyStatusFields, SvBlocks};
use super::{BOX_COLS, BOX_ROWS, BoxName, MAX_BOX_COUNT, Pk9, Pk9Buffer};
use crate::checksum::RefreshChecksum;
use crate::encryption::swish_crypto::{self, NumericBlock, SwishBlocks};
use crate::gen9_sv::save_blocks::SvBlockKey;
use crate::gen9_sv::{BOX_SLOTS, BoxIndex, BoxSlot};
use crate::result::{Error, Result, StdResult};
use crate::traits::PkmBytes;

#[cfg(feature = "wasm")]
use pkm_rs_types::BoundViolated;
use pkm_rs_types::OriginGame;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{BinaryGender, Language};
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use tsify::Tsify;

const SAVE_SIZE_BYTES_MIN: usize = 0x31626f;
const SAVE_SIZE_BYTES_MAX: usize = 0x43c000;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = ScarletVioletSaveRust))]
#[derive(Debug)]
pub struct ScarletVioletSave {
    bytes: Box<[u8]>,
    blocks: SvBlocks,
}

impl ScarletVioletSave {
    pub fn from_bytes(bytes: Box<[u8]>) -> Result<Self> {
        if bytes.len() < SAVE_SIZE_BYTES_MIN {
            return Err(Error::buffer_size_with_source(
                "scarlet/violet save file min",
                SAVE_SIZE_BYTES_MIN,
                bytes.len(),
            ));
        } else if bytes.len() > SAVE_SIZE_BYTES_MAX {
            return Err(Error::buffer_size_with_source(
                "scarlet/violet save file max",
                SAVE_SIZE_BYTES_MAX,
                bytes.len(),
            ));
        }

        let blocks = SvBlocks::from_blocks(
            SwishBlocks::from_bytes(&bytes)
                .map_err(|e| Error::other(&format!("SwishBlocks from_bytes: {e}")))?,
        )?;

        Ok(Self { bytes, blocks })
    }

    const fn my_status(&self) -> &MyStatusFields {
        &self.blocks.my_status
    }

    const fn box_data(&self) -> &BoxData {
        &self.blocks.pokemon_boxes
    }

    const fn box_data_mut(&mut self) -> &mut BoxData {
        &mut self.blocks.pokemon_boxes
    }

    fn box_name(&self, box_index: BoxIndex) -> BoxName {
        self.blocks.box_layouts.get_box_name(box_index)
    }

    pub const fn trainer_name(&self) -> SizedUtf16String<{ MyStatusFields::NAME_BYTE_LENGTH }> {
        self.my_status().trainer_name
    }

    pub const fn trainer_id(&self) -> u16 {
        self.my_status().trainer_id.get()
    }

    pub const fn secret_id(&self) -> u16 {
        self.my_status().secret_id.get()
    }

    const fn language(&self) -> Language {
        self.my_status().language
    }

    const fn copy_pokemon_bytes_to(&mut self, box_index: BoxIndex, box_slot: BoxSlot, data: &[u8]) {
        self.box_data_mut()
            .mon_bytes_at_mut(box_index, box_slot)
            .copy_from_slice(data)
    }

    fn get_mon_bytes_raw(&self, box_index: BoxIndex, box_slot: BoxSlot) -> Box<[u8]> {
        Box::from(self.box_data().mon_bytes_at(box_index, box_slot))
    }

    // TODO: show mon parse errors
    fn get_mon_at(&self, box_index: BoxIndex, box_slot: BoxSlot) -> Option<Pk9> {
        let mon_bytes = self.get_mon_bytes_raw(box_index, box_slot);
        if Pk9::is_empty_slot(&mon_bytes) {
            return None;
        }

        Pk9::from_encrypted_bytes(mon_bytes).ok()
    }

    fn set_mon_at(&mut self, box_index: BoxIndex, box_slot: BoxSlot, mut mon: Option<Pk9>) {
        let mon_bytes = if let Some(mon) = &mut mon {
            // stored stats and checksum should always be up-to-date in the box data
            mon.recalculate_stats();
            mon.refresh_checksum();

            mon.to_box_bytes_encrypted()
        } else {
            Self::empty_box_slot_bytes()
        };

        // write bytes to box slot
        self.copy_pokemon_bytes_to(box_index, box_slot, &mon_bytes);
    }

    fn get_ride_legend(&self) -> Option<Pk9> {
        Pk9::from_encrypted_bytes(Box::new(self.blocks.pokemon_boxes.ride_legendary_bytes)).ok()
    }

    pub fn empty_box_slot_bytes() -> Box<[u8]> {
        // ANY CHANGES TO THIS MUST BE TESTED IN A SCARLET/VIOLET SAVE FILE
        // ensure moving a Pokémon from a save slot in OpenHome such that
        // its previous slot is made empty does not result in a Bad Egg
        // being left in the slot
        let mut bytes = Box::new([0u8; Pk9::BOX_SIZE]);
        let mut buffer = Pk9Buffer::new_mut(bytes.as_mut_slice());

        buffer.refresh_checksum();
        buffer.encrypt();

        bytes
    }

    pub fn box_mon_count(&self, box_index: BoxIndex) -> usize {
        let mut count: usize = 0;

        for box_slot in 0..BOX_SLOTS {
            let box_slot = BoxSlot::check_bound(box_slot)
                .expect("all box indexes are valid if < MAX_BOX_COUNT");
            if Pk9Buffer::new(self.box_data().mon_bytes_at(box_index, box_slot))
                .species_game_index()
                != 0
            {
                count += 1;
            }
        }

        count
    }

    pub fn pc_mon_count(&self) -> usize {
        let mut count: usize = 0;

        for box_index in 0..MAX_BOX_COUNT {
            let box_index = BoxIndex::check_bound(box_index)
                .expect("all box indexes are valid if < MAX_BOX_COUNT");
            count += self.box_mon_count(box_index);
        }

        count
    }

    #[cfg(feature = "wasm")]
    pub fn prepare_bytes_for_saving(&self) -> Vec<u8> {
        swish_crypto::encrypt_blocks(
            &self
                .blocks
                .clone()
                .to_blocks()
                .into_values()
                .collect::<Vec<_>>(),
            self.bytes.len(),
        )
    }

    fn convert_ohpkm(
        &self,
        ohpkm: crate::ohpkm::OhpkmV2,
        strategy: crate::convert_strategy::ConvertStrategy,
    ) -> Result<Pk9> {
        use crate::ohpkm::OhpkmConvert;
        Pk9::from_ohpkm(&ohpkm, strategy)
    }

    const fn is_save(bytes: &[u8]) -> bool {
        bytes.len() >= SAVE_SIZE_BYTES_MIN && bytes.len() <= SAVE_SIZE_BYTES_MAX
    }

    fn display_tid(&self) -> String {
        let my_status = &self.blocks.my_status;
        crate::util::six_digit_trainer_id_from_parts(
            my_status.trainer_id.get(),
            my_status.secret_id.get(),
        )
    }

    fn game_of_origin(&self) -> OriginGame {
        self.my_status().game_raw.into()
    }

    const fn current_pc_box_idx(&self) -> usize {
        if let NumericBlock::UInt8(current_box) = self.blocks.current_box
            && current_box < MAX_BOX_COUNT
        {
            current_box as usize
        } else {
            0
        }
    }

    const fn set_current_pc_box_idx(&mut self, value: u8) {
        if value < MAX_BOX_COUNT
            && let NumericBlock::UInt8(current_box) = &mut self.blocks.current_box
        {
            *current_box = value
        }
    }

    fn includes_origin(origin: OriginGame) -> bool {
        origin.is_scarlet_violet()
    }
}

#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen(js_class = ScarletVioletSaveRust))]
#[allow(clippy::missing_const_for_fn)]
impl ScarletVioletSave {
    #[wasm_bindgen(js_name = getMonAt)]
    pub fn get_mon_at_wasm(&self, box_index: u8, box_slot: u8) -> Option<Pk9> {
        self.get_mon_at(box_index.try_into().ok()?, box_slot.try_into().ok()?)
    }

    #[wasm_bindgen(js_name = setMonAt)]
    pub fn set_mon_at_wasm(&mut self, box_index: u8, box_slot: u8, mon: Option<Pk9>) {
        if let Ok(box_index) = box_index.try_into()
            && let Ok(box_slot) = box_slot.try_into()
        {
            self.set_mon_at(box_index, box_slot, mon)
        }
    }

    #[wasm_bindgen(js_name = getRideLegend)]
    pub fn get_ride_legend_wasm(&self) -> Option<Pk9> {
        self.get_ride_legend()
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
        ohpkm: crate::ohpkm::OhpkmV2,
        strategy: crate::convert_strategy::ConvertStrategy,
    ) -> Result<Pk9> {
        self.convert_ohpkm(ohpkm, strategy)
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Box<[u8]>) -> Result<Self> {
        Self::from_bytes(bytes)
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
        (self.my_status().gender_raw == 1).into()
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

    #[wasm_bindgen(setter = currentPcBoxIdx)]
    pub fn set_current_pc_box_idx_wasm(&mut self, value: u8) {
        self.set_current_pc_box_idx(value)
    }

    #[wasm_bindgen(getter = gameOfOrigin)]
    pub fn game_of_origin_wasm(&self) -> OriginGame {
        self.game_of_origin()
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

    #[wasm_bindgen(js_name = getDisplayData)]
    pub fn display_data(&self) -> StdResult<js_sys::Object, JsValue> {
        // let mut map = BTreeMap::new();
        // map.insert("pokedexOwned", 3);

        // let serializer = Serializer::new().serialize_maps_as_objects(true);
        // map.serialize(&serializer).map_err(Into::into)
        let obj = js_sys::Object::new();
        let MyStatusFields {
            trainer_id,
            secret_id,
            gender_raw,
            language,
            trainer_name,
            ..
        } = self.blocks.my_status;

        // add_field(&obj, "Language", trainer_card.language)?;
        add_u16_hex(&obj, "Trainer ID", trainer_id.get())?;
        add_u16_hex(&obj, "Secret ID", secret_id.get())?;
        add_string(
            &obj,
            "Player Character",
            if gender_raw == 1 {
                "Juliana"
            } else {
                "Florian"
            },
        )?;
        add_string(&obj, "Language", language)?;
        add_string(&obj, "Trainer Name", trainer_name)?;

        add_string(&obj, "Version", SvVersion::detect(&self.blocks))?;

        Ok(obj)
    }

    #[wasm_bindgen(getter = saveVersion)]
    pub fn save_version_wasm(&self) -> SvVersion {
        SvVersion::detect(&self.blocks)
    }
}

fn display_u16_hex(value: impl Into<u16>) -> String {
    format!("0x{:04x}", value.into())
}

// fn add_field(
//     obj: &js_sys::Object,
//     key: impl Into<JsValue>,
//     value: impl Into<JsValue>,
// ) -> StdResult<bool, JsValue> {
//     js_sys::Reflect::set(obj, &key.into(), &value.into())
// }

fn add_string(
    obj: &js_sys::Object,
    key: impl Into<JsValue>,
    value: impl ToString,
) -> StdResult<bool, JsValue> {
    js_sys::Reflect::set(obj, &key.into(), &value.to_string().into())
}

fn add_u16_hex(
    obj: &js_sys::Object,
    key: impl Into<JsValue>,
    value: impl Into<u16>,
) -> StdResult<bool, JsValue> {
    js_sys::Reflect::set(obj, &key.into(), &display_u16_hex(value).into())
}

#[cfg_attr(feature = "wasm", derive(Tsify, serde::Serialize, serde::Deserialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[derive(Debug, Clone, Copy, strum::Display)]
pub enum SvVersion {
    #[strum(to_string = "Base Game")]
    #[serde(rename = "Base Game")]
    BaseGame,
    #[strum(to_string = "Teal Mask")]
    #[serde(rename = "Teal Mask")]
    TealMask,
    #[strum(to_string = "Indigo Disk")]
    #[serde(rename = "Indigo Disk")]
    IndigoDisk,
}

impl SvVersion {
    fn detect(blocks: &SvBlocks) -> Self {
        let other_blocks = &blocks.other_blocks;
        if other_blocks.has_block(SvBlockKey::BlueberryPoints) {
            Self::IndigoDisk
        } else if other_blocks.has_block(SvBlockKey::TeraRaidDlc) {
            Self::TealMask
        } else {
            Self::BaseGame
        }
    }
}

#[cfg(feature = "wasm")]
#[cfg(test)]
mod tests {
    use std::collections::HashMap;
    use std::path::Path;

    use super::*;
    use crate::convert_strategy::ConvertStrategy;
    use crate::gen9_sv::{BoxIndex, BoxSlot};
    use crate::ohpkm::{OhpkmConvert, OhpkmV2};
    use crate::tests;

    #[test]
    fn blocks_identical_after_serde() -> std::result::Result<(), Box<dyn std::error::Error>> {
        let save_path = Path::new("gen9-sv").join("violet");
        let save_bytes = tests::save_bytes_from_file(&save_path)?;
        let block_vec = swish_crypto::decrypt_blocks(&save_bytes)?;

        let mut original_blocks_by_key: HashMap<u32, swish_crypto::Block> = HashMap::new();
        for block in &block_vec {
            original_blocks_by_key.insert(block.key(), block.clone());
        }

        assert_eq!(block_vec.len(), 6242);

        let slice = save_bytes.into_boxed_slice();
        dbg!(slice.len());

        let save = ScarletVioletSave::from_bytes(slice)?;

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

        let save_path = Path::new("gen9-sv").join("violet");
        let save_bytes = tests::save_bytes_from_file(&save_path)?;
        let save = ScarletVioletSave::from_bytes(save_bytes.into_boxed_slice())?;

        for box_index in BoxIndex::all() {
            for box_slot in BoxSlot::all() {
                let mut mon_bytes = save.get_mon_bytes_raw(box_index, box_slot);
                let buffer = Pk9Buffer::new_mut(&mut mon_bytes).decrypted();
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
        let save_bytes = tests::save_bytes_from_file(&Path::new("gen9-sv").join("violet"))?;
        let mut save = ScarletVioletSave::from_bytes(save_bytes.into_boxed_slice())?;

        let ohpkm =
            tests::pkm_from_file::<OhpkmV2>(&Path::new("ohpkm").join("cinderace-mint.ohpkm"))?;

        let pk8 = Pk9::from_ohpkm(&ohpkm.0, ConvertStrategy::default())?;

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
    fn empty_slot_bytes_write_read_are_expected() -> tests::TestResult<()> {
        let save_bytes = tests::save_bytes_from_file(&Path::new("gen9-sv").join("violet"))?;
        let mut save = ScarletVioletSave::from_bytes(save_bytes.into_boxed_slice())?;

        let initially_full_box_index = BoxIndex::check_bound(1).expect("should be valid");
        let initially_full_slot = BoxSlot::check_bound(1).expect("should be valid");

        assert!(
            save.get_mon_at(initially_full_box_index, initially_full_slot)
                .is_some()
        );

        save.set_mon_at(initially_full_box_index, initially_full_slot, None);
        assert!(
            save.get_mon_at(initially_full_box_index, initially_full_slot)
                .is_none()
        );

        let mut expected_bytes = ScarletVioletSave::empty_box_slot_bytes();
        let mut actual_bytes =
            save.get_mon_bytes_raw(initially_full_box_index, initially_full_slot);
        Pk9Buffer::new_mut(&mut expected_bytes).decrypt();
        Pk9Buffer::new_mut(&mut actual_bytes).decrypt();

        tests::assert_ranges_match(&actual_bytes, &expected_bytes, None)
    }
}
