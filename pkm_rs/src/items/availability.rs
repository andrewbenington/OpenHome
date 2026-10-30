#[cfg_attr(
    feature = "wasm",
    derive(tsify::Tsify, serde::Serialize, serde::Deserialize)
)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Availability {
    Obtainable,
    TradeOnly,
    EventOnly,
    Unreleased,
    Unsupported,
}
