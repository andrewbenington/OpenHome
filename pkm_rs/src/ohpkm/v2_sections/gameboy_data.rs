use pkm_rs_resources::species::NatDexIndex;
use pkm_rs_types::StatsPreSplit;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::{
    ohpkm::{v2::OhpkmSectionTag, v2_sections::MainDataV2},
    result::{Error, Result},
    sectioned_data::DataSection,
    traits::IsShiny,
};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct GameboyData {
    pub dvs: StatsPreSplit,
    pub met_time_of_day: u8,
    pub evs_g12: StatsPreSplit,
}

const UNOWN: NatDexIndex = unsafe { NatDexIndex::new_unchecked(201) };

impl GameboyData {
    pub fn from_v1(old: crate::ohpkm::v1::OhpkmV1) -> Option<Self> {
        if !old.game_of_origin.is_gameboy() && old.met_time_of_day == 0 && old.evs_g12.is_empty() {
            None
        } else {
            Some(Self {
                dvs: old.dvs,
                met_time_of_day: old.met_time_of_day,
                evs_g12: old.evs_g12,
            })
        }
    }

    pub fn from_main_data(main_data: &MainDataV2) -> Self {
        if main_data.species_and_form.get_ndex() == UNOWN {
            let letter_index = main_data.species_and_form.get_forme_index();

            Self {
                dvs: StatsPreSplit::dvs_from_ivs_lossy(&main_data.ivs)
                    .force_dvs_for_unown_letter(letter_index),
                ..Default::default()
            }
        } else {
            Self {
                dvs: if main_data.is_shiny() {
                    StatsPreSplit::shiny_dvs_from_ivs(&main_data.ivs)
                } else {
                    StatsPreSplit::dvs_from_ivs_lossy(&main_data.ivs)
                },
                ..Default::default()
            }
        }
    }
}

impl DataSection for GameboyData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::GameboyData;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        // try_into() will always succeed thanks to the buffer size check
        Ok(Self {
            dvs: StatsPreSplit::from_dv_bytes(bytes[0..2].try_into().unwrap()),
            met_time_of_day: bytes[2],
            evs_g12: StatsPreSplit::from_bytes_u16_le(bytes[3..13].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 13];

        bytes[0..2].copy_from_slice(&self.dvs.to_dv_bytes());
        bytes[2] = self.met_time_of_day;
        bytes[3..13].copy_from_slice(&self.evs_g12.to_bytes());

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        self.met_time_of_day == 0 && self.evs_g12.is_empty()
    }
}
