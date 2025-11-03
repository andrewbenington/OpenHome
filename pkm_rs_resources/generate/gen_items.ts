import Database from 'better-sqlite3'
import * as fs from 'fs'
import {
  itemGen1GetAll,
  type ItemGen1GetAllRow,
  itemGen2GetAll,
  type ItemGen2GetAllRow,
  itemGen3GetAll,
  type ItemGen3GetAllRow,
  itemGetAll,
} from './queries.ts'

function optionalToRust<T, S>(value: T | null | undefined, tranformer?: (T) => S): string {
  if (value !== undefined && value !== null) {
    return `Some(${tranformer ? tranformer(value) : value})`
  } else {
    return 'None'
  }
}

function convertItem(index: number, name: string): string {
  return `ItemMetadata {
    id: ${index},
    name: "${name}",
}`
}

async function generateModern() {
  const allItems = await itemGetAll(new Database('generate/pkm.db'))

  let output = `use crate::items::ItemMetadata;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

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

  const filename = 'src/items/modern.rs'
  fs.writeFileSync(filename, output)
  console.log(`Rust code written to ${filename}`)
}

function convertItemPastGen(
  row: ItemGen1GetAllRow | ItemGen2GetAllRow | ItemGen3GetAllRow
): string {
  return `&ItemMetadataPastGen {
    id: ${row.id},
    modern_id: ${optionalToRust(row.modernId)},
    name: "${row.name}",
}`
}

async function generateGen1() {
  const allItems = await itemGen1GetAll(new Database('generate/pkm.db'))

  let output = `use crate::items::{ItemGen1, ItemMetadataPastGen};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub const ITEM_MAX_GEN1: usize = ${allItems.length};

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getAllItemsGen1"))]
#[allow(clippy::missing_const_for_fn)]
pub fn get_all_items_gen1() -> Vec<ItemMetadataPastGen> {
    ALL_ITEMS_GEN1.into_iter().copied().collect()
}

impl ItemGen1 {
    pub fn from_modern_index(modern_index: u16) -> Option<Self> {
        match modern_index {`

  const alreadyProcessed: Set<number> = new Set()
  for (const item of allItems.toSorted((a, b) => a.modernId - b.modernId)) {
    if (item.modernId && !alreadyProcessed.has(item.modernId)) {
      output += `
            ${item.modernId} => Self::new(${item.id}),`
      alreadyProcessed.add(item.modernId)
    }
  }
  output += ` _ => None,
         }
    }
}

`

  output +=
    `pub static ALL_ITEMS_GEN1: [&ItemMetadataPastGen; ITEM_MAX_GEN1] = [\n` +
    allItems.map(convertItemPastGen).join(',\n') +
    '];'

  const filename = 'src/items/gen1.rs'
  fs.writeFileSync(filename, output)
  console.log(`Rust code written to ${filename}`)
}

async function generateGen2() {
  const allItems = await itemGen2GetAll(new Database('generate/pkm.db'))

  let output = `use crate::items::{ItemGen2, ItemMetadataPastGen};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub const ITEM_MAX_GEN2: usize = ${allItems.length};

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getAllItemsGen2"))]
#[allow(clippy::missing_const_for_fn)]
pub fn get_all_items_gen2() -> Vec<ItemMetadataPastGen> {
    ALL_ITEMS_GEN2.into_iter().copied().collect()
}

impl ItemGen2 {
    pub fn from_modern_index(modern_index: u16) -> Option<Self> {
        match modern_index {`

  const alreadyProcessed: Set<number> = new Set()
  for (const item of allItems.toSorted((a, b) => a.modernId - b.modernId)) {
    if (item.modernId && !alreadyProcessed.has(item.modernId)) {
      output += `
            ${item.modernId} => Self::new(${item.id}),`
      alreadyProcessed.add(item.modernId)
    }
  }
  output += ` _ => None,
         }
    }
}

`

  output +=
    `pub static ALL_ITEMS_GEN2: [&ItemMetadataPastGen; ITEM_MAX_GEN2] = [\n` +
    allItems.map(convertItemPastGen).join(',\n') +
    '];'

  const filename = 'src/items/gen2.rs'
  fs.writeFileSync(filename, output)
  console.log(`Rust code written to ${filename}`)
}

async function generateGen3() {
  const allItems = await itemGen3GetAll(new Database('generate/pkm.db'))

  let output = `use crate::items::{ItemGen3, ItemMetadataPastGen};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub const ITEM_MAX_GEN3: usize = ${allItems.length};

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getAllItemsGen3"))]
#[allow(clippy::missing_const_for_fn)]
pub fn get_all_items_gen3() -> Vec<ItemMetadataPastGen> {
    ALL_ITEMS_GEN3.into_iter().copied().collect()
}

impl ItemGen3 {
    pub fn from_modern_index(modern_index: u16) -> Option<Self> {
        match modern_index {`

  const alreadyProcessed: Set<number> = new Set()
  for (const item of allItems.toSorted((a, b) => a.modernId - b.modernId)) {
    if (item.modernId && !alreadyProcessed.has(item.modernId)) {
      output += `
            ${item.modernId} => Self::new(${item.id}),`
      alreadyProcessed.add(item.modernId)
    }
  }
  output += ` _ => None,
         }
    }
}

`

  output +=
    `pub static ALL_ITEMS_GEN3: [&ItemMetadataPastGen; ITEM_MAX_GEN3] = [\n` +
    allItems.map(convertItemPastGen).join(',\n') +
    '];'

  const filename = 'src/items/gen3.rs'
  fs.writeFileSync(filename, output)
  console.log(`Rust code written to ${filename}`)
}

generateModern()
generateGen1()
generateGen2()
generateGen3()
