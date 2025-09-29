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
}

pub enum TeraType {
    Standard(PkmType),
    Stellar,
}
