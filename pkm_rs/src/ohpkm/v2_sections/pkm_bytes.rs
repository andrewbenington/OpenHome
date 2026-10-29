use crate::format::PkmFormat;
use crate::ohpkm::v2::OhpkmSectionTag;
use crate::result::{Error, Result};
use crate::sectioned_data::DataSection;

use strum_macros::Display;

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

const PH4_PKM_MAX_SIZE: usize = 0x2A6;

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
    Ph4 = 14,

    Pk3Rr = 0xfffe,
    Pk3Ub = 0xfffd,
    Pb8Lumi = 0xfffc,
    Pk9Compass = 0xfffb,
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
            0xfffb => Ok(Self::Pk9Compass),

            other => Err(Error::TagError {
                tag_type: "OriginalBackup",
                value: other,
            }),
        }
    }
}

impl From<PkmFormat> for Option<Tag> {
    fn from(value: PkmFormat) -> Self {
        match value {
            PkmFormat::PK1 => Some(Tag::Pk1),
            PkmFormat::PK2 => Some(Tag::Pk2),
            PkmFormat::PK3 => Some(Tag::Pk3),
            PkmFormat::ColoPkm | PkmFormat::XdPkm => None,
            PkmFormat::PK4 => Some(Tag::Pk4),
            PkmFormat::PK5 => Some(Tag::Pk5),
            PkmFormat::PK6 => Some(Tag::Pk6),
            PkmFormat::PK7 => Some(Tag::Pk7),
            PkmFormat::PB7 => Some(Tag::Pb7),
            PkmFormat::PH4 => Some(Tag::Ph4),
            PkmFormat::PK8 => Some(Tag::Pk8),
            PkmFormat::PA8 => Some(Tag::Pa8),
            PkmFormat::PB8 => Some(Tag::Pb8),
            PkmFormat::PK9 => Some(Tag::Pk9),
            PkmFormat::PA9 => Some(Tag::Pa9),
            PkmFormat::PK3RR => Some(Tag::Pk3Rr),
            PkmFormat::PK3UB => Some(Tag::Pk3Ub),
            PkmFormat::PB8LUMI => Some(Tag::Pb8Lumi),
            PkmFormat::PK9Compass => Some(Tag::Pk9Compass),
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
            Self::Ph4 => PH4_PKM_MAX_SIZE,

            Self::Pk3Rr => PK3CFRU_PARTY_SIZE,
            Self::Pk3Ub => PK3CFRU_PARTY_SIZE,
            Self::Pb8Lumi => PB8LUMI_SIZE,
            Self::Pk9Compass => PK9_SIZE,
        }
    }
}

#[derive(Clone, PartialEq, Eq, Hash, Display, Debug)]
pub enum StoredPkmBytes {
    Pk1(Box<[u8; PK1_PARTY_SIZE]>),
    Pk2(Box<[u8; PK2_PARTY_SIZE]>),
    Pk3(Box<[u8; PK3_PARTY_SIZE]>),
    Pk4(Box<[u8; PK4_PARTY_SIZE]>),
    Pk5(Box<[u8; PK5_PARTY_SIZE]>),
    Pk6(Box<[u8; PK6_PARTY_SIZE]>),
    Pk7(Box<[u8; PK7_PARTY_SIZE]>),
    Pb7(Box<[u8; PB7_SIZE]>),
    Pk8(Box<[u8; PK8_SIZE]>),
    Pa8(Box<[u8; PA8_SIZE]>),
    Pb8(Box<[u8; PB8_SIZE]>),
    Pk9(Box<[u8; PK9_SIZE]>),
    Pa9(Box<[u8; PA9_SIZE]>),
    Ph4(Box<[u8; PH4_PKM_MAX_SIZE]>),

    Pk3Rr(Box<[u8; PK3CFRU_PARTY_SIZE]>),
    Pk3Ub(Box<[u8; PK3CFRU_PARTY_SIZE]>),
    Pb8Lumi(Box<[u8; PB8_SIZE]>),
    Pk9Compass(Box<[u8; PK9_SIZE]>),
}

const LENGTH_CHECKED_MESSAGE: &str = "data length checked above";

