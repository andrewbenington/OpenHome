use crate::pkm::ohpkm::sectioned_data::{DataSection, SectionTag, SectionedData};
use crate::pkm::ohpkm::v2_sections::{
    BdspData, GameboyData, Gen45Data, Gen67Data, LegendsArceusData, MainDataV2, MostRecentSave,
    Notes, PastHandlerData, PluginData, ScarletVioletData, SwordShieldData,
};
use crate::pkm::ohpkm::{OhpkmConvert, OhpkmV1};
use crate::pkm::traits::IsShiny;
use crate::pkm::{Error, HasSpeciesAndForme, PkmBytes, Result};

use pkm_rs_types::TrainerData;
use pkm_rs_types::{AbilityNumber, BinaryGender};
use serde::Serialize;
use strum_macros::Display;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use crate::pkm::ohpkm::JsResult;

use pkm_rs_resources::{
    abilities::AbilityIndex,
    ball::Ball,
    language::Language,
    moves::MoveSlot,
    natures::NatureIndex,
    ribbons::{ModernRibbon, OpenHomeRibbon, OpenHomeRibbonSet},
    species::SpeciesAndForme,
};

use pkm_rs_types::{
    ContestStats, FlagSet, Gender, Geolocations, HyperTraining, MarkingsSixShapesColors,
    OriginGame, PokeDate, ShinyLeaves, Stats8, Stats16Le, StatsPreSplit, TeraType, TeraTypeWasm,
    TrainerMemory, strings::SizedUtf16String,
};

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

const MAGIC_NUMBER: u32 = 0x57575757;
const CURRENT_VERSION: u16 = 2;

#[derive(Clone, Copy, PartialEq, Eq, Hash, Display)]
#[repr(u16)]
pub enum SectionTagV2 {
    MainData,
    GameboyData,
    Gen45Data,
    Gen67Data,
    SwordShield,
    BdspTmFlags,
    LegendsArceus,
    ScarletViolet,
    PastHandler,
    PluginData,
    Notes,
    MostRecentSave,
}

impl SectionTagV2 {
    pub const fn new(tag: u16) -> Option<Self> {
        match tag {
            0 => Some(Self::MainData),
            1 => Some(Self::GameboyData),
            2 => Some(Self::Gen45Data),
            3 => Some(Self::Gen67Data),
            4 => Some(Self::SwordShield),
            5 => Some(Self::BdspTmFlags),
            6 => Some(Self::LegendsArceus),
            7 => Some(Self::ScarletViolet),
            8 => Some(Self::PastHandler),
            9 => Some(Self::PluginData),
            10 => Some(Self::Notes),
            11 => Some(Self::MostRecentSave),
            12.. => None,
        }
    }

    pub const fn min_size(&self) -> usize {
        match *self {
            Self::MainData => 305,
            Self::GameboyData => 13,
            Self::Gen45Data => 5,
            Self::Gen67Data => 33,
            Self::SwordShield => 20,
            Self::BdspTmFlags => 14,
            Self::LegendsArceus => 44,
            Self::ScarletViolet => 37,
            Self::PastHandler => 39,
            Self::PluginData => 0,
            Self::Notes => 0,
            Self::MostRecentSave => 31,
        }
    }
}

impl SectionTag for SectionTagV2 {
    fn from_index(index: u16) -> Option<Self> {
        Self::new(index)
    }

    fn min_size(&self) -> usize {
        self.min_size()
    }

    fn index(&self) -> u16 {
        *self as u16
    }
}

#[derive(Default, Debug, Clone, Serialize)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct OhpkmV2 {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    main_data: MainDataV2,
    gameboy_data: Option<GameboyData>,
    gen45_data: Option<Gen45Data>,
    gen67_data: Option<Gen67Data>,
    swsh_data: Option<SwordShieldData>,
    bdsp_data: Option<BdspData>,
    la_data: Option<LegendsArceusData>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    sv_data: Option<ScarletVioletData>,
    handler_data: Vec<PastHandlerData>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    plugin_data: Option<PluginData>,
    notes: Option<Notes>,
    most_recent_save: Option<MostRecentSave>,
}

impl OhpkmV2 {
    #[cfg(feature = "wasm")]
    pub fn openhome_id(&self) -> String {
        self.main_data.openhome_id()
    }

    pub const fn personality_value(&self) -> u32 {
        self.main_data.personality_value
    }

    pub const fn set_personality_value(&mut self, v: u32) {
        self.main_data.personality_value = v;
    }

    pub const fn encryption_constant(&self) -> u32 {
        self.main_data.encryption_constant
    }

    pub const fn set_encryption_constant(&mut self, v: u32) {
        self.main_data.encryption_constant = v;
    }

    pub const fn species_and_forme(&self) -> SpeciesAndForme {
        self.main_data.species_and_forme
    }

    pub const fn set_species_and_forme(&mut self, v: &SpeciesAndForme) {
        self.main_data.species_and_forme = *v;
    }

    pub const fn held_item_index(&self) -> u16 {
        self.main_data.held_item_index
    }

    pub const fn set_held_item_index(&mut self, v: u16) {
        self.main_data.held_item_index = v;
    }

    pub const fn trainer_id(&self) -> u16 {
        self.main_data.trainer_id
    }

    pub const fn set_trainer_id(&mut self, v: u16) {
        self.main_data.trainer_id = v;
    }

    pub const fn secret_id(&self) -> u16 {
        self.main_data.secret_id
    }

    pub const fn set_secret_id(&mut self, v: u16) {
        self.main_data.secret_id = v;
    }

    pub const fn exp(&self) -> u32 {
        self.main_data.exp
    }

    pub const fn set_exp(&mut self, v: u32) {
        self.main_data.exp = v;
    }

    pub const fn ability_index(&self) -> AbilityIndex {
        self.main_data.ability_index
    }

    pub const fn set_ability_index(&mut self, v: &AbilityIndex) {
        self.main_data.ability_index = *v;
    }

    pub const fn ability_num(&self) -> AbilityNumber {
        self.main_data.ability_num
    }

    pub const fn set_ability_num(&mut self, v: AbilityNumber) {
        self.main_data.ability_num = v;
    }

    pub const fn favorite(&self) -> bool {
        self.main_data.favorite
    }

    pub const fn set_favorite(&mut self, v: bool) {
        self.main_data.favorite = v;
    }

    pub const fn is_shadow(&self) -> bool {
        self.main_data.is_shadow
    }

    pub const fn set_is_shadow(&mut self, v: bool) {
        self.main_data.is_shadow = v;
    }

    pub const fn markings(&self) -> MarkingsSixShapesColors {
        self.main_data.markings
    }

    pub const fn set_markings(&mut self, v: &MarkingsSixShapesColors) {
        self.main_data.markings = *v;
    }

    pub const fn nature(&self) -> NatureIndex {
        self.main_data.nature
    }

    pub const fn set_nature(&mut self, v: &NatureIndex) {
        self.main_data.nature = *v;
    }

    pub fn stat_nature(&self) -> NatureIndex {
        self.main_data.mint_nature.unwrap_or(self.main_data.nature)
    }

    pub fn set_stat_nature(&mut self, v: &NatureIndex) {
        self.main_data.mint_nature = if *v != self.nature() { Some(*v) } else { None };
    }

    pub const fn is_fateful_encounter(&self) -> bool {
        self.main_data.is_fateful_encounter
    }

    pub const fn set_is_fateful_encounter(&mut self, v: bool) {
        self.main_data.is_fateful_encounter = v;
    }

    pub const fn gender(&self) -> Gender {
        self.main_data.gender
    }

    pub const fn set_gender(&mut self, v: Gender) {
        self.main_data.gender = v;
    }

    pub const fn evs(&self) -> Stats8 {
        self.main_data.evs
    }

    pub const fn set_evs(&mut self, v: &Stats8) {
        self.main_data.evs = *v;
    }

    pub const fn contest(&self) -> ContestStats {
        self.main_data.contest
    }

    pub const fn set_contest(&mut self, v: &ContestStats) {
        self.main_data.contest = *v;
    }

    pub const fn pokerus_byte(&self) -> u8 {
        self.main_data.pokerus_byte
    }

    pub const fn set_pokerus_byte(&mut self, v: u8) {
        self.main_data.pokerus_byte = v;
    }

    pub const fn contest_memory_count(&self) -> u8 {
        self.main_data.contest_memory_count
    }

    pub const fn set_contest_memory_count(&mut self, v: u8) {
        self.main_data.contest_memory_count = v;
    }

    pub const fn battle_memory_count(&self) -> u8 {
        self.main_data.battle_memory_count
    }

    pub const fn set_battle_memory_count(&mut self, v: u8) {
        self.main_data.battle_memory_count = v;
    }

    pub const fn ribbons(&self) -> OpenHomeRibbonSet<16> {
        self.main_data.ribbons
    }

    pub const fn set_ribbons(&mut self, v: OpenHomeRibbonSet<16>) {
        self.main_data.ribbons = v;
    }

    pub const fn sociability(&self) -> u32 {
        self.main_data.sociability
    }

    pub const fn set_sociability(&mut self, v: u32) {
        self.main_data.sociability = v;
    }

    pub const fn height_scalar(&self) -> u8 {
        self.main_data.height_scalar
    }

    pub const fn set_height_scalar(&mut self, v: u8) {
        self.main_data.height_scalar = v;
    }

    pub const fn weight_scalar(&self) -> u8 {
        self.main_data.weight_scalar
    }

    pub const fn set_weight_scalar(&mut self, v: u8) {
        self.main_data.weight_scalar = v;
    }

    pub const fn scale(&self) -> u8 {
        self.main_data.scale
    }

    pub const fn set_scale(&mut self, v: u8) {
        self.main_data.scale = v;
    }

    pub const fn ivs(&self) -> Stats8 {
        self.main_data.ivs
    }

    pub const fn set_ivs(&mut self, v: &Stats8) {
        self.main_data.ivs = *v;
    }

    pub const fn is_egg(&self) -> bool {
        self.main_data.is_egg
    }

    pub const fn set_is_egg(&mut self, v: bool) {
        self.main_data.is_egg = v;
    }

    pub const fn is_nicknamed(&self) -> bool {
        self.main_data.is_nicknamed
    }

    pub const fn set_is_nicknamed(&mut self, v: bool) {
        self.main_data.is_nicknamed = v;
    }

    pub const fn handler_language(&self) -> u8 {
        self.main_data.handler_language
    }

    pub const fn set_handler_language(&mut self, v: u8) {
        self.main_data.handler_language = v;
    }

    pub const fn is_current_handler(&self) -> bool {
        self.main_data.is_current_handler
    }

    pub const fn set_is_current_handler(&mut self, v: bool) {
        self.main_data.is_current_handler = v;
    }

    pub const fn handler_id(&self) -> u16 {
        self.main_data.handler_id
    }

    pub const fn set_handler_id(&mut self, v: u16) {
        self.main_data.handler_id = v;
    }

    pub const fn handler_friendship(&self) -> u8 {
        self.main_data.handler_friendship
    }

    pub const fn set_handler_friendship(&mut self, v: u8) {
        self.main_data.handler_friendship = v;
    }

    pub const fn handler_memory(&self) -> TrainerMemory {
        self.main_data.handler_memory
    }

    pub const fn set_handler_memory(&mut self, v: &TrainerMemory) {
        self.main_data.handler_memory = *v;
    }

    pub const fn handler_affection(&self) -> u8 {
        self.main_data.handler_affection
    }

    pub const fn set_handler_affection(&mut self, v: u8) {
        self.main_data.handler_affection = v;
    }

    pub const fn handler_gender(&self) -> BinaryGender {
        self.main_data.handler_gender
    }

    pub const fn set_handler_gender(&mut self, v: BinaryGender) {
        self.main_data.handler_gender = v;
    }

    pub const fn fullness(&self) -> u8 {
        self.main_data.fullness
    }

    pub const fn set_fullness(&mut self, v: u8) {
        self.main_data.fullness = v;
    }

    pub const fn enjoyment(&self) -> u8 {
        self.main_data.enjoyment
    }

    pub const fn set_enjoyment(&mut self, v: u8) {
        self.main_data.enjoyment = v;
    }

    pub const fn game_of_origin(&self) -> OriginGame {
        self.main_data.game_of_origin
    }

    pub const fn set_game_of_origin(&mut self, v: OriginGame) {
        self.main_data.game_of_origin = v;
    }

