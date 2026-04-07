use super::Pk7Buffer;
use crate::checksum::{Checksum, RefreshChecksum};
#[cfg(feature = "wasm")]
use crate::convert_strategy::ConvertStrategy;
use crate::encryption;
use crate::gen7_alola::pk7_buffer::{Pk7BufferMut, Pk7BufferRef};
use crate::result::{Error, Result};
use crate::traits::ModernEvs;
use crate::traits::{HasSpeciesAndForme, PkmBytes};

use pkm_rs_derive::IsShiny4096;
use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::helpers;
use pkm_rs_resources::language::Language;
use pkm_rs_resources::moves::{MoveDataOffsets, MoveIndex, MoveSlots};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::{ModernRibbon, ModernRibbonSet};
use pkm_rs_resources::species::{FormeMetadata, SpeciesAndForme, SpeciesMetadata};
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{
    AbilityNumber, BinaryGender, ContestStats, HyperTraining, MarkingsSixShapesColors, OriginGame,
    Stats8, Stats16Le,
};
use pkm_rs_types::{Gender, Geolocations, PokeDate, TrainerMemory};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use crate::ohpkm::{OhpkmConvert, OhpkmV2};
#[cfg(feature = "wasm")]
use pkm_rs_resources::abilities::AbilityIndexWasm;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

const NEUROFORCE: u16 = 233;
type Pk7AbilityIndex = AbilityIndexBounded<NEUROFORCE>;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny4096)]
pub struct Pk7 {
    pub encryption_constant: u32,
    pub sanity: u16,
    pub checksum: u16,
    pub species_and_forme: SpeciesAndForme,
    pub held_item_index: u16,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub exp: u32,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ability_index: Pk7AbilityIndex,
    pub ability_num: AbilityNumber,
    pub markings: MarkingsSixShapesColors,
    pub personality_value: u32,
    pub nature: NatureIndex,
    pub is_fateful_encounter: bool,
    pub gender: Gender,
    pub evs: Stats8,
    pub contest: ContestStats,
    pub resort_event_status: u8,
    pub pokerus_byte: u8,
    pub super_training_flags: u32,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ribbons: ModernRibbonSet<7, MAX_RIBBON_ALOLA>,
    pub contest_memory_count: u8,
    pub battle_memory_count: u8,
    pub super_training_dist_flags: u8,
    pub form_argument: u32,
    pub nickname: SizedUtf16String<26>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub moves: MoveSlots,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub relearn_moves: [MoveIndex; 4],
    pub secret_super_training_unlocked: bool,
    pub secret_super_training_complete: bool,
    pub ivs: Stats8,
    pub is_egg: bool,
    pub is_nicknamed: bool,
    pub handler_name: SizedUtf16String<26>,
    pub handler_gender: BinaryGender,
    pub is_current_handler: bool,
    pub geolocations: Geolocations,
    pub handler_friendship: u8,
    pub handler_affection: u8,
    pub handler_memory: TrainerMemory,
    pub fullness: u8,
    pub enjoyment: u8,
    pub trainer_name: SizedUtf16String<26>,
    pub trainer_friendship: u8,
    pub trainer_affection: u8,
    pub trainer_memory: TrainerMemory,
    pub egg_date: Option<PokeDate>,
    pub met_date: PokeDate,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub ball: Ball,
    pub met_level: u8,
    pub trainer_gender: BinaryGender,
    pub hyper_training: HyperTraining,
    pub game_of_origin: OriginGame,
    pub country: u8,
    pub region: u8,
    pub console_region: u8,
    pub language: Language,
    pub status_condition: u32,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub stat_level: u8,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub form_argument_remain: u8,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub form_argument_elapsed: u8,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub current_hp: u16,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub stats: Stats16Le,
}

const MAX_RIBBON_ALOLA: usize = ModernRibbon::BattleTreeMaster as usize;

impl Pk7 {
    // ------------------------------------------------------------------
    // Deserialise from a Pk7Buffer (the single source of all byte offsets)
    // ------------------------------------------------------------------

