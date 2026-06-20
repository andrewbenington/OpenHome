use super::Pk8Buffer;
use super::pk8_buffer::Pk8BufferMut;
use super::{Pk8AbilityIndex, Pk8SpeciesAndForm};
use crate::checksum::{Checksum, RefreshChecksum};
use crate::result::{Error, Result};
use crate::traits::ModernEvs;
use crate::traits::{HasSpeciesAndForm, PkmBytes};

use pkm_rs_derive::IsShiny4096;
use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::helpers;
use pkm_rs_resources::metadata_source::MetadataSource;
use pkm_rs_resources::moves::{MoveDataOffsets, MoveIndex, MoveSlots};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::{ModernRibbon, ModernRibbonSet};
use pkm_rs_resources::species::{FormMetadata, SpeciesAndForm, SpeciesMetadata};
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{
    AbilityNumber, BinaryGender, ContestStats, FlagSet, HyperTraining, Ivs, Language,
    MarkingsSixShapesColors, OriginGame, Stats8, Stats16Le,
};
use pkm_rs_types::{Gender, PokeDate, TrainerMemory};
use serde::Serialize;

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

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "Pk8Wasm"))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny4096)]
pub struct Pk8 {
    pub encryption_constant: u32,
    pub sanity: u16,
    pub checksum: u16,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub species_and_form: Pk8SpeciesAndForm,
    pub held_item_index: u16,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub exp: u32,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ability_index: Pk8AbilityIndex,
    pub ability_num: AbilityNumber,
    pub is_favorite: bool,
    pub can_gigantamax: bool,
    pub markings: MarkingsSixShapesColors,
    pub personality_value: u32,
    pub nature: NatureIndex,
    pub mint_nature: NatureIndex,
    pub is_fateful_encounter: bool,
    pub gender: Gender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub evs: Stats8,
    pub contest: ContestStats,
    pub pokerus_byte: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ribbons: ModernRibbonSet<14, MAX_RIBBON_SWSH>,
    pub contest_memory_count: u8,
    pub battle_memory_count: u8,
    pub sociability: u32,
    pub height_scalar: u8,
    pub weight_scalar: u8,
    pub nickname: SizedUtf16String<26>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub moves: MoveSlots,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub relearn_moves: [MoveIndex; 4],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ivs: Ivs,
    pub is_egg: bool,
    pub is_nicknamed: bool,
    pub dynamax_level: u8,
    pub status_condition: u32,
    pub palma: u32,
    pub handler_name: SizedUtf16String<26>,
    pub handler_gender: BinaryGender,
    pub handler_language: Option<Language>,
    pub is_current_handler: bool,
    pub handler_id: u16,
    pub handler_friendship: u8,
    pub handler_memory: TrainerMemory,
    pub fullness: u8,
    pub enjoyment: u8,
    pub game_of_origin: OriginGame,
    pub game_of_origin_battle: Option<OriginGame>,
    pub language: Language,
    pub form_argument: u32,
    pub affixed_ribbon: Option<ModernRibbon>,
    pub trainer_name: SizedUtf16String<26>,
    pub trainer_friendship: u8,
    pub trainer_memory: TrainerMemory,
    pub egg_date: Option<PokeDate>,
    pub met_date: PokeDate,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub ball: Ball,
    pub met_level: u8,
    pub trainer_gender: BinaryGender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tr_flags_swsh: FlagSet<14>,
    pub home_tracker: Option<u64>,
    pub hyper_training: HyperTraining,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub stat_level: u8,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub current_hp: u16,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub stats: Stats16Le,
}

const MAX_RIBBON_SWSH: usize = ModernRibbon::TowerMaster as usize;

impl Pk8 {
    // ------------------------------------------------------------------
    // Deserialise from a Pk8Buffer (the single source of all byte offsets)
    // ------------------------------------------------------------------

