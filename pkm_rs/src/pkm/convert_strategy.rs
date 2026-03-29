// #[cfg(feature = "wasm")]
// pub mod wasm;

mod converter;
mod option;

use std::fmt::Display;

use serde::{Deserialize, Serialize};
#[cfg(feature = "wasm")]
use std::collections::HashMap;
#[cfg(feature = "wasm")]
use tsify::Tsify;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::pkm::convert_strategy::option::{BoolOption, SettingType, StringOption};

#[cfg_attr(feature = "wasm", derive(Tsify, Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Debug, Clone, PartialEq)]
pub enum SettingValue {
    String(String),
    Bool(bool),
    Number(f64),
}

impl SettingType {
    pub fn default_value(&self) -> SettingValue {
        match self {
            Self::String(d) => SettingValue::String(d.default.to_string()),
            Self::Bool(d) => SettingValue::Bool(d.default),
            Self::Number(d) => SettingValue::Number(d.default),
        }
    }
}

// ── Schema ─────────────────────────────────────────────────────────────────────

// Subcategory keys are just &'static str at runtime; the "category.key"
// convention is enforced by construction rather than the type system.
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ConvertOption {
    #[serde(rename = "nickname.capitalization")]
    NicknameCapitalization,
    #[serde(rename = "metData.originAndLocation")]
    MetDataOriginAndLocation,
    #[serde(rename = "ivs.maxIfHyperTrained")]
    MaxIvIfHyperTrained,
}

impl Display for ConvertOption {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            Self::NicknameCapitalization => "nickname.capitalization",
            Self::MetDataOriginAndLocation => "metData.originAndLocation",
            Self::MaxIvIfHyperTrained => "ivs.maxIfHyperTrained",
        };
        write!(f, "{}", s)
    }
}

pub const fn settings_schema() -> &'static [(ConvertOption, SettingType)] {
    use SettingType::*;
    &[
        (
            ConvertOption::NicknameCapitalization,
            String(StringOption {
                default: "GameDefault",
                allowed_values: Some(&["GameDefault", "Modern"]),
            }),
        ),
        (
            ConvertOption::MetDataOriginAndLocation,
            String(StringOption {
                default: "UseLocationNameMatch",
                allowed_values: Some(&["UseLocationNameMatch", "MaximizeLegality"]),
            }),
        ),
        (
            ConvertOption::MaxIvIfHyperTrained,
            Bool(BoolOption { default: true }),
        ),
    ]
}

#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", derive(Tsify, Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Debug, Clone)]
pub struct SettingsSchemaWrapper {
    settings_schema: HashMap<ConvertOption, SettingType>,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "getConvertSettingsSchema")]
pub fn settings_schema_js() -> SettingsSchemaWrapper {
    let settings: HashMap<ConvertOption, SettingType> = settings_schema()
        .iter()
        .map(|(k, v)| (*k, v.clone()))
        .collect();
    SettingsSchemaWrapper {
        settings_schema: settings,
    }
}

pub fn get_schema_entry(key: ConvertOption) -> Option<&'static SettingType> {
    settings_schema()
        .iter()
        .find(|(k, _)| *k == key)
        .map(|(_, d)| d)
}

// ── Category helpers ───────────────────────────────────────────────────────────

pub fn display_settings_category(category: &str) -> &str {
    match category {
        "nickname" => "Nicknames",
        "metLocation" => "Met Location",
        other => other,
    }
}

pub fn get_settings_category(subcategory: &str) -> &str {
    subcategory.split('.').next().unwrap_or(subcategory)
}

// ── ConvertStrategy ────────────────────────────────────────────────────────────

#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct ConvertStrategy {
    #[serde(rename = "nickname.capitalization")]
    pub nickname_capitalization: NicknameCapitalization,
    #[serde(rename = "metData.originAndLocation")]
    pub met_data_origin_location: MetDataStrategy,
    #[serde(rename = "ivs.maxIfHyperTrained")]
    pub max_iv_if_hyper_trained: bool,
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getDefaultConvertStrategy"))]
pub fn default_convert_strategy() -> ConvertStrategy {
    ConvertStrategy::default()
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct ConvertStrategies;

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl ConvertStrategies {
    #[wasm_bindgen(js_name = "getDefault")]
    pub fn default_strategy() -> ConvertStrategy {
        default_convert_strategy()
    }

    #[wasm_bindgen(js_name = "getCategoryName")]
    pub fn get_category_name(identifier: ConvertOption) -> String {
        match identifier {
            ConvertOption::NicknameCapitalization => String::from("Nickname"),
            ConvertOption::MetDataOriginAndLocation => String::from("Met Location"),
            ConvertOption::MaxIvIfHyperTrained => String::from("IVs"),
        }
    }

    #[wasm_bindgen(js_name = "getSettingName")]
    pub fn get_setting_name(identifier: ConvertOption) -> String {
        match identifier {
            ConvertOption::NicknameCapitalization => String::from("Capitalization"),
            ConvertOption::MetDataOriginAndLocation => {
                String::from("Use Region for Met Location (when possible)")
            }
            ConvertOption::MaxIvIfHyperTrained => {
                String::from("Hyper-Trained IVs are Maxed (pre-gen 7)")
            }
        }
    }

    #[wasm_bindgen(js_name = "getDescription")]
    pub fn get_description(identifier: ConvertOption) -> String {
        match identifier {
            ConvertOption::NicknameCapitalization => String::from(
                "Decides how unnicknamed Pokémon are capitalized.
                    \"GameDefault\" uses the original game's capitalization,
                    \"Modern\" capitalizes all in the modern style.",
            ),
            ConvertOption::MetDataOriginAndLocation => String::from(
                "Decides how the origin game and met location are converted.
                \"UseLocationNameMatch\" attempts to match the location from the origin game with one of a similar location (or lore equivalent) in the target game.
                    \"MaximizeLegality\" attempts to convert the Pokémon to one that would be legal in the target game, if possible.\n\
                    For example, a Pokémon caught in Victory Road in Alpha Sapphire being moved to Black would have its met location set to the Poké Transfer Lab if \"MaximizeLegality\" is chosen, but would be set to Victory Road if \"UseLocationNameMatch\" is chosen. In both cases the origin game would be set to Sapphire, because the Alpha Sapphire origin is not compatible with Black.",
            ),
            ConvertOption::MaxIvIfHyperTrained => String::from(
                "If true, any hyper-trained IVs will be set to 31 when transferred to a game without hyper training.",
            ),
        }
    }
}

// ── Enums ─────────────────────────────────────────────────────────────────────

#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Clone, Debug, PartialEq, Eq, Default, Serialize, Deserialize)]
pub enum NicknameCapitalization {
    #[default]
    GameDefault,
    Modern,
}

#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Clone, Debug, PartialEq, Eq, Default, Serialize, Deserialize)]
pub enum MetDataStrategy {
    #[default]
    UseLocationNameMatch,
    MaximizeLegality,
}
