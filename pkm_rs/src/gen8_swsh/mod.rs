use std::fmt::Display;

use pkm_rs_resources::metadata_source::MetadataSource;
use pkm_rs_types::strings::SizedUtf16String;

use crate::result::{Error, Result};
pub use pk8::*;
use pk8_buffer::Pk8Buffer;
use pkm_rs_resources;
use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::ribbons::ModernRibbon;
use pkm_rs_resources::species::SpeciesAndForm;
use pkm_rs_resources::species::form_metadata::source_has_form_metadata;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

mod pk8;
mod pk8_buffer;
mod save;
mod save_blocks;

pub(crate) const PKM_DATA_SIZE: usize = 344;

const MAX_BOX_COUNT: u8 = 32;
const BOX_ROWS: u8 = 5;
const BOX_COLS: u8 = 6;
const BOX_SLOTS: u8 = BOX_ROWS * BOX_COLS;
const BOX_NAME_LENGTH: usize = 34;
const MAX_ABILITY_INDEX: u16 = 267; // As One (Calyrex Shadow Rider)
const MAX_RIBBON_SWSH: usize = ModernRibbon::TowerMaster as usize;

pub type Pk8AbilityIndex = AbilityIndexBounded<MAX_ABILITY_INDEX>;

type BoxName = SizedUtf16String<BOX_NAME_LENGTH>;

#[derive(Debug, Clone, Copy, Default)]
pub struct Pk8SpeciesAndForm(SpeciesAndForm);

impl Pk8SpeciesAndForm {
    fn try_new(species_and_form: SpeciesAndForm) -> Option<Self> {
        if source_has_form_metadata(
            MetadataSource::SwordShield,
            species_and_form.get_ndex().to_u16(),
            species_and_form.get_forme_index(),
        ) {
            Some(Self(species_and_form))
        } else {
            None
        }
    }

    pub const fn into_inner(self) -> SpeciesAndForm {
        self.0
    }
}

impl serde::Serialize for Pk8SpeciesAndForm {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.0.serialize(serializer)
    }
}

#[cfg(feature = "randomize")]
impl Randomize for Pk8SpeciesAndForm {
    fn randomized<R: rand::prelude::Rng>(rng: &mut R) -> Self {
        loop {
            if let Some(randomized) = Self::try_new(SpeciesAndForm::randomized(rng)) {
                return randomized;
            }
        }
    }
}

impl TryFrom<SpeciesAndForm> for Pk8SpeciesAndForm {
    type Error = Error;

    fn try_from(value: SpeciesAndForm) -> std::result::Result<Self, Self::Error> {
        Self::try_new(value).ok_or(Error::form_index(value))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
struct BoxIndex(u8);

impl BoxIndex {
    pub const fn new(raw: u8) -> Result<Self> {
        match raw {
            ..=MAX_BOX_COUNT => Ok(Self(raw)),
            _ => Err(Error::BoxIndex(raw)),
        }
    }

    #[cfg(test)]
    pub fn all() -> impl IntoIterator<Item = Self> {
        (0..MAX_BOX_COUNT).map(Self)
    }
}

impl std::ops::Mul<BoxIndex> for usize {
    type Output = usize;

    fn mul(self, rhs: BoxIndex) -> Self::Output {
        rhs.0 as usize * self
    }
}

impl TryFrom<u8> for BoxIndex {
    type Error = Error;

    fn try_from(value: u8) -> std::result::Result<Self, Self::Error> {
        Self::new(value)
    }
}

impl Display for BoxIndex {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(f)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
struct BoxSlot(u8);

impl BoxSlot {
    pub const fn new(raw: u8) -> Result<Self> {
        match raw {
            ..=BOX_SLOTS => Ok(Self(raw)),
            _ => Err(Error::BoxIndex(raw)),
        }
    }

    #[cfg(test)]
    pub fn all() -> impl IntoIterator<Item = Self> {
        (0..BOX_SLOTS).map(Self)
    }
}

impl std::ops::Mul<BoxSlot> for usize {
    type Output = usize;

    fn mul(self, rhs: BoxSlot) -> Self::Output {
        rhs.0 as usize * self
    }
}

impl TryFrom<u8> for BoxSlot {
    type Error = Error;

    fn try_from(value: u8) -> std::result::Result<Self, Self::Error> {
        Self::new(value)
    }
}

impl Display for BoxSlot {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(f)
    }
}
