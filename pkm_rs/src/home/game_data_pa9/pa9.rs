use super::PkhPa9Buffer;
use crate::gen9_lza::{LZA_PLUS_MOVES_0X94_BYTES, LZA_PLUS_MOVES_0XD6_BYTES};
use crate::gen9_sv::Pk9AbilityIndex;
use crate::result::{Error, Result};

use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::MoveIndex;
use pkm_rs_types::{AbilityNumber, FlagSet};
use serde::Serialize;

#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct HomePa9Data {
    pub scale: u8,
    pub moves: [MoveIndex; 4],
    pub is_alpha: bool,
    pub plus_moves_b: FlagSet<LZA_PLUS_MOVES_0X94_BYTES>,
    pub plus_moves_c: FlagSet<LZA_PLUS_MOVES_0XD6_BYTES>,
    pub ball: Ball,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub obedience_level: u8,
    pub ability_index: Pk9AbilityIndex,
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
            ability_index: AbilityIndexBounded::try_from(buf.ability_index_raw())?,
            ability_num: buf.ability_num()?,
        };
        Ok(data)
    }

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        match size {
            super::HOME_PA9_DATA_SIZE => Self::from_buffer(&PkhPa9Buffer::new(bytes)),
            _ => Err(Error::buffer_size(super::HOME_PA9_DATA_SIZE, size)),
        }
    }
}
