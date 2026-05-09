use crate::ohpkm::v2::OhpkmSectionTag;
use crate::result::{Error, Result};
use crate::sectioned_data::DataSection;
use crate::util;

use pkm_rs_types::ShinyLeaves;

use serde::Serialize;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct Gen45Data {
    pub encounter_type: u8,
    pub performance: u8,
    pub shiny_leaves: ShinyLeaves,
    pub poke_star_fame: u8,
    pub is_ns_pokemon: bool,
}

impl Gen45Data {
    pub fn from_v1(old: crate::ohpkm::v1::OhpkmV1) -> Option<Self> {
        if !old.game_of_origin.is_ds()
            && old.encounter_type == 0
            && old.performance == 0
            && old.shiny_leaves.is_empty()
            && old.poke_star_fame == 0
            && !old.is_ns_pokemon
        {
            None
        } else {
            Some(Self {
                encounter_type: old.encounter_type,
                performance: old.performance,
                shiny_leaves: old.shiny_leaves,
                poke_star_fame: old.poke_star_fame,
                is_ns_pokemon: old.is_ns_pokemon,
            })
        }
    }
}

impl DataSection for Gen45Data {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::Gen45Data;

    type ErrorType = Error;
    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        Ok(Self {
            encounter_type: bytes[0],
            performance: bytes[1],
            shiny_leaves: ShinyLeaves::from_byte(bytes[2]),
            poke_star_fame: bytes[3],
            is_ns_pokemon: util::get_flag(bytes, 4, 0),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 33];

        bytes[0] = self.encounter_type;
        bytes[1] = self.performance;
        bytes[2] = self.shiny_leaves.to_byte();
        bytes[3] = self.poke_star_fame;
        util::set_flag(&mut bytes, 4, 0, self.is_ns_pokemon);

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        self.encounter_type == 0
            && self.performance == 0
            && self.shiny_leaves.is_empty()
            && self.poke_star_fame == 0
            && !self.is_ns_pokemon
    }
}
