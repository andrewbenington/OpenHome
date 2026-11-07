use crate::convert_strategy::ConvertStrategy;
use crate::ohpkm::{OhpkmConvert, OhpkmV2};
use crate::result::Result;
use crate::traits::{HasSpeciesAndForm, PkmBytes};
use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::abilities::AbilityIndexWasm;
use pkm_rs_resources::moves::MoveSlot;
use pkm_rs_resources::ribbons::ModernRibbon;
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_types::TrainerMemory;
use pkm_rs_types::{
    ContestStats, HyperTraining, JsResult, MarkingsSixShapesColors, Stats16Le, TeraType, TryIntoTs,
    TsResult,
};
use tsify::Ts;
use wasm_bindgen::prelude::*;

use super::compass::CompassPk9;
use super::pk9::Pk9;

#[wasm_bindgen(js_class = "Pk9Wasm")]
#[allow(clippy::missing_const_for_fn)]
impl Pk9 {
    #[wasm_bindgen(js_name = fromOhpkmBytes)]
    pub fn from_ohpkm_bytes(
        bytes: Vec<u8>,
        strategy: tsify::Ts<ConvertStrategy>,
    ) -> JsResult<Self> {
        let ohpkm = OhpkmV2::from_bytes(&bytes)?;
        Ok(Self::from_ohpkm(&ohpkm, strategy.to_rust()?)?)
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Vec<u8>) -> core::result::Result<Self, JsValue> {
        Self::from_bytes(&bytes).map_err(JsValue::from)
    }

    #[wasm_bindgen(js_name = fromEncryptedBytes)]
    pub fn take_from_encrypted_bytes(bytes: Box<[u8]>) -> core::result::Result<Self, JsValue> {
        Self::from_encrypted_bytes(bytes).map_err(JsValue::from)
    }

    #[wasm_bindgen(js_name = toBytes)]
    pub fn to_bytes_wasm(&self) -> Box<[u8]> {
        self.to_box_bytes()
    }

    #[wasm_bindgen(getter = abilityIndex)]
    pub fn ability_index(&self) -> AbilityIndexWasm {
        AbilityIndexWasm::try_from(self.ability_index.to_u16())
            .expect("AbilityIndexWasm should accept any valid ability index")
    }

    #[wasm_bindgen(setter = abilityIndex)]
    pub fn set_ability_index(&mut self, value: AbilityIndexWasm) -> Result<()> {
        self.ability_index = AbilityIndexBounded::try_from(value.to_u16())?;
        Ok(())
    }

