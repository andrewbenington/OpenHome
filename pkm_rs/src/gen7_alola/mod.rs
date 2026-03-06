mod pk7;
mod pk7_buffer;
mod save;

pub use pk7::*;
use pkm_rs_resources::{moves::MoveDataOffsets, ribbons::ModernRibbon};
pub use save::{SunMoonSave, UltraSunMoonSave};

const BOX_SIZE: usize = 232;
const PARTY_SIZE: usize = 260;

const MAX_RIBBON_ALOLA: usize = ModernRibbon::BattleTreeMaster as usize;

const MOVE_DATA_OFFSETS: MoveDataOffsets = MoveDataOffsets {
    moves: 90,
    pp: 98,
    pp_ups: 102,
};
