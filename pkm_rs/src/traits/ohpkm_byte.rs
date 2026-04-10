use std::num::NonZeroU16;

use pkm_rs_types::OriginGame;

pub trait OhpkmBytes<const N: usize> {
    fn to_ohpkm_bytes(&self) -> [u8; N];
    fn from_ohpkm_bytes(bytes: [u8; N]) -> Self;
}

impl OhpkmBytes<2> for Option<NonZeroU16> {
    fn to_ohpkm_bytes(&self) -> [u8; 2] {
        self.map(NonZeroU16::get).unwrap_or(0).to_le_bytes()
    }

    fn from_ohpkm_bytes(bytes: [u8; 2]) -> Self {
        NonZeroU16::new(u16::from_le_bytes(bytes))
    }
}

pub trait OhpkmByte {
    fn to_ohpkm_byte(&self) -> u8;
    fn from_ohpkm_byte(byte: u8) -> Self;
}

impl OhpkmByte for Option<OriginGame> {
    fn to_ohpkm_byte(&self) -> u8 {
        match self {
            Some(origin) => *origin as u8,
            None => 0,
        }
    }

    fn from_ohpkm_byte(byte: u8) -> Self {
        if byte != 0 {
            Some(OriginGame::from(byte))
        } else {
            None
        }
    }
}
