use super::colopkm_buffer::ColopkmBuffer;
use super::colopkm_buffer::ColopkmBufferMut;
use crate::convert_strategy::ConvertStrategy;
#[cfg(feature = "wasm")]
use crate::gen3::Gen3PokemonIndex;
use crate::gen3::shadow::Purification;
use crate::gen3::shadow::ShadowIdColosseum;
use crate::ohpkm::OhpkmConvert;
use crate::ohpkm::OhpkmV2;
#[cfg(feature = "wasm")]
use crate::result::{Error, Result};
#[cfg(test)]
use crate::tests::PkhexJson;
use crate::traits::ModernEvs;
#[cfg(feature = "wasm")]
use crate::traits::{HasSpeciesAndForm, PkmBytes};

use pkm_rs_derive::IsShiny8192;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::items::{Item, ItemGen3};
use pkm_rs_resources::metadata_source::MetadataSource;
use pkm_rs_resources::moves::MoveSlots;
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::Gen3RibbonSet;
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_resources::species::{FormMetadata, SpeciesMetadata};
use pkm_rs_resources::{helpers, lookup};
#[cfg(feature = "wasm")]
use pkm_rs_types::AbilityNumber;
use pkm_rs_types::Pokerus;
#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
use pkm_rs_types::strings::{BigEndian, SizedUtf16String};
use pkm_rs_types::{
    BinaryGender, ContestStats, Language, MarkingsFourShapes, NationalDex, OriginGame,
    SimpleAbilityNumber, Stats8, Stats16,
};
use pkm_rs_types::{Gender, Ivs};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = ColopkmWasm))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Serialize, Clone, Copy, IsShiny8192)]
pub struct Colopkm {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub pokemon_index: Gen3PokemonIndex,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub held_item_index: Option<ItemGen3>,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub exp: u32,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ability_num: SimpleAbilityNumber,
    pub markings: MarkingsFourShapes,
    pub personality_value: u32,
    pub is_fateful_encounter: bool,
    pub gender: Gender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub evs: Stats8,
    pub contest: ContestStats,
    pub pokerus: Pokerus,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ribbons: Gen3RibbonSet,
    pub nickname: SizedUtf16String<22, BigEndian>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub moves: MoveSlots,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ivs: Ivs,
    pub is_egg: bool,
    pub trainer_name: SizedUtf16String<22, BigEndian>,
    pub trainer_friendship: u8,
    pub shadow_id: Option<ShadowIdColosseum>,
    pub purification: Purification,
    pub shadow_exp: u32,
    pub met_location_index: u16,
    pub ball: Ball,
    pub met_level: u8,
    pub trainer_gender: BinaryGender,
    pub game_of_origin: OriginGame,
    pub language: Language,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub stat_level: u8,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub current_hp: u16,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub stats: Stats16,
}

impl Colopkm {
    // ------------------------------------------------------------------
    // Deserialise from a ColopkmBuffer (byte slice wrapper with field accessors)
    // ------------------------------------------------------------------

    pub fn from_buffer<S: AsRef<[u8]>>(buf: &ColopkmBuffer<S>) -> Result<Self> {
        let pokemon_index = Gen3PokemonIndex::new(buf.gen3_species_index())?;
        let personality_value = buf.personality_value();
        let language = buf.language()?;
        let mut mon = Colopkm {
            pokemon_index,
            held_item_index: ItemGen3::new(buf.held_item_index()),
            trainer_id: buf.trainer_id(),
            secret_id: buf.secret_id(),
            exp: buf.exp(),
            ability_num: buf.ability_num(),
            markings: buf.markings(),
            personality_value: buf.personality_value(),
            is_fateful_encounter: if language == Language::Japanese {
                buf.is_fateful_encounter_jpn()
            } else {
                buf.is_fateful_encounter_int()
            },
            gender: SpeciesForm::base_form(pokemon_index.to_national_dex())
                .get_forme_metadata()
                .gender_from_pid(personality_value),
            evs: buf.evs().to_stats8_truncated(),
            contest: buf.contest(),
            pokerus: buf.pokerus(),
            is_egg: buf.is_egg(),
            ribbons: buf.ribbons(),
            nickname: buf.nickname(),
            moves: buf.move_slots(),
            ivs: buf.ivs(),
            trainer_name: buf.trainer_name(),
            trainer_friendship: buf.trainer_friendship() as u8,
            shadow_id: ShadowIdColosseum::from_u16(buf.shadow_id())?,
            purification: Purification::from_i32(buf.purification())?,
            shadow_exp: buf.shadow_exp(),
            met_location_index: buf.met_location_index(),
            ball: buf.ball(),
            met_level: buf.met_level(),
            trainer_gender: buf.trainer_gender(),
            game_of_origin: buf.game_of_origin()?,
            language,
            stat_level: Default::default(),
            stats: Default::default(),
            current_hp: Default::default(),
        };

        dbg!(mon.moves);
        mon.stat_level = mon.calculate_level();
        mon.stats = mon.calculate_stats();
        mon.current_hp = mon.stats.hp;

        Ok(mon)
    }

