use std::fmt::Debug;
use std::num::NonZeroU16;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use serde::{Serialize, Serializer};

use crate::items::{gen1, gen2, gen3, modern};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct Item(NonZeroU16);

impl Item {
    pub fn new(index: u16) -> Option<Item> {
        if (index as usize) > modern::ALL_ITEMS.len() {
            return None;
        }
        NonZeroU16::new(index).map(Item)
    }

    /// # Safety
    ///
    /// - `index` must be greater than zero and at most the maximum item index supported by this version of the library.
    pub const unsafe fn new_unchecked(index: u16) -> Item {
        unsafe { Item(NonZeroU16::new_unchecked(index)) }
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

    pub const fn is_mega_stone(self) -> bool {
        let index = self.get();

        (index >= (ItemIndex::Gengarite as u16) && index <= (ItemIndex::Latiosite as u16))
            || (index >= (ItemIndex::Swampertite as u16)
                && index <= (ItemIndex::Beedrillite as u16))
            || (index >= (ItemIndex::Clefablite as u16) && index <= (ItemIndex::Falinksite as u16))
            || (index >= (ItemIndex::RaichuniteX as u16)
                && index <= (ItemIndex::Glimmoranite as u16))
    }

    pub const fn is_z_crystal(self) -> bool {
        let index = self.get();

        (index >= (ItemIndex::NormaliumZ as u16) && index <= (ItemIndex::PikaniumZ as u16))
            || (index >= (ItemIndex::DecidiumZ as u16)
                && index <= (ItemIndex::PikashuniumZ2 as u16))
            || (index >= (ItemIndex::SolganiumZ as u16) && index <= (ItemIndex::KommoniumZ2 as u16))
    }

    pub const fn is_mail(self) -> bool {
        matches!(self.get(), 137..=148) // Greet Mail to Bridge Mail M
    }

    pub const fn is_berry(self) -> bool {
        matches!(self.get(), 149..=212 | 686..=688 | 861..=866 | 1754)
    }

    pub const fn is_tm(self) -> bool {
        matches!(self.get(), 328..=419 | 618..=620 | 690..=694 | 1230)
    }

    pub const fn is_tr(self) -> bool {
        matches!(self.get(), 1130..=1229)
    }

    pub const fn is_hm(self) -> bool {
        matches!(self.get(), 420..=427 | 737)
    }

    pub const fn is_gem(self) -> bool {
        matches!(self.get(), 548..=564 | 715)
    }

    pub const fn is_species_candy(self) -> bool {
        matches!(self.get(), 978..=1057)
    }

    pub const fn is_curry_ingredient(self) -> bool {
        matches!(self.get(), 1084..=1099 | 1256..=1264)
    }

    pub const fn is_mint(self) -> bool {
        matches!(self.get(), 1231..=1251)
    }

    pub const fn is_dynamax_crystal(self) -> bool {
        matches!(self.get(), 1279..=1578)
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl Item {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = fromIndex))]
    pub fn from_index(val: u16) -> Option<Item> {
        Item::new(val)
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
    pub fn equals(&self, other: &Item) -> bool {
        self.0 == other.0
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = getMetadata))]
    pub fn get_metadata_js(&self) -> ItemMetadata {
        *self.get_metadata()
    }
}

impl Default for Item {
    fn default() -> Self {
        Self(unsafe { NonZeroU16::new_unchecked(1) })
    }
}

impl Serialize for Item {
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

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Clone, Copy)]
pub struct ItemMetadataPastGen {
    pub id: usize,
    pub modern_id: Option<usize>,
    pub(crate) name: &'static str,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl ItemMetadataPastGen {
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn name(&self) -> String {
        self.name.to_owned()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = toModern))]
    pub fn to_modern(&self) -> Option<Item> {
        if let Some(modern_id) = self.modern_id {
            Item::new(modern_id as u16)
        } else {
            None
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
// There are no held items in gen 1, but this represents what they become
// when traded to gen 2
pub struct ItemGen1(NonZeroU16);

impl ItemGen1 {
    pub fn new(index: u16) -> Option<ItemGen1> {
        if (index as usize) > gen1::ALL_ITEMS_GEN1.len() {
            return None;
        }
        NonZeroU16::new(index).map(ItemGen1)
    }

    /// # Safety
    ///
    /// - `index` must be greater than zero and at most the maximum item index supported by this version of the library.
    pub const unsafe fn new_unchecked(index: u16) -> ItemGen1 {
        unsafe { ItemGen1(NonZeroU16::new_unchecked(index)) }
    }

    pub const fn get(&self) -> u16 {
        self.0.get()
    }

    pub const fn get_metadata(&self) -> &ItemMetadataPastGen {
        gen1::ALL_ITEMS_GEN1[(self.get() - 1) as usize]
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.get().to_le_bytes()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl ItemGen1 {
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
pub struct ItemGen2(NonZeroU16);

impl ItemGen2 {
    pub fn new(index: u16) -> Option<Self> {
        if (index as usize) > gen2::ALL_ITEMS_GEN2.len() {
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
        gen2::ALL_ITEMS_GEN2[(self.get() - 1) as usize]
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.get().to_le_bytes()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl ItemGen2 {
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
pub struct ItemGen3(NonZeroU16);

impl ItemGen3 {
    pub fn new(index: u16) -> Option<Self> {
        if (index as usize) > gen3::ALL_ITEMS_GEN3.len() {
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
        gen3::ALL_ITEMS_GEN3[(self.get() - 1) as usize]
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.get().to_le_bytes()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl ItemGen3 {
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
    pub fn equals(&self, other: &ItemGen3) -> bool {
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

impl Serialize for ItemGen3 {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.0.serialize(serializer)
    }
}

pub enum ItemIndex {
    SecretPotion = 464,
    SecretKey = 467,
    RedOrb = 534,
    BlueOrb = 535,
    EnigmaStone = 536,

    Xtransceiver = 621,
    RevealGlass = 638,

    Gengarite = 656,
    Latiosite = 685,

    MegaGlove = 717,

    Swampertite = 752,
    Beedrillite = 770,

    EonFlute = 775,

    NormaliumZ = 776,
    PikaniumZ = 794,
    DecidiumZ = 798,
    PikashuniumZ2 = 836,

    FairyMemory = 920,

    SolganiumZ = 921,
    UltranecroziumZ1 = 923,
    UltranecroziumZ2 = 929,
    KommoniumZ2 = 932,

    RotoCatch = 959,

    MagmarCandy = 1057,

    RustedSword = 1103,
    RustedShield = 1104,

    DynamaxCrystalAql7235 = 1578,
    MarkCharm = 1589,
    ReinsOfUnity3 = 1607,
    DsSounds = 1822,
    LegendPlate = 1828,

    YellowDish = 2400,
    GlimmeringCharm = 2481,
    BriarsBook = 2557,

    Clefablite = 2559,
    Falinksite = 2587,

    RaichuniteX = 2635,
    Glimmoranite = 2650,
}
