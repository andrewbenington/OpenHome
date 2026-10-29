use crate::items::category::ItemCategory;

/// Per-generation item storage rules.
///
/// Methods return `Option` where the C# original threw
/// `ArgumentOutOfRangeException` for a pouch type the generation doesn't have.
pub trait ItemAdapter {
    fn capacity(&self, ty: ItemCategory) -> Option<u16>;

    fn availability(&self, ty: ItemCategory, item_index: u16, item_count: u32) -> Availability;

    fn item_ids_ascending(&self, ty: ItemCategory) -> Option<&'static [u16]>;
}

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