    pub fn from_buffer<S: AsRef<[u8]>>(buf: &Pk8Buffer<S>) -> Result<Self> {
        let home_tracker_raw = buf.home_tracker_raw();
        let mut mon = Pk8 {
            encryption_constant: buf.encryption_constant(),
            sanity: buf.sanity(),
            checksum: buf.checksum(),
            species_and_form: buf.species_and_form()?,
            held_item_index: buf.held_item_index(),
            trainer_id: buf.trainer_id(),
            secret_id: buf.secret_id(),
            exp: buf.exp(),
            ability_index: AbilityIndexBounded::try_from(buf.ability_index_raw())?,
            ability_num: buf.ability_num()?,
            is_favorite: buf.is_favorite(),
            can_gigantamax: buf.can_gigantamax(),
            markings: buf.markings(),
            personality_value: buf.personality_value(),
            nature: buf.nature()?,
            mint_nature: buf.mint_nature()?,
            is_fateful_encounter: buf.is_fateful_encounter(),
            gender: buf.gender(),
            evs: buf.evs(),
            contest: buf.contest(),
            pokerus_byte: buf.pokerus_byte(),
            ribbons: buf.ribbons(),
            contest_memory_count: buf.contest_memory_count(),
            battle_memory_count: buf.battle_memory_count(),
            sociability: buf.sociability(),
            height_scalar: buf.height_scalar(),
            weight_scalar: buf.weight_scalar(),
            nickname: buf.nickname(),
            moves: buf.move_slots(),
            relearn_moves: [
                buf.relearn_move(0),
                buf.relearn_move(1),
                buf.relearn_move(2),
                buf.relearn_move(3),
            ],
            ivs: buf.ivs(),
            is_egg: buf.is_egg(),
            is_nicknamed: buf.is_nicknamed(),
            dynamax_level: buf.dynamax_level(),
            status_condition: buf.status_condition(),
            palma: buf.palma(),
            handler_name: buf.handler_name(),
            handler_gender: buf.handler_gender(),
            handler_language: buf.handler_language().ok(),
            is_current_handler: buf.is_current_handler(),
            handler_id: buf.handler_id(),
            handler_friendship: buf.handler_friendship(),
            handler_memory: buf.handler_memory(),
            fullness: buf.fullness(),
            enjoyment: buf.enjoyment(),
            game_of_origin: buf.game_of_origin(),
            game_of_origin_battle: buf.game_of_origin_battle(),
            language: buf.language()?,
            form_argument: buf.form_argument(),
            affixed_ribbon: buf.affixed_ribbon(),
            trainer_name: buf.trainer_name(),
            trainer_friendship: buf.trainer_friendship(),
            trainer_memory: buf.trainer_memory(),
            egg_date: buf.egg_date(),
            met_date: buf.met_date(),
            egg_location_index: buf.egg_location_index(),
            met_location_index: buf.met_location_index(),
            ball: buf.ball(),
            met_level: buf.met_level(),
            trainer_gender: buf.trainer_gender(),
            tr_flags_swsh: FlagSet::from_bytes(buf.tr_flags_swsh_raw()),
            home_tracker: if home_tracker_raw != 0 {
                Some(home_tracker_raw)
            } else {
                None
            },
            hyper_training: buf.hyper_training(),
            ..Default::default()
        };

        mon.stat_level = mon.calculate_level();
        mon.stats = mon.calculate_stats();
        mon.current_hp = mon.stats.hp;

        Ok(mon)
    }

