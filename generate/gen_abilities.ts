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
  const names: string[] = fs
    .readFileSync('pkm_rs/text_source/abilities.txt', 'utf-8')
    .split('\n')
    .slice(1)

  let output = `use serde::{Serialize, Serializer};
use std::fmt::Debug;
use std::num::NonZeroU16;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
#[cfg(feature = "randomize")]
use rand::RngExt;

use crate::{Error, Result};

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Clone, Copy)]
pub struct AbilityIndexBounded<const MAX: u16 = { ABILITY_MAX as u16 }>(NonZeroU16);

impl<const MAX: u16> AbilityIndexBounded<MAX> {
    pub fn new(index: u16) -> Option<AbilityIndexBounded<MAX>> {
        if index > MAX {
            return None;
        }
        NonZeroU16::new(index).map(AbilityIndexBounded)
    }

    /// # Safety
    ///
    /// - \`index\` must be greater than zero and at most the maximum ability index supported by this version of the library.
    pub const unsafe fn new_unchecked(index: u16) -> AbilityIndexBounded<MAX> {
        unsafe { AbilityIndexBounded(NonZeroU16::new_unchecked(index)) }
    }

    pub const fn to_u16(&self) -> u16 {
        self.0.get()
    }

    pub const fn get_metadata(&self) -> &AbilityMetadata {
        ALL_ABILITIES[(self.to_u16() - 1) as usize]
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.to_u16().to_le_bytes()
    }

    pub const fn change_bound<const NEW_MAX: u16>(self) -> Option<AbilityIndexBounded<NEW_MAX>> {
        if self.to_u16() > NEW_MAX {
            return None;
        }
        Some(AbilityIndexBounded(NonZeroU16::new(self.to_u16()).unwrap()))
    }
}

impl<const MAX: u16> Default for AbilityIndexBounded<MAX> {
    fn default() -> Self {
        Self(unsafe { NonZeroU16::new_unchecked(1) })
    }
}

impl<const MAX: u16> std::fmt::Display for AbilityIndexBounded<MAX> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} ({})", self.get_metadata().name, self.to_u16())
    }
}

impl<const MAX: u16> Serialize for AbilityIndexBounded<MAX> {
    fn serialize<S>(&self, serializer: S) -> core::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.get_metadata().name)
    }
}

impl<const MAX: u16> TryFrom<u8> for AbilityIndexBounded<MAX> {
    type Error = Error;

    fn try_from(value: u8) -> core::result::Result<Self, Self::Error> {
        if value as u16 > MAX {
            return Err(Error::AbilityIndex {
                ability_index: value as u16,
            });
        }

        NonZeroU16::new(value as u16)
            .map(AbilityIndexBounded)
            .ok_or(Error::AbilityIndex {
                ability_index: value as u16,
            })
    }
}

#[cfg(feature = "randomize")]
impl<const MAX: u16> Randomize for AbilityIndexBounded<MAX> {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        let index = rng.random_range(1..=MAX);
        AbilityIndexBounded(
            NonZeroU16::new(index).expect("should never be zero; range starts at 1"),
        )
    }
}

impl<const MAX: u16> From<AbilityIndexBounded<MAX>> for u8 {
    fn from(val: AbilityIndexBounded<MAX>) -> Self {
        val.to_u16() as u8
    }
}

impl<const MAX: u16> TryFrom<u16> for AbilityIndexBounded<MAX> {
    type Error = Error;

    fn try_from(value: u16) -> Result<Self> {
        if value > MAX {
            return Err(Error::AbilityIndex {
                ability_index: value,
            });
        }

        NonZeroU16::new(value)
            .map(AbilityIndexBounded)
            .ok_or(Error::AbilityIndex {
                ability_index: value,
            })
    }
}

impl<const MAX: u16> From<AbilityIndexBounded<MAX>> for u16 {
    fn from(val: AbilityIndexBounded<MAX>) -> Self {
        val.to_u16()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = AbilityIndex))]
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Clone, Copy)]
pub struct AbilityIndexWasm(NonZeroU16);

impl AbilityIndexWasm {
    pub fn new(index: u16) -> Option<AbilityIndexWasm> {
        if (index) > ABILITY_MAX as u16 {
            return None;
        }
        NonZeroU16::new(index).map(AbilityIndexWasm)
    }

    /// # Safety
    ///
    /// - \`index\` must be greater than zero and at most the maximum ability index supported by this version of the library.
    pub const unsafe fn new_unchecked(index: u16) -> AbilityIndexWasm {
        unsafe { AbilityIndexWasm(NonZeroU16::new_unchecked(index)) }
    }

    pub const fn to_u16(&self) -> u16 {
        self.0.get()
    }

    pub const fn get_metadata(&self) -> &AbilityMetadata {
        ALL_ABILITIES[(self.to_u16() - 1) as usize]
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.to_u16().to_le_bytes()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_class = AbilityIndex))]
#[allow(clippy::missing_const_for_fn)]
impl AbilityIndexWasm {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = fromIndex))]
    pub fn from_index(val: u16) -> Option<AbilityIndexWasm> {
        AbilityIndexWasm::new(val)
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn index(&self) -> u16 {
        self.to_u16()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn name(&self) -> String {
        self.get_metadata().name.to_owned()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen)]
    pub fn equals(&self, other: &AbilityIndexWasm) -> bool {
        self.0 == other.0
    }
}

impl Default for AbilityIndexWasm {
    fn default() -> Self {
        Self(unsafe { NonZeroU16::new_unchecked(1) })
    }
}

impl std::fmt::Display for AbilityIndexWasm {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} ({})", self.get_metadata().name, self.to_u16())
    }
}

impl Serialize for AbilityIndexWasm {
    fn serialize<S>(&self, serializer: S) -> core::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.get_metadata().name)
    }
}

impl TryFrom<u8> for AbilityIndexWasm {
    type Error = Error;

    fn try_from(value: u8) -> core::result::Result<Self, Self::Error> {
        if (value as usize) > ABILITY_MAX {
            return Err(Error::AbilityIndex {
                ability_index: value as u16,
            });
        }

        NonZeroU16::new(value as u16)
            .map(AbilityIndexWasm)
            .ok_or(Error::AbilityIndex {
                ability_index: value as u16,
            })
    }
}

impl From<AbilityIndexWasm> for u8 {
    fn from(val: AbilityIndexWasm) -> Self {
        val.to_u16() as u8
    }
}

impl TryFrom<u16> for AbilityIndexWasm {
    type Error = Error;

    fn try_from(value: u16) -> Result<Self> {
        if (value as usize) > ABILITY_MAX {
            return Err(Error::AbilityIndex {
                ability_index: value,
            });
        }

        NonZeroU16::new(value)
            .map(AbilityIndexWasm)
            .ok_or(Error::AbilityIndex {
                ability_index: value,
            })
    }
}

impl From<AbilityIndexBounded> for AbilityIndexWasm {
    fn from(val: AbilityIndexBounded) -> Self {
        AbilityIndexWasm(val.0)
    }
}

impl<const MAX: u16> TryFrom<AbilityIndexWasm> for AbilityIndexBounded<MAX> {
    type Error = Error;

    fn try_from(value: AbilityIndexWasm) -> Result<Self> {
        AbilityIndexBounded::try_from(value.to_u16())
    }
}

impl From<AbilityIndexWasm> for u16 {
    fn from(val: AbilityIndexWasm) -> Self {
        val.to_u16()
    }
}

#[cfg(feature = "randomize")]
impl Randomize for AbilityIndexWasm {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        let index = rng.random_range(1..ABILITY_MAX) as u16;
        AbilityIndexWasm(NonZeroU16::new(index).expect("should never be zero; range starts at 1"))
    }
}
    
#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Clone, Copy)]
pub struct AbilityMetadata {
    pub id: usize,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub name: &'static str,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl AbilityMetadata {
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn name(&self) -> String {
        self.name.to_owned()
    }
}

pub const ABILITY_MAX: usize = 318;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getAllAbilities"))]
#[allow(clippy::missing_const_for_fn)]
pub fn get_all_abilities() -> Vec<AbilityMetadata> {
    ALL_ABILITIES.into_iter().copied().collect()
}

`

  output +=
    `pub static ALL_ABILITIES: [&AbilityMetadata; ABILITY_MAX] = [\n` +
    names.map((name, index) => '&' + convertAbility(index + 1, name)).join(',\n') +
    '];'

  const filename = 'pkm_rs_resources/src/abilities.rs'
  fs.writeFileSync(filename, output)
  console.log(`Rust code written to ${filename}`)
}

main()
