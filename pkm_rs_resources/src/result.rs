use std::fmt::Display;

use serde::{Serialize, Serializer};

use crate::abilities::ABILITY_MAX;
use crate::items::ITEM_MAX;
use crate::language::LANGUAGE_MAX;
use crate::natures::NATURE_MAX;
use crate::species::{NATIONAL_DEX_MAX, NatDexIndex};

#[derive(Debug)]
pub enum Error {
    BufferSize {
        requirement_source: String,
        expected: usize,
        received: usize,
    },
    CryptRange {
        range: (usize, usize),
        buffer_size: usize,
    },
    NationalDex {
        national_dex: u16,
    },
    FormeIndex {
        national_dex: NatDexIndex,
        forme_index: u16,
    },
    LanguageIndex {
        language_index: u8,
    },
    NatureIndex {
        nature_index: u8,
    },
    AbilityIndex {
        ability_index: u16,
    },
    ItemIndex {
        item_index: u16,
    },
    FieldError {
        field: &'static str,
        source: Box<dyn std::error::Error>,
    },
}

impl Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let message = match self {
            Error::BufferSize { requirement_source: field, expected, received } => {
                format!("{field} requires buffer of length {expected}, but actual length is {received}").to_owned()
            }
            Error::CryptRange { range, buffer_size } => {
                format!("Attempting to decrypt/encrypt range ({}, {}) over buffer of size {buffer_size}", range.0, range.1)
                    .to_owned()
            }
            Error::NationalDex { national_dex } => {
                format!("Invalid National Dex number {national_dex} (must be between 1 and {NATIONAL_DEX_MAX}")
                    .to_owned()
            }
            Error::FormeIndex {
                national_dex,
                forme_index,
            } => {
                let species_metadata = national_dex.get_species_metadata();
                format!(
                    "Invalid forme index {forme_index} for Pokémon {} (must be <= {})",
                    species_metadata.name,
                    species_metadata.formes.len()
                )
                .to_owned()
            }
            Error::LanguageIndex { language_index } => {
                format!("Invalid language index {language_index} (must be between 0 and {LANGUAGE_MAX}")
                    .to_owned()
            }
            Error::NatureIndex { nature_index } => {
                format!("Invalid nature index {nature_index} (must be between 1 and {NATURE_MAX}")
                    .to_owned()
            }
            Error::AbilityIndex { ability_index } => {
                format!("Invalid ability index {ability_index} (must be between 1 and {ABILITY_MAX}")
                    .to_owned()
            }
            Error::ItemIndex { item_index } => {
                format!("Invalid item index {item_index} (must be between 1 and {ITEM_MAX}")
                    .to_owned()
            }
            Error::FieldError { field, source } => {
                format!("Error reading field {field}: {source}")
                    .to_owned()
            }
        };

        f.write_str(&message)
    }
}

impl std::error::Error for Error {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::FieldError { field: _, source } => Some(source.as_ref()),
            _ => None,
        }
    }
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type Result<T> = core::result::Result<T, Error>;