    pub fn write_to_box_buffer(&self, buf: &mut Pk8BufferMut) {
        buf.set_encryption_constant(self.encryption_constant);
        buf.reset_sanity();
        buf.set_species_and_form(self.species_and_form.0);
        buf.set_held_item_index(self.held_item_index);
        buf.set_trainer_id(self.trainer_id);
        buf.set_secret_id(self.secret_id);
        buf.set_exp(self.exp);
        buf.set_ability_index(self.ability_index);
        buf.set_ability_num(self.ability_num);
        buf.set_is_favorite(self.is_favorite);
        buf.set_can_gigantamax(self.can_gigantamax);
        buf.set_markings(self.markings);
        buf.set_personality_value(self.personality_value);
        buf.set_nature(self.nature);
        buf.set_mint_nature(self.mint_nature);
        buf.set_gender(self.gender);
        buf.set_is_fateful_encounter(self.is_fateful_encounter);
        buf.set_evs(self.evs);
        buf.set_contest(self.contest);
        buf.set_pokerus_byte(self.pokerus_byte);
        buf.set_ribbons(self.ribbons);
        buf.set_contest_memory_count(self.contest_memory_count);
        buf.set_battle_memory_count(self.battle_memory_count);
        buf.set_sociability(self.sociability);
        buf.set_height_scalar(self.height_scalar);
        buf.set_weight_scalar(self.weight_scalar);
        buf.set_nickname(&self.nickname);
        buf.set_move_slots(&self.moves);
        buf.set_relearn_move(0, self.relearn_moves[0]);
        buf.set_relearn_move(1, self.relearn_moves[1]);
        buf.set_relearn_move(2, self.relearn_moves[2]);
        buf.set_relearn_move(3, self.relearn_moves[3]);
        buf.set_ivs(&self.ivs);
        buf.set_is_egg(self.is_egg);
        buf.set_is_nicknamed(self.is_nicknamed);
        buf.set_dynamax_level(self.dynamax_level);
        buf.set_status_condition(self.status_condition);
        buf.set_palma(self.palma);
        buf.set_handler_name(&self.handler_name);
        buf.set_handler_gender(self.handler_gender);
        if let Some(lang) = self.handler_language {
            buf.set_handler_language(lang);
        }
        buf.set_is_current_handler(self.is_current_handler);
        buf.set_handler_id(self.handler_id);
        buf.set_handler_friendship(self.handler_friendship);
        buf.set_handler_memory(self.handler_memory);
        buf.set_fullness(self.fullness);
        buf.set_enjoyment(self.enjoyment);
        buf.set_game_of_origin(self.game_of_origin);
        buf.set_game_of_origin_battle(self.game_of_origin_battle);
        buf.set_language(self.language);
        buf.set_form_argument(self.form_argument);
        buf.set_affixed_ribbon(self.affixed_ribbon);
        buf.set_trainer_name(&self.trainer_name);
        buf.set_trainer_friendship(self.trainer_friendship);
        buf.set_trainer_memory(self.trainer_memory);
        buf.set_egg_date(self.egg_date);
        buf.set_met_date(self.met_date);
        buf.set_egg_location_index(self.egg_location_index);
        buf.set_met_location_index(self.met_location_index);
        buf.set_ball(self.ball);
        buf.set_met_level(self.met_level);
        buf.set_trainer_gender(self.trainer_gender);
        buf.set_tr_flags_swsh(&self.tr_flags_swsh.to_bytes());
        buf.set_home_tracker_raw(self.home_tracker.unwrap_or(0));
        buf.set_hyper_training(self.hyper_training);
        buf.set_stat_level(self.stat_level);
        buf.set_current_hp(self.current_hp);
        buf.set_stats(self.stats);

        buf.refresh_checksum();
    }

    pub fn write_to_party_buffer(&self, buf: &mut Pk8BufferMut) {
        self.write_to_box_buffer(buf);
    }

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        match size {
            Self::BOX_SIZE => Self::from_buffer(&Pk8Buffer::new(bytes)),
            _ => Err(Error::buffer_size(Self::BOX_SIZE, size)),
        }
    }

    pub fn from_encrypted_bytes(bytes: &mut [u8]) -> Result<Self> {
        Self::from_buffer(Pk8Buffer::new_mut(bytes).decrypted())
    }

    pub fn to_box_bytes_encrypted(self) -> Box<[u8]> {
        let mut bytes = self.to_box_bytes();
        Pk8Buffer::new_mut(&mut bytes).encrypt();

        bytes
    }

    pub fn calculate_checksum(&self) -> u16 {
        let mut bytes = [0u8; Self::BOX_SIZE];
        self.write_box_bytes(&mut bytes);
        Pk8Buffer::new(&bytes).calculate_checksum()
    }

    pub fn refresh_checksum(&mut self) {
        self.checksum = self.calculate_checksum();
    }

    pub fn calculate_stats(&self) -> Stats16Le {
        helpers::calculate_stats_modern(
            MetadataSource::SwordShield,
            self.species_and_form.0,
            &self.ivs,
            &self.evs,
            self.calculate_level(),
            self.mint_nature.get_metadata(),
            Some(self.hyper_training),
        )
        .unwrap_or_else(|| {
            panic!(
                "pk8 has species/form present in sword + shield: {:#?}",
                self.species_and_form.0
            )
        })
    }

    pub fn recalculate_stats(&mut self) {
        self.stats = self.calculate_stats();
    }

    pub const fn move_data_offsets() -> MoveDataOffsets {
        super::MOVE_DATA_OFFSETS
    }

    pub fn empty_box_slot_bytes(trainer_name: &SizedUtf16String<26>) -> Box<[u8]> {
        let mut bytes = Box::new([0u8; Self::BOX_SIZE]);
        let mut buffer = Pk8BufferMut::new_mut(bytes.as_mut_slice());

        buffer.set_handler_name(trainer_name);
        buffer.set_is_current_handler(true);
        buffer.refresh_checksum();

        bytes
    }

    pub fn is_empty_slot(bytes: &[u8]) -> bool {
        let mut owned = bytes.to_owned();
        let mut buffer = Pk8Buffer::new_mut(&mut owned);
        buffer.decrypt();

        buffer.species_ndex() == 0
    }
}

