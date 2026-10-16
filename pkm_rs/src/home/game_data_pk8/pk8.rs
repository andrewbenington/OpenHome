use super::PkhPk8Buffer;
use crate::gen8_swsh::Pk8AbilityIndex;
use crate::result::{Error, Result};

use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveIndex, MoveSlots};
use pkm_rs_types::{AbilityNumber, FlagSet, Pokerus};
use serde::Serialize;

#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct HomePk8Data {
    pub can_gigantamax: bool,
    pub sociability: u8,
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
    pub pokerus: Pokerus,
    pub ability_index: Pk8AbilityIndex,
    pub ability_num: AbilityNumber,
}

impl HomePk8Data {
    // ------------------------------------------------------------------
    // Deserialise from a PkhPk8Buffer (the single source of all byte offsets)
    // ------------------------------------------------------------------

    pub fn from_buffer<S: AsRef<[u8]>>(buf: &PkhPk8Buffer<S>) -> Result<Self> {
        let data = HomePk8Data {
            can_gigantamax: buf.can_gigantamax(),
            sociability: buf.sociability(),
            moves: buf.move_slots(),
            relearn_moves: [
                buf.relearn_move(0),
                buf.relearn_move(1),
                buf.relearn_move(2),
                buf.relearn_move(3),
            ],
            dynamax_level: buf.dynamax_level(),
            fullness: buf.fullness(),
            tr_flags_swsh: FlagSet::from_bytes(buf.tr_flags_swsh_raw()),
            palma: buf.palma(),
            ball: buf.ball(),
            egg_location_index: buf.egg_location_index(),
            met_location_index: buf.met_location_index(),
            pokerus: buf.pokerus(),
            ability_index: AbilityIndexBounded::try_from(buf.ability_index_raw())?,
            ability_num: buf.ability_num()?,
        };
        Ok(data)
    }

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        match size {
            super::HOME_PK8_DATA_SIZE => Self::from_buffer(&PkhPk8Buffer::new(bytes)),
            _ => Err(Error::buffer_size(super::HOME_PK8_DATA_SIZE, size)),
        }
    }
}
