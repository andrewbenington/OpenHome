use crate::pkm::ohpkm::OhpkmV1;
use crate::pkm::ohpkm::sectioned_data::{DataSection, SectionTag, SectionedData};
use crate::pkm::ohpkm::v2_sections::{
    BdspData, GameboyData, Gen45Data, Gen67Data, LegendsArceusData, MainDataV2, PluginData,
    ScarletVioletData, SwordShieldData,
};
#[cfg(feature = "wasm")]
use crate::pkm::traits::IsShiny;
use crate::pkm::{Error, Result};
#[cfg(feature = "wasm")]
use crate::strings::SizedUtf16String;

#[cfg(feature = "wasm")]
use pkm_rs_resources::abilities::AbilityIndex;
#[cfg(feature = "wasm")]
use pkm_rs_resources::ball::Ball;
#[cfg(feature = "wasm")]
use pkm_rs_resources::language::Language;
#[cfg(feature = "wasm")]
use pkm_rs_resources::moves::MoveSlot;
#[cfg(feature = "wasm")]
use pkm_rs_resources::natures::NatureIndex;

#[cfg(feature = "wasm")]
use pkm_rs_resources::ribbons::{ModernRibbon, OpenHomeRibbon, OpenHomeRibbonSet};
#[cfg(feature = "wasm")]
use pkm_rs_resources::species::SpeciesAndForme;

#[cfg(feature = "wasm")]
use crate::pkm::ohpkm::JsResult;
#[cfg(feature = "wasm")]
use pkm_rs_types::{
    ContestStats, FlagSet, Geolocations, HyperTraining, MarkingsSixShapesColors, OriginGame,
    Stats8, Stats16Le, StatsPreSplit, TeraType,
};
#[cfg(feature = "wasm")]
use pkm_rs_types::{Gender, PokeDate, TrainerMemory};
#[cfg(feature = "wasm")]
use pkm_rs_types::{ShinyLeaves, TeraTypeWasm};
use strum_macros::Display;

const MAGIC_NUMBER: u32 = 0x57575757;
const CURRENT_VERSION: u16 = 2;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

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
    PluginData,
    Notes,
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
            8 => Some(Self::PluginData),
            9 => Some(Self::Notes),
            _ => None,
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
            Self::PluginData => 0,
            Self::Notes => 0,
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

#[derive(Default, Debug)]
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
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    plugin_data: Option<PluginData>,
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
            plugin_data: None,
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
            plugin_data: PluginData::extract_from(&sectioned_data)?,
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
            plugin_data: PluginData::from_v1(old),
        }
    }

    pub fn to_bytes(&self) -> Result<Vec<u8>> {
        let mut sectioned_data = SectionedData::new(MAGIC_NUMBER, CURRENT_VERSION);
        sectioned_data
            .add(self.main_data)?
            .add_if_some(self.gameboy_data)?
            .add_if_some(self.gen45_data)?
            .add_if_some(self.gen67_data)?
            .add_if_some(self.swsh_data)?
            .add_if_some(self.bdsp_data)?
            .add_if_some(self.la_data)?
            .add_if_some(self.sv_data)?
            .add_if_some(self.plugin_data.clone())?;

        Ok(sectioned_data.to_bytes()?)
    }
}

