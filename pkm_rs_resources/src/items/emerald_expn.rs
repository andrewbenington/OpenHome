use wasm_bindgen::prelude::wasm_bindgen;
use crate::items::ItemMetadataPastGen;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
#[cfg(feature = "randomize")]
use rand::RngExt;


pub const ITEM_MAX_GEN3_EMERALD_EXPN: usize = 874;

#[allow(clippy::missing_const_for_fn)]
#[wasm_bindgen(js_name = "getAllItemsGen3EmeraldExpn")]
#[cfg(feature = "wasm")]
pub fn get_all_items() -> Vec<ItemMetadataPastGen> {
    ALL_ITEMS_GEN3_EMERALD_EXPN.into_iter().copied().collect()
}

pub static ALL_ITEMS_GEN3_EMERALD_EXPN: [&ItemMetadataPastGen; ITEM_MAX_GEN3_EMERALD_EXPN] = [];