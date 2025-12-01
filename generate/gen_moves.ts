import Database from 'better-sqlite3'
import camelcaseKeys from 'camelcase-keys'
import * as fs from 'fs'
import { moveGetAll, type MoveGetAllRow } from './queries.ts'

interface Move {
  id: number
  name: string
  accuracy: number | null
  class: string
  generation: string
  power: number | null
  pp: number
  type: string
}

function isZMoveWithVariants(move: Move) {
  return move.id >= 622 && move.id <= 657
}

function rustConstName(move: Move): string {
  let constName = move.name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace('10_000_000', 'TEN_MILLION')
  if (isZMoveWithVariants(move)) {
    constName += `_${move.class.toUpperCase()}`
  }

  return constName
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function convertMove(move: Move): string {
  const constName = rustConstName(move)
  const moveClass = `MoveClass::${capitalize(move.class)}`

  return `const ${constName}: MoveMetadata = MoveMetadata {
    id: ${move.id},
    name: "${move.name}",
    accuracy: ${move.accuracy !== null ? `Some(${move.accuracy})` : 'None'},
    class: ${moveClass},
    introduced: Generation::G${move.generation},
    power: ${move.power !== null ? `Some(${move.power})` : 'None'},
    pp: ${move.pp},
    pkm_type: PkmType::${capitalize(move.type)},
};`
}

function rowToMove(row: MoveGetAllRow): Move {
  return {
    id: row.id,
    name: row.name,
    accuracy: row.accuracy,
    class: row.moveClass,
    generation: row.generation,
    power: row.power,
    pp: row.basePp,
    type: row.type,
  }
}

async function getAllMoves() {
  const db = new Database('generate/pkm.db')

  const rows = camelcaseKeys(await moveGetAll(db))

  return rows.map(rowToMove)
}

async function main() {
  const allMoves: Move[] = await getAllMoves()

  let output = `use std::num::NonZeroU16;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use pkm_rs_types::{Generation, PkmType};
use serde::{Serialize, Serializer};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, PartialEq, Eq, Clone, Copy)]
pub struct MoveSlot(Option<NonZeroU16>);

impl MoveSlot {
    pub fn get_metadata(&self) -> Option<&'static MoveMetadata> {
        self.0.map(|idx| ALL_MOVES[(idx.get() - 1) as usize])
    }

    pub fn from_u16(value: u16) -> Self {
        Self(NonZeroU16::try_from(value).ok())
    }

    pub fn from_le_bytes(bytes: [u8; 2]) -> Self {
        Self(NonZeroU16::try_from(u16::from_le_bytes(bytes)).ok())
    }

    pub fn to_le_bytes(self) -> [u8; 2] {
        self.0.map(NonZeroU16::get).unwrap_or(0u16).to_le_bytes()
    }
}

impl Serialize for MoveSlot {
    fn serialize<S>(&self, serializer: S) -> core::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(match self.get_metadata() {
            None => "<empty>",
            Some(metadata) => metadata.name,
        })
    }
}

impl From<u16> for MoveSlot {
    fn from(value: u16) -> Self {
        Self(NonZeroU16::try_from(value).ok())
    }
}

impl From<MoveSlot> for u16 {
    fn from(val: MoveSlot) -> Self {
        match val.0 {
            None => 0,
            Some(idx) => idx.get(),
        }
    }
}

pub struct MoveMetadata {
    pub id: u16,
    pub name: &'static str,
    pub accuracy: Option<u8>,
    pub class: MoveClass,
    pub introduced: Generation,
    pub power: Option<u8>,
    pub pp: u8,
    pub pkm_type: PkmType,
}

pub enum MoveClass {
    Physical,
    Special,
    Status,
}

`

  output += allMoves.map(convertMove).join('\n\n')

  output +=
    `\n\nconst ALL_MOVES: [&MoveMetadata; ${allMoves.length}] = [\n` +
    allMoves.map((move) => '&' + rustConstName(move)).join(',\n') +
    '];'

  fs.writeFileSync('pkm_rs_resources/src/moves.rs', output)
  console.log('Rust code written to pkm_rs_resources/src/moves.rs')
}

await main()