    pub fn from_slot_bytes(mut bytes: Box<[u8]>) -> Result<Option<Self>> {
        if ColopkmBuffer::new(&bytes).gen3_species_index() == 0 {
            Ok(None)
        } else {
            Self::from_encrypted_bytes(&mut bytes).map(Some)
        }
    }

    pub fn write_to_box_buffer(&self, buf: &mut ColopkmBufferMut) {
        buf.set_gen3_species_index(self.pokemon_index.into());
        buf.set_held_item_index(self.held_item_index.map_or(0, |i| i.get()));
        buf.set_trainer_id(self.trainer_id);
        buf.set_secret_id(self.secret_id);
        buf.set_exp(self.exp);
        buf.set_ability_num(self.ability_num);
        buf.set_markings(self.markings);
        buf.set_personality_value(self.personality_value);
        buf.set_is_fateful_encounter_jpn(
            self.is_fateful_encounter && self.language == Language::Japanese,
        );
        buf.set_is_fateful_encounter_int(
            self.is_fateful_encounter && self.language != Language::Japanese,
        );
        buf.set_evs(self.evs.into());
        buf.set_contest(self.contest);
        buf.set_pokerus(self.pokerus);
        buf.set_is_egg(self.is_egg);
        buf.set_ribbons(self.ribbons);
        buf.set_nickname(&self.nickname);
        buf.set_move_slots(&self.moves);
        buf.set_ivs(&self.ivs);
        buf.set_trainer_name(&self.trainer_name);
        buf.set_trainer_friendship(self.trainer_friendship as u16);
        buf.set_shadow_id(self.shadow_id.map_or(0, |id| id.to_u16()));
        buf.set_purification(self.purification.to_i32());
        buf.set_shadow_exp(self.shadow_exp);
        buf.set_met_location_index(self.met_location_index);
        buf.set_ball(self.ball);
        buf.set_met_level(self.met_level);
        buf.set_trainer_gender(self.trainer_gender);
        buf.set_game_of_origin(self.game_of_origin);
        buf.set_language(self.language);
        buf.set_stat_level(self.stat_level);
        buf.set_current_hp(self.current_hp);
        buf.set_stats(self.stats);
    }

    pub fn write_to_party_buffer(&self, buf: &mut ColopkmBufferMut) {
        self.write_to_box_buffer(buf);
    }

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        if bytes.len() == super::PKM_DATA_SIZE_GCN {
            Self::from_buffer(&ColopkmBuffer::new(bytes))
        } else {
            Err(Error::buffer_size(super::PKM_DATA_SIZE_GCN, bytes.len()))
        }
    }

    pub fn from_encrypted_bytes(bytes: &mut [u8]) -> Result<Self> {
        Self::from_buffer(ColopkmBuffer::new_mut(bytes).decrypted())
    }

    pub fn to_box_bytes_encrypted(self) -> Box<[u8]> {
        let mut bytes = self.to_box_bytes();
        ColopkmBuffer::new_mut(&mut bytes).encrypt();

        bytes
    }

    pub fn get_national_dex(&self) -> NationalDex {
        self.pokemon_index.to_national_dex()
    }

    pub fn is_nicknamed(&self) -> bool {
        self.nickname.to_string()
            != lookup::species_name(self.get_national_dex(), self.language).to_uppercase()
    }

    pub fn nature(&self) -> NatureIndex {
        NatureIndex::new_from_modulo(self.personality_value)
    }

    pub fn species_and_form(&self) -> SpeciesForm {
        SpeciesForm::new_valid_ndex(
            self.get_national_dex(),
            super::form_index_from_pid(self.get_national_dex(), self.personality_value) as u16,
        )
        .expect("gen 3 form is valid")
    }

    pub fn calculate_stats(&self) -> Stats16 {
        helpers::calculate_stats_modern(
            MetadataSource::Emerald,
            self.species_and_form(),
            &self.ivs,
            &self.evs,
            self.calculate_level(),
            self.nature().get_metadata(),
            None,
        )
        .expect("colopkm has valid species/form, present in Emerald data")
    }

    pub fn recalculate_stats(&mut self) {
        self.stats = self.calculate_stats();
    }

    pub fn is_empty_slot(bytes: &[u8]) -> bool {
        let mut owned = bytes.to_owned();
        ColopkmBuffer::new_mut(&mut owned)
            .decrypted()
            .gen3_species_index()
            == 0
    }

    pub fn modern_held_item(&self) -> Option<Item> {
        self.held_item_index?.to_modern()
    }
}

