import Database from 'better-sqlite3'
import * as fs from 'fs'
import { megaEvolutionGetAll, type MegaEvolutionGetAllRow } from './queries.ts'

async function main() {
  await generateMegaData()
}

type MegaDataWithStone = MegaEvolutionGetAllRow & { megaStoneId: number }

function hasStone(data: MegaEvolutionGetAllRow): data is MegaDataWithStone {
  return data.megaStoneId !== null
}

async function generateMegaData() {
  const megaEvolutionData = await megaEvolutionGetAll(new Database('generate/pkm.db'))
  const megasByStone = Object.groupBy(
    megaEvolutionData.filter(hasStone),
    (data) => data.megaStoneId
  )

  let output = `
  use crate::species::SpeciesForm;

  pub const fn mega_forms_for_stone(stone_item_index: usize) -> &'static [SpeciesForm] {
    match stone_item_index {
    \t${Object.entries(megasByStone)
      .map(([indexStr, megas]) =>
        megas
          ? `${indexStr} => const { &[${megas.map((data) => `SpeciesForm::assert_new(${data.nationalDex}, ${data.formIndex})`)}] }`
          : ''
      )
      .join(',\n\t')},
    _ => &[]
    }
  }

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = megaFormsForStone)]
pub fn mega_forms_for_stone_wasm(stone_item_index: usize) -> Vec<SpeciesForm> {
    mega_forms_for_stone(stone_item_index).to_vec()
}

`
  fs.writeFileSync('pkm_rs_resources/src/species/mega_evolutions.rs', output)
}

await main()
