#[cfg(feature = "wasm")]
use pkm_rs_resources::ribbons::ModernRibbon;

#[cfg(feature = "wasm")]
mod pa9;
#[cfg(feature = "wasm")]
pub use pa9::*;
#[cfg(feature = "wasm")]
mod pa9_buffer;
#[cfg(feature = "wasm")]
pub use pa9_buffer::Pa9Buffer;
mod plus_moves;
use pkm_rs_resources::{
    abilities::AbilityIndexBounded,
    metadata_source::MetadataSource,
    species::{SpeciesForm, metadata_table::source_has_form_metadata},
};
pub use plus_moves::*;

use crate::result::Error;

#[cfg(feature = "wasm")]
pub(crate) const PKM_DATA_SIZE: usize = 344;

#[cfg(any(test, feature = "wasm"))]
const MAX_BOX_COUNT: u8 = 32;

#[cfg(any(test, feature = "wasm"))]
const BOX_ROWS: u8 = 5;
#[cfg(any(test, feature = "wasm"))]
const BOX_COLS: u8 = 6;

#[cfg(any(test, feature = "wasm"))]
pub(crate) const BOX_SLOTS: u8 = BOX_ROWS * BOX_COLS;
#[cfg(feature = "wasm")]
pub(crate) const BOX_NAME_LENGTH: usize = 34;

#[cfg(feature = "wasm")]
const MAX_RIBBON_LZA: usize = ModernRibbon::Partner as usize;

#[cfg(feature = "wasm")]
pub const TM_FLAG_BYTE_LENGTH_BASE: usize = 25;
pub const TM_FLAG_BYTE_LENGTH_DLC: usize = 13;

#[derive(Debug, Clone, Copy, Default)]
pub struct Pa9SpeciesAndForm(SpeciesForm);

impl Pa9SpeciesAndForm {
    fn if_allowed(species_and_form: SpeciesForm) -> Option<Self> {
        if source_has_form_metadata(
            MetadataSource::LegendsZa,
            species_and_form.get_ndex() as u16,
            species_and_form.get_form_index(),
        ) {
            Some(Self(species_and_form))
        } else {
            None
        }
    }

    pub const fn into_inner(self) -> SpeciesForm {
        self.0
    }
}

impl serde::Serialize for Pa9SpeciesAndForm {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.0.serialize(serializer)
    }
}

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg(feature = "randomize")]
impl Randomize for Pa9SpeciesAndForm {
    fn randomized<R: rand::prelude::Rng>(rng: &mut R) -> Self {
        loop {
            if let Some(randomized) = Self::if_allowed(SpeciesForm::randomized(rng)) {
                return randomized;
            }
        }
    }
}

impl TryFrom<SpeciesForm> for Pa9SpeciesAndForm {
    type Error = Error;

    fn try_from(value: SpeciesForm) -> std::result::Result<Self, Self::Error> {
        let (national_dex, form_index) = value.split();
        Self::if_allowed(value).ok_or(Error::other(&format!(
            "invalid species form for pa9: {national_dex}/{form_index}"
        )))
    }
}