impl PkmBytes for Colopkm {
    const BOX_SIZE: usize = super::PKM_DATA_SIZE_GCN;
    const PARTY_SIZE: usize = super::PKM_DATA_SIZE_GCN;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::try_from_bytes(bytes)
    }

    fn write_box_bytes(&self, bytes: &mut [u8]) {
        self.write_to_box_buffer(&mut ColopkmBufferMut::new_mut(bytes))
    }

    fn write_party_bytes(&self, bytes: &mut [u8]) {
        let mut buffer = ColopkmBufferMut::new_mut(bytes);
        self.write_to_box_buffer(&mut buffer);
    }

    fn to_box_bytes(&self) -> Box<[u8]> {
        let mut bytes = Box::new([0u8; Self::BOX_SIZE]);
        self.write_box_bytes(bytes.as_mut_slice());

        bytes
    }

    fn to_party_bytes(&self) -> Box<[u8]> {
        let mut bytes = Box::new([0u8; Self::PARTY_SIZE]);
        self.write_party_bytes(bytes.as_mut_slice());

        bytes
    }
}

impl HasSpeciesAndForm for Colopkm {
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
#[wasm_bindgen(js_class = ColopkmWasm)]
#[allow(clippy::missing_const_for_fn)]
impl Colopkm {
    #[wasm_bindgen(js_name = fromOhpkmBytes)]
    pub fn from_ohpkm_bytes(
        bytes: Vec<u8>,
        strategy: ConvertStrategy,
    ) -> core::result::Result<Colopkm, JsValue> {
        let ohpkm = OhpkmV2::from_bytes(&bytes).map_err(JsValue::from)?;
        Colopkm::from_ohpkm(&ohpkm, strategy).map_err(JsValue::from)
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Vec<u8>) -> core::result::Result<Colopkm, JsValue> {
        Colopkm::from_bytes(&bytes).map_err(JsValue::from)
    }

    #[wasm_bindgen(js_name = fromEncryptedBytes)]
    pub fn take_from_encrypted_bytes(
        mut bytes: Box<[u8]>,
    ) -> core::result::Result<Colopkm, JsValue> {
        Colopkm::from_encrypted_bytes(&mut bytes).map_err(JsValue::from)
    }

    #[wasm_bindgen(js_name = fromSlotBytes)]
    pub fn from_slot_bytes_js(bytes: Box<[u8]>) -> core::result::Result<Option<Colopkm>, JsValue> {
        Self::from_slot_bytes(bytes).map_err(JsValue::from)
    }

    #[wasm_bindgen(js_name = toBoxBytes)]
    pub fn to_box_bytes_wasm(&self) -> Box<[u8]> {
        self.to_box_bytes()
    }

    #[wasm_bindgen(js_name = toPartyBytes)]
    pub fn to_party_bytes_wasm(&self) -> Box<[u8]> {
        self.to_party_bytes()
    }

    #[wasm_bindgen(getter = nationalDex)]
    pub fn national_dex_js(&self) -> NationalDex {
        self.get_national_dex()
    }