    pub fn game_of_origin_battle(&self) -> Option<u8> {
        self.main_data.game_of_origin_battle.map(|v| v as u8)
    }

    pub fn set_game_of_origin_battle(&mut self, v: Option<u8>) {
        self.main_data.game_of_origin_battle = v.and_then(OriginGame::try_from_u8);
    }

    pub const fn console_region(&self) -> u8 {
        self.main_data.console_region
    }

    pub const fn set_console_region(&mut self, v: u8) {
        self.main_data.console_region = v;
    }

    pub const fn language(&self) -> Language {
        self.main_data.language
    }

    pub const fn set_language(&mut self, v: Language) {
        self.main_data.language = v;
    }

    pub const fn form_argument(&self) -> u32 {
        self.main_data.form_argument
    }

    pub const fn set_form_argument(&mut self, v: u32) {
        self.main_data.form_argument = v;
    }

    pub const fn affixed_ribbon(&self) -> Option<ModernRibbon> {
        self.main_data.affixed_ribbon
    }

    pub const fn set_affixed_ribbon(&mut self, v: Option<ModernRibbon>) {
        self.main_data.affixed_ribbon = v;
    }

    pub const fn trainer_friendship(&self) -> u8 {
        self.main_data.trainer_friendship
    }

    pub const fn set_trainer_friendship(&mut self, v: u8) {
        self.main_data.trainer_friendship = v;
    }

    pub const fn trainer_memory(&self) -> TrainerMemory {
        self.main_data.trainer_memory
    }

    pub const fn set_trainer_memory(&mut self, v: &TrainerMemory) {
        self.main_data.trainer_memory = *v;
    }

    pub const fn trainer_affection(&self) -> u8 {
        self.main_data.trainer_affection
    }

    pub const fn set_trainer_affection(&mut self, v: u8) {
        self.main_data.trainer_affection = v;
    }

    pub const fn egg_date(&self) -> Option<PokeDate> {
        self.main_data.egg_date
    }

    pub const fn set_egg_date(&mut self, v: Option<PokeDate>) {
        self.main_data.egg_date = v;
    }

    pub const fn met_date(&self) -> PokeDate {
        self.main_data.met_date
    }

    pub const fn set_met_date(&mut self, v: &PokeDate) {
        self.main_data.met_date = *v;
    }

    pub const fn ball(&self) -> Ball {
        self.main_data.ball
    }

    pub const fn set_ball(&mut self, v: Ball) {
        self.main_data.ball = v;
    }

    pub const fn egg_location_index(&self) -> Option<u16> {
        self.main_data.egg_location_index
    }

    pub const fn set_egg_location_index(&mut self, v: Option<u16>) {
        self.main_data.egg_location_index = v;
    }

    pub const fn met_location_index(&self) -> u16 {
        self.main_data.met_location_index
    }

    pub const fn set_met_location_index(&mut self, v: u16) {
        self.main_data.met_location_index = v;
    }

    pub const fn met_level(&self) -> u8 {
        self.main_data.met_level
    }

    pub const fn set_met_level(&mut self, v: u8) {
        self.main_data.met_level = v;
    }

    pub const fn hyper_training(&self) -> HyperTraining {
        self.main_data.hyper_training
    }

    pub const fn set_hyper_training(&mut self, v: &HyperTraining) {
        self.main_data.hyper_training = *v;
    }

    pub const fn trainer_gender(&self) -> BinaryGender {
        self.main_data.trainer_gender
    }

    pub const fn set_trainer_gender(&mut self, v: BinaryGender) {
        self.main_data.trainer_gender = v;
    }

    pub const fn obedience_level(&self) -> u8 {
        self.main_data.obedience_level
    }

    pub const fn set_obedience_level(&mut self, v: u8) {
        self.main_data.obedience_level = v;
    }

    pub const fn nickname(&self) -> SizedUtf16String<26> {
        self.main_data.nickname
    }

    pub const fn set_nickname(&mut self, value: SizedUtf16String<26>) {
        self.main_data.nickname = value;
    }

    pub const fn trainer_name(&self) -> SizedUtf16String<26> {
        self.main_data.trainer_name
    }

    pub const fn set_trainer_name(&mut self, value: SizedUtf16String<26>) {
        self.main_data.trainer_name = value;
    }

    pub const fn handler_name(&self) -> SizedUtf16String<26> {
        self.main_data.handler_name
    }

    pub const fn set_handler_name(&mut self, value: SizedUtf16String<26>) {
        self.main_data.handler_name = value;
    }

    pub const fn moves(&self) -> [MoveSlot; 4] {
        self.main_data.moves
    }

    pub const fn set_moves(&mut self, value: [MoveSlot; 4]) {
        self.main_data.moves = value;
    }

    pub const fn move_pp(&self) -> [u8; 4] {
        self.main_data.move_pp
    }

    pub const fn set_move_pp(&mut self, value: [u8; 4]) {
        self.main_data.move_pp = value;
    }

    pub const fn move_pp_ups(&self) -> [u8; 4] {
        self.main_data.move_pp_ups
    }

    pub const fn set_move_pp_ups(&mut self, value: [u8; 4]) {
        self.main_data.move_pp_ups = value;
    }

    pub const fn relearn_moves(&self) -> [MoveSlot; 4] {
        self.main_data.relearn_moves
    }

    pub const fn set_relearn_moves(&mut self, value: [MoveSlot; 4]) {
        self.main_data.relearn_moves = value;
    }

    pub fn home_tracker(&self) -> Option<Vec<u8>> {
        if self.main_data.home_tracker.iter().all(|b| *b == 0) {
            None
        } else {
            Some(self.main_data.home_tracker.to_vec())
        }
    }

    pub fn set_home_tracker(&mut self, tracker: Option<Vec<u8>>) {
        if let Some(tracker) = tracker
            && tracker.len() == 8
        {
            self.main_data.home_tracker.copy_from_slice(&tracker);
        } else {
            self.main_data.home_tracker.copy_from_slice(&[0u8; 8]);
        }
    }

    pub fn add_modern_ribbons(&mut self, ribbon_indices: Vec<usize>) {
        ribbon_indices
            .into_iter()
            .filter_map(ModernRibbon::from_index)
            .map(OpenHomeRibbon::Mod)
            .for_each(|r| self.main_data.ribbons.add_ribbon(r));
    }

    pub fn add_gen3_ribbons(&mut self, ribbon_indices: Vec<usize>) {
        use pkm_rs_resources::ribbons::Gen3Ribbon;

        ribbon_indices
            .into_iter()
            .map(Gen3Ribbon::from_index)
            .map(Gen3Ribbon::to_openhome)
            .for_each(|r| self.main_data.ribbons.add_ribbon(r));
    }

    //
    // pub fn set_species_and_forme(&mut self, national_dex: u16, forme_index: u16) -> JsResult<()> {
    //     match SpeciesAndForme::new(national_dex, forme_index) {
    //         Ok(species_and_forme) => {
    //             self.main_data.species_and_forme = species_and_forme;
    //             Ok(())
    //         }
    //         Err(e) => Err(JsValue::from_str(&e.to_string())),
    //     }
    // }

    // Plugins

    pub fn plugin_origin(&self) -> Option<String> {
        Some(self.plugin_data.clone()?.plugin_origin)
    }

    pub fn set_plugin_origin(&mut self, value: Option<String>) {
        match value {
            Some(plugin_origin) => {
                self.plugin_data.get_or_insert_default().plugin_origin = plugin_origin
            }
            None => self.plugin_data = None,
        }
    }

    // Game Boy

    pub fn dvs(&self) -> StatsPreSplit {
        match self.gameboy_data {
            Some(data) => data.dvs,
            None => GameboyData::from_main_data(&self.main_data).dvs,
        }
    }

    pub fn met_time_of_day(&self) -> Option<u8> {
        Some(self.gameboy_data?.met_time_of_day)
    }

    pub fn evs_g12(&self) -> Option<StatsPreSplit> {
        Some(self.gameboy_data?.evs_g12)
    }

    pub const fn update_evs_g12(&mut self, value: StatsPreSplit) {
        if let Some(gameboy_data) = &mut self.gameboy_data {
            gameboy_data.evs_g12 = value
        }
    }

    pub const fn set_gameboy_data(
        &mut self,
        dvs: StatsPreSplit,
        met_time_of_day: u8,
        evs_g12: StatsPreSplit,
    ) {
        self.gameboy_data = Some(GameboyData {
            dvs,
            met_time_of_day,
            evs_g12,
        })
    }

    // Gen 4/5

    pub fn encounter_type(&self) -> Option<u8> {
        Some(self.gen45_data?.encounter_type)
    }

    pub fn set_encounter_type(&mut self, value: Option<u8>) {
        match value {
            Some(encounter_type) => {
                self.gen45_data.get_or_insert_default().encounter_type = encounter_type
            }
            None => {
                if let Some(gen45_data) = &mut self.gen45_data {
                    gen45_data.encounter_type = 0
                }
            }
        }
    }

    pub fn performance(&self) -> Option<u8> {
        Some(self.gen45_data?.performance)
    }

    pub fn set_performance(&mut self, value: Option<u8>) {
        match value {
            Some(performance) => self.gen45_data.get_or_insert_default().performance = performance,
            None => {
                if let Some(gen45_data) = &mut self.gen45_data {
                    gen45_data.performance = 0
                }
            }
        }
    }

    pub fn shiny_leaves(&self) -> Option<ShinyLeaves> {
        Some(self.gen45_data?.shiny_leaves)
    }

    pub fn set_shiny_leaves(&mut self, value: Option<ShinyLeaves>) {
        match value {
            Some(shiny_leaves) => {
                self.gen45_data.get_or_insert_default().shiny_leaves = shiny_leaves
            }
            None => {
                if let Some(gen45_data) = &mut self.gen45_data {
                    gen45_data.shiny_leaves = ShinyLeaves::default()
                }
            }
        }
    }

    pub fn poke_star_fame(&self) -> Option<u8> {
        Some(self.gen45_data?.poke_star_fame)
    }

    pub fn set_poke_star_fame(&mut self, value: Option<u8>) {
        match value {
            Some(poke_star_fame) => {
                self.gen45_data.get_or_insert_default().poke_star_fame = poke_star_fame
            }
            None => {
                if let Some(gen45_data) = &mut self.gen45_data {
                    gen45_data.poke_star_fame = 0
                }
            }
        }
    }

    pub fn is_ns_pokemon(&self) -> Option<bool> {
        Some(self.gen45_data?.is_ns_pokemon)
    }

    pub fn set_is_ns_pokemon(&mut self, value: Option<bool>) {
        match value {
            Some(is_ns_pokemon) => {
                self.gen45_data.get_or_insert_default().is_ns_pokemon = is_ns_pokemon
            }
            None => {
                if let Some(gen45_data) = &mut self.gen45_data {
                    gen45_data.is_ns_pokemon = false
                }
            }
        }
    }

    // Gen 6/7

    pub fn training_bag_hits(&self) -> Option<u8> {
        Some(self.gen67_data?.training_bag_hits)
    }

