use crate::{InvalidAbilityNumber, LANGUAGE_MAX, NationalDex};

use std::fmt::Display;

use serde::{Serialize, Serializer};

#[derive(Debug, Clone)]
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
    NationalDex {
        national_dex: u16,
    },
    AbilityNumber(InvalidAbilityNumber),
    LanguageIndex {
        language_index: u8,
    },
    ShadowData(crate::shadow::BadShadowData),
    TeraType {
        value: u8,
        is_override: bool,
    },
}

impl Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let message = match self {
            Self::BufferSize {
                field,
                offset,
                buffer_size,
            } => format!("Buffer too short ({buffer_size}B) to access {field} (at {offset})"),
            Self::ByteLength { expected, received } => {
                format!("Invalid byte length (expected {expected}, received {received})")
            }
            Self::NationalDex { national_dex } => format!(
                "Invalid National Dex number {national_dex} (must be between 1 and {})",
                NationalDex::MAX
            )
            .to_owned(),
            Self::AbilityNumber(InvalidAbilityNumber::U8(num)) => {
                format!("Invalid ability number {num} (must be between 1 and 3)")
            }
            Self::AbilityNumber(InvalidAbilityNumber::HiddenNotAllowed) => {
                String::from("Hidden ability not allowed")
            }
            Self::LanguageIndex { language_index } => {
                format!(
                    "Invalid language index {language_index} (must be between 0 and {LANGUAGE_MAX}"
                )
            }
            Self::ShadowData(err) => err.to_string(),
            Self::TeraType { value, is_override } => match is_override {
                false => format!("Invalid original tera type value: {value}"),
                true => format!("Invalid override tera type value: {value}"),
            },
        };

        f.write_str(&message)
    }
}

impl std::error::Error for Error {}

impl From<InvalidAbilityNumber> for Error {
    fn from(value: InvalidAbilityNumber) -> Self {
        Self::AbilityNumber(value)
    }
}

impl From<crate::shadow::BadShadowData> for Error {
    fn from(value: crate::shadow::BadShadowData) -> Self {
        Self::ShadowData(value)
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
