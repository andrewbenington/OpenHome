use std::fmt::Display;

use serde::Serialize;

use crate::conversion::gen4_string_encoding;

#[derive(Debug)]
pub struct Gen4String<const N: usize> {
    raw_be: [u8; N],
}

impl<const N: usize> From<&str> for Gen4String<N> {
    fn from(value: &str) -> Self {
        let mut raw_be = [0; N];
        let encoded_be: Vec<u8> = value
            .encode_utf16()
            .filter_map(gen4_string_encoding::encode)
            .flat_map(|c| c.to_be_bytes())
            .collect();

        let len = encoded_be.len().min(N);
        raw_be[..len].copy_from_slice(&encoded_be[..len]);

        Gen4String { raw_be }
    }
}

impl<const N: usize> From<String> for Gen4String<N> {
    fn from(value: String) -> Self {
        Gen4String::from(value.as_str())
    }
}

impl<const N: usize> Display for Gen4String<N> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let u16_values: Vec<u16> = self
            .raw_be
            .chunks_exact(2)
            .map(|chunk| u16::from_be_bytes([chunk[1], chunk[0]]))
            .take_while(|val| *val != 0xffff)
            .filter_map(gen4_string_encoding::decode)
            .collect();
        write!(f, "{}", String::from_utf16_lossy(&u16_values))
    }
}

impl<const N: usize> Default for Gen4String<N> {
    fn default() -> Self {
        Self { raw_be: [0; N] }
    }
}

impl<const N: usize> Serialize for Gen4String<N> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.to_string().serialize(serializer)
    }
}

impl<const N: usize> Gen4String<N> {
    pub fn from_bytes(bytes: [u8; N]) -> Self {
        Gen4String { raw_be: bytes }
    }

    pub fn bytes(&self) -> [u8; N] {
        self.raw_be
    }
}