impl PkmBytes for Pk8 {
    const BOX_SIZE: usize = 344;
    const PARTY_SIZE: usize = 344; // Party data is also stored in the PC now

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::try_from_bytes(bytes)
    }

    fn write_box_bytes(&self, bytes: &mut [u8]) {
        self.write_to_box_buffer(&mut Pk8BufferMut::new_mut(bytes))
    }

    fn to_box_bytes(&self) -> Box<[u8]> {
        let mut bytes = Box::new([0u8; Self::BOX_SIZE]);
        self.write_box_bytes(bytes.as_mut_slice());

        bytes
    }
}

impl HasSpeciesAndForm for Pk8 {
    fn get_species_metadata(&self) -> &'static SpeciesMetadata {
        self.species_and_form.0.get_species_metadata()
    }

    fn get_forme_metadata(&self) -> &'static FormMetadata {
        self.species_and_form.0.get_forme_metadata()
    }

    fn calculate_level(&self) -> u8 {
        self.get_species_metadata()
            .level_up_type
            .calculate_level(self.exp)
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_class = "Pk8Wasm")]
#[allow(clippy::missing_const_for_fn)]
impl Pk8 {
    #[wasm_bindgen(js_name = fromOhpkmBytes)]
    pub fn from_ohpkm_bytes(
        bytes: Vec<u8>,
        strategy: ConvertStrategy,
    ) -> core::result::Result<Pk8, JsValue> {
        let ohpkm = OhpkmV2::from_bytes(&bytes).map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(Pk8::from_ohpkm(&ohpkm, strategy))
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Vec<u8>) -> core::result::Result<Pk8, JsValue> {
        Pk8::from_bytes(&bytes).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = fromEncryptedBytes)]
    pub fn take_from_encrypted_bytes(mut bytes: Box<[u8]>) -> core::result::Result<Pk8, JsValue> {
        Pk8::from_encrypted_bytes(&mut bytes).map_err(crate::util::error_to_js)
    }

    #[wasm_bindgen(js_name = toBytes)]
    pub fn to_bytes_js(&self) -> Box<[u8]> {
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
            MoveIndex::from(value[0]),
            MoveIndex::from(value[1]),
            MoveIndex::from(value[2]),
            MoveIndex::from(value[3]),
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
        match SpeciesAndForm::new(national_dex, form_index) {
            Ok(species_and_form) => {
                self.species_and_form = species_and_form.try_into()?;
                Ok(())
            }
            Err(e) => Err(JsValue::from_str(&e.to_string())),
        }
    }

    #[wasm_bindgen(getter = nationalDex)]
    pub fn national_dex_js(&self) -> u16 {
        self.species_and_form.0.get_ndex_js()
    }

    #[wasm_bindgen(getter = formIndex)]
    pub fn form_index_js(&self) -> u16 {
        self.species_and_form.0.get_forme_index()
    }

    #[wasm_bindgen(getter = evs)]
    pub fn evs_js(&self) -> Stats16Le {
        self.evs.into()
    }

    #[wasm_bindgen(setter = evs)]
    pub fn set_evs_js(&mut self, v: Stats16Le) {
        self.evs = v.to_stats8_truncated()
    }

    #[wasm_bindgen(getter = ivs)]
    pub fn ivs_js(&self) -> Stats16Le {
        self.ivs.into()
    }

    #[wasm_bindgen(setter = ivs)]
    pub fn set_ivs_js(&mut self, v: Stats16Le) {
        self.ivs = v.to_ivs_capped()
    }

    #[wasm_bindgen(getter = trFlagsSwSh)]
    pub fn tr_flags_swsh_js(&self) -> Vec<u8> {
        self.tr_flags_swsh.to_bytes().to_vec()
    }

    #[wasm_bindgen(js_name = toOhpkm)]
    pub fn to_ohpkm(&self) -> Result<OhpkmV2> {
        OhpkmV2::convert_with_backup(self, &self.to_party_bytes())
    }

    #[wasm_bindgen(js_name = isEmptySlot)]
    pub fn is_empty_slot_wasm(bytes: &[u8]) -> bool {
        Self::is_empty_slot(bytes)
    }

    #[wasm_bindgen(js_name = emptyBoxSlotBytes)]
    pub fn empty_box_slot_bytes_js(trainer_name: &str) -> Box<[u8]> {
        Self::empty_box_slot_bytes(&trainer_name.into())
    }

    #[wasm_bindgen(js_name = calculateChecksum)]
    pub fn calculate_checksum_js(&self) -> u16 {
        self.calculate_checksum()
    }

    #[wasm_bindgen(js_name = calculateLevel)]
    pub fn calculate_level_js(&self) -> u8 {
        self.calculate_level()
    }

    #[wasm_bindgen(js_name = calculateStats)]
    pub fn calculate_stats_js(&self) -> Stats16Le {
        self.calculate_stats()
    }

    #[wasm_bindgen(js_name = recalculateStats)]
    pub fn recalculate_stats_js(&mut self) {
        self.recalculate_stats()
    }

    #[wasm_bindgen(js_name = toBoxBytesEncrypted)]
    pub fn to_box_bytes_encrypted_js(&self) -> Box<[u8]> {
        self.to_box_bytes_encrypted()
    }
}

