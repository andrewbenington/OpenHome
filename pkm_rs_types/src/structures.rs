use serde::{Serialize, Serializer};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::util;

const MASK_BITS_1_2: u8 = 0b00000110;
const MASK_BITS_1_2_INVERTED: u8 = 0b11111001;

const MASK_BITS_2_3: u8 = 0b00001100;
const MASK_BITS_2_3_INVERTED: u8 = 0b11110011;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy, Eq, PartialEq)]
pub enum Gender {
    #[default]
    Male,
    Female,
    Genderless,
    Invalid,
}

impl Gender {
    pub const fn set_bits_1_2(&self, dest: &mut u8) {
        *dest &= MASK_BITS_1_2_INVERTED;
        *dest |= self.to_numeric() << 1
    }

    pub const fn from_bits_1_2(source: u8) -> Self {
        let numeric_val = (source & MASK_BITS_1_2) >> 1;
        match numeric_val {
            0 => Self::Male,
            1 => Self::Female,
            2 => Self::Genderless,
            3 => Self::Invalid,
            _ => unreachable!(),
        }
    }

    pub const fn set_bits_2_3(&self, dest: &mut u8) {
        *dest &= MASK_BITS_2_3_INVERTED;
        *dest |= self.to_numeric() << 2
    }

    pub const fn from_bits_2_3(source: u8) -> Self {
        let numeric_val = (source & MASK_BITS_2_3) >> 2;
        match numeric_val {
            0 => Self::Male,
            1 => Self::Female,
            2 => Self::Genderless,
            3 => Self::Invalid,
            _ => unreachable!(),
        }
    }

    const fn to_numeric(self) -> u8 {
        match self {
            Gender::Male => 0,
            Gender::Female => 1,
            Gender::Genderless => 2,
            Gender::Invalid => 3,
        }
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn gender_to_bool(value: Gender) -> bool {
    value == Gender::Female
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn gender_from_bool(value: bool) -> Gender {
    Gender::from(value)
}

impl From<bool> for Gender {
    fn from(value: bool) -> Self {
        match value {
            true => Self::Female,
            false => Self::Male,
        }
    }
}

impl From<Gender> for bool {
    fn from(value: Gender) -> Self {
        value == Gender::Female
    }
}

#[derive(Debug, Clone, Copy)]
pub struct FlagSet<const N: usize> {
    raw: [u8; N],
}

impl<const N: usize> FlagSet<N> {
    pub const fn from_bytes(bytes: [u8; N]) -> Self {
        FlagSet { raw: bytes }
    }

    pub fn get_indices(&self) -> Vec<usize> {
        self.raw
            .iter()
            .enumerate()
            .flat_map(|(i, &byte)| {
                let mut indices = vec![];
                let mut remaining = byte;
                let base = i * 8;

                while remaining != 0 {
                    let bit_pos = remaining.trailing_zeros() as usize;
                    indices.push(base + bit_pos);
                    remaining &= remaining - 1;
                }
                indices
            })
            .collect()
    }

    pub const fn to_bytes(self) -> [u8; N] {
        self.raw
    }

    pub fn set_index(&mut self, index: u8, value: bool) {
        util::set_flag(&mut self.raw, 0, index as usize, value);
    }

    pub const fn clear_all(&mut self) {
        self.raw = [0; N]
    }

    pub fn add_index(&mut self, index: u8) {
        self.set_index(index, true);
    }

    pub fn add_indices(&mut self, indices: Vec<u8>) {
        indices.into_iter().for_each(|index| self.add_index(index));
    }

    pub fn from_indices(indices: Vec<u8>) -> Self {
        let mut set = Self::default();
        set.add_indices(indices);
        set
    }
}

impl<const N: usize> Serialize for FlagSet<N> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_bytes(&self.raw)
    }
}

impl<const N: usize> Default for FlagSet<N> {
    fn default() -> Self {
        Self { raw: [0; N] }
    }
}

impl<const N: usize> FromIterator<u8> for FlagSet<N> {
    fn from_iter<T: IntoIterator<Item = u8>>(iter: T) -> Self {
        Self::from_indices(iter.into_iter().collect())
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, Default)]
pub struct PokeDate {
    year_minus_2000: u8,
    pub month: u8,
    pub day: u8,
}

impl PokeDate {
    pub const fn from_bytes(bytes: [u8; 3]) -> Self {
        PokeDate {
            year_minus_2000: bytes[0],
            month: bytes[1],
            day: bytes[2],
        }
    }
    pub const fn from_bytes_optional(bytes: [u8; 3]) -> Option<Self> {
        if bytes[1] == 0 {
            return None;
        }
        Some(PokeDate {
            year_minus_2000: bytes[0],
            month: bytes[1],
            day: bytes[2],
        })
    }

    pub const fn to_bytes(self) -> [u8; 3] {
        [self.year_minus_2000, self.month, self.day]
    }

