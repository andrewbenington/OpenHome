use super::Pk3Buffer;
use crate::checksum::{Checksum, RefreshChecksum};
use crate::conversion::gen3_pokemon_index::Gen3PokemonIndex;
#[cfg(feature = "wasm")]
use crate::convert_strategy::ConvertStrategy;
use crate::encryption;
use crate::gen3::pk3_buffer::{Pk3BufferMut, Pk3BufferRef};
#[cfg(feature = "wasm")]
use crate::ohpkm::{OhpkmConvert, OhpkmV2};
use crate::result::{Error, Result};
use crate::strings::Gen3String;
use crate::traits::{AsBytesMut, ModernEvs};
use crate::traits::{HasSpeciesAndForm, PkmBytes};
use pkm_rs_derive::IsShiny4096;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::helpers;
use pkm_rs_resources::moves::MoveSlots;
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::Gen3RibbonSet;
use pkm_rs_resources::species::form_metadata::MetadataSource;
use pkm_rs_resources::species::{FormMetadata, NatDexIndex, SpeciesAndForm, SpeciesMetadata};
use pkm_rs_types::Gender;
#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
use pkm_rs_types::{
    BinaryGender, ContestStats, Language, MarkingsFourShapes, NationalDex, OriginGame,
    SimpleAbilityNumber, Stats8, Stats16Le,
};
use serde::{Serialize, Serializer};
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny4096)]
#[serde(remote = "Self")]
pub struct Pk3 {
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
    pub national_dex: Gen3PokemonIndex,
    pub sanity: u16,
    pub checksum: u16,
    pub held_item_index: u16,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub exp: u32,
    pub ability_num: SimpleAbilityNumber,
    pub markings: MarkingsFourShapes,
    pub personality_value: u32,
    pub is_fateful_encounter: bool,
    pub gender: Gender,
    pub evs: Stats8,
    pub contest: ContestStats,
    pub pokerus_byte: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ribbons: Gen3RibbonSet,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub nickname: Gen3String<10>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub moves: MoveSlots,
    pub ivs: Stats8,
    pub is_egg: bool,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub trainer_name: Gen3String<7>,
    pub trainer_friendship: u8,
    pub met_location_index: u8,
    pub ball: Ball,
    pub met_level: u8,
    pub trainer_gender: BinaryGender,
    pub game_of_origin: OriginGame,
    pub language: Language,
    pub status_condition: u32,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub stat_level: u8,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub current_hp: u16,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub stats: Stats16Le,
}

impl Pk3 {
    // ------------------------------------------------------------------
    // Deserialise from a Pk3Buffer (the single source of all byte offsets)
    // ------------------------------------------------------------------

    pub fn from_buffer(buf: &Pk3BufferRef) -> Result<Self> {
        let mut mon = Pk3 {
            national_dex: Gen3PokemonIndex::new(buf.species_ndex())?,
            sanity: buf.sanity(),
            checksum: buf.checksum(),
            held_item_index: buf.held_item_index(),
            trainer_id: buf.trainer_id(),
            secret_id: buf.secret_id(),
            exp: buf.exp(),
            ability_num: buf.ability_num(),
            markings: buf.markings(),
            personality_value: buf.personality_value(),
            is_fateful_encounter: buf.is_fateful_encounter(),
            evs: buf.evs(),
            contest: buf.contest(),
            pokerus_byte: buf.pokerus_byte(),
            ribbons: buf.ribbons(),
            nickname: buf.nickname(),
            moves: buf.move_slots(),
            ivs: buf.ivs(),
            is_egg: buf.is_egg(),
            trainer_name: buf.trainer_name(),
            trainer_friendship: buf.trainer_friendship(),
            met_location_index: buf.met_location_index(),
            ball: buf.ball(),
            met_level: buf.met_level(),
            trainer_gender: buf.trainer_gender(),
            game_of_origin: buf.game_of_origin(),
            language: buf.language()?,
            ..Default::default()
        };

        mon.stat_level = mon.calculate_level();
        mon.stats = mon.calculate_stats();
        mon.current_hp = mon.stats.hp;

        if buf.is_party() {
            mon.status_condition = buf.status_condition();
        }

        Ok(mon)
    }

