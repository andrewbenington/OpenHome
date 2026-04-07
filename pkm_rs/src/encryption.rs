use std::ops::Range;

#[cfg(feature = "wasm")]
use aes::{
    Aes128,
    cipher::{BlockEncrypt, KeyInit, generic_array::GenericArray},
};
#[cfg(feature = "wasm")]
use num::{BigInt, bigint::Sign};
#[cfg(feature = "wasm")]
use sha1::{Digest as Sha1Digest, Sha1};

#[cfg(feature = "wasm")]
use sha2::Sha256;

const ENCRYPTION_OFFSET: usize = 8;
const STARTING_SEED: u32 = 0x41c64e6d;
const GEN_67_BLOCK_SIZE: usize = 0x38;
const STANDARD_BLOCKS_OFFSET: usize = 0x08;

const GEN_67_MIN_SIZE: usize = STANDARD_BLOCKS_OFFSET + 4 * GEN_67_BLOCK_SIZE;

pub const SHUFFLE_BLOCK_ORDERS: [[usize; 4]; 24] = [
    [0, 1, 2, 3],
    [0, 1, 3, 2],
    [0, 2, 1, 3],
    [0, 2, 3, 1],
    [0, 3, 1, 2],
    [0, 3, 2, 1],
    [1, 0, 2, 3],
    [1, 0, 3, 2],
    [1, 2, 0, 3],
    [1, 2, 3, 0],
    [1, 3, 0, 2],
    [1, 3, 2, 0],
    [2, 0, 1, 3],
    [2, 0, 3, 1],
    [2, 1, 0, 3],
    [2, 1, 3, 0],
    [2, 3, 0, 1],
    [2, 3, 1, 0],
    [3, 0, 1, 2],
    [3, 0, 2, 1],
    [3, 1, 0, 2],
    [3, 1, 2, 0],
    [3, 2, 0, 1],
    [3, 2, 1, 0],
];

pub const UNSHUFFLE_BLOCK_ORDERS: [[usize; 4]; 24] = [
    [0, 1, 2, 3],
    [0, 1, 3, 2],
    [0, 2, 1, 3],
    [0, 3, 1, 2],
    [0, 2, 3, 1],
    [0, 3, 2, 1],
    [1, 0, 2, 3],
    [1, 0, 3, 2],
    [2, 0, 1, 3],
    [3, 0, 1, 2],
    [2, 0, 3, 1],
    [3, 0, 2, 1],
    [1, 2, 0, 3],
    [1, 3, 0, 2],
    [2, 1, 0, 3],
    [3, 1, 0, 2],
    [2, 3, 0, 1],
    [3, 2, 0, 1],
    [1, 2, 3, 0],
    [1, 3, 2, 0],
    [2, 1, 3, 0],
    [3, 1, 2, 0],
    [2, 3, 1, 0],
    [3, 2, 1, 0],
];

struct BlockRange {
    pub start: usize,
    pub end: usize,
}

impl BlockRange {
    pub const fn new(start: usize, end: usize) -> Self {
        Self { start, end }
    }

    pub const fn next(&self, size: usize) -> BlockRange {
        BlockRange {
            start: self.end,
            end: self.end + size,
        }
    }

    pub const fn to_range(&self) -> Range<usize> {
        self.start..self.end
    }
}

fn unshuffle_blocks(bytes: &[u8], offset: usize, shift_value: usize, block_size: usize) -> Vec<u8> {
    rearrange_blocks(
        bytes,
        offset,
        shift_value,
        block_size,
        UNSHUFFLE_BLOCK_ORDERS,
    )
}

fn shuffle_blocks(bytes: &[u8], offset: usize, shift_value: usize, block_size: usize) -> Vec<u8> {
    rearrange_blocks(bytes, offset, shift_value, block_size, SHUFFLE_BLOCK_ORDERS)
}