    #[wasm_bindgen(setter = nationalDex)]
    pub fn set_national_dex_js(&mut self, v: u16) -> Result<()> {
        self.pokemon_index = Gen3PokemonIndex::from_national_dex(v)?;
        Ok(())
    }

    #[wasm_bindgen(getter = formIndex)]
    pub fn form_index_js(&self) -> u16 {
        self.species_and_form().get_forme_index()
    }

    #[wasm_bindgen(getter = isNicknamed)]
    pub fn is_nicknamed_js(&self) -> bool {
        self.is_nicknamed()
    }

    #[wasm_bindgen(getter = heldItemIndex)]
    pub fn held_item_index_js(&self) -> u16 {
        match self.modern_held_item() {
            Some(item) => item.get(),
            None => 0,
        }
    }

    #[wasm_bindgen(setter = heldItemIndex)]
    pub fn set_held_item_index_js(&mut self, v: u16) {
        self.held_item_index = ItemGen3::from_modern_index(v)
    }

    #[wasm_bindgen(getter = heldItemName)]
    pub fn held_item_name_js(&self) -> Option<String> {
        self.held_item_index.map(|item| item.get_metadata().name())
    }

    #[wasm_bindgen(getter = ivs)]
    pub fn ivs_js(&self) -> Stats16 {
        self.ivs.into()
    }
    #[wasm_bindgen(setter = ivs)]
    pub fn set_ivs_js(&mut self, v: Stats16) {
        self.ivs = v.to_ivs_capped();
    }

    #[wasm_bindgen(getter = abilityNum)]
    pub fn ability_num_js(&self) -> AbilityNumber {
        self.ability_num.into()
    }
    #[wasm_bindgen(setter = abilityNum)]
    pub fn set_ability_num_js(&mut self, v: AbilityNumber) {
        self.ability_num = v.into()
    }

    #[wasm_bindgen(getter = evs)]
    pub fn evs_js(&self) -> Stats16 {
        self.evs.into()
    }
    #[wasm_bindgen(setter = evs)]
    pub fn set_evs_js(&mut self, v: Stats16) {
        self.evs = v.try_into().expect("evs should not exceed 255 each");
    }

