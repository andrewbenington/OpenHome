import * as fs from 'fs'

function removeDiacritics(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f,\(,\))]/g, '')
}

function convertToPascalCase(input: string): string {
  // Remove spaces and split the string into words
  const words = input.trim().split(/[\s-]+/)

  // Capitalize the first letter of each word and join them
  const pascalCaseString = words
    .map((word) => (word.length === 0 ? '' : word[0].toUpperCase() + word.slice(1)))
    .join('')

  return pascalCaseString
}

function main() {
  generateModern()
}

function generateModern() {
  const modernRibbons: string[] = fs
    .readFileSync('text_source/ribbons_modern.txt', 'utf-8')
    .split('\n')
  const enumValues = modernRibbons.map(removeDiacritics).map(convertToPascalCase)
  let output = `use std::fmt::Display;
use pkm_rs_types::FlagSet;
use serde::{Serialize, Serializer};

#[derive(Default, Debug, Clone, Copy)]
pub struct ModernRibbonSet<const N: usize>(FlagSet<N>);

impl<const N: usize> ModernRibbonSet<N> {
    pub const fn from_bytes(bytes: [u8; N]) -> Self {
        Self(FlagSet::from_bytes(bytes))
    }

    pub fn get_ribbons(&self) -> Vec<ModernRibbon> {
        self.0
            .get_indices()
            .into_iter()
            .map(ModernRibbon::from)
            .collect()
    }

    pub const fn to_bytes(self) -> [u8; N] {
        self.0.to_bytes()
    }

    pub fn clear_ribbons(&mut self) {
        self.0.clear_all();
    }

    pub fn add_ribbon(&mut self, ribbon: ModernRibbon) {
        self.0.set_index(ribbon.get_index(), true);
    }

    pub fn set_ribbons(&mut self, ribbons: Vec<ModernRibbon>) {
        self.clear_ribbons();
        ribbons
            .into_iter()
            .for_each(|ribbon| self.add_ribbon(ribbon));
    }

    pub fn from_ribbons(ribbons: Vec<ModernRibbon>) -> Self {
        let mut ribbon_set = Self(FlagSet::from_bytes([0u8; N]));
        ribbons
            .into_iter()
            .for_each(|ribbon| ribbon_set.add_ribbon(ribbon));

        ribbon_set
    }

    pub fn truncate_to<const M: usize>(self) -> ModernRibbonSet<M> {
        let mut truncated_bytes = [0u8; M];

        let min_size = N.min(M);

        truncated_bytes.copy_from_slice(&self.to_bytes()[0..min_size]);

        ModernRibbonSet::<M>::from_bytes(truncated_bytes)
    }
}

impl<const N: usize> Serialize for ModernRibbonSet<N> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.get_ribbons().serialize(serializer)
    }
}


#[derive(Debug, Serialize, PartialEq, Eq, Clone, Copy)]
pub enum ModernRibbon {
  ${enumValues.join(',\n')}
}

impl ModernRibbon {
    pub const fn get_name(&self) -> &'static str {
        match self {
            ${enumValues.map((val, i) => `ModernRibbon::${val} => "${modernRibbons[i].endsWith('Mark') ? modernRibbons[i] : modernRibbons[i] + ' Ribbon'}"`).join(',\n')},
        }
    }

    pub const fn get_index(&self) -> usize {
        match self {
            ${enumValues.map((val, i) => `ModernRibbon::${val} => ${i}`).join(',\n')},
        }
    }
    
    pub fn from_affixed_byte(affixed_byte: u8) -> Option<ModernRibbon> {
        match affixed_byte {
            0xff => None,
            value => Some(ModernRibbon::from(value as usize))
        }
    }
    
    pub fn to_affixed_byte(affixed: Option<ModernRibbon>) -> u8 {
        match affixed {
            None => 0xff,
            Some(ribbon) => ribbon.get_index() as u8,
        }
    }
}

impl Display for ModernRibbon {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.get_name())
    }
}
    
impl From<usize> for ModernRibbon {
    fn from(value: usize) -> Self {
        match value {
            ${enumValues.map((val, i) => `${i} => ModernRibbon::${val}`).join(',\n')},
            _ => panic!("Invalid value for ModernRibbon: {}", value),
        }
    }
}
`
  fs.mkdirSync('src/resources/ribbons', { recursive: true })
  fs.writeFileSync('src/resources/ribbons/modern.rs', output)
  console.log('Rust code written to src/resources/ribbons/modern.rs')
}

main()
