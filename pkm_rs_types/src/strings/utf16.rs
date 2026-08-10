use serde::Serialize;
use std::fmt::{Display, Write};
use std::marker::PhantomData;
use std::ops::Deref;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
#[cfg(feature = "randomize")]
use rand::{
    RngExt,
    distr::{Alphanumeric, SampleString},
};

#[cfg(feature = "wasm")]
use wasm_bindgen::JsValue;
#[cfg(feature = "wasm")]
use wasm_bindgen::convert::*;
#[cfg(feature = "wasm")]
use wasm_bindgen::describe::*;

const TERMINATOR: u16 = 0x0000;

pub trait Endianness {
    type Reversed: Endianness;

    fn u16_to_bytes(value: u16) -> [u8; 2];
    fn u16_from_bytes(bytes: &[u8; 2]) -> u16;
    fn name() -> &'static str;
    fn reverse_endian() -> Self::Reversed;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LittleEndian;

impl Endianness for LittleEndian {
    type Reversed = BigEndian;

    fn u16_to_bytes(value: u16) -> [u8; 2] {
        value.to_le_bytes()
    }

    fn u16_from_bytes(bytes: &[u8; 2]) -> u16 {
        u16::from_le_bytes(*bytes)
    }

    fn name() -> &'static str {
        "Little Endian"
    }

    fn reverse_endian() -> Self::Reversed {
        BigEndian
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BigEndian;

impl Endianness for BigEndian {
    type Reversed = LittleEndian;

    fn u16_to_bytes(value: u16) -> [u8; 2] {
        value.to_be_bytes()
    }

    fn u16_from_bytes(bytes: &[u8; 2]) -> u16 {
        u16::from_be_bytes(*bytes)
    }

    fn name() -> &'static str {
        "Big Endian"
    }

    fn reverse_endian() -> Self::Reversed {
        LittleEndian
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub struct SizedUtf16String<const N: usize, E: Endianness = LittleEndian> {
    raw: [u8; N],
    endian: PhantomData<E>,
}

impl<const N: usize> SizedUtf16String<N> {
    pub const fn from_le_bytes(bytes: [u8; N]) -> SizedUtf16String<N, LittleEndian> {
        SizedUtf16String {
            raw: bytes,
            endian: PhantomData::<LittleEndian>,
        }
    }

    pub const fn from_be_bytes(bytes: [u8; N]) -> SizedUtf16String<N, BigEndian> {
        SizedUtf16String {
            raw: bytes,
            endian: PhantomData::<BigEndian>,
        }
    }
}

impl<const N: usize, E: Endianness> SizedUtf16String<N, E> {
    pub const fn bytes(&self) -> [u8; N] {
        self.raw
    }

    pub const fn is_empty(&self) -> bool {
        self.raw[0] == 0 && self.raw[1] == 0
    }

    pub fn resize<const M: usize>(&mut self) -> SizedUtf16String<M, E> {
        let mut raw = [0u8; M];
        if M >= 2 {
            let end = N.min(M - 2);
            raw[0..end].copy_from_slice(&self.raw[0..end]);
        }

        SizedUtf16String::<M, E> {
            raw,
            endian: self.endian,
        }
    }

    pub fn reverse_endian(mut self) -> SizedUtf16String<N, E::Reversed> {
        u8_array_reverse_endian(&mut self.raw);
        SizedUtf16String::<N, E::Reversed> {
            raw: self.raw,
            endian: PhantomData::<E::Reversed>,
        }
    }

    // because both have the same N, both are enforced to be the same length and no length check is needed
    pub fn identical_until_terminator(&self, other: &SizedUtf16String<N, E>) -> bool {
        self.raw
            .chunks_exact(2)
            .map(E::u16_from_bytes)
            .zip(other.raw.chunks_exact(2).map(E::u16_from_bytes))
            .take_while(|(this_char, other_char)| {
                *this_char != TERMINATOR && *other_char != TERMINATOR
            })
            .all(|(this_char, other_char)| this_char == other_char)
    }
}

impl<const N: usize, E: Endianness> From<&str> for SizedUtf16String<N, E> {
    fn from(value: &str) -> Self {
        let mut raw = [0; N];
        let encoded_le: Vec<u8> = value.encode_utf16().flat_map(E::u16_to_bytes).collect();

        let len = encoded_le.len().min(N - 2);
        raw[..len].copy_from_slice(&encoded_le[..len]);
        raw[len..].fill(0);

        SizedUtf16String {
            raw,
            endian: PhantomData,
        }
    }
}

impl<const N: usize, E: Endianness> From<String> for SizedUtf16String<N, E> {
    fn from(value: String) -> Self {
        SizedUtf16String::from(value.as_str())
    }
}

impl<const N: usize, E: Endianness> From<&SizedUtf16String<N, E>> for String {
    fn from(value: &SizedUtf16String<N, E>) -> Self {
        let u16_values = u8_slice_to_u16::<E>(&value.raw);
        String::from_utf16_lossy(&u16_values)
    }
}

impl<const N: usize, E: Endianness> Display for SizedUtf16String<N, E> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        String::from(self).fmt(f)
    }
}

impl<const N: usize, E: Endianness> Default for SizedUtf16String<N, E> {
    fn default() -> Self {
        Self {
            raw: [0; N],
            endian: PhantomData,
        }
    }
}

impl<const N: usize, E: Endianness> Serialize for SizedUtf16String<N, E> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.to_string().serialize(serializer)
    }
}