fn rearrange_blocks(
    bytes: &[u8],
    offset: usize,
    shift_value: usize,
    block_size: usize,
    orders: [[usize; 4]; 24],
) -> Vec<u8> {
    let block_order = orders[shift_value];

    let block_1 = BlockRange::new(offset, offset + block_size);
    let block_2 = block_1.next(block_size);
    let block_3 = block_2.next(block_size);
    let block_4 = block_3.next(block_size);

    let shuffled_blocks: [&BlockRange; 4] = [&block_1, &block_2, &block_3, &block_4];

    let growth_range = shuffled_blocks[block_order[0]].to_range();
    let growth_bytes = &bytes[growth_range];

    let attack_range = shuffled_blocks[block_order[1]].to_range();
    let attack_bytes = &bytes[attack_range];

    let stats_range = shuffled_blocks[block_order[2]].to_range();
    let stats_bytes = &bytes[stats_range];

    let misc_range = shuffled_blocks[block_order[3]].to_range();
    let misc_bytes = &bytes[misc_range];

    let mut unshuffled_bytes = vec![0u8; bytes.len()];

    unshuffled_bytes[0..offset].copy_from_slice(&bytes[0..offset]);
    unshuffled_bytes[block_1.to_range()].copy_from_slice(growth_bytes);
    unshuffled_bytes[block_2.to_range()].copy_from_slice(attack_bytes);
    unshuffled_bytes[block_3.to_range()].copy_from_slice(stats_bytes);
    unshuffled_bytes[block_4.to_range()].copy_from_slice(misc_bytes);
    unshuffled_bytes[block_4.end..bytes.len()].copy_from_slice(&bytes[block_4.end..bytes.len()]);

    unshuffled_bytes
}

pub fn shuffle_blocks_gen_6_7(bytes: &[u8]) -> Vec<u8> {
    let length = bytes.len();
    if length < GEN_67_MIN_SIZE {
        panic!("shuffle_blocks_gen_6_7: buffer size {length} is too small",);
    }

    let encryption_constant = u32::from_le_bytes(bytes[0..4].try_into().unwrap());
    let shift_value = (((encryption_constant & 0x3e000) >> 0xd) % 24) as usize;

    shuffle_blocks(bytes, ENCRYPTION_OFFSET, shift_value, GEN_67_BLOCK_SIZE)
}

pub(crate) fn unshuffle_blocks_gen_6_7(bytes: &[u8]) -> Vec<u8> {
    let length = bytes.len();
    if length < GEN_67_MIN_SIZE {
        panic!("unshuffle_blocks_gen_6_7: buffer size {length} is too small",);
    }

    let encryption_constant = u32::from_le_bytes(bytes[0..4].try_into().unwrap());
    let shift_value = (((encryption_constant & 0x3e000) >> 0xd) % 24) as usize;

    unshuffle_blocks(bytes, ENCRYPTION_OFFSET, shift_value, GEN_67_BLOCK_SIZE)
}

fn decrypt_pkm_blocks(bytes: &[u8], seed: u32, block_size: usize) -> Vec<u8> {
    decrypt_pkm_bytes(
        bytes,
        seed,
        ENCRYPTION_OFFSET,
        ENCRYPTION_OFFSET + 4 * block_size,
    )
}

fn decrypt_pkm_bytes(bytes: &[u8], seed: u32, start: usize, end: usize) -> Vec<u8> {
    let mut decrypted_bytes = Vec::<u8>::from(bytes);
    let mut current_seed = seed;
    for i in (start..end).step_by(2) {
        current_seed = current_seed
            .wrapping_mul(STARTING_SEED)
            .wrapping_add(0x6073);
        let xor_value: u16 = (current_seed >> 16) as u16;
        let decrypted_word = u16::from_le_bytes(bytes[i..i + 2].try_into().unwrap()) ^ xor_value;
        decrypted_bytes[i..i + 2].copy_from_slice(&decrypted_word.to_le_bytes());
    }
    decrypted_bytes
}

pub(crate) fn decrypt_pkm_bytes_gen_6_7(bytes: &[u8]) -> Vec<u8> {
    let length = bytes.len();
    if length < GEN_67_MIN_SIZE {
        panic!("decrypt_pkm_bytes_gen_6_7: buffer size {length} is too small",);
    }
    let encryption_constant = u32::from_le_bytes(bytes[0..4].try_into().unwrap());
    decrypt_pkm_blocks(bytes, encryption_constant, GEN_67_BLOCK_SIZE)
}

