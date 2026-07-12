// PKHeX reference implementation: PKHeX.Core/Saves/Encryption/SwishCrypto/SwishCrypto.cs

use wasm_bindgen::prelude::*;

use crate::{
    bytes::{Reader, Writer},
    result::Error,
};
const PAD_LENGTH: usize = 127;

const STATIC_XOR_PAD: [u8; PAD_LENGTH] = [
    0xa0, 0x92, 0xd1, 0x06, 0x07, 0xdb, 0x32, 0xa1, 0xae, 0x01, 0xf5, 0xc5, 0x1e, 0x84, 0x4f, 0xe3,
    0x53, 0xca, 0x37, 0xf4, 0xa7, 0xb0, 0x4d, 0xa0, 0x18, 0xb7, 0xc2, 0x97, 0xda, 0x5f, 0x53, 0x2b,
    0x75, 0xfa, 0x48, 0x16, 0xf8, 0xd4, 0x8a, 0x6f, 0x61, 0x05, 0xf4, 0xe2, 0xfd, 0x04, 0xb5, 0xa3,
    0x0f, 0xfc, 0x44, 0x92, 0xcb, 0x32, 0xe6, 0x1b, 0xb9, 0xb1, 0x2e, 0x01, 0xb0, 0x56, 0x53, 0x36,
    0xd2, 0xd1, 0x50, 0x3d, 0xde, 0x5b, 0x2e, 0x0e, 0x52, 0xfd, 0xdf, 0x2f, 0x7b, 0xca, 0x63, 0x50,
    0xa4, 0x67, 0x5d, 0x23, 0x17, 0xc0, 0x52, 0xe1, 0xa6, 0x30, 0x7c, 0x2b, 0xb6, 0x70, 0x36, 0x5b,
    0x2a, 0x27, 0x69, 0x33, 0xf5, 0x63, 0x7b, 0x36, 0x3f, 0x26, 0x9b, 0xa3, 0xed, 0x7a, 0x53, 0x00,
    0xa4, 0x48, 0xb3, 0x50, 0x9e, 0x14, 0xa0, 0x52, 0xde, 0x7e, 0x10, 0x2b, 0x1b, 0x77, 0x6e,
];

// with compiler optimizations the iterator is erased completely (at least on x86)
fn crypt_static_xor_pad_bytes(data: &[u8]) -> Vec<u8> {
    data.iter()
        .zip(STATIC_XOR_PAD.iter().cycle())
        .map(|(val, pad)| val ^ pad)
        .collect()
}

fn read_blocks(data: &[u8]) -> Result<Vec<Block>, InvalidTypeId> {
    let mut result = Vec::<Block>::new();
    let mut reader = Reader::new(data);

    while reader.current_offset() < data.len() {
        result.push(Block::read_encrypted(&mut reader)?);
    }

    Ok(result)
}

#[wasm_bindgen(js_name = decryptBlocks)]
pub fn decrypt_blocks(data: &[u8]) -> Result<Vec<Block>, InvalidTypeId> {
    let data_before_hash = &data[..data.len() - super::HASH_SIZE];
    let data_after_xor = crypt_static_xor_pad_bytes(data_before_hash);

    read_blocks(&data_after_xor)
}

#[wasm_bindgen(js_name = writeBlock)]
pub fn write_block(block: &Block, bytes: &mut [u8], offset: usize) -> usize {
    let mut writer = Writer::at(bytes, offset);
    block.write_encrypted(&mut writer)
}

fn write_blocks(blocks: &[Block], size: usize) -> Vec<u8> {
    let mut buffer = vec![0u8; size];
    let mut writer = Writer::new(&mut buffer);

    for block in blocks {
        block.write_encrypted(&mut writer);
    }

    let written_size = writer.current_offset();
    buffer.truncate(written_size);

    buffer
}

pub fn encrypt_blocks(blocks: &[Block], size: usize) -> Vec<u8> {
    let encrypted_blocks = write_blocks(blocks, size);
    let mut encrypted_bytes = crypt_static_xor_pad_bytes(&encrypted_blocks);

    let hash = super::hash::compute_hash(&encrypted_bytes);
    encrypted_bytes.extend_from_slice(&hash);

    encrypted_bytes
}

