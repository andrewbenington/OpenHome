mod availability;
mod category;
#[cfg(feature = "wasm")]
mod oh_items;
#[cfg(feature = "wasm")]
mod sv_items;

#[cfg(feature = "wasm")]
pub use sv_items::SvItemStorage;

#[cfg(feature = "wasm")]
#[derive(Debug, Clone, tsify::Tsify, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemDataTs {
    pub index: u16,
    pub pouch: u32,
    pub count: u32,
    pub is_new: bool,
    pub is_obtained: bool,
    pub is_favorite: bool,
}
