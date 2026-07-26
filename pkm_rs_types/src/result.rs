use crate::LANGUAGE_MAX;

use std::fmt::Display;

use serde::{Serialize, Serializer};

use crate::InvalidAbilityNumber;

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
    AbilityNumber(InvalidAbilityNumber),
    LanguageIndex {
        language_index: u8,
    },
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
            Self::AbilityNumber(InvalidAbilityNumber(num)) => {
                format!("Invalid ability number {num} (must be between 1 and 3)")
            }
            Self::LanguageIndex { language_index } => {
                format!(
                    "Invalid language index {language_index} (must be between 0 and {LANGUAGE_MAX}"
                )
            }
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

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type Result<T> = core::result::Result<T, Error>;
