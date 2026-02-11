use std::convert::Infallible;

use pkm_rs_resources::{
    abilities::{AbilityIndex, InvalidAbilityIndex},
    ball::{Ball, InvalidBallIndex},
    natures::{InvalidNatureIndex, NatureIndex},
    species::{InvalidNatDexIndex, NatDexIndex},
};
use pkm_rs_types::strings::SizedUtf16String;

pub trait ByteSerializable<E = Infallible>: Sized {
    fn try_from_bytes_at(bytes: &[u8], offset: usize) -> Result<Self, E>;
    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize);
}

impl<T: ByteSerializableAlways> ByteSerializable for T {
    fn try_from_bytes_at(bytes: &[u8], offset: usize) -> Result<Self, Infallible> {
        Ok(T::from_bytes_at(bytes, offset))
    }

    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize) {
        self.to_bytes_at(bytes, offset);
    }
}

pub trait ByteSerializableAlways: Sized {
    fn from_bytes_at(bytes: &[u8], offset: usize) -> Self;
    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize);
}

impl ByteSerializableAlways for u8 {
    fn from_bytes_at(bytes: &[u8], offset: usize) -> Self {
        bytes[offset]
    }

    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize) {
        bytes[offset] = *self;
    }
}

impl ByteSerializableAlways for u16 {
    fn from_bytes_at(bytes: &[u8], offset: usize) -> Self {
        u16::from_le_bytes(bytes[offset..offset + 2].try_into().unwrap())
    }

    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize) {
        bytes[offset..offset + 2].copy_from_slice(&self.to_le_bytes());
    }
}

impl ByteSerializableAlways for u32 {
    fn from_bytes_at(bytes: &[u8], offset: usize) -> Self {
        u32::from_le_bytes(bytes[offset..offset + 4].try_into().unwrap())
    }

    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize) {
        bytes[offset..offset + 4].copy_from_slice(&self.to_le_bytes());
    }
}

impl ByteSerializable<InvalidAbilityIndex> for AbilityIndex {
    fn try_from_bytes_at(bytes: &[u8], offset: usize) -> Result<Self, InvalidAbilityIndex> {
        AbilityIndex::try_from_index(u16::from_le_bytes(
            bytes[offset..offset + 2].try_into().unwrap(),
        ))
    }

    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize) {
        bytes[offset..offset + 2].copy_from_slice(&self.get().to_le_bytes());
    }
}

impl ByteSerializable<InvalidBallIndex> for Ball {
    fn try_from_bytes_at(bytes: &[u8], offset: usize) -> Result<Self, InvalidBallIndex> {
        Ball::try_from_byte(bytes[offset])
    }

    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize) {
        bytes[offset] = *self as u8;
    }
}

impl ByteSerializable<InvalidNatDexIndex> for NatDexIndex {
    fn try_from_bytes_at(bytes: &[u8], offset: usize) -> Result<Self, InvalidNatDexIndex> {
        NatDexIndex::from_le_bytes(bytes[offset..offset + 2].try_into().unwrap())
    }

    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize) {
        bytes[offset..offset + 2].copy_from_slice(&self.to_le_bytes());
    }
}

impl ByteSerializable<InvalidNatureIndex> for NatureIndex {
    fn try_from_bytes_at(bytes: &[u8], offset: usize) -> Result<Self, InvalidNatureIndex> {
        NatureIndex::try_from_byte(bytes[offset])
    }

    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize) {
        bytes[offset] = self.index()
    }
}

impl<const N: usize> ByteSerializableAlways for SizedUtf16String<N> {
    fn from_bytes_at(bytes: &[u8], offset: usize) -> Self {
        SizedUtf16String::<N>::from_bytes(bytes[offset..offset + N].try_into().unwrap())
    }

    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize) {
        bytes[offset..offset + N].copy_from_slice(self);
    }
}
