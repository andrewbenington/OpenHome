use crate::gen3::shadow::{ColoShadowId, ShadowData, ShadowId, XdShadowId};
use crate::ohpkm::v2::OhpkmSectionTag;
use crate::result::{Error, Result};
use crate::sectioned_data::DataSection;

use pkm_rs_types::{NationalDex, read_i32_le, read_u32_le};

use serde::Serialize;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Serialize, Clone, Copy)]
pub struct OrreData(pub ShadowData);

impl OrreData {
    // Because the shadow gauge was not tracked in v1, give any Pokémon marked as shadow the
    // initial gauge. Pokémon that
    pub fn from_v1(old: crate::ohpkm::v1::OhpkmV1) -> Option<Self> {
        if !old.is_shadow {
            return None;
        }

        let national_dex = old.species_and_form.get_ndex();

        let shadow_id = if national_dex == NationalDex::Makuhita {
            makuhita_id(old.is_fateful_encounter)
        } else if let Some(shadow_id) = ColoShadowId::by_ndex(national_dex) {
            ShadowId::Colo(shadow_id)
        } else {
            let shadow_id = XdShadowId::by_ndex(national_dex)?;
            ShadowId::Xd(shadow_id)
        };

        Some(Self(ShadowData::full_shadow_gauge(shadow_id)))
    }
}

fn makuhita_id(fateful_encounter: bool) -> ShadowId {
    if fateful_encounter {
        ShadowId::makuhita_xd()
    } else {
        ShadowId::makuhita_colo()
    }
}

impl DataSection for OrreData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::GcnData;

    type ErrorType = Error;
    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        let id = ShadowId::from_bytes(bytes[0..1].try_into().unwrap())?;
        let purification = read_i32_le!(bytes, 2);
        let exp = read_u32_le!(bytes, 6);

        Ok(Self(ShadowData::try_new(id, purification, exp)?))
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 10];

        bytes[0..2].copy_from_slice(&self.0.id().to_raw_u16().to_le_bytes());
        bytes[2..6].copy_from_slice(&self.0.purification().to_i32().to_le_bytes());
        bytes[6..10].copy_from_slice(&self.0.exp().to_le_bytes());

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        false
    }
}
