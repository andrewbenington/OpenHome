use super::Pk9Buffer;
use super::pk9_buffer::Pk9BufferMut;
use super::{Pk9AbilityIndex, Pk9SpeciesAndForm};
use crate::checksum::RefreshChecksum;
use crate::gen9_sv::pokemon_index::SvPokemonIndex;
use crate::gen9_sv::{MAX_RIBBON_SV, TM_FLAG_BYTE_LENGTH_BASE, TM_FLAG_BYTE_LENGTH_DLC};
use crate::result::{Error, Result};
use crate::traits::ModernEvs;
use crate::traits::{HasSpeciesAndForm, PkmBytes};

use pkm_rs_derive::IsShiny4096;
use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::helpers;
use pkm_rs_resources::metadata_source::MetadataSource;
use pkm_rs_resources::moves::{MoveIndex, MoveSlots};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::{ModernRibbon, ModernRibbonSet};
use pkm_rs_resources::species::{FormMetadata, SpeciesAndForm, SpeciesMetadata};
#[cfg(feature = "wasm")]
use pkm_rs_types::TeraTypeWasm;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{
    AbilityNumber, BinaryGender, ContestStats, FlagSet, HyperTraining, Ivs, Language,
    MarkingsSixShapesColors, OriginGame, Stats8, Stats16Le, TeraType,
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

const VALID_SPECIES_FORM_MGS: &str =
    "Pk9 should not be able to be constructed with an invalid species/form";

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "Pk9Wasm"))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny4096)]
pub struct Pk9 {
    pub encryption_constant: u32,
    pub sanity: u16,
    pub checksum: u16,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub species_and_form: Pk9SpeciesAndForm,
    pub held_item_index: u16,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub exp: u32,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ability_index: Pk9AbilityIndex,
    pub ability_num: AbilityNumber,
    pub markings: MarkingsSixShapesColors,
    pub personality_value: u32,
    pub nature: NatureIndex,
    pub mint_nature: NatureIndex,
    pub is_fateful_encounter: bool,
    pub gender: Gender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub evs: Stats8,
    pub contest: ContestStats,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ribbons: ModernRibbonSet<14, MAX_RIBBON_SV>,
    pub contest_memory_count: u8,
    pub battle_memory_count: u8,
    pub height_scalar: u8,
    pub weight_scalar: u8,
    pub scale: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tm_flags_dlc: FlagSet<TM_FLAG_BYTE_LENGTH_DLC>,
    pub nickname: SizedUtf16String<26>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub moves: MoveSlots,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub relearn_moves: [MoveIndex; 4],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ivs: Ivs,
    pub is_egg: bool,
    pub is_nicknamed: bool,
    pub status_condition: u32,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tera_type_original: TeraType,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tera_type_override: Option<TeraType>,
    pub handler_name: SizedUtf16String<26>,
    pub handler_gender: BinaryGender,
    pub handler_language: Option<Language>,
    pub is_current_handler: bool,
    pub handler_id: u16,
    pub handler_friendship: u8,
    pub handler_memory: TrainerMemory,
    pub game_of_origin: OriginGame,
    pub game_of_origin_battle: Option<OriginGame>,
    pub form_argument: u32,
    pub affixed_ribbon: Option<ModernRibbon>,
    pub language: Language,
    pub trainer_name: SizedUtf16String<26>,
    pub trainer_friendship: u8,
    pub trainer_memory: TrainerMemory,
    pub egg_date: Option<PokeDate>,
    pub met_date: PokeDate,
    pub obedience_level: u8,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub ball: Ball,
    pub met_level: u8,
    pub trainer_gender: BinaryGender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tm_flags_base_game: FlagSet<TM_FLAG_BYTE_LENGTH_BASE>,
    pub home_tracker: Option<u64>,
    pub hyper_training: HyperTraining,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub stat_level: u8,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub current_hp: u16,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub stats: Stats16Le,
}

impl Pk9 {
    // ------------------------------------------------------------------
    // Deserialise from a Pk9Buffer (the single source of all byte offsets)
    // ------------------------------------------------------------------

