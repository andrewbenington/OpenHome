use serde::Serialize;
use std::{fmt::Display, marker::PhantomData};

use crate::conversion::gen3_string_encoding;

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

const TERMINATOR: u8 = 0xff;

pub type Gen3NicknameString<const N: usize> = Gen3String<N, SingleTerminator>;
pub type Gen3TrainerString<const N: usize> = Gen3String<N, TerminatorFill>;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Gen3String<const N: usize, TS: TerminatorStrategy> {
    raw: [u8; N],
    _terminator_strategy: PhantomData<TS>,
}

impl<const N: usize, TS: TerminatorStrategy> Gen3String<N, TS> {
    const fn from_raw(raw: [u8; N]) -> Self {
        Self {
            raw,
            _terminator_strategy: PhantomData,
        }
    }

    fn from_str_inner(s: &str) -> Self {
        let mut raw = [0; N];
        let encoded: Vec<u8> = s.chars().filter_map(gen3_string_encoding::encode).collect();

        let len = encoded.len().min(N);
        raw[..len].copy_from_slice(&encoded[..len]);

        TS::set_terminators(&mut raw, len);

        Self::from_raw(raw)
    }

    pub fn from_stringlike(value: impl Into<String>) -> Self {
        Self::from_str_inner(&value.into())
    }

    // because both have the same N, both are enforced to be the same length and no length check is needed
    pub fn identical_until_terminator(&self, other: &Gen3String<N, TS>) -> bool {
        self.raw
            .into_iter()
            .take_while(|byte| *byte != TERMINATOR)
            .enumerate()
            .all(|(index, byte)| other.raw[index] == byte)
    }
}

pub trait TerminatorStrategy {
    fn set_terminators<const N: usize>(raw: &mut [u8; N], str_len: usize);
}

#[derive(Debug, Clone, Copy)]
pub struct SingleTerminator;
impl TerminatorStrategy for SingleTerminator {
    fn set_terminators<const N: usize>(raw: &mut [u8; N], str_len: usize) {
        if str_len < N {
            raw[str_len] = TERMINATOR;
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct TerminatorFill;
impl TerminatorStrategy for TerminatorFill {
    fn set_terminators<const N: usize>(raw: &mut [u8; N], str_len: usize) {
        (str_len..N).for_each(|i| {
            raw[i] = TERMINATOR;
        });
    }
}

impl<const N: usize, TS: TerminatorStrategy> From<&str> for Gen3String<N, TS> {
    fn from(value: &str) -> Self {
        Self::from_str_inner(value)
    }
}

impl<const N: usize, TS: TerminatorStrategy> From<String> for Gen3String<N, TS> {
    fn from(value: String) -> Self {
        Self::from_str_inner(&value)
    }
}

impl<const N: usize, TS: TerminatorStrategy> From<&Gen3String<N, TS>> for String {
    fn from(val: &Gen3String<N, TS>) -> Self {
        val.raw
            .iter()
            .copied()
            .take_while(|c| *c != TERMINATOR)
            .map(gen3_string_encoding::decode)
            .map(|o| o.unwrap_or('\u{FFFD}'))
            .collect()
    }
}

impl<const N: usize, TS: TerminatorStrategy> From<Gen3String<N, TS>> for String {
    fn from(val: Gen3String<N, TS>) -> Self {
        (&val).into()
    }
}

impl<const N: usize, TS: TerminatorStrategy> Display for Gen3String<N, TS> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let decoded: String = self.into();

        write!(f, "{decoded}")
    }
}

impl<const N: usize, TS: TerminatorStrategy> Default for Gen3String<N, TS> {
    fn default() -> Self {
        Self::from_raw([0; N])
    }
}

impl<const N: usize, TS: TerminatorStrategy> Serialize for Gen3String<N, TS> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.to_string().serialize(serializer)
    }
}

impl<const N: usize, TS: TerminatorStrategy> Gen3String<N, TS> {
    pub const fn from_bytes(bytes: [u8; N]) -> Self {
        Self::from_raw(bytes)
    }

    pub const fn bytes(&self) -> [u8; N] {
        self.raw
    }
}

#[cfg(feature = "randomize")]
impl<const N: usize, TS: TerminatorStrategy> Randomize for Gen3String<N, TS> {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        let length: usize = rng.random_range(0..N);
        let utf8: String = Alphanumeric.sample_string(rng, length);
        Self::from(utf8)
    }
}

#[cfg(feature = "wasm")]
impl<const N: usize, TS: TerminatorStrategy> WasmDescribe for Gen3String<N, TS> {
    fn describe() {
        js_sys::JsString::describe()
    }
}

#[cfg(feature = "wasm")]
impl<const N: usize, TS: TerminatorStrategy> IntoWasmAbi for Gen3String<N, TS> {
    type Abi = <js_sys::JsString as IntoWasmAbi>::Abi;

    fn into_abi(self) -> Self::Abi {
        JsValue::from_str(&self.to_string()).into_abi()
    }
}

#[cfg(feature = "wasm")]
impl<const N: usize, TS: TerminatorStrategy> FromWasmAbi for Gen3String<N, TS> {
    type Abi = <js_sys::JsString as IntoWasmAbi>::Abi;

    unsafe fn from_abi(js: Self::Abi) -> Self {
        let val = unsafe { JsValue::from_abi(js) };
        Self::from(val.as_string().unwrap_or_default())
    }
}
