use std::convert::Infallible;

use pkm_rs_resources::{
    abilities::{AbilityIndex, InvalidAbilityIndex},
    ball::{Ball, InvalidBallIndex},
    natures::{InvalidNatureIndex, NatureIndex},
    species::{InvalidNatDexIndex, NatDexIndex},
};
use pkm_rs_types::{BitSet, Gender, strings::SizedUtf16String};
use sha2::digest::typenum::Bit;

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

impl<const N: usize> ByteSerializableAlways for [u8; N] {
    fn from_bytes_at(bytes: &[u8], offset: usize) -> Self {
        bytes[offset..offset + N].try_into().unwrap()
    }

    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize) {
        bytes[offset..offset + N].copy_from_slice(self);
    }
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct BitFlag<const POSITION: u8>(bool);

impl<const POSITION: u8> BitFlag<POSITION> {
    pub fn new(value: bool) -> Self {
        assert!(POSITION < 8);
        Self(value)
    }

    pub const fn is_set(&self) -> bool {
        self.0
    }
}

impl<const POSITION: u8> ByteSerializableAlways for BitFlag<POSITION> {
    fn from_bytes_at(bytes: &[u8], offset: usize) -> Self {
        Self(bytes[offset] & POSITION == 1)
    }

    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize) {
        bytes[offset].set_bit(POSITION, self.0);
    }
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct TwoBits<const BIT_OFFSET: u8>(u8);

impl<const BIT_OFFSET: u8> TwoBits<BIT_OFFSET> {
    pub fn new(value: u8) -> Self {
        assert!(BIT_OFFSET < 7);
        Self((value >> BIT_OFFSET) & 0b11)
    }

    pub const fn value(&self) -> u8 {
        self.0
    }
}

impl<const BIT_OFFSET: u8> ByteSerializableAlways for TwoBits<BIT_OFFSET> {
    fn from_bytes_at(bytes: &[u8], offset: usize) -> Self {
        Self(((bytes[offset] & BIT_OFFSET) << 1) + (bytes[offset] & (BIT_OFFSET + 1)))
    }

    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize) {
        bytes[offset].set_bit(BIT_OFFSET, self.0 & 0b10 == 0b10);
        bytes[offset].set_bit(BIT_OFFSET + 1, self.0 & 1 == 1);
    }
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct GenderTwoBits<const BIT_OFFSET: u8>(TwoBits<BIT_OFFSET>);

impl<const BIT_OFFSET: u8> ByteSerializable for GenderTwoBits<BIT_OFFSET> {
    fn try_from_bytes_at(bytes: &[u8], offset: usize) -> Result<Self, Infallible> {
        TwoBits::<BIT_OFFSET>::try_from_bytes_at(bytes, offset).map(Self)
    }

    fn to_bytes_at(&self, bytes: &mut [u8], offset: usize) {
        ByteSerializableAlways::to_bytes_at(&self.0, bytes, offset);
    }
}

#[cfg(test)]
mod tests {
    use crate::pkm::fields::byte_serializable::TwoBits;

    #[test]
    fn two_bits_read() {
        let source = 0b01010101;
        assert_eq!(TwoBits::<0>::new(source).value(), 0b01);
        assert_eq!(TwoBits::<1>::new(source).value(), 0b10);
        assert_eq!(TwoBits::<3>::new(source).value(), 0b10);
        assert_eq!(TwoBits::<6>::new(source).value(), 0b01);
    }
}
