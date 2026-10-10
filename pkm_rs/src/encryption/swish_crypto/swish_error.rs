use thiserror::Error;
use wasm_bindgen::prelude::*;

use crate::encryption::swish_crypto::{BlockType, ScalarType};
use crate::result::Error;

#[cfg_attr(feature = "wasm", derive(tsify::Tsify, serde::Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Debug, Error, Clone)]
pub enum SwishError {
    #[error("swish crypto error: {0}")]
    TypeId(#[from] InvalidTypeId),
    #[error("swish crypto error: {0}")]
    Missing(#[from] MissingBlock),
    #[error("swish crypto error: {0}")]
    BlockType(WrongType),
    #[error("swish crypto error - {context}: expected {expected}, received {actual}")]
    ByteLength {
        context: String,
        expected: usize,
        actual: usize,
    },
    #[error("swish crypto error - other: {0}")]
    Other(String),
}

impl SwishError {
    pub const fn expected_bytes<const EXPECTED: usize>(context: String, actual: usize) -> Self {
        Self::ByteLength {
            context,
            expected: EXPECTED,
            actual,
        }
    }
}

// Missing Block

#[cfg_attr(feature = "wasm", derive(tsify::Tsify, serde::Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Debug, Error, Clone)]
#[error("block with key {block_key_display} not found")]
pub struct MissingBlock {
    pub block_key_display: String,
}

impl MissingBlock {
    pub const fn new(block_key_display: String) -> Self {
        Self { block_key_display }
    }
}

// Wrong Block Type

#[cfg_attr(feature = "wasm", derive(tsify::Tsify, serde::Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Debug, Error, Clone, Copy)]
#[error("expected SwishCrypto block of type {expected}, received {actual} (block key {block_key})")]
pub struct WrongType {
    pub block_key: u32,
    pub expected: ExpectedBlockType,
    pub actual: BlockType,
}

impl From<WrongType> for Error {
    fn from(value: WrongType) -> Self {
        Error::build_save(value.to_string(), Some(Box::new(value)))
    }
}

// Invalid Type ID

#[cfg_attr(feature = "wasm", derive(tsify::Tsify, serde::Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Debug, Error, Clone, Copy)]
#[error("SwishCrypto block has invalid type id: {0}")]
pub struct InvalidTypeId(pub u8);

impl From<InvalidTypeId> for Error {
    fn from(value: InvalidTypeId) -> Self {
        Error::build_save("Invalid block type id".to_owned(), Some(Box::new(value)))
    }
}

// Expected Block Type

#[cfg_attr(feature = "wasm", derive(tsify::Tsify, serde::Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Debug, Clone, Copy, strum::Display)]
pub enum ExpectedBlockType {
    Object,
    Array,
    Numeric,
    Bool,
}

impl From<BlockType> for ExpectedBlockType {
    fn from(value: BlockType) -> Self {
        match value {
            BlockType::Object => Self::Object,
            BlockType::Array => Self::Array,
            BlockType::Scalar(ScalarType::Bool(_)) => Self::Bool,
            BlockType::Scalar(ScalarType::Numeric(_)) => Self::Numeric,
        }
    }
}