impl StoredPkmBytes {
    pub fn data_as_bytes(&self) -> &[u8] {
        let bytes: &[u8] = match self {
            Self::Pk1(bytes) => bytes.as_ref(),
            Self::Pk2(bytes) => bytes.as_ref(),
            Self::Pk3(bytes) => bytes.as_ref(),
            Self::Pk4(bytes) => bytes.as_ref(),
            Self::Pk5(bytes) => bytes.as_ref(),
            Self::Pk6(bytes) => bytes.as_ref(),
            Self::Pk7(bytes) => bytes.as_ref(),
            Self::Pb7(bytes) => bytes.as_ref(),
            Self::Pk8(bytes) => bytes.as_ref(),
            Self::Ph4(bytes) => bytes.as_ref(),
            Self::Pa8(bytes) => bytes.as_ref(),
            Self::Pb8(bytes) => bytes.as_ref(),
            Self::Pk9(bytes) => bytes.as_ref(),
            Self::Pa9(bytes) => bytes.as_ref(),

            Self::Pk3Rr(bytes) => bytes.as_ref(),
            Self::Pk3Ub(bytes) => bytes.as_ref(),
            Self::Pb8Lumi(bytes) => bytes.as_ref(),
            Self::Pk9Compass(bytes) => bytes.as_ref(),
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
            Self::Ph4(_) => Tag::Ph4,
            Self::Pa8(_) => Tag::Pa8,
            Self::Pb8(_) => Tag::Pb8,
            Self::Pk9(_) => Tag::Pk9,
            Self::Pa9(_) => Tag::Pa9,

            Self::Pk3Rr(_) => Tag::Pk3Rr,
            Self::Pk3Ub(_) => Tag::Pk3Ub,
            Self::Pb8Lumi(_) => Tag::Pb8Lumi,
            Self::Pk9Compass(_) => Tag::Pk9Compass,
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
            Tag::Pk1 => Ok(Self::Pk1(Box::new(copy_to_sized_array(data)))),
            Tag::Pk2 => Ok(Self::Pk2(Box::new(copy_to_sized_array(data)))),
            Tag::Pk3 => Ok(Self::Pk3(Box::new(copy_to_sized_array(data)))),
            Tag::Pk4 => Ok(Self::Pk4(Box::new(copy_to_sized_array(data)))),
            Tag::Pk5 => Ok(Self::Pk5(Box::new(copy_to_sized_array(data)))),
            Tag::Pk6 => Ok(Self::Pk6(Box::new(copy_to_sized_array(data)))),
            Tag::Pk7 => Ok(Self::Pk7(Box::new(copy_to_sized_array(data)))),
            Tag::Pb7 => Ok(Self::Pb7(Box::new(copy_to_sized_array(data)))),
            Tag::Pk8 => Ok(Self::Pk8(Box::new(copy_to_sized_array(data)))),
            Tag::Pa8 => Ok(Self::Pa8(Box::new(copy_to_sized_array(data)))),
            Tag::Pb8 => Ok(Self::Pb8(Box::new(copy_to_sized_array(data)))),
            Tag::Pk9 => Ok(Self::Pk9(Box::new(copy_to_sized_array(data)))),
            Tag::Pa9 => Ok(Self::Pa9(Box::new(copy_to_sized_array(data)))),
            Tag::Ph4 => Ok(Self::Ph4(Box::new(copy_to_sized_array(data)))),

            Tag::Pk3Rr => Ok(Self::Pk3Rr(Box::new(copy_to_sized_array(data)))),
            Tag::Pk3Ub => Ok(Self::Pk3Ub(Box::new(copy_to_sized_array(data)))),
            Tag::Pb8Lumi => Ok(Self::Pb8Lumi(Box::new(copy_to_sized_array(data)))),
            Tag::Pk9Compass => Ok(Self::Pk9Compass(Box::new(copy_to_sized_array(data)))),
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

    pub fn to_bytes(&self) -> Vec<u8> {
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

#[derive(Debug, Clone)]
pub struct OriginalBackup(StoredPkmBytes);

impl OriginalBackup {
    pub const fn new(pkm_bytes: StoredPkmBytes) -> Self {
        Self(pkm_bytes)
    }

    #[cfg(feature = "wasm")]
    pub const fn tag(&self) -> Tag {
        self.0.tag()
    }

    #[cfg(feature = "wasm")]
    pub fn data_as_bytes(&self) -> &[u8] {
        self.0.data_as_bytes()
    }

    pub const fn tagged_bytes(&self) -> &StoredPkmBytes {
        &self.0
    }
}

impl DataSection for OriginalBackup {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::OriginalBackup;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Ok(Self(StoredPkmBytes::from_bytes(bytes)?))
    }

    fn to_bytes(&self) -> Vec<u8> {
        self.0.clone().to_bytes()
    }

    fn is_empty(&self) -> bool {
        // if this section exists, it should always have data, so it is never empty
        false
    }
}
