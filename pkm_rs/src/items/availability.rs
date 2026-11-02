use crate::items::groups::ORAS_KEY_ITEMS_UNOBTAINABLE;

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

impl Availability {
    pub fn openhome(item_index: u16) -> Self {
        if ORAS_KEY_ITEMS_UNOBTAINABLE
            .binary_search(&(item_index))
            .is_ok()
        {
            Self::Unsupported
        } else {
            Self::Obtainable
        }
    }
}
