use arbitrary_int::u3;
use serde::{Serialize, Serializer};

use strum_macros::{Display, EnumString};
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::{OriginGame, strings::SizedUtf16String, util};

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
#[cfg(feature = "randomize")]
use rand::RngExt;

const MASK_BITS_1_2: u8 = 0b00000110;
const MASK_BITS_1_2_INVERTED: u8 = 0b11111001;

const MASK_BITS_2_3: u8 = 0b00001100;
const MASK_BITS_2_3_INVERTED: u8 = 0b11110011;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, EnumString, Display, Default, Serialize, Clone, Copy, Eq, PartialEq)]
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
        *dest |= self.to_byte() << 1
    }

    pub fn from_bits_1_2(source: u8) -> Self {
        let numeric_val = (source & MASK_BITS_1_2) >> 1;
        match numeric_val {
            0 => Self::Male,
            1 => Self::Female,
            2 => Self::Genderless,
            3 => Self::Invalid,
            _ => panic!("invalid gender: {numeric_val}"),
        }
    }

    pub const fn set_bits_2_3(&self, dest: &mut u8) {
        *dest &= MASK_BITS_2_3_INVERTED;
        *dest |= self.to_byte() << 2
    }

    pub fn from_bits_2_3(source: u8) -> Self {
        let numeric_val = (source & MASK_BITS_2_3) >> 2;
        match numeric_val {
            0 => Self::Male,
            1 => Self::Female,
            2 => Self::Genderless,
            3 => Self::Invalid,
            _ => panic!("invalid gender: {numeric_val}"),
        }
    }

    pub const fn to_byte(self) -> u8 {
        match self {
            Gender::Male => 0,
            Gender::Female => 1,
            Gender::Genderless => 2,
            Gender::Invalid => 3,
        }
    }

    pub const fn from_u8(byte: u8) -> Self {
        match byte {
            0 => Self::Male,
            1 => Self::Female,
            2 => Self::Genderless,
            _ => Self::Invalid,
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = genderToBool))]
pub fn gender_to_bool(value: Gender) -> bool {
    value == Gender::Female
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = genderFromBool))]
pub fn gender_from_bool(value: bool) -> Gender {
    Gender::from(value)
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = genderToInt))]
#[allow(clippy::missing_const_for_fn)]
pub fn gender_to_int(value: Gender) -> u8 {
    value.to_byte()
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = genderFromInt))]
#[allow(clippy::missing_const_for_fn)]
pub fn gender_from_int(value: u8) -> Gender {
    Gender::from_bits_1_2(value)
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

#[cfg(feature = "randomize")]
impl Randomize for Gender {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        Gender::from_u8(rng.random_range(0..=2))
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, EnumString, Display, Default, Serialize, Clone, Copy, Eq, PartialEq)]
pub enum BinaryGender {
    #[default]
    Male,
    Female,
}

impl From<bool> for BinaryGender {
    fn from(value: bool) -> Self {
        match value {
            true => Self::Female,
            false => Self::Male,
        }
    }
}

impl From<BinaryGender> for bool {
    fn from(value: BinaryGender) -> Self {
        value == BinaryGender::Female
    }
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
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