// const CRC16_SEED_TABLE: [u16; 256] = [
//     0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7, 0x8108, 0x9129, 0xa14a, 0xb16b,
//     0xc18c, 0xd1ad, 0xe1ce, 0xf1ef, 0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
//     0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de, 0x2462, 0x3443, 0x0420, 0x1401,
//     0x64e6, 0x74c7, 0x44a4, 0x5485, 0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
//     0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4, 0xb75b, 0xa77a, 0x9719, 0x8738,
//     0xf7df, 0xe7fe, 0xd79d, 0xc7bc, 0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
//     0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b, 0x5af5, 0x4ad4, 0x7ab7, 0x6a96,
//     0x1a71, 0x0a50, 0x3a33, 0x2a12, 0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
//     0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41, 0xedae, 0xfd8f, 0xcdec, 0xddcd,
//     0xad2a, 0xbd0b, 0x8d68, 0x9d49, 0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70,
//     0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78, 0x9188, 0x81a9, 0xb1ca, 0xa1eb,
//     0xd10c, 0xc12d, 0xf14e, 0xe16f, 0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
//     0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e, 0x02b1, 0x1290, 0x22f3, 0x32d2,
//     0x4235, 0x5214, 0x6277, 0x7256, 0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
//     0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405, 0xa7db, 0xb7fa, 0x8799, 0x97b8,
//     0xe75f, 0xf77e, 0xc71d, 0xd73c, 0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
//     0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab, 0x5844, 0x4865, 0x7806, 0x6827,
//     0x18c0, 0x08e1, 0x3882, 0x28a3, 0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
//     0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92, 0xfd2e, 0xed0f, 0xdd6c, 0xcd4d,
//     0xbdaa, 0xad8b, 0x9de8, 0x8dc9, 0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1,
//     0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8, 0x6e17, 0x7e36, 0x4e55, 0x5e74,
//     0x2e93, 0x3eb2, 0x0ed1, 0x1ef0,
// ];

#[cfg(feature = "wasm")]
const CRC16_SEED_TABLE_INVERT: [u16; 256] = [
    0x0000, 0xc0c1, 0xc181, 0x0140, 0xc301, 0x03c0, 0x0280, 0xc241, 0xc601, 0x06c0, 0x0780, 0xc741,
    0x0500, 0xc5c1, 0xc481, 0x0440, 0xcc01, 0x0cc0, 0x0d80, 0xcd41, 0x0f00, 0xcfc1, 0xce81, 0x0e40,
    0x0a00, 0xcac1, 0xcb81, 0x0b40, 0xc901, 0x09c0, 0x0880, 0xc841, 0xd801, 0x18c0, 0x1980, 0xd941,
    0x1b00, 0xdbc1, 0xda81, 0x1a40, 0x1e00, 0xdec1, 0xdf81, 0x1f40, 0xdd01, 0x1dc0, 0x1c80, 0xdc41,
    0x1400, 0xd4c1, 0xd581, 0x1540, 0xd701, 0x17c0, 0x1680, 0xd641, 0xd201, 0x12c0, 0x1380, 0xd341,
    0x1100, 0xd1c1, 0xd081, 0x1040, 0xf001, 0x30c0, 0x3180, 0xf141, 0x3300, 0xf3c1, 0xf281, 0x3240,
    0x3600, 0xf6c1, 0xf781, 0x3740, 0xf501, 0x35c0, 0x3480, 0xf441, 0x3c00, 0xfcc1, 0xfd81, 0x3d40,
    0xff01, 0x3fc0, 0x3e80, 0xfe41, 0xfa01, 0x3ac0, 0x3b80, 0xfb41, 0x3900, 0xf9c1, 0xf881, 0x3840,
    0x2800, 0xe8c1, 0xe981, 0x2940, 0xeb01, 0x2bc0, 0x2a80, 0xea41, 0xee01, 0x2ec0, 0x2f80, 0xef41,
    0x2d00, 0xedc1, 0xec81, 0x2c40, 0xe401, 0x24c0, 0x2580, 0xe541, 0x2700, 0xe7c1, 0xe681, 0x2640,
    0x2200, 0xe2c1, 0xe381, 0x2340, 0xe101, 0x21c0, 0x2080, 0xe041, 0xa001, 0x60c0, 0x6180, 0xa141,
    0x6300, 0xa3c1, 0xa281, 0x6240, 0x6600, 0xa6c1, 0xa781, 0x6740, 0xa501, 0x65c0, 0x6480, 0xa441,
    0x6c00, 0xacc1, 0xad81, 0x6d40, 0xaf01, 0x6fc0, 0x6e80, 0xae41, 0xaa01, 0x6ac0, 0x6b80, 0xab41,
    0x6900, 0xa9c1, 0xa881, 0x6840, 0x7800, 0xb8c1, 0xb981, 0x7940, 0xbb01, 0x7bc0, 0x7a80, 0xba41,
    0xbe01, 0x7ec0, 0x7f80, 0xbf41, 0x7d00, 0xbdc1, 0xbc81, 0x7c40, 0xb401, 0x74c0, 0x7580, 0xb541,
    0x7700, 0xb7c1, 0xb681, 0x7640, 0x7200, 0xb2c1, 0xb381, 0x7340, 0xb101, 0x71c0, 0x7080, 0xb041,
    0x5000, 0x90c1, 0x9181, 0x5140, 0x9301, 0x53c0, 0x5280, 0x9241, 0x9601, 0x56c0, 0x5780, 0x9741,
    0x5500, 0x95c1, 0x9481, 0x5440, 0x9c01, 0x5cc0, 0x5d80, 0x9d41, 0x5f00, 0x9fc1, 0x9e81, 0x5e40,
    0x5a00, 0x9ac1, 0x9b81, 0x5b40, 0x9901, 0x59c0, 0x5880, 0x9841, 0x8801, 0x48c0, 0x4980, 0x8941,
    0x4b00, 0x8bc1, 0x8a81, 0x4a40, 0x4e00, 0x8ec1, 0x8f81, 0x4f40, 0x8d01, 0x4dc0, 0x4c80, 0x8c41,
    0x4400, 0x84c1, 0x8581, 0x4540, 0x8701, 0x47c0, 0x4680, 0x8641, 0x8201, 0x42c0, 0x4380, 0x8341,
    0x4100, 0x81c1, 0x8081, 0x4040,
];

