use super::MOVE_FLAG_BYTE_LENGTH;
use super::PkhPa8Buffer;
use super::pa8_buffer::PkhPa8BufferMut;
use crate::gen8_swsh::Pk8AbilityIndex;
use crate::result::{Error, Result};

use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveSlot, MoveSlots};
use pkm_rs_types::{AbilityNumber, FlagSet, Pokerus, Stats8};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "PkhPa8DataWasm"))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct HomePa8Data {
    pub is_alpha: bool,
    pub is_noble: bool,
    pub alpha_move: MoveSlot,
    pub scale: u8,
    pub moves: MoveSlots,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub relearn_moves: [MoveSlot; 4],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub gvs: Stats8,
    pub ball: Ball,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tutor_flags_la: FlagSet<MOVE_FLAG_BYTE_LENGTH>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub master_flags_la: FlagSet<MOVE_FLAG_BYTE_LENGTH>,
    pub egg_location_index: u16, // always set to 0
    pub met_location_index: u16,
    pub pokerus: Pokerus,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ability_index: Pk8AbilityIndex,
    pub ability_num: AbilityNumber,
}

impl HomePa8Data {
    // ------------------------------------------------------------------
    // Deserialise from a PkhPa8Buffer (the single source of all byte offsets)
    // ------------------------------------------------------------------

    pub fn from_buffer<S: AsRef<[u8]>>(buf: &PkhPa8Buffer<S>) -> Result<Self> {
        let data = HomePa8Data {
            is_alpha: buf.is_alpha(),
            is_noble: buf.is_noble(),
            alpha_move: buf.alpha_move(),
            scale: buf.scale(),
            moves: buf.move_slots(),
            relearn_moves: [
                buf.relearn_move(0),
                buf.relearn_move(1),
                buf.relearn_move(2),
                buf.relearn_move(3),
            ],
            gvs: buf.gvs(),
            tutor_flags_la: FlagSet::from_bytes(buf.tutor_flags_la_raw()),
            master_flags_la: FlagSet::from_bytes(buf.mastered_flags_la_raw()),
            ball: buf.ball(),
            egg_location_index: buf.egg_location_index(),
            met_location_index: buf.met_location_index(),
            pokerus: buf.pokerus(),
            ability_index: AbilityIndexBounded::try_from(buf.ability_index_raw())?,
            ability_num: buf.ability_num()?,
        };
        Ok(data)
    }

    pub fn write_to_box_buffer(&self, buf: &mut PkhPa8BufferMut) {
        buf.set_is_alpha(self.is_alpha);
        buf.set_is_noble(self.is_noble);
        buf.set_alpha_move(self.alpha_move);
        buf.set_scale(self.scale);
        buf.set_move_slots(self.moves);
        buf.set_relearn_move(0, self.relearn_moves[0]);
        buf.set_relearn_move(1, self.relearn_moves[1]);
        buf.set_relearn_move(2, self.relearn_moves[2]);
        buf.set_relearn_move(3, self.relearn_moves[3]);
        buf.set_gvs(self.gvs);
        // TODO: write absolute height and weight
        buf.set_ball(self.ball);
        buf.set_tutor_flags_la(&self.tutor_flags_la.to_bytes());
        buf.set_mastered_flags_la(&self.master_flags_la.to_bytes());
        buf.set_egg_location_index(self.egg_location_index);
        buf.set_met_location_index(self.met_location_index);
        buf.set_pokerus(self.pokerus);
        buf.set_ability_index(self.ability_index);
        buf.set_ability_num(self.ability_num);
    }

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        match size {
            super::HOME_PA8_DATA_SIZE => Self::from_buffer(&PkhPa8Buffer::new(bytes)),
            _ => Err(Error::buffer_size(super::HOME_PA8_DATA_SIZE, size)),
        }
    }

    pub fn to_bytes(self) -> [u8; super::HOME_PA8_DATA_SIZE] {
        let mut bytes = [0u8; super::HOME_PA8_DATA_SIZE];
        self.write_to_box_buffer(&mut PkhPa8BufferMut::new_mut(&mut bytes));

        bytes
    }
}