    #[wasm_bindgen(getter)]
    pub fn move_indices(&self) -> Vec<u16> {
        self.moves.indices()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_indices(&mut self, value: &[u16]) {
        self.moves.set_indices(value);
    }

    #[wasm_bindgen(getter)]
    pub fn move_pp(&self) -> Vec<u8> {
        self.moves.pp()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_pp(&mut self, value: &[u8]) {
        self.moves.set_pp(value);
    }

    #[wasm_bindgen(getter)]
    pub fn move_pp_ups(&self) -> Vec<u8> {
        self.moves.pp_ups()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_pp_ups(&mut self, value: &[u8]) {
        self.moves.set_pp_ups(value);
    }

    #[wasm_bindgen(getter)]
    pub fn relearn_move_indices(&self) -> Vec<u16> {
        self.relearn_moves.into_iter().map(u16::from).collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_relearn_move_indices(&mut self, value: Vec<u16>) {
        self.relearn_moves = [
            MoveSlot::from(value[0]),
            MoveSlot::from(value[1]),
            MoveSlot::from(value[2]),
            MoveSlot::from(value[3]),
        ]
    }

    #[wasm_bindgen(getter)]
    pub fn ribbons(&self) -> Vec<String> {
        self.ribbons
            .get_ribbons()
            .iter()
            .map(|ribbon| ribbon.to_string())
            .collect()
    }

    #[wasm_bindgen(getter)]
    pub fn ribbon_bytes(&self) -> Vec<u8> {
        self.ribbons.to_bytes().into_iter().collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_ribbon_indices(&mut self, indices: Vec<usize>) {
        self.ribbons
            .set_ribbons(indices.into_iter().filter_map(ModernRibbon::from_index));
    }

    #[wasm_bindgen]
    pub fn set_species_and_form(
        &mut self,
        national_dex: u16,
        form_index: u16,
    ) -> core::result::Result<(), JsValue> {
        match SpeciesForm::new(national_dex, form_index) {
            Ok(species_and_form) => {
                self.species_and_form = species_and_form.try_into()?;
                Ok(())
            }
            Err(e) => Err(JsValue::from_str(&e.to_string())),
        }
    }

    #[wasm_bindgen(getter = nationalDex)]
    pub fn national_dex_wasm(&self) -> u16 {
        self.species_and_form.0.get_ndex() as u16
    }

    #[wasm_bindgen(getter = formIndex)]
    pub fn form_index_wasm(&self) -> u16 {
        self.species_and_form.0.get_form_index()
    }

    #[wasm_bindgen(getter = evs)]
    pub fn evs_wasm(&self) -> TsResult<Stats16Le> {
        Stats16Le::from(self.evs).try_into_ts()
    }

    #[wasm_bindgen(getter = ivs)]
    pub fn ivs_wasm(&self) -> TsResult<Stats16Le> {
        Stats16Le::from(self.ivs).try_into_ts()
    }

    #[wasm_bindgen(getter = teraTypeOriginal)]
    pub fn tera_type_original_wasm(&self) -> TsResult<TeraType> {
        self.tera_type_original.try_into_ts()
    }

    #[wasm_bindgen(getter = teraTypeOverride)]
    pub fn tera_type_override_wasm(&self) -> JsResult<Option<Ts<TeraType>>> {
        self.tera_type_override.map(|v| v.try_into_ts()).transpose()
    }

    #[wasm_bindgen(setter = teraTypeOverride)]
    pub fn set_tera_type_override_wasm(&mut self, v: Option<Ts<TeraType>>) -> JsResult<()> {
        self.tera_type_override = v.map(|v| v.to_rust()).transpose()?;

        Ok(())
    }

    #[wasm_bindgen(getter = obedienceLevel)]
    pub fn obedience_level_wasm(&self) -> u8 {
        self.obedience_level
    }

    #[wasm_bindgen(setter = obedienceLevel)]
    pub fn set_obedience_level_wasm(&mut self, v: u8) {
        self.obedience_level = v
    }

    #[wasm_bindgen(getter = tmFlagsBaseGame)]
    pub fn tm_flags_base_game_wasm(&self) -> Vec<u8> {
        self.tm_flags_base_game.to_bytes().to_vec()
    }

    #[wasm_bindgen(getter = tmFlagsDlc)]
    pub fn tm_flags_dlc_wasm(&self) -> Vec<u8> {
        self.tm_flags_dlc.to_bytes().to_vec()
    }

    #[wasm_bindgen(js_name = toOhpkm)]
    pub fn to_ohpkm(&self) -> Result<OhpkmV2> {
        OhpkmV2::convert_with_backup(self, &self.to_party_bytes())
    }

    #[wasm_bindgen(js_name = isEmptySlot)]
    pub fn is_empty_slot_wasm(bytes: &[u8]) -> bool {
        Self::is_empty_slot(bytes)
    }

    #[wasm_bindgen(js_name = calculateChecksum)]
    pub fn calculate_checksum_wasm(&self) -> u16 {
        self.calculate_checksum()
    }

    #[wasm_bindgen(js_name = calculateLevel)]
    pub fn calculate_level_wasm(&self) -> u8 {
        self.calculate_level()
    }

    #[wasm_bindgen(js_name = calculateStats)]
    pub fn calculate_stats_wasm(&self) -> TsResult<Stats16Le> {
        self.calculate_stats().try_into_ts()
    }

    #[wasm_bindgen(js_name = recalculateStats)]
    pub fn recalculate_stats_wasm(&mut self) {
        self.recalculate_stats()
    }

    #[wasm_bindgen(js_name = toBoxBytesEncrypted)]
    pub fn to_box_bytes_encrypted_wasm(&self) -> Box<[u8]> {
        self.to_box_bytes_encrypted()
    }

    #[wasm_bindgen(getter = markings)]
    pub fn markings_wasm(&self) -> TsResult<MarkingsSixShapesColors> {
        self.markings.try_into_ts()
    }

    #[wasm_bindgen(getter = trainerMemory)]
    pub fn trainer_memory_wasm(&self) -> TsResult<TrainerMemory> {
        self.trainer_memory.try_into_ts()
    }

    #[wasm_bindgen(getter = handlerMemory)]
    pub fn handler_memory_wasm(&self) -> TsResult<TrainerMemory> {
        self.handler_memory.try_into_ts()
    }

    #[wasm_bindgen(getter = contest)]
    pub fn contest_stats_wasm(&self) -> TsResult<ContestStats> {
        self.contest.try_into_ts()
    }

    #[wasm_bindgen(getter = hyperTraining)]
    pub fn hyper_training_wasm(&self) -> TsResult<HyperTraining> {
        self.hyper_training.try_into_ts()
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_class = "CompassPk9Wasm")]
#[allow(clippy::missing_const_for_fn)]
impl CompassPk9 {
    #[wasm_bindgen(js_name = "fromPk9Wasm")]
    pub fn from_pk9_wasm(v: &Pk9) -> Self {
        Self(*v)
    }

    #[wasm_bindgen(js_name = toOhpkm)]
    pub fn to_ohpkm(&self) -> Result<OhpkmV2> {
        OhpkmV2::convert_with_backup(self, &self.to_party_bytes())
    }
}
