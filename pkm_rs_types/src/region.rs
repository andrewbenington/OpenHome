use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum GcnRegion {
    #[default]
    None = 0,
    NtscJapan = 1,
    NtscUsa = 2,
    Pal = 3,
}

impl GcnRegion {
    pub const fn from_byte(v: u8) -> Self {
        match v {
            0 => Self::None,
            1 => Self::NtscJapan,
            2 => Self::NtscUsa,
            3 => Self::Pal,
            _ => Self::None,
        }
    }
}
