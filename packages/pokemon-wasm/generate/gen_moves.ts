import * as fs from "fs";

interface Move {
  id: number;
  name: string;
  accuracy: number | null;
  class: string;
  generation: string;
  power: number | null;
  pp: number;
  type: string;
}

function isZMoveWithVariants(move: Move) {
  return move.id >= 622 && move.id <= 657
}

function rustConstName(move: Move): string {
  let constName = move.name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace("10_000_000", "TEN_MILLION");
  if (isZMoveWithVariants(move)) {
    constName += `_${move.class.toUpperCase()}`
  }

  return constName
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function convertMove(id: string, move: Move): string {
  const constName = rustConstName(move);
  const moveClass = `MoveClass::${capitalize(move.class)}`;
  const gen = {
    "generation-i": "G1",
    "generation-ii": "G2",
    "generation-iii": "G3",
    "generation-iv": "G4",
    "generation-v": "G5",
    "generation-vi": "G6",
    "generation-vii": "G7",
    "generation-viii": "G8",
    "generation-ix": "G9",
  }[move.generation];

  if (!gen) {
    throw new Error(`Unknown generation: ${move.generation}`);
  }

  return `const ${constName}: MoveMetadata = MoveMetadata {
    id: ${move.id},
    name: "${move.name}",
    accuracy: ${move.accuracy !== null ? `Some(${move.accuracy})` : "None"},
    class: ${moveClass},
    introduced: Generation::${gen},
    power: ${move.power !== null ? `Some(${move.power})` : "None"},
    pp: ${move.pp},
    pkm_type: PkmType::${capitalize(move.type)},
};`;
}

function main() {
  const input: Record<string, Move> = JSON.parse(fs.readFileSync("text_source/moves.json", "utf-8"));

  let output = `use std::num::NonZeroU16;
use wasm_bindgen::prelude::*;

use serde::{Serialize, Serializer};

use crate::resources::{games::Generation, pkm_types::PkmType};

#[wasm_bindgen]
#[derive(Debug, Default, PartialEq, Eq, Clone, Copy)]
pub struct MoveSlot(Option<NonZeroU16>);

impl MoveSlot {
    pub fn get_metadata(&self) -> Option<&'static MoveMetadata> {
        self.0.map(|idx| ALL_MOVES[(idx.get() - 1) as usize])
    }

    pub fn from_le_bytes(bytes: [u8; 2]) -> Self {
        Self(match NonZeroU16::try_from(u16::from_le_bytes(bytes)) {
            Err(_) => None,
            Ok(value) => Some(value),
        })
    }

    pub fn to_le_bytes(self) -> [u8; 2] {
        self.0.map(NonZeroU16::get).unwrap_or(0u16).to_le_bytes()
    }
}

impl Serialize for MoveSlot {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
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
        Self(match NonZeroU16::try_from(value) {
            Err(_) => None,
            Ok(value) => Some(value),
        })
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
    id: u16,
    name: &'static str,
    accuracy: Option<u8>,
    class: MoveClass,
    introduced: Generation,
    power: Option<u8>,
    pp: u8,
    pkm_type: PkmType,
}

pub enum MoveClass {
    Physical,
    Special,
    Status,
}

`

  output += Object.entries(input)
    .map(([id, move]) => convertMove(id, move))
    .join("\n\n");

  output += `const ALL_MOVES: [&MoveMetadata; ${Object.keys(input).length}] = [\n` + Object.entries(input)
    .map(([, move]) => "&" + rustConstName(move))
    .join(",\n") + "];";

  fs.writeFileSync("src/resources/moves.rs", output);
  console.log("Rust code written to src/resources/moves.rs");
}

main();
