mod availability;
mod category;
#[cfg(feature = "wasm")]
mod groups;
#[cfg(feature = "wasm")]
mod merge_dedup;
#[cfg(feature = "wasm")]
mod oh_items;
#[cfg(feature = "wasm")]
mod sv_items;
#[cfg(feature = "wasm")]
mod swsh_items;

#[cfg(feature = "wasm")]
pub use sv_items::SvItemStorage;

#[cfg(feature = "wasm")]
pub use swsh_items::{SwshItemPouch, SwshItemStorage};
#[cfg(feature = "wasm")]
#[derive(Debug, Clone, tsify::Tsify, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemDataTs {
    pub index: u16,
    pub count: u32,
    pub is_new: bool,
    pub is_obtained: bool,
    pub is_favorite: bool,
}

#[cfg(feature = "wasm")]
impl ItemDataTs {
    pub const fn new_unobtained(index: u16) -> Self {
        Self {
            index,
            count: 0,
            is_new: false,
            is_obtained: false,
            is_favorite: false,
        }
    }
}
