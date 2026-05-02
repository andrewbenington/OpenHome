use serde::Serialize;
use std::fmt::Display;

use crate::conversion::gameboy_string_encoding;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
#[cfg(feature = "randomize")]
use rand::{
    RngExt,
    distr::{Alphanumeric, SampleString},
};

#[derive(Debug)]
pub struct GbString<const N: usize> {
    raw: [u8; N],
}

impl<const N: usize> From<&str> for GbString<N> {
    fn from(value: &str) -> Self {
        let mut raw = [0; N];
        let encoded: Vec<u8> = value
            .chars()
            .filter_map(gameboy_string_encoding::encode)
            .collect();

        let len = encoded.len().min(N);
        raw[..len].copy_from_slice(&encoded[..len]);

        GbString { raw }
    }
}

impl<const N: usize> From<String> for GbString<N> {
    fn from(value: String) -> Self {
        GbString::from(value.as_str())
    }
}

impl<const N: usize> Display for GbString<N> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let decoded: String = self
            .raw
            .iter()
            .copied()
            .take_while(|c| *c != 0xff)
            .map(gameboy_string_encoding::decode)
            .map(|o| o.unwrap_or('\u{FFFD}'))
            .collect();

        write!(f, "{decoded}")
    }
}

impl<const N: usize> Default for GbString<N> {
    fn default() -> Self {
        Self { raw: [0; N] }
    }
}

impl<const N: usize> Serialize for GbString<N> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.to_string().serialize(serializer)
    }
}

impl<const N: usize> GbString<N> {
    pub fn from_bytes(bytes: [u8; N]) -> Self {
        GbString { raw: bytes }
    }

    pub fn bytes(&self) -> [u8; N] {
        self.raw
    }
}

#[cfg(feature = "randomize")]
impl<const N: usize> Randomize for GbString<N> {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        let length: usize = rng.random_range(0..N);
        let utf8: String = Alphanumeric.sample_string(rng, length);
        Self::from(utf8)
    }
}
