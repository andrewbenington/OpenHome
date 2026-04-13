use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::{Error, Result};

pub const LANGUAGE_MAX: u8 = Language::ChineseTraditional as u8;

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
    SpanishLatinAmerica,
}

impl Language {
    pub const fn as_str(&self) -> &'static str {
        match self {
            Language::None => "NONE",
            Language::Japanese => "JPN",
            Language::English => "ENG",
            Language::French => "FRA",
            Language::Italian => "ITA",
            Language::German => "DEU",
            Language::UNUSED => "--",
            Language::SpanishSpain => "ES-ES",
            Language::Korean => "KOR",
            Language::ChineseSimplified => "CHS",
            Language::ChineseTraditional => "CHT",
            Language::SpanishLatinAmerica => "ES-LA",
        }
    }

    pub const fn try_from_gcn(value: u8) -> Result<Self> {
        match value {
            0 => Ok(Language::None),
            1 => Ok(Language::Japanese),
            2 => Ok(Language::English),
            3 => Ok(Language::German),
            4 => Ok(Language::French),
            5 => Ok(Language::Italian),
            6 => Ok(Language::SpanishSpain),
            _ => Err(Error::LanguageIndex {
                language_index: value,
            }),
        }
    }
}

impl TryFrom<u8> for Language {
    type Error = Error;

    fn try_from(value: u8) -> Result<Self> {
        match value {
            0 => Ok(Language::None),
            1 => Ok(Language::Japanese),
            2 => Ok(Language::English),
            3 => Ok(Language::French),
            4 => Ok(Language::Italian),
            5 => Ok(Language::German),
            6 => Ok(Language::UNUSED),
            7 => Ok(Language::SpanishSpain),
            8 => Ok(Language::Korean),
            9 => Ok(Language::ChineseSimplified),
            10 => Ok(Language::ChineseTraditional),
            _ => Err(Error::LanguageIndex {
                language_index: value,
            }),
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct Languages;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl Languages {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "fromByteOrNone"))]
    pub fn from_u8_or_none(value: u8) -> Language {
        Language::try_from(value).unwrap_or(Language::None)
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "fromByteOrNoneGcn"))]
    pub fn from_u8_or_none_gcn(value: u8) -> Language {
        Language::try_from_gcn(value).unwrap_or(Language::None)
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "stringFromByte"))]
    pub fn string_from_byte(value: u8) -> String {
        Languages::from_u8_or_none(value).as_str().to_owned()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "stringFromByteGcn"))]
    pub fn string_from_byte_gcn(value: u8) -> String {
        Languages::from_u8_or_none_gcn(value).as_str().to_owned()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "toGcnByte"))]
    pub fn to_gcn_byte(value: u8) -> u8 {
        match Language::try_from(value).unwrap_or(Language::None) {
            Language::None => 0,
            Language::Japanese => 1,
            Language::English => 2,
            Language::German => 3,
            Language::French => 4,
            Language::Italian => 5,
            Language::SpanishSpain => 6,
            _ => 0,
        }
    }
}
