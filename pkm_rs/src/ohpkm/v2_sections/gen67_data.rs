use super::bytes_are_empty;
use crate::ohpkm::v2::OhpkmSectionTag;
use crate::result::{Error, Result};
use crate::sectioned_data::DataSection;
use crate::util;

use pkm_rs_types::Geolocations;
use pkm_rs_types::Stats16Le;
use serde::Serialize;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct Gen67Data {
    pub training_bag_hits: u8,
    pub training_bag: u8,
    pub super_training_flags: u32,
    pub super_training_dist_flags: u8,
    pub secret_super_training_unlocked: bool,
    pub secret_super_training_complete: bool,
    pub country: u8,
    pub region: u8,
    pub geolocations: Geolocations,
    pub resort_event_status: u8,
    pub avs: Stats16Le,
}

impl Gen67Data {
    pub fn from_v1(old: crate::ohpkm::v1::OhpkmV1) -> Option<Self> {
        if !old.game_of_origin.is_3ds()
            && !old.game_of_origin.is_lets_go()
            && old.training_bag == 0
            && old.training_bag_hits == 0
            && old.super_training_flags == 0
            && old.super_training_dist_flags == 0
            && !old.secret_super_training_unlocked
            && !old.secret_super_training_complete
            && old.country == 0
            && old.region == 0
            && bytes_are_empty(&old.geolocations.to_bytes())
            && old.resort_event_status == 0
            && bytes_are_empty(&old.avs.to_bytes())
        {
            None
        } else {
            Some(Self {
                training_bag_hits: old.training_bag_hits,
                training_bag: old.training_bag,
                super_training_flags: old.super_training_flags,
                super_training_dist_flags: old.super_training_dist_flags,
                secret_super_training_unlocked: old.secret_super_training_unlocked,
                secret_super_training_complete: old.secret_super_training_complete,
                country: old.country,
                region: old.region,
                geolocations: old.geolocations,
                resort_event_status: old.resort_event_status,
                avs: old.avs,
            })
        }
    }
}

impl DataSection for Gen67Data {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::Gen67Data;

    type ErrorType = Error;
    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        Ok(Self {
            training_bag_hits: bytes[0],
            training_bag: bytes[1],
            super_training_flags: u32::from_le_bytes(bytes[2..6].try_into().unwrap()),
            super_training_dist_flags: bytes[6],
            secret_super_training_unlocked: util::get_flag(bytes, 7, 0),
            secret_super_training_complete: util::get_flag(bytes, 7, 1),
            country: bytes[8],
            region: bytes[9],
            geolocations: Geolocations::from_bytes(bytes[10..20].try_into().unwrap()),
            resort_event_status: bytes[20],
            avs: Stats16Le::from_bytes(bytes[21..33].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 33];

        bytes[0] = self.training_bag_hits;
        bytes[1] = self.training_bag;
        bytes[2..6].copy_from_slice(&self.super_training_flags.to_le_bytes());
        bytes[6] = self.super_training_dist_flags;
        util::set_flag(&mut bytes, 7, 0, self.secret_super_training_unlocked);
        util::set_flag(&mut bytes, 7, 1, self.secret_super_training_complete);
        bytes[8] = self.country;
        bytes[9] = self.region;
        bytes[10..20].copy_from_slice(&self.geolocations.to_bytes());
        bytes[20] = self.resort_event_status;
        bytes[21..33].copy_from_slice(&self.avs.to_bytes());

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        self.training_bag == 0
            && self.training_bag_hits == 0
            && self.super_training_flags == 0
            && self.super_training_dist_flags == 0
            && !self.secret_super_training_unlocked
            && !self.secret_super_training_complete
            && self.country == 0
            && self.region == 0
            && bytes_are_empty(&self.geolocations.to_bytes())
            && self.resort_event_status == 0
            && bytes_are_empty(&self.avs.to_bytes())
    }
}