    pub fn from_buffer<S: AsRef<[u8]>>(buf: &Pk9Buffer<S>) -> Result<Self> {
        let home_tracker_raw = buf.home_tracker_raw();
        let species_and_form = SpeciesAndForm::new_valid_ndex(
            SvPokemonIndex::new(buf.species_game_index())?.to_national_dex(),
            buf.form_index(),
        )?;

        let level = species_and_form
            .get_species_metadata()
            .calculate_level(buf.exp());
        let mint_nature = buf.mint_nature()?;
        let stats = helpers::calculate_stats_modern(
            MetadataSource::ScarletViolet,
            species_and_form,
            &buf.ivs(),
            &buf.evs(),
            level,
            mint_nature.get_metadata(),
            Some(buf.hyper_training()),
        )
        .ok_or(Error::other(
            "Pk9 cannot be built from a species/form with no metadata in Scarlet/Violet",
        ))?;

        let mut mon = Pk9 {
            encryption_constant: buf.encryption_constant(),
            sanity: buf.sanity(),
            checksum: buf.checksum(),
            species_and_form: species_and_form.try_into()?,
            held_item_index: buf.held_item_index(),
            trainer_id: buf.trainer_id(),
            secret_id: buf.secret_id(),
            exp: buf.exp(),
            ability_index: AbilityIndexBounded::try_from(buf.ability_index_raw())?,
            ability_num: buf.ability_num()?,
            markings: buf.markings(),
            personality_value: buf.personality_value(),
            nature: buf.nature()?,
            mint_nature,
            is_fateful_encounter: buf.is_fateful_encounter(),
            gender: buf.gender(),
            evs: buf.evs(),
            contest: buf.contest(),
            ribbons: buf.ribbons(),
            contest_memory_count: buf.contest_memory_count(),
            battle_memory_count: buf.battle_memory_count(),
            height_scalar: buf.height_scalar(),
            weight_scalar: buf.weight_scalar(),
            scale: buf.scale(),
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
            status_condition: buf.status_condition(),
            tera_type_original: TeraType::from_byte_original(buf.tera_type_original())?,
            tera_type_override: TeraType::from_byte_override(buf.tera_type_override())?,
            handler_name: buf.handler_name(),
            handler_gender: buf.handler_gender(),
            handler_language: buf.handler_language().ok(),
            is_current_handler: buf.is_current_handler(),
            handler_id: buf.handler_id(),
            handler_friendship: buf.handler_friendship(),
            handler_memory: buf.handler_memory(),
            game_of_origin: buf.game_of_origin(),
            game_of_origin_battle: buf.game_of_origin_battle(),
            form_argument: buf.form_argument(),
            affixed_ribbon: buf.affixed_ribbon(),
            language: buf.language()?,
            trainer_name: buf.trainer_name(),
            trainer_friendship: buf.trainer_friendship(),
            trainer_memory: buf.trainer_memory(),
            egg_date: buf.egg_date(),
            met_date: buf.met_date(),
            obedience_level: buf.obedience_level(),
            egg_location_index: buf.egg_location_index(),
            met_location_index: buf.met_location_index(),
            ball: buf.ball(),
            met_level: buf.met_level(),
            trainer_gender: buf.trainer_gender(),
            tm_flags_base_game: FlagSet::from_bytes(buf.tm_flags_base_game_raw()),
            home_tracker: if home_tracker_raw != 0 {
                Some(home_tracker_raw)
            } else {
                None
            },
            hyper_training: buf.hyper_training(),
            tm_flags_dlc: FlagSet::from_bytes(buf.tm_flags_dlc_raw()),
            stat_level: level,
            stats,
            current_hp: stats.hp,
        };

        mon.refresh_checksum();

        Ok(mon)
    }

