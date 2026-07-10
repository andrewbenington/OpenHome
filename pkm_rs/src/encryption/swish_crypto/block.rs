use pkm_rs_types::read_u32_le;

use wasm_bindgen::prelude::*;

use crate::bytes::Writer;

const STATIC_XOR_PAD: [u8; 128] = [
    0xa0, 0x92, 0xd1, 0x06, 0x07, 0xdb, 0x32, 0xa1, 0xae, 0x01, 0xf5, 0xc5, 0x1e, 0x84, 0x4f, 0xe3,
    0x53, 0xca, 0x37, 0xf4, 0xa7, 0xb0, 0x4d, 0xa0, 0x18, 0xb7, 0xc2, 0x97, 0xda, 0x5f, 0x53, 0x2b,
    0x75, 0xfa, 0x48, 0x16, 0xf8, 0xd4, 0x8a, 0x6f, 0x61, 0x05, 0xf4, 0xe2, 0xfd, 0x04, 0xb5, 0xa3,
    0x0f, 0xfc, 0x44, 0x92, 0xcb, 0x32, 0xe6, 0x1b, 0xb9, 0xb1, 0x2e, 0x01, 0xb0, 0x56, 0x53, 0x36,
    0xd2, 0xd1, 0x50, 0x3d, 0xde, 0x5b, 0x2e, 0x0e, 0x52, 0xfd, 0xdf, 0x2f, 0x7b, 0xca, 0x63, 0x50,
    0xa4, 0x67, 0x5d, 0x23, 0x17, 0xc0, 0x52, 0xe1, 0xa6, 0x30, 0x7c, 0x2b, 0xb6, 0x70, 0x36, 0x5b,
    0x2a, 0x27, 0x69, 0x33, 0xf5, 0x63, 0x7b, 0x36, 0x3f, 0x26, 0x9b, 0xa3, 0xed, 0x7a, 0x53, 0x00,
    0xa4, 0x48, 0xb3, 0x50, 0x9e, 0x14, 0xa0, 0x52, 0xde, 0x7e, 0x10, 0x2b, 0x1b, 0x77, 0x6e, 0,
];

fn crypt_static_xor_pad_bytes(data: &[u8]) -> Box<[u8]> {
    let size = STATIC_XOR_PAD.len() - 1;
    let mut iterations_remaining = (data.len() - 1) / size;
    let mut after_xor = vec![0u8; data.len()];
    let mut current_pos = 0usize;

    loop {
        let current_slice = &mut data[current_pos..current_pos + STATIC_XOR_PAD.len()].to_vec();

        for (val, pad) in current_slice.iter_mut().zip(STATIC_XOR_PAD) {
            *val ^= pad
        }

        after_xor[current_pos..current_pos + current_slice.len()].copy_from_slice(current_slice);
        current_pos += size;
        iterations_remaining -= 1;

        if iterations_remaining == 0 {
            break;
        }
    }

    for i in 0..(data.len() - current_pos) {
        after_xor[current_pos + i] =
            data[current_pos + i] ^ STATIC_XOR_PAD[i % STATIC_XOR_PAD.len()]
    }

    after_xor.into_boxed_slice()
}

fn read_blocks(data: &[u8]) -> Result<Vec<Block>, InvalidTypeId> {
    let mut offset: usize = 0;
    let mut result = Vec::<Block>::new();

    while offset < data.len() {
        let (block, new_offset) = Block::build(data, offset)?;
        result.push(block);
        offset = new_offset;
    }

    Ok(result)
}

#[wasm_bindgen(js_name = decryptBlocks)]
pub fn decrypt_blocks(data: &[u8]) -> Result<Vec<Block>, InvalidTypeId> {
    let data_before_hash = &data[..data.len() - super::SIZE_HASH];
    let data_after_xor = crypt_static_xor_pad_bytes(data_before_hash);

    read_blocks(&data_after_xor)
}