#[wasm_bindgen(js_name = encryptBlocks)]
pub fn encrypt_blocks_js(blocks: Box<[Block]>, size: usize) -> Vec<u8> {
    encrypt_blocks(&blocks, size)
}

#[cfg_attr(
    feature = "wasm",
    derive(tsify::Tsify, serde::Serialize, serde::Deserialize)
)]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[derive(Debug, Clone, Hash)]
pub struct Block {
    key: u32,
    data: BlockData,
}

impl Block {
    pub const fn new(key: u32, data: BlockData) -> Self {
        Self { key, data }
    }

    pub const fn key(&self) -> u32 {
        self.key
    }

    pub fn into_data(self) -> BlockData {
        self.data
    }

    fn read_encrypted(reader: &mut Reader) -> Result<Self, InvalidTypeId> {
        let key = reader.read_u32();

        let mut crypto_state = SwishCrypto::new(key);
        let block_type = BlockType::try_from(reader.read_u8() ^ crypto_state.next_u8())?;

        let data = match block_type {
            BlockType::Scalar(ScalarType::Bool(bool_type)) => BlockData::Bool(bool_type),
            BlockType::Scalar(ScalarType::Numeric(numeric_type)) => {
                let type_size = numeric_type.byte_size();
                let mut payload_bytes = reader.read_bytes(type_size);

                for byte in payload_bytes.iter_mut() {
                    *byte ^= crypto_state.next_u8();
                }

                BlockData::Value {
                    dataype: numeric_type,
                    bytes: payload_bytes,
                }
            }
            BlockType::Object => {
                let byte_count = (reader.read_u32() ^ crypto_state.next_32()) as usize;
                let mut payload_bytes = reader.read_bytes(byte_count);

                for byte in payload_bytes.iter_mut() {
                    *byte ^= crypto_state.next_u8();
                }

                BlockData::object(payload_bytes)
            }
            BlockType::Array => {
                let entry_count = (reader.read_u32() ^ crypto_state.next_32()) as usize;
                let subtype = ScalarType::try_from(reader.read_u8() ^ crypto_state.next_u8())?;

                let byte_count = entry_count * subtype.byte_size();
                let mut payload_bytes = reader.read_bytes(byte_count);

                for byte in payload_bytes.iter_mut() {
                    *byte ^= crypto_state.next_u8();
                }

                BlockData::array(payload_bytes, subtype)
            }
        };

        Ok(Self { key, data })
    }

    fn write_encrypted(&self, writer: &mut Writer) -> usize {
        writer.write_u32(self.key);

        let mut crypto_state = SwishCrypto::new(self.key);

        writer.write_u8(self.data.type_id() ^ crypto_state.next_u8());

        if let BlockData::Object(ObjectBlock { bytes }) = &self.data {
            let payload_size_xored = (bytes.len() as u32) ^ crypto_state.next_32();

            writer.write_u32(payload_size_xored);
        } else if let BlockData::Array(ArrayBlock { bytes, subtype }) = &self.data {
            let entry_count = bytes.len() / subtype.byte_size();
            let entry_count_xored = (entry_count as u32) ^ crypto_state.next_32();

            writer.write_u32(entry_count_xored);

            let subtype_xored = subtype.id() ^ crypto_state.next_u8();
            writer.write_u8(subtype_xored);
        }

        let payload = match &self.data {
            BlockData::Bool(..) => &Vec::new(),
            BlockData::Object(ObjectBlock { bytes }) => bytes,
            BlockData::Array(ArrayBlock { bytes, .. }) => bytes,
            BlockData::Value { bytes, .. } => bytes,
        };

        for byte in payload {
            writer.write_u8(*byte ^ crypto_state.next_u8());
        }

        writer.current_offset()
    }
}

#[cfg_attr(feature = "wasm", derive(tsify::Tsify, serde::Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Debug)]
pub struct InvalidTypeId(u8);

impl std::fmt::Display for InvalidTypeId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&format!(
            "swish crypto block has invalid type id: {}",
            self.0
        ))
    }
}

impl std::error::Error for InvalidTypeId {}

