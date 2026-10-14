use crate::gen8_swsh::Pk8AbilityIndex;

use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveIndex, MoveSlots};
use pkm_rs_types::{AbilityNumber, PokerusStatus};
use serde::Serialize;

#[derive(Debug, Serialize, Clone, Copy)]
pub struct HomePb8Data {
    pub moves: MoveSlots,
    pub relearn_moves: [MoveIndex; 4],
    pub ball: Ball,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub pokerus_state: PokerusStatus,
    pub ability_index: Pk8AbilityIndex,
    pub ability_num: AbilityNumber,
}
