use crate::gen8_swsh::Pk8AbilityIndex;

use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveIndex, MoveSlots};
use pkm_rs_types::{AbilityNumber, FlagSet, PokerusStatus};
use serde::Serialize;

#[derive(Debug, Serialize, Clone, Copy)]
pub struct HomePk8Data {
    pub can_gigantamax: bool,
    pub sociability: u32,
    pub moves: MoveSlots,
    pub relearn_moves: [MoveIndex; 4],
    pub dynamax_level: u8,
    // poke job data goes here but is currently not read in OpenHome at all
    pub fullness: u8,
    pub tr_flags_swsh: FlagSet<14>,
    pub palma: u32,
    pub ball: Ball,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub pokerus_state: PokerusStatus,
    pub ability_index: Pk8AbilityIndex,
    pub ability_num: AbilityNumber,
}
