// mod cfru;
// pub mod rr;
// pub mod ub;

use std::str::FromStr;

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    Hash,
    serde::Serialize,
    serde::Deserialize,
    specta::Type,
    strum::EnumString,
)]
#[serde(rename_all = "snake_case")]
#[strum(serialize_all = "snake_case")]
pub enum PluginIdentifier {
    RadicalRed,
    Unbound,
    LuminescentPlatinum,
    Compass,
}

impl PluginIdentifier {
    pub fn is_plugin_id_string(v: &str) -> bool {
        Self::from_str(v).is_ok()
    }
}

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct PluginIdentifiers;

#[cfg(feature = "wasm")]
#[allow(clippy::missing_const_for_fn)]
#[wasm_bindgen]
impl PluginIdentifiers {
    #[wasm_bindgen(js_name = isPluginIdString)]
    pub fn is_plugin_id_string(v: &str) -> bool {
        PluginIdentifier::is_plugin_id_string(v)
    }
}
