use super::PkhPb8Buffer;
use crate::gen8_swsh::Pk8AbilityIndex;
use crate::result::{Error, Result};

use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveIndex, MoveSlots};
use pkm_rs_types::{AbilityNumber, Pokerus};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "PkhPb8Data"))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct HomePb8Data {
    pub moves: MoveSlots,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub relearn_moves: [MoveIndex; 4],
    pub ball: Ball,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub pokerus: Pokerus,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ability_index: Pk8AbilityIndex,
    pub ability_num: AbilityNumber,
}

impl HomePb8Data {
    // ------------------------------------------------------------------
    // Deserialise from a PkhPb8Buffer (the single source of all byte offsets)
    // ------------------------------------------------------------------

    pub fn from_buffer<S: AsRef<[u8]>>(buf: &PkhPb8Buffer<S>) -> Result<Self> {
        let data = HomePb8Data {
            moves: buf.move_slots(),
            relearn_moves: [
                buf.relearn_move(0),
                buf.relearn_move(1),
                buf.relearn_move(2),
                buf.relearn_move(3),
            ],
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
            super::HOME_PB8_DATA_SIZE => Self::from_buffer(&PkhPb8Buffer::new(bytes)),
            _ => Err(Error::buffer_size(super::HOME_PB8_DATA_SIZE, size)),
        }
    }
}
