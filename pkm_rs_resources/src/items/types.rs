use std::fmt::Debug;
use std::num::NonZeroU16;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use serde::{Serialize, Serializer};

use crate::items::modern;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct ItemIndex(NonZeroU16);

impl ItemIndex {
    pub fn new(index: u16) -> Option<ItemIndex> {
        if (index as usize) > modern::ALL_ITEMS.len() {
            return None;
        }
        NonZeroU16::new(index).map(ItemIndex)
    }

    /// # Safety
    ///
    /// - `index` must be greater than zero and at most the maximum item index supported by this version of the library.
    pub const unsafe fn new_unchecked(index: u16) -> ItemIndex {
        unsafe { ItemIndex(NonZeroU16::new_unchecked(index)) }
    }

    pub const fn get(&self) -> u16 {
        self.0.get()
    }

    pub const fn get_metadata(&self) -> &ItemMetadata {
        modern::ALL_ITEMS[(self.get() - 1) as usize]
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.get().to_le_bytes()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl ItemIndex {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = fromIndex))]
    pub fn from_index(val: u16) -> Option<ItemIndex> {
        ItemIndex::new(val)
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn index(&self) -> u16 {
        self.get()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn name(&self) -> String {
        self.get_metadata().name.to_owned()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen)]
    pub fn equals(&self, other: &ItemIndex) -> bool {
        self.0 == other.0
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = getMetadata))]
    pub fn get_metadata_js(&self) -> ItemMetadata {
        *self.get_metadata()
    }
}

impl Default for ItemIndex {
    fn default() -> Self {
        Self(unsafe { NonZeroU16::new_unchecked(1) })
    }
}

impl Serialize for ItemIndex {
    fn serialize<S>(&self, serializer: S) -> core::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.get_metadata().name)
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Clone, Copy)]
pub struct ItemMetadata {
    pub id: usize,
    #[wasm_bindgen(skip)]
    pub(crate) name: &'static str,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl ItemMetadata {
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn name(&self) -> String {
        self.name.to_owned()
    }
}
