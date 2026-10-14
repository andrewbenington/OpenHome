use crate::gen9_sv::{Pk9AbilityIndex, TM_FLAG_BYTE_LENGTH_BASE, TM_FLAG_BYTE_LENGTH_DLC};

use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveIndex, MoveSlots};
use pkm_rs_types::{AbilityNumber, FlagSet, TeraType};
use serde::Serialize;

#[derive(Debug, Serialize, Clone, Copy)]
pub struct HomePk9Data {
    pub scale: u8,
    pub moves: MoveSlots,
    pub relearn_moves: [MoveIndex; 4],
    pub tera_type_original: TeraType,
    pub tera_type_override: Option<TeraType>,
    pub ball: Ball,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub tm_flags_base_game: FlagSet<TM_FLAG_BYTE_LENGTH_BASE>,
    pub obedience_level: u8,
    pub ability_index: Pk9AbilityIndex,
    pub ability_num: AbilityNumber,
    pub tm_flags_dlc: FlagSet<TM_FLAG_BYTE_LENGTH_DLC>,
}
