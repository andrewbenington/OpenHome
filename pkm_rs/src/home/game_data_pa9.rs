use crate::gen9_lza::{LZA_PLUS_MOVES_0X94_BYTES, LZA_PLUS_MOVES_0XD6_BYTES};
use crate::gen9_sv::Pk9AbilityIndex;

use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::MoveIndex;
use pkm_rs_types::{AbilityNumber, FlagSet};
use serde::Serialize;

#[derive(Debug, Serialize, Clone, Copy)]
pub struct HomePa9Data {
    pub scale: u8,
    pub moves: [MoveIndex; 4],
    pub is_alpha: bool,
    pub plus_moves_b: FlagSet<LZA_PLUS_MOVES_0X94_BYTES>,
    pub plus_moves_c: FlagSet<LZA_PLUS_MOVES_0XD6_BYTES>,
    pub ball: Ball,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub obedience_level: u8,
    pub ability_index: Pk9AbilityIndex,
    pub ability_num: AbilityNumber,
    // PKHeX has not yet updated GameDataPA9 for MD, so DLC plus move flags are not yet included here.
}