    #[wasm_bindgen(getter = nature)]
    pub fn nature_js(&self) -> NatureIndex {
        self.nature()
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

    #[wasm_bindgen(setter = ribbons)]
    pub fn set_ribbons_js(&mut self, v: Vec<String>) {
        self.ribbons = Gen3RibbonSet::from_names(v);
    }

    #[wasm_bindgen(getter = trainerName)]
    pub fn trainer_name_js(&self) -> String {
        self.trainer_name.to_string()
    }

    #[wasm_bindgen(setter = trainerName)]
    pub fn set_trainer_name_js(&mut self, v: String) {
        self.trainer_name = v.into()
    }

    #[wasm_bindgen(getter = languageString)]
    pub fn language_string(&self) -> String {
        self.language.as_str().to_owned()
    }

    #[wasm_bindgen(js_name = toOhpkm)]
    pub fn to_ohpkm(&self) -> Result<OhpkmV2> {
        OhpkmV2::convert_with_backup(self, &self.to_party_bytes())
    }

    #[wasm_bindgen(js_name = isEmptySlot)]
    pub fn is_empty_slot_js(bytes: Vec<u8>) -> bool {
        Self::is_empty_slot(&bytes)
    }

    #[wasm_bindgen(js_name = calculateLevel)]
    pub fn calculate_level_js(&self) -> u8 {
        self.calculate_level()
    }

    #[wasm_bindgen(js_name = calculateStats)]
    pub fn calculate_stats_js(&self) -> Stats16 {
        self.calculate_stats()
    }

    #[wasm_bindgen(js_name = recalculateStats)]
    pub fn recalculate_stats_js(&mut self) {
        self.recalculate_stats()
    }

    #[wasm_bindgen(js_name = toJson)]
    pub fn to_json(&self) -> Result<String> {
        Ok(serde_json::to_value(self)
            .map_err(|e| Error::Other(e.to_string()))?
            .to_string())
    }
}

impl ModernEvs for Colopkm {
    fn get_evs(&self) -> Stats8 {
        self.evs
    }
}

#[cfg(test)]
impl PkhexJson for Colopkm {
    fn to_pkhex_json_value(&self) -> std::result::Result<serde_json::Value, serde_json::Error> {
        let mut value = serde_json::to_value(self)?;
        value["nickname_trash"] = serde_json::json!(
            self.nickname
                .bytes()
                .iter()
                .map(|b| format!("{:02X}", b))
                .collect::<String>()
        );
        value["trainer_name_trash"] = serde_json::json!(
            self.trainer_name
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
mod tests {
    use super::*;
    use std::path::PathBuf;

    // use crate::convert_strategy::ConvertStrategy;
    use crate::gen3::Colopkm;
    use crate::ohpkm::{OhpkmConvert, OhpkmV2};

    #[cfg(feature = "randomize")]
    use crate::tests::{self, TestResult};

    // use pkm_rs_resources::ribbons::Gen3Ribbon;
    // use pkm_rs_types::Gender;
    // #[cfg(feature = "randomize")]
    // use pkm_rs_types::randomize::Randomize;
    // #[cfg(feature = "randomize")]
    // use rand::{SeedableRng, rngs::StdRng};

    // #[test]
    // fn to_from_bytes() -> TestResult<()> {
    //     tests::to_from_bytes_all_in_dir::<Pk3>(
    //         &PathBuf::from("test-files").join("pkm-files").join("pk3"),
    //     )
    // }

    // #[test]
    // fn blaziken_pk3() -> TestResult<()> {
    //     let path = PathBuf::from("pk3").join("blaziken.pkm");
    //     let mon = tests::pkm_from_file::<Pk3>(&path)?.0;
    //     assert_eq!(mon.secret_id, 0xbd27);

    //     let mut bytes = mon.to_box_bytes();

    //     let buffer = Pk3BufferMut::box_span_mut(&mut bytes);

    //     assert_eq!(buffer.secret_id(), 0xbd27);

    //     Ok(())
    // }

    // #[cfg(feature = "randomize")]
    // #[test]
    // fn to_from_bytes_random() -> std::result::Result<(), TestErrorWithSeed> {
    //     for seed in 0..=1000 {
    //         let mon = Pk3::randomized(&mut StdRng::seed_from_u64(seed));
    //         println!("Testing seed {seed}: {mon:#?}");
    //         tests::find_inconsistencies_to_from_bytes(mon)
    //             .map_err(|error| TestErrorWithSeed { seed, error })?;
    //     }

    //     Ok(())
    // }

    // #[test]
    // fn is_shiny() -> TestResult<()> {
    //     let path = PathBuf::from("pk3").join("unown-e.pkm");
    //     let mon = tests::pkm_from_file::<Pk3>(&path)?.0;
    //     assert!(mon.is_shiny());

    //     Ok(())
    // }

    #[test]
    fn compare_pkhex_json() -> TestResult<()> {
        tests::compare_pkhex_json_all_in_dir::<Colopkm>(&PathBuf::from("colopkm"))
    }

    // #[test]
    // fn nickname_garbage_preserved() -> TestResult<()> {
    //     let (mon, bytes) =
    //         tests::pkm_from_file::<Pk3>(&PathBuf::from("pk3").join("jirachi-garbage.pkm"))?;

    //     // trash bytes from an event mon
    //     assert_eq!(mon.nickname.bytes()[9], 0x70);
    //     assert_eq!(mon.nickname.bytes()[8], 0x08);

    //     let mon_recreated = Pk3::from_ohpkm(
    //         &OhpkmV2::convert_with_backup(&mon, &bytes)?,
    //         ConvertStrategy::default(),
    //     )?;

    //     // trash bytes should be preserved
    //     assert_eq!(mon_recreated.nickname.bytes()[9], 0x70);
    //     assert_eq!(mon_recreated.nickname.bytes()[8], 0x08);

    //     Ok(())
    // }

    // #[test]
    // fn is_nicknamed() -> TestResult<()> {
    //     let mut mon = tests::pkm_from_file::<Pk3>(&PathBuf::from("pk3").join("blaziken.pkm"))?.0;
    //     assert!(!mon.is_nicknamed());

    //     mon.nickname = Gen3String::from_stringlike("renamed", Gen3Encoding::Int);
    //     assert!(mon.is_nicknamed());

    //     Ok(())
    // }

    #[test]
    fn from_ohpkm() -> TestResult<()> {
        let mon = tests::pkm_from_file::<OhpkmV2>(&PathBuf::from("ohpkm").join("Machamp.ohpkm"))?.0;

        let _ = Colopkm::from_ohpkm(&mon, ConvertStrategy::default());

        Ok(())
    }

    #[test]
    fn to_from_ohpkm() -> TestResult<()> {
        tests::to_from_ohpkm_all_in_dir::<Colopkm>(
            &PathBuf::from("test-files")
                .join("pkm-files")
                .join("colopkm"),
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

    // #[test]
    // fn set_contest_ribbon() -> TestResult<()> {
    //     let mut mon = tests::pkm_from_file::<Pk3>(&PathBuf::from("pk3").join("blaziken.pkm"))?.0;

    //     mon.ribbons.add_ribbon(Gen3Ribbon::BeautyHoenn);

    //     assert!(mon.ribbons.has_ribbon(Gen3Ribbon::BeautyHoenn));
    //     assert!(mon.ribbons.get_ribbons().contains(&Gen3Ribbon::BeautyHoenn));

    //     mon.ribbons.add_ribbon(Gen3Ribbon::BeautyMasterHoenn);
    //     assert!(mon.ribbons.has_ribbon(Gen3Ribbon::BeautyMasterHoenn));
    //     assert!(
    //         mon.ribbons
    //             .get_ribbons()
    //             .contains(&Gen3Ribbon::BeautyMasterHoenn)
    //     );

    //     Ok(())
    // }

    // #[test]
    // fn kyogre_is_nonbinary() -> TestResult<()> {
    //     let path = PathBuf::from("pk3").join("382 - Kyogre.pkm");
    //     let mon = tests::pkm_from_file::<Pk3>(&path)?.0;

    //     assert_eq!(mon.gender, Gender::Genderless);

    //     Ok(())
    // }

    // #[test]
    // fn nature_preserved() -> TestResult<()> {
    //     let path = PathBuf::from("ohpkm").join("ditto-bold.ohpkm");
    //     let mon = tests::pkm_from_file::<OhpkmV2>(&path)?.0;

    //     assert_eq!(mon.gender(), Gender::Genderless);

    //     let pk3 = Pk3::from_ohpkm(&mon, ConvertStrategy::default())?;

    //     assert_eq!(mon.nature(), pk3.nature());

    //     Ok(())
    // }

    // const BLAZIKEN_ENCRYPTED_BYTES_HEX: &str = "afe6de82a28827bdbcc6bbd4c3c5bfc8ff000202cce3bdffffffff007b690000416fbe3e266fa03f2d76e92f176f2e3f1942e93ff291f93f0d7e7c1e663cdb2c0deef13f0b92f9c30d6ef93f0d6ef93f";
    // const JIRACHI_ENCRYPTED_BYTES_HEX: &str = "b010a7414b4e0000c4c3ccbbbdc2c3ff08700202d1c3cdc2c7c5cc00920c0000fb5ea741fb5ea741fb5ea741fba1a260d21fcf68fb5ea741625f0e41675ea741fb3aa741ea5ffa41675ea741f147ad41";

    // #[test]
    // fn encrypted_bytes_match_expected_blaziken() -> TestResult<()> {
    //     let path = PathBuf::from("pk3").join("blaziken.pkm");
    //     let mon = tests::pkm_from_file::<Pk3>(&path)?.0;

    //     let encrypted_bytes = mon.to_box_bytes_encrypted();
    //     let encrypted_hex_str = tests::bytes_to_hex_string(&encrypted_bytes);

    //     assert_eq!(encrypted_hex_str, BLAZIKEN_ENCRYPTED_BYTES_HEX);

    //     Ok(())
    // }

    // #[test]
    // fn encrypted_bytes_match_expected_jirachi() -> TestResult<()> {
    //     let path = PathBuf::from("pk3").join("jirachi-garbage.pkm");
    //     let mon = tests::pkm_from_file::<Pk3>(&path)?.0;

    //     let encrypted_bytes = mon.to_box_bytes_encrypted();
    //     let encrypted_hex_str = tests::bytes_to_hex_string(&encrypted_bytes);

    //     assert_eq!(encrypted_hex_str, JIRACHI_ENCRYPTED_BYTES_HEX);

    //     Ok(())
    // }
}