    pub fn set_training_bag_hits(&mut self, value: Option<u8>) {
        match value {
            Some(training_bag_hits) => {
                self.gen67_data.get_or_insert_default().training_bag_hits = training_bag_hits
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.training_bag_hits = 0
                }
            }
        }
    }

    pub fn training_bag(&self) -> Option<u8> {
        Some(self.gen67_data?.training_bag)
    }

    pub fn set_training_bag(&mut self, value: Option<u8>) {
        match value {
            Some(training_bag) => {
                self.gen67_data.get_or_insert_default().training_bag = training_bag
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.training_bag = 0
                }
            }
        }
    }

    pub fn super_training_flags(&self) -> Option<u32> {
        Some(self.gen67_data?.super_training_flags)
    }

    pub fn set_super_training_flags(&mut self, value: Option<u32>) {
        match value {
            Some(super_training_flags) => {
                self.gen67_data.get_or_insert_default().super_training_flags = super_training_flags
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.super_training_flags = 0
                }
            }
        }
    }

    pub fn super_training_dist_flags(&self) -> Option<u8> {
        Some(self.gen67_data?.super_training_dist_flags)
    }

    pub fn set_super_training_dist_flags(&mut self, value: Option<u8>) {
        match value {
            Some(super_training_dist_flags) => {
                self.gen67_data
                    .get_or_insert_default()
                    .super_training_dist_flags = super_training_dist_flags
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.super_training_dist_flags = 0
                }
            }
        }
    }

    pub fn secret_super_training_unlocked(&self) -> Option<bool> {
        Some(self.gen67_data?.secret_super_training_unlocked)
    }

    pub fn set_secret_super_training_unlocked(&mut self, value: Option<bool>) {
        match value {
            Some(secret_super_training_unlocked) => {
                self.gen67_data
                    .get_or_insert_default()
                    .secret_super_training_unlocked = secret_super_training_unlocked
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.secret_super_training_unlocked = false
                }
            }
        }
    }

    pub fn secret_super_training_complete(&self) -> Option<bool> {
        Some(self.gen67_data?.secret_super_training_complete)
    }

    pub fn set_secret_super_training_complete(&mut self, value: Option<bool>) {
        match value {
            Some(secret_super_training_complete) => {
                self.gen67_data
                    .get_or_insert_default()
                    .secret_super_training_complete = secret_super_training_complete
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.secret_super_training_complete = false
                }
            }
        }
    }

    pub fn country(&self) -> Option<u8> {
        Some(self.gen67_data?.country)
    }

    pub fn set_country(&mut self, value: Option<u8>) {
        match value {
            Some(country) => self.gen67_data.get_or_insert_default().country = country,
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.country = 0
                }
            }
        }
    }

    pub fn region(&self) -> Option<u8> {
        Some(self.gen67_data?.region)
    }

    pub fn set_region(&mut self, value: Option<u8>) {
        match value {
            Some(region) => self.gen67_data.get_or_insert_default().region = region,
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.region = 0
                }
            }
        }
    }

    pub fn geolocations(&self) -> Option<Geolocations> {
        Some(self.gen67_data?.geolocations)
    }

    pub fn set_geolocations(&mut self, value: Option<Geolocations>) {
        match value {
            Some(geolocations) => {
                self.gen67_data.get_or_insert_default().geolocations = geolocations
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.geolocations = Geolocations::default()
                }
            }
        }
    }

    pub fn resort_event_status(&self) -> Option<u8> {
        Some(self.gen67_data?.resort_event_status)
    }

    pub fn set_resort_event_status(&mut self, value: Option<u8>) {
        match value {
            Some(resort_event_status) => {
                self.gen67_data.get_or_insert_default().resort_event_status = resort_event_status
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.resort_event_status = 0
                }
            }
        }
    }

    pub fn avs(&self) -> Option<Stats16Le> {
        Some(self.gen67_data?.avs)
    }

    pub fn set_avs(&mut self, value: Option<Stats16Le>) {
        match value {
            Some(avs) => self.gen67_data.get_or_insert_default().avs = avs,
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.avs = Stats16Le::default()
                }
            }
        }
    }

    // Sword/Shield

    pub fn can_gigantamax(&self) -> Option<bool> {
        Some(self.swsh_data?.can_gigantamax)
    }

    pub fn set_can_gigantamax(&mut self, value: Option<bool>) {
        match value {
            Some(can_gigantamax) => {
                self.swsh_data.get_or_insert_default().can_gigantamax = can_gigantamax
            }
            None => {
                if let Some(swsh_data) = &mut self.swsh_data {
                    swsh_data.can_gigantamax = false
                }
            }
        }
    }

    pub fn dynamax_level(&self) -> Option<u8> {
        Some(self.swsh_data?.dynamax_level)
    }

    pub fn set_dynamax_level(&mut self, value: Option<u8>) {
        match value {
            Some(dynamax_level) => {
                self.swsh_data.get_or_insert_default().dynamax_level = dynamax_level
            }
            None => {
                if let Some(swsh_data) = &mut self.swsh_data {
                    swsh_data.dynamax_level = 0
                }
            }
        }
    }

    pub fn palma(&self) -> Option<u32> {
        Some(self.swsh_data?.palma)
    }

    pub fn set_palma(&mut self, value: Option<u32>) {
        match value {
            Some(palma) => self.swsh_data.get_or_insert_default().palma = palma,
            None => {
                if let Some(swsh_data) = &mut self.swsh_data {
                    swsh_data.palma = 0
                }
            }
        }
    }

    pub fn tr_flags_swsh(&self) -> Option<Vec<u8>> {
        Some(self.swsh_data?.tr_flags.to_vec())
    }

    pub fn set_tr_flags_swsh(&mut self, value: Option<Vec<u8>>) {
        match value {
            Some(tr_flags) => self.swsh_data.get_or_insert_default().tr_flags[0..tr_flags.len()]
                .copy_from_slice(&tr_flags),
            None => {
                if let Some(swsh_data) = &mut self.swsh_data {
                    swsh_data.tr_flags = [0u8; 14]
                }
            }
        }
    }

    // Brilliant Diamond/Shining Pearl

    pub fn tutor_flags_bdsp(&self) -> Option<Vec<u8>> {
        Some(self.bdsp_data?.tm_flags.to_bytes().to_vec())
    }

    pub fn set_tm_flags_bdsp(&mut self, value: Option<Vec<u8>>) {
        match value {
            Some(tm_flags) => {
                let mut new_bytes = [0u8; 14];
                new_bytes.copy_from_slice(&tm_flags);
                self.bdsp_data.get_or_insert_default().tm_flags =
                    FlagSet::<14>::from_bytes(new_bytes);
            }
            None => {
                if let Some(bdsp_data) = &mut self.bdsp_data {
                    bdsp_data.tm_flags = FlagSet::default();
                }
            }
        }
    }

    // Legends Arceus

    pub fn gvs(&self) -> Option<Stats8> {
        Some(self.la_data?.gvs)
    }

    pub fn set_gvs(&mut self, value: Option<Stats8>) {
        match value {
            Some(gvs) => self.la_data.get_or_insert_default().gvs = gvs,
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.gvs = Stats8::default()
                }
            }
        }
    }

    pub fn alpha_move(&self) -> Option<u16> {
        Some(self.la_data?.alpha_move)
    }

    pub fn set_alpha_move(&mut self, value: Option<u16>) {
        match value {
            Some(alpha_move) => self.la_data.get_or_insert_default().alpha_move = alpha_move,
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.alpha_move = 0
                }
            }
        }
    }

    pub fn move_flags_la(&self) -> Option<Vec<u8>> {
        Some(self.la_data?.move_flags.to_bytes().to_vec())
    }

    pub fn set_move_flags_la(&mut self, value: Option<Vec<u8>>) {
        match value {
            Some(move_flags) => {
                let mut new_bytes = [0u8; 14];
                new_bytes.copy_from_slice(&move_flags);
                self.la_data.get_or_insert_default().move_flags =
                    FlagSet::<14>::from_bytes(new_bytes);
            }
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.move_flags = FlagSet::default();
                }
            }
        }
    }

    pub fn tutor_flags_la(&self) -> Option<Vec<u8>> {
        Some(self.la_data?.tutor_flags.to_bytes().to_vec())
    }

    pub fn set_tutor_flags_la(&mut self, value: Option<Vec<u8>>) {
        match value {
            Some(tutor_flags) => {
                let mut new_bytes = [0u8; 8];
                new_bytes.copy_from_slice(&tutor_flags);
                self.la_data.get_or_insert_default().tutor_flags =
                    FlagSet::<8>::from_bytes(new_bytes);
            }
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.tutor_flags = FlagSet::default();
                }
            }
        }
    }

    pub fn master_flags_la(&self) -> Option<Vec<u8>> {
        Some(self.la_data?.master_flags.to_bytes().to_vec())
    }

    pub fn set_master_flags_la(&mut self, value: Option<Vec<u8>>) {
        match value {
            Some(master_flags) => {
                let mut new_bytes = [0u8; 8];
                new_bytes.copy_from_slice(&master_flags);
                self.la_data.get_or_insert_default().master_flags =
                    FlagSet::<8>::from_bytes(new_bytes);
            }
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.master_flags = FlagSet::default();
                }
            }
        }
    }

    pub fn is_noble(&self) -> Option<bool> {
        Some(self.la_data?.is_noble)
    }

    pub fn set_is_noble(&mut self, value: Option<bool>) {
        match value {
            Some(is_noble) => self.la_data.get_or_insert_default().is_noble = is_noble,
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.is_noble = false
                }
            }
        }
    }

    pub fn is_alpha(&self) -> Option<bool> {
        Some(self.la_data?.is_alpha)
    }

    pub fn set_is_alpha(&mut self, value: Option<bool>) {
        match value {
            Some(is_alpha) => self.la_data.get_or_insert_default().is_alpha = is_alpha,
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.is_alpha = false
                }
            }
        }
    }

    pub fn flag2_la(&self) -> Option<bool> {
        Some(self.la_data?.flag2)
    }

    pub fn set_flag2_la(&mut self, value: Option<bool>) {
        match value {
            Some(flag2_la) => self.la_data.get_or_insert_default().flag2 = flag2_la,
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.flag2 = false
                }
            }
        }
    }

    pub fn unknown_f3(&self) -> Option<u8> {
        Some(self.la_data?.unknown_f3)
    }

    pub fn set_unknown_f3(&mut self, value: Option<u8>) {
        match value {
            Some(unknown_f3) => self.la_data.get_or_insert_default().unknown_f3 = unknown_f3,
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.unknown_f3 = 0
                }
            }
        }
    }

    pub fn unknown_a0(&self) -> Option<u32> {
        Some(self.la_data?.unknown_a0)
    }

    pub fn set_unknown_a0(&mut self, value: Option<u32>) {
        match value {
            Some(unknown_a0) => self.la_data.get_or_insert_default().unknown_a0 = unknown_a0,
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.unknown_a0 = 0
                }
            }
        }
    }

    // Scarlet/Violet

    pub fn tera_type_original(&self) -> TeraTypeWasm {
        self.sv_data
            .map(|d| TeraTypeWasm::from(d.tera_type_original))
            .unwrap_or(
                self.species_and_forme()
                    .get_forme_metadata()
                    .transferred_tera_type()
                    .into(),
            )
    }

    pub fn set_tera_type_original_if(&mut self, value: Option<u8>) {
        let Some(value) = value else { return };

        if let Some(tera_type) = TeraTypeWasm::from_byte(value) {
            self.sv_data
                .get_or_insert(ScarletVioletData::default_generated_tera_type(
                    self.main_data.species_and_forme,
                ))
                .tera_type_original = tera_type.into()
        }
    }

    pub fn tera_type_override(&self) -> u8 {
        self.sv_data
            .and_then(|d| d.tera_type_override)
            .map_or(19, TeraType::to_byte)
    }

    pub fn set_tera_type_override(&mut self, value: u8) {
        self.sv_data
            .get_or_insert(ScarletVioletData::default_generated_tera_type(
                self.main_data.species_and_forme,
            ))
            .tera_type_override = TeraType::from_byte(value);
    }

    pub fn tm_flags_sv(&self) -> Option<Vec<u8>> {
        Some(self.sv_data?.tm_flags.to_bytes().to_vec())
    }

    pub fn set_tm_flags_sv(&mut self, value: Option<Vec<u8>>) {
        match value {
            Some(tm_flags) => {
                let mut new_bytes = [0u8; 22];
                new_bytes.copy_from_slice(&tm_flags);
                self.sv_data.get_or_insert_default().tm_flags =
                    FlagSet::<22>::from_bytes(new_bytes);
            }
            None => {
                if let Some(sv_data) = &mut self.sv_data {
                    sv_data.tm_flags = FlagSet::<22>::default();
                }
            }
        }
    }

    pub fn tm_flags_sv_dlc(&self) -> Option<Vec<u8>> {
        Some(self.sv_data?.tm_flags_dlc.to_bytes().to_vec())
    }

    pub fn set_tm_flags_sv_dlc(&mut self, value: Option<Vec<u8>>) {
        match value {
            Some(tm_flags_dlc) => {
                let mut new_bytes = [0u8; 13];
                new_bytes.copy_from_slice(&tm_flags_dlc);
                self.sv_data.get_or_insert_default().tm_flags_dlc =
                    FlagSet::<13>::from_bytes(new_bytes);
            }
            None => {
                if let Some(sv_data) = &mut self.sv_data {
                    sv_data.tm_flags_dlc = FlagSet::<13>::default();
                }
            }
        }
    }

    // Past Handlers

    pub fn handlers(&self) -> Vec<PastHandlerData> {
        self.handler_data.clone()
    }

    pub fn matching_unknown_handler(
        &mut self,
        name: String,
        gender: Gender,
    ) -> Option<PastHandlerData> {
        let sized_string = SizedUtf16String::<26>::from(name);
        self.handler_data
            .iter()
            .find(|h| h.unknown_trainer_data_matches(&sized_string, gender))
            .cloned()
    }

    pub fn find_known_handler(
        &mut self,
        tid: u16,
        sid: u16,
        game: OriginGame,
        plugin: Option<String>,
    ) -> Option<PastHandlerData> {
        self.handler_data
            .iter()
            .find(|h| h.known_trainer_data_matches(tid, sid, game, &plugin))
            .cloned()
    }

    pub fn register_handler(&mut self, handler: TrainerData, plugin: Option<String>) {
        if let Some(origin_game) = handler.origin_game
            && let Some(matching_known_record) = self.handler_data.iter_mut().find(|h| {
                h.known_trainer_data_matches(handler.id, handler.secret_id, origin_game, &plugin)
            })
        {
            matching_known_record.update_from(&handler, plugin);
        } else if let Some(matching_unknown_record) = self
            .handler_data
            .iter_mut()
            .find(|h| h.unknown_trainer_data_matches(&handler.name, handler.gender))
        {
            matching_unknown_record.update_from(&handler, plugin)
        } else {
            let mut handler_data = PastHandlerData::from(handler);
            handler_data.origin_plugin = plugin;
            self.handler_data.push(handler_data);
        }
    }

    // Notes

    pub fn notes(&self) -> Option<String> {
        Some(self.notes.clone()?.0)
    }

    pub fn set_notes(&mut self, value: Option<String>) {
        match value {
            Some(notes) => self.notes = Some(Notes(notes)),
            None => self.notes = None,
        }
    }

    // Most Recent save

    pub fn most_recent_save(&self) -> Option<MostRecentSave> {
        self.most_recent_save.clone()
    }

    // Calculated

    pub fn is_shiny(&self) -> bool {
        self.main_data.is_shiny()
    }

    pub fn is_square_shiny(&self) -> bool {
        self.main_data.is_square_shiny()
    }

    // Helpers

    pub fn trade_to_save(&mut self, game: OriginGame) {
        if game.is_gameboy() && self.gameboy_data.is_none() {
            self.gameboy_data = Some(GameboyData::from_main_data(&self.main_data));
        }
    }

    pub fn set_recent_save(
        &mut self,
        game: OriginGame,
        trainer_id: u16,
        secret_id: u16,
        trainer_name: String,
        save_path: String,
    ) {
        self.most_recent_save = Some(MostRecentSave {
            trainer_id,
            secret_id,
            game,
            trainer_name: trainer_name.into(),
            file_path: save_path,
        })
    }

    pub fn get_present_sections(&self) -> Vec<String> {
        self.to_sectioned_data()
            .all_section_tags()
            .iter()
            .map(|t| t.to_string())
            .collect()
    }
}

