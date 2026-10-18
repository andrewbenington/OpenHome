use super::PkhPk9Buffer;
use crate::gen9_sv::Pk9AbilityIndex;
use crate::gen9_sv::{TM_FLAG_BYTE_LENGTH_BASE, TM_FLAG_BYTE_LENGTH_DLC};
use crate::result::{Error, Result};

use pkm_rs_resources::abilities::{AbilityIndexBounded, AbilityIndexWasm};
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveSlot, MoveSlots};
use pkm_rs_types::{AbilityNumber, FlagSet, TeraType};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "PkhPk9DataWasm"))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct HomePk9Data {
    pub scale: u8,
    pub moves: MoveSlots,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub relearn_moves: [MoveSlot; 4],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tera_type_original: TeraType,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tera_type_override: Option<TeraType>,
    pub ball: Ball,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tm_flags_base_game: FlagSet<TM_FLAG_BYTE_LENGTH_BASE>,
    pub obedience_level: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ability_index: Pk9AbilityIndex,
    pub ability_num: AbilityNumber,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tm_flags_dlc: FlagSet<TM_FLAG_BYTE_LENGTH_DLC>,
}

impl HomePk9Data {
    // ------------------------------------------------------------------
    // Deserialise from a PkhPk9Buffer (the single source of all byte offsets)
    // ------------------------------------------------------------------

    pub fn from_buffer<S: AsRef<[u8]>>(buf: &PkhPk9Buffer<S>) -> Result<Self> {
        let data = HomePk9Data {
            scale: buf.scale(),
            moves: buf.move_slots(),
            relearn_moves: [
                buf.relearn_move(0),
                buf.relearn_move(1),
                buf.relearn_move(2),
                buf.relearn_move(3),
            ],
            tera_type_original: TeraType::from_byte_original(buf.tera_type_original())?,
            tera_type_override: TeraType::from_byte_override(buf.tera_type_override())?,
            ball: buf.ball(),
            egg_location_index: buf.egg_location_index(),
            met_location_index: buf.met_location_index(),
            tm_flags_base_game: FlagSet::from_bytes(buf.tm_flags_base_game_raw()),
            obedience_level: buf.obedience_level(),
            ability_index: AbilityIndexBounded::try_from(buf.ability_index_raw())?,
            ability_num: buf.ability_num()?,
            tm_flags_dlc: FlagSet::from_bytes(buf.tm_flags_dlc_raw()),
        };
        Ok(data)
    }

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        match size {
            super::HOME_PK9_DATA_SIZE => Self::from_buffer(&PkhPk9Buffer::new(bytes)),
            _ => Err(Error::buffer_size(super::HOME_PK9_DATA_SIZE, size)),
        }
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_class = "PkhPk9DataWasm")]
#[allow(clippy::missing_const_for_fn)]
impl HomePk9Data {
    #[wasm_bindgen(getter)]
    pub fn relearn_move_indices(&self) -> Vec<u16> {
        self.relearn_moves.into_iter().map(u16::from).collect()
    }

    #[wasm_bindgen(getter = abilityIndex)]
    pub fn ability_index_wasm(&self) -> AbilityIndexWasm {
        AbilityIndexWasm::try_from(self.ability_index.to_u16())
            .expect("AbilityIndexWasm should accept any valid ability index")
    }

    #[wasm_bindgen(getter = tmFlagsBaseGame)]
    pub fn tm_flags_base_game_wasm(&self) -> Vec<u8> {
        self.tm_flags_base_game.to_bytes().to_vec()
    }

    #[wasm_bindgen(getter = tmFlagsDLC)]
    pub fn tm_flags_dlc_wasm(&self) -> Vec<u8> {
        self.tm_flags_dlc.to_bytes().to_vec()
    }
}
