use std::fmt::Display;

use serde::{Serialize, Serializer};

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
}

impl Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let message = match self {
            Error::BufferSize {
                field,
                offset,
                buffer_size,
            } => format!("Buffer too short ({buffer_size}B) to access {field} (at {offset})")
                .to_owned(),
            Error::ByteLength { expected, received } => {
                format!("Invalid byte length (expected {expected}, received {received}").to_owned()
            }
            .to_owned(),
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
