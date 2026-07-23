use pkm_rs_resources::species::{NatDexIndex, SpeciesAndForm};
#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
use serde::Serialize;
use std::num::NonZeroU16;

use crate::result::{Error, PokemonIndexType};
#[cfg(test)]
use crate::tests::TestError;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const TOTAL_UNALIGNED_INDEXES: usize = 109;

#[allow(clippy::zero_prefixed_literal)]
const NATIONAL_TO_SV_INDEX_SHIFTS: [i8; TOTAL_UNALIGNED_INDEXES] = [
    0_001, 0_001, 0_001, 0_001, 0_033, 0_033, 0_033, 0_021, 0_021, 0_044, 0_044, 0_007, 0_007,
    0_007, 0_029, 0_031, 0_031, 0_031, 0_068, 0_068, 0_068, 0_002, 0_002, 0_017, 0_017, 0_030,
    0_030, 0_024, 0_024, 0_028, 0_028, 0_058, 0_058, 0_012, -0_13, -0_13, -0_31, -0_31, -0_29,
    -0_29, 0_043, 0_043, 0_043, -0_31, -0_31, -0_03, -0_30, -0_30, -0_23, -0_23, -0_14, -0_24,
    -0_03, -0_03, -0_47, -0_47, -0_12, -0_27, -0_27, -0_44, -0_46, -0_26, 0_031, 0_029, -0_53,
    -0_65, 0_025, -0_06, -0_03, -0_07, -0_04, -0_04, -0_08, -0_04, 0_001, -0_03, -0_03, -0_06,
    -0_04, -0_47, -0_47, -0_47, -0_23, -0_23, -0_05, -0_07, -0_09, -0_07, -0_20, -0_13, -0_09,
    -0_09, -0_29, -0_23, 0_001, 0_012, 0_012, 0_000, 0_000, 0_000, -0_06, 0_005, -0_06, -0_03,
    -0_03, -0_02, -0_04, -0_03, -0_03,
];

#[allow(clippy::zero_prefixed_literal)]
const SV_INDEX_TO_NATIONAL_SHIFTS: [i8; TOTAL_UNALIGNED_INDEXES] = [
    0_065, -0_01, -0_01, -0_01, -0_01, 0_031, 0_031, 0_047, 0_047, 0_029, 0_029, 0_053, 0_031,
    0_031, 0_046, 0_044, 0_030, 0_030, -0_07, -0_07, -0_07, 0_013, 0_013, -0_02, -0_02, 0_023,
    0_023, 0_024, -0_21, -0_21, 0_027, 0_027, 0_047, 0_047, 0_047, 0_026, 0_014, -0_33, -0_33,
    -0_33, -0_17, -0_17, 0_003, -0_29, 0_012, -0_12, -0_31, -0_31, -0_31, 0_003, 0_003, -0_24,
    -0_24, -0_44, -0_44, -0_30, -0_30, -0_28, -0_28, 0_023, 0_023, 0_006, 0_007, 0_029, 0_008,
    0_003, 0_004, 0_004, 0_020, 0_004, 0_023, 0_006, 0_003, 0_003, 0_004, -0_01, 0_013, 0_009,
    0_007, 0_005, 0_007, 0_009, 0_009, -0_43, -0_43, -0_43, -0_68, -0_68, -0_68, -0_58, -0_58,
    -0_25, -0_29, -0_31, 0_006, -0_01, 0_006, 0_000, 0_000, 0_000, 0_003, 0_003, 0_004, 0_002,
    0_003, 0_003, -0_05, -0_12, -0_12,
];

const FIRST_UNALIGNED_NATIONAL_SV: u16 = 917;
const TOTAL_INDEX_COUNT: u16 = FIRST_UNALIGNED_NATIONAL_SV + (TOTAL_UNALIGNED_INDEXES as u16);

const fn convert_index(key: u16, shifts: [i8; TOTAL_UNALIGNED_INDEXES]) -> Option<u16> {
    match key {
        0 => None,
        1..FIRST_UNALIGNED_NATIONAL_SV => Some(key),
        TOTAL_INDEX_COUNT.. => None,
        _ => {
            let shift_index = key - FIRST_UNALIGNED_NATIONAL_SV;
            let shift = shifts[shift_index as usize] as i32;
            Some(((key as i32) + shift) as u16)
        }
    }
}

