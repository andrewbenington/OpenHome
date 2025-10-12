import * as fs from 'fs'

const overrides: Record<number, string> = {
  266: 'AS_ONE_ICE_RIDER',
  267: 'AS_ONE_SHADOW_RIDER',
  301: 'EMBODY_ASPECT_SPEED',
  302: 'EMBODY_ASPECT_SP_DEF',
  303: 'EMBODY_ASPECT_ATK',
  304: 'EMBODY_ASPECT_DEF',
}

function convertToEnumMember(input: string): string {
  if (input === '—') {
    return 'None'
  }
  // Remove spaces and split the string into words
  const words = input.trim().split(/[\s-]+/)

  // Capitalize the first letter of each word and join them
  const pascalCaseString = words
    .map((word) => (word.length === 0 ? '' : word[0].toUpperCase() + word.slice(1)))
    .join('')
    .replace(/[^A-Za-z0-9]/g, '')

  return pascalCaseString
}

export function rustAbilityConstName(index: number, ability: string): string {
  if (index in overrides) {
    return overrides[index]
  }

  let constName = ability
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')

  return constName
}

function convertAbility(index: number, ability: string): string {
  return `AbilityMetadata {
    id: ${index},
    name: "${ability}",
}`
}

function main() {
  const names: string[] = fs.readFileSync('text_source/abilities.txt', 'utf-8').split('\n').slice(1)

  let output = `use std::fmt::Debug;
use std::num::NonZeroU16;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use serde::{Serialize, Serializer};

use crate::{Error, Result};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
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

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl AbilityIndex {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = fromIndex))]
    pub fn from_index(val: u16) -> Option<AbilityIndex> {
        AbilityIndex::new(val)
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
    pub fn equals(&self, other: &AbilityIndex) -> bool {
        self.0 == other.0
    }
}

impl Default for AbilityIndex {
    fn default() -> Self {
        Self(unsafe { NonZeroU16::new_unchecked(1) })
    }
}

impl Serialize for AbilityIndex {
    fn serialize<S>(&self, serializer: S) -> core::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.get_metadata().name)
    }
}

impl TryFrom<u8> for AbilityIndex {
    type Error = Error;

    fn try_from(value: u8) -> core::result::Result<Self, Self::Error> {
        if (value as usize) > ABILITY_MAX {
            return Err(Error::AbilityIndex {
                ability_index: value as u16,
            });
        }

        NonZeroU16::new(value as u16)
            .map(AbilityIndex)
            .ok_or(Error::AbilityIndex {
                ability_index: value as u16,
            })
    }
}

impl From<AbilityIndex> for u8 {
    fn from(val: AbilityIndex) -> Self {
        val.get() as u8
    }
}

impl TryFrom<u16> for AbilityIndex {
    type Error = Error;

    fn try_from(value: u16) -> Result<Self> {
        if (value as usize) > ABILITY_MAX {
            return Err(Error::AbilityIndex {
                ability_index: value,
            });
        }

        NonZeroU16::new(value)
            .map(AbilityIndex)
            .ok_or(Error::AbilityIndex {
                ability_index: value,
            })
    }
}

impl From<AbilityIndex> for u16 {
    fn from(val: AbilityIndex) -> Self {
        val.get()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Clone, Copy)]
pub struct AbilityMetadata {
    id: usize,
    name: &'static str,
}

pub const ABILITY_MAX: usize = 310;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getAbilityMax"))]
#[allow(clippy::missing_const_for_fn)]
pub fn get_all_abilities() -> Vec<AbilityMetadata> {
    ALL_ABILITIES.into_iter().copied().collect()
}
`

  output +=
    `pub static ALL_ABILITIES: [&AbilityMetadata; ABILITY_MAX] = [\n` +
    names.map((name, index) => '&' + convertAbility(index + 1, name)).join(',\n') +
    '];'

  const filename = 'src/abilities.rs'
  fs.writeFileSync(filename, output)
  console.log(`Rust code written to ${filename}`)
}

main()
