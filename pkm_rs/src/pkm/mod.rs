mod generate;
mod helpers;
mod ohpkm;
mod pb7;
mod pk7;
mod pk8;
pub mod traits;
mod universal;

use std::{error::Error, fmt::Display};

use serde::Serialize;

pub use crate::resources::{ABILITY_MAX, NATIONAL_DEX_MAX};
pub use ohpkm::Ohpkm;
pub use pb7::Pb7;
pub use pk7::Pk7;
pub use pk8::Pk8;
pub use universal::UniversalPkm;

use crate::{
    pkm::traits::IsShiny,
    resources::{FormeMetadata, NatDexIndex, SpeciesMetadata},
};

pub trait Pkm: Sized + Serialize + IsShiny {
    const BOX_SIZE: usize;
    const PARTY_SIZE: usize;

    fn box_size() -> usize;
    fn party_size() -> usize;

    fn from_bytes(bytes: &[u8]) -> PkmResult<Self>;
    fn write_bytes(&self, bytes: &mut [u8]);
    fn to_box_bytes(&self) -> Vec<u8>;
    fn to_party_bytes(&self) -> Vec<u8>;

    fn get_species_metadata(&self) -> &'static SpeciesMetadata;
    fn get_forme_metadata(&self) -> Option<&'static FormeMetadata>;
}

#[derive(Debug)]
pub enum PkmError {
    ByteLength {
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
    AbilityIndex {
        ability_index: u16,
    },
    FieldError {
        field: &'static str,
        source: Box<dyn Error>,
    },
}

impl Display for PkmError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let message = match self {
            PkmError::ByteLength { expected, received } => {
                format!("Invalid byte length (expected {expected}, received {received}")
                    .to_owned()
            }
            PkmError::CryptRange { range, buffer_size } => {
                format!("Attempting to decrypt/encrypt range ({}, {}) over buffer of size {buffer_size}", range.0, range.1)
                    .to_owned()
            }
            PkmError::NationalDex { national_dex } => {
                format!("Invalid National Dex number {national_dex} (must be between 1 and {NATIONAL_DEX_MAX}")
                    .to_owned()
            }
            PkmError::FormeIndex {
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
            PkmError::AbilityIndex { ability_index } => {
                format!("Invalid ability index {ability_index} (must be between 1 and {ABILITY_MAX}")
                    .to_owned()
            }
            PkmError::FieldError { field, source } => {
                format!("Error reading field {field}: {source}")
                    .to_owned()
            }
        };

        f.write_str(&message)
    }
}

impl Error for PkmError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FieldError { field: _, source } => Some(source.as_ref()),
            _ => None,
        }
    }
}

pub type PkmResult<T> = Result<T, PkmError>;