impl OhpkmV2 {
    pub fn new(national_dex: u16, forme_index: u16) -> Result<Self> {
        Ok(Self {
            main_data: MainDataV2::new(national_dex, forme_index)?,
            gameboy_data: None,
            gen45_data: None,
            gen67_data: None,
            swsh_data: None,
            bdsp_data: None,
            la_data: None,
            sv_data: None,
            handler_data: Vec::new(),
            plugin_data: None,
            notes: None,
            most_recent_save: None,
        })
    }
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let sectioned_data = SectionedData::<SectionTagV2>::from_bytes(bytes)?;

        if sectioned_data.magic_number != MAGIC_NUMBER {
            return Err(Error::other("Bad magic number"));
        } else if sectioned_data.version != 2 {
            return Err(Error::other("Bad version number"));
        }

        Ok(Self {
            main_data: MainDataV2::extract_from(&sectioned_data)?
                .ok_or(Error::other("Main data not present in OHPKM V2 file"))?,
            gameboy_data: GameboyData::extract_from(&sectioned_data)?,
            gen45_data: Gen45Data::extract_from(&sectioned_data)?,
            gen67_data: Gen67Data::extract_from(&sectioned_data)?,
            swsh_data: SwordShieldData::extract_from(&sectioned_data)?,
            bdsp_data: BdspData::extract_from(&sectioned_data)?,
            la_data: LegendsArceusData::extract_from(&sectioned_data)?,
            sv_data: ScarletVioletData::extract_from(&sectioned_data)?,
            handler_data: PastHandlerData::extract_all_from(&sectioned_data)?,
            plugin_data: PluginData::extract_from(&sectioned_data)?,
            notes: Notes::extract_from(&sectioned_data)?,
            most_recent_save: MostRecentSave::extract_from(&sectioned_data)?,
        })
    }

    pub fn from_v1(old: OhpkmV1) -> Self {
        Self {
            main_data: MainDataV2::from_v1(old),
            gameboy_data: GameboyData::from_v1(old),
            gen45_data: Gen45Data::from_v1(old),
            gen67_data: Gen67Data::from_v1(old),
            swsh_data: SwordShieldData::from_v1(old),
            bdsp_data: BdspData::from_v1(old),
            la_data: LegendsArceusData::from_v1(old),
            sv_data: ScarletVioletData::from_v1(old),
            handler_data: PastHandlerData::from_v1(old).map_or(Vec::new(), |hd| vec![hd]),
            plugin_data: PluginData::from_v1(old),
            notes: None,
            most_recent_save: None,
        }
    }

    pub fn to_sectioned_data(&self) -> SectionedData<SectionTagV2> {
        let mut sectioned_data = SectionedData::new(MAGIC_NUMBER, CURRENT_VERSION);
        sectioned_data
            .add(self.main_data)
            .add_if_some(self.gameboy_data)
            .add_if_some(self.gen45_data)
            .add_if_some(self.gen67_data)
            .add_if_some(self.swsh_data)
            .add_if_some(self.bdsp_data)
            .add_if_some(self.la_data)
            .add_if_some(self.sv_data)
            .add_all(self.handler_data.clone())
            .add_if_some(self.plugin_data.clone())
            .add_if_some(self.notes.clone())
            .add_if_some(self.most_recent_save.clone());
        sectioned_data
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        self.to_sectioned_data().to_bytes()
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl OhpkmV2 {
    #[wasm_bindgen(constructor)]
    pub fn from_byte_vector(bytes: &[u8]) -> JsResult<Self> {
        if !bytes.is_empty() {
            Self::from_bytes(bytes).map_err(|e| JsValue::from_str(&e.to_string()))
        } else {
            Ok(Self::default())
        }
    }

    pub fn to_bytes_js(&self) -> Vec<u8> {
        self.to_bytes()
    }

    pub fn from_v1_bytes(bytes: Vec<u8>) -> JsResult<Self> {
        Ok(OhpkmV1::from_bytes(&bytes).map(OhpkmV2::from_v1)?)
    }

    pub fn get_section_bytes(&self) -> JsResult<js_sys::Object> {
        let obj = js_sys::Object::new();

        js_sys::Reflect::set(
            &obj,
            &JsValue::from("MainData"),
            &JsValue::from(self.main_data.to_bytes()),
        )?;
        add_section_bytes_to_js_object(&obj, &self.gameboy_data)?;
        add_section_bytes_to_js_object(&obj, &self.gen45_data)?;
        add_section_bytes_to_js_object(&obj, &self.gen67_data)?;
        add_section_bytes_to_js_object(&obj, &self.swsh_data)?;
        add_section_bytes_to_js_object(&obj, &self.bdsp_data)?;
        add_section_bytes_to_js_object(&obj, &self.la_data)?;
        add_section_bytes_to_js_object(&obj, &self.sv_data)?;
        add_section_bytes_to_js_object(&obj, &self.plugin_data)?;

        Ok(obj)
    }

    #[wasm_bindgen(getter = openhomeId)]
    pub fn openhome_id_js(&self) -> String {
        self.openhome_id()
    }

    #[wasm_bindgen(getter = personalityValue)]
    pub fn personality_value_js(&self) -> u32 {
        self.personality_value()
    }
    #[wasm_bindgen(setter = personalityValue)]
    pub fn set_personality_value_js(&mut self, v: u32) {
        self.set_personality_value(v);
    }

    #[wasm_bindgen(getter = encryptionConstant)]
    pub fn encryption_constant_js(&self) -> u32 {
        self.encryption_constant()
    }
    #[wasm_bindgen(setter = encryptionConstant)]
    pub fn set_encryption_constant_js(&mut self, v: u32) {
        self.set_encryption_constant(v);
    }

    #[wasm_bindgen(getter = speciesAndForme)]
    pub fn species_and_forme_js(&self) -> SpeciesAndForme {
        self.species_and_forme()
    }
    #[wasm_bindgen(setter = speciesAndForme)]
    pub fn set_species_and_forme_js(&mut self, v: &SpeciesAndForme) {
        self.set_species_and_forme(v);
    }

    #[wasm_bindgen(getter = heldItemIndex)]
    pub fn held_item_index_js(&self) -> u16 {
        self.held_item_index()
    }
    #[wasm_bindgen(setter = heldItemIndex)]
    pub fn set_held_item_index_js(&mut self, v: u16) {
        self.set_held_item_index(v);
    }

    #[wasm_bindgen(getter = trainerID)]
    pub fn trainer_id_js(&self) -> u16 {
        self.trainer_id()
    }
    #[wasm_bindgen(setter = trainerID)]
    pub fn set_trainer_id_js(&mut self, v: u16) {
        self.set_trainer_id(v);
    }

    #[wasm_bindgen(getter = secretID)]
    pub fn secret_id_js(&self) -> u16 {
        self.secret_id()
    }
    #[wasm_bindgen(setter = secretID)]
    pub fn set_secret_id_js(&mut self, v: u16) {
        self.set_secret_id(v);
    }

    #[wasm_bindgen(getter = exp)]
    pub fn exp_js(&self) -> u32 {
        self.exp()
    }
    #[wasm_bindgen(setter = exp)]
    pub fn set_exp_js(&mut self, v: u32) {
        self.set_exp(v);
    }

    #[wasm_bindgen(getter = abilityIndex)]
    pub fn ability_index_js(&self) -> AbilityIndex {
        self.ability_index()
    }
    #[wasm_bindgen(setter = abilityIndex)]
    pub fn set_ability_index_js(&mut self, v: &AbilityIndex) {
        self.set_ability_index(v);
    }

    #[wasm_bindgen(getter = abilityNum)]
    pub fn ability_num_js(&self) -> u8 {
        self.ability_num().to_byte()
    }
    #[wasm_bindgen(setter = abilityNum)]
    pub fn set_ability_num_js(&mut self, v: u8) {
        self.set_ability_num(AbilityNumber::from_u8_first_three_bits(v).unwrap_or_default());
    }

    #[wasm_bindgen(getter = favorite)]
    pub fn favorite_js(&self) -> bool {
        self.favorite()
    }
    #[wasm_bindgen(setter = favorite)]
    pub fn set_favorite_js(&mut self, v: bool) {
        self.set_favorite(v);
    }

    #[wasm_bindgen(getter = isShadow)]
    pub fn is_shadow_js(&self) -> bool {
        self.is_shadow()
    }
    #[wasm_bindgen(setter = isShadow)]
    pub fn set_is_shadow_js(&mut self, v: bool) {
        self.set_is_shadow(v);
    }

    #[wasm_bindgen(getter = markingsWasm)]
    pub fn markings_js(&self) -> MarkingsSixShapesColors {
        self.markings()
    }

    #[wasm_bindgen(setter = markingsWasm)]
    pub fn set_markings_js(&mut self, v: &MarkingsSixShapesColors) {
        self.set_markings(v);
    }

    #[wasm_bindgen(getter = nature)]
    pub fn nature_js(&self) -> NatureIndex {
        self.nature()
    }

    #[wasm_bindgen(setter = nature)]
    pub fn set_nature_js(&mut self, v: &NatureIndex) {
        self.set_nature(v);
    }

    #[wasm_bindgen(getter = statNature)]
    pub fn stat_nature_js(&self) -> NatureIndex {
        self.stat_nature()
    }
    #[wasm_bindgen(setter = statNature)]
    pub fn set_stat_nature_js(&mut self, v: &NatureIndex) {
        self.set_stat_nature(v);
    }

    #[wasm_bindgen(getter = isFatefulEncounter)]
    pub fn is_fateful_encounter_js(&self) -> bool {
        self.is_fateful_encounter()
    }
    #[wasm_bindgen(setter = isFatefulEncounter)]
    pub fn set_is_fateful_encounter_js(&mut self, v: bool) {
        self.set_is_fateful_encounter(v);
    }

    #[wasm_bindgen(getter = gender)]
    pub fn gender_js(&self) -> u8 {
        self.gender() as u8
    }
    #[wasm_bindgen(setter = gender)]
    pub fn set_gender_js(&mut self, v: u8) {
        self.set_gender(Gender::from_u8(v));
    }

    #[wasm_bindgen(getter = evsWasm)]
    pub fn evs_js(&self) -> Stats8 {
        self.evs()
    }
    #[wasm_bindgen(setter = evsWasm)]
    pub fn set_evs_js(&mut self, v: &Stats8) {
        self.set_evs(v);
    }

    #[wasm_bindgen(getter = contestWasm)]
    pub fn contest_js(&self) -> ContestStats {
        self.contest()
    }
    #[wasm_bindgen(setter = contestWasm)]
    pub fn set_contest_js(&mut self, v: &ContestStats) {
        self.set_contest(v);
    }

    #[wasm_bindgen(getter = pokerusByte)]
    pub fn pokerus_byte_js(&self) -> u8 {
        self.pokerus_byte()
    }
    #[wasm_bindgen(setter = pokerusByte)]
    pub fn set_pokerus_byte_js(&mut self, v: u8) {
        self.set_pokerus_byte(v);
    }

    #[wasm_bindgen(getter = contestMemoryCount)]
    pub fn contest_memory_count_js(&self) -> u8 {
        self.contest_memory_count()
    }
    #[wasm_bindgen(setter = contestMemoryCount)]
    pub fn set_contest_memory_count_js(&mut self, v: u8) {
        self.set_contest_memory_count(v);
    }

    #[wasm_bindgen(getter = battleMemoryCount)]
    pub fn battle_memory_count_js(&self) -> u8 {
        self.battle_memory_count()
    }
    #[wasm_bindgen(setter = battleMemoryCount)]
    pub fn set_battle_memory_count_js(&mut self, v: u8) {
        self.set_battle_memory_count(v);
    }

    #[wasm_bindgen(getter = ribbons)]
    pub fn ribbons_js(&self) -> Vec<String> {
        self.ribbons()
            .into_iter()
            .map(|r| {
                let ribbon_name = r.to_string();
                if ribbon_name.ends_with(" Ribbon") {
                    ribbon_name.strip_suffix(" Ribbon").unwrap().to_owned()
                } else {
                    ribbon_name
                }
            })
            .collect()
    }
    #[wasm_bindgen(setter = ribbons)]
    pub fn set_ribbons_js(&mut self, v: Vec<String>) {
        self.set_ribbons(OpenHomeRibbonSet::from_names(v));
    }

    #[wasm_bindgen(getter = sociability)]
    pub fn sociability_js(&self) -> u32 {
        self.sociability()
    }
    #[wasm_bindgen(setter = sociability)]
    pub fn set_sociability_js(&mut self, v: u32) {
        self.set_sociability(v);
    }

    #[wasm_bindgen(getter = heightScalar)]
    pub fn height_scalar_js(&self) -> u8 {
        self.height_scalar()
    }
    #[wasm_bindgen(setter = heightScalar)]
    pub fn set_height_scalar_js(&mut self, v: u8) {
        self.set_height_scalar(v);
    }

    #[wasm_bindgen(getter = weightScalar)]
    pub fn weight_scalar_js(&self) -> u8 {
        self.weight_scalar()
    }
    #[wasm_bindgen(setter = weightScalar)]
    pub fn set_weight_scalar_js(&mut self, v: u8) {
        self.set_weight_scalar(v);
    }

    #[wasm_bindgen(getter = scale)]
    pub fn scale_js(&self) -> u8 {
        self.scale()
    }
    #[wasm_bindgen(setter = scale)]
    pub fn set_scale_js(&mut self, v: u8) {
        self.set_scale(v);
    }

    #[wasm_bindgen(getter = ivsWasm)]
    pub fn ivs_js(&self) -> Stats8 {
        self.ivs()
    }
    #[wasm_bindgen(setter = ivsWasm)]
    pub fn set_ivs_js(&mut self, v: &Stats8) {
        self.set_ivs(v);
    }

    #[wasm_bindgen(getter = isEgg)]
    pub fn is_egg_js(&self) -> bool {
        self.is_egg()
    }
    #[wasm_bindgen(setter = isEgg)]
    pub fn set_is_egg_js(&mut self, v: bool) {
        self.set_is_egg(v);
    }

    #[wasm_bindgen(getter = isNicknamed)]
    pub fn is_nicknamed_js(&self) -> bool {
        self.is_nicknamed()
    }
    #[wasm_bindgen(setter = isNicknamed)]
    pub fn set_is_nicknamed_js(&mut self, v: bool) {
        self.set_is_nicknamed(v);
    }

    #[wasm_bindgen(getter = handlerLanguage)]
    pub fn handler_language_js(&self) -> u8 {
        self.handler_language()
    }
    #[wasm_bindgen(setter = handlerLanguage)]
    pub fn set_handler_language_js(&mut self, v: u8) {
        self.set_handler_language(v);
    }

    #[wasm_bindgen(getter = isCurrentHandler)]
    pub fn is_current_handler_js(&self) -> bool {
        self.is_current_handler()
    }
    #[wasm_bindgen(setter = isCurrentHandler)]
    pub fn set_is_current_handler_js(&mut self, v: bool) {
        self.set_is_current_handler(v);
    }

    #[wasm_bindgen(getter = handlerId)]
    pub fn handler_id_js(&self) -> u16 {
        self.handler_id()
    }
    #[wasm_bindgen(setter = handlerId)]
    pub fn set_handler_id_js(&mut self, v: u16) {
        self.set_handler_id(v);
    }

    #[wasm_bindgen(getter = handlerFriendship)]
    pub fn handler_friendship_js(&self) -> u8 {
        self.handler_friendship()
    }
    #[wasm_bindgen(setter = handlerFriendship)]
    pub fn set_handler_friendship_js(&mut self, v: u8) {
        self.set_handler_friendship(v);
    }

    #[wasm_bindgen(getter = handlerMemoryWasm)]
    pub fn handler_memory_js(&self) -> TrainerMemory {
        self.handler_memory()
    }
    #[wasm_bindgen(setter = handlerMemoryWasm)]
    pub fn set_handler_memory_js(&mut self, v: &TrainerMemory) {
        self.set_handler_memory(v);
    }

    #[wasm_bindgen(getter = handlerAffection)]
    pub fn handler_affection_js(&self) -> u8 {
        self.handler_affection()
    }
    #[wasm_bindgen(setter = handlerAffection)]
    pub fn set_handler_affection_js(&mut self, v: u8) {
        self.set_handler_affection(v);
    }

    #[wasm_bindgen(getter = handlerGender)]
    pub fn handler_gender_js(&self) -> bool {
        self.handler_gender().into()
    }
    #[wasm_bindgen(setter = handlerGender)]
    pub fn set_handler_gender_js(&mut self, v: bool) {
        self.set_handler_gender(v.into());
    }

    #[wasm_bindgen(getter = fullness)]
    pub fn fullness_js(&self) -> u8 {
        self.fullness()
    }
    #[wasm_bindgen(setter = fullness)]
    pub fn set_fullness_js(&mut self, v: u8) {
        self.set_fullness(v);
    }

    #[wasm_bindgen(getter = enjoyment)]
    pub fn enjoyment_js(&self) -> u8 {
        self.enjoyment()
    }
    #[wasm_bindgen(setter = enjoyment)]
    pub fn set_enjoyment_js(&mut self, v: u8) {
        self.set_enjoyment(v);
    }

    #[wasm_bindgen(getter = gameOfOrigin)]
    pub fn game_of_origin_js(&self) -> OriginGame {
        self.game_of_origin()
    }
    #[wasm_bindgen(setter = gameOfOrigin)]
    pub fn set_game_of_origin_js(&mut self, v: OriginGame) {
        self.set_game_of_origin(v);
    }

    #[wasm_bindgen(getter = gameOfOriginBattle)]
    pub fn game_of_origin_battle_js(&self) -> Option<u8> {
        self.game_of_origin_battle()
    }
    #[wasm_bindgen(setter = gameOfOriginBattle)]
    pub fn set_game_of_origin_battle_js(&mut self, v: Option<u8>) {
        self.set_game_of_origin_battle(v);
    }

    #[wasm_bindgen(getter = consoleRegion)]
    pub fn console_region_js(&self) -> u8 {
        self.console_region()
    }
    #[wasm_bindgen(setter = consoleRegion)]
    pub fn set_console_region_js(&mut self, v: u8) {
        self.set_console_region(v);
    }

    #[wasm_bindgen(getter = language)]
    pub fn language_js(&self) -> Language {
        self.language()
    }
    #[wasm_bindgen(setter = language)]
    pub fn set_language_js(&mut self, v: Language) {
        self.set_language(v);
    }

    #[wasm_bindgen(getter = formArgument)]
    pub fn form_argument_js(&self) -> u32 {
        self.form_argument()
    }
    #[wasm_bindgen(setter = formArgument)]
    pub fn set_form_argument_js(&mut self, v: u32) {
        self.set_form_argument(v);
    }

    #[wasm_bindgen(getter = affixedRibbon)]
    pub fn affixed_ribbon_js(&self) -> Option<ModernRibbon> {
        self.affixed_ribbon()
    }
    #[wasm_bindgen(setter = affixedRibbon)]
    pub fn set_affixed_ribbon_js(&mut self, v: Option<ModernRibbon>) {
        self.set_affixed_ribbon(v);
    }

    #[wasm_bindgen(getter = trainerFriendship)]
    pub fn trainer_friendship_js(&self) -> u8 {
        self.trainer_friendship()
    }
    #[wasm_bindgen(setter = trainerFriendship)]
    pub fn set_trainer_friendship_js(&mut self, v: u8) {
        self.set_trainer_friendship(v);
    }

    #[wasm_bindgen(getter = trainerMemoryWasm)]
    pub fn trainer_memory_js(&self) -> TrainerMemory {
        self.trainer_memory()
    }
    #[wasm_bindgen(setter = trainerMemoryWasm)]
    pub fn set_trainer_memory_js(&mut self, v: &TrainerMemory) {
        self.set_trainer_memory(v);
    }

    #[wasm_bindgen(getter = trainerAffection)]
    pub fn trainer_affection_js(&self) -> u8 {
        self.main_data.trainer_affection
    }
    #[wasm_bindgen(setter = trainerAffection)]
    pub fn set_trainer_affection_js(&mut self, v: u8) {
        self.main_data.trainer_affection = v;
    }

    #[wasm_bindgen(getter = eggDateWasm)]
    pub fn egg_date_js(&self) -> Option<PokeDate> {
        self.main_data.egg_date
    }
    #[wasm_bindgen(setter = eggDateWasm)]
    pub fn set_egg_date_js(&mut self, v: Option<PokeDate>) {
        self.main_data.egg_date = v;
    }

    #[wasm_bindgen(getter = metDateWasm)]
    pub fn met_date_js(&self) -> PokeDate {
        self.main_data.met_date
    }
    #[wasm_bindgen(setter = metDateWasm)]
    pub fn set_met_date_js(&mut self, v: &PokeDate) {
        self.main_data.met_date = *v;
    }

    #[wasm_bindgen(getter = ball)]
    pub fn ball_js(&self) -> Ball {
        self.main_data.ball
    }
    #[wasm_bindgen(setter = ball)]
    pub fn set_ball_js(&mut self, v: Ball) {
        self.main_data.ball = v;
    }

    #[wasm_bindgen(getter = eggLocationIndex)]
    pub fn egg_location_index_js(&self) -> Option<u16> {
        self.main_data.egg_location_index
    }
    #[wasm_bindgen(setter = eggLocationIndex)]
    pub fn set_egg_location_index_js(&mut self, v: Option<u16>) {
        self.main_data.egg_location_index = v;
    }

    #[wasm_bindgen(getter = metLocationIndex)]
    pub fn met_location_index_js(&self) -> u16 {
        self.main_data.met_location_index
    }
    #[wasm_bindgen(setter = metLocationIndex)]
    pub fn set_met_location_index_js(&mut self, v: u16) {
        self.main_data.met_location_index = v;
    }

    #[wasm_bindgen(getter = metLevel)]
    pub fn met_level_js(&self) -> u8 {
        self.main_data.met_level
    }
    #[wasm_bindgen(setter = metLevel)]
    pub fn set_met_level_js(&mut self, v: u8) {
        self.main_data.met_level = v;
    }

    #[wasm_bindgen(getter = hyperTrainingWasm)]
    pub fn hyper_training_js(&self) -> HyperTraining {
        self.main_data.hyper_training
    }
    #[wasm_bindgen(setter = hyperTrainingWasm)]
    pub fn set_hyper_training_js(&mut self, v: &HyperTraining) {
        self.main_data.hyper_training = *v;
    }

    #[wasm_bindgen(getter = trainerGender)]
    pub fn trainer_gender_js(&self) -> bool {
        self.main_data.trainer_gender.into()
    }
    #[wasm_bindgen(setter = trainerGender)]
    pub fn set_trainer_gender_js(&mut self, v: bool) {
        self.main_data.trainer_gender = BinaryGender::from(v);
    }

    #[wasm_bindgen(getter = obedienceLevel)]
    pub fn obedience_level_js(&self) -> u8 {
        self.main_data.obedience_level
    }
    #[wasm_bindgen(setter = obedienceLevel)]
    pub fn set_obedience_level_js(&mut self, v: u8) {
        self.main_data.obedience_level = v;
    }

    #[wasm_bindgen(getter = nickname)]
    pub fn nickname_js(&self) -> String {
        self.main_data.nickname.to_string()
    }

    #[wasm_bindgen(setter = nickname)]
    pub fn set_nickname_js(&mut self, value: String) {
        self.main_data.nickname = SizedUtf16String::<26>::from(value);
    }

    #[wasm_bindgen(getter = trainerName)]
    pub fn trainer_name_js(&self) -> String {
        self.main_data.trainer_name.to_string()
    }

    #[wasm_bindgen(setter = trainerName)]
    pub fn set_trainer_name_js(&mut self, value: String) {
        self.main_data.trainer_name = SizedUtf16String::<26>::from(value);
    }

    #[wasm_bindgen(getter = handlerName)]
    pub fn handler_name_js(&self) -> String {
        self.main_data.handler_name.to_string()
    }

    #[wasm_bindgen(setter = handlerName)]
    pub fn set_handler_name_js(&mut self, value: String) {
        self.main_data.handler_name = SizedUtf16String::<26>::from(value);
    }

    #[wasm_bindgen(getter = movesWasm)]
    pub fn move_indices_js(&self) -> Vec<u16> {
        self.main_data.moves.into_iter().map(u16::from).collect()
    }

    #[wasm_bindgen(setter = movesWasm)]
    pub fn set_move_indices_js(&mut self, value: &[u16]) {
        self.main_data.moves = [
            MoveSlot::from(value[0]),
            MoveSlot::from(value[1]),
            MoveSlot::from(value[2]),
            MoveSlot::from(value[3]),
        ]
    }

    #[wasm_bindgen(getter = movePpWasm)]
    pub fn move_pp_js(&self) -> Vec<u8> {
        self.main_data.move_pp.into_iter().collect()
    }

    #[wasm_bindgen(setter = movePpWasm)]
    pub fn set_move_pp_js(&mut self, value: &[u8]) {
        self.main_data.move_pp = [value[0], value[1], value[2], value[3]]
    }

    #[wasm_bindgen(getter = movePpUpsWasm)]
    pub fn move_pp_ups_js(&self) -> Vec<u8> {
        self.main_data.move_pp_ups.into_iter().collect()
    }

    #[wasm_bindgen(setter = movePpUpsWasm)]
    pub fn set_move_pp_ups_js(&mut self, value: &[u8]) {
        self.main_data.move_pp_ups = [value[0], value[1], value[2], value[3]]
    }

    #[wasm_bindgen(getter = relearnMovesWasm)]
    pub fn relearn_move_indices_js(&self) -> Vec<u16> {
        self.main_data
            .relearn_moves
            .into_iter()
            .map(u16::from)
            .collect()
    }

    #[wasm_bindgen(setter = relearnMovesWasm)]
    pub fn set_relearn_move_indices_js(&mut self, value: &[u16]) {
        self.main_data.relearn_moves = [
            MoveSlot::from(value[0]),
            MoveSlot::from(value[1]),
            MoveSlot::from(value[2]),
            MoveSlot::from(value[3]),
        ]
    }

    #[wasm_bindgen(getter = homeTracker)]
    pub fn home_tracker_js(&self) -> Option<Vec<u8>> {
        if self.main_data.home_tracker.iter().all(|b| *b == 0) {
            None
        } else {
            Some(self.main_data.home_tracker.to_vec())
        }
    }

    #[wasm_bindgen(setter = homeTracker)]
    pub fn set_home_tracker_js(&mut self, tracker: Option<Vec<u8>>) {
        if let Some(tracker) = tracker
            && tracker.len() == 8
        {
            self.main_data.home_tracker.copy_from_slice(&tracker);
        } else {
            self.main_data.home_tracker.copy_from_slice(&[0u8; 8]);
        }
    }

    #[wasm_bindgen(js_name = addModernRibbons)]
    pub fn add_modern_ribbons_js(&mut self, ribbon_indices: Vec<usize>) {
        ribbon_indices
            .into_iter()
            .filter_map(ModernRibbon::from_index)
            .map(OpenHomeRibbon::Mod)
            .for_each(|r| self.main_data.ribbons.add_ribbon(r));
    }

    #[wasm_bindgen(js_name = addGen3Ribbons)]
    pub fn add_gen3_ribbons_js(&mut self, ribbon_indices: Vec<usize>) {
        use pkm_rs_resources::ribbons::Gen3Ribbon;

        ribbon_indices
            .into_iter()
            .map(Gen3Ribbon::from_index)
            .map(Gen3Ribbon::to_openhome)
            .for_each(|r| self.main_data.ribbons.add_ribbon(r));
    }

    // #[wasm_bindgen]
    // pub fn set_species_and_forme(&mut self, national_dex: u16, forme_index: u16) -> JsResult<_js()> {
    //     match SpeciesAndForme::new(national_dex, forme_index) {
    //         Ok(species_and_forme) => {
    //             self.main_data.species_and_forme = species_and_forme;
    //             Ok(())
    //         }
    //         Err(e) => Err(JsValue::from_str(&e.to_string())),
    //     }
    // }

    // Plugins

    #[wasm_bindgen(getter = pluginOriginWasm)]
    pub fn plugin_origin_js(&self) -> Option<String> {
        Some(self.plugin_data.clone()?.plugin_origin)
    }

    #[wasm_bindgen(setter = pluginOriginWasm)]
    pub fn set_plugin_origin_js(&mut self, value: Option<String>) {
        match value {
            Some(plugin_origin) => {
                self.plugin_data.get_or_insert_default().plugin_origin = plugin_origin
            }
            None => self.plugin_data = None,
        }
    }

    // Game Boy

    #[wasm_bindgen(getter = dvsWasm)]
    pub fn dvs_js(&self) -> StatsPreSplit {
        match self.gameboy_data {
            Some(data) => data.dvs,
            None => GameboyData::from_main_data(&self.main_data).dvs,
        }
    }

    #[wasm_bindgen(getter = metTimeOfDay)]
    pub fn met_time_of_day_js(&self) -> Option<u8> {
        Some(self.gameboy_data?.met_time_of_day)
    }

    #[wasm_bindgen(getter = evsG12Wasm)]
    pub fn evs_g12_js(&self) -> Option<StatsPreSplit> {
        Some(self.gameboy_data?.evs_g12)
    }

    #[wasm_bindgen(setter = evsG12Wasm)]
    pub fn update_evs_g12_js(&mut self, value: StatsPreSplit) {
        if let Some(gameboy_data) = &mut self.gameboy_data {
            gameboy_data.evs_g12 = value
        }
    }

    #[wasm_bindgen(js_name = setGameboyData)]
    pub fn set_gameboy_data_js(
        &mut self,
        dvs: StatsPreSplit,
        met_time_of_day: u8,
        evs_g12: StatsPreSplit,
    ) {
        self.gameboy_data = Some(GameboyData {
            dvs,
            met_time_of_day,
            evs_g12,
        })
    }

    // Gen 4/5

    #[wasm_bindgen(getter = encounterType)]
    pub fn encounter_type_js(&self) -> Option<u8> {
        Some(self.gen45_data?.encounter_type)
    }

    #[wasm_bindgen(setter = encounterType)]
    pub fn set_encounter_type_js(&mut self, value: Option<u8>) {
        match value {
            Some(encounter_type) => {
                self.gen45_data.get_or_insert_default().encounter_type = encounter_type
            }
            None => {
                if let Some(gen45_data) = &mut self.gen45_data {
                    gen45_data.encounter_type = 0
                }
            }
        }
    }

    #[wasm_bindgen(getter = performance)]
    pub fn performance_js(&self) -> Option<u8> {
        Some(self.gen45_data?.performance)
    }

    #[wasm_bindgen(setter = performance)]
    pub fn set_performance_js(&mut self, value: Option<u8>) {
        match value {
            Some(performance) => self.gen45_data.get_or_insert_default().performance = performance,
            None => {
                if let Some(gen45_data) = &mut self.gen45_data {
                    gen45_data.performance = 0
                }
            }
        }
    }

    #[wasm_bindgen(getter = shinyLeavesWasm)]
    pub fn shiny_leaves_js(&self) -> Option<ShinyLeaves> {
        Some(self.gen45_data?.shiny_leaves)
    }

    #[wasm_bindgen(setter = shinyLeavesWasm)]
    pub fn set_shiny_leaves_js(&mut self, value: Option<ShinyLeaves>) {
        match value {
            Some(shiny_leaves) => {
                self.gen45_data.get_or_insert_default().shiny_leaves = shiny_leaves
            }
            None => {
                if let Some(gen45_data) = &mut self.gen45_data {
                    gen45_data.shiny_leaves = ShinyLeaves::default()
                }
            }
        }
    }

    #[wasm_bindgen(getter = pokeStarFame)]
    pub fn poke_star_fame_js(&self) -> Option<u8> {
        Some(self.gen45_data?.poke_star_fame)
    }

    #[wasm_bindgen(setter = pokeStarFame)]
    pub fn set_poke_star_fame_js(&mut self, value: Option<u8>) {
        match value {
            Some(poke_star_fame) => {
                self.gen45_data.get_or_insert_default().poke_star_fame = poke_star_fame
            }
            None => {
                if let Some(gen45_data) = &mut self.gen45_data {
                    gen45_data.poke_star_fame = 0
                }
            }
        }
    }

    #[wasm_bindgen(getter = isNsPokemon)]
    pub fn is_ns_pokemon_js(&self) -> Option<bool> {
        Some(self.gen45_data?.is_ns_pokemon)
    }

    #[wasm_bindgen(setter = isNsPokemon)]
    pub fn set_is_ns_pokemon_js(&mut self, value: Option<bool>) {
        match value {
            Some(is_ns_pokemon) => {
                self.gen45_data.get_or_insert_default().is_ns_pokemon = is_ns_pokemon
            }
            None => {
                if let Some(gen45_data) = &mut self.gen45_data {
                    gen45_data.is_ns_pokemon = false
                }
            }
        }
    }

    // Gen 6/7

    #[wasm_bindgen(getter = trainingBagHits)]
    pub fn training_bag_hits_js(&self) -> Option<u8> {
        Some(self.gen67_data?.training_bag_hits)
    }

    #[wasm_bindgen(setter = trainingBagHits)]
    pub fn set_training_bag_hits_js(&mut self, value: Option<u8>) {
        match value {
            Some(training_bag_hits) => {
                self.gen67_data.get_or_insert_default().training_bag_hits = training_bag_hits
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.training_bag_hits = 0
                }
            }
        }
    }

    #[wasm_bindgen(getter = trainingBag)]
    pub fn training_bag_js(&self) -> Option<u8> {
        Some(self.gen67_data?.training_bag)
    }

    #[wasm_bindgen(setter = trainingBag)]
    pub fn set_training_bag_js(&mut self, value: Option<u8>) {
        match value {
            Some(training_bag) => {
                self.gen67_data.get_or_insert_default().training_bag = training_bag
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.training_bag = 0
                }
            }
        }
    }

    #[wasm_bindgen(getter = superTrainingFlags)]
    pub fn super_training_flags_js(&self) -> Option<u32> {
        Some(self.gen67_data?.super_training_flags)
    }

    #[wasm_bindgen(setter = superTrainingFlags)]
    pub fn set_super_training_flags_js(&mut self, value: Option<u32>) {
        match value {
            Some(super_training_flags) => {
                self.gen67_data.get_or_insert_default().super_training_flags = super_training_flags
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.super_training_flags = 0
                }
            }
        }
    }

    #[wasm_bindgen(getter = superTrainingDistFlags)]
    pub fn super_training_dist_flags_js(&self) -> Option<u8> {
        Some(self.gen67_data?.super_training_dist_flags)
    }

    #[wasm_bindgen(setter = superTrainingDistFlags)]
    pub fn set_super_training_dist_flags_js(&mut self, value: Option<u8>) {
        match value {
            Some(super_training_dist_flags) => {
                self.gen67_data
                    .get_or_insert_default()
                    .super_training_dist_flags = super_training_dist_flags
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.super_training_dist_flags = 0
                }
            }
        }
    }

    #[wasm_bindgen(getter = secretSuperTrainingUnlocked)]
    pub fn secret_super_training_unlocked_js(&self) -> Option<bool> {
        Some(self.gen67_data?.secret_super_training_unlocked)
    }

    #[wasm_bindgen(setter = secretSuperTrainingUnlocked)]
    pub fn set_secret_super_training_unlocked_js(&mut self, value: Option<bool>) {
        match value {
            Some(secret_super_training_unlocked) => {
                self.gen67_data
                    .get_or_insert_default()
                    .secret_super_training_unlocked = secret_super_training_unlocked
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.secret_super_training_unlocked = false
                }
            }
        }
    }

    #[wasm_bindgen(getter = secretSuperTrainingComplete)]
    pub fn secret_super_training_complete_js(&self) -> Option<bool> {
        Some(self.gen67_data?.secret_super_training_complete)
    }

    #[wasm_bindgen(setter = secretSuperTrainingComplete)]
    pub fn set_secret_super_training_complete_js(&mut self, value: Option<bool>) {
        match value {
            Some(secret_super_training_complete) => {
                self.gen67_data
                    .get_or_insert_default()
                    .secret_super_training_complete = secret_super_training_complete
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.secret_super_training_complete = false
                }
            }
        }
    }

    #[wasm_bindgen(getter = country)]
    pub fn country_js(&self) -> Option<u8> {
        Some(self.gen67_data?.country)
    }

    #[wasm_bindgen(setter = country)]
    pub fn set_country_js(&mut self, value: Option<u8>) {
        match value {
            Some(country) => self.gen67_data.get_or_insert_default().country = country,
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.country = 0
                }
            }
        }
    }

    #[wasm_bindgen(getter = region)]
    pub fn region_js(&self) -> Option<u8> {
        Some(self.gen67_data?.region)
    }

    #[wasm_bindgen(setter = region)]
    pub fn set_region_js(&mut self, value: Option<u8>) {
        match value {
            Some(region) => self.gen67_data.get_or_insert_default().region = region,
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.region = 0
                }
            }
        }
    }

    #[wasm_bindgen(getter = geolocationsWasm)]
    pub fn geolocations_js(&self) -> Option<Geolocations> {
        Some(self.gen67_data?.geolocations)
    }

    #[wasm_bindgen(setter = geolocationsWasm)]
    pub fn set_geolocations_js(&mut self, value: Option<Geolocations>) {
        match value {
            Some(geolocations) => {
                self.gen67_data.get_or_insert_default().geolocations = geolocations
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.geolocations = Geolocations::default()
                }
            }
        }
    }

    #[wasm_bindgen(getter = resortEventStatus)]
    pub fn resort_event_status_js(&self) -> Option<u8> {
        Some(self.gen67_data?.resort_event_status)
    }

    #[wasm_bindgen(setter = resortEventStatus)]
    pub fn set_resort_event_status_js(&mut self, value: Option<u8>) {
        match value {
            Some(resort_event_status) => {
                self.gen67_data.get_or_insert_default().resort_event_status = resort_event_status
            }
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.resort_event_status = 0
                }
            }
        }
    }

    #[wasm_bindgen(getter = avsWasm)]
    pub fn avs_js(&self) -> Option<Stats16Le> {
        Some(self.gen67_data?.avs)
    }

    #[wasm_bindgen(setter = avsWasm)]
    pub fn set_avs_js(&mut self, value: Option<Stats16Le>) {
        match value {
            Some(avs) => self.gen67_data.get_or_insert_default().avs = avs,
            None => {
                if let Some(gen67_data) = &mut self.gen67_data {
                    gen67_data.avs = Stats16Le::default()
                }
            }
        }
    }

    // Sword/Shield

    #[wasm_bindgen(getter = canGigantamax)]
    pub fn can_gigantamax_js(&self) -> Option<bool> {
        Some(self.swsh_data?.can_gigantamax)
    }

    #[wasm_bindgen(setter = canGigantamax)]
    pub fn set_can_gigantamax_js(&mut self, value: Option<bool>) {
        match value {
            Some(can_gigantamax) => {
                self.swsh_data.get_or_insert_default().can_gigantamax = can_gigantamax
            }
            None => {
                if let Some(swsh_data) = &mut self.swsh_data {
                    swsh_data.can_gigantamax = false
                }
            }
        }
    }

    #[wasm_bindgen(getter = dynamaxLevel)]
    pub fn dynamax_level_js(&self) -> Option<u8> {
        Some(self.swsh_data?.dynamax_level)
    }

    #[wasm_bindgen(setter = dynamaxLevel)]
    pub fn set_dynamax_level_js(&mut self, value: Option<u8>) {
        match value {
            Some(dynamax_level) => {
                self.swsh_data.get_or_insert_default().dynamax_level = dynamax_level
            }
            None => {
                if let Some(swsh_data) = &mut self.swsh_data {
                    swsh_data.dynamax_level = 0
                }
            }
        }
    }

    #[wasm_bindgen(getter = palma)]
    pub fn palma_js(&self) -> Option<u32> {
        Some(self.swsh_data?.palma)
    }

    #[wasm_bindgen(setter = palma)]
    pub fn set_palma_js(&mut self, value: Option<u32>) {
        match value {
            Some(palma) => self.swsh_data.get_or_insert_default().palma = palma,
            None => {
                if let Some(swsh_data) = &mut self.swsh_data {
                    swsh_data.palma = 0
                }
            }
        }
    }

    #[wasm_bindgen(getter = trFlagsSwSh)]
    pub fn tr_flags_swsh_js(&self) -> Option<Vec<u8>> {
        Some(self.swsh_data?.tr_flags.to_vec())
    }

    #[wasm_bindgen(setter = trFlagsSwSh)]
    pub fn set_tr_flags_swsh_js(&mut self, value: Option<Vec<u8>>) {
        match value {
            Some(tr_flags) => self.swsh_data.get_or_insert_default().tr_flags[0..tr_flags.len()]
                .copy_from_slice(&tr_flags),
            None => {
                if let Some(swsh_data) = &mut self.swsh_data {
                    swsh_data.tr_flags = [0u8; 14]
                }
            }
        }
    }

    // Brilliant Diamond/Shining Pearl

    #[wasm_bindgen(getter = tmFlagsBDSP)]
    pub fn tutor_flags_bdsp_js(&self) -> Option<Vec<u8>> {
        Some(self.bdsp_data?.tm_flags.to_bytes().to_vec())
    }

    #[wasm_bindgen(setter = tmFlagsBDSP)]
    pub fn set_tm_flags_bdsp_js(&mut self, value: Option<Vec<u8>>) {
        match value {
            Some(tm_flags) => {
                let mut new_bytes = [0u8; 14];
                new_bytes.copy_from_slice(&tm_flags);
                self.bdsp_data.get_or_insert_default().tm_flags =
                    FlagSet::<14>::from_bytes(new_bytes);
            }
            None => {
                if let Some(bdsp_data) = &mut self.bdsp_data {
                    bdsp_data.tm_flags = FlagSet::default();
                }
            }
        }
    }

    // Legends Arceus

    #[wasm_bindgen(getter = gvsWasm)]
    pub fn gvs_js(&self) -> Option<Stats8> {
        Some(self.la_data?.gvs)
    }

    #[wasm_bindgen(setter = gvsWasm)]
    pub fn set_gvs_js(&mut self, value: Option<Stats8>) {
        match value {
            Some(gvs) => self.la_data.get_or_insert_default().gvs = gvs,
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.gvs = Stats8::default()
                }
            }
        }
    }

    #[wasm_bindgen(getter = alphaMove)]
    pub fn alpha_move_js(&self) -> Option<u16> {
        Some(self.la_data?.alpha_move)
    }

    #[wasm_bindgen(setter = alphaMove)]
    pub fn set_alpha_move_js(&mut self, value: Option<u16>) {
        match value {
            Some(alpha_move) => self.la_data.get_or_insert_default().alpha_move = alpha_move,
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.alpha_move = 0
                }
            }
        }
    }

    #[wasm_bindgen(getter = moveFlagsLA)]
    pub fn move_flags_la_js(&self) -> Option<Vec<u8>> {
        Some(self.la_data?.move_flags.to_bytes().to_vec())
    }

    #[wasm_bindgen(setter = moveFlagsLA)]
    pub fn set_move_flags_la_js(&mut self, value: Option<Vec<u8>>) {
        match value {
            Some(move_flags) => {
                let mut new_bytes = [0u8; 14];
                new_bytes.copy_from_slice(&move_flags);
                self.la_data.get_or_insert_default().move_flags =
                    FlagSet::<14>::from_bytes(new_bytes);
            }
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.move_flags = FlagSet::default();
                }
            }
        }
    }

    #[wasm_bindgen(getter = tutorFlagsLA)]
    pub fn tutor_flags_la_js(&self) -> Option<Vec<u8>> {
        Some(self.la_data?.tutor_flags.to_bytes().to_vec())
    }

    #[wasm_bindgen(setter = tutorFlagsLA)]
    pub fn set_tutor_flags_la_js(&mut self, value: Option<Vec<u8>>) {
        match value {
            Some(tutor_flags) => {
                let mut new_bytes = [0u8; 8];
                new_bytes.copy_from_slice(&tutor_flags);
                self.la_data.get_or_insert_default().tutor_flags =
                    FlagSet::<8>::from_bytes(new_bytes);
            }
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.tutor_flags = FlagSet::default();
                }
            }
        }
    }

    #[wasm_bindgen(getter = masterFlagsLA)]
    pub fn master_flags_la_js(&self) -> Option<Vec<u8>> {
        Some(self.la_data?.master_flags.to_bytes().to_vec())
    }

    #[wasm_bindgen(setter = masterFlagsLA)]
    pub fn set_master_flags_la_js(&mut self, value: Option<Vec<u8>>) {
        match value {
            Some(master_flags) => {
                let mut new_bytes = [0u8; 8];
                new_bytes.copy_from_slice(&master_flags);
                self.la_data.get_or_insert_default().master_flags =
                    FlagSet::<8>::from_bytes(new_bytes);
            }
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.master_flags = FlagSet::default();
                }
            }
        }
    }

    #[wasm_bindgen(getter = isNoble)]
    pub fn is_noble_js(&self) -> Option<bool> {
        Some(self.la_data?.is_noble)
    }

    #[wasm_bindgen(setter = isNoble)]
    pub fn set_is_noble_js(&mut self, value: Option<bool>) {
        match value {
            Some(is_noble) => self.la_data.get_or_insert_default().is_noble = is_noble,
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.is_noble = false
                }
            }
        }
    }

    #[wasm_bindgen(getter = isAlpha)]
    pub fn is_alpha_js(&self) -> Option<bool> {
        Some(self.la_data?.is_alpha)
    }

    #[wasm_bindgen(setter = isAlpha)]
    pub fn set_is_alpha_js(&mut self, value: Option<bool>) {
        match value {
            Some(is_alpha) => self.la_data.get_or_insert_default().is_alpha = is_alpha,
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.is_alpha = false
                }
            }
        }
    }

    #[wasm_bindgen(getter = flag2LA)]
    pub fn flag2_la_js(&self) -> Option<bool> {
        Some(self.la_data?.flag2)
    }

    #[wasm_bindgen(setter = flag2LA)]
    pub fn set_flag2_la_js(&mut self, value: Option<bool>) {
        match value {
            Some(flag2_la) => self.la_data.get_or_insert_default().flag2 = flag2_la,
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.flag2 = false
                }
            }
        }
    }

    #[wasm_bindgen(getter = unknownF3)]
    pub fn unknown_f3_js(&self) -> Option<u8> {
        Some(self.la_data?.unknown_f3)
    }

    #[wasm_bindgen(setter = unknownF3)]
    pub fn set_unknown_f3_js(&mut self, value: Option<u8>) {
        match value {
            Some(unknown_f3) => self.la_data.get_or_insert_default().unknown_f3 = unknown_f3,
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.unknown_f3 = 0
                }
            }
        }
    }

    #[wasm_bindgen(getter = unknownA0)]
    pub fn unknown_a0_js(&self) -> Option<u32> {
        Some(self.la_data?.unknown_a0)
    }

    #[wasm_bindgen(setter = unknownA0)]
    pub fn set_unknown_a0_js(&mut self, value: Option<u32>) {
        match value {
            Some(unknown_a0) => self.la_data.get_or_insert_default().unknown_a0 = unknown_a0,
            None => {
                if let Some(la_data) = &mut self.la_data {
                    la_data.unknown_a0 = 0
                }
            }
        }
    }

    // Scarlet/Violet

    #[wasm_bindgen(getter = teraTypeOriginal)]
    pub fn tera_type_original_js(&self) -> TeraTypeWasm {
        self.sv_data
            .map(|d| TeraTypeWasm::from(d.tera_type_original))
            .unwrap_or(
                self.species_and_forme()
                    .get_forme_metadata()
                    .transferred_tera_type()
                    .into(),
            )
    }

    #[wasm_bindgen(js_name = setTeraTypeOriginalIf)]
    pub fn set_tera_type_original_if_js(&mut self, value: Option<u8>) {
        let Some(value) = value else { return };

        if let Some(tera_type) = TeraTypeWasm::from_byte(value) {
            self.sv_data
                .get_or_insert(ScarletVioletData::default_generated_tera_type(
                    self.main_data.species_and_forme,
                ))
                .tera_type_original = tera_type.into()
        }
    }

    #[wasm_bindgen(getter = teraTypeOverride)]
    pub fn tera_type_override_js(&self) -> u8 {
        self.sv_data
            .and_then(|d| d.tera_type_override)
            .map_or(19, TeraType::to_byte)
    }

    #[wasm_bindgen(setter = teraTypeOverride)]
    pub fn set_tera_type_override_js(&mut self, value: u8) {
        self.sv_data
            .get_or_insert(ScarletVioletData::default_generated_tera_type(
                self.main_data.species_and_forme,
            ))
            .tera_type_override = TeraType::from_byte(value);
    }

    #[wasm_bindgen(getter = tmFlagsSV)]
    pub fn tm_flags_sv_js(&self) -> Option<Vec<u8>> {
        Some(self.sv_data?.tm_flags.to_bytes().to_vec())
    }

    #[wasm_bindgen(setter = tmFlagsSV)]
    pub fn set_tm_flags_sv_js(&mut self, value: Option<Vec<u8>>) {
        match value {
            Some(tm_flags) => {
                let mut new_bytes = [0u8; 22];
                new_bytes.copy_from_slice(&tm_flags);
                self.sv_data.get_or_insert_default().tm_flags =
                    FlagSet::<22>::from_bytes(new_bytes);
            }
            None => {
                if let Some(sv_data) = &mut self.sv_data {
                    sv_data.tm_flags = FlagSet::<22>::default();
                }
            }
        }
    }

    #[wasm_bindgen(getter = tmFlagsSVDLC)]
    pub fn tm_flags_sv_dlc_js(&self) -> Option<Vec<u8>> {
        Some(self.sv_data?.tm_flags_dlc.to_bytes().to_vec())
    }

    #[wasm_bindgen(setter = tmFlagsSVDLC)]
    pub fn set_tm_flags_sv_dlc_js(&mut self, value: Option<Vec<u8>>) {
        match value {
            Some(tm_flags_dlc) => {
                let mut new_bytes = [0u8; 13];
                new_bytes.copy_from_slice(&tm_flags_dlc);
                self.sv_data.get_or_insert_default().tm_flags_dlc =
                    FlagSet::<13>::from_bytes(new_bytes);
            }
            None => {
                if let Some(sv_data) = &mut self.sv_data {
                    sv_data.tm_flags_dlc = FlagSet::<13>::default();
                }
            }
        }
    }

    #[wasm_bindgen(js_name = toByteArray)]
    pub fn to_bytes_js_js(&self) -> Vec<u8> {
        self.to_bytes()
    }

    #[wasm_bindgen(js_name = fromV1Bytes)]
    pub fn from_v1_bytes_js(bytes: Vec<u8>) -> JsResult<Self> {
        Ok(OhpkmV1::from_bytes(&bytes).map(OhpkmV2::from_v1)?)
    }

    #[wasm_bindgen(js_name = getSectionBytes)]
    pub fn get_section_bytes_js(&self) -> JsResult<js_sys::Object> {
        let obj = js_sys::Object::new();

        js_sys::Reflect::set(
            &obj,
            &JsValue::from("MainData"),
            &JsValue::from(self.main_data.to_bytes()),
        )?;
        add_section_bytes_to_js_object(&obj, &self.gameboy_data)?;
        add_section_bytes_to_js_object(&obj, &self.gen45_data)?;
        add_section_bytes_to_js_object(&obj, &self.gen67_data)?;
        add_section_bytes_to_js_object(&obj, &self.swsh_data)?;
        add_section_bytes_to_js_object(&obj, &self.bdsp_data)?;
        add_section_bytes_to_js_object(&obj, &self.la_data)?;
        add_section_bytes_to_js_object(&obj, &self.sv_data)?;
        add_section_bytes_to_js_object(&obj, &self.plugin_data)?;

        Ok(obj)
    }

    // Past Handlers
    #[wasm_bindgen(getter = handlers)]
    pub fn handlers_js(&self) -> Vec<PastHandlerData> {
        self.handler_data.clone()
    }

    #[wasm_bindgen(js_name = matchingUnknownHandler)]
    pub fn matching_unknown_handler_js(
        &mut self,
        name: String,
        gender: Gender,
    ) -> Option<PastHandlerData> {
        let sized_string = SizedUtf16String::<26>::from(name);
        self.handler_data
            .iter()
            .find(|h| h.unknown_trainer_data_matches(&sized_string, gender))
            .cloned()
    }

    #[wasm_bindgen(js_name = findKnownHandler)]
    pub fn find_known_handler_js(
        &mut self,
        tid: u16,
        sid: u16,
        game: OriginGame,
        plugin: Option<String>,
    ) -> Option<PastHandlerData> {
        self.handler_data
            .iter()
            .find(|h| h.known_trainer_data_matches(tid, sid, game, &plugin))
            .cloned()
    }

    #[wasm_bindgen(js_name = registerHandler)]
    pub fn register_handler_js(&mut self, handler: TrainerData, plugin: Option<String>) {
        if let Some(origin_game) = handler.origin_game
            && let Some(matching_known_record) = self.handler_data.iter_mut().find(|h| {
                h.known_trainer_data_matches(handler.id, handler.secret_id, origin_game, &plugin)
            })
        {
            matching_known_record.update_from(&handler, plugin);
        } else if let Some(matching_unknown_record) = self
            .handler_data
            .iter_mut()
            .find(|h| h.unknown_trainer_data_matches(&handler.name, handler.gender))
        {
            matching_unknown_record.update_from(&handler, plugin)
        } else {
            let mut handler_data = PastHandlerData::from(handler);
            handler_data.origin_plugin = plugin;
            self.handler_data.push(handler_data);
        }
    }

    // Notes
    #[wasm_bindgen(getter = notes)]
    pub fn notes_js(&self) -> Option<String> {
        Some(self.notes.clone()?.0)
    }

    #[wasm_bindgen(setter = notes)]
    pub fn set_notes_js(&mut self, value: Option<String>) {
        match value {
            Some(notes) => self.notes = Some(Notes(notes)),
            None => self.notes = None,
        }
    }

    // Most Recent save
    #[wasm_bindgen(getter = mostRecentSaveWasm)]
    pub fn most_recent_save_js(&self) -> Option<MostRecentSave> {
        self.most_recent_save.clone()
    }

    // Calculated
    #[wasm_bindgen(js_name = isShinyWasm)]
    pub fn is_shiny_js(&self) -> bool {
        self.main_data.is_shiny()
    }

    #[wasm_bindgen(js_name = isSquareShinyWasm)]
    pub fn is_square_shiny_js(&self) -> bool {
        self.main_data.is_square_shiny()
    }

    // Helpers
    #[wasm_bindgen(js_name = tradeToSaveWasm)]
    pub fn trade_to_save_js(&mut self, game: OriginGame) {
        if game.is_gameboy() && self.gameboy_data.is_none() {
            self.gameboy_data = Some(GameboyData::from_main_data(&self.main_data));
        }
    }

    #[wasm_bindgen(js_name = setRecentSaveWasm)]
    pub fn set_recent_save_js(
        &mut self,
        game: OriginGame,
        trainer_id: u16,
        secret_id: u16,
        trainer_name: String,
        save_path: String,
    ) {
        self.most_recent_save = Some(MostRecentSave {
            trainer_id,
            secret_id,
            game,
            trainer_name: trainer_name.into(),
            file_path: save_path,
        })
    }

    #[wasm_bindgen(js_name = getPresentSections)]
    pub fn get_present_sections_js(&self) -> Vec<String> {
        self.to_sectioned_data()
            .all_section_tags()
            .iter()
            .map(|t| t.to_string())
            .collect()
    }
}