    pub fn from_buffer(buf: &Pk7BufferRef) -> Result<Self> {
        let mut mon = Pk7 {
            encryption_constant: buf.encryption_constant(),
            sanity: buf.sanity(),
            checksum: buf.checksum(),
            species_and_forme: buf.species_and_forme()?,
            held_item_index: buf.held_item_index(),
            trainer_id: buf.trainer_id(),
            secret_id: buf.secret_id(),
            exp: buf.exp(),
            ability_index: AbilityIndexBounded::try_from(buf.ability_index_raw())?,
            ability_num: buf.ability_num()?,
            markings: buf.markings(),
            personality_value: buf.personality_value(),
            nature: buf.nature()?,
            is_fateful_encounter: buf.is_fateful_encounter(),
            gender: buf.gender(),
            evs: buf.evs(),
            contest: buf.contest(),
            resort_event_status: buf.resort_event_status(),
            pokerus_byte: buf.pokerus_byte(),
            super_training_flags: buf.super_training_flags(),
            ribbons: buf.ribbons(),
            contest_memory_count: buf.contest_memory_count(),
            battle_memory_count: buf.battle_memory_count(),
            super_training_dist_flags: buf.super_training_dist_flags(),
            form_argument: buf.form_argument(),
            nickname: buf.nickname(),
            moves: buf.move_slots(),
            relearn_moves: [
                buf.relearn_move(0),
                buf.relearn_move(1),
                buf.relearn_move(2),
                buf.relearn_move(3),
            ],
            secret_super_training_unlocked: buf.secret_super_training_unlocked(),
            secret_super_training_complete: buf.secret_super_training_complete(),
            ivs: buf.ivs(),
            is_egg: buf.is_egg(),
            is_nicknamed: buf.is_nicknamed(),
            handler_name: buf.handler_name(),
            handler_gender: buf.handler_gender(),
            is_current_handler: buf.is_current_handler(),
            geolocations: buf.geolocations(),
            handler_friendship: buf.handler_friendship(),
            handler_affection: buf.handler_affection(),
            handler_memory: buf.handler_memory(),
            fullness: buf.fullness(),
            enjoyment: buf.enjoyment(),
            trainer_name: buf.trainer_name(),
            trainer_friendship: buf.trainer_friendship(),
            trainer_affection: buf.trainer_affection(),
            trainer_memory: buf.trainer_memory(),
            egg_date: buf.egg_date(),
            met_date: buf.met_date(),
            egg_location_index: buf.egg_location_index(),
            met_location_index: buf.met_location_index(),
            ball: buf.ball(),
            met_level: buf.met_level(),
            trainer_gender: buf.trainer_gender(),
            hyper_training: buf.hyper_training(),
            game_of_origin: buf.game_of_origin(),
            country: buf.country(),
            region: buf.region(),
            console_region: buf.console_region(),
            language: buf.language()?,
            ..Default::default()
        };

        mon.stat_level = mon.calculate_level();
        mon.stats = mon.calculate_stats();
        mon.current_hp = mon.stats.hp;

        if buf.is_party() {
            mon.status_condition = buf.status_condition();
            mon.form_argument_remain = buf.form_argument_remain();
            mon.form_argument_elapsed = buf.form_argument_elapsed();
        }

        Ok(mon)
    }