    pub const fn to_bytes_optional(value: Option<PokeDate>) -> [u8; 3] {
        match value {
            Some(date) => date.to_bytes(),
            None => [0, 0, 0],
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl PokeDate {
    #[cfg(feature = "wasm")]
    #[wasm_bindgen(constructor)]
    pub fn new(year: u32, month: u8, day: u8) -> Self {
        Self {
            year_minus_2000: (year - 2000) as u8,
            month,
            day,
        }
    }

    #[cfg(feature = "wasm")]
    pub fn year(&self) -> u32 {
        (self.year_minus_2000 as u32) + 2000
    }

    #[cfg(feature = "wasm")]
    pub fn set_year(&mut self, value: u32) {
        self.year_minus_2000 = (value - 2000) as u8
    }
}

impl Serialize for PokeDate {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        if self.month != 0 {
            serializer.serialize_str(&format!(
                "{}/{}/{}",
                self.month,
                self.day,
                self.year_minus_2000 as u16 + 2000
            ))
        } else {
            serializer.serialize_none()
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, Default, Serialize)]
pub struct TrainerMemory {
    pub intensity: u8,
    pub memory: u8,
    pub feeling: u8,

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = textVariables))]
    pub text_variable: u16,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl TrainerMemory {
    #[cfg_attr(feature = "wasm", wasm_bindgen(constructor))]
    pub fn new(intensity: u8, memory: u8, feeling: u8, text_variable: u16) -> TrainerMemory {
        TrainerMemory {
            intensity,
            memory,
            feeling,
            text_variable,
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, Default, Serialize)]
pub struct Geolocation {
    pub region: u8,
    pub country: u8,
}

impl Geolocation {
    pub const fn from_bytes(bytes: [u8; 2]) -> Self {
        Self {
            region: bytes[0],
            country: bytes[1],
        }
    }

    pub const fn to_bytes(self) -> [u8; 2] {
        [self.region, self.country]
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl Geolocation {
    #[cfg(feature = "wasm")]
    #[wasm_bindgen(constructor)]
    pub fn new(region: u8, country: u8) -> Geolocation {
        Geolocation { region, country }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, Default, Serialize)]
pub struct Geolocations(
    pub Geolocation,
    pub Geolocation,
    pub Geolocation,
    pub Geolocation,
    pub Geolocation,
);

impl Geolocations {
    pub fn from_bytes(bytes: [u8; 10]) -> Self {
        Self(
            Geolocation::from_bytes(bytes[0..2].try_into().unwrap()),
            Geolocation::from_bytes(bytes[2..4].try_into().unwrap()),
            Geolocation::from_bytes(bytes[4..6].try_into().unwrap()),
            Geolocation::from_bytes(bytes[6..8].try_into().unwrap()),
            Geolocation::from_bytes(bytes[8..10].try_into().unwrap()),
        )
    }

    pub fn to_bytes(self) -> [u8; 10] {
        let mut bytes = [0u8; 10];
        bytes[0..2].copy_from_slice(&self.0.to_bytes());
        bytes[2..4].copy_from_slice(&self.1.to_bytes());
        bytes[4..6].copy_from_slice(&self.2.to_bytes());
        bytes[6..8].copy_from_slice(&self.3.to_bytes());
        bytes[8..10].copy_from_slice(&self.4.to_bytes());
        bytes
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl Geolocations {
    #[cfg(feature = "wasm")]
    #[wasm_bindgen(constructor)]
    pub fn new(
        geo1: Geolocation,
        geo2: Geolocation,
        geo3: Geolocation,
        geo4: Geolocation,
        geo5: Geolocation,
    ) -> Geolocations {
        Geolocations(geo1, geo2, geo3, geo4, geo5)
    }
}

pub trait BitSet {
    fn set_bit(&mut self, bit_index: u8, value: bool);
}

impl BitSet for u8 {
    fn set_bit(&mut self, bit_index: u8, value: bool) {
        if value {
            *self |= 1 << bit_index;
        } else {
            *self &= !(1 << bit_index);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn flagset_indices() {
        let flagset = FlagSet {
            raw: [0b10010100, 0b10110010],
        };
        println!("{:?}", flagset.get_indices());
    }

    #[test]
    fn gender_get() {
        assert_eq!(Gender::from_bits_1_2(0b00000000), Gender::Male);
        assert_eq!(Gender::from_bits_1_2(0b00000010), Gender::Female);
        assert_eq!(Gender::from_bits_1_2(0b00000100), Gender::Genderless);
        assert_eq!(Gender::from_bits_1_2(0b00000110), Gender::Invalid);
    }

    #[test]
    fn gender_set() {
        let mut byte = 0u8;
        Gender::Male.set_bits_1_2(&mut byte);
        assert_eq!(byte, 0b000);

        let mut byte = 0u8;
        Gender::Female.set_bits_1_2(&mut byte);
        assert_eq!(byte, 0b010);

        let mut byte = 0u8;
        Gender::Genderless.set_bits_1_2(&mut byte);
        assert_eq!(byte, 0b100);

        let mut byte = 0u8;
        Gender::Invalid.set_bits_1_2(&mut byte);
        assert_eq!(byte, 0b110);
    }

    #[test]
    fn gender_set_overrides() {
        let mut byte_with_invalid_gender = 0b00000110;
        Gender::Female.set_bits_1_2(&mut byte_with_invalid_gender);
        assert_eq!(byte_with_invalid_gender, 0b00000010);
    }
}
