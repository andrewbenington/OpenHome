import Database from 'better-sqlite3'
import * as fs from 'fs'
import { itemGen3GetAll, type ItemGen3GetAllRow, itemGetAll } from './queries.ts'

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

function convertItemGen3(row: ItemGen3GetAllRow): string {
  return `&ItemMetadataGen3 {
    id: ${row.id},
    modern_id: ${optionalToRust(row.modernId)},
    name: "${row.name}",
}`
}

async function generateGen3() {
  const allItems = await itemGen3GetAll(new Database('generate/pkm.db'))

  let output = `use crate::items::{ItemGen3, ItemMetadataGen3};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub const ITEM_MAX_GEN3: usize = ${allItems.length};

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getAllItemsGen3"))]
#[allow(clippy::missing_const_for_fn)]
pub fn get_all_items_gen3() -> Vec<ItemMetadataGen3> {
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
    `pub static ALL_ITEMS_GEN3: [&ItemMetadataGen3; ITEM_MAX_GEN3] = [\n` +
    allItems.map(convertItemGen3).join(',\n') +
    '];'

  const filename = 'src/items/gen3.rs'
  fs.writeFileSync(filename, output)
  console.log(`Rust code written to ${filename}`)
}

generateModern()
generateGen3()
