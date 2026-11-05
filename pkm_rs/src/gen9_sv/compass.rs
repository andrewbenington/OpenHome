use crate::gen9_sv::Pk9;
use crate::result::Result;
use crate::traits::{HasSpeciesAndForm, PkmBytes};
use crate::traits::{IsShiny, ModernEvs};

use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::moves::MoveSlot;
use pkm_rs_resources::ribbons::ModernRibbon;
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_types::TrainerMemory;
use pkm_rs_types::{
    ContestStats, HyperTraining, JsResult, MarkingsSixShapesColors, Stats8, Stats16Le, TeraType,
    TryIntoTs, TsResult,
};
use serde::Serialize;

use tsify::Ts;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use crate::convert_strategy::ConvertStrategy;
#[cfg(feature = "wasm")]
use crate::ohpkm::{OhpkmConvert, OhpkmV2};
#[cfg(feature = "wasm")]
use pkm_rs_resources::abilities::AbilityIndexWasm;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::RandomizeAndFix;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "CompassPk9Wasm"))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct CompassPk9(Pk9);

impl CompassPk9 {
    pub const fn into_pk9(self) -> Pk9 {
        self.0
    }

    pub const fn from_pk9(v: Pk9) -> Self {
        Self(v)
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_class = "CompassPk9Wasm")]
#[allow(clippy::missing_const_for_fn)]
impl CompassPk9 {
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
        Pk9::from_encrypted_bytes(bytes)
            .map_err(JsValue::from)
            .map(Self)
    }

    #[wasm_bindgen(js_name = toBytes)]
    pub fn to_bytes_wasm(&self) -> Box<[u8]> {
        self.0.to_box_bytes()
    }

    #[wasm_bindgen(getter = abilityIndex)]
    pub fn ability_index(&self) -> AbilityIndexWasm {
        AbilityIndexWasm::try_from(self.0.ability_index.to_u16())
            .expect("AbilityIndexWasm should accept any valid ability index")
    }

    #[wasm_bindgen(setter = abilityIndex)]
    pub fn set_ability_index(&mut self, value: AbilityIndexWasm) -> Result<()> {
        self.0.ability_index = AbilityIndexBounded::try_from(value.to_u16())?;
        Ok(())
    }

    #[wasm_bindgen(getter)]
    pub fn move_indices(&self) -> Vec<u16> {
        self.0.moves.indices()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_indices(&mut self, value: &[u16]) {
        self.0.moves.set_indices(value);
    }

    #[wasm_bindgen(getter)]
    pub fn move_pp(&self) -> Vec<u8> {
        self.0.moves.pp()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_pp(&mut self, value: &[u8]) {
        self.0.moves.set_pp(value);
    }

    #[wasm_bindgen(getter)]
    pub fn move_pp_ups(&self) -> Vec<u8> {
        self.0.moves.pp_ups()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_pp_ups(&mut self, value: &[u8]) {
        self.0.moves.set_pp_ups(value);
    }

    #[wasm_bindgen(getter)]
    pub fn relearn_move_indices(&self) -> Vec<u16> {
        self.0.relearn_moves.into_iter().map(u16::from).collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_relearn_move_indices(&mut self, value: Vec<u16>) {
        self.0.relearn_moves = [
            MoveSlot::from(value[0]),
            MoveSlot::from(value[1]),
            MoveSlot::from(value[2]),
            MoveSlot::from(value[3]),
        ]
    }

    #[wasm_bindgen(getter)]
    pub fn ribbons(&self) -> Vec<String> {
        self.0
            .ribbons
            .get_ribbons()
            .iter()
            .map(|ribbon| ribbon.to_string())
            .collect()
    }

    #[wasm_bindgen(getter)]
    pub fn ribbon_bytes(&self) -> Vec<u8> {
        self.0.ribbons.to_bytes().into_iter().collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_ribbon_indices(&mut self, indices: Vec<usize>) {
        self.0
            .ribbons
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
                self.0.species_and_form = species_and_form.try_into()?;
                Ok(())
            }
            Err(e) => Err(JsValue::from_str(&e.to_string())),
        }
    }

    #[wasm_bindgen(getter = nationalDex)]
    pub fn national_dex_wasm(&self) -> u16 {
        self.0.species_and_form.0.get_ndex() as u16
    }

    #[wasm_bindgen(getter = formIndex)]
    pub fn form_index_wasm(&self) -> u16 {
        self.0.species_and_form.0.get_form_index()
    }

    #[wasm_bindgen(getter = evs)]
    pub fn evs_wasm(&self) -> TsResult<Stats16Le> {
        Stats16Le::from(self.0.evs).try_into_ts()
    }

    #[wasm_bindgen(getter = ivs)]
    pub fn ivs_wasm(&self) -> TsResult<Stats16Le> {
        Stats16Le::from(self.0.ivs).try_into_ts()
    }

    #[wasm_bindgen(getter = teraTypeOriginal)]
    pub fn tera_type_original_wasm(&self) -> TsResult<TeraType> {
        self.0.tera_type_original.try_into_ts()
    }

    #[wasm_bindgen(getter = teraTypeOverride)]
    pub fn tera_type_override_wasm(&self) -> JsResult<Option<Ts<TeraType>>> {
        self.0
            .tera_type_override
            .map(|v| v.try_into_ts())
            .transpose()
    }

    #[wasm_bindgen(setter = teraTypeOverride)]
    pub fn set_tera_type_override_wasm(&mut self, v: Option<Ts<TeraType>>) -> JsResult<()> {
        self.0.tera_type_override = v.map(|v| v.to_rust()).transpose()?;

        Ok(())
    }

    #[wasm_bindgen(getter = obedienceLevel)]
    pub fn obedience_level_wasm(&self) -> u8 {
        self.0.obedience_level
    }

    #[wasm_bindgen(setter = obedienceLevel)]
    pub fn set_obedience_level_wasm(&mut self, v: u8) {
        self.0.obedience_level = v
    }

    #[wasm_bindgen(getter = tmFlagsBaseGame)]
    pub fn tm_flags_base_game_wasm(&self) -> Vec<u8> {
        self.0.tm_flags_base_game.to_bytes().to_vec()
    }

    #[wasm_bindgen(getter = tmFlagsDlc)]
    pub fn tm_flags_dlc_wasm(&self) -> Vec<u8> {
        self.0.tm_flags_dlc.to_bytes().to_vec()
    }

    #[wasm_bindgen(js_name = toOhpkm)]
    pub fn to_ohpkm(&self) -> Result<OhpkmV2> {
        OhpkmV2::convert_with_backup(self, &self.0.to_party_bytes())
    }

    #[wasm_bindgen(js_name = isEmptySlot)]
    pub fn is_empty_slot_wasm(bytes: &[u8]) -> bool {
        Pk9::is_empty_slot(bytes)
    }

    #[wasm_bindgen(js_name = calculateChecksum)]
    pub fn calculate_checksum_wasm(&self) -> u16 {
        self.0.calculate_checksum()
    }

    #[wasm_bindgen(js_name = calculateLevel)]
    pub fn calculate_level_wasm(&self) -> u8 {
        self.0.calculate_level()
    }

    #[wasm_bindgen(js_name = calculateStats)]
    pub fn calculate_stats_wasm(&self) -> TsResult<Stats16Le> {
        self.0.calculate_stats().try_into_ts()
    }

    #[wasm_bindgen(js_name = recalculateStats)]
    pub fn recalculate_stats_wasm(&mut self) {
        self.0.recalculate_stats()
    }

    #[wasm_bindgen(js_name = toBoxBytesEncrypted)]
    pub fn to_box_bytes_encrypted_wasm(&self) -> Box<[u8]> {
        self.0.to_box_bytes_encrypted()
    }

    #[wasm_bindgen(getter = markings)]
    pub fn markings_wasm(&self) -> TsResult<MarkingsSixShapesColors> {
        self.0.markings.try_into_ts()
    }

    #[wasm_bindgen(getter = trainerMemory)]
    pub fn trainer_memory_wasm(&self) -> TsResult<TrainerMemory> {
        self.0.trainer_memory.try_into_ts()
    }

    #[wasm_bindgen(getter = handlerMemory)]
    pub fn handler_memory_wasm(&self) -> TsResult<TrainerMemory> {
        self.0.handler_memory.try_into_ts()
    }

    #[wasm_bindgen(getter = contest)]
    pub fn contest_stats_wasm(&self) -> TsResult<ContestStats> {
        self.0.contest.try_into_ts()
    }

    #[wasm_bindgen(getter = hyperTraining)]
    pub fn hyper_training_wasm(&self) -> TsResult<HyperTraining> {
        self.0.hyper_training.try_into_ts()
    }
}

impl IsShiny for CompassPk9 {
    fn is_shiny(&self) -> bool {
        self.0.is_shiny()
    }

    fn is_square_shiny(&self) -> bool {
        self.0.is_square_shiny()
    }
}

impl PkmBytes for CompassPk9 {
    const BOX_SIZE: usize = Pk9::BOX_SIZE;
    const PARTY_SIZE: usize = Pk9::BOX_SIZE;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Pk9::from_bytes(bytes).map(Self)
    }

    fn write_box_bytes(&self, bytes: &mut [u8]) {
        self.0.write_box_bytes(bytes);
    }

    fn write_party_bytes(&self, bytes: &mut [u8]) {
        self.write_box_bytes(bytes);
    }

    fn to_box_bytes(&self) -> Box<[u8]> {
        self.0.to_box_bytes()
    }

    fn to_party_bytes(&self) -> Box<[u8]> {
        self.0.to_party_bytes()
    }
}

impl ModernEvs for CompassPk9 {
    fn get_evs(&self) -> Stats8 {
        self.0.evs
    }
}

#[cfg(feature = "randomize")]
impl RandomizeAndFix for CompassPk9 {
    fn fix<R: rand::prelude::Rng>(&mut self, rng: &mut R) {
        self.0.fix(rng);
    }
}

#[cfg(test)]
impl crate::tests::PkhexJson for CompassPk9 {
    fn to_pkhex_json_value(&self) -> std::result::Result<serde_json::Value, serde_json::Error> {
        self.0.to_pkhex_json_value()
    }
}

#[cfg(test)]
mod tests {
    use super::Pk9;
    use crate::checksum::Checksum;
    use crate::convert_strategy::ConvertStrategy;
    use crate::gen9_sv::pk9_buffer::Pk9Buffer;
    use crate::ohpkm::{OhpkmConvert, OhpkmV2};
    use crate::tests::{self, TestResult};
    use crate::traits::IsShiny;

    #[cfg(feature = "randomize")]
    use pkm_rs_types::randomize::RandomizeAndFix;
    #[cfg(feature = "randomize")]
    use rand::{SeedableRng, rngs::StdRng};
    use std::path::PathBuf;

    #[test]
    fn to_from_bytes() -> TestResult<()> {
        tests::to_from_bytes_all_in_dir::<Pk9>(
            &PathBuf::from("test-files").join("pkm-files").join("pk9"),
        )
    }

    #[cfg(feature = "randomize")]
    #[test]
    fn to_from_bytes_random() -> std::result::Result<(), tests::TestErrorWithSeed> {
        for seed in 0..=1000 {
            let mon = Pk9::randomize_and_fix(&mut StdRng::seed_from_u64(seed));
            tests::find_inconsistencies_to_from_bytes(mon)
                .map_err(|error| tests::TestErrorWithSeed { seed, error })?;
        }

        Ok(())
    }

    #[test]
    fn is_shiny() -> TestResult<()> {
        let path = PathBuf::from("pk9").join("0446 ★ - Munchlax - AF1E69687576.pk9");
        let mon = tests::pkm_from_file::<Pk9>(&path)?.0;
        assert!(mon.is_shiny());

        Ok(())
    }

    #[test]
    fn compare_pkhex_wasm() -> TestResult<()> {
        tests::compare_pkhex_json_all_in_dir::<Pk9>(&PathBuf::from("pk9"))
    }

    #[test]
    fn compare_pkhex_encryption() -> TestResult<()> {
        tests::compare_pkhex_encryption_all_in_dir(
            &PathBuf::from("pk9"),
            Pk9::to_box_bytes_encrypted,
        )
    }

    #[test]
    fn nickname_garbage_preserved() -> TestResult<()> {
        let (mon, bytes) =
            tests::pkm_from_file::<Pk9>(&PathBuf::from("pk9").join("koraidon-garbage-bytes.pk9"))?;

        let mon_recreated = Pk9::from_ohpkm(
            &OhpkmV2::convert_with_backup(&mon, &bytes)?,
            ConvertStrategy::default(),
        )?;

        assert_eq!(mon.nickname.bytes()[..], mon_recreated.nickname.bytes()[..]);

        Ok(())
    }

    #[test]
    fn checksum() -> TestResult<()> {
        for result in tests::all_pkm_and_bytes_in_dir::<Pk9>(&PathBuf::from("pk9"))? {
            let tests::PkmDirEntry::<Pk9> { path, mon, bytes } = result?;
            let buffer = Pk9Buffer::new(&bytes);

            assert_eq!(
                buffer.checksum(),
                buffer.calculate_checksum(),
                "{path:?}: Pk9Buffer checksum calculation is correct"
            );

            assert_eq!(
                mon.checksum,
                mon.calculate_checksum(),
                "{path:?}: Checksum calculation remains correct after deserializing/reserializing"
            );
        }

        Ok(())
    }

    #[test]
    fn from_ohpkm() -> TestResult<()> {
        let mon = tests::pkm_from_file::<OhpkmV2>(&PathBuf::from("ohpkm").join("Machamp.ohpkm"))?.0;

        let _ = Pk9::from_ohpkm(&mon, ConvertStrategy::default());

        Ok(())
    }

    #[test]
    fn ohpkm_preserves_moves() -> TestResult<()> {
        let mon = tests::pkm_from_file::<Pk9>(
            &PathBuf::from("pk9").join("0128-01 - Tauros - 3ACEA55CFD17.pk9"),
        )?
        .0;

        let ohpkm = mon.to_ohpkm()?;

        for (index, (pk9_move, ohpkm_move)) in mon.moves.into_iter().zip(ohpkm.moves()).enumerate()
        {
            assert_eq!(
                pk9_move.move_index, ohpkm_move.move_index,
                "Move in slot {index} is preserved"
            );
        }

        Ok(())
    }

    #[test]
    fn to_from_ohpkm() -> TestResult<()> {
        tests::to_from_ohpkm_all_in_dir::<Pk9>(
            &PathBuf::from("test-files").join("pkm-files").join("pk9"),
        )
    }
}