    pub fn is_empty(&self) -> bool {
        self.raw.iter().all(|byte| *byte == 0)
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

#[cfg(feature = "randomize")]
impl Randomize for PokeDate {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        let month: u8 = rng.random_range(1..=12);
        let year_minus_2000: u8 = rng.random_range(0..=255);
        let day = rng.random_range(
            1..=time::util::days_in_month(
                month
                    .try_into()
                    .expect("random month range must be hardcoded from 1-12"),
                (year_minus_2000 as i32) + 2000,
            ),
        );

        PokeDate {
            year_minus_2000,
            month,
            day,
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
#[derive(Debug, Serialize, Clone)]
pub struct TrainerData {
    pub id: u16,
    pub secret_id: u16,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub name: SizedUtf16String<26>,
    pub friendship: u8,
    pub memory: TrainerMemory,
    pub affection: u8,
    pub gender: Gender,
    pub origin_game: Option<OriginGame>,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
#[allow(clippy::too_many_arguments)]
impl TrainerData {
    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        self.name.to_string()
    }

    #[wasm_bindgen(constructor)]
    pub fn new(
        id: u16,
        secret_id: u16,
        name: String,
        friendship: u8,
        memory: Option<TrainerMemory>,
        affection: u8,
        gender: Gender,
        origin_game: Option<OriginGame>,
    ) -> Self {
        Self {
            id,
            secret_id,
            name: name.into(),
            friendship,
            memory: memory.unwrap_or_default(),
            affection,
            gender,
            origin_game,
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Clone, Copy, Default, Serialize)]
pub struct TrainerMemory {
    pub intensity: u8,
    pub memory: u8,
    pub feeling: u8,

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = textVariables))]
    pub text_variable: u16,
}

impl TrainerMemory {
    pub fn from_bytes_in_order(bytes: &[u8; 5]) -> Self {
        Self {
            intensity: bytes[0],
            memory: bytes[1],
            feeling: bytes[2],
            text_variable: u16::from_le_bytes(bytes[3..5].try_into().unwrap()),
        }
    }

    pub fn to_bytes_in_order(&self) -> [u8; 5] {
        let mut bytes = [0u8; 5];

        bytes[0] = self.intensity;
        bytes[1] = self.memory;
        bytes[2] = self.feeling;
        bytes[3..5].copy_from_slice(&self.text_variable.to_le_bytes());

        bytes
    }

    pub fn from_bytes_switch_trainer(bytes: &[u8; 6]) -> Self {
        Self {
            intensity: bytes[0],
            memory: bytes[1],
            text_variable: u16::from_le_bytes(bytes[3..=4].try_into().unwrap()),
            feeling: bytes[5],
        }
    }

    pub fn to_bytes_switch_trainer(&self) -> [u8; 6] {
        let mut bytes = [0u8; 6];

        bytes[0] = self.intensity;
        bytes[1] = self.memory;
        bytes[3..=4].copy_from_slice(&self.text_variable.to_le_bytes());
        bytes[5] = self.feeling;

        bytes
    }

    pub fn from_bytes_switch_handler(bytes: &[u8; 5]) -> Self {
        Self {
            intensity: bytes[0],
            memory: bytes[1],
            feeling: bytes[2],
            text_variable: u16::from_le_bytes(bytes[3..=4].try_into().unwrap()),
        }
    }

    pub fn to_bytes_switch_handler(&self) -> [u8; 5] {
        let mut bytes = [0u8; 5];

        bytes[0] = self.intensity;
        bytes[1] = self.memory;
        bytes[2] = self.feeling;
        bytes[3..=4].copy_from_slice(&self.text_variable.to_le_bytes());

        bytes
    }
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
#[cfg_attr(feature = "randomize", derive(Randomize))]
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
#[cfg_attr(feature = "randomize", derive(Randomize))]
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

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Default, Debug, Clone, Copy)]
pub struct ShinyLeaves(u8);

impl ShinyLeaves {
    pub const fn from_byte(byte: u8) -> Self {
        match byte >> 5 {
            1 => Self(0b100000),
            _ => Self(byte & 0b11111),
        }
    }

    pub const fn to_byte(&self) -> u8 {
        self.0
    }

    pub const fn is_empty(&self) -> bool {
        self.0 == 0
    }

