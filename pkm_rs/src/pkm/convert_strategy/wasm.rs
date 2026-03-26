#[cfg(feature = "wasm")]
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tsify::Tsify;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
#[derive(Debug, Clone)]
pub struct StringDescriptorWasm {
    pub display: String,
    pub default: String,
    pub description: String,
    pub allowed_values: Option<Vec<String>>,
}

#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
#[derive(Debug, Clone)]
pub struct BoolDescriptorWasm {
    pub display: String,
    pub default: bool,
    pub description: String,
}

#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
#[derive(Debug, Clone)]
pub struct NumberDescriptorWasm {
    pub display: String,
    pub default: f64,
    pub description: String,
    pub minimum: Option<f64>,
    pub maximum: Option<f64>,
}

#[cfg(feature = "wasm")]
#[derive(Debug, Clone, Tsify, Serialize, Deserialize)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub enum SettingDescriptorWasm {
    String(StringDescriptorWasm),
    Bool(BoolDescriptorWasm),
    Number(NumberDescriptorWasm),
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn settings_schema_js() -> HashMap<String, SettingDescriptorWasm> {
    super::settings_schema()
        .iter()
        .map(|(k, v)| (k.to_string(), v.clone()))
        .collect()
}
