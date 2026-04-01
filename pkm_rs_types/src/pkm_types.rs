use serde::{Deserialize, Serialize};
use strum_macros::{Display, EnumString};
use tsify::Tsify;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::Generation;

#[cfg_attr(feature = "wasm", derive(Tsify, Deserialize))]
#[tsify(into_wasm_abi, from_wasm_abi)]
#[derive(Debug, Default, EnumString, Display, Serialize, PartialEq, Eq, Clone, Copy)]
#[repr(u8)]
pub enum PkmType {
    #[default]
    Normal,
    Fighting,
    Flying,
    Poison,
    Ground,
    Rock,
    Bug,
    Ghost,
    Steel,
    Fire,
    Water,
    Grass,
    Electric,
    Psychic,
    Ice,
    Dragon,
    Dark,
    Fairy,
}

impl PkmType {
    pub fn exists(&self, at: Generation) -> bool {
        match self {
            Self::Fairy => at >= Generation::G6,
            Self::Steel => at != Generation::G1,
            Self::Dark => at != Generation::G1,
            _ => true,
        }
    }

    pub fn if_exists_(&self, at: Generation) -> bool {
        match self {
            Self::Fairy => at >= Generation::G6,
            Self::Steel => at != Generation::G1,
            Self::Dark => at != Generation::G1,
            _ => true,
        }
    }

    pub const fn from_byte(byte: u8) -> Option<Self> {
        match byte {
            0 => Some(Self::Normal),
            1 => Some(Self::Fighting),
            2 => Some(Self::Flying),
            3 => Some(Self::Poison),
            4 => Some(Self::Ground),
            5 => Some(Self::Rock),
            6 => Some(Self::Bug),
            7 => Some(Self::Ghost),
            8 => Some(Self::Steel),
            9 => Some(Self::Fire),
            10 => Some(Self::Water),
            11 => Some(Self::Grass),
            12 => Some(Self::Electric),
            13 => Some(Self::Psychic),
            14 => Some(Self::Ice),
            15 => Some(Self::Dragon),
            16 => Some(Self::Dark),
            17 => Some(Self::Fairy),
            _ => None,
        }
    }

    pub const fn from_byte_gen12(byte: u8) -> Option<Self> {
        match byte {
            0 => Some(Self::Normal),
            1 => Some(Self::Fighting),
            2 => Some(Self::Flying),
            3 => Some(Self::Poison),
            4 => Some(Self::Ground),
            5 => Some(Self::Rock),
            // 6: Unused bird type
            7 => Some(Self::Bug),
            8 => Some(Self::Ghost),
            // 9-19: Dummy 'normal' types
            20 => Some(Self::Fire),
            21 => Some(Self::Water),
            22 => Some(Self::Grass),
            23 => Some(Self::Electric),
            24 => Some(Self::Psychic),
            25 => Some(Self::Ice),
            26 => Some(Self::Dragon),
            _ => None,
        }
    }
}

#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct PkmTypes;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
impl PkmTypes {
    #[wasm_bindgen(js_name = "tryFromString")]
    pub fn try_from_string(s: &str) -> Option<PkmType> {
        match s {
            "normal" => Some(PkmType::Normal),
            "fighting" => Some(PkmType::Fighting),
            "flying" => Some(PkmType::Flying),
            "poison" => Some(PkmType::Poison),
            "ground" => Some(PkmType::Ground),
            "rock" => Some(PkmType::Rock),
            "bug" => Some(PkmType::Bug),
            "ghost" => Some(PkmType::Ghost),
            "steel" => Some(PkmType::Steel),
            "fire" => Some(PkmType::Fire),
            "water" => Some(PkmType::Water),
            "grass" => Some(PkmType::Grass),
            "electric" => Some(PkmType::Electric),
            "psychic" => Some(PkmType::Psychic),
            "ice" => Some(PkmType::Ice),
            "dragon" => Some(PkmType::Dragon),
            "dark" => Some(PkmType::Dark),
            "fairy" => Some(PkmType::Fairy),
            _ => None,
        }
    }

