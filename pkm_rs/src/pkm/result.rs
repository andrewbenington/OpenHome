use crate::pkm::ohpkm::sectioned_data;

use std::fmt::{Display};
use std::string::FromUtf8Error;
use pkm_rs_resources::species::{NatDexIndex, SpeciesAndForme};
use pkm_rs_resources::{species::MAX_NATIONAL_DEX, natures::NATURE_MAX, abilities::ABILITY_MAX, language::LANGUAGE_MAX, items::ITEM_MAX};
use serde::{Serialize, Serializer};


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

    /// Indicates that the given SpeciesAndForme does not exist
    /// in the specified generation of games
    GenDex {
        saf: SpeciesAndForme,
        generation: NdexConvertSource,
    },

    /// Indicates that the given game index does not
    /// have a corresponding National index (usually its
    /// a fake mon)
    GameDex {
        value: u16,
        game: NdexConvertSource,
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

    MoveError {
        value: u16,
        source: MoveErrorSource,
    },

    StringDecode {
        source: StringErrorSource,
    },

    // Generic error for when nothing else fits
    Other(String),
}

impl Error {
    pub fn other(message: &str) -> Self {
        Self::Other(String::from(message))
    }

    pub const fn plugin_origin(error: FromUtf8Error) -> Self {
        Self::StringDecode { source: StringErrorSource::PluginOrigin(error) }
    }
}

impl Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let message = match self {
            Error::BufferSize {
                field,
               expected, received,
            } => {
                format!("{field} requires buffer of length {expected}, but actual length is {received}").to_owned()
            }
            Error::CryptRange { range, buffer_size } => {
                format!("Attempting to decrypt/encrypt range ({}, {}) over buffer of size {buffer_size}", range.0, range.1)
                    .to_owned()
            }
            Error::NationalDex { value: national_dex , source} => {
                format!("Invalid National Dex number {national_dex} (source: {source}; must be between 1 and {MAX_NATIONAL_DEX}")
                    .to_owned()
            }

            Error::GenDex { saf, generation } => {
                let species = saf.get_species_metadata();
                let form = saf.get_forme_metadata();
                format!("Pokémon '{}' (form: {}) does not exist in {generation}", species.name, form.forme_name)
            }

            Error::GameDex { value, game } => {
                format!("Invalid game dex index {value} in {game} (no corresponding National Dex entry)")
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
                format!("Invalid language index {language_index} (must be between 1 and {LANGUAGE_MAX}")
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

            Error::MoveError { value, source } => {
                format!("Invalid move reference {value} (source: {source})").to_owned()
            }

            Error::StringDecode { source } => {
                format!("String decode error: {source}").to_owned()
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

impl From<pkm_rs_resources::Error> for Error {
    fn from(value: pkm_rs_resources::Error) -> Self {
        match value {
            pkm_rs_resources::Error::BufferSize { field, expected, received } => Self::BufferSize { field, expected, received },
            pkm_rs_resources::Error::CryptRange { range, buffer_size } => Self::CryptRange { range, buffer_size },
            pkm_rs_resources::Error::NationalDex { national_dex } => Self::NationalDex { value: national_dex, source: NdexConvertSource::Other },
            pkm_rs_resources::Error::FormeIndex { national_dex, forme_index } => Self::FormeIndex { national_dex, forme_index },
            pkm_rs_resources::Error::LanguageIndex { language_index } => Self::LanguageIndex { language_index },
            pkm_rs_resources::Error::NatureIndex { nature_index } => Self::NatureIndex { nature_index },
            pkm_rs_resources::Error::AbilityIndex { ability_index } => Self::AbilityIndex { ability_index },
            pkm_rs_resources::Error::ItemIndex { item_index } => Self::ItemIndex { item_index },
            pkm_rs_resources::Error::FieldError { field, source } => Self::FieldError { field, source },
        }
    }
}

impl From<sectioned_data::Error> for Error {
    fn from(value: sectioned_data::Error) -> Self {
        match value {
            sectioned_data::Error::BufferTooShort { field, expected, received } => Self::BufferSize { field, expected, received },
            sectioned_data::Error::SectionOutOfBounds { section_name, offset, length, buffer_size } => Self::BufferSize { 
                field: section_name,
                expected: (offset+length) as usize, 
                received: buffer_size 
            },
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
    Gen4,
    Gen5,
    Gen6,
    Gen7,
    ScarletViolet,
    Gen3RR,
    Gen3UB,
}

impl Display for NdexConvertSource {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            NdexConvertSource::Other => "other",
            NdexConvertSource::Gen1 => "Gen 1",
            NdexConvertSource::Gen2 => "Gen 2",
            NdexConvertSource::Gen3 => "Gen 3",
            NdexConvertSource::Gen4 => "Gen 4",
            NdexConvertSource::Gen5 => "Gen 5",
            NdexConvertSource::Gen6 => "Gen 6",
            NdexConvertSource::Gen7 => "Gen 7",
            NdexConvertSource::ScarletViolet => "Scarlet/Violet",
            NdexConvertSource::Gen3RR => "Radical Red",
            NdexConvertSource::Gen3UB => "Unbound",
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
            Self::Other => "other",
            Self::CFRUIndex => "CFRU index",
            Self::NationalIndex => "national move index",
            Self::Name => "move name",
        })
    }
}

#[derive(Debug, Default)]
pub enum StringErrorSource {
    #[default]
    Other,
    PluginOrigin(FromUtf8Error),
}


impl Display for StringErrorSource {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Other => f.write_str("other"),
            Self::PluginOrigin(utf_error) =>  
                f.write_fmt(format_args!("OHPKM plugin origin: {utf_error}")),
            }
            
    }
}

pub type Result<T> = core::result::Result<T, Error>;