    pub fn write_to_box_buffer(&self, buf: &mut Pk9BufferMut) {
        buf.set_encryption_constant(self.encryption_constant);
        buf.reset_sanity();
        buf.set_species_game_index(
            SvPokemonIndex::from_species_and_form(self.species_and_form.0)
                .expect("Pk9 has SV-compatible species/form"),
        );
        buf.set_form_index(self.species_and_form.0.get_forme_index());
        buf.set_held_item_index(self.held_item_index);
        buf.set_trainer_id(self.trainer_id);
        buf.set_secret_id(self.secret_id);
        buf.set_exp(self.exp);
        buf.set_ability_index(self.ability_index);
        buf.set_ability_num(self.ability_num);
        buf.set_markings(self.markings);
        buf.set_personality_value(self.personality_value);
        buf.set_nature(self.nature);
        buf.set_mint_nature(self.mint_nature);
        buf.set_gender(self.gender);
        buf.set_is_fateful_encounter(self.is_fateful_encounter);
        buf.set_evs(self.evs);
        buf.set_contest(self.contest);
        buf.set_ribbons(self.ribbons);
        buf.set_contest_memory_count(self.contest_memory_count);
        buf.set_battle_memory_count(self.battle_memory_count);
        buf.set_height_scalar(self.height_scalar);
        buf.set_weight_scalar(self.weight_scalar);
        buf.set_scale(self.scale);
        buf.set_tm_flags_dlc_raw(&self.tm_flags_dlc.to_bytes());
        buf.set_nickname(&self.nickname);
        buf.set_move_slots(&self.moves);
        buf.set_relearn_move(0, self.relearn_moves[0]);
        buf.set_relearn_move(1, self.relearn_moves[1]);
        buf.set_relearn_move(2, self.relearn_moves[2]);
        buf.set_relearn_move(3, self.relearn_moves[3]);
        buf.set_ivs(&self.ivs);
        buf.set_is_egg(self.is_egg);
        buf.set_is_nicknamed(self.is_nicknamed);
        buf.set_status_condition(self.status_condition);
        buf.set_tera_type_original(self.tera_type_original.to_byte());
        buf.set_tera_type_override(
            self.tera_type_override
                .map_or(TeraType::NO_OVERRIDE, TeraType::to_byte),
        );
        buf.set_handler_name(&self.handler_name);
        buf.set_handler_gender(self.handler_gender);
        if let Some(lang) = self.handler_language {
            buf.set_handler_language(lang);
        }
        buf.set_is_current_handler(self.is_current_handler);
        buf.set_handler_id(self.handler_id);
        buf.set_handler_friendship(self.handler_friendship);
        buf.set_handler_memory(self.handler_memory);
        buf.set_game_of_origin(self.game_of_origin);
        buf.set_game_of_origin_battle(self.game_of_origin_battle);
        buf.set_form_argument(self.form_argument);
        buf.set_affixed_ribbon(self.affixed_ribbon);
        buf.set_language(self.language);
        buf.set_trainer_name(&self.trainer_name);
        buf.set_trainer_friendship(self.trainer_friendship);
        buf.set_trainer_memory(self.trainer_memory);
        buf.set_egg_date(self.egg_date);
        buf.set_met_date(self.met_date);
        buf.set_obedience_level(self.obedience_level);
        buf.set_egg_location_index(self.egg_location_index);
        buf.set_met_location_index(self.met_location_index);
        buf.set_ball(self.ball);
        buf.set_met_level(self.met_level);
        buf.set_trainer_gender(self.trainer_gender);
        buf.set_tm_flags_base_game_raw(&self.tm_flags_base_game.to_bytes());
        buf.set_home_tracker_raw(self.home_tracker.unwrap_or(0));
        buf.set_hyper_training(self.hyper_training);
        buf.set_stat_level(self.stat_level);
        buf.set_current_hp(self.current_hp);
        buf.set_stats(self.stats);

        buf.refresh_checksum();
    }

    pub fn write_to_party_buffer(&self, buf: &mut Pk9BufferMut) {
        self.write_to_box_buffer(buf);
    }

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        match size {
            Self::BOX_SIZE => Self::from_buffer(&Pk9Buffer::new(bytes)),
            _ => Err(Error::buffer_size(Self::BOX_SIZE, size)),
        }
    }

    pub fn from_encrypted_bytes(mut bytes: Box<[u8]>) -> Result<Self> {
        Self::from_buffer(Pk9Buffer::new_mut(&mut bytes).decrypted())
    }

    pub fn to_box_bytes_encrypted(self) -> Box<[u8]> {
        let mut bytes = self.to_box_bytes();
        Pk9Buffer::new_mut(&mut bytes).encrypt();

        bytes
    }

    pub fn calculate_checksum(&self) -> u16 {
        let mut bytes = [0u8; Self::BOX_SIZE];
        self.write_box_bytes(&mut bytes);
        Pk9Buffer::new(&bytes).checksum()
    }

    pub fn refresh_checksum(&mut self) {
        self.checksum = self.calculate_checksum();
    }

    pub fn calculate_stats(&self) -> Stats16Le {
        helpers::calculate_stats_modern(
            MetadataSource::ScarletViolet,
            self.species_and_form.0,
            &self.ivs,
            &self.evs,
            self.calculate_level(),
            self.mint_nature.get_metadata(),
            Some(self.hyper_training),
        )
        .expect(VALID_SPECIES_FORM_MGS)
    }

    pub fn recalculate_stats(&mut self) {
        self.stats = self.calculate_stats();
    }

    pub fn is_empty_slot(bytes: &[u8]) -> bool {
        let mut owned = bytes.to_owned();
        let mut buffer = Pk9Buffer::new_mut(&mut owned);
        buffer.decrypt();

        buffer.species_game_index() == 0
    }
}