    pub const fn new_crown() -> Self {
        Self(0b100000)
    }
}

#[cfg(feature = "wasm")]
impl Serialize for ShinyLeaves {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        if self.has_crown() {
            serializer.serialize_str("Crown")
        } else if self.0 == 0 {
            serializer.serialize_str("No Leaves")
        } else {
            let mut leaves = vec![];
            if self.has_first() {
                leaves.push("First");
            }
            if self.has_second() {
                leaves.push("Second");
            }
            if self.has_third() {
                leaves.push("Third");
            }
            if self.has_fourth() {
                leaves.push("Fourth");
            }
            if self.has_fifth() {
                leaves.push("Fifth");
            }
            serializer.serialize_str(&leaves.join(", "))
        }
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl ShinyLeaves {
    #[wasm_bindgen(constructor)]
    pub fn new_empty() -> Self {
        Self::default()
    }

    #[wasm_bindgen(js_name = fromByte)]
    pub fn from_byte_js(byte: u8) -> Self {
        Self::from_byte(byte)
    }

    #[wasm_bindgen(js_name = toByte)]
    pub fn to_byte_js(&self) -> u8 {
        self.to_byte()
    }

    #[wasm_bindgen(js_name = hasFirst)]
    pub fn has_first(&self) -> bool {
        (self.0 & 0b00001) != 0
    }

    #[wasm_bindgen(js_name = hasSecond)]
    pub fn has_second(&self) -> bool {
        (self.0 & 0b00010) != 0
    }

    #[wasm_bindgen(js_name = hasThird)]
    pub fn has_third(&self) -> bool {
        (self.0 & 0b00100) != 0
    }

    #[wasm_bindgen(js_name = hasFourth)]
    pub fn has_fourth(&self) -> bool {
        (self.0 & 0b01000) != 0
    }

    #[wasm_bindgen(js_name = hasFifth)]
    pub fn has_fifth(&self) -> bool {
        (self.0 & 0b10000) != 0
    }

    #[wasm_bindgen(js_name = hasCrown)]
    pub fn has_crown(&self) -> bool {
        (self.0 & 0b100000) != 0
    }

    pub fn count(&self) -> u8 {
        if self.has_crown() {
            return 0;
        }

        self.0.count_ones() as u8
    }

    #[wasm_bindgen(js_name = clone)]
    pub fn clone_js(&self) -> Self {
        Self::from_byte(self.0)
    }
}

#[cfg(feature = "randomize")]
impl Randomize for ShinyLeaves {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        match rng.random_range(0..=1) {
            0 => Self::new_crown(),
            _ => Self::from_byte(rng.random_range(0..=0b11111)),
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Display, Serialize)]
pub enum AbilityNumber {
    #[default]
    First,
    Second,
    Hidden,
}

impl AbilityNumber {
    pub const fn from_u8_first_three_bits(
        byte: u8,
    ) -> core::result::Result<Self, InvalidAbilityNumber> {
        match byte & 0b111 {
            1 => Ok(Self::First),
            2 => Ok(Self::Second),
            4 => Ok(Self::Hidden),
            invalid => Err(InvalidAbilityNumber(u3::new(invalid))),
        }
    }

    pub const fn to_byte(self) -> u8 {
        match self {
            Self::First => 1,
            Self::Second => 2,
            Self::Hidden => 4,
        }
    }
}

impl TryFrom<u3> for AbilityNumber {
    type Error = InvalidAbilityNumber;

    fn try_from(value: u3) -> Result<Self, InvalidAbilityNumber> {
        match value.value() {
            1 => Ok(Self::First),
            2 => Ok(Self::Second),
            4 => Ok(Self::Hidden),
            _ => Err(InvalidAbilityNumber(value)),
        }
    }
}

impl From<AbilityNumber> for u8 {
    fn from(value: AbilityNumber) -> Self {
        match value {
            AbilityNumber::First => 1,
            AbilityNumber::Second => 2,
            AbilityNumber::Hidden => 4,
        }
    }
}

#[derive(Debug)]
pub struct InvalidAbilityNumber(pub u3);

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

    #[cfg(feature = "wasm")]
    #[test]
    fn shiny_leaves_to_from_byte() {
        let byte = 0b01010;
        let leaves = ShinyLeaves::from_byte(byte);

        assert!(!leaves.has_first());
        assert!(leaves.has_second());
        assert!(!leaves.has_third());
        assert!(leaves.has_fourth());
        assert!(!leaves.has_fifth());
        assert!(!leaves.has_crown());

        let back_to_byte = leaves.to_byte();
        assert_eq!(byte, back_to_byte);

        let crown_byte = 0b100000;
        let crown = ShinyLeaves::from_byte(crown_byte);

        if !crown.has_crown() {
            panic!("expected crown, got leaves");
        };
    }
}
