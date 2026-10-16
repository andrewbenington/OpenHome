use super::PkhPk9Buffer;
use crate::gen9_sv::Pk9AbilityIndex;
use crate::gen9_sv::{TM_FLAG_BYTE_LENGTH_BASE, TM_FLAG_BYTE_LENGTH_DLC};
use crate::result::{Error, Result};

use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveIndex, MoveSlots};
use pkm_rs_types::{AbilityNumber, FlagSet, TeraType};
use serde::Serialize;

#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct HomePk9Data {
    pub scale: u8,
    pub moves: MoveSlots,
    pub relearn_moves: [MoveIndex; 4],
    pub tera_type_original: TeraType,
    pub tera_type_override: Option<TeraType>,
    pub ball: Ball,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub tm_flags_base_game: FlagSet<TM_FLAG_BYTE_LENGTH_BASE>,
    pub obedience_level: u8,
    pub ability_index: Pk9AbilityIndex,
    pub ability_num: AbilityNumber,
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
