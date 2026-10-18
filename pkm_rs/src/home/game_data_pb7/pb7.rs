use super::PkhPb7Buffer;
use crate::result::{Error, Result};

use pkm_rs_resources::abilities::AbilityIndexWasm;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveSlot, MoveSlots};
use pkm_rs_types::{AbilityNumber, Pokerus, Stats8};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "PkhPb7DataWasm"))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct HomePb7Data {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub avs: Stats8,
    pub resort_event_status: u8,
    pub moves: MoveSlots,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub relearn_moves: [MoveSlot; 4],
    //pub height_absolute: f32,
    //pub weight_absolute: f32,
    pub spirit: u8,
    pub mood: u8,
    pub fullness: u8,
    pub rank: u8,
    pub received_year: u8,
    pub received_month: u8,
    pub received_day: u8,
    pub received_hour: u8,
    pub received_minute: u8,
    pub received_second: u8,
    pub enjoyment: u8,
    pub geo_padding: u32,
    pub ball: Ball,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub pokerus: Pokerus,
    pub ability_index: AbilityIndexWasm,
    pub ability_num: AbilityNumber,
}

impl HomePb7Data {
    // ------------------------------------------------------------------
    // Deserialise from a PkhPb7Buffer (the single source of all byte offsets)
    // ------------------------------------------------------------------

    pub fn from_buffer<S: AsRef<[u8]>>(buf: &PkhPb7Buffer<S>) -> Result<Self> {
        let data = HomePb7Data {
            avs: buf.avs(),
            resort_event_status: buf.resort_event_state(),
            moves: buf.move_slots(),
            relearn_moves: [
                buf.relearn_move(0),
                buf.relearn_move(1),
                buf.relearn_move(2),
                buf.relearn_move(3),
            ],
            spirit: buf.spirit(),
            mood: buf.mood(),
            fullness: buf.fullness(),
            rank: buf.rank(),
            received_year: buf.received_date_year(),
            received_month: buf.received_date_month(),
            received_day: buf.received_date_day(),
            received_hour: buf.received_date_hour(),
            received_minute: buf.received_date_minute(),
            received_second: buf.received_date_second(),
            enjoyment: buf.enjoyment(),
            geo_padding: buf.geo_padding(),
            ball: buf.ball(),
            egg_location_index: buf.egg_location_index(),
            met_location_index: buf.met_location_index(),
            pokerus: buf.pokerus(),
            ability_index: buf.ability_index()?,
            ability_num: buf.ability_num()?,
        };
        Ok(data)
    }

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        match size {
            super::HOME_PB7_DATA_SIZE => Self::from_buffer(&PkhPb7Buffer::new(bytes)),
            _ => Err(Error::buffer_size(super::HOME_PB7_DATA_SIZE, size)),
        }
    }
}

// #[cfg(feature = "wasm")]
// #[wasm_bindgen(js_class = "PkhPb7DataWasm")]
// #[allow(clippy::missing_const_for_fn)]
// impl HomePb7Data {
//     #[wasm_bindgen(getter = avs)]
//     pub fn avs_wasm(&self) -> Stats16Le {
//         self.avs.into()
//     }

//     #[wasm_bindgen(getter)]
//     pub fn relearn_move_indices(&self) -> Vec<u16> {
//         self.relearn_moves.into_iter().map(u16::from).collect()
//     }
// }