impl From<InvalidTypeId> for Error {
    fn from(value: InvalidTypeId) -> Self {
        Error::build_save("Invalid block type id".to_owned(), Some(Box::new(value)))
    }
}

#[cfg_attr(
    feature = "wasm",
    derive(tsify::Tsify, serde::Serialize, serde::Deserialize)
)]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[derive(Clone, Copy, PartialEq, Eq, Debug, Hash)]
pub enum BoolType {
    Bool1,
    Bool2,
    Bool3,
}

impl BoolType {
    pub const fn id(&self) -> u8 {
        match self {
            BoolType::Bool1 => 1,
            BoolType::Bool2 => 2,
            BoolType::Bool3 => 3,
        }
    }
}

#[derive(
    Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize, tsify::Tsify, Hash,
)]
pub enum NumericType {
    UInt8,
    UInt16,
    UInt32,
    UInt64,

    Int8,
    Int16,
    Int32,
    Int64,

    Float32,
    Float64,
}

impl NumericType {
    pub const fn id(&self) -> u8 {
        match self {
            Self::UInt8 => 8,
            Self::UInt16 => 9,
            Self::UInt32 => 10,
            Self::UInt64 => 11,

            Self::Int8 => 12,
            Self::Int16 => 13,
            Self::Int32 => 14,
            Self::Int64 => 15,

            Self::Float32 => 16,
            Self::Float64 => 17,
        }
    }

    pub const fn byte_size(&self) -> usize {
        match self {
            Self::UInt8 => 1,
            Self::UInt16 => 2,
            Self::UInt32 => 4,
            Self::UInt64 => 8,

            Self::Int8 => 1,
            Self::Int16 => 2,
            Self::Int32 => 4,
            Self::Int64 => 8,

            Self::Float32 => 4,
            Self::Float64 => 8,
        }
    }
}

#[cfg_attr(
    feature = "wasm",
    derive(tsify::Tsify, serde::Serialize, serde::Deserialize)
)]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[derive(Debug, Clone, Hash)]
pub enum BlockData {
    Bool(BoolType),
    Object(ObjectBlock),
    Array(ArrayBlock),
    Value {
        dataype: NumericType,
        #[serde(with = "serde_bytes")]
        #[tsify(type = "Uint8Array<ArrayBuffer>")]
        bytes: Vec<u8>,
    },
}

impl BlockData {
    pub const fn object(bytes: Vec<u8>) -> Self {
        Self::Object(ObjectBlock { bytes })
    }

    pub const fn array(bytes: Vec<u8>, subtype: ScalarType) -> Self {
        Self::Array(ArrayBlock { bytes, subtype })
    }

    pub const fn block_type(&self) -> BlockType {
        match self {
            BlockData::Bool(bool_type) => BlockType::Scalar(ScalarType::Bool(*bool_type)),
            BlockData::Object(_) => BlockType::Object,
            BlockData::Array(_) => BlockType::Array,
            BlockData::Value { dataype, bytes: _ } => {
                BlockType::Scalar(ScalarType::Numeric(*dataype))
            }
        }
    }

    pub const fn type_id(&self) -> u8 {
        match self {
            Self::Object { .. } => 4,
            Self::Array { .. } => 5,
            Self::Bool(bool_type) => bool_type.id(),
            Self::Value { dataype, .. } => dataype.id(),
        }
    }
}

#[cfg_attr(
    feature = "wasm",
    derive(tsify::Tsify, serde::Serialize, serde::Deserialize)
)]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[derive(Debug, Clone, Hash)]
pub struct ObjectBlock {
    #[serde(with = "serde_bytes")]
    #[tsify(type = "Uint8Array<ArrayBuffer>")]
    bytes: Vec<u8>,
}

impl ObjectBlock {
    pub fn bytes(&self) -> &[u8] {
        &self.bytes
    }

    pub fn bytes_mut(&mut self) -> &mut [u8] {
        &mut self.bytes
    }
}

#[cfg_attr(
    feature = "wasm",
    derive(tsify::Tsify, serde::Serialize, serde::Deserialize)
)]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[derive(Debug, Clone, Hash)]
pub struct ArrayBlock {
    #[serde(with = "serde_bytes")]
    #[tsify(type = "Uint8Array<ArrayBuffer>")]
    bytes: Vec<u8>,
    subtype: ScalarType,
}

