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
}

impl Language {
    pub fn as_str(&self) -> &'static str {
        match self {
            Language::None => "None",
            Language::Japanese => "Japanese",
            Language::English => "English",
            Language::French => "French",
            Language::Italian => "Italian",
            Language::German => "German",
            Language::UNUSED => "UNUSED",
            Language::SpanishSpain => "Spanish (Spain)",
            Language::Korean => "Korean",
            Language::ChineseSimplified => "Chinese (Simplified)",
            Language::ChineseTraditional => "Chinese (Traditional)",
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
    #[cfg(feature = "wasm")]
    #[wasm_bindgen(js_name = "fromByteOrNone")]
    pub fn from_u8_or_none(value: u8) -> Language {
        Language::try_from(value).unwrap_or(Language::None)
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(js_name = "stringFromByte")]
    pub fn string_from_byte(value: u8) -> String {
        Languages::from_u8_or_none(value).as_str().to_owned()
    }
}
