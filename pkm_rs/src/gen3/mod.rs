#[cfg(feature = "wasm")]
mod colopkm_buffer;

#[cfg(feature = "wasm")]
mod pk3;
#[cfg(feature = "wasm")]
mod pk3_buffer;
mod pokemon_index;

#[cfg(feature = "wasm")]
pub mod colopkm;

#[cfg(feature = "wasm")]
pub use colopkm::Colopkm;
#[cfg(feature = "wasm")]
pub use pk3::*;
pub use pokemon_index::Gen3PokemonIndex;

#[cfg(feature = "wasm")]
use pk3_buffer::Offset;
#[cfg(feature = "wasm")]
use pk3_buffer::Pk3Buffer;
use pkm_rs_resources;
use pkm_rs_resources::abilities::AbilityIndexBounded;
#[cfg(feature = "wasm")]
use pkm_rs_resources::moves::MoveDataOffsets;
use pkm_rs_types::NationalDex;

#[cfg(feature = "wasm")]
pub(crate) const BOX_SIZE_GBA: usize = 80;
#[cfg(feature = "wasm")]
pub(crate) const PARTY_SIZE_GBA: usize = 100;
#[cfg(feature = "wasm")]
pub(crate) const PKM_SIZE_COLOSSEUM: usize = 312;

#[cfg(feature = "wasm")]
const MOVE_DATA_OFFSETS_GBA: MoveDataOffsets<Offset> = MoveDataOffsets {
    moves: Offset::Moves,
    pp: Offset::MovePp,
    pp_ups: Offset::MovePpUps,
};

const AIR_LOCK: u16 = 76;
pub const PK3_MAX_ABILITY: u16 = AIR_LOCK;
pub type Gen3AbilityIndex = AbilityIndexBounded<AIR_LOCK>;

#[cfg(test)]
const MAX_BOX_COUNT_GCN: u8 = 32;
#[cfg(test)]
const BOX_ROWS: u8 = 5;
#[cfg(test)]
const BOX_COLS: u8 = 6;
#[cfg(test)]
const BOX_SLOTS: u8 = BOX_ROWS * BOX_COLS;

#[cfg(test)]
type BoxIndex = pkm_rs_types::BoundedU8<{ MAX_BOX_COUNT_GCN - 1 }>;

#[cfg(test)]
type BoxSlot = pkm_rs_types::BoundedU8<{ BOX_SLOTS - 1 }>;

pub fn form_index_from_pid(national_dex: NationalDex, pid: u32) -> u8 {
    if national_dex == NationalDex::Unown {
        crate::util::unown_form_from_pid_gen3(pid)
    } else {
        0
    }
}

#[cfg(test)]
mod test {
    use super::{BOX_SLOTS, BoxIndex, BoxSlot, MAX_BOX_COUNT_GCN};
    use crate::result::{Error, Result};

    #[test]
    fn all_boxes_valid_gcn() -> Result<()> {
        for index in 0..MAX_BOX_COUNT_GCN {
            BoxIndex::check_bound(index).or(Err(Error::BoxIndex(index)))?;
        }

        for slot in 0..BOX_SLOTS {
            BoxSlot::check_bound(slot).or(Err(Error::BoxSlot(slot)))?;
        }

        Ok(())
    }
}