impl ArrayBlock {
    pub fn bytes(&self) -> &[u8] {
        &self.bytes
    }

    pub fn bytes_mut(&mut self) -> &mut [u8] {
        &mut self.bytes
    }
}

#[derive(Clone, Copy)]
struct SwishCrypto {
    counter: u32,
    state: u32,
}

impl SwishCrypto {
    pub fn new(initial_state: u32) -> Self {
        let ones = initial_state.count_ones();
        let mut state = initial_state;
        for _ in 0..ones {
            state = xor_shift_advance(state)
        }

        Self { counter: 0, state }
    }

    pub const fn next_u8(&mut self) -> u8 {
        let result = (self.state >> (self.counter << 3)) as u8;

        if self.counter == 3 {
            self.state = xor_shift_advance(self.state);
            self.counter = 0;
        } else {
            self.counter += 1;
        }

        result
    }

    pub const fn next_32(&mut self) -> u32 {
        (self.next_u8() as u32)
            | ((self.next_u8() as u32) << 8)
            | ((self.next_u8() as u32) << 16)
            | ((self.next_u8() as u32) << 24)
    }
}

const fn xor_shift_advance(state: u32) -> u32 {
    let mut state = state;
    state ^= state << 2;
    state ^= state >> 15;
    state ^= state << 13;

    state
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize, tsify::Tsify)]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum BlockType {
    Object,
    Array,
    Scalar(ScalarType),
}

impl BlockType {
    pub const fn id(&self) -> u8 {
        match self {
            Self::Object => 4,
            Self::Array => 5,
            Self::Scalar(scalar) => scalar.id(),
        }
    }
}

impl TryFrom<u8> for BlockType {
    type Error = InvalidTypeId;

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        match value {
            4 => Ok(Self::Object),
            5 => Ok(Self::Array),
            _ => Ok(Self::Scalar(value.try_into()?)),
        }
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = blockTypeIndex)]
#[allow(clippy::missing_const_for_fn)]
pub fn block_type_index(type_id: BlockType) -> u8 {
    type_id.id()
}

#[derive(
    Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize, tsify::Tsify, Hash,
)]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum ScalarType {
    Bool(BoolType),
    Numeric(NumericType),
}

impl ScalarType {
    pub const fn id(&self) -> u8 {
        match self {
            Self::Bool(bool_type) => bool_type.id(),
            Self::Numeric(numeric_type) => numeric_type.id(),
        }
    }

    pub const fn byte_size(&self) -> usize {
        match self {
            Self::Bool(..) => 1,
            Self::Numeric(numeric_type) => numeric_type.byte_size(),
        }
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = scalarTypeSize)]
#[allow(clippy::missing_const_for_fn)]
pub fn scalar_type_size(type_id: ScalarType) -> usize {
    type_id.byte_size()
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = scalarTypeIndex)]
#[allow(clippy::missing_const_for_fn)]
pub fn scalar_type_index(type_id: ScalarType) -> u8 {
    type_id.id()
}

impl TryFrom<u8> for ScalarType {
    type Error = InvalidTypeId;

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        match value {
            1 => Ok(Self::Bool(BoolType::Bool1)),
            2 => Ok(Self::Bool(BoolType::Bool2)),
            3 => Ok(Self::Bool(BoolType::Bool3)),

            8 => Ok(Self::Numeric(NumericType::UInt8)),
            9 => Ok(Self::Numeric(NumericType::UInt16)),
            10 => Ok(Self::Numeric(NumericType::UInt32)),
            11 => Ok(Self::Numeric(NumericType::UInt64)),

            12 => Ok(Self::Numeric(NumericType::Int8)),
            13 => Ok(Self::Numeric(NumericType::Int16)),
            14 => Ok(Self::Numeric(NumericType::Int32)),
            15 => Ok(Self::Numeric(NumericType::Int64)),

            16 => Ok(Self::Numeric(NumericType::Float32)),
            17 => Ok(Self::Numeric(NumericType::Float64)),

            _ => Err(InvalidTypeId(value)),
        }
    }
}
