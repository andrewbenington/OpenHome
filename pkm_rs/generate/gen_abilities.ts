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


export function rustAbilityConstName(index: number, ability: string): string {
    if (index in overrides) {
        return overrides[index]
    }

    let constName = ability
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .replace(/[^A-Z0-9]/g, "_")
        .replace(/_+/g, "_");

    return constName
}

function convertAbility(index: number, ability: string): string {
    return `AbilityMetadata {
    id: ${index},
    name: "${ability}",
}`;
}

function main() {
    const names: string[] = fs.readFileSync("text_source/abilities.txt", "utf-8").split("\n").slice(1);

    let output = `use std::fmt::Debug;
use std::{fmt::Display, num::NonZeroU16};
use wasm_bindgen::prelude::*;

use serde::{Serialize, Serializer};

#[wasm_bindgen]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct AbilityIndex(NonZeroU16);

impl AbilityIndex {
    pub fn new(index: u16) -> Option<AbilityIndex> {
        if (index as usize) > ALL_ABILITIES.len() {
            return None;
        }
        NonZeroU16::new(index).map(AbilityIndex)
    }

    /// # Safety
    ///
    /// - \`index\` must be greater than zero and at most the maximum ability index supported by this version of the library.
    pub const unsafe fn new_unchecked(index: u16) -> AbilityIndex {
        unsafe { AbilityIndex(NonZeroU16::new_unchecked(index)) }
    }

    pub const fn get(&self) -> u16 {
        self.0.get()
    }

    pub const fn get_metadata(&self) -> &AbilityMetadata {
        ALL_ABILITIES[(self.get() - 1) as usize]
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.get().to_le_bytes()
    }
}

#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl AbilityIndex {
    #[wasm_bindgen(constructor)]
    pub fn new_js(val: u16) -> Option<AbilityIndex> {
        AbilityIndex::new(val)
    }

    #[wasm_bindgen(getter)]
    pub fn index(self) -> u16 {
        self.get()
    }
}

impl Default for AbilityIndex {
    fn default() -> Self {
        Self(unsafe { NonZeroU16::new_unchecked(1) })
    }
}

impl Serialize for AbilityIndex {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.get_metadata().name)
    }
}

#[derive(Debug, Copy, Clone)]
pub struct InvalidAbilityIndex<T: num::Integer + Display + Debug> {
    received_index: T,
}

impl<T: num::Integer + Display + Debug> std::error::Error for InvalidAbilityIndex<T> {}

impl<T: num::Integer + Display + Debug> InvalidAbilityIndex<T> {
    pub const fn new(received_index: T) -> Self {
        Self { received_index }
    }
}

impl<T: num::Integer + Display + Debug> Display for InvalidAbilityIndex<T> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&format!(
            "Ability index must be between 1 and {ABILITY_MAX}; received {}",
            self.received_index
        ))
    }
}

impl TryFrom<u8> for AbilityIndex {
    type Error = InvalidAbilityIndex<u8>;

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        if (value as usize) > ABILITY_MAX {
            return Err(Self::Error::new(value));
        }

        NonZeroU16::try_from(value as u16)
            .map(AbilityIndex)
            .map_err(|_| Self::Error::new(value))
    }
}

impl From<AbilityIndex> for u8 {
    fn from(val: AbilityIndex) -> Self {
        val.get() as u8
    }
}

impl TryFrom<u16> for AbilityIndex {
    type Error = InvalidAbilityIndex<u16>;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if (value as usize) > ABILITY_MAX {
            return Err(Self::Error::new(value));
        }

        NonZeroU16::try_from(value)
            .map(AbilityIndex)
            .map_err(|_| Self::Error::new(value))
    }
}

impl From<AbilityIndex> for u16 {
    fn from(val: AbilityIndex) -> Self {
        val.get()
    }
}

pub struct AbilityMetadata {
    id: u16,
    name: &'static str,
}

pub const ABILITY_MAX: usize = ${names.length};
    
`

    output += `pub static ALL_ABILITIES: [&AbilityMetadata; ABILITY_MAX] = [\n` + names
        .map((name, index) => "&" + convertAbility(index + 1, name))
        .join(",\n") + "];";

    const filename = "pkm_rs/src/resources/abilities.rs"
    fs.writeFileSync(filename, output);
    console.log(`Rust code written to ${filename}`);
}

main();

