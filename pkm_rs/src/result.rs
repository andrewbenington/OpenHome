use crate::sectioned_data;

use pkm_rs_resources::abilities::ABILITY_MAX;
use pkm_rs_resources::lookup;
use pkm_rs_resources::species::{GetSpeciesMetadata, SpeciesForm};
use pkm_rs_types::{InvalidAbilityNumber, Language, NationalDex};

use serde::{Serialize, Serializer};
use std::fmt::Display;
use std::rc::Rc;
use std::string::FromUtf8Error;

#[cfg(feature = "wasm")]
use wasm_bindgen::JsValue;

#[derive(Debug)]
pub enum MoveErrorKind {
    CfruIndexNotFound(u16),
    NationalIdNotFound(u16),
    NameNotFound(String),
}

#[derive(Debug, Clone)]
pub enum Error {
    PkmRsResources(pkm_rs_resources::Error),
    PkmRsTypes(pkm_rs_types::Error),
    SectionedData(sectioned_data::Error),
    BoxIndex(u8),
    BoxSlot(u8),
    BufferSize {
        requirement_source: Option<String>,
        expected: usize,
        received: usize,
    },
    BuildSave {
        context: String,
        source: Option<Rc<dyn core::error::Error>>,
    },
    NationalDex {
        value: u16,
        source: PokemonIndexType,
    },
    PokemonGameIndex {
        value: u16,
        source: PokemonIndexType,
    },
    FormIndex {
        national_dex: NationalDex,
        form_index: u16,
    },
    AbilityIndex {
        ability_index: u16,
    },
    AbilityNumber(InvalidAbilityNumber),
    FieldError {
        field: &'static str,
        source: Rc<dyn std::error::Error>,
    },
    TagError {
        tag_type: &'static str,
        value: u16,
    },
    StringDecode {
        source: StringErrorSource,
    },
    Other(String),
}

impl Error {
    pub fn build_save(context: impl ToString, source: Option<Box<dyn core::error::Error>>) -> Self {
        Self::BuildSave {
            context: context.to_string(),
            source: source.map(|s| s.into()),
        }
    }

    pub const fn form_index(species_and_form: SpeciesForm) -> Self {
        Self::FormIndex {
            national_dex: species_and_form.get_ndex(),
            form_index: species_and_form.get_forme_index(),
        }
    }

    pub const fn buffer_size(expected: usize, received: usize) -> Self {
        Self::BufferSize {
            requirement_source: None,
            expected,
            received,
        }
    }

    pub fn buffer_size_with_source(source: &str, expected: usize, received: usize) -> Self {
        Self::BufferSize {
            requirement_source: Some(String::from(source)),
            expected,
            received,
        }
    }

    pub fn other(message: &str) -> Self {
        Self::Other(String::from(message))
    }

    pub const fn plugin_origin(error: FromUtf8Error) -> Self {
        Self::StringDecode {
            source: StringErrorSource::PluginOrigin(error),
        }
    }
}