#[cfg(feature = "wasm")]
// #[safe_wasm_impl]
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

    #[wasm_bindgen(getter = personalityValue)]
    pub fn personality_value(&self) -> u32 {
        self.main_data.personality_value
    }
    #[wasm_bindgen(setter = personalityValue)]
    pub fn set_personality_value(&mut self, v: u32) {
        self.main_data.personality_value = v;
    }

    #[wasm_bindgen(getter = encryptionConstant)]
    pub fn encryption_constant(&self) -> u32 {
        self.main_data.encryption_constant
    }
    #[wasm_bindgen(setter = encryptionConstant)]
    pub fn set_encryption_constant(&mut self, v: u32) {
        self.main_data.encryption_constant = v;
    }

    #[wasm_bindgen(getter = speciesAndForme)]
    pub fn species_and_forme(&self) -> SpeciesAndForme {
        self.main_data.species_and_forme
    }
    #[wasm_bindgen(setter = speciesAndForme)]
    pub fn set_species_and_forme(&mut self, v: &SpeciesAndForme) {
        self.main_data.species_and_forme = *v;
    }

    #[wasm_bindgen(getter = heldItemIndex)]
    pub fn held_item_index(&self) -> u16 {
        self.main_data.held_item_index
    }
    #[wasm_bindgen(setter = heldItemIndex)]
    pub fn set_held_item_index(&mut self, v: u16) {
        self.main_data.held_item_index = v;
    }

    #[wasm_bindgen(getter = trainerID)]
    pub fn trainer_id(&self) -> u16 {
        self.main_data.trainer_id
    }
    #[wasm_bindgen(setter = trainerID)]
    pub fn set_trainer_id(&mut self, v: u16) {
        self.main_data.trainer_id = v;
    }

    #[wasm_bindgen(getter = secretID)]
    pub fn secret_id(&self) -> u16 {
        self.main_data.secret_id
    }
    #[wasm_bindgen(setter = secretID)]
    pub fn set_secret_id(&mut self, v: u16) {
        self.main_data.secret_id = v;
    }

    #[wasm_bindgen(getter = exp)]
    pub fn exp(&self) -> u32 {
        self.main_data.exp
    }
    #[wasm_bindgen(setter = exp)]
    pub fn set_exp(&mut self, v: u32) {
        self.main_data.exp = v;
    }

    #[wasm_bindgen(getter = abilityIndex)]
    pub fn ability_index(&self) -> AbilityIndex {
        self.main_data.ability_index
    }
    #[wasm_bindgen(setter = abilityIndex)]
    pub fn set_ability_index(&mut self, v: &AbilityIndex) {
        self.main_data.ability_index = *v;
    }

    #[wasm_bindgen(getter = abilityNum)]
    pub fn ability_num(&self) -> u8 {
        self.main_data.ability_num
    }
    #[wasm_bindgen(setter = abilityNum)]
    pub fn set_ability_num(&mut self, v: u8) {
        self.main_data.ability_num = v;
    }

    #[wasm_bindgen(getter = favorite)]
    pub fn favorite(&self) -> bool {
        self.main_data.favorite
    }
    #[wasm_bindgen(setter = favorite)]
    pub fn set_favorite(&mut self, v: bool) {
        self.main_data.favorite = v;
    }

    #[wasm_bindgen(getter = isShadow)]
    pub fn is_shadow(&self) -> bool {
        self.main_data.is_shadow
    }
    #[wasm_bindgen(setter = isShadow)]
    pub fn set_is_shadow(&mut self, v: bool) {
        self.main_data.is_shadow = v;
    }

    #[wasm_bindgen(getter = markingsWasm)]
    pub fn markings(&self) -> MarkingsSixShapesColors {
        self.main_data.markings
    }

    #[wasm_bindgen(setter = markingsWasm)]
    pub fn set_markings(&mut self, v: &MarkingsSixShapesColors) {
        self.main_data.markings = *v;
    }

    #[wasm_bindgen(getter = nature)]
    pub fn nature(&self) -> NatureIndex {
        self.main_data.nature
    }

    #[wasm_bindgen(setter = nature)]
    pub fn set_nature(&mut self, v: &NatureIndex) {
        self.main_data.nature = *v;
    }

    #[wasm_bindgen(getter = statNature)]
    pub fn stat_nature(&self) -> NatureIndex {
        self.main_data.mint_nature.unwrap_or(self.main_data.nature)
    }
    #[wasm_bindgen(setter = statNature)]
    pub fn set_stat_nature(&mut self, v: &NatureIndex) {
        self.main_data.mint_nature = if *v != self.nature() { Some(*v) } else { None };
    }

    #[wasm_bindgen(getter = isFatefulEncounter)]
    pub fn is_fateful_encounter(&self) -> bool {
        self.main_data.is_fateful_encounter
    }
    #[wasm_bindgen(setter = isFatefulEncounter)]
    pub fn set_is_fateful_encounter(&mut self, v: bool) {
        self.main_data.is_fateful_encounter = v;
    }

    #[wasm_bindgen(getter)]
    pub fn gender(&self) -> u8 {
        self.main_data.gender as u8
    }
    #[wasm_bindgen(setter)]
    pub fn set_gender(&mut self, v: u8) {
        self.main_data.gender = Gender::from_u8(v);
    }

    #[wasm_bindgen(getter = evsWasm)]
    pub fn evs(&self) -> Stats8 {
        self.main_data.evs
    }
    #[wasm_bindgen(setter = evsWasm)]
    pub fn set_evs(&mut self, v: &Stats8) {
        self.main_data.evs = *v;
    }

    #[wasm_bindgen(getter = contestWasm)]
    pub fn contest(&self) -> ContestStats {
        self.main_data.contest
    }
    #[wasm_bindgen(setter = contestWasm)]
    pub fn set_contest(&mut self, v: &ContestStats) {
        self.main_data.contest = *v;
    }

    #[wasm_bindgen(getter = pokerusByte)]
    pub fn pokerus_byte(&self) -> u8 {
        self.main_data.pokerus_byte
    }
    #[wasm_bindgen(setter = pokerusByte)]
    pub fn set_pokerus_byte(&mut self, v: u8) {
        self.main_data.pokerus_byte = v;
    }

    #[wasm_bindgen(getter = contestMemoryCount)]
    pub fn contest_memory_count(&self) -> u8 {
        self.main_data.contest_memory_count
    }
    #[wasm_bindgen(setter = contestMemoryCount)]
    pub fn set_contest_memory_count(&mut self, v: u8) {
        self.main_data.contest_memory_count = v;
    }

    #[wasm_bindgen(getter = battleMemoryCount)]
    pub fn battle_memory_count(&self) -> u8 {
        self.main_data.battle_memory_count
    }
    #[wasm_bindgen(setter = battleMemoryCount)]
    pub fn set_battle_memory_count(&mut self, v: u8) {
        self.main_data.battle_memory_count = v;
    }

    #[wasm_bindgen(getter = ribbons)]
    pub fn ribbons(&self) -> Vec<String> {
        self.main_data
            .ribbons
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
    pub fn set_ribbons(&mut self, v: Vec<String>) {
        self.main_data.ribbons = OpenHomeRibbonSet::from_names(v);
    }

    #[wasm_bindgen(getter = sociability)]
    pub fn sociability(&self) -> u32 {
        self.main_data.sociability
    }
    #[wasm_bindgen(setter = sociability)]
    pub fn set_sociability(&mut self, v: u32) {
        self.main_data.sociability = v;
    }

    #[wasm_bindgen(getter = heightScalar)]
    pub fn height_scalar(&self) -> u8 {
        self.main_data.height_scalar
    }
    #[wasm_bindgen(setter = heightScalar)]
    pub fn set_height_scalar(&mut self, v: u8) {
        self.main_data.height_scalar = v;
    }

    #[wasm_bindgen(getter = weightScalar)]
    pub fn weight_scalar(&self) -> u8 {
        self.main_data.weight_scalar
    }
    #[wasm_bindgen(setter = weightScalar)]
    pub fn set_weight_scalar(&mut self, v: u8) {
        self.main_data.weight_scalar = v;
    }

    #[wasm_bindgen(getter = scale)]
    pub fn scale(&self) -> u8 {
        self.main_data.scale
    }
    #[wasm_bindgen(setter = scale)]
    pub fn set_scale(&mut self, v: u8) {
        self.main_data.scale = v;
    }

    #[wasm_bindgen(getter = ivsWasm)]
    pub fn ivs(&self) -> Stats8 {
        self.main_data.ivs
    }
    #[wasm_bindgen(setter = ivsWasm)]
    pub fn set_ivs(&mut self, v: &Stats8) {
        self.main_data.ivs = *v;
    }

    #[wasm_bindgen(getter = isEgg)]
    pub fn is_egg(&self) -> bool {
        self.main_data.is_egg
    }
    #[wasm_bindgen(setter = isEgg)]
    pub fn set_is_egg(&mut self, v: bool) {
        self.main_data.is_egg = v;
    }

    #[wasm_bindgen(getter = isNicknamed)]
    pub fn is_nicknamed(&self) -> bool {
        self.main_data.is_nicknamed
    }
    #[wasm_bindgen(setter = isNicknamed)]
    pub fn set_is_nicknamed(&mut self, v: bool) {
        self.main_data.is_nicknamed = v;
    }

    #[wasm_bindgen(getter = handlerLanguage)]
    pub fn handler_language(&self) -> u8 {
        self.main_data.handler_language
    }
    #[wasm_bindgen(setter = handlerLanguage)]
    pub fn set_handler_language(&mut self, v: u8) {
        self.main_data.handler_language = v;
    }

    #[wasm_bindgen(getter = isCurrentHandler)]
    pub fn is_current_handler(&self) -> bool {
        self.main_data.is_current_handler
    }
    #[wasm_bindgen(setter = isCurrentHandler)]
    pub fn set_is_current_handler(&mut self, v: bool) {
        self.main_data.is_current_handler = v;
    }

    #[wasm_bindgen(getter = handlerId)]
    pub fn handler_id(&self) -> u16 {
        self.main_data.handler_id
    }
    #[wasm_bindgen(setter = handlerId)]
    pub fn set_handler_id(&mut self, v: u16) {
        self.main_data.handler_id = v;
    }

    #[wasm_bindgen(getter = handlerFriendship)]
    pub fn handler_friendship(&self) -> u8 {
        self.main_data.handler_friendship
    }
    #[wasm_bindgen(setter = handlerFriendship)]
    pub fn set_handler_friendship(&mut self, v: u8) {
        self.main_data.handler_friendship = v;
    }

    #[wasm_bindgen(getter = handlerMemoryWasm)]
    pub fn handler_memory(&self) -> TrainerMemory {
        self.main_data.handler_memory
    }
    #[wasm_bindgen(setter = handlerMemoryWasm)]
    pub fn set_handler_memory(&mut self, v: &TrainerMemory) {
        self.main_data.handler_memory = *v;
    }

    #[wasm_bindgen(getter = handlerAffection)]
    pub fn handler_affection(&self) -> u8 {
        self.main_data.handler_affection
    }
    #[wasm_bindgen(setter = handlerAffection)]
    pub fn set_handler_affection(&mut self, v: u8) {
        self.main_data.handler_affection = v;
    }

    #[wasm_bindgen(getter = handlerGender)]
    pub fn handler_gender(&self) -> bool {
        self.main_data.handler_gender
    }
    #[wasm_bindgen(setter = handlerGender)]
    pub fn set_handler_gender(&mut self, v: bool) {
        self.main_data.handler_gender = v;
    }

    #[wasm_bindgen(getter = fullness)]
    pub fn fullness(&self) -> u8 {
        self.main_data.fullness
    }
    #[wasm_bindgen(setter = fullness)]
    pub fn set_fullness(&mut self, v: u8) {
        self.main_data.fullness = v;
    }

    #[wasm_bindgen(getter = enjoyment)]
    pub fn enjoyment(&self) -> u8 {
        self.main_data.enjoyment
    }
    #[wasm_bindgen(setter = enjoyment)]
    pub fn set_enjoyment(&mut self, v: u8) {
        self.main_data.enjoyment = v;
    }

    #[wasm_bindgen(getter = gameOfOrigin)]
    pub fn game_of_origin(&self) -> OriginGame {
        self.main_data.game_of_origin
    }
    #[wasm_bindgen(setter = gameOfOrigin)]
    pub fn set_game_of_origin(&mut self, v: OriginGame) {
        self.main_data.game_of_origin = v;
    }

    #[wasm_bindgen(getter = gameOfOriginBattle)]
    pub fn game_of_origin_battle(&self) -> Option<OriginGame> {
        self.main_data.game_of_origin_battle
    }
    #[wasm_bindgen(setter = gameOfOriginBattle)]
    pub fn set_game_of_origin_battle(&mut self, v: Option<OriginGame>) {
        self.main_data.game_of_origin_battle = v;
    }

    #[wasm_bindgen(getter = consoleRegion)]
    pub fn console_region(&self) -> u8 {
        self.main_data.console_region
    }
    #[wasm_bindgen(setter = consoleRegion)]
    pub fn set_console_region(&mut self, v: u8) {
        self.main_data.console_region = v;
    }

    #[wasm_bindgen(getter = language)]
    pub fn language(&self) -> Language {
        self.main_data.language
    }
    #[wasm_bindgen(setter = language)]
    pub fn set_language(&mut self, v: Language) {
        self.main_data.language = v;
    }

    #[wasm_bindgen(getter = formArgument)]
    pub fn form_argument(&self) -> u32 {
        self.main_data.form_argument
    }
    #[wasm_bindgen(setter = formArgument)]
    pub fn set_form_argument(&mut self, v: u32) {
        self.main_data.form_argument = v;
    }

    #[wasm_bindgen(getter = affixedRibbon)]
    pub fn affixed_ribbon(&self) -> Option<ModernRibbon> {
        self.main_data.affixed_ribbon
    }
    #[wasm_bindgen(setter = affixedRibbon)]
    pub fn set_affixed_ribbon(&mut self, v: Option<ModernRibbon>) {
        self.main_data.affixed_ribbon = v;
    }

    #[wasm_bindgen(getter = trainerFriendship)]
    pub fn trainer_friendship(&self) -> u8 {
        self.main_data.trainer_friendship
    }
    #[wasm_bindgen(setter = trainerFriendship)]
    pub fn set_trainer_friendship(&mut self, v: u8) {
        self.main_data.trainer_friendship = v;
    }

    #[wasm_bindgen(getter = trainerMemoryWasm)]
    pub fn trainer_memory(&self) -> TrainerMemory {
        self.main_data.trainer_memory
    }
    #[wasm_bindgen(setter = trainerMemoryWasm)]
    pub fn set_trainer_memory(&mut self, v: &TrainerMemory) {
        self.main_data.trainer_memory = *v;
    }

    #[wasm_bindgen(getter = trainerAffection)]
    pub fn trainer_affection(&self) -> u8 {
        self.main_data.trainer_affection
    }
    #[wasm_bindgen(setter = trainerAffection)]
    pub fn set_trainer_affection(&mut self, v: u8) {
        self.main_data.trainer_affection = v;
    }

    #[wasm_bindgen(getter = eggDateWasm)]
    pub fn egg_date(&self) -> Option<PokeDate> {
        self.main_data.egg_date
    }
    #[wasm_bindgen(setter = eggDateWasm)]
    pub fn set_egg_date(&mut self, v: Option<PokeDate>) {
        self.main_data.egg_date = v;
    }

    #[wasm_bindgen(getter = metDateWasm)]
    pub fn met_date(&self) -> PokeDate {
        self.main_data.met_date
    }
    #[wasm_bindgen(setter = metDateWasm)]
    pub fn set_met_date(&mut self, v: &PokeDate) {
        self.main_data.met_date = *v;
    }

    #[wasm_bindgen(getter = ball)]
    pub fn ball(&self) -> Ball {
        self.main_data.ball
    }
    #[wasm_bindgen(setter = ball)]
    pub fn set_ball(&mut self, v: Ball) {
        self.main_data.ball = v;
    }

    #[wasm_bindgen(getter = eggLocationIndex)]
    pub fn egg_location_index(&self) -> Option<u16> {
        self.main_data.egg_location_index
    }
    #[wasm_bindgen(setter = eggLocationIndex)]
    pub fn set_egg_location_index(&mut self, v: Option<u16>) {
        self.main_data.egg_location_index = v;
    }

    #[wasm_bindgen(getter = metLocationIndex)]
    pub fn met_location_index(&self) -> u16 {
        self.main_data.met_location_index
    }
    #[wasm_bindgen(setter = metLocationIndex)]
    pub fn set_met_location_index(&mut self, v: u16) {
        self.main_data.met_location_index = v;
    }

    #[wasm_bindgen(getter = metLevel)]
    pub fn met_level(&self) -> u8 {
        self.main_data.met_level
    }
    #[wasm_bindgen(setter = metLevel)]
    pub fn set_met_level(&mut self, v: u8) {
        self.main_data.met_level = v;
    }

    #[wasm_bindgen(getter = hyperTrainingWasm)]
    pub fn hyper_training(&self) -> HyperTraining {
        self.main_data.hyper_training
    }
    #[wasm_bindgen(setter = hyperTrainingWasm)]
    pub fn set_hyper_training(&mut self, v: &HyperTraining) {
        self.main_data.hyper_training = *v;
    }

    #[wasm_bindgen(getter = trainerGender)]
    pub fn trainer_gender(&self) -> bool {
        self.main_data.trainer_gender.into()
    }
    #[wasm_bindgen(setter = trainerGender)]
    pub fn set_trainer_gender(&mut self, v: bool) {
        self.main_data.trainer_gender = Gender::from(v);
    }

    #[wasm_bindgen(getter = obedienceLevel)]
    pub fn obedience_level(&self) -> u8 {
        self.main_data.obedience_level
    }
    #[wasm_bindgen(setter = obedienceLevel)]
    pub fn set_obedience_level(&mut self, v: u8) {
        self.main_data.obedience_level = v;
    }

    #[wasm_bindgen(getter)]
    pub fn nickname(&self) -> String {
        self.main_data.nickname.to_string()
    }

    #[wasm_bindgen(setter)]
    pub fn set_nickname(&mut self, value: String) {
        self.main_data.nickname = SizedUtf16String::<26>::from(value);
    }

    #[wasm_bindgen(getter = trainerName)]
    pub fn trainer_name(&self) -> String {
        self.main_data.trainer_name.to_string()
    }

    #[wasm_bindgen(setter = trainerName)]
    pub fn set_trainer_name(&mut self, value: String) {
        self.main_data.trainer_name = SizedUtf16String::<26>::from(value);
    }

    #[wasm_bindgen(getter = handlerName)]
    pub fn handler_name(&self) -> String {
        self.main_data.handler_name.to_string()
    }

    #[wasm_bindgen(setter = handlerName)]
    pub fn set_handler_name(&mut self, value: String) {
        self.main_data.handler_name = SizedUtf16String::<24>::from(value);
    }

    #[wasm_bindgen(getter)]
    pub fn move_indices(&self) -> Vec<u16> {
        self.main_data.moves.into_iter().map(u16::from).collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_indices(&mut self, value: &[u16]) {
        self.main_data.moves = [
            MoveSlot::from(value[0]),
            MoveSlot::from(value[1]),
            MoveSlot::from(value[2]),
            MoveSlot::from(value[3]),
        ]
    }

    #[wasm_bindgen(getter)]
    pub fn move_pp(&self) -> Vec<u8> {
        self.main_data.move_pp.into_iter().collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_pp(&mut self, value: &[u8]) {
        self.main_data.move_pp = [value[0], value[1], value[2], value[3]]
    }

    #[wasm_bindgen(getter)]
    pub fn move_pp_ups(&self) -> Vec<u8> {
        self.main_data.move_pp_ups.into_iter().collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_pp_ups(&mut self, value: &[u8]) {
        self.main_data.move_pp_ups = [value[0], value[1], value[2], value[3]]
    }

    #[wasm_bindgen(getter)]
    pub fn relearn_move_indices(&self) -> Vec<u16> {
        self.main_data
            .relearn_moves
            .into_iter()
            .map(u16::from)
            .collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_relearn_move_indices(&mut self, value: &[u16]) {
        self.main_data.relearn_moves = [
            MoveSlot::from(value[0]),
            MoveSlot::from(value[1]),
            MoveSlot::from(value[2]),
            MoveSlot::from(value[3]),
        ]
    }

    #[wasm_bindgen(js_name = addModernRibbons)]
    pub fn add_modern_ribbons(&mut self, ribbon_indices: Vec<usize>) {
        ribbon_indices
            .into_iter()
            .map(ModernRibbon::from)
            .map(OpenHomeRibbon::Mod)
            .for_each(|r| self.main_data.ribbons.add_ribbon(r));
    }

    #[wasm_bindgen(js_name = addGen3Ribbons)]
    pub fn add_gen3_ribbons(&mut self, ribbon_indices: Vec<usize>) {
        use pkm_rs_resources::ribbons::Gen3Ribbon;

        ribbon_indices
            .into_iter()
            .map(Gen3Ribbon::from_index)
            .map(Gen3Ribbon::to_openhome)
            .for_each(|r| self.main_data.ribbons.add_ribbon(r));
    }

    // #[wasm_bindgen]
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

    #[wasm_bindgen(getter = pluginOrigin)]
    pub fn plugin_origin(&self) -> Option<String> {
        Some(self.plugin_data.clone()?.plugin_origin)
    }

    #[wasm_bindgen(setter = pluginOrigin)]
    pub fn set_plugin_origin(&mut self, value: Option<String>) {
        match value {
            Some(plugin_origin) => {
                self.plugin_data.get_or_insert_default().plugin_origin = plugin_origin
            }
            None => self.plugin_data = None,
        }
    }

    // Game Boy

    #[wasm_bindgen(getter = dvsWasm)]
    pub fn dvs(&self) -> Option<StatsPreSplit> {
        Some(self.gameboy_data?.dvs)
    }

    #[wasm_bindgen(setter = dvsWasm)]
    pub fn set_dvs(&mut self, value: Option<StatsPreSplit>) {
        match value {
            Some(dvs) => self.gameboy_data.get_or_insert_default().dvs = dvs,
            None => self.gameboy_data = None,
        }
    }

    #[wasm_bindgen(getter = metTimeOfDay)]
    pub fn met_time_of_day(&self) -> Option<u8> {
        Some(self.gameboy_data?.met_time_of_day)
    }

    #[wasm_bindgen(setter = metTimeOfDay)]
    pub fn set_met_time_of_day(&mut self, value: Option<u8>) {
        match value {
            Some(met_tod) => self.gameboy_data.get_or_insert_default().met_time_of_day = met_tod,
            None => self.gameboy_data = None,
        }
    }

    #[wasm_bindgen(getter = evsG12Wasm)]
    pub fn evs_g12(&self) -> Option<StatsPreSplit> {
        Some(self.gameboy_data?.evs_g12)
    }

    #[wasm_bindgen(setter = evsG12Wasm)]
    pub fn set_evs_g12(&mut self, value: Option<StatsPreSplit>) {
        match value {
            Some(evs_g12) => self.gameboy_data.get_or_insert_default().evs_g12 = evs_g12,
            None => self.gameboy_data = None,
        }
    }

    // Gen 4/5

    #[wasm_bindgen(getter = encounterType)]
    pub fn encounter_type(&self) -> Option<u8> {
        Some(self.gen45_data?.encounter_type)
    }

    #[wasm_bindgen(setter = encounterType)]
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

    #[wasm_bindgen(getter)]
    pub fn performance(&self) -> Option<u8> {
        Some(self.gen45_data?.performance)
    }

    #[wasm_bindgen(setter)]
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

    #[wasm_bindgen(getter = shinyLeaves)]
    pub fn shiny_leaves(&self) -> Option<ShinyLeaves> {
        Some(self.gen45_data?.shiny_leaves)
    }

    #[wasm_bindgen(setter = shinyLeaves)]
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

    #[wasm_bindgen(getter = pokeStarFame)]
    pub fn poke_star_fame(&self) -> Option<u8> {
        Some(self.gen45_data?.poke_star_fame)
    }

    #[wasm_bindgen(setter = pokeStarFame)]
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

    #[wasm_bindgen(getter = isNsPokemon)]
    pub fn is_ns_pokemon(&self) -> Option<bool> {
        Some(self.gen45_data?.is_ns_pokemon)
    }

    #[wasm_bindgen(setter = isNsPokemon)]
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

    #[wasm_bindgen(getter = trainingBagHits)]
    pub fn training_bag_hits(&self) -> Option<u8> {
        Some(self.gen67_data?.training_bag_hits)
    }

    #[wasm_bindgen(setter = trainingBagHits)]
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

    #[wasm_bindgen(getter = trainingBag)]
    pub fn training_bag(&self) -> Option<u8> {
        Some(self.gen67_data?.training_bag)
    }

    #[wasm_bindgen(setter = trainingBag)]
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

    #[wasm_bindgen(getter = superTrainingFlags)]
    pub fn super_training_flags(&self) -> Option<u32> {
        Some(self.gen67_data?.super_training_flags)
    }

    #[wasm_bindgen(setter = superTrainingFlags)]
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

    #[wasm_bindgen(getter = superTrainingDistFlags)]
    pub fn super_training_dist_flags(&self) -> Option<u8> {
        Some(self.gen67_data?.super_training_dist_flags)
    }

    #[wasm_bindgen(setter = superTrainingDistFlags)]
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

    #[wasm_bindgen(getter = secretSuperTrainingUnlocked)]
    pub fn secret_super_training_unlocked(&self) -> Option<bool> {
        Some(self.gen67_data?.secret_super_training_unlocked)
    }

    #[wasm_bindgen(setter = secretSuperTrainingUnlocked)]
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

    #[wasm_bindgen(getter = secretSuperTrainingComplete)]
    pub fn secret_super_training_complete(&self) -> Option<bool> {
        Some(self.gen67_data?.secret_super_training_complete)
    }

    #[wasm_bindgen(setter = secretSuperTrainingComplete)]
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

    #[wasm_bindgen(getter)]
    pub fn country(&self) -> Option<u8> {
        Some(self.gen67_data?.country)
    }

    #[wasm_bindgen(setter)]
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

    #[wasm_bindgen(getter)]
    pub fn region(&self) -> Option<u8> {
        Some(self.gen67_data?.region)
    }

    #[wasm_bindgen(setter)]
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

    #[wasm_bindgen(getter = geolocationsWasm)]
    pub fn geolocations(&self) -> Option<Geolocations> {
        Some(self.gen67_data?.geolocations)
    }

    #[wasm_bindgen(setter = geolocationsWasm)]
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

    #[wasm_bindgen(getter = resortEventStatus)]
    pub fn resort_event_status(&self) -> Option<u8> {
        Some(self.gen67_data?.resort_event_status)
    }

    #[wasm_bindgen(setter = resortEventStatus)]
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

    #[wasm_bindgen(getter = avsWasm)]
    pub fn avs(&self) -> Option<Stats16Le> {
        Some(self.gen67_data?.avs)
    }

    #[wasm_bindgen(setter = avsWasm)]
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

    #[wasm_bindgen(getter = canGigantamax)]
    pub fn can_gigantamax(&self) -> Option<bool> {
        Some(self.swsh_data?.can_gigantamax)
    }

    #[wasm_bindgen(setter = canGigantamax)]
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

    #[wasm_bindgen(getter = dynamaxLevel)]
    pub fn dynamax_level(&self) -> Option<u8> {
        Some(self.swsh_data?.dynamax_level)
    }

    #[wasm_bindgen(setter = dynamaxLevel)]
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

    #[wasm_bindgen(getter)]
    pub fn palma(&self) -> Option<u32> {
        Some(self.swsh_data?.palma)
    }

    #[wasm_bindgen(setter)]
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

    #[wasm_bindgen(getter = trFlagsSwSh)]
    pub fn tr_flags_swsh(&self) -> Option<Vec<u8>> {
        Some(self.swsh_data?.tr_flags.to_vec())
    }

    #[wasm_bindgen(setter = trFlagsSwSh)]
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

    #[wasm_bindgen(getter = tmFlagsBDSP)]
    pub fn tutor_flags_bdsp(&self) -> Option<Vec<u8>> {
        Some(self.bdsp_data?.tm_flags.to_bytes().to_vec())
    }

    #[wasm_bindgen(setter = tmFlagsBDSP)]
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

    #[wasm_bindgen(getter = gvsWasm)]
    pub fn gvs(&self) -> Option<Stats8> {
        Some(self.la_data?.gvs)
    }

    #[wasm_bindgen(setter = gvsWasm)]
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

    #[wasm_bindgen(getter = alphaMove)]
    pub fn alpha_move(&self) -> Option<u16> {
        Some(self.la_data?.alpha_move)
    }

    #[wasm_bindgen(setter = alphaMove)]
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

    #[wasm_bindgen(getter = moveFlagsLA)]
    pub fn move_flags_la(&self) -> Option<Vec<u8>> {
        Some(self.la_data?.move_flags.to_bytes().to_vec())
    }

    #[wasm_bindgen(setter = moveFlagsLA)]
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

    #[wasm_bindgen(getter = tutorFlagsLA)]
    pub fn tutor_flags_la(&self) -> Option<Vec<u8>> {
        Some(self.la_data?.tutor_flags.to_bytes().to_vec())
    }

    #[wasm_bindgen(setter = tutorFlagsLA)]
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

    #[wasm_bindgen(getter = masterFlagsLA)]
    pub fn master_flags_la(&self) -> Option<Vec<u8>> {
        Some(self.la_data?.master_flags.to_bytes().to_vec())
    }

    #[wasm_bindgen(setter = masterFlagsLA)]
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

    #[wasm_bindgen(getter = isNoble)]
    pub fn is_noble(&self) -> Option<bool> {
        Some(self.la_data?.is_noble)
    }

    #[wasm_bindgen(setter = isNoble)]
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

    #[wasm_bindgen(getter = isAlpha)]
    pub fn is_alpha(&self) -> Option<bool> {
        Some(self.la_data?.is_alpha)
    }

    #[wasm_bindgen(setter = isAlpha)]
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

    #[wasm_bindgen(getter = flag2LA)]
    pub fn flag2_la(&self) -> Option<bool> {
        Some(self.la_data?.flag2)
    }

    #[wasm_bindgen(setter = flag2LA)]
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

    #[wasm_bindgen(getter = unknownF3)]
    pub fn unknown_f3(&self) -> Option<u8> {
        Some(self.la_data?.unknown_f3)
    }

    #[wasm_bindgen(setter = unknownF3)]
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

    #[wasm_bindgen(getter = unknownA0)]
    pub fn unknown_a0(&self) -> Option<u32> {
        Some(self.la_data?.unknown_a0)
    }

    #[wasm_bindgen(setter = unknownA0)]
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

    #[wasm_bindgen(getter = teraTypeOriginal)]
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

    #[wasm_bindgen(js_name = setTeraTypeOriginalIf)]
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

    #[wasm_bindgen(getter = teraTypeOverride)]
    pub fn tera_type_override(&self) -> u8 {
        self.sv_data
            .and_then(|d| d.tera_type_override)
            .map_or(19, TeraType::to_byte)
    }

    #[wasm_bindgen(setter = teraTypeOverride)]
    pub fn set_tera_type_override(&mut self, value: u8) {
        self.sv_data
            .get_or_insert(ScarletVioletData::default_generated_tera_type(
                self.main_data.species_and_forme,
            ))
            .tera_type_override = TeraType::from_byte(value);

        if self.sv_data.as_ref().is_some_and(DataSection::is_empty) {
            self.sv_data = None
        }
    }

    #[wasm_bindgen(getter = tmFlagsSV)]
    pub fn tm_flags_sv(&self) -> Option<Vec<u8>> {
        Some(self.sv_data?.tm_flags.to_bytes().to_vec())
    }

    #[wasm_bindgen(setter = tmFlagsSV)]
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

    #[wasm_bindgen(getter = tmFlagsSVDLC)]
    pub fn tm_flags_sv_dlc(&self) -> Option<Vec<u8>> {
        Some(self.sv_data?.tm_flags_dlc.to_bytes().to_vec())
    }

    #[wasm_bindgen(setter = tmFlagsSVDLC)]
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

    #[wasm_bindgen(js_name = toByteArray)]
    pub fn to_bytes_js(&self) -> JsResult<Vec<u8>> {
        Ok(self.to_bytes()?)
    }

    #[wasm_bindgen(js_name = fromV1Bytes)]
    pub fn from_v1_bytes(bytes: Vec<u8>) -> JsResult<Self> {
        Ok(OhpkmV1::from_bytes(&bytes).map(OhpkmV2::from_v1)?)
    }

    #[wasm_bindgen(js_name = getSectionBytes)]
    pub fn get_section_bytes(&self) -> JsResult<js_sys::Object> {
        let obj = js_sys::Object::new();

        js_sys::Reflect::set(
            &obj,
            &JsValue::from("MainData"),
            &JsValue::from(self.main_data.to_bytes()?),
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

    // Calculated
    #[wasm_bindgen(js_name = isShinyWasm)]
    pub fn is_shiny(&self) -> bool {
        self.main_data.is_shiny()
    }

    #[wasm_bindgen(js_name = isSquareShinyWasm)]
    pub fn is_square_shiny(&self) -> bool {
        self.main_data.is_square_shiny()
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
            &JsValue::from(section.to_bytes()?),
        )?;
    }
    Ok(())
}
