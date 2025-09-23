use std::fmt::Display;

use serde::{Serialize, Serializer};

use crate::resources::{ABILITY_MAX, NATIONAL_DEX_MAX, NATURE_MAX, NatDexIndex, SpeciesAndForme};

#[derive(Debug)]
pub enum MoveErrorKind {
    CfruIndexNotFound(u16),
    NationalIdNotFound(u16),
    NameNotFound(String),
}

#[derive(Debug)]
pub enum Error {
    BufferSize {
        field: String,
        offset: usize,
        buffer_size: usize,
    },
    ByteLength {
        expected: usize,
        received: usize,
    },
    CryptRange {
        range: (usize, usize),
        buffer_size: usize,
    },
    NationalDex {
        value: u16,
        source: NdexConvertSource,
    },
    UnsupportedPkm(SpeciesAndForme),
    FormeIndex {
        national_dex: NatDexIndex,
        forme_index: u16,
    },
    NatureIndex {
        nature_index: u8,
    },
    AbilityIndex {
        ability_index: u16,
    },
    FieldError {
        field: &'static str,
        source: Box<dyn std::error::Error>,
    },

    MoveError {
        value: u16,
        source: MoveErrorSource,
    },

    // Generic error for when nothing else fits
    Other(String),
}

impl Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let message = match self {
            Error::BufferSize {
                field,
                offset,
                buffer_size,
            } => {
                format!("Buffer too short ({buffer_size}B) to access {field} (at {offset})").to_owned()
            }
            Error::ByteLength { expected, received } => {
                format!("Invalid byte length (expected {expected}, received {received}")
                    .to_owned()
            }
            Error::CryptRange { range, buffer_size } => {
                format!("Attempting to decrypt/encrypt range ({}, {}) over buffer of size {buffer_size}", range.0, range.1)
                    .to_owned()
            }
            Error::NationalDex { value: national_dex , source} => {
                format!("Invalid National Dex number {national_dex} (source: {source}; must be between 1 and {NATIONAL_DEX_MAX}")
                    .to_owned()
            }
            Error::UnsupportedPkm( s) => {
                let forme_metadata = s.get_forme_metadata();
                format!("Forme '{forme_metadata}' not supported")
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
            Error::NatureIndex { nature_index } => {
                format!("Invalid nature index {nature_index} (must be between 1 and {NATURE_MAX}")
                    .to_owned()
            }
            Error::AbilityIndex { ability_index } => {
                format!("Invalid ability index {ability_index} (must be between 1 and {ABILITY_MAX}")
                    .to_owned()
            }
            Error::FieldError { field, source } => {
                format!("Error reading field {field}: {source}")
                    .to_owned()
            },

            Error::MoveError { value, source } => {
                format!("Invalid move reference {value} (source: {source})").to_owned()
            }

            Error::Other(msg) => msg.clone(),
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

#[derive(Debug, Default)]
pub enum NdexConvertSource {
    #[default]
    Other,
    Gen1,
    Gen2,
    Gen3,
    ScarletViolet,
    RR,
    UB,
}

impl Display for NdexConvertSource {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            NdexConvertSource::Other => "other",
            NdexConvertSource::Gen1 => "gen 1 index",
            NdexConvertSource::Gen2 => "gen 2 index",
            NdexConvertSource::Gen3 => "gen 3 index",
            NdexConvertSource::ScarletViolet => "scarlet/violet index",
            NdexConvertSource::RR => "radical red index",
            NdexConvertSource::UB => "unbound index",
        })
    }
}

#[derive(Debug, Default)]
pub enum MoveErrorSource {
    #[default]
    Other,
    CFRUIndex,
    NationalIndex,
    Name,
}

impl Display for MoveErrorSource {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            MoveErrorSource::Other => "other",
            MoveErrorSource::CFRUIndex => "CFRU index",
            MoveErrorSource::NationalIndex => "national move index",
            MoveErrorSource::Name => "move name",
        })
    }
}

pub type Result<T> = core::result::Result<T, Error>;