    pub fn write_to_box_buffer(&self, buf: &mut Pk3BufferMut) {
        buf.set_species_ndex(self.national_dex.into());
        buf.reset_sanity();
        buf.set_held_item_index(self.held_item_index);
        buf.set_trainer_id(self.trainer_id);
        buf.set_secret_id(self.secret_id);
        buf.set_exp(self.exp);
        buf.set_ability_num(self.ability_num);
        buf.set_markings(self.markings);
        buf.set_personality_value(self.personality_value);
        buf.set_is_fateful_encounter(self.is_fateful_encounter);
        buf.set_evs(self.evs);
        buf.set_contest(self.contest);
        buf.set_pokerus_byte(self.pokerus_byte);
        buf.set_ribbons(self.ribbons);
        buf.set_nickname(&self.nickname);
        buf.set_move_slots(&self.moves);
        buf.set_ivs(&self.ivs);
        buf.set_is_egg(self.is_egg);
        buf.set_trainer_name(&self.trainer_name);
        buf.set_trainer_friendship(self.trainer_friendship);
        buf.set_met_location_index(self.met_location_index);
        buf.set_ball(self.ball);
        buf.set_met_level(self.met_level);
        buf.set_trainer_gender(self.trainer_gender);
        buf.set_game_of_origin(self.game_of_origin);
        buf.set_language(self.language);

        buf.refresh_checksum();
    }

    pub fn write_to_party_buffer(&self, buf: &mut Pk3BufferMut) {
        self.write_to_box_buffer(buf);
        buf.set_status_condition(self.status_condition);
        buf.set_stat_level(self.stat_level);
        buf.set_current_hp(self.current_hp);
        buf.set_stats(self.stats);
    }

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        match size {
            Self::BOX_SIZE => Self::from_buffer(&Pk3Buffer::box_span(bytes)),
            Self::PARTY_SIZE => Self::from_buffer(&Pk3Buffer::party_span(bytes)),
            _ => Err(Error::buffer_size(Self::BOX_SIZE, size)),
        }
    }

    pub fn from_encryped_bytes(bytes: &[u8]) -> Result<Self> {
        let decrypted = encryption::decrypt_pkm_bytes_gen_3(bytes);
        let unshuffled = encryption::unshuffle_blocks_gen_3(&decrypted);
        Self::from_bytes(&unshuffled)
    }

    pub fn to_box_bytes_encrypted(self) -> Vec<u8> {
        let shuffled = encryption::shuffle_blocks_gen_3(&self.to_box_bytes());
        encryption::decrypt_pkm_bytes_gen_3(&shuffled)
    }

    pub fn calculate_checksum(&self) -> u16 {
        let mut bytes = [0u8; Self::BOX_SIZE];
        self.write_box_bytes(&mut bytes);
        Pk3BufferRef::box_span(&bytes).calculate_checksum()
    }

    pub fn refresh_checksum(&mut self) {
        self.checksum = self.calculate_checksum();
    }

    pub fn nature(&self) -> NatureIndex {
        NatureIndex::new_from_pid(self.personality_value)
    }

    pub fn species_and_form(&self) -> SpeciesAndForm {
        SpeciesAndForm::new_valid_ndex(
            self.national_dex.to_national_dex(),
            form_index_from_pid(self.national_dex.to_national_dex(), self.personality_value) as u16,
        )
        .expect("gen 3 form is valid")
    }

    pub fn calculate_stats(&self) -> Stats16Le {
        helpers::calculate_stats_modern(
            MetadataSource::Emerald,
            self.species_and_form(),
            &self.ivs,
            &self.evs,
            self.calculate_level(),
            self.nature().get_metadata(),
        )
        .expect("pk3 has valid species/form, present in Emerald data")
    }

    pub fn empty_box_slot_bytes() -> Vec<u8> {
        let mut bytes = [0; Self::BOX_SIZE];
        let mut buffer = Pk3BufferMut::box_span_mut(&mut bytes);

        buffer.refresh_checksum();

        let bytes = buffer.as_bytes_mut();
        encryption::decrypt_pkm_bytes_gen_6_7(&encryption::shuffle_blocks_gen_6_7(bytes))
    }

    pub fn is_empty_slot(bytes: &[u8]) -> bool {
        let decrypted = encryption::decrypt_pkm_bytes_gen_6_7(bytes);
        let unshuffled = encryption::unshuffle_blocks_gen_6_7(&decrypted);
        let buffer = Pk3BufferRef::box_span(&unshuffled);

        buffer.species_ndex() == 0
    }
}

