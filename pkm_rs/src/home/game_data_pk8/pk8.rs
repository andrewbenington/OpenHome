use super::PkhPk8Buffer;
use crate::gen8_swsh::Pk8AbilityIndex;
use crate::result::{Error, Result};

use pkm_rs_resources::abilities::{AbilityIndexBounded, AbilityIndexWasm};
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveSlot, MoveSlots};
use pkm_rs_types::{AbilityNumber, FlagSet, Pokerus};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "PkhPk8DataWasm"))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct HomePk8Data {
    pub can_gigantamax: bool,
    pub sociability: u8,
    pub moves: MoveSlots,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub relearn_moves: [MoveSlot; 4],
    pub dynamax_level: u8,
    // poke job data goes here but is currently not read in OpenHome at all
    pub fullness: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tr_flags_swsh: FlagSet<14>,
    pub palma: u32,
    pub ball: Ball,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub pokerus: Pokerus,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
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

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_class = "PkhPk8DataWasm")]
#[allow(clippy::missing_const_for_fn)]
impl HomePk8Data {
    #[wasm_bindgen(getter)]
    pub fn relearn_move_indices(&self) -> Vec<u16> {
        self.relearn_moves.into_iter().map(u16::from).collect()
    }

    #[wasm_bindgen(getter = trFlags)]
    pub fn tr_flags_swsh_wasm(&self) -> Vec<u8> {
        self.tr_flags_swsh.to_bytes().to_vec()
    }

    #[wasm_bindgen(getter = abilityIndex)]
    pub fn ability_index_wasm(&self) -> AbilityIndexWasm {
        AbilityIndexWasm::try_from(self.ability_index.to_u16())
            .expect("AbilityIndexWasm should accept any valid ability index")
    }
}
