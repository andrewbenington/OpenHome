use super::game_data_pa8::HomePa8Data;
use super::game_data_pa9::HomePa9Data;
use super::game_data_pb7::HomePb7Data;
use super::game_data_pb8::HomePb8Data;
use super::game_data_pk8::HomePk8Data;
use super::game_data_pk9::HomePk9Data;

use pkm_rs_derive::IsShiny4096;
use pkm_rs_resources::{natures::NatureIndex, ribbons::ModernRibbon};
use pkm_rs_types::{
    BinaryGender, ContestStats, Gender, HyperTraining, Ivs, Language, MarkingsSixShapesColors,
    OriginGame, PokeDate, Stats8, TrainerMemory, strings::SizedUtf16String,
};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "PkhWasm"))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny4096)]
pub struct Pkh {
    // header
    pub data_version: u16,
    pub encryption_seed: u64,
    pub checksum: u32,
    pub encoded_data_size: u16,
    pub core_data_size: u16,
    pub game_data_size: u16,

    // core data
    pub home_tracker: Option<u64>,
    pub encryption_constant: u32,
    pub is_bad_egg: bool,
    //pub species: u32,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub exp: u32,
    pub is_favorite: bool,
    pub markings: MarkingsSixShapesColors,
    pub personality_value: u32,
    pub nature: NatureIndex,
    pub mint_nature: NatureIndex,
    pub is_fateful_encounter: bool,
    pub gender: Gender,
    //pub form: u32,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub evs: Stats8,
    pub contest: ContestStats,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ivs: Ivs,
    pub is_nicknamed: bool,
    pub status_condition: u32,
    pub handler_gender: BinaryGender,
    pub handler_language: Option<Language>,
    pub is_current_handler: bool,
    pub handler_id: u16,
    pub handler_friendship: u8,
    pub handler_memory: TrainerMemory,
    pub game_of_origin: OriginGame,
    pub game_of_origin_battle: Option<OriginGame>,
    pub language: Language,
    pub form_argument: u32,
    pub affixed_ribbon: Option<ModernRibbon>,
    pub trainer_friendship: u8,
    pub trainer_memory: TrainerMemory,
    pub egg_date: Option<PokeDate>,
    pub met_date: PokeDate,
    pub met_level: u8,
    pub trainer_gender: BinaryGender,
    pub hyper_training: HyperTraining,
    pub held_item_index: u16,
    pub nickname: SizedUtf16String<26>,
    pub trainer_name: SizedUtf16String<26>,
    pub handler_name: SizedUtf16String<26>,

    // game data
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub pb7_data: Option<HomePb7Data>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub pk8_data: Option<HomePk8Data>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub pa8_data: Option<HomePa8Data>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub pb8_data: Option<HomePb8Data>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub pk9_data: Option<HomePk9Data>,
    //pub pc9_data: Option<HomePc9Data>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub pa9_data: Option<HomePa9Data>,
}