// pub fn crc16_ccitt(bytes: &[u8], start: usize, size: usize, initial: u16) -> u16 {
//     let mut checksum = initial;

//     for byte in bytes.iter().skip(start).take(size) {
//         let seed_index = ((*byte as u16) ^ (checksum >> 8)) as usize;

//         checksum = (checksum << 8) ^ CRC16_SEED_TABLE[seed_index];
//     }

//     checksum
// }

#[cfg(feature = "wasm")]
pub fn crc16_ccitt_invert(bytes: &[u8], start: usize, size: usize) -> u16 {
    let mut checksum = 0xffffu16;

    for byte in bytes.iter().skip(start).take(size) {
        let seed_index = (*byte ^ (checksum as u8)) as usize;

        checksum = (checksum >> 8) ^ CRC16_SEED_TABLE_INVERT[seed_index];
    }

    !checksum
}

// pub fn crc16_ccitt_no_invert(bytes: &[u8], start: usize, size: usize) -> u16 {
//     crc16_ccitt(bytes, start, size, 0)
// }

#[cfg(feature = "wasm")]
pub trait Crc16CcittInvertChecksum {
    const RANGE_START: usize;
    const RANGE_SIZE: usize;

    fn get_bytes(&self) -> &[u8];

    fn calc_checksum(&self) -> u16 {
        crc16_ccitt_invert(self.get_bytes(), Self::RANGE_START, Self::RANGE_SIZE)
    }
}

#[cfg(feature = "wasm")]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MemeCrypto {
    SunMoon,
    UltraSunUltraMoon,
}

#[cfg(feature = "wasm")]
impl MemeCrypto {
    pub const fn checksum_signature_length(&self) -> usize {
        match self {
            Self::SunMoon => 0x140,
            Self::UltraSunUltraMoon => 0x150,
        }
    }

    pub const fn meme_crypto_offset(&self) -> usize {
        (match self {
            Self::SunMoon => 0x6ba00,
            Self::UltraSunUltraMoon => 0x6c000,
        }) + SAVE_FILE_SIGNATURE_OFFSET
    }

    #[cfg(feature = "wasm")]
    pub fn sign_in_place(&self, bytes: &mut [u8]) {
        sign_with_meme_crypto(bytes, *self);
    }
}