impl<const N: usize, E: Endianness> Deref for SizedUtf16String<N, E> {
    type Target = [u8];

    fn deref(&self) -> &[u8] {
        &self.raw
    }
}

impl<const N: usize, E: Endianness> std::fmt::Debug for SizedUtf16String<N, E> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut byte_string = String::from("0x");
        for byte in self.raw {
            write!(byte_string, "{:02X}", byte)?;
        }

        f.debug_tuple(&format!("SizedUtf16String<{N}, {}>", E::name()))
            .field(&self.to_string())
            .field(&byte_string)
            .finish()
    }
}

#[cfg(feature = "randomize")]
impl<const N: usize, E: Endianness> Randomize for SizedUtf16String<N, E> {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        let length: usize = rng.random_range(0..N);
        let utf8: String = Alphanumeric.sample_string(rng, length);
        Self::from(utf8)
    }
}

#[cfg(feature = "wasm")]
impl<const N: usize, E: Endianness> WasmDescribe for SizedUtf16String<N, E> {
    fn describe() {
        js_sys::JsString::describe()
    }
}

#[cfg(feature = "wasm")]
impl<const N: usize, E: Endianness> IntoWasmAbi for SizedUtf16String<N, E> {
    type Abi = <js_sys::JsString as IntoWasmAbi>::Abi;

    fn into_abi(self) -> Self::Abi {
        JsValue::from_str(&self.to_string()).into_abi()
    }
}

#[cfg(feature = "wasm")]
impl<const N: usize, E: Endianness> FromWasmAbi for SizedUtf16String<N, E> {
    type Abi = <js_sys::JsString as IntoWasmAbi>::Abi;

    unsafe fn from_abi(js: Self::Abi) -> Self {
        let val = unsafe { JsValue::from_abi(js) };
        Self::from(val.as_string().unwrap_or_default())
    }
}

fn u8_slice_to_u16<E: Endianness>(slice: &[u8]) -> Vec<u16> {
    slice
        .as_chunks::<2>()
        .0
        .iter()
        .map(E::u16_from_bytes)
        .take_while(|val| *val != TERMINATOR)
        .collect()
}

fn u8_array_reverse_endian<const N: usize>(array: &mut [u8; N]) {
    for chunk in array.as_chunks_mut::<2>().0 {
        chunk.swap(0, 1);
    }
}
