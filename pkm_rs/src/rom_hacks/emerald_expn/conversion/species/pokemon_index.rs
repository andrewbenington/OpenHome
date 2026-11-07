use crate::ohpkm::extra_form::ExtraFormIndex;
use crate::result::{Error, PokemonIndexType};

use super::indices::{EMERALD_EX_ALCREMIE_MAP, EMERALD_EX_EXTRA_FORM_MAP, EMERALD_EX_SPECIES_MAP};
use pkm_rs_types::NationalDex;
use serde::Serialize;
use std::num::NonZeroU16;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct EmeraldExpnPokemonIndex(NonZeroU16);

const INVALID_INDEX_MESSAGE: &str = "EmeraldExpnPokemonIndex should always be valid for conversion";

impl EmeraldExpnPokemonIndex {
    pub fn new(expn_index: u16) -> Result<Self, InvalidEmeraldExpnPokemonIndex> {
        if let Some(non_zero) = NonZeroU16::new(expn_index)
            && EMERALD_EX_SPECIES_MAP
                .get_by_left(&non_zero.get())
                .copied()
                .is_some()
        {
            Ok(Self(non_zero))
        } else {
            Err(InvalidEmeraldExpnPokemonIndex(expn_index))
        }
    }

    // TODO: clean up?
    pub fn from_ndex_form(
        national_dex: NationalDex,
        form: u16,
        form_argument: u32,
        extra_form: Option<ExtraFormIndex>,
    ) -> Result<Self, InvalidEmeraldExpnPokemonIndex> {
        if national_dex == NationalDex::Alcremie as u16 {
            let &index = EMERALD_EX_ALCREMIE_MAP
                .get_by_right(&(form, form_argument))
                .expect("");
            if let Some(non_zero) = NonZeroU16::new(index) {
                Ok(Self(non_zero))
            } else {
                Err(InvalidEmeraldExpnPokemonIndex(national_dex as u16))
            }
        } else if let Some(form) = extra_form
            && let Some(&index) = EMERALD_EX_EXTRA_FORM_MAP.get_by_right(&form)
        {
            if let Some(non_zero) = NonZeroU16::new(index) {
                Ok(Self(non_zero))
            } else {
                Err(InvalidEmeraldExpnPokemonIndex(national_dex as u16))
            }
        } else if let Some(&index) =
            EMERALD_EX_SPECIES_MAP.get_by_right(&(national_dex as u16, form))
        {
            if let Some(non_zero) = NonZeroU16::new(index) {
                Ok(Self(non_zero))
            } else {
                Err(InvalidEmeraldExpnPokemonIndex(national_dex as u16))
            }
        } else {
            Err(InvalidEmeraldExpnPokemonIndex(national_dex as u16))
        }
    }

    pub fn to_national_dex(self) -> NationalDex {
        let index = self.0.get();
        if EMERALD_EX_ALCREMIE_MAP.get_by_left(&index).is_some() {
            NationalDex::Alcremie
        } else if let Some(&data) = EMERALD_EX_EXTRA_FORM_MAP.get_by_left(&index) {
            data.national_dex()
        } else {
            NationalDex::new(
                EMERALD_EX_SPECIES_MAP
                    .get_by_left(&index)
                    .expect(INVALID_INDEX_MESSAGE)
                    .0,
            )
            .expect(INVALID_INDEX_MESSAGE)
        }
    }

    pub fn to_form_index(self) -> u16 {
        let index = self.0.get();
        if let Some(&data) = EMERALD_EX_ALCREMIE_MAP.get_by_left(&index) {
            data.0
        } else if EMERALD_EX_EXTRA_FORM_MAP.get_by_left(&index).is_some() {
            0 // Pokemon is an extra form
        } else {
            EMERALD_EX_SPECIES_MAP
                .get_by_left(&index)
                .expect(INVALID_INDEX_MESSAGE)
                .1
        }
    }

    pub fn to_extra_form_index(self) -> Option<ExtraFormIndex> {
        EMERALD_EX_EXTRA_FORM_MAP
            .get_by_left(&self.0.get())
            .copied()
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.0.get().to_le_bytes()
    }
}

impl Default for EmeraldExpnPokemonIndex {
    fn default() -> Self {
        Self(unsafe { NonZeroU16::new_unchecked(1) })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct InvalidEmeraldExpnPokemonIndex(u16);

impl From<InvalidEmeraldExpnPokemonIndex> for Error {
    fn from(error: InvalidEmeraldExpnPokemonIndex) -> Self {
        Error::NationalDex {
            value: error.0,
            converting_from: PokemonIndexType::Gen3Expn,
        }
    }
}

// TODO: tests
