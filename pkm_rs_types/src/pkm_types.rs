use serde::Serialize;
use strum_macros::{Display, EnumString};
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::Generation;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
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
