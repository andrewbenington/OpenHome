use crate::gen3::shadow::{Purification, ShadowIdColosseum, ShadowIdXd};
use crate::ohpkm::v2::OhpkmSectionTag;
use crate::result::{Error, Result};
use crate::sectioned_data::DataSection;

use pkm_rs_types::{read_i32_le, read_u32_le};

use serde::Serialize;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct OrreData {
    pub purification: Purification,
    pub shadow_exp: u32,
}

impl OrreData {
    // Because the shadow gauge was not tracked in v1, give any Pokémon marked as shadow the
    // initial gauge. Pokémon that
    pub fn from_v1(old: crate::ohpkm::v1::OhpkmV1) -> Option<Self> {
        if !old.is_shadow {
            return None;
        }

        if let Some(shadow_id) = ShadowIdColosseum::by_ndex(old.species_and_form.get_ndex()) {
            let species_initial_shadow_gauge = shadow_id.initial_shadow_gauge();

            Some(Self {
                purification: Purification::from_i32(species_initial_shadow_gauge).ok()?,
                shadow_exp: 0,
            })
        } else if let Some(shadow_id) = ShadowIdXd::by_ndex(old.species_and_form.get_ndex()) {
            let species_initial_shadow_gauge = shadow_id.initial_shadow_gauge();

            Some(Self {
                purification: Purification::from_i32(species_initial_shadow_gauge).ok()?,
                shadow_exp: 0,
            })
        } else {
            None
        }
    }
}

impl DataSection for OrreData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::GcnData;

    type ErrorType = Error;
    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        Ok(Self {
            purification: Purification::from_i32(read_i32_le!(bytes, 0))?,
            shadow_exp: read_u32_le!(bytes, 4),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 8];

        bytes[0..4].copy_from_slice(&self.purification.to_i32().to_le_bytes());
        bytes[4..8].copy_from_slice(&self.shadow_exp.to_le_bytes());

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        matches!(self.purification, Purification::Purified)
    }
}