impl PkmBytes for Pk9 {
    const BOX_SIZE: usize = 344;
    const PARTY_SIZE: usize = 344; // Party data is also stored in the PC now

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::try_from_bytes(bytes)
    }

    fn write_box_bytes(&self, bytes: &mut [u8]) {
        self.write_to_box_buffer(&mut Pk9BufferMut::new_mut(bytes))
    }

    fn to_box_bytes(&self) -> Box<[u8]> {
        let mut bytes = Box::new([0u8; Self::BOX_SIZE]);
        self.write_box_bytes(bytes.as_mut_slice());

        bytes
    }
}

impl HasSpeciesAndForm for Pk9 {
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
#[wasm_bindgen(js_class = "Pk9Wasm")]
#[allow(clippy::missing_const_for_fn)]
impl Pk9 {
    #[wasm_bindgen(js_name = fromOhpkmBytes)]
    pub fn from_ohpkm_bytes(
        bytes: Vec<u8>,
        strategy: ConvertStrategy,
    ) -> core::result::Result<Pk9, JsValue> {
        let ohpkm = OhpkmV2::from_bytes(&bytes).map_err(JsValue::from)?;
        Pk9::from_ohpkm(&ohpkm, strategy).map_err(JsValue::from)
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Vec<u8>) -> core::result::Result<Pk9, JsValue> {
        Pk9::from_bytes(&bytes).map_err(JsValue::from)
    }

    #[wasm_bindgen(js_name = fromEncryptedBytes)]
    pub fn take_from_encrypted_bytes(bytes: Box<[u8]>) -> core::result::Result<Pk9, JsValue> {
        Pk9::from_encrypted_bytes(bytes).map_err(JsValue::from)
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
    pub fn national_dex_wasm(&self) -> u16 {
        self.species_and_form.0.get_ndex_wasm()
    }

    #[wasm_bindgen(getter = formIndex)]
    pub fn form_index_wasm(&self) -> u16 {
        self.species_and_form.0.get_forme_index()
    }

    #[wasm_bindgen(getter = evs)]
    pub fn evs_wasm(&self) -> Stats16Le {
        self.evs.into()
    }

    #[wasm_bindgen(setter = evs)]
    pub fn set_evs_wasm(&mut self, v: Stats16Le) {
        self.evs = v.to_stats8_truncated()
    }

    #[wasm_bindgen(getter = ivs)]
    pub fn ivs_wasm(&self) -> Stats16Le {
        self.ivs.into()
    }

    #[wasm_bindgen(setter = ivs)]
    pub fn set_ivs_wasm(&mut self, v: Stats16Le) {
        self.ivs = v.to_ivs_capped()
    }

    #[wasm_bindgen(getter = teraTypeOriginal)]
    pub fn tera_type_original_wasm(&self) -> TeraTypeWasm {
        self.tera_type_original.into()
    }

    #[wasm_bindgen(setter = teraTypeOriginal)]
    pub fn set_tera_type_original_wasm(&mut self, v: TeraTypeWasm) {
        self.tera_type_original = v.into()
    }

    #[wasm_bindgen(getter = teraTypeOverride)]
    pub fn tera_type_override_wasm(&self) -> Option<TeraTypeWasm> {
        self.tera_type_override.map(TeraTypeWasm::from)
    }

    #[wasm_bindgen(setter = teraTypeOverride)]
    pub fn set_tera_type_override_wasm(&mut self, v: Option<TeraTypeWasm>) {
        self.tera_type_override = v.map(TeraType::from)
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
    pub fn calculate_stats_wasm(&self) -> Stats16Le {
        self.calculate_stats()
    }

    #[wasm_bindgen(js_name = recalculateStats)]
    pub fn recalculate_stats_wasm(&mut self) {
        self.recalculate_stats()
    }

    #[wasm_bindgen(js_name = toBoxBytesEncrypted)]
    pub fn to_box_bytes_encrypted_wasm(&self) -> Box<[u8]> {
        self.to_box_bytes_encrypted()
    }
}

impl ModernEvs for Pk9 {
    fn get_evs(&self) -> Stats8 {
        self.evs
    }
}

#[cfg(feature = "randomize")]
impl RandomizeAndFix for Pk9 {
    fn fix<R: rand::prelude::Rng>(&mut self, _: &mut R) {
        self.stat_level = self.calculate_level();
        self.stats = self.calculate_stats();
        self.current_hp = self.stats.hp;
        self.refresh_checksum();
    }
}

#[cfg(test)]
impl crate::tests::PkhexJson for Pk9 {
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
    fn compare_pkhex_wasmon() -> TestResult<()> {
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