impl ModernEvs for Pk8 {
    fn get_evs(&self) -> Stats8 {
        self.evs
    }
}

#[cfg(feature = "randomize")]
impl RandomizeAndFix for Pk8 {
    fn fix<R: rand::prelude::Rng>(&mut self, _: &mut R) {
        self.stat_level = self.calculate_level();
        self.stats = self.calculate_stats();
        self.current_hp = self.stats.hp;
        self.refresh_checksum();
    }
}

#[cfg(test)]
impl crate::tests::PkhexJson for Pk8 {
    fn to_pkhex_json_value(&self) -> std::result::Result<serde_json::Value, serde_json::Error> {
        let mut value = serde_json::to_value(self)?;
        value["nickname_trash"] = serde_json::json!(
            self.nickname
                .bytes()
                .iter()
                .map(|b| format!("{:02X}", b))
                .collect::<String>()
        );
        value["level"] = serde_json::json!(self.calculate_level());

        Ok(value)
    }
}

#[cfg(test)]
mod test {
    use std::path::PathBuf;

    use crate::checksum::Checksum;
    use crate::convert_strategy::ConvertStrategy;
    use crate::gen8_swsh::Pk8;
    use crate::gen8_swsh::pk8_buffer::Pk8Buffer;
    use crate::ohpkm::{OhpkmConvert, OhpkmV2};

    use crate::result::Error;
    use crate::tests::TestErrorWithSeed;
    use crate::tests::{self, TestResult};
    use crate::traits::IsShiny;

    use pkm_rs_resources::natures::NatureIndex;
    #[cfg(feature = "randomize")]
    use pkm_rs_types::randomize::RandomizeAndFix;
    use pkm_rs_types::{HyperTraining, Stats16Le};
    #[cfg(feature = "randomize")]
    use rand::{SeedableRng, rngs::StdRng};

