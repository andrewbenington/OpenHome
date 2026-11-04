use super::PkhPb7Buffer;
use super::pb7_buffer::PkhPb7BufferMut;
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

    pub fn write_to_box_buffer(&self, buf: &mut PkhPb7BufferMut) {
        buf.set_avs(self.avs);
        buf.set_resort_event_status(self.resort_event_status);
        buf.set_move_slots(&self.moves);
        buf.set_relearn_move(0, self.relearn_moves[0]);
        buf.set_relearn_move(1, self.relearn_moves[1]);
        buf.set_relearn_move(2, self.relearn_moves[2]);
        buf.set_relearn_move(3, self.relearn_moves[3]);
        buf.set_spirit(self.spirit);
        buf.set_mood(self.mood);
        buf.set_fullness(self.fullness);
        buf.set_rank(self.rank);
        buf.set_received_date_year(self.received_year);
        buf.set_received_date_month(self.received_month);
        buf.set_received_date_day(self.received_day);
        buf.set_received_date_hour(self.received_hour);
        buf.set_received_date_minute(self.received_minute);
        buf.set_received_date_second(self.received_second);
        buf.set_enjoyment(self.enjoyment);
        buf.set_geo_padding(self.geo_padding);
        buf.set_ball(self.ball);
        buf.set_egg_location_index(self.egg_location_index);
        buf.set_met_location_index(self.met_location_index);
        buf.set_pokerus(self.pokerus);
        buf.set_ability_index(self.ability_index);
        buf.set_ability_num(self.ability_num);
    }

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        match size {
            super::HOME_PB7_DATA_SIZE => Self::from_buffer(&PkhPb7Buffer::new(bytes)),
            _ => Err(Error::buffer_size(super::HOME_PB7_DATA_SIZE, size)),
        }
    }

    pub fn to_bytes(self) -> [u8; super::HOME_PB7_DATA_SIZE] {
        let mut bytes = [0u8; super::HOME_PB7_DATA_SIZE];
        self.write_to_box_buffer(&mut PkhPb7BufferMut::new_mut(&mut bytes));

        bytes
    }
}
