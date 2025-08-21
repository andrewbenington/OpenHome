use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Language {
    #[default]
    None,
    Japanese,
    English,
    French,
    Italian,
    German,
    UNUSED,
    SpanishSpain,
    Korean,
    ChineseSimplified,
    ChineseTraditional,
}

impl From<u8> for Language {
    fn from(value: u8) -> Self {
        match value {
            0 => Language::None,
            1 => Language::Japanese,
            2 => Language::English,
            3 => Language::French,
            4 => Language::Italian,
            5 => Language::German,
            6 => Language::UNUSED,
            7 => Language::SpanishSpain,
            8 => Language::Korean,
            9 => Language::ChineseSimplified,
            10 => Language::ChineseTraditional,
            _ => panic!("Invalid value for Ball: {}", value),
        }
    }
}
