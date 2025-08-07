import * as fs from "fs";

const overrides: Record<number, string> = {
  266: "AS_ONE_ICE_RIDER",
  267: "AS_ONE_SHADOW_RIDER",
  301: "EMBODY_ASPECT_SPEED",
  302: "EMBODY_ASPECT_SP_DEF",
  303: "EMBODY_ASPECT_ATK",
  304: "EMBODY_ASPECT_DEF",
}

function convertToEnumMember(input: string): string {
  if (input === "—") {
    return "None"
  }
  // Remove spaces and split the string into words
  const words = input.trim().split(/[\s-]+/)

  // Capitalize the first letter of each word and join them
  const pascalCaseString = words
    .map((word) => (word.length === 0 ? '' : word[0].toUpperCase() + word.slice(1)))
    .join('')
    .replace(/[^A-Za-z0-9]/g, "")

  return pascalCaseString
}


function rustConstName(index: number, ability: string): string {
  if (index in overrides) {
    return overrides[index]
  }

  let constName = ability
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/_+/g, "_");

  return constName
}

function convertAbility(index: number, ability: string): string {
  const constName = rustConstName(index, ability);

  return `const ${constName}: AbilityMetadata = AbilityMetadata {
    id: ${index},
    name: "${ability}",
};`;
}

function main() {
  const names: string[] = fs.readFileSync("text_source/abilities.txt", "utf-8").split("\n").slice(1);

  let output = `use std::num::NonZeroU16;
use wasm_bindgen::prelude::*;

use serde::{Serialize, Serializer};

#[wasm_bindgen]
#[derive(Debug, Default, PartialEq, Eq, Clone, Copy)]
pub struct AbilityIndex(Option<NonZeroU16>);

impl AbilityIndex {
    pub fn get_metadata(&self) -> Option<&'static AbilityMetadata> {
        self.0.map(|idx| ALL_ABILITIES[(idx.get() - 1) as usize])
    }

    fn to_u16(self) -> u16 {
        match self.0 {
            None => 0,
            Some(idx) => idx.get(),
        }
    }

    pub fn to_le_bytes(self) -> [u8; 2] {
        self.to_u16().to_le_bytes()
    }
}

#[wasm_bindgen]
impl AbilityIndex {
    #[wasm_bindgen(constructor)]
    pub fn new(val: u16) -> AbilityIndex {
        AbilityIndex(NonZeroU16::new(val))
    }

    #[wasm_bindgen(getter)]
    pub fn index(self) -> u16 {
        self.to_u16()
    }
}

impl Serialize for AbilityIndex {
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

impl From<u8> for AbilityIndex {
    fn from(value: u8) -> Self {
        Self(match NonZeroU16::try_from(value as u16) {
            Err(_) => None,
            Ok(value) => Some(value),
        })
    }
}


impl From<AbilityIndex> for u8 {
    fn from(val: AbilityIndex) -> Self {
        val.to_u16() as u8
    }
}

impl From<u16> for AbilityIndex {
    fn from(value: u16) -> Self {
        Self(match NonZeroU16::try_from(value) {
            Err(_) => None,
            Ok(value) => Some(value),
        })
    }
}


impl From<AbilityIndex> for u16 {
    fn from(val: AbilityIndex) -> Self {
        val.to_u16()
    }
}

pub struct AbilityMetadata {
    id: u16,
    name: &'static str,
}
    
`

  output += names
    .map((name, index) => convertAbility(index + 1, name))
    .join("\n\n");

  output += `const ALL_ABILITIES: [&AbilityMetadata; ${names.length}] = [\n` + names
    .map((name, index) => "&" + rustConstName(index + 1, name))
    .join(",\n") + "];";

  fs.writeFileSync("src/resources/abilities.rs", output);
  console.log("Rust code written to src/resources/abilities.rs");
}

main();