    #[wasm_bindgen(js_name = "toString")]
    pub fn to_string(value: u8) -> String {
        let pkm_type = PkmType::from_byte(value).expect("Invalid type byte");
        match pkm_type {
            PkmType::Normal => "normal".into(),
            PkmType::Fighting => "fighting".into(),
            PkmType::Flying => "flying".into(),
            PkmType::Poison => "poison".into(),
            PkmType::Ground => "ground".into(),
            PkmType::Rock => "rock".into(),
            PkmType::Bug => "bug".into(),
            PkmType::Ghost => "ghost".into(),
            PkmType::Steel => "steel".into(),
            PkmType::Fire => "fire".into(),
            PkmType::Water => "water".into(),
            PkmType::Grass => "grass".into(),
            PkmType::Electric => "electric".into(),
            PkmType::Psychic => "psychic".into(),
            PkmType::Ice => "ice".into(),
            PkmType::Dragon => "dragon".into(),
            PkmType::Dark => "dark".into(),
            PkmType::Fairy => "fairy".into(),
        }
    }
}

const TERA_TYPE_NO_OVERRIDE: u8 = 0x13;
const TERA_TYPE_STELLAR: u8 = 0x63;

#[derive(Debug, Serialize, Clone, Copy, PartialEq, Eq)]
pub enum TeraType {
    Standard(PkmType),
    Stellar,
}

impl TeraType {
    pub fn from_byte(byte: u8) -> Option<Self> {
        match byte {
            TERA_TYPE_STELLAR => Some(Self::Stellar),
            TERA_TYPE_NO_OVERRIDE => None,
            _ => PkmType::from_byte(byte).map(Self::Standard),
        }
    }

    pub const fn to_byte(self) -> u8 {
        match self {
            TeraType::Standard(pkm_type) => pkm_type as u8,
            TeraType::Stellar => TERA_TYPE_STELLAR,
        }
    }
}

impl Default for TeraType {
    fn default() -> Self {
        Self::Standard(PkmType::default())
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[derive(Debug, Default, EnumString, Display, Serialize, PartialEq, Eq, Clone, Copy)]
#[repr(u8)]
pub enum TeraTypeWasm {
    #[default]
    Normal,
    Fighting,
    Flying,
    Poison,
    Ground,
    Rock,
    Bug,
    Ghost,
    Steel,
    Fire,
    Water,
    Grass,
    Electric,
    Psychic,
    Ice,
    Dragon,
    Dark,
    Fairy,
    Stellar,
}

#[cfg(feature = "wasm")]
#[allow(clippy::missing_const_for_fn)]
impl TeraTypeWasm {
    pub fn from_byte(byte: u8) -> Option<Self> {
        match byte {
            0 => Some(Self::Normal),
            1 => Some(Self::Fighting),
            2 => Some(Self::Flying),
            3 => Some(Self::Poison),
            4 => Some(Self::Ground),
            5 => Some(Self::Rock),
            6 => Some(Self::Bug),
            7 => Some(Self::Ghost),
            8 => Some(Self::Steel),
            9 => Some(Self::Fire),
            10 => Some(Self::Water),
            11 => Some(Self::Grass),
            12 => Some(Self::Electric),
            13 => Some(Self::Psychic),
            14 => Some(Self::Ice),
            15 => Some(Self::Dragon),
            16 => Some(Self::Dark),
            17 => Some(Self::Fairy),
            _ => None,
        }
    }
}

#[cfg(feature = "wasm")]
impl From<TeraType> for TeraTypeWasm {
    fn from(value: TeraType) -> Self {
        match value {
            TeraType::Stellar => Self::Stellar,
            TeraType::Standard(pkm_type) => Self::from_byte(pkm_type as u8)
                .expect("all valid u8 representations of TeraType are valid for TeraTypeWasm"),
        }
    }
}

#[cfg(feature = "wasm")]
impl From<TeraTypeWasm> for TeraType {
    fn from(value: TeraTypeWasm) -> Self {
        match value {
            TeraTypeWasm::Stellar => Self::Stellar,
            standard_type => Self::from_byte(standard_type as u8).expect(
                "all valid, non-Stellar u8 representations of TeraTypeWasm are valid for TeraType",
            ),
        }
    }
}