    pub fn write_to_box_buffer(&self, buf: &mut Pk7BufferMut) {
        buf.set_encryption_constant(self.encryption_constant);
        buf.reset_sanity();
        buf.set_species_and_forme(self.species_and_forme);
        buf.set_held_item_index(self.held_item_index);
        buf.set_trainer_id(self.trainer_id);
        buf.set_secret_id(self.secret_id);
        buf.set_exp(self.exp);
        buf.set_ability_index_raw(self.ability_index.to_u16() as u8);
        buf.set_ability_num(self.ability_num);
        buf.set_markings(self.markings);
        buf.set_personality_value(self.personality_value);
        buf.set_nature(self.nature);
        buf.set_gender(self.gender);
        buf.set_is_fateful_encounter(self.is_fateful_encounter);
        buf.set_evs(self.evs);
        buf.set_contest(self.contest);
        buf.set_resort_event_status(self.resort_event_status);
        buf.set_pokerus_byte(self.pokerus_byte);
        buf.set_super_training_flags(self.super_training_flags);
        buf.set_ribbons(self.ribbons);
        buf.set_contest_memory_count(self.contest_memory_count);
        buf.set_battle_memory_count(self.battle_memory_count);
        buf.set_super_training_dist_flags(self.super_training_dist_flags);
        buf.set_form_argument(self.form_argument);
        buf.set_nickname(&self.nickname);
        buf.set_move_slots(&self.moves);
        buf.set_relearn_move(0, self.relearn_moves[0]);
        buf.set_relearn_move(1, self.relearn_moves[1]);
        buf.set_relearn_move(2, self.relearn_moves[2]);
        buf.set_relearn_move(3, self.relearn_moves[3]);
        buf.set_secret_super_training_unlocked(self.secret_super_training_unlocked);
        buf.set_secret_super_training_complete(self.secret_super_training_complete);
        buf.set_ivs(&self.ivs);
        buf.set_is_egg(self.is_egg);
        buf.set_is_nicknamed(self.is_nicknamed);
        buf.set_handler_name(&self.handler_name);
        buf.set_handler_gender(self.handler_gender);
        buf.set_is_current_handler(self.is_current_handler);
        buf.set_geolocations(self.geolocations);
        buf.set_handler_friendship(self.handler_friendship);
        buf.set_handler_affection(self.handler_affection);
        buf.set_handler_memory(self.handler_memory);
        buf.set_fullness(self.fullness);
        buf.set_enjoyment(self.enjoyment);
        buf.set_trainer_name(&self.trainer_name);
        buf.set_trainer_friendship(self.trainer_friendship);
        buf.set_trainer_affection(self.trainer_affection);
        buf.set_trainer_memory(self.trainer_memory);
        buf.set_egg_date(self.egg_date);
        buf.set_met_date(self.met_date);
        buf.set_egg_location_index(self.egg_location_index);
        buf.set_met_location_index(self.met_location_index);
        buf.set_ball(self.ball);
        buf.set_met_level(self.met_level);
        buf.set_trainer_gender(self.trainer_gender);
        buf.set_hyper_training(self.hyper_training);
        buf.set_game_of_origin(self.game_of_origin);
        buf.set_country(self.country);
        buf.set_region(self.region);
        buf.set_console_region(self.console_region);
        buf.set_language(self.language);

        buf.refresh_checksum();
    }

    pub fn write_to_party_buffer(&self, buf: &mut Pk7BufferMut) {
        self.write_to_box_buffer(buf);
        buf.set_status_condition(self.status_condition);
        buf.set_stat_level(self.stat_level);
        buf.set_form_argument_remain(self.form_argument_remain);
        buf.set_form_argument_elapsed(self.form_argument_elapsed);
        buf.set_current_hp(self.current_hp);
        buf.set_stats(self.stats);
    }

    // ------------------------------------------------------------------
    // Legacy byte-slice API (delegates to Pk7Buffer internally)
    // ------------------------------------------------------------------

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        match size {
            Self::BOX_SIZE => Self::from_buffer(&Pk7Buffer::box_span(bytes)),
            Self::PARTY_SIZE => Self::from_buffer(&Pk7Buffer::party_span(bytes)),
            _ => Err(Error::buffer_size(Self::BOX_SIZE, size)),
        }
    }

    pub fn from_encryped_bytes(bytes: &[u8]) -> Result<Self> {
        let decrypted = encryption::decrypt_pkm_bytes_gen_6_7(bytes);
        let unshuffled = encryption::unshuffle_blocks_gen_6_7(&decrypted);
        Self::from_bytes(&unshuffled)
    }

    pub fn to_box_bytes_encrypted(self) -> Vec<u8> {
        let shuffled = encryption::shuffle_blocks_gen_6_7(&self.to_box_bytes());
        encryption::decrypt_pkm_bytes_gen_6_7(&shuffled)
    }

    pub fn calculate_checksum(&self) -> u16 {
        let mut bytes = [0u8; Self::BOX_SIZE];
        self.write_box_bytes(&mut bytes);
        Pk7BufferRef::box_span(&bytes).calculate_checksum()
    }

    pub fn refresh_checksum(&mut self) {
        self.checksum = self.calculate_checksum();
    }

    pub fn calculate_stats(&self) -> Stats16Le {
        helpers::calculate_stats_modern(
            self.species_and_forme,
            &self.ivs,
            &self.evs,
            self.calculate_level(),
            self.nature.get_metadata(),
        )
    }

    pub const fn move_data_offsets() -> MoveDataOffsets {
        MoveDataOffsets {
            moves: 90,
            pp: 98,
            pp_ups: 102,
        }
    }
}

