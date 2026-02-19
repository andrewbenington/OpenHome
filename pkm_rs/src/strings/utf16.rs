use serde::Serialize;
use std::{fmt::Display, ops::Deref};

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
#[cfg(feature = "randomize")]
use rand::{
    RngExt,
    distr::{Alphanumeric, SampleString},
};

const TERMINATOR: u16 = 0x0000;

#[derive(Debug, Clone, Copy)]
pub struct SizedUtf16String<const N: usize> {
    raw_le: [u8; N],
}

impl<const N: usize> From<&str> for SizedUtf16String<N> {
    fn from(value: &str) -> Self {
        let mut raw_le = [0; N];
        let encoded_le: Vec<u8> = value.encode_utf16().flat_map(|c| c.to_le_bytes()).collect();

        let len = encoded_le.len().min(N - 2);
        raw_le[..len].copy_from_slice(&encoded_le[..len]);
        raw_le[len..].fill(0);

        SizedUtf16String { raw_le }
    }
}

impl<const N: usize> From<String> for SizedUtf16String<N> {
    fn from(value: String) -> Self {
        SizedUtf16String::from(value.as_str())
    }
}

#[cfg(feature = "randomize")]
impl<const N: usize> Randomize for SizedUtf16String<N> {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        let length: usize = rng.random_range(0..N);
        let utf8: String = Alphanumeric.sample_string(rng, length);
        Self::from(utf8)
    }
}

impl<const N: usize> Display for SizedUtf16String<N> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let u16_values = u8_slice_to_u16_le(&self.raw_le);
        write!(f, "{}", String::from_utf16_lossy(&u16_values))
    }
}

impl<const N: usize> Default for SizedUtf16String<N> {
    fn default() -> Self {
        Self { raw_le: [0; N] }
    }
}

impl<const N: usize> Serialize for SizedUtf16String<N> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.to_string().serialize(serializer)
    }
}

impl<const N: usize> SizedUtf16String<N> {
    pub const fn from_bytes(bytes: [u8; N]) -> Self {
        SizedUtf16String { raw_le: bytes }
    }

    pub const fn bytes(&self) -> [u8; N] {
        self.raw_le
    }
}

impl<const N: usize> Deref for SizedUtf16String<N> {
    type Target = [u8];

    fn deref(&self) -> &[u8] {
        &self.raw_le
    }
}

fn u8_slice_to_u16_le(slice: &[u8]) -> Vec<u16> {
    slice
        .chunks_exact(2)
        .map(|chunk| u16::from_le_bytes([chunk[0], chunk[1]]))
        .take_while(|val| *val != TERMINATOR)
        .collect()
}
