use std::fmt::Debug;
use std::num::NonZeroU16;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::items::{Item, ItemMetadataPastGen, radical_red, unbound};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct ItemRadicalRed(NonZeroU16);

impl ItemRadicalRed {
    pub fn new(index: u16) -> Option<Self> {
        if (index as usize) > radical_red::ALL_ITEMS_RADICAL_RED.len() {
            return None;
        }
        NonZeroU16::new(index).map(Self)
    }

    /// # Safety
    ///
    /// - `index` must be greater than zero and at most the maximum item index supported by this version of the library.
    pub const unsafe fn new_unchecked(index: u16) -> Self {
        unsafe { Self(NonZeroU16::new_unchecked(index)) }
    }

    pub const fn get(&self) -> u16 {
        self.0.get()
    }

    pub const fn get_metadata(&self) -> &ItemMetadataPastGen {
        radical_red::ALL_ITEMS_RADICAL_RED[(self.get() - 1) as usize]
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.get().to_le_bytes()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl ItemRadicalRed {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = fromIndex))]
    pub fn from_index(val: u16) -> Option<Self> {
        Self::new(val)
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
    pub fn equals(&self, other: &Self) -> bool {
        self.0 == other.0
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = toModern))]
    pub fn to_modern(&self) -> Option<Item> {
        self.get_metadata().to_modern()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = fromModern))]
    pub fn from_modern_js(modern_index: u16) -> Option<Self> {
        Self::from_modern_index(modern_index)
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct ItemUnbound(NonZeroU16);

impl ItemUnbound {
    pub fn new(index: u16) -> Option<Self> {
        if (index as usize) > unbound::ALL_ITEMS_UNBOUND.len() {
            return None;
        }
        NonZeroU16::new(index).map(Self)
    }

    /// # Safety
    ///
    /// - `index` must be greater than zero and at most the maximum item index supported by this version of the library.
    pub const unsafe fn new_unchecked(index: u16) -> Self {
        unsafe { Self(NonZeroU16::new_unchecked(index)) }
    }

    pub const fn get(&self) -> u16 {
        self.0.get()
    }

    pub const fn get_metadata(&self) -> &ItemMetadataPastGen {
        unbound::ALL_ITEMS_UNBOUND[(self.get() - 1) as usize]
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.get().to_le_bytes()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl ItemUnbound {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = fromIndex))]
    pub fn from_index(val: u16) -> Option<Self> {
        Self::new(val)
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
    pub fn equals(&self, other: &Self) -> bool {
        self.0 == other.0
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = toModern))]
    pub fn to_modern(&self) -> Option<Item> {
        self.get_metadata().to_modern()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = fromModern))]
    pub fn from_modern_js(modern_index: u16) -> Option<Self> {
        Self::from_modern_index(modern_index)
    }
}
