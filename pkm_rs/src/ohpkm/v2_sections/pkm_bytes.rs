use strum_macros::Display;

use crate::{
    ohpkm::{sectioned_data::DataSection, v2::SectionTagV2},
    result::{Error, Result},
};

const PK1_PARTY_SIZE: usize = 66;
const PK2_PARTY_SIZE: usize = 73;
const PK3_PARTY_SIZE: usize = 100;
const PK4_PARTY_SIZE: usize = 236;
const PK5_PARTY_SIZE: usize = 236;
const PK6_PARTY_SIZE: usize = 260;
const PK7_PARTY_SIZE: usize = 260;
const PB7_SIZE: usize = 260;
const PK8_SIZE: usize = 344;
const PA8_SIZE: usize = 376;
const PB8_SIZE: usize = 344;
const PK9_SIZE: usize = 344;
const PA9_SIZE: usize = 344;

const PK3CFRU_PARTY_SIZE: usize = 58;
const PB8LUMI_SIZE: usize = 344;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Display)]
#[repr(u16)]
pub enum Tag {
    Pk1 = 1,
    Pk2 = 2,
    Pk3 = 3,
    Pk4 = 4,
    Pk5 = 5,
    Pk6 = 6,
    Pk7 = 7,
    Pb7 = 8,
    Pk8 = 9,
    Pa8 = 10,
    Pb8 = 11,
    Pk9 = 12,
    Pa9 = 13,

    Pk3Rr = 0xfffe,
    Pk3Ub = 0xfffd,
    Pb8Lumi = 0xfffc,
}

impl Tag {
    pub const fn to_le_bytes(self) -> [u8; 2] {
        (self as u16).to_le_bytes()
    }
}

impl TryFrom<u16> for Tag {
    type Error = Error;

    fn try_from(value: u16) -> Result<Self> {
        match value {
            1 => Ok(Self::Pk1),
            2 => Ok(Self::Pk2),
            3 => Ok(Self::Pk3),
            4 => Ok(Self::Pk4),
            5 => Ok(Self::Pk5),
            6 => Ok(Self::Pk6),
            7 => Ok(Self::Pk7),
            8 => Ok(Self::Pb7),
            9 => Ok(Self::Pk8),
            10 => Ok(Self::Pa8),
            11 => Ok(Self::Pb8),
            12 => Ok(Self::Pk9),
            13 => Ok(Self::Pa9),

            0xfffe => Ok(Self::Pk3Rr),
            0xfffd => Ok(Self::Pk3Ub),
            0xfffc => Ok(Self::Pb8Lumi),

            other => Err(Error::TagError {
                tag_type: "OriginalBackup",
                value: other,
            }),
        }
    }
}

impl Tag {
    pub const fn data_size(&self) -> usize {
        match self {
            Self::Pk1 => PK1_PARTY_SIZE,
            Self::Pk2 => PK2_PARTY_SIZE,
            Self::Pk3 => PK3_PARTY_SIZE,
            Self::Pk4 => PK4_PARTY_SIZE,
            Self::Pk5 => PK5_PARTY_SIZE,
            Self::Pk6 => PK6_PARTY_SIZE,
            Self::Pk7 => PK7_PARTY_SIZE,
            Self::Pb7 => PB7_SIZE,
            Self::Pk8 => PK8_SIZE,
            Self::Pa8 => PA8_SIZE,
            Self::Pb8 => PB8_SIZE,
            Self::Pk9 => PK9_SIZE,
            Self::Pa9 => PA9_SIZE,

            Self::Pk3Rr => PK3CFRU_PARTY_SIZE,
            Self::Pk3Ub => PK3CFRU_PARTY_SIZE,
            Self::Pb8Lumi => PB8LUMI_SIZE,
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Hash, Display, Debug)]
pub enum StoredPkmBytes {
    Pk1([u8; PK1_PARTY_SIZE]),
    Pk2([u8; PK2_PARTY_SIZE]),
    Pk3([u8; PK3_PARTY_SIZE]),
    Pk4([u8; PK4_PARTY_SIZE]),
    Pk5([u8; PK5_PARTY_SIZE]),
    Pk6([u8; PK6_PARTY_SIZE]),
    Pk7([u8; PK7_PARTY_SIZE]),
    Pb7([u8; PB7_SIZE]),
    Pk8([u8; PK8_SIZE]),
    Pa8([u8; PA8_SIZE]),
    Pb8([u8; PB8_SIZE]),
    Pk9([u8; PK9_SIZE]),
    Pa9([u8; PA9_SIZE]),

    Pk3Rr([u8; PK3CFRU_PARTY_SIZE]),
    Pk3Ub([u8; PK3CFRU_PARTY_SIZE]),
    Pb8Lumi([u8; PB8_SIZE]),
}

const LENGTH_CHECKED_MESSAGE: &str = "data length checked above";

impl StoredPkmBytes {
    pub const fn data_as_bytes(&self) -> &[u8] {
        let bytes: &[u8] = match self {
            Self::Pk1(bytes) => bytes,
            Self::Pk2(bytes) => bytes,
            Self::Pk3(bytes) => bytes,
            Self::Pk4(bytes) => bytes,
            Self::Pk5(bytes) => bytes,
            Self::Pk6(bytes) => bytes,
            Self::Pk7(bytes) => bytes,
            Self::Pb7(bytes) => bytes,
            Self::Pk8(bytes) => bytes,
            Self::Pa8(bytes) => bytes,
            Self::Pb8(bytes) => bytes,
            Self::Pk9(bytes) => bytes,
            Self::Pa9(bytes) => bytes,

            Self::Pk3Rr(bytes) => bytes,
            Self::Pk3Ub(bytes) => bytes,
            Self::Pb8Lumi(bytes) => bytes,
        };
        bytes
    }