impl PkmBytes for Pk7 {
    const BOX_SIZE: usize = 232;
    const PARTY_SIZE: usize = 260;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::try_from_bytes(bytes)
    }

    fn write_box_bytes(&self, bytes: &mut [u8]) {
        self.write_to_box_buffer(&mut Pk7BufferMut::box_span_mut(bytes))
    }

    fn write_party_bytes(&self, bytes: &mut [u8]) {
        let mut buffer = Pk7BufferMut::party_span_mut(bytes);
        self.write_to_box_buffer(&mut buffer);
        self.write_to_party_buffer(&mut buffer);
    }

    fn to_box_bytes(&self) -> Vec<u8> {
        let mut bytes = [0; Self::BOX_SIZE];
        self.write_box_bytes(&mut bytes);

        Vec::from(bytes)
    }

    fn to_party_bytes(&self) -> Vec<u8> {
        let mut bytes = [0; Self::PARTY_SIZE];
        self.write_party_bytes(&mut bytes);

        Vec::from(bytes)
    }
}

impl HasSpeciesAndForme for Pk7 {
    fn get_species_metadata(&self) -> &'static SpeciesMetadata {
        self.species_and_forme.get_species_metadata()
    }

    fn get_forme_metadata(&self) -> &'static FormeMetadata {
        self.species_and_forme.get_forme_metadata()
    }

    fn calculate_level(&self) -> u8 {
        self.get_species_metadata()
            .level_up_type
            .calculate_level(self.exp)
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl Pk7 {
    #[wasm_bindgen(js_name = fromOhpkmBytes)]
    pub fn from_ohpkm_bytes(
        bytes: Vec<u8>,
        strategy: ConvertStrategy,
    ) -> core::result::Result<Pk7, JsValue> {
        let ohpkm = OhpkmV2::from_bytes(&bytes).map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(Pk7::from_ohpkm(&ohpkm, strategy))
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Vec<u8>) -> core::result::Result<Pk7, JsValue> {
        Pk7::from_bytes(&bytes).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = toBytes)]
    pub fn get_bytes_wasm(&self) -> Vec<u8> {
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
    pub fn set_species_and_forme(
        &mut self,
        national_dex: u16,
        forme_index: u16,
    ) -> core::result::Result<(), JsValue> {
        match SpeciesAndForme::new(national_dex, forme_index) {
            Ok(species_and_forme) => {
                self.species_and_forme = species_and_forme;
                Ok(())
            }
            Err(e) => Err(JsValue::from_str(&e.to_string())),
        }
    }

    #[wasm_bindgen(getter = languageString)]
    pub fn language_string(&self) -> String {
        self.language.as_str().to_owned()
    }

    #[wasm_bindgen(js_name = toOhpkm)]
    pub fn to_ohpkm(&self) -> OhpkmV2 {
        OhpkmV2::from(self)
    }
}

impl ModernEvs for Pk7 {
    fn get_evs(&self) -> Stats8 {
        self.evs
    }
}

#[cfg(test)]
mod test {
    use std::path::PathBuf;

    use crate::convert_strategy::ConvertStrategy;
    use crate::gen7_alola::Pk7;
    use crate::ohpkm::{OhpkmConvert, OhpkmV2};

    #[cfg(feature = "randomize")]
    use crate::tests::TestErrorWithSeed;
    use crate::tests::{self, TestResult};
    use crate::traits::IsShiny;

    #[cfg(feature = "randomize")]
    use pkm_rs_types::randomize::Randomize;
    #[cfg(feature = "randomize")]
    use rand::{SeedableRng, rngs::StdRng};

    #[test]
    fn to_from_bytes() -> TestResult<()> {
        tests::to_from_bytes_all_in_dir::<Pk7>(
            &PathBuf::from("test-files").join("pkm-files").join("pk7"),
        )
    }

    #[cfg(feature = "randomize")]
    #[test]
    fn to_from_bytes_random() -> std::result::Result<(), TestErrorWithSeed> {
        for seed in 0..=1000 {
            let mon = Pk7::randomized(&mut StdRng::seed_from_u64(seed));
            tests::find_inconsistencies_to_from_bytes(mon)
                .map_err(|error| TestErrorWithSeed { seed, error })?;
        }

        Ok(())
    }

    #[test]
    fn is_shiny() -> TestResult<()> {
        let path = PathBuf::from("pk7").join("slowpoke-shiny.pk7");
        let mon = tests::pkm_from_file::<Pk7>(&path)?.0;
        assert!(mon.is_shiny());

        Ok(())
    }

    #[test]
    fn compare_pkhex_json() -> TestResult<()> {
        tests::compare_pkhex_json_all_in_dir::<Pk7>(&PathBuf::from("pk7"))
    }

    #[test]
    fn nickname_garbage_preserved() -> TestResult<()> {
        let mon =
            tests::pkm_from_file::<Pk7>(&PathBuf::from("pk7").join("pelipper-garbage-bytes.pk7"))?
                .0;

        // 'r' at position 14 should be leftover from 'Pelipper'
        assert_eq!(mon.nickname.bytes()[14], b'r');

        let mon_recreated = Pk7::from_ohpkm(&OhpkmV2::from(&mon), ConvertStrategy::default());

        // leftover 'r' should be preserved after conversion to/from OHPKM
        assert_eq!(mon_recreated.nickname.bytes()[14], b'r');

        Ok(())
    }

    #[test]
    fn checksum() -> TestResult<()> {
        let mon =
            tests::pkm_from_file::<Pk7>(&PathBuf::from("pk7").join("primarina-garbage-bytes.pk7"))?
                .0;
        assert_eq!(mon.checksum, mon.calculate_checksum());

        Ok(())
    }

    #[test]
    fn from_ohpkm() -> TestResult<()> {
        let mon = tests::pkm_from_file::<OhpkmV2>(&PathBuf::from("ohpkm").join("Machamp.ohpkm"))?.0;

        let _ = Pk7::from_ohpkm(&mon, ConvertStrategy::default());

        Ok(())
    }

    const STEADFAST: u16 = 80;
    const SHARPNESS: u16 = 292;

    #[test]
    fn from_ohpkm_ability_change() -> TestResult<()> {
        let mon = tests::pkm_from_file::<OhpkmV2>(
            &PathBuf::from("ohpkm").join("gallade-sharpness-alpha.ohpkm"),
        )?
        .0;

        assert_eq!(mon.ability_index().to_u16(), SHARPNESS);

        let converted_pk7 = Pk7::from_ohpkm(&mon, ConvertStrategy::default());

        // Gallade's Sharpness should be converted to Steadfast when converting to Pk7, since Sharpness is Gen 8+ and Pk7 can only represent Gen 7 abilities
        assert_eq!(converted_pk7.ability_index.to_u16(), STEADFAST);

        Ok(())
    }

    #[test]
    fn to_from_ohpkm() -> TestResult<()> {
        tests::to_from_ohpkm_all_in_dir::<Pk7>(
            &PathBuf::from("test-files").join("pkm-files").join("pk7"),
        )
    }
}
