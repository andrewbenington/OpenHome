use crate::convert_strategy::option::{BoolOption, SettingType, StringOption};
use crate::convert_strategy::personality_value::NatureStrategy;

mod converter;
mod personality_value;

mod option;

use std::fmt::Display;

use serde::{Deserialize, Serialize};
#[cfg(feature = "wasm")]
use std::collections::HashMap;
#[cfg(feature = "wasm")]
use tsify::Tsify;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub use converter::PkmConverter;
pub use personality_value::PidModificationStrategy;

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
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, specta::Type)]
pub enum ConvertOption {
    #[serde(rename = "nickname__capitalization")]
    NicknameCapitalization,
    #[serde(rename = "metData__originAndLocation")]
    MetDataOriginAndLocation,
    #[serde(rename = "ivs__maxIfHyperTrained")]
    MaxIvIfHyperTrained,
    #[serde(rename = "personalityValue__preserveShiny")]
    PreservePidShiny,
    #[serde(rename = "personalityValue__preserveGender")]
    PreservePidGender,
    #[serde(rename = "personalityValue__preserveNature")]
    PreservePidNature,
    #[serde(rename = "personalityValue__preserveUnownForm")]
    PreservePidUnownForm,
}

impl Display for ConvertOption {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            Self::NicknameCapitalization => "nickname__capitalization",
            Self::MetDataOriginAndLocation => "metData__originAndLocation",
            Self::MaxIvIfHyperTrained => "ivs__maxIfHyperTrained",
            Self::PreservePidShiny => "personalityValue__preserveShiny",
            Self::PreservePidGender => "personalityValue__preserveGender",
            Self::PreservePidNature => "personalityValue__preserveNature",
            Self::PreservePidUnownForm => "personalityValue__preserveUnownForm",
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
        (
            ConvertOption::PreservePidGender,
            Bool(BoolOption { default: true }),
        ),
        (
            ConvertOption::PreservePidNature,
            String(StringOption {
                default: "KeepMintNature",
                allowed_values: Some(&["KeepMintNature", "KeepOriginalNature"]),
            }),
        ),
        (
            ConvertOption::PreservePidShiny,
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

// ── ConvertStrategy ────────────────────────────────────────────────────────────

#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct ConvertStrategy {
    #[serde(rename = "nickname__capitalization")]
    pub nickname_capitalization: NicknameCapitalization,
    #[serde(rename = "metData__originAndLocation")]
    pub met_data_origin_location: MetDataStrategy,
    #[serde(rename = "ivs__maxIfHyperTrained")]
    pub max_iv_if_hyper_trained: bool,
    #[serde(rename = "personalityValue__preserveShiny")]
    pub preserve_pid_shiny: bool,
    #[serde(rename = "personalityValue__preserveGender")]
    pub preserve_pid_gender: bool,
    #[serde(rename = "personalityValue__preserveNature")]
    pub preserve_pid_nature: NatureStrategy,
    #[serde(rename = "personalityValue__preserveUnownForm")]
    pub preserve_pid_unown_form: bool,
}

impl Default for ConvertStrategy {
    fn default() -> Self {
        Self {
            nickname_capitalization: NicknameCapitalization::GameDefault,
            met_data_origin_location: MetDataStrategy::MaximizeLegality,
            max_iv_if_hyper_trained: true,
            preserve_pid_gender: true,
            preserve_pid_shiny: true,
            preserve_pid_nature: Default::default(),
            preserve_pid_unown_form: true,
        }
    }
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
            ConvertOption::MetDataOriginAndLocation => String::from("Met data"),
            ConvertOption::MaxIvIfHyperTrained => String::from("IVs"),
            ConvertOption::PreservePidShiny
            | ConvertOption::PreservePidGender
            | ConvertOption::PreservePidNature
            | ConvertOption::PreservePidUnownForm => String::from("Personality value"),
        }
    }

    #[wasm_bindgen(js_name = "getSettingName")]
    pub fn get_setting_name(identifier: ConvertOption) -> String {
        match identifier {
            ConvertOption::NicknameCapitalization => String::from("Capitalization"),
            ConvertOption::MetDataOriginAndLocation => String::from("Original Game + Met Location"),
            ConvertOption::MaxIvIfHyperTrained => {
                String::from("Hyper-Trained IVs are Maxed (pre-gen 7)")
            }
            ConvertOption::PreservePidShiny => {
                String::from("Alter PID to preserve shininess (gen 3-5)")
            }
            ConvertOption::PreservePidGender => {
                String::from("Alter PID to preserve gender (gen 3-5)")
            }
            ConvertOption::PreservePidNature => {
                String::from("Alter PID to preserve nature (gen 3-5)")
            }
            ConvertOption::PreservePidUnownForm => {
                String::from("Alter PID to preserve Unown form (gen 3-5)")
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
            ConvertOption::PreservePidShiny => String::from(
                "Decides how a personality value is altered to preserve shiny status."
            ),
            ConvertOption::PreservePidNature => String::from(
                "Decides how a personality value is altered to preserve a Pokémon's nature."
            ),
            ConvertOption::PreservePidGender => String::from(
                "Decides how a personality value is altered to preserve a Pokémon's gender."
            ),
            ConvertOption::PreservePidUnownForm => String::from(
                "Decides how a personality value is altered to preserve a Pokémon's form if the species is Unown."
            ),
        }
    }
}

// ── Enums ─────────────────────────────────────────────────────────────────────

#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Clone, Debug, PartialEq, Eq, Default, Serialize, Deserialize, specta::Type)]
pub enum NicknameCapitalization {
    #[default]
    GameDefault,
    Modern,
}

#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Clone, Debug, PartialEq, Eq, Default, Serialize, Deserialize, specta::Type)]
pub enum MetDataStrategy {
    UseLocationNameMatch,
    #[default]
    MaximizeLegality,
}
