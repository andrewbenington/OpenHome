use super::PkhPa9Buffer;
use super::pa9_buffer::PkhPa9BufferMut;
#[cfg(feature = "wasm")]
use crate::gen9_lza::PlusMoveFlags;
use crate::gen9_lza::{LZA_PLUS_MOVES_0X94_BYTES, LZA_PLUS_MOVES_0XD6_BYTES};
use crate::result::{Error, Result};

use pkm_rs_resources::abilities::AbilityIndexWasm;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::MoveSlot;
use pkm_rs_types::{AbilityNumber, FlagSet};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "PkhPa9DataWasm"))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct HomePa9Data {
    pub scale: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub moves: [MoveSlot; 4],
    pub is_alpha: bool,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub plus_moves_b: FlagSet<LZA_PLUS_MOVES_0X94_BYTES>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub plus_moves_c: FlagSet<LZA_PLUS_MOVES_0XD6_BYTES>,
    pub ball: Ball,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub obedience_level: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ability_index: AbilityIndexWasm,
    pub ability_num: AbilityNumber,
    // PKHeX has not yet updated GameDataPA9 for MD, so DLC plus move flags are not yet included here.
}

impl HomePa9Data {
    // ------------------------------------------------------------------
    // Deserialise from a PkhPa9Buffer (the single source of all byte offsets)
    // ------------------------------------------------------------------

    pub fn from_buffer<S: AsRef<[u8]>>(buf: &PkhPa9Buffer<S>) -> Result<Self> {
        let data = HomePa9Data {
            scale: buf.scale(),
            moves: buf.moves_raw(),
            is_alpha: buf.is_alpha(),
            plus_moves_b: FlagSet::from_bytes(buf.plus_flags_za_b_raw()),
            plus_moves_c: FlagSet::from_bytes(buf.plus_flags_za_c_raw()),
            ball: buf.ball(),
            egg_location_index: buf.egg_location_index(),
            met_location_index: buf.met_location_index(),
            obedience_level: buf.obedience_level(),
            ability_index: AbilityIndexWasm::try_from(buf.ability_index_raw())?,
            ability_num: buf.ability_num()?,
        };
        Ok(data)
    }

    pub fn write_to_box_buffer(&self, buf: &mut PkhPa9BufferMut) {
        buf.set_scale(self.scale);
        buf.set_moves(&self.moves);
        buf.set_is_alpha(self.is_alpha);
        buf.set_plus_flags_za_b(&self.plus_moves_b.to_bytes());
        buf.set_plus_flags_za_c(&self.plus_moves_c.to_bytes());
        buf.set_ball(self.ball);
        buf.set_egg_location_index(self.egg_location_index);
        buf.set_met_location_index(self.met_location_index);
        buf.set_obedience_level(self.obedience_level);
        buf.set_ability_index(self.ability_index);
        buf.set_ability_num(self.ability_num);
    }

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        match size {
            super::HOME_PA9_DATA_SIZE => Self::from_buffer(&PkhPa9Buffer::new(bytes)),
            _ => Err(Error::buffer_size(super::HOME_PA9_DATA_SIZE, size)),
        }
    }

    pub fn to_bytes(self) -> [u8; super::HOME_PA9_DATA_SIZE] {
        let mut bytes = [0u8; super::HOME_PA9_DATA_SIZE];
        self.write_to_box_buffer(&mut PkhPa9BufferMut::new_mut(&mut bytes));

        bytes
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_class = "PkhPa9DataWasm")]
#[allow(clippy::missing_const_for_fn)]
impl HomePa9Data {
    #[wasm_bindgen(getter)]
    pub fn move_indices(&self) -> Vec<u16> {
        self.moves.into_iter().map(u16::from).collect()
    }

    #[wasm_bindgen(getter = plusFlagsLza)]
    pub fn plus_flags_za(&self) -> PlusMoveFlags {
        PlusMoveFlags::from_flag_sets(self.plus_moves_c, self.plus_moves_b)
    }

    #[wasm_bindgen(getter = abilityIndex)]
    pub fn ability_index(&self) -> AbilityIndexWasm {
        AbilityIndexWasm::try_from(self.ability_index.to_u16())
            .expect("AbilityIndexWasm should accept any valid ability index")
    }
}
