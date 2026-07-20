use pkm_rs_resources::species::form_metadata::MetadataTable;
use pkm_rs_resources::species::form_metadata::gen9_sv::METADATA_TABLE_SV;
use pkm_rs_resources::species::{NatDexIndex, SpeciesAndForm};
#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
use serde::Serialize;
use std::num::NonZeroU16;

use crate::result::{Error, NdexConvertSource};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const fn sv_to_national_dex(key: u16) -> Option<u16> {
    match key {
        0 => None,
        1..=916 => Some(key),
        917 => Some(982),
        918 => Some(917),
        919 => Some(918),
        920 => Some(919),
        921 => Some(920),
        922 => Some(953),
        923 => Some(954),
        924 => Some(971),
        925 => Some(972),
        926 => Some(955),
        927 => Some(956),
        928 => Some(981),
        929 => Some(960),
        930 => Some(961),
        931 => Some(977),
        932 => Some(976),
        933 => Some(963),
        934 => Some(964),
        935 => Some(928),
        936 => Some(929),
        937 => Some(930),
        938 => Some(951),
        939 => Some(952),
        940 => Some(938),
        941 => Some(939),
        942 => Some(965),
        943 => Some(966),
        944 => Some(968),
        945 => Some(924),
        946 => Some(925),
        947 => Some(974),
        948 => Some(975),
        949 => Some(996),
        950 => Some(997),
        951 => Some(998),
        952 => Some(978),
        953 => Some(967),
        954 => Some(921),
        955 => Some(922),
        956 => Some(923),
        957 => Some(940),
        958 => Some(941),
        959 => Some(962),
        960 => Some(931),
        961 => Some(973),
        962 => Some(950),
        963 => Some(932),
        964 => Some(933),
        965 => Some(934),
        966 => Some(969),
        967 => Some(970),
        968 => Some(944),
        969 => Some(945),
        970 => Some(926),
        971 => Some(927),
        972 => Some(942),
        973 => Some(943),
        974 => Some(946),
        975 => Some(947),
        976 => Some(999),
        977 => Some(1000),
        978 => Some(984),
        979 => Some(986),
        980 => Some(1009),
        981 => Some(989),
        982 => Some(985),
        983 => Some(987),
        984 => Some(988),
        985 => Some(1005),
        986 => Some(990),
        987 => Some(1010),
        988 => Some(994),
        989 => Some(992),
        990 => Some(993),
        991 => Some(995),
        992 => Some(991),
        993 => Some(1006),
        994 => Some(1003),
        995 => Some(1002),
        996 => Some(1001),
        997 => Some(1004),
        998 => Some(1007),
        999 => Some(1008),
        1000 => Some(957),
        1001 => Some(958),
        1002 => Some(959),
        1003 => Some(935),
        1004 => Some(936),
        1005 => Some(937),
        1006 => Some(948),
        1007 => Some(949),
        1008 => Some(983),
        1009 => Some(980),
        1010 => Some(979),
        1011 => Some(1017),
        1012 => Some(1011),
        1013 => Some(1019),
        1017 => Some(1020),
        1018 => Some(1021),
        1019 => Some(1023),
        1020 => Some(1022),
        1021 => Some(1024),
        1022 => Some(1025),
        1023 => Some(1018),
        1024 => Some(1012),
        1025 => Some(1013),
        _ => None,
    }
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
        if let Some(sv_index) = METADATA_TABLE_SV.get_game_index(
            species_and_form.get_ndex().index(),
            species_and_form.get_forme_index(),
        ) {
            NonZeroU16::new(sv_index)
                .map(Self)
                .ok_or(InvalidSvPokemonIndex(sv_index).into())
        } else {
            Err(Error::NationalDex {
                value: species_and_form.get_ndex().index(),
                source: NdexConvertSource::ScarletViolet,
            })
        }
    }

    pub fn to_national_dex(self) -> NatDexIndex {
        sv_to_national_dex(self.0.get())
            .map(NatDexIndex::new)
            .expect(INVALID_INDEX_MESSAGE)
            .expect(INVALID_INDEX_MESSAGE)
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
        Error::NationalDex {
            value: error.0,
            source: NdexConvertSource::ScarletViolet,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn encode_decode_round_trip(value: u16) {
        if let Some(encoded) = sv_to_national_dex(value) {
            assert_eq!(METADATA_TABLE_SV.get_game_index(encoded, 0), Some(value));
        }
    }

    fn decode_encode_round_trip(value: u16) {
        if let Some(decoded) = METADATA_TABLE_SV.get_game_index(value, 0) {
            assert_eq!(sv_to_national_dex(decoded), Some(value));
        }
    }

    #[test]
    fn test_encode_decode_round_trip() {
        for value in 0..=u16::MAX {
            encode_decode_round_trip(value);
        }
    }

    #[test]
    fn test_decode_encode_round_trip() {
        for value in 0..=u16::MAX {
            decode_encode_round_trip(value);
        }
    }
}