#[wasm_bindgen(js_name = writeBlock)]
pub fn write_block(block: &Block, bytes: &mut [u8], offset: usize) -> usize {
    let mut writer = Writer::new(bytes, offset);

    writer.write_u32(block.key);

    let mut xor_shift_32 = XorShift32::new(block.key);

    writer.write_u8(block.type_id.index() ^ xor_shift_32.next());

    if let BlockData::Object { bytes } = &block.data {
        let payload_size_xored = (bytes.len() as u32) ^ xor_shift_32.next_32();

        writer.write_u32(payload_size_xored);
    } else if let BlockData::Array { bytes, subtype } = &block.data {
        let entry_count = bytes.len() / subtype.byte_size();
        let entry_count_xored = (entry_count as u32) ^ xor_shift_32.next_32();

        writer.write_u32(entry_count_xored);

        let subtype_xored = (*subtype as u8) ^ xor_shift_32.next();
        writer.write_u8(subtype_xored);
    }

    let payload = match &block.data {
        BlockData::Bool => &Vec::new(),
        BlockData::Object { bytes } => bytes,
        BlockData::Array { bytes, .. } => bytes,
        BlockData::Value { bytes } => bytes,
    };

    for byte in payload {
        writer.write_u8(*byte ^ xor_shift_32.next());
    }

    writer.current_offset()
}

fn write_blocks(blocks: &[Block], size: usize) -> Vec<u8> {
    let mut buffer = vec![0u8; size];
    let mut offset: usize = 0;

    for block in blocks {
        offset = write_block(block, &mut buffer, offset)
    }

    buffer[..offset].to_vec()
}

fn encrypt_blocks(blocks: &[Block], size: usize) -> Vec<u8> {
    let encrypted_blocks = write_blocks(blocks, size);
    let mut encrypted_bytes = crypt_static_xor_pad_bytes(&encrypted_blocks).to_vec();

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
pub struct Block {
    key: u32,
    type_id: BlockTypeId,
    data: BlockData,
}

type NewOffset = usize;

#[cfg_attr(feature = "wasm", derive(tsify::Tsify, serde::Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
pub struct InvalidTypeId(u8);

impl Block {
    fn build(bytes: &[u8], offset: usize) -> Result<(Self, NewOffset), InvalidTypeId> {
        let key = read_u32_le!(bytes, offset);

        let mut offset = offset + 4;
        let mut xor_shift = XorShift32::new(key);
        let type_id = BlockTypeId::try_from(bytes[offset] ^ xor_shift.next())?;

        offset += 1;

        let data = match type_id {
            BlockTypeId::Scalar(
                ScalarTypeId::Bool1 | ScalarTypeId::Bool2 | ScalarTypeId::Bool3,
            ) => BlockData::Bool,
            BlockTypeId::Object => {
                let byte_count = (read_u32_le!(bytes, offset) ^ xor_shift.next_32()) as usize;

                offset += 4;

                let mut slice = bytes[offset..offset + byte_count].to_vec();
                offset += byte_count;

                for byte in slice.iter_mut() {
                    *byte ^= xor_shift.next();
                }

                BlockData::Object { bytes: slice }
            }
            BlockTypeId::Array => {
                let entry_count = (read_u32_le!(bytes, offset) ^ xor_shift.next_32()) as usize;
                offset += 4;

                let subtype = ScalarTypeId::try_from(bytes[offset] ^ xor_shift.next())?;
                offset += 1;

                let byte_count = entry_count * subtype.byte_size();

                let mut slice = bytes[offset..offset + byte_count].to_vec();
                offset += byte_count;

                for byte in slice.iter_mut() {
                    *byte ^= xor_shift.next();
                }

                BlockData::Array {
                    bytes: slice,
                    subtype,
                }
            }
            BlockTypeId::Scalar(scalar_type) => {
                let type_size = scalar_type.byte_size();
                let mut slice = bytes[offset..offset + type_size].to_vec();
                offset += type_size;

                for byte in slice.iter_mut() {
                    *byte ^= xor_shift.next();
                }

                BlockData::Value { bytes: slice }
            }
        };

        let block = Block { key, type_id, data };

        Ok((block, offset))
    }
}

#[cfg_attr(
    feature = "wasm",
    derive(tsify::Tsify, serde::Serialize, serde::Deserialize)
)]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
enum BlockData {
    Bool,
    Object {
        #[serde(with = "serde_bytes")]
        #[tsify(type = "Uint8Array<ArrayBuffer>")]
        bytes: Vec<u8>,
    },
    Array {
        #[serde(with = "serde_bytes")]
        #[tsify(type = "Uint8Array<ArrayBuffer>")]
        bytes: Vec<u8>,
        subtype: ScalarTypeId,
    },
    Value {
        #[serde(with = "serde_bytes")]
        #[tsify(type = "Uint8Array<ArrayBuffer>")]
        bytes: Vec<u8>,
    },
}

