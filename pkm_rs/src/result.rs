#[cfg(feature = "wasm")]
use crate::encryption::swish_crypto::SwishError;
use crate::sectioned_data;

use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_types::{InvalidAbilityNumber, NationalDex};

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

#[derive(Debug, Clone, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    PkmRsResources(#[from] pkm_rs_resources::Error),
    #[error(transparent)]
    PkmRsTypes(#[from] pkm_rs_types::Error),
    #[error(transparent)]
    SectionedData(#[from] sectioned_data::Error),
    #[error("Invalid box index: {0}")]
    BoxIndex(u8),
    #[error("Invalid box slot: {0}")]
    BoxSlot(u8),
    #[error(
        "expected buffer size of {expected}, but received {received} (from: {requirement_source:?})"
    )]
    BufferSize {
        requirement_source: Option<String>,
        expected: usize,
        received: usize,
    },
    #[error("Error opening save: {context}")]
    BuildSave {
        context: String,
        #[source]
        source: Option<Rc<dyn core::error::Error>>,
    },
    #[error(
        "Invalid National Dex number {value} (converting from {converting_from} index number; must be between 1 and {}",
        NationalDex::MAX
    )]
    NationalDex {
        value: u16,
        converting_from: PokemonIndexType,
    },
    #[error("Invalid {converting_from} index number {value}")]
    PokemonGameIndex {
        value: u16,
        converting_from: PokemonIndexType,
    },
    #[error(
        "Invalid form index {form_index} for national dex {national_dex} (must be <= {form_index})"
    )]
    FormIndex {
        national_dex: NationalDex,
        form_index: u16,
    },
    #[error("Invalid ability index {0} (must be between 1 and 3)")]
    AbilityIndex(u16),
    #[error(transparent)]
    AbilityNumber(#[from] InvalidAbilityNumber),
    #[error("error reading field {field}: {source}")]
    FieldError {
        field: &'static str,
        #[source]
        source: Rc<dyn std::error::Error>,
    },
    #[error("Invalid tag value {value} for tag type {tag_type}")]
    TagError { tag_type: &'static str, value: u16 },
    #[error(transparent)]
    StringDecode(#[from] StringErrorSource),


    #[cfg(feature = "wasm")]
    #[error(transparent)]
    SwishCrypto(#[from] SwishError),
    #[error(transparent)]
    Tsify(#[from] Rc<tsify::Error>),
    #[error("other error: {0}")]
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
            form_index: species_and_form.get_form_index(),
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

    pub fn tsify(source: tsify::Error) -> Self {
        Self::Tsify(Rc::new(source))
    }

    pub const fn plugin_origin(error: FromUtf8Error) -> Self {
        Self::StringDecode(StringErrorSource::PluginOrigin(error))
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

impl From<tsify::Error> for Error {
    fn from(value: tsify::Error) -> Self {
        Self::Tsify(Rc::new(value))
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

#[derive(Debug, Clone, thiserror::Error)]
pub enum StringErrorSource {
    #[error("corrupted plugin origin: {0}")]
    PluginOrigin(#[from] FromUtf8Error),
    #[error("corrupted OHPKM notes: {0}")]
    Notes(#[source] FromUtf8Error),
    #[error("OHPKM-stored most recent save path: {0}")]
    MostRecentSaveFilePath(#[source] FromUtf8Error),
}

pub type Result<T> = core::result::Result<T, Error>;
pub type StdResult<T, E> = core::result::Result<T, E>;

#[cfg(feature = "wasm")]
impl From<Error> for JsValue {
    fn from(value: Error) -> Self {
        value.to_string().into()
    }
}
