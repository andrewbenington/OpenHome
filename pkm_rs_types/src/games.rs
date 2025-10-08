use serde::Serialize;
use strum_macros::{Display, EnumString};
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Serialize, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Generation {
    G1,
    G2,
    G3,
    G4,
    G5,
    G6,
    G7,
    G8,
    G9,
    None,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, EnumString, Display, Serialize, Clone, Copy, PartialEq, Eq)]
pub enum Region {
    Kanto,
    Johto,
    Hoenn,
    Sinnoh,
    Unova,
    Kalos,
    Alola,
    Galar,
    Hisui,
    Paldea,

    Orre,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, PartialEq, Eq, Default, Clone, Copy)]
pub struct GameOfOriginIndex(u8);

impl GameOfOriginIndex {
    pub const fn to_byte(self) -> u8 {
        self.0
    }

    pub const fn to_usize(self) -> usize {
        self.0 as usize
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl GameOfOriginIndex {
    #[cfg(feature = "wasm")]
    #[wasm_bindgen(constructor)]
    pub fn new(val: u8) -> GameOfOriginIndex {
        GameOfOriginIndex(val)
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(getter)]
    pub fn index(self) -> u8 {
        self.0
    }
}

impl From<u8> for GameOfOriginIndex {
    fn from(value: u8) -> Self {
        Self(value)
    }
}

impl From<GameOfOriginIndex> for u8 {
    fn from(val: GameOfOriginIndex) -> Self {
        val.0
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy)]
pub struct GameOfOriginMetadata {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub name: &'static str,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub mark: Option<&'static str>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub region: Option<&'static str>,
    pub generation: Generation,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub logo: Option<&'static str>,
    pub index: usize,
    pub gamecube_index: Option<usize>,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl GameOfOriginMetadata {
    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        self.name.to_string()
    }

    #[wasm_bindgen(getter)]
    pub fn mark(&self) -> Option<String> {
        self.mark.map(String::from)
    }

    #[wasm_bindgen(getter)]
    pub fn region(&self) -> Option<String> {
        self.region.map(String::from)
    }

    #[wasm_bindgen(getter)]
    pub fn logo(&self) -> Option<String> {
        self.logo.map(String::from)
    }
}
