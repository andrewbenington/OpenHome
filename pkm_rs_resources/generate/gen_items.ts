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

main()