impl Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let message = match self {
            Self::PkmRsResources(err) => err.to_string(),
            Self::PkmRsTypes(err) => err.to_string(),
            Self::SectionedData(err) => err.to_string(),
            Self::BoxIndex(index) => format!("Invalid box index: {index}"),
            Self::BoxSlot(slot) => format!("Invalid box slot: {slot}"),
            Self::BufferSize {
                requirement_source,
                expected,
                received,
            } => match requirement_source {
                Some(source) => format!(
                    "{source} requires a buffer of length {expected}, but actual length is {received}"
                ),
                None => format!(
                    "Buffer of length {expected} was expected, but actual length is {received}"
                ),
            },
            Self::BuildSave { context, source } => match source {
                Some(source) => format!("Error opening save: {context}; original error: {source}"),
                None => format!("Error opening save: {context}"),
            },
            Self::NationalDex {
                value: national_dex,
                source,
            } => {
                format!(
                    "Invalid National Dex number {national_dex} (source: {source}; must be between 1 and {}",
                    NationalDex::MAX
                )
            }
            Self::PokemonGameIndex {
                value: national_dex,
                source,
            } => {
                format!("Invalid {source} index number {national_dex}")
            }
            Self::FormIndex {
                national_dex,
                form_index,
            } => {
                let species_metadata = national_dex.get_species_metadata();
                format!(
                    "Invalid form index {form_index} for national dex {} (must be <= {})",
                    lookup::species_name(*national_dex, Language::English),
                    species_metadata.forms.len()
                )
            }
            Self::AbilityIndex { ability_index } => format!(
                "Invalid ability index {ability_index} (must be between 1 and {ABILITY_MAX}"
            ),
            Self::AbilityNumber(invalid_number) => invalid_number.to_string(),
            Self::FieldError { field, source } => {
                format!("Self reading field {field}: {source}")
            }
            Self::TagError { tag_type, value } => {
                format!("Invalid tag value {value} for tag type {tag_type}")
            }
            Self::StringDecode { source } => format!("String decode error: {source}"),
            Self::Other(msg) => msg.clone(),
        };

        f.write_str(&message)
    }
}

impl std::error::Error for Error {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::FieldError { source, .. } => Some(source.as_ref()),
            Self::BuildSave {
                source: Some(source),
                ..
            } => Some(source.as_ref()),
            _ => None,
        }
    }
}

impl From<pkm_rs_resources::Error> for Error {
    fn from(value: pkm_rs_resources::Error) -> Self {
        match value {
            pkm_rs_resources::Error::PkmRsTypes(err) => Self::PkmRsTypes(err),
            _ => Self::PkmRsResources(value),
        }
    }
}

impl From<pkm_rs_types::Error> for Error {
    fn from(value: pkm_rs_types::Error) -> Self {
        Self::PkmRsTypes(value)
    }
}

impl From<sectioned_data::Error> for Error {
    fn from(value: sectioned_data::Error) -> Self {
        Self::SectionedData(value)
    }
}

impl From<pkm_rs_types::InvalidAbilityNumber> for Error {
    fn from(value: InvalidAbilityNumber) -> Self {
        Self::AbilityNumber(value)
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

#[derive(Debug, Default, Clone, Copy)]
pub enum PokemonIndexType {
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

impl Display for PokemonIndexType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            PokemonIndexType::Other => "other",
            PokemonIndexType::Gen1 => "Gen 1",
            PokemonIndexType::Gen2 => "Gen 2",
            PokemonIndexType::Gen3 => "Gen 3",
            PokemonIndexType::Gen4 => "Gen 4",
            PokemonIndexType::Gen5 => "Gen 5",
            PokemonIndexType::Gen6 => "Gen 6",
            PokemonIndexType::Gen7 => "Gen 7",
            PokemonIndexType::ScarletViolet => "Scarlet/Violet",
            PokemonIndexType::Gen3RR => "Radical Red",
            PokemonIndexType::Gen3UB => "Unbound",
        })
    }
}

#[derive(Debug, Default, Clone, Copy)]
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

#[derive(Debug, Default, Clone)]
pub enum StringErrorSource {
    #[default]
    Other,
    PluginOrigin(FromUtf8Error),
    Notes(FromUtf8Error),
    MostRecentSaveFilePath(FromUtf8Error),
}

impl Display for StringErrorSource {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Other => f.write_str("other"),
            Self::PluginOrigin(utf_error) => {
                f.write_fmt(format_args!("OHPKM plugin origin: {utf_error}"))
            }
            Self::Notes(utf_error) => f.write_fmt(format_args!("OHPKM notes: {utf_error}")),
            Self::MostRecentSaveFilePath(utf_error) => f.write_fmt(format_args!(
                "OHPKM most recent save file path: {utf_error}"
            )),
        }
    }
}

pub type Result<T> = core::result::Result<T, Error>;

#[cfg(feature = "wasm")]
impl From<Error> for JsValue {
    fn from(value: Error) -> Self {
        value.to_string().into()
    }
}