#[cfg(feature = "wasm")]
const SAVE_FILE_SIGNATURE_OFFSET: usize = 0x100;
#[cfg(feature = "wasm")]
const MEME_SIGNATURE_LENGTH: usize = 0x80;

#[cfg(feature = "wasm")]
pub fn sign_with_meme_crypto(bytes: &mut [u8], variant: MemeCrypto) {
    use sha2::Digest;

    let checksum_signature_len = variant.checksum_signature_length();
    let meme_crypto_offset = variant.meme_crypto_offset();

    let (remaining_bytes, checksum_table) = bytes.split_at_mut(bytes.len() - 0x200);

    let signature_span =
        &mut remaining_bytes[meme_crypto_offset..meme_crypto_offset + MEME_SIGNATURE_LENGTH];

    let checksum_block_span = &checksum_table[..checksum_signature_len];

    let hash = Sha256::digest(checksum_block_span);
    signature_span[0..32].copy_from_slice(&hash);

    sign_meme_data_in_place(signature_span);
}

#[cfg(feature = "wasm")]
const DIGEST_LENGTH: usize = 8;

#[cfg(feature = "wasm")]
fn sign_meme_data_in_place(bytes: &mut [u8]) {
    let byte_len = bytes.len();

    let (payload_bytes, digest_bytes) = bytes.split_at_mut(byte_len - DIGEST_LENGTH);
    digest_bytes.copy_from_slice(&Sha1::digest(payload_bytes)[0..DIGEST_LENGTH]);

    let key = MemeKey::pokedex_and_save_file();
    key.aes_encrypt(bytes);

    let signature_buffer = &mut bytes[byte_len - SIGNATURE_LENGTH..];
    signature_buffer[0] &= 0x7f;

    let rsa_encrypted = key.rsa_private(signature_buffer);

    signature_buffer.copy_from_slice(&rsa_encrypted);
}

#[cfg(feature = "wasm")]
const POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES: [u8; 126] = [
    0x30, 0x7c, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05,
    0x00, 0x03, 0x6b, 0x00, 0x30, 0x68, 0x02, 0x61, 0x00, 0xb6, 0x1e, 0x19, 0x20, 0x91, 0xf9, 0x0a,
    0x8f, 0x76, 0xa6, 0xea, 0xaa, 0x9a, 0x3c, 0xe5, 0x8c, 0x86, 0x3f, 0x39, 0xae, 0x25, 0x3f, 0x03,
    0x78, 0x16, 0xf5, 0x97, 0x58, 0x54, 0xe0, 0x7a, 0x9a, 0x45, 0x66, 0x01, 0xe7, 0xc9, 0x4c, 0x29,
    0x75, 0x9f, 0xe1, 0x55, 0xc0, 0x64, 0xed, 0xdf, 0xa1, 0x11, 0x44, 0x3f, 0x81, 0xef, 0x1a, 0x42,
    0x8c, 0xf6, 0xcd, 0x32, 0xf9, 0xda, 0xc9, 0xd4, 0x8e, 0x94, 0xcf, 0xb3, 0xf6, 0x90, 0x12, 0x0e,
    0x8e, 0x6b, 0x91, 0x11, 0xad, 0xda, 0xf1, 0x1e, 0x7c, 0x96, 0x20, 0x8c, 0x37, 0xc0, 0x14, 0x3f,
    0xf2, 0xbf, 0x3d, 0x7e, 0x83, 0x11, 0x41, 0xa9, 0x73, 0x02, 0x03, 0x01, 0x00, 0x01,
];

