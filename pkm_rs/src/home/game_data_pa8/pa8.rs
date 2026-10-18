use super::MOVE_FLAG_BYTE_LENGTH;
use super::PkhPa8Buffer;
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
    pub alpha_move: Option<MoveSlot>,
    pub scale: u8,
    pub moves: MoveSlots,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub relearn_moves: [MoveSlot; 4],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub gvs: Stats8,
    //pub height_absolute: f32,
    //pub weight_absolute: f32,
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
            alpha_move: Some(buf.alpha_move()),
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

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        match size {
            super::HOME_PA8_DATA_SIZE => Self::from_buffer(&PkhPa8Buffer::new(bytes)),
            _ => Err(Error::buffer_size(super::HOME_PA8_DATA_SIZE, size)),
        }
    }
}

// #[cfg(feature = "wasm")]
// #[wasm_bindgen(js_class = "PkhPa8DataWasm")]
// #[allow(clippy::missing_const_for_fn)]
// impl HomePa8Data {
//     #[wasm_bindgen(getter)]
//     pub fn move_indices(&self) -> Vec<u16> {
//         self.moves.indices()
//     }

//     #[wasm_bindgen(getter)]
//     pub fn move_pp(&self) -> Vec<u8> {
//         self.moves.pp()
//     }

//     #[wasm_bindgen(getter)]
//     pub fn relearn_move_indices(&self) -> Vec<u16> {
//         self.relearn_moves.into_iter().map(u16::from).collect()
//     }

//     #[wasm_bindgen(getter = gvs)]
//     pub fn gvs_wasm(&self) -> Stats16Le {
//         self.gvs.into()
//     }

//     #[wasm_bindgen(getter = tutorFlags)]
//     pub fn tutor_flags_la_wasm(&self) -> Vec<u8> {
//         self.tutor_flags_la.to_bytes().to_vec()
//     }

//     #[wasm_bindgen(getter = masteryFlags)]
//     pub fn master_flags_la_wasm(&self) -> Vec<u8> {
//         self.master_flags_la.to_bytes().to_vec()
//     }

//     #[wasm_bindgen(getter = abilityIndex)]
//     pub fn ability_index_wasm(&self) -> AbilityIndexWasm {
//         AbilityIndexWasm::try_from(self.ability_index.to_u16())
//             .expect("AbilityIndexWasm should accept any valid ability index")
//     }
// }
