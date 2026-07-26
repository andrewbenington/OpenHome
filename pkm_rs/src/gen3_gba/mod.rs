mod pk3;
mod pk3_buffer;
mod pokemon_index;
// mod save;

pub use pk3::*;
pub use pokemon_index::Gen3PokemonIndex;

use pk3_buffer::Offset;
use pk3_buffer::Pk3Buffer;
use pkm_rs_resources::{abilities::AbilityIndexBounded, moves::MoveDataOffsets};

pub(crate) const BOX_SIZE: usize = 80;
pub(crate) const PARTY_SIZE: usize = 100;

const MOVE_DATA_OFFSETS: MoveDataOffsets<Offset> = MoveDataOffsets {
    moves: Offset::Moves,
    pp: Offset::MovePp,
    pp_ups: Offset::MovePpUps,
};

const AIR_LOCK: u16 = 76;
pub const PK3_MAX_ABILITY: u16 = AIR_LOCK;
pub type Pk3AbilityIndex = AbilityIndexBounded<AIR_LOCK>;
