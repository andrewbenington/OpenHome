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
}

impl Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let message = match self {
            Error::BufferSize {
                field,
                offset,
                buffer_size,
            } => format!("Buffer too short ({buffer_size}B) to access {field} (at {offset})"),
            Error::ByteLength { expected, received } => {
                format!("Invalid byte length (expected {expected}, received {received})")
            }
            Error::AbilityNumber(InvalidAbilityNumber(num)) => {
                format!("Invalid ability number {num} (must be between 1 and 3)")
            }
            Error::LanguageIndex { language_index } => {
                format!(
                    "Invalid language index {language_index} (must be between 0 and {LANGUAGE_MAX}"
                )
            }
        };

        f.write_str(&message)
    }
}

impl std::error::Error for Error {}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type Result<T> = core::result::Result<T, Error>;
