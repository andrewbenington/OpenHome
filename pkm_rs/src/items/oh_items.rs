use crate::items::availability::Availability;
use crate::items::category::OpenhomeItemCategory;

use num_enum::TryFromPrimitive;
use pkm_rs_resources::items::Item;
use pkm_rs_types::TryIntoTs;
use strum::IntoEnumIterator;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, Default)]
pub struct OpenhomeItemStorage;

impl OpenhomeItemStorage {
    pub const fn is_tm_material(index: u16) -> bool {
        matches!(index, 1956..=2099 | 2103..=2123 | 2126..=2137 | 2156..=2159 | 2438..=2478 | 2484..=2521)
    }

    pub fn category_for(item_index: u16) -> Option<OpenhomeItemCategory> {
        Item::from_index(item_index).map(OpenhomeItemCategory::for_item)
    }

    pub fn availability_of(item_index: u16) -> Availability {
        if Self::category_for(item_index).is_none() {
            Availability::Unsupported
        } else {
            Availability::Obtainable
        }
    }
}

#[cfg(feature = "wasm")]
use pkm_rs_types::{JsResult, TsResult};

#[cfg(feature = "wasm")]
use tsify::Ts;

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl OpenhomeItemStorage {
    #[wasm_bindgen(js_name = categoryIndexes)]
    pub fn category_indexes() -> Vec<u32> {
        OpenhomeItemCategory::iter().map(u32::from).collect()
    }

    #[wasm_bindgen(js_name = categoryName)]
    pub fn category_name(category_index: u32) -> Option<String> {
        Some(
            OpenhomeItemCategory::try_from_primitive(category_index)
                .ok()?
                .to_string(),
        )
    }

    #[wasm_bindgen(js_name = categoryForItem)]
    pub fn category_for_item(item_index: u16) -> JsResult<Option<Ts<OpenhomeItemCategory>>> {
        Self::category_for(item_index)
            .map(|pouch| pouch.try_into_ts())
            .transpose()
    }

    #[wasm_bindgen(js_name = categoryIndex)]
    pub fn openhome_category_from_index(category: Ts<OpenhomeItemCategory>) -> JsResult<u32> {
        Ok(u32::from(category.to_rust()?))
    }

    #[wasm_bindgen(js_name = categoryFromIndex)]
    pub fn openhome_category_index(category_index: u32) -> TsResult<OpenhomeItemCategory> {
        OpenhomeItemCategory::try_from_primitive(category_index)
            .unwrap_or_default()
            .try_into_ts()
    }

    #[wasm_bindgen(js_name = categoryIndexForItem)]
    pub fn openhome_category_index_for_item(item_index: u16) -> Option<u32> {
        Item::new(item_index)
            .map(OpenhomeItemCategory::for_item)
            .map(u32::from)
    }

    #[wasm_bindgen(js_name = categoryIconPath)]
    pub fn item_category_icon_path(category: Ts<OpenhomeItemCategory>) -> JsResult<String> {
        Ok(category.to_rust()?.icon_path().to_owned())
    }
}