#[cfg(feature = "wasm")]
fn add_section_bytes_to_js_object<T: DataSection<ErrorType = Error>>(
    obj: &js_sys::Object,
    section: &Option<T>,
) -> JsResult<()> {
    if let Some(section) = section
        && !section.is_empty()
    {
        js_sys::Reflect::set(
            obj,
            &JsValue::from(T::TAG.to_string()),
            &JsValue::from(section.to_bytes()),
        )?;
    }
    Ok(())
}

impl PkmBytes for OhpkmV2 {
    const BOX_SIZE: usize = 0;

    const PARTY_SIZE: usize = 0;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        match Self::from_bytes(bytes) {
            Ok(ohpkm) => Ok(ohpkm),
            Err(err) => Err(Error::other(&err.to_string())),
        }
    }

    fn write_box_bytes(&self, dest: &mut [u8]) {
        let bytes = self.to_box_bytes();
        dest.copy_from_slice(&bytes);
    }

    fn write_party_bytes(&self, dest: &mut [u8]) {
        self.write_box_bytes(dest)
    }

    fn to_box_bytes(&self) -> Vec<u8> {
        self.to_bytes()
    }

    fn to_party_bytes(&self) -> Vec<u8> {
        self.to_box_bytes()
    }
}

impl HasSpeciesAndForme for OhpkmV2 {
    fn get_species_metadata(&self) -> &'static pkm_rs_resources::species::SpeciesMetadata {
        self.main_data.species_and_forme.get_species_metadata()
    }

    fn get_forme_metadata(&self) -> &'static pkm_rs_resources::species::FormeMetadata {
        self.main_data.species_and_forme.get_forme_metadata()
    }

    fn calculate_level(&self) -> u8 {
        self.get_species_metadata()
            .level_up_type
            .calculate_level(self.main_data.exp)
    }
}

impl<T: OhpkmConvert> From<&T> for OhpkmV2 {
    fn from(pkm: &T) -> Self {
        Self {
            main_data: pkm.to_main_data(),
            gen67_data: pkm.to_gen_67_data(),
            ..Default::default()
        }
    }
}

impl IsShiny for OhpkmV2 {
    fn is_shiny(&self) -> bool {
        self.main_data.is_shiny()
    }

    fn is_square_shiny(&self) -> bool {
        self.main_data.is_square_shiny()
    }
}