struct XorShift32 {
    counter: u32,
    state: u32,
}

impl XorShift32 {
    pub fn new(initial_state: u32) -> Self {
        let ones = initial_state.count_ones();
        let mut state = initial_state;
        for _ in 0..ones {
            state = xor_shift_advance(state)
        }

        Self { counter: 0, state }
    }

    pub const fn next(&mut self) -> u8 {
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
        (self.next() as u32)
            | ((self.next() as u32) << 8)
            | ((self.next() as u32) << 16)
            | ((self.next() as u32) << 24)
    }
}

const fn xor_shift_advance(state: u32) -> u32 {
    let mut state = state;
    state ^= state << 2;
    state ^= state >> 15;
    state ^= state << 13;

    state
}

#[derive(Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize, tsify::Tsify)]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum BlockTypeId {
    Object,
    Array,
    Scalar(ScalarTypeId),
}

impl BlockTypeId {
    pub const fn index(&self) -> u8 {
        match self {
            Self::Object => 4,
            Self::Array => 5,
            Self::Scalar(scalar) => *scalar as u8,
        }
    }
}

impl TryFrom<u8> for BlockTypeId {
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
pub fn block_type_index(type_id: BlockTypeId) -> u8 {
    type_id.index()
}

#[derive(Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize, tsify::Tsify)]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum ScalarTypeId {
    Bool1 = 1,
    Bool2 = 2,
    Bool3 = 3,

    UInt8 = 8,
    UInt16 = 9,
    UInt32 = 10,
    UInt64 = 11,

    Int8 = 12,
    Int16 = 13,
    Int32 = 14,
    Int64 = 15,

    Float32 = 16,
    Float64 = 17,
}

impl ScalarTypeId {
    pub const fn byte_size(&self) -> usize {
        match self {
            Self::Bool1 | Self::Bool2 | Self::Bool3 => 1,
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

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = scalarTypeSize)]
#[allow(clippy::missing_const_for_fn)]
pub fn scalar_type_size(type_id: ScalarTypeId) -> usize {
    type_id.byte_size()
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = scalarTypeIndex)]
#[allow(clippy::missing_const_for_fn)]
pub fn scalar_type_index(type_id: ScalarTypeId) -> u8 {
    type_id as u8
}

impl TryFrom<u8> for ScalarTypeId {
    type Error = InvalidTypeId;

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        match value {
            1 => Ok(Self::Bool1),
            2 => Ok(Self::Bool2),
            3 => Ok(Self::Bool3),

            8 => Ok(Self::UInt8),
            9 => Ok(Self::UInt16),
            10 => Ok(Self::UInt32),
            11 => Ok(Self::UInt64),

            12 => Ok(Self::Int8),
            13 => Ok(Self::Int16),
            14 => Ok(Self::Int32),
            15 => Ok(Self::Int64),

            16 => Ok(Self::Float32),
            17 => Ok(Self::Float64),

            _ => Err(InvalidTypeId(value)),
        }
    }
}
