use crate::gen8_swsh::Pk8AbilityIndex;

use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveIndex, MoveSlots};
use pkm_rs_types::{AbilityNumber, PokerusStatus, Stats8};
use serde::Serialize;

#[derive(Debug, Serialize, Clone, Copy)]
pub struct HomePa8Data {
    pub is_alpha: bool,
    pub is_noble: bool,
    pub alpha_move: Option<MoveIndex>,
    pub scale: u8,
    pub moves: MoveSlots,
    pub relearn_moves: [MoveIndex; 4],
    pub gvs: Stats8,
    pub height_absolute: f32,
    pub weight_absolute: f32,
    pub ball: Ball,
    //pub tutor_flags_la: ,
    //pub master_flags_la: ,
    pub egg_location_index: u8, // always set to 0
    pub met_location_index: u8,
    pub pokerus_state: PokerusStatus,
    pub ability_index: Pk8AbilityIndex,
    pub ability_num: AbilityNumber,
}
