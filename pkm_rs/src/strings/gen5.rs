use serde::Serialize;
use std::fmt::Display;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
#[cfg(feature = "randomize")]
use rand::{
    RngExt,
    distr::{Alphanumeric, SampleString},
};

const TERMINATOR: u16 = 0xffff;

fn u8_slice_to_u16_be(slice: &[u8]) -> Vec<u16> {
    slice
        .chunks_exact(2)
        .map(|chunk| u16::from_be_bytes([chunk[1], chunk[0]]))
        .take_while(|val| *val != TERMINATOR)
        .collect()
}

#[derive(Debug, Clone, Copy)]
pub struct Gen5String<const N: usize> {
    raw_be: [u8; N],
}

impl<const N: usize> From<&str> for Gen5String<N> {
    fn from(value: &str) -> Self {
        let mut raw_be = [0; N];
        let encoded_be: Vec<u8> = value.encode_utf16().flat_map(|c| c.to_be_bytes()).collect();

        let len = encoded_be.len().min(N - 2);
        raw_be[..len].copy_from_slice(&encoded_be[..len]);
        raw_be[len..len + 2].copy_from_slice(&TERMINATOR.to_be_bytes());
        raw_be[len + 2..].fill(0);

        Gen5String { raw_be }
    }
}

impl<const N: usize> From<String> for Gen5String<N> {
    fn from(value: String) -> Self {
        Gen5String::from(value.as_str())
    }
}

impl<const N: usize> Display for Gen5String<N> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let u16_values = u8_slice_to_u16_be(&self.raw_be);
        write!(f, "{}", String::from_utf16_lossy(&u16_values))
    }
}

impl<const N: usize> Default for Gen5String<N> {
    fn default() -> Self {
        Self { raw_be: [0; N] }
    }
}

impl<const N: usize> Serialize for Gen5String<N> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.to_string().serialize(serializer)
    }
}

impl<const N: usize> Gen5String<N> {
    pub const fn from_bytes(bytes: [u8; N]) -> Self {
        Gen5String { raw_be: bytes }
    }

    pub const fn bytes(&self) -> [u8; N] {
        self.raw_be
    }
}

#[cfg(feature = "randomize")]
impl<const N: usize> Randomize for Gen5String<N> {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        let length: usize = rng.random_range(0..N);
        let utf8: String = Alphanumeric.sample_string(rng, length);
        Self::from(utf8)
    }
}