impl Serialize for Pk3 {
    //fn serialzie(&self, serializer)
    fn serialize<S>(&self, serialzier: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        Self::serialize(self, serialzier)
    }
}

impl PkmBytes for Pk3 {
    const BOX_SIZE: usize = 80;
    const PARTY_SIZE: usize = 100;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::try_from_bytes(bytes)
    }

    fn write_box_bytes(&self, bytes: &mut [u8]) {
        self.write_to_box_buffer(&mut Pk3BufferMut::box_span_mut(bytes))
    }

    fn write_party_bytes(&self, bytes: &mut [u8]) {
        let mut buffer = Pk3BufferMut::party_span_mut(bytes);
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

impl HasSpeciesAndForm for Pk3 {
    fn get_species_metadata(&self) -> &'static SpeciesMetadata {
        self.species_and_form().get_species_metadata()
    }

    fn get_forme_metadata(&self) -> &'static FormMetadata {
        self.species_and_form().get_forme_metadata()
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
impl Pk3 {
    #[wasm_bindgen(js_name = fromOhpkmBytes)]
    pub fn from_ohpkm_bytes(
        bytes: Vec<u8>,
        strategy: ConvertStrategy,
    ) -> core::result::Result<Pk3, JsValue> {
        let ohpkm = OhpkmV2::from_bytes(&bytes).map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(Pk3::from_ohpkm(&ohpkm, strategy))
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Vec<u8>) -> core::result::Result<Pk3, JsValue> {
        Pk3::from_bytes(&bytes).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = toBytes)]
    pub fn get_bytes_wasm(&self) -> Vec<u8> {
        self.to_box_bytes()
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
    pub fn ribbons(&self) -> Vec<String> {
        self.ribbons
            .get_ribbons()
            .iter()
            .map(|ribbon| ribbon.to_string())
            .collect()
    }

    #[wasm_bindgen(getter = languageString)]
    pub fn language_string(&self) -> String {
        self.language.as_str().to_owned()
    }

    #[wasm_bindgen(js_name = toOhpkm)]
    pub fn to_ohpkm(&self) -> OhpkmV2 {
        OhpkmV2::from(self)
    }

    #[wasm_bindgen(js_name = isEmptySlot)]
    pub fn is_empty_slot_wasm(bytes: Vec<u8>) -> bool {
        Self::is_empty_slot(&bytes)
    }
}

impl ModernEvs for Pk3 {
    fn get_evs(&self) -> Stats8 {
        self.evs
    }
}

pub fn form_index_from_pid(national_dex: NatDexIndex, pid: u32) -> u8 {
    if national_dex != NationalDex::Unown.into() {
        return 0;
    }

    let mut letter_value = (pid >> 24) & 0x3;

    letter_value = ((pid >> 16) & 0x3) | (letter_value << 2);
    letter_value = ((pid >> 8) & 0x3) | (letter_value << 2);
    letter_value = (pid & 0x3) | (letter_value << 2);

    (letter_value % 28) as u8
}

#[cfg(test)]
mod test {
    use std::path::PathBuf;

    use crate::convert_strategy::ConvertStrategy;
    use crate::gen3::Pk3;
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
        tests::to_from_bytes_all_in_dir::<Pk3>(
            &PathBuf::from("test-files").join("pkm-files").join("pk3"),
        )
    }

    #[cfg(feature = "randomize")]
    #[test]
    fn to_from_bytes_random() -> std::result::Result<(), TestErrorWithSeed> {
        for seed in 0..=1000 {
            let mon = Pk3::randomized(&mut StdRng::seed_from_u64(seed));
            println!("Testing seed {seed}: {mon:#?}");
            tests::find_inconsistencies_to_from_bytes(mon)
                .map_err(|error| TestErrorWithSeed { seed, error })?;
        }

        Ok(())
    }

    #[test]
    fn is_shiny() -> TestResult<()> {
        let path = PathBuf::from("pk3").join("unown-e.pk3");
        let mon = tests::pkm_from_file::<Pk3>(&path)?.0;
        assert!(mon.is_shiny());

        Ok(())
    }

    #[test]
    fn compare_pkhex_json() -> TestResult<()> {
        tests::compare_pkhex_json_all_in_dir::<Pk3>(&PathBuf::from("pk3"))
    }

    // #[test]
    // fn nickname_garbage_preserved() -> TestResult<()> {
    //     let mon =
    //         tests::pkm_from_file::<Pk3>(&PathBuf::from("pk3").join("pelipper-garbage-bytes.pk3"))?
    //             .0;

    //     // 'r' at position 14 should be leftover from 'Pelipper'
    //     assert_eq!(mon.nickname.bytes()[14], b'r');

    //     let mon_recreated = Pk3::from_ohpkm(&OhpkmV2::from(&mon), ConvertStrategy::default());

    //     // leftover 'r' should be preserved after conversion to/from OHPKM
    //     assert_eq!(mon_recreated.nickname.bytes()[14], b'r');

    //     Ok(())
    // }

    #[test]
    fn checksum() -> TestResult<()> {
        let mon =
            tests::pkm_from_file::<Pk3>(&PathBuf::from("pk3").join("primarina-garbage-bytes.pk3"))?
                .0;
        assert_eq!(mon.checksum, mon.calculate_checksum());

        Ok(())
    }

    #[test]
    fn from_ohpkm() -> TestResult<()> {
        let mon = tests::pkm_from_file::<OhpkmV2>(&PathBuf::from("ohpkm").join("Machamp.ohpkm"))?.0;

        let _ = Pk3::from_ohpkm(&mon, ConvertStrategy::default());

        Ok(())
    }

    // const STEADFAST: u16 = 80;
    // const SHARPNESS: u16 = 292;

    // #[test]
    // fn from_ohpkm_ability_change() -> TestResult<()> {
    //     let mon = tests::pkm_from_file::<OhpkmV2>(
    //         &PathBuf::from("ohpkm").join("gallade-sharpness-alpha.ohpkm"),
    //     )?
    //     .0;

    //     assert_eq!(mon.ability_index().to_u16(), SHARPNESS);

    //     let converted_pk3 = Pk3::from_ohpkm(&mon, ConvertStrategy::default());

    //     // Gallade's Sharpness should be converted to Steadfast when converting to Pk3, since Sharpness is Gen 8+ and Pk3 can only represent Gen 7 abilities
    //     assert_eq!(converted_pk3.ability_index.to_u16(), STEADFAST);

    //     Ok(())
    // }

    #[test]
    fn to_from_ohpkm() -> TestResult<()> {
        tests::to_from_ohpkm_all_in_dir::<Pk3>(
            &PathBuf::from("test-files").join("pkm-files").join("pk3"),
        )
    }

    // #[test]
    // fn empty_slot_checksum() -> TestResult<()> {
    //     let empty_slot = Pk3::empty_box_slot_bytes(&"RoC".into());
    //     if Pk3BufferRef::box_span(&empty_slot).checksum() != 0x0204 {
    //         return Err(Error::other(&format!(
    //             "Empty slot checksum should be 0x0204; received {:#06x}",
    //             Pk3BufferRef::box_span(&empty_slot).checksum()
    //         ))
    //         .into());
    //     }
    //     Ok(())
    // }
}