    #[test]
    fn to_from_bytes() -> TestResult<()> {
        tests::to_from_bytes_all_in_dir::<Pk8>(
            &PathBuf::from("test-files").join("pkm-files").join("pk8"),
        )
    }

    #[cfg(feature = "randomize")]
    #[test]
    fn to_from_bytes_random() -> std::result::Result<(), TestErrorWithSeed> {
        for seed in 0..=1000 {
            let mon = Pk8::randomize_and_fix(&mut StdRng::seed_from_u64(seed));
            tests::find_inconsistencies_to_from_bytes(mon)
                .map_err(|error| TestErrorWithSeed { seed, error })?;
        }

        Ok(())
    }

    #[test]
    fn is_shiny() -> TestResult<()> {
        let path = PathBuf::from("pk8").join("bouffalant-shiny.pk8");
        let mon = tests::pkm_from_file::<Pk8>(&path)?.0;
        assert!(mon.is_shiny());

        Ok(())
    }

    #[test]
    fn compare_pkhex_json() -> TestResult<()> {
        tests::compare_pkhex_json_all_in_dir::<Pk8>(&PathBuf::from("pk8"))
    }

    #[test]
    fn nickname_garbage_preserved() -> TestResult<()> {
        let (mon, bytes) = tests::pkm_from_file::<Pk8>(
            &PathBuf::from("pk8").join("toxtricity-garbage-bytes.pk8"),
        )?;

        let mon_recreated = Pk8::from_ohpkm(
            &OhpkmV2::convert_with_backup(&mon, &bytes)?,
            ConvertStrategy::default(),
        );

        assert_eq!(mon.nickname.bytes()[..], mon_recreated.nickname.bytes()[..]);

        Ok(())
    }

    #[test]
    fn checksum() -> TestResult<()> {
        let (mon, bytes) = tests::pkm_from_file::<Pk8>(
            &PathBuf::from("pk8").join("toxtricity-garbage-bytes.pk8"),
        )?;

        let buffer = Pk8Buffer::new(&bytes);
        assert_eq!(
            buffer.checksum(),
            buffer.calculate_checksum(),
            "Pk8Buffer checksum calculation is correct"
        );

        assert_eq!(
            mon.checksum,
            mon.calculate_checksum(),
            "Checksum calculation remains correct after deserializing/reserializing"
        );

        Ok(())
    }

    #[test]
    fn from_ohpkm() -> TestResult<()> {
        let mon = tests::pkm_from_file::<OhpkmV2>(&PathBuf::from("ohpkm").join("Machamp.ohpkm"))?.0;

        let _ = Pk8::from_ohpkm(&mon, ConvertStrategy::default());

        Ok(())
    }

    #[test]
    fn to_from_ohpkm() -> TestResult<()> {
        tests::to_from_ohpkm_all_in_dir::<Pk8>(
            &PathBuf::from("test-files").join("pkm-files").join("pk8"),
        )
    }

    #[test]
    fn to_from_ohpkm_keeps_dynamax_level() -> TestResult<()> {
        let path = PathBuf::from("pk8").join("mienshao.pk8");
        let mon = tests::pkm_from_file::<Pk8>(&path)?.0;
        assert!(mon.dynamax_level > 0);

        let ohpkm = mon.to_ohpkm()?;
        assert_eq!(ohpkm.dynamax_level(), Some(mon.dynamax_level));

        let roundtrip = Pk8::from_ohpkm(&ohpkm, ConvertStrategy::default());
        assert_eq!(roundtrip.dynamax_level, mon.dynamax_level);

        Ok(())
    }

    #[test]
    fn empty_slot_checksum() -> TestResult<()> {
        let empty_slot = Pk8::empty_box_slot_bytes(&"RoC".into());
        let checksum = Pk8Buffer::new(&empty_slot).checksum();
        if checksum == 0 {
            return Err(Error::other("Empty slot checksum should be non-zero").into());
        }
        Ok(())
    }

    const ADAMANT: u8 = 3;
    const RELAXED: u8 = 7;

