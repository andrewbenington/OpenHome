// #[cfg(feature = "wasm")]
// pub mod wasm;

mod converter;
mod location;
mod setting;

use std::fmt::Display;

use serde::{Deserialize, Serialize};
#[cfg(feature = "wasm")]
use std::collections::HashMap;
#[cfg(feature = "wasm")]
use tsify::Tsify;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::pkm::convert_strategy::setting::{BoolSetting, SettingType, StringSetting};

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
pub enum SettingIdentifier {
    #[serde(rename = "nickname.capitalization")]
    NicknameCapitalization,
    #[serde(rename = "metLocation.useRegion")]
    MetLocationUseRegion,
    #[serde(rename = "ivs.maxIfHyperTrained")]
    MaxIvIfHyperTrained,
}

impl Display for SettingIdentifier {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            Self::NicknameCapitalization => "nickname.capitalization",
            Self::MetLocationUseRegion => "metLocation.useRegion",
            Self::MaxIvIfHyperTrained => "ivs.maxIfHyperTrained",
        };
        write!(f, "{}", s)
    }
}

pub const fn settings_schema() -> &'static [(SettingIdentifier, SettingType)] {
    use SettingType::*;
    &[
        (
            SettingIdentifier::NicknameCapitalization,
            String(StringSetting {
                default: "gameDefault",
                allowed_values: Some(&["GameDefault", "Modern"]),
            }),
        ),
        (
            SettingIdentifier::MetLocationUseRegion,
            Bool(BoolSetting { default: true }),
        ),
        (
            SettingIdentifier::MaxIvIfHyperTrained,
            Bool(BoolSetting { default: true }),
        ),
    ]
}

#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", derive(Tsify, Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Debug, Clone)]
pub struct SettingsSchemaWrapper {
    settings_schema: HashMap<SettingIdentifier, SettingType>,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "getConvertSettingsSchema")]
pub fn settings_schema_js() -> SettingsSchemaWrapper {
    let settings: HashMap<SettingIdentifier, SettingType> = settings_schema()
        .iter()
        .map(|(k, v)| (*k, v.clone()))
        .collect();
    SettingsSchemaWrapper {
        settings_schema: settings,
    }
}

pub fn get_schema_entry(key: SettingIdentifier) -> Option<&'static SettingType> {
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
    #[serde(rename = "metLocation.useRegion")]
    pub met_location_use_region: bool,
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
    pub fn get_category_name(identifier: SettingIdentifier) -> String {
        match identifier {
            SettingIdentifier::NicknameCapitalization => String::from("Nickname"),
            SettingIdentifier::MetLocationUseRegion => String::from("Met Location"),
            SettingIdentifier::MaxIvIfHyperTrained => String::from("IVs"),
        }
    }

    #[wasm_bindgen(js_name = "getSettingName")]
    pub fn get_setting_name(identifier: SettingIdentifier) -> String {
        match identifier {
            SettingIdentifier::NicknameCapitalization => String::from("Capitalization"),
            SettingIdentifier::MetLocationUseRegion => {
                String::from("Use Region for Met Location (when possible)")
            }
            SettingIdentifier::MaxIvIfHyperTrained => {
                String::from("Hyper-Trained IVs are Maxed (pre-gen 7)")
            }
        }
    }

    #[wasm_bindgen(js_name = "getDescription")]
    pub fn get_description(identifier: SettingIdentifier) -> String {
        match identifier {
            SettingIdentifier::NicknameCapitalization => String::from(
                "Decides how unnicknamed Pokémon are capitalized. \
                    \"GameDefault\" uses the original game's capitalization, \
                    \"Modern\" capitalizes all in the modern style.",
            ),
            SettingIdentifier::MetLocationUseRegion => String::from(
                "If true, the met location will show the region name when possible. \
                    If false, it shows \"a faraway place\" or \"an in-game trade\".",
            ),
            SettingIdentifier::MaxIvIfHyperTrained => String::from(
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