#[cfg(feature = "wasm")]
const SIGNING_KEY: [u8; 97] = [
    0x00, 0x77, 0x54, 0x55, 0x66, 0x8f, 0xff, 0x3c, 0xba, 0x30, 0x26, 0xc2, 0xd0, 0xb2, 0x6b, 0x80,
    0x85, 0x89, 0x59, 0x58, 0x34, 0x11, 0x57, 0xae, 0xb0, 0x3b, 0x6b, 0x04, 0x95, 0xee, 0x57, 0x80,
    0x3e, 0x21, 0x86, 0xeb, 0x6c, 0xb2, 0xeb, 0x62, 0xa7, 0x1d, 0xf1, 0x8a, 0x3c, 0x9c, 0x65, 0x79,
    0x07, 0x76, 0x70, 0x96, 0x1b, 0x3a, 0x61, 0x02, 0xda, 0xbe, 0x5a, 0x19, 0x4a, 0xb5, 0x8c, 0x32,
    0x50, 0xae, 0xd5, 0x97, 0xfc, 0x78, 0x97, 0x8a, 0x32, 0x6d, 0xb1, 0xd7, 0xb2, 0x8d, 0xcc, 0xcb,
    0x2a, 0x3e, 0x01, 0x4e, 0xdb, 0xd3, 0x97, 0xad, 0x33, 0xb8, 0xf2, 0x8c, 0xd5, 0x25, 0x05, 0x42,
    0x51,
];

#[cfg(feature = "wasm")]
const SIGNATURE_LENGTH: usize = 0x60;
#[cfg(feature = "wasm")]
const AES_CHUNK_LENGTH: usize = 0x10;

#[cfg(feature = "wasm")]
pub struct MemeKey<'a> {
    der: &'a [u8],
    private_key: BigInt,
    _public_key: BigInt,
    modulo: BigInt,
}

#[cfg(feature = "wasm")]
impl<'a> MemeKey<'a> {
    pub fn new(der: &'a [u8]) -> Self {
        Self {
            der,
            private_key: BigInt::from_bytes_be(Sign::Plus, &SIGNING_KEY),
            _public_key: BigInt::from_bytes_be(Sign::Plus, &der[0x7b..0x7e]),
            modulo: BigInt::from_bytes_be(Sign::Plus, &der[0x18..0x79]),
        }
    }

    pub fn pokedex_and_save_file() -> Self {
        Self::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES)
    }

    pub fn aes_encrypt(&self, data: &mut [u8]) {
        let (payload, signature) = data.split_at_mut(data.len() - SIGNATURE_LENGTH);

        let key = self.get_aes_key(payload);

        let cipher = Aes128::new_from_slice(&key).expect("AES key length should be valid");
        let next_xor = &mut [0u8; AES_CHUNK_LENGTH];

        let mut i = 0usize;
        while i < signature.len() {
            let block = &mut signature[i..i + AES_CHUNK_LENGTH];

            xor_bytes_in_place(block, next_xor);

            cipher.encrypt_block(GenericArray::from_mut_slice(block));
            next_xor.copy_from_slice(block);

            i += AES_CHUNK_LENGTH;
        }

        xor_bytes_in_place(next_xor, &signature[0..AES_CHUNK_LENGTH]);
        let sub_key = self.get_sub_key(next_xor);

        let mut i = 0usize;
        while i < signature.len() {
            xor_bytes_in_place(&mut signature[i..i + AES_CHUNK_LENGTH], &sub_key);

            i += AES_CHUNK_LENGTH;
        }

        let mut next_xor = [0u8; AES_CHUNK_LENGTH];
        let mut i = signature.len() - AES_CHUNK_LENGTH;
        loop {
            let temp: [u8; AES_CHUNK_LENGTH] =
                signature[i..i + AES_CHUNK_LENGTH].try_into().unwrap();
            let block = &mut signature[i..i + AES_CHUNK_LENGTH];

            cipher.encrypt_block(GenericArray::from_mut_slice(block));

            xor_bytes_in_place(block, &next_xor);
            next_xor.copy_from_slice(&temp);

            if i == 0 {
                break;
            }
            i -= AES_CHUNK_LENGTH;
        }
    }

    fn get_sub_key(&self, temp: &[u8]) -> [u8; AES_CHUNK_LENGTH] {
        let mut sub_key = [0u8; AES_CHUNK_LENGTH];
        let mut i = 0usize;

        while i < temp.len() {
            let b1 = temp[i];
            let b2 = temp[i + 1];

            sub_key[i] = b1.overflowing_mul(2).0.overflowing_add(b2 >> 7).0;
            sub_key[i + 1] = b2.overflowing_mul(2).0;

            if i + 2 < temp.len() {
                sub_key[i + 1] = sub_key[i + 1].overflowing_add(temp[i + 2] >> 7).0;
            }

            i += 2;
        }

        if temp[0] & 0x80 != 0 {
            sub_key[0xf] ^= 0x87;
        }

        sub_key
    }

    pub fn get_aes_key(&self, bytes: &[u8]) -> [u8; AES_CHUNK_LENGTH] {
        let mut payload = self.der.to_vec();
        payload.extend_from_slice(bytes);

        Sha1::digest(payload)[..AES_CHUNK_LENGTH]
            .try_into()
            .expect("AES_CHUNK_LENGTH sized array")
    }

    // fn rsa_public(&self, bytes: &[u8]) -> Vec<u8> {
    //     let m = BigInt::from_bytes_be(Sign::Plus, bytes);
    //     let c = m.modpow(&self.public_key, &self.modulo);
    //     c.to_bytes_be().1
    // }

    fn rsa_private(&self, bytes: &[u8]) -> Vec<u8> {
        let m = BigInt::from_bytes_be(Sign::Plus, bytes);
        let c = m.modpow(&self.private_key, &self.modulo);
        c.to_bytes_be().1
    }
}