    #[test]
    fn mint_nature_hyper_train_stat_calc() -> TestResult<()> {
        let path = PathBuf::from("pk8").join("cinderace-mint-nature.pk8");
        let mon = tests::pkm_from_file::<Pk8>(&path)?.0;

        assert_eq!(mon.nature, NatureIndex::new_js(RELAXED));
        assert_eq!(mon.mint_nature, NatureIndex::new_js(ADAMANT));

        assert_eq!(mon.hyper_training, HyperTraining::all());

        assert_eq!(
            mon.calculate_stats(),
            Stats16Le {
                hp: 302,
                atk: 364,
                def: 186,
                spa: 149,
                spd: 186,
                spe: 337
            }
        );

        Ok(())
    }

    const CINDERACE_ENCRYPTED_BYTES_HEX: &str = "4864a28700008274311293404d71e90c70b5b4855c574d23a289c75541ad006eaf9666ee6fcc6fdb9c2bdae7c44eacbe48264ee13240d61a52203515337cb5051e95e7b472c8c34226559b9824097f7ea1da855aa4d7a6ca6a50ed1e5c6f2df0755f6a873d9170f133666ba75b1dab107e6c24df6aa4630147eeae002a2c58381ad1632f7f10480d2edbb5445ef022ba0c3b1dbd8dbc4678775a8a719d5668614041bba097d3bbbec3a5160df5e04b26d71caa3253fcaa0aee0573d96672cea0a07fdb872c593940e1fc849965f95aa1974d44fe415b329e6d9c70e559ea1659e6755fd9e36484ee4a2c230f218a20134a2fa4ee1a3cc046f722ad16ef08ec7bfcd67c624d4d9d58cf665dafe06aae792d1de9730cbd75507aeb02734c412a94898528578b4bc54f6e91f4661ba6034cb13bd829e706b059f3630174469c51e9e21fe4e506cd7df70712d2416270530c21b42185e6574d23";

    #[test]
    fn encrypted_bytes_match_expected_cinderace() -> TestResult<()> {
        let path = PathBuf::from("pk8").join("cinderace-mint-nature.pk8");
        let mon = tests::pkm_from_file::<Pk8>(&path)?.0;

        let encrypted_bytes = mon.to_box_bytes_encrypted();
        let encrypted_hex_str = tests::bytes_to_hex_string(&encrypted_bytes);

        assert_eq!(encrypted_hex_str, CINDERACE_ENCRYPTED_BYTES_HEX);

        Ok(())
    }

    const MR_MIME_ENCRYPTED_BYTES_HEX: &str = "3054f46800001f80b46eb9965768ce49a2294fea3d7122426aa817d66c6778704e581d0d304d307a2b7cf5039e8f2a70a259441d4d231c689dae851ad01add04236609d549137b4720563f83656a18e0580e350e88df0ea968c15e3b491459b0fab695ae20a03673fbad61085eab0630ffaf7aa45c457872b6ce8bbcf7e9e73d82a839f33bea007a48a2648b5dac84858beaaecfeef61c144999366e4dbb58b8b883b0cc5d13bdc2988ee3985666cd54f6a3cc17cee99ccfd38ac8fc02efbe00da4aaec47eb80eaf92de65f401d607706d487d2c20b651eabc7f8080e77c5fc6648935561042cda822d2cec795e66617beb68d7649e8a5b90f9bec0fd95ce90e1324f77a6a332337bc62aff7028bbc090b0e5ca7444f83b6ec15be493b930056e528853d63566f0949ff5eed5e45fa93f17efa44784d858cba0c03ed68d9f08d169f154af9c3d109e36ed0963e1083f8384a19ea97712042";

    #[test]
    fn encrypted_bytes_match_expected_mr_mime() -> TestResult<()> {
        let path = PathBuf::from("pk8").join("mr-mime-galar.pk8");
        let mon = tests::pkm_from_file::<Pk8>(&path)?.0;

        let encrypted_bytes = mon.to_box_bytes_encrypted();
        let encrypted_hex_str = tests::bytes_to_hex_string(&encrypted_bytes);

        assert_eq!(encrypted_hex_str, MR_MIME_ENCRYPTED_BYTES_HEX);

        Ok(())
    }
}
