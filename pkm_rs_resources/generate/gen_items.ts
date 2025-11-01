import Database from 'better-sqlite3'
import camelcaseKeys from 'camelcase-keys'
import * as fs from 'fs'
import { itemGetAll } from './queries.ts'

function convertItem(index: number, name: string): string {
  return `ItemMetadata {
    id: ${index},
    name: "${name}",
}`
}

async function getAllItems() {
  const db = new Database('generate/pkm.db')

  const rows = camelcaseKeys(await itemGetAll(db))

  return rows
}

async function main() {
  const allItems = await getAllItems()

  let output = `use std::fmt::Debug;
use std::num::NonZeroU16;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use serde::{Serialize, Serializer};

use crate::{Error, Result};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct ItemIndex(NonZeroU16);

impl ItemIndex {
    pub fn new(index: u16) -> Option<ItemIndex> {
        if (index as usize) > ALL_ITEMS.len() {
            return None;
        }
        NonZeroU16::new(index).map(ItemIndex)
    }

    /// # Safety
    ///
    /// - \`index\` must be greater than zero and at most the maximum item index supported by this version of the library.
    pub const unsafe fn new_unchecked(index: u16) -> ItemIndex {
        unsafe { ItemIndex(NonZeroU16::new_unchecked(index)) }
    }

    pub const fn get(&self) -> u16 {
        self.0.get()
    }

    pub const fn get_metadata(&self) -> &ItemMetadata {
        ALL_ITEMS[(self.get() - 1) as usize]
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

impl TryFrom<u8> for ItemIndex {
    type Error = Error;

    fn try_from(value: u8) -> core::result::Result<Self, Self::Error> {
        if (value as usize) > ITEM_MAX {
            return Err(Error::ItemIndex {
                item_index: value as u16,
            });
        }

        NonZeroU16::new(value as u16)
            .map(ItemIndex)
            .ok_or(Error::ItemIndex {
                item_index: value as u16,
            })
    }
}

impl From<ItemIndex> for u8 {
    fn from(val: ItemIndex) -> Self {
        val.get() as u8
    }
}

impl TryFrom<u16> for ItemIndex {
    type Error = Error;

    fn try_from(value: u16) -> Result<Self> {
        if (value as usize) > ITEM_MAX {
            return Err(Error::ItemIndex {
                item_index: value,
            });
        }

        NonZeroU16::new(value)
            .map(ItemIndex)
            .ok_or(Error::ItemIndex {
                item_index: value,
            })
    }
}

impl From<ItemIndex> for u16 {
    fn from(val: ItemIndex) -> Self {
        val.get()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Clone, Copy)]
pub struct ItemMetadata {
    pub id: usize,
    #[wasm_bindgen(skip)]
    name: &'static str,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl ItemMetadata {
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn name(&self) -> String {
        self.name.to_owned()
    }
}

pub const ITEM_MAX: usize = 2600;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getAllItems"))]
#[allow(clippy::missing_const_for_fn)]
pub fn get_all_items() -> Vec<ItemMetadata> {
    ALL_ITEMS.into_iter().copied().collect()
}
`

  output +=
    `pub static ALL_ITEMS: [&ItemMetadata; ITEM_MAX] = [\n` +
    allItems.map(({ id, name }) => '&' + convertItem(id, name)).join(',\n') +
    '];'

  const filename = 'src/items.rs'
  fs.writeFileSync(filename, output)
  console.log(`Rust code written to ${filename}`)
}

main()
