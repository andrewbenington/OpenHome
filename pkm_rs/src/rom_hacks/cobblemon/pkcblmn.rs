use super::conversion::ball::ball_map::CobblemonBall;

use pkm_rs_resources::abilities::AbilityIndexWasm;
use pkm_rs_resources::moves::{MoveIndex, MoveSlots};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::{CobblemonRibbon, CobblemonRibbonSet};
#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{
    AbilityNumber, Gender, Ivs, MarkingsSixShapesColors, Pokerus, Stats8, TeraType, read_u16_le,
};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = PkCblmnWasm))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct PkCblmn {
    pub species_and_form: CobblemonSpeciesForm,
    pub held_item_index: u16,
    pub held_item_visible: bool,
    pub exp: u32,
    pub ability_index: AbilityIndexWasm,
    pub ability_num: AbilityNumber,
    pub nature: NatureIndex,
    pub mint_nature: NatureIndex,
    pub gender: Gender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub evs: Stats8,
    pub pokerus: Pokerus,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ride_boosts: [u8; 5],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ribbons: CobblemonRibbonSet<14>,
    pub affixed_ribbon: Option<CobblemonRibbon>,
    pub markings: MarkingsSixShapesColors,
    //pub scale: ,
    pub nickname: SizedUtf16String<26>, // max 19 characters
    pub moves: MoveSlots,
    pub benched_moves: Option<Vec<MoveIndex>>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ivs: Ivs,
    pub hyper_training: Ivs,
    pub fullness: u8,
    pub dynamax_level: Option<u8>,
    pub can_gigantamax: Option<bool>,
    pub tera_type: Option<TeraType>,
    pub is_shiny: bool,
    pub trainer_is_player: bool,
    pub trainer_uuid: Optional<MinecraftPlayerUUID>,
    pub trainer_name: SizedUtf16String<26>, // max 16 characters
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

impl PkCblmn {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let mon = PkCblmn {
            // TODO: fill all this out
            species_and_form,
            held_item_index,
            held_item_visible,
            exp,
            ability_index,
            ability_num,
            nature,
            mint_nature,
            gender,
            evs,
            pokerus,
            ride_boosts,
            ribbons,
            affixed_ribbon,
            markings,
            //scale,
            nickname,
            moves,
            benched_moves,
            ivs,
            hyper_training,
            fullness,
            dynamax_level,
            can_gigantamax,
            tera_type,
            is_shiny,
            trainer_is_player,
            trainer_uuid,
            trainer_name,
            trainer_friendship,
            ball,
            is_tradeable,
            stat_level,
            current_hp,
            status_condition,
            fainted_timer,
            healing_timer,
        };
        Ok(mon)
    }

    // TODO: is_empty_slot
}

// TODO: impl PkmBytes for PkCblmn

impl ModernEvs for PkCblmn {
    fn get_evs(&self) -> Stats8 {
        self.evs
    }
}