pub const fn sv_to_national_dex(sv_index: u16) -> Option<u16> {
    convert_index(sv_index, SV_INDEX_TO_NATIONAL_SHIFTS)
}

pub const fn national_dex_to_sv(national_dex: u16) -> Option<u16> {
    convert_index(national_dex, NATIONAL_TO_SV_INDEX_SHIFTS)
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct SvPokemonIndex(NonZeroU16);

const INVALID_INDEX_MESSAGE: &str =
    "SvPokemonIndex should always be valid for conversion to NatDexIndex";

impl SvPokemonIndex {
    pub const fn new(sv_index: u16) -> Result<Self, InvalidSvPokemonIndex> {
        if let Some(non_zero) = NonZeroU16::new(sv_index)
            && sv_to_national_dex(sv_index).is_some()
        {
            Ok(Self(non_zero))
        } else {
            Err(InvalidSvPokemonIndex(sv_index))
        }
    }

    pub fn from_species_and_form(species_and_form: SpeciesAndForm) -> Result<Self, Error> {
        if let Some(sv_index) = national_dex_to_sv(species_and_form.get_ndex_js()) {
            NonZeroU16::new(sv_index)
                .map(Self)
                .ok_or(InvalidSvPokemonIndex(sv_index).into())
        } else {
            Err(Error::NationalDex {
                value: species_and_form.get_ndex_js(),
                source: PokemonIndexType::ScarletViolet,
            })
        }
    }

    pub fn to_national_dex(self) -> NatDexIndex {
        sv_to_national_dex(self.0.get())
            .map(NatDexIndex::new)
            .expect(INVALID_INDEX_MESSAGE)
            .expect(INVALID_INDEX_MESSAGE)
    }

    pub fn try_from_base(ndex: NatDexIndex) -> Result<Self, Error> {
        national_dex_to_sv(ndex.to_u16())
            .and_then(NonZeroU16::new)
            .ok_or(Error::NationalDex {
                value: ndex.to_u16(),
                source: PokemonIndexType::ScarletViolet,
            })
            .map(Self)
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.0.get().to_le_bytes()
    }
}

impl Default for SvPokemonIndex {
    fn default() -> Self {
        Self(unsafe { NonZeroU16::new_unchecked(1) })
    }
}

#[cfg(feature = "randomize")]
impl Randomize for SvPokemonIndex {
    fn randomized<R: rand::prelude::Rng>(rng: &mut R) -> Self {
        loop {
            if let Ok(index) = Self::from_species_and_form(SpeciesAndForm::randomized(rng)) {
                return index;
            }
        }
    }
}

impl From<SvPokemonIndex> for u16 {
    fn from(sv_index: SvPokemonIndex) -> Self {
        sv_index.0.get()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct InvalidSvPokemonIndex(u16);

impl From<InvalidSvPokemonIndex> for Error {
    fn from(error: InvalidSvPokemonIndex) -> Self {
        Error::PokemonGameIndex {
            value: error.0,
            source: PokemonIndexType::ScarletViolet,
        }
    }
}

#[cfg(test)]
impl From<InvalidSvPokemonIndex> for TestError {
    fn from(error: InvalidSvPokemonIndex) -> Self {
        TestError::from(Error::from(error))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sv_to_national_dex_decode_round_trip(sv_index: u16) {
        if let Some(national_dex) = sv_to_national_dex(sv_index) {
            assert_eq!(national_dex_to_sv(national_dex), Some(sv_index));
        }
    }

    fn decode_sv_to_national_dex_round_trip(national_dex: u16) {
        if let Some(sv_index) = national_dex_to_sv(national_dex) {
            assert_eq!(sv_to_national_dex(sv_index), Some(national_dex));
        }
    }

    #[test]
    fn test_sv_to_national_dex_decode_round_trip() {
        for value in 0..=u16::MAX {
            sv_to_national_dex_decode_round_trip(value);
        }
    }

    #[test]
    fn test_decode_sv_to_national_dex_round_trip() {
        for value in 1..=u16::MAX {
            decode_sv_to_national_dex_round_trip(value);
        }
    }
}
