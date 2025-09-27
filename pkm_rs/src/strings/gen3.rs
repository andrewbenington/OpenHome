use std::fmt::Display;

use serde::Serialize;

use crate::conversion::gen3_string_encoding;

#[derive(Debug, Clone)]
pub struct Gen3String<const N: usize> {
    raw: [u8; N],
}

impl<const N: usize> From<&str> for Gen3String<N> {
    fn from(value: &str) -> Self {
        let mut raw = [0; N];
        let encoded: Vec<u8> = value
            .chars()
            .filter_map(gen3_string_encoding::encode)
            .collect();

        let len = encoded.len().min(N);
        raw[..len].copy_from_slice(&encoded[..len]);

        Gen3String { raw }
    }
}

impl<const N: usize> From<String> for Gen3String<N> {
    fn from(value: String) -> Self {
        Gen3String::from(value.as_str())
    }
}

impl<const N: usize> From<&Gen3String<N>> for String {
    fn from(val: &Gen3String<N>) -> Self {
        val.raw
            .iter()
            .copied()
            .take_while(|c| *c != 0xff)
            .map(gen3_string_encoding::decode)
            .map(|o| o.unwrap_or('\u{FFFD}'))
            .collect()
    }
}

impl<const N: usize> From<Gen3String<N>> for String {
    fn from(val: Gen3String<N>) -> Self {
        (&val).into()
    }
}

impl<const N: usize> Display for Gen3String<N> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let decoded: String = self.into();

        write!(f, "{decoded}")
    }
}

impl<const N: usize> Default for Gen3String<N> {
    fn default() -> Self {
        Self { raw: [0; N] }
    }
}

impl<const N: usize> Serialize for Gen3String<N> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.to_string().serialize(serializer)
    }
}

impl<const N: usize> Gen3String<N> {
    pub fn from_bytes(bytes: [u8; N]) -> Self {
        Gen3String { raw: bytes }
    }

    pub fn bytes(&self) -> [u8; N] {
        self.raw
    }
}
