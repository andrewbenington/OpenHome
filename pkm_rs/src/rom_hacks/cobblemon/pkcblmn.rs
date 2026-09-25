use super::conversion::ball::ball_map::CobblemonBall;

use pkm_rs_resources::abilities::AbilityIndexWasm;
use pkm_rs_resources::moves::{MoveIndex, MoveSlots};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::{CobblemonRibbon, CobblemonRibbonSet};
#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
use pkm_rs_types::{AbilityNumber, Gender, Ivs, Stats8, TeraType};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = PkCblmnWasm))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct PkCblmn {
    //pub uuid: MinecraftEntityUuid,
    //pub species_and_form: CobblemonSpeciesForm,
    pub held_item: u16,
    pub held_item_visible: bool,
    pub exp: u32,
    pub ability_index: AbilityIndexWasm,
    pub ability_num: AbilityNumber,
    pub nature: NatureIndex,
    pub mint_nature: NatureIndex,
    pub gender: Gender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub evs: Stats8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ride_boosts: [u8; 5],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ribbons: CobblemonRibbonSet<14>,
    pub cobblemon_marks: CobblemonRibbonSet<10>,
    affixed_ribbon: Option<CobblemonRibbon>,
    //pub scale: ,
    //pub nickname: ,
    pub moves: MoveSlots,
    pub benched_moves: Option<Vec<MoveIndex>>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ivs: Ivs,
    pub dynamax_level: Option<u8>,
    pub can_gigantamax: Option<bool>,
    pub tera_type: Option<TeraType>,
    pub is_shiny: bool,
    //pub trainer_name: &str<19>, // Minecraft uses UTF-8 strings
    //pub trainer_uuid: Option<MinecraftPlayerUuid>,
    pub trainer_friendship: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ball: CobblemonBall,
    pub is_tradeable: bool,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub stat_level: u8,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub current_hp: u16,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub status_condition: u32,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub fainted_timer: i16,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub healing_timer: u8,
}
