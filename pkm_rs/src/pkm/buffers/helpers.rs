use std::ops::{Deref, DerefMut};

use crate::{
    pkm::fields::{InfallibleField, ValidatedField},
    util,
};

pub struct PkmBuffer<'a, const N: usize>(&'a mut [u8]);

impl<'a, const N: usize> PkmBuffer<'a, N> {
    pub const fn from_slice(slice: &'a mut [u8]) -> Option<Self> {
        if slice.len() < N {
            return None;
        }

        Some(Self(slice))
    }

    pub fn read_u8(&self, offset: usize) -> u8 {
        self.0[offset]
    }

    pub fn write_u8(&mut self, offset: usize, value: u8) {
        self.0[offset] = value
    }

    pub fn read_u16_le(&self, offset: usize) -> u16 {
        u16::from_le_bytes(
            self.0[offset..offset + 2]
                .try_into()
                .expect("out of bounds PkmBuffer u16 read"),
        )
    }

    pub fn write_u16_le(&mut self, offset: usize, value: u16) {
        self.0[offset..offset + 2].copy_from_slice(&value.to_le_bytes());
    }

    pub fn read_u32_le(&self, offset: usize) -> u32 {
        u32::from_le_bytes(
            self.0[offset..offset + 4]
                .try_into()
                .expect("out of bounds PkmBuffer u32 read"),
        )
    }

    pub fn write_u32_le(&mut self, offset: usize, value: u32) {
        self.0[offset..offset + 4].copy_from_slice(&value.to_le_bytes());
    }

    pub fn get_flag(&self, byte_offset: usize, bit_offset: usize) -> bool {
        util::get_flag(self, byte_offset, bit_offset)
    }

    pub fn read_field<F: InfallibleField>(&self, offset: usize) -> F::Repr {
        F::from_bytes(self.0, offset)
    }

    pub fn try_read_field<F: ValidatedField>(&self, offset: usize) -> Result<F::Repr, F::Err> {
        F::try_from_bytes(self.0, offset)
    }
}

impl<'a, const N: usize> Deref for PkmBuffer<'a, N> {
    type Target = [u8];

    fn deref(&self) -> &Self::Target {
        self.0
    }
}

impl<'a, const N: usize> DerefMut for PkmBuffer<'a, N> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        self.0
    }
}