    pub const fn tag(&self) -> Tag {
        match self {
            Self::Pk1(_) => Tag::Pk1,
            Self::Pk2(_) => Tag::Pk2,
            Self::Pk3(_) => Tag::Pk3,
            Self::Pk4(_) => Tag::Pk4,
            Self::Pk5(_) => Tag::Pk5,
            Self::Pk6(_) => Tag::Pk6,
            Self::Pk7(_) => Tag::Pk7,
            Self::Pb7(_) => Tag::Pb7,
            Self::Pk8(_) => Tag::Pk8,
            Self::Pa8(_) => Tag::Pa8,
            Self::Pb8(_) => Tag::Pb8,
            Self::Pk9(_) => Tag::Pk9,
            Self::Pa9(_) => Tag::Pa9,

            Self::Pk3Rr(_) => Tag::Pk3Rr,
            Self::Pk3Ub(_) => Tag::Pk3Ub,
            Self::Pb8Lumi(_) => Tag::Pb8Lumi,
        }
    }

    pub fn new(tag: Tag, data: &[u8]) -> Result<Self> {
        if data.len() > tag.data_size() {
            return Err(Error::BufferSize {
                requirement_source: Some(format!("OriginalBackup({tag})")),
                expected: tag.data_size(),
                received: data.len(),
            });
        }

        match tag {
            Tag::Pk1 => Ok(Self::Pk1(copy_to_sized_array(data))),
            Tag::Pk2 => Ok(Self::Pk2(copy_to_sized_array(data))),
            Tag::Pk3 => Ok(Self::Pk3(copy_to_sized_array(data))),
            Tag::Pk4 => Ok(Self::Pk4(copy_to_sized_array(data))),
            Tag::Pk5 => Ok(Self::Pk5(copy_to_sized_array(data))),
            Tag::Pk6 => Ok(Self::Pk6(copy_to_sized_array(data))),
            Tag::Pk7 => Ok(Self::Pk7(copy_to_sized_array(data))),
            Tag::Pb7 => Ok(Self::Pb7(copy_to_sized_array(data))),
            Tag::Pk8 => Ok(Self::Pk8(copy_to_sized_array(data))),
            Tag::Pa8 => Ok(Self::Pa8(copy_to_sized_array(data))),
            Tag::Pb8 => Ok(Self::Pb8(copy_to_sized_array(data))),
            Tag::Pk9 => Ok(Self::Pk9(copy_to_sized_array(data))),
            Tag::Pa9 => Ok(Self::Pa9(copy_to_sized_array(data))),

            Tag::Pk3Rr => Ok(Self::Pk3Rr(copy_to_sized_array(data))),
            Tag::Pk3Ub => Ok(Self::Pk3Ub(copy_to_sized_array(data))),
            Tag::Pb8Lumi => Ok(Self::Pb8Lumi(copy_to_sized_array(data))),
        }
    }

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        if bytes.len() < 2 {
            return Err(Error::BufferSize {
                requirement_source: Some(String::from("OriginalBackup")),
                expected: 2,
                received: bytes.len(),
            });
        }
        let value = u16::from_le_bytes(bytes[0..2].try_into().expect(LENGTH_CHECKED_MESSAGE));

        let Ok(tag) = Tag::try_from(value) else {
            return Err(Error::TagError {
                tag_type: "OriginalBackup",
                value,
            });
        };

        Self::new(tag, &bytes[2..])
    }

    pub fn to_bytes(self) -> Vec<u8> {
        let mut bytes = Vec::with_capacity(2 + self.tag().data_size());
        bytes.extend_from_slice(&self.tag().to_le_bytes());
        bytes.extend_from_slice(self.data_as_bytes());
        bytes
    }
}

fn copy_to_sized_array<const N: usize>(slice: &[u8]) -> [u8; N] {
    let mut arr = [0u8; N];
    let len = slice.len().min(N);
    arr[..len].copy_from_slice(&slice[..len]);
    arr
}

#[derive(Debug, Clone, Copy)]
pub struct OriginalBackup(StoredPkmBytes);

#[cfg(feature = "wasm")]
impl OriginalBackup {
    pub const fn new(pkm_bytes: StoredPkmBytes) -> Self {
        Self(pkm_bytes)
    }

    pub const fn tag(&self) -> Tag {
        self.0.tag()
    }

    pub const fn data_as_bytes(&self) -> &[u8] {
        self.0.data_as_bytes()
    }
}

impl DataSection for OriginalBackup {
    type TagType = SectionTagV2;
    const TAG: Self::TagType = SectionTagV2::OriginalBackup;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Ok(Self(StoredPkmBytes::from_bytes(bytes)?))
    }

    fn to_bytes(&self) -> Vec<u8> {
        self.0.to_bytes()
    }

    fn is_empty(&self) -> bool {
        // if this section exists, it should always have data, so it is never empty
        false
    }
}

#[derive(Debug, Clone, Copy)]
pub struct UnconvertedPkm(StoredPkmBytes);

#[cfg(feature = "wasm")]
impl UnconvertedPkm {
    pub const fn new(pkm_bytes: StoredPkmBytes) -> Self {
        Self(pkm_bytes)
    }
}

impl DataSection for UnconvertedPkm {
    type TagType = SectionTagV2;
    const TAG: Self::TagType = SectionTagV2::UnconvertedPkm;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Ok(Self(StoredPkmBytes::from_bytes(bytes)?))
    }

    fn to_bytes(&self) -> Vec<u8> {
        self.0.to_bytes()
    }

    fn is_empty(&self) -> bool {
        // if this section exists, it should always have data, so it is never empty
        false
    }
}
