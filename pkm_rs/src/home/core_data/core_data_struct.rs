use super::PkhCoreBuffer;
use crate::result::{Error, Result};

use pkm_rs_derive::IsShiny4096;
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::{ModernRibbon, ModernRibbonSet};
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{
    BinaryGender, ContestStats, Gender, HyperTraining, Ivs, Language, MarkingsSixShapesColors,
    OriginGame, PokeDate, Stats8, TrainerMemory,
};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "PkhCoreDataWasm"))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny4096)]
pub struct HomeCoreData {
    pub home_tracker: u64,
    pub encryption_constant: u32,
    pub is_bad_egg: bool,
    pub species_and_form: SpeciesForm,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub exp: u32,
    pub is_favorite: bool,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub markings: MarkingsSixShapesColors,
    pub personality_value: u32,
    pub nature: NatureIndex,
    pub mint_nature: NatureIndex,
    pub is_fateful_encounter: bool,
    pub gender: Gender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub evs: Stats8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub contest: ContestStats,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ribbons: ModernRibbonSet<16>,
    pub contest_memory_count: u8,
    pub battle_memory_count: u8,
    pub height_scalar: u8,
    pub weight_scalar: u8,
    pub nickname: SizedUtf16String<26>,
    pub current_hp: u16,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ivs: Ivs,
    pub is_egg: bool,
    pub is_nicknamed: bool,
    pub status_condition: u32,
    pub handler_name: SizedUtf16String<26>,
    pub handler_gender: BinaryGender,
    pub handler_language: Option<Language>,
    pub is_current_handler: bool,
    pub handler_id: u16,
    pub handler_friendship: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub handler_memory: TrainerMemory,
    pub game_of_origin: OriginGame,
    pub game_of_origin_battle: Option<OriginGame>,
    pub language: Language,
    pub form_argument: u32,
    pub affixed_ribbon: Option<ModernRibbon>,
    pub trainer_name: SizedUtf16String<26>,
    pub trainer_friendship: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub trainer_memory: TrainerMemory,
    pub egg_date: Option<PokeDate>,
    pub met_date: PokeDate,
    pub met_level: u8,
    pub trainer_gender: BinaryGender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub hyper_training: HyperTraining,
    pub held_item_index: u16,
}

impl HomeCoreData {
    // ------------------------------------------------------------------
    // Deserialise from a PkhCoreBuffer (the single source of all byte offsets)
    // ------------------------------------------------------------------

    pub fn from_buffer<S: AsRef<[u8]>>(buf: &PkhCoreBuffer<S>) -> Result<Self> {
        let data = HomeCoreData {
            home_tracker: buf.home_tracker(),
            encryption_constant: buf.encryption_constant(),
            is_bad_egg: buf.is_bad_egg(),
            species_and_form: buf.species_and_form()?,
            trainer_id: buf.trainer_id(),
            secret_id: buf.secret_id(),
            exp: buf.exp(),
            is_favorite: buf.is_favorite(),
            markings: buf.markings(),
            personality_value: buf.personality_value(),
            nature: buf.nature()?,
            mint_nature: buf.mint_nature()?,
            is_fateful_encounter: buf.is_fateful_encounter(),
            gender: buf.gender(),
            evs: buf.evs(),
            contest: buf.contest(),
            ribbons: buf.ribbons(),
            contest_memory_count: buf.contest_memory_count(),
            battle_memory_count: buf.battle_memory_count(),
            height_scalar: buf.height_scalar(),
            weight_scalar: buf.weight_scalar(),
            nickname: buf.nickname(),
            current_hp: buf.current_hp(),
            ivs: buf.ivs(),
            is_egg: buf.is_egg(),
            is_nicknamed: buf.is_nicknamed(),
            status_condition: buf.status_condition(),
            handler_name: buf.handler_name(),
            handler_gender: buf.handler_gender(),
            handler_language: buf.handler_language().ok(),
            is_current_handler: buf.is_current_handler(),
            handler_id: buf.handler_id(),
            handler_friendship: buf.handler_friendship(),
            handler_memory: buf.handler_memory(),
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
            met_level: buf.met_level(),
            trainer_gender: buf.trainer_gender(),
            hyper_training: buf.hyper_training(),
            held_item_index: buf.held_item_index(),
        };
        Ok(data)
    }

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        match size {
            super::HOME_CORE_DATA_SIZE => Self::from_buffer(&PkhCoreBuffer::new(bytes)),
            _ => Err(Error::buffer_size(super::HOME_CORE_DATA_SIZE, size)),
        }
    }
}

// #[cfg(feature = "wasm")]
// #[wasm_bindgen(js_class = "PkhCoreDataWasm")]
// #[allow(clippy::missing_const_for_fn)]
// impl HomeCoreData {
//     #[wasm_bindgen(getter = evs)]
//     pub fn evs_wasm(&self) -> Stats16Le {
//         self.evs.into()
//     }

//     #[wasm_bindgen(getter)]
//     pub fn ribbons(&self) -> Vec<String> {
//         self.ribbons
//             .get_ribbons()
//             .iter()
//             .map(|ribbon| ribbon.to_string())
//             .collect()
//     }

//     #[wasm_bindgen(getter)]
//     pub fn ribbon_bytes(&self) -> Vec<u8> {
//         self.ribbons.to_bytes().into_iter().collect()
//     }

//     #[wasm_bindgen(getter = ivs)]
//     pub fn ivs_wasm(&self) -> Stats16Le {
//         self.ivs.into()
//     }

//     #[wasm_bindgen(setter = ivs)]
//     pub fn set_ivs_wasm(&mut self, v: Stats16Le) {
//         self.ivs = v.to_ivs_capped()
//     }
// }
