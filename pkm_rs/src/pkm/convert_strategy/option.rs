#[cfg(feature = "wasm")]
use serde::Serialize;
#[cfg(feature = "wasm")]
use tsify::Tsify;

#[cfg_attr(feature = "wasm", derive(Tsify, Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Debug, Clone)]
pub struct StringOption {
    // pub display: &'static str,
    pub default: &'static str,
    // pub description: &'static str,
    pub allowed_values: Option<&'static [&'static str]>,
}

#[cfg_attr(feature = "wasm", derive(Tsify, Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Debug, Clone)]
pub struct BoolOption {
    // pub display: &'static str,
    pub default: bool,
    // pub description: &'static str,
}

#[cfg_attr(feature = "wasm", derive(Tsify, Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Debug, Clone)]
pub struct NumberOption {
    // pub display: &'static str,
    pub default: f64,
    // pub description: &'static str,
    pub minimum: Option<f64>,
    pub maximum: Option<f64>,
}

#[cfg_attr(feature = "wasm", derive(Tsify, Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Debug, Clone)]
pub enum SettingType {
    String(StringOption),
    Bool(BoolOption),
    Number(NumberOption),
}
