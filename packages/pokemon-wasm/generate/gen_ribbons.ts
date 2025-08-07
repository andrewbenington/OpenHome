import * as fs from "fs";

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
    generateOpenHome()
}

function generateModern() {
    const modernRibbons: string[] = fs.readFileSync("text_source/ribbons_modern.txt", "utf-8").split("\n");
    const enumValues = modernRibbons.map(removeDiacritics).map(convertToPascalCase)
    let output = `use std::fmt::Display;
use crate::substructures::FlagSet;
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
  ${enumValues.join(",\n")}
}

impl ModernRibbon {
    fn get_name(&self) -> &'static str {
        match self {
            ${enumValues.map((val, i) => `ModernRibbon::${val} => "${modernRibbons[i].endsWith("Mark") ? modernRibbons[i] : modernRibbons[i] + " Ribbon"}"`).join(",\n")},
        }
    }

    fn get_index(&self) -> usize {
        match self {
            ${enumValues.map((val, i) => `ModernRibbon::${val} => ${i}`).join(",\n")},
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
            ${enumValues.map((val, i) => `${i} => ModernRibbon::${val}`).join(",\n")},
            _ => panic!("Invalid value for ModernRibbon: {}", value),
        }
    }
}
`
    fs.mkdirSync("src/resources/ribbons", { recursive: true })
    fs.writeFileSync("src/resources/ribbons/modern.rs", output);
    console.log("Rust code written to src/resources/ribbons/modern.rs");
}

function generateOpenHome() {
    const modernRibbons: string[] = fs.readFileSync("text_source/ribbons_openhome.txt", "utf-8").split("\n");
    const enumValues = modernRibbons.map(removeDiacritics).map(convertToPascalCase)
    let output = `use std::fmt::Display;
use crate::substructures::FlagSet;
use serde::{Serialize, Serializer};

#[derive(Default, Debug, Clone, Copy)]
pub struct OpenHomeRibbonSet<const N: usize>(FlagSet<N>);

impl<const N: usize> OpenHomeRibbonSet<N> {
    pub const fn from_bytes(bytes: [u8; N]) -> Self {
        Self(FlagSet::from_bytes(bytes))
    }

    pub fn get_ribbons(&self) -> Vec<OpenHomeRibbon> {
        self.0
            .get_indices()
            .into_iter()
            .map(OpenHomeRibbon::from)
            .collect()
    }

    pub const fn to_bytes(self) -> [u8; N] {
        self.0.to_bytes()
    }
}

impl<const N: usize> Serialize for OpenHomeRibbonSet<N> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.get_ribbons().serialize(serializer)
    }
}

#[derive(Debug, Serialize, PartialEq, Eq, Clone, Copy)]
pub enum OpenHomeRibbon {
  ${enumValues.join(",\n")}
}

impl OpenHomeRibbon {
    fn get_name(&self) -> &'static str {
        match self {
            ${enumValues.map((val, i) => `OpenHomeRibbon::${val} => "${modernRibbons[i].endsWith("Mark") ? modernRibbons[i] : modernRibbons[i] + " Ribbon"}"`).join(",\n")},
        }
    }
}

impl Display for OpenHomeRibbon {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.get_name())
    }
}
    
impl From<usize> for OpenHomeRibbon {
    fn from(value: usize) -> Self {
        match value {
            ${enumValues.map((val, i) => `${i} => OpenHomeRibbon::${val}`).join(",\n")},
            _ => panic!("Invalid value for OpenHomeRibbon: {}", value),
        }
    }
}
`
    fs.mkdirSync("src/resources/ribbons", { recursive: true })
    fs.writeFileSync("src/resources/ribbons/openhome.rs", output);
    console.log("Rust code written to src/resources/ribbons/openhome.rs");
}
main();
