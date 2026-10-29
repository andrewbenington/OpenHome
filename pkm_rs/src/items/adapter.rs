use crate::items::category::OpenhomeItemCategory;

pub trait ItemAdapter {
    fn capacity(&self, ty: OpenhomeItemCategory) -> Option<u16>;

    fn availability(
        &self,
        ty: OpenhomeItemCategory,
        item_index: u16,
        item_count: u32,
    ) -> Availability;
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