#[cfg(feature = "wasm")]
fn xor_bytes_in_place(lhs: &mut [u8], rhs: &[u8]) {
    for (b, k) in lhs.iter_mut().zip(rhs.iter()) {
        *b ^= k;
    }
}

#[cfg(feature = "wasm")]
#[cfg(test)]
mod tests {
    use crate::result::Result;
    use std::path::Path;

    use super::*;
    use crate::tests::save_bytes_from_file;

    fn bigint_to_hex_string(bigint: &BigInt) -> String {
        bigint.to_str_radix(16)
    }

    fn bytes_to_hex_string(bytes: &[u8]) -> String {
        BigInt::from_bytes_be(Sign::Plus, bytes).to_str_radix(16)
    }

    #[test]
    fn memekey_private_is_accurate() -> Result<()> {
        let private = MemeKey::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES).private_key;
        assert_eq!(
            bigint_to_hex_string(&private),
            "775455668fff3cba3026c2d0b26b8085895958341157aeb03b6b0495ee57803e2186eb6cb2eb62a71df18a3c9c6579077670961b3a6102dabe5a194ab58c3250aed597fc78978a326db1d7b28dcccb2a3e014edbd397ad33b8f28cd525054251"
        );

        Ok(())
    }

    #[test]
    fn memekey_public_is_accurate() -> Result<()> {
        let public = MemeKey::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES)._public_key;
        assert_eq!(bigint_to_hex_string(&public), "10001");
        Ok(())
    }

    #[test]
    fn memekey_modulo_is_accurate() -> Result<()> {
        let modulo = MemeKey::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES).modulo;
        assert_eq!(
            bigint_to_hex_string(&modulo),
            "b61e192091f90a8f76a6eaaa9a3ce58c863f39ae253f037816f5975854e07a9a456601e7c94c29759fe155c064eddfa111443f81ef1a428cf6cd32f9dac9d48e94cfb3f690120e8e6b9111addaf11e7c96208c37c0143ff2bf3d7e831141a973"
        );
        Ok(())
    }

    #[test]
    fn memekey_aes_key_is_accurate() -> Result<()> {
        let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;

        let aes_payload = &moon_bytes[..moon_bytes.len() - SIGNATURE_LENGTH];
        let key_bytes =
            MemeKey::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES).get_aes_key(aes_payload);

        assert_eq!(
            bytes_to_hex_string(&key_bytes),
            "7a10b8ae4a34bb592638f90301ac72c8"
        );
        Ok(())
    }

    #[test]
    fn expected_memekey_encrypt_moon_save() -> Result<()> {
        let mut moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
        MemeKey::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES).aes_encrypt(&mut moon_bytes);

        assert_eq!(
            bytes_to_hex_string(&moon_bytes[0..100]),
            "2d0070051d0070054d007004dd007000cd007004ed00700d9040000fb0400000e28000008280000de0400003b060000da0400005ec800000628000056130000f50400001e060000ee0400004e5b01005b14000007300000f304000057070000c0060000"
        );

        Ok(())
    }

    // #[test]
    // fn rsa_public_is_correct() -> Result<()> {
    //     let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
    //     let key = MemeKey::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES);
    //     let ciphertext = key.rsa_public(&moon_bytes[..1000]);

    //     assert_eq!(
    //         bytes_to_hex_string(&ciphertext),
    //         "2aba82bedb9bf467703ab8047adb8179614ec3e5467da6a63eb9fa05e4bdbc2eea3e1c24d3080fc9ceebb5a29957ec6d7b39cdcaf3ad0d0425a139c23f893205b130150a01d40307e3db93700afbb7481927ffaff89631f7d93d8f5595328e21"
    //     );

    //     Ok(())
    // }

    #[test]
    fn rsa_private_is_correct() -> Result<()> {
        let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
        let key = MemeKey::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES);
        let ciphertext = key.rsa_private(&moon_bytes[..1000]);

        assert_eq!(
            bytes_to_hex_string(&ciphertext),
            "1fd81da0c10c63dcf3cbd1d0703190477736ee9cdba46ce8dee9bcaeace1457f79b0ffd9ea8031f60c56ccacc8acdea4c7bc54e540308673e35c15d1b907034627fb65a427d7f4b1ff2b6c84e6058698ac62dd66b74db21c7c301bf55d9e5fde"
        );

        Ok(())
    }

    #[test]
    fn sign_meme_data_in_place_is_correct() -> Result<()> {
        let mut moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
        sign_meme_data_in_place(&mut moon_bytes[0..1000]);

        assert_eq!(
            bytes_to_hex_string(&moon_bytes[0..1000]),
            "2d0070051d0070054d007004dd007000cd007004ed00700d9040000fb0400000e28000008280000de0400003b060000da0400005ec800000628000056130000f50400001e060000ee0400004e5b01005b14000007300000f304000057070000c0060000f90400000f2800005918000053200000ef04000028050000522400000d540000e0040000f70400001a06000046120000f004000003050000740700000b3c0000f8040000f105000001b80700df040000f6080000ec050000ef050000ed050000470e0000390800000a040000ee050000581400003708000000090000550b000009040000e40400004305000042050000190600003f0400004c040000ed0400008a060000a7060000730700001b070000580b00000f0500006f070000ec0400000e050000450a0000e1040000538b00000c050000740400007504000076040000770400004405000088070000890700008a0700008b0700008c0700008d0700008e0700008f070000900700009107000092070000930700009407000095070000960700009707000098070000e70400005c040000410500005a0800001a05000094060040a60600409306000095060000ea0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ab0f33c17012f8228d4119f14d5d9cd8031b502b33463e092a60d64780003631dbe6b2716c695828b35c41d815ab72eeee0df950936f56d5d0bfee96c5a2a2f1202953265253d508cd2bc54cea4d56ede3c93ce418b9cc0566cccfa32bd42833"
        );

        Ok(())
    }

    #[cfg(feature = "wasm")]
    #[test]
    fn sign_with_meme_crypto_last_1000_bytes() -> Result<()> {
        let mut moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;

        sign_with_meme_crypto(&mut moon_bytes, MemeCrypto::SunMoon);

        assert_eq!(
            bytes_to_hex_string(&moon_bytes[moon_bytes.len() - 1000..]),
            "18b50b000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007139a86c7933bfb7fd13a2ef51005b8a0977c7b9dd93bfcac38ee64259138fba48c77d73de977f2ba64625ff41a5fe45b1f39c0e11af18aed2ab4ebd583bdc802a19637156a3c4b1a86738e1cb6bf3c16c7dcb9427c65c0853349628c63520707d21db0e78fb864c22f2e9393b359c85249dab0d4825270bcd9e0fb1b896cc6700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006aa84b75060700003ba395bf0507000046454542e00d00000000a51c7c000000010055581400000002002f79c0000000030046fd1c0600000400fcf4000e000005005098780f00000600b72e280200000700589b04010000080055090002000009000efc200000000a000704040000000b00f67b580000000c004bf8e60500000d00c524006603000e008db22c5700000f00be370800000010000576801000001100777b081a00001200902c0864000013002bde08640000140002ae9839000015001523000100001600a3f0000100001700409b280501001800cb54040200001900d21d600b00001a00e5e7503f00001b00a5a6580300001c0015cd280700001d004949000200001e005aaf180700001f00aa3cfc010000200012ed00020000210099f0200100002200cff0c80100002300c49f000200002400bfe800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        );

        Ok(())
    }
}
