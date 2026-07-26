use pkm_rs_resources::metadata_source::MetadataSource;

use crate::result::Error;
#[cfg(feature = "wasm")]
use pk9_buffer::Pk9Buffer;
use pkm_rs_resources;
use pkm_rs_resources::abilities::AbilityIndexBounded;
#[cfg(feature = "wasm")]
use pkm_rs_resources::ribbons::ModernRibbon;
use pkm_rs_resources::species::SpeciesAndForm;
use pkm_rs_resources::species::form_metadata::source_has_form_metadata;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg(feature = "wasm")]
mod pk9;
#[cfg(feature = "wasm")]
pub use pk9::*;
#[cfg(feature = "wasm")]
mod pk9_buffer;
#[cfg(feature = "wasm")]
mod pokemon_index;
// mod save;
// mod save_blocks;

#[cfg(feature = "wasm")]
pub(crate) const PKM_DATA_SIZE: usize = 344;

#[cfg(test)]
const MAX_BOX_COUNT: u8 = 32;
#[cfg(test)]
const BOX_ROWS: u8 = 5;
#[cfg(test)]
const BOX_COLS: u8 = 6;
#[cfg(test)]
const BOX_SLOTS: u8 = BOX_ROWS * BOX_COLS;
// const BOX_NAME_LENGTH: usize = 34;
const MAX_ABILITY_INDEX: u16 = 310; // Poison Puppeteer

#[cfg(feature = "wasm")]
const MAX_RIBBON_SV: usize = ModernRibbon::Partner as usize;

pub const TM_FLAG_BYTE_LENGTH_BASE: usize = 25;
pub const TM_FLAG_BYTE_LENGTH_DLC: usize = 13;

pub type Pk9AbilityIndex = AbilityIndexBounded<MAX_ABILITY_INDEX>;

// type BoxName = SizedUtf16String<BOX_NAME_LENGTH>;

#[derive(Debug, Clone, Copy, Default)]
pub struct Pk9SpeciesAndForm(SpeciesAndForm);

impl Pk9SpeciesAndForm {
    fn try_new(species_and_form: SpeciesAndForm) -> Option<Self> {
        if source_has_form_metadata(
            MetadataSource::ScarletViolet,
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

impl serde::Serialize for Pk9SpeciesAndForm {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.0.serialize(serializer)
    }
}

#[cfg(feature = "randomize")]
impl Randomize for Pk9SpeciesAndForm {
    fn randomized<R: rand::prelude::Rng>(rng: &mut R) -> Self {
        loop {
            if let Some(randomized) = Self::try_new(SpeciesAndForm::randomized(rng)) {
                return randomized;
            }
        }
    }
}

impl TryFrom<SpeciesAndForm> for Pk9SpeciesAndForm {
    type Error = Error;

    fn try_from(value: SpeciesAndForm) -> std::result::Result<Self, Self::Error> {
        Self::try_new(value).ok_or(Error::other(&format!(
            "invalid species form for pk9: {}/{}",
            value.get_ndex(),
            value.get_forme_index()
        )))
    }
}

#[cfg(test)]
type BoxIndex = pkm_rs_types::BoundedU8<{ MAX_BOX_COUNT - 1 }>;

#[cfg(test)]
type BoxSlot = pkm_rs_types::BoundedU8<{ BOX_SLOTS - 1 }>;

#[cfg(test)]
mod test {
    use super::{BOX_SLOTS, BoxIndex, BoxSlot, MAX_BOX_COUNT};
    use crate::result::{Error, Result};

    #[test]
    fn all_boxes_valid() -> Result<()> {
        for index in 0..MAX_BOX_COUNT {
            BoxIndex::check_bound(index).or(Err(Error::BoxIndex(index)))?;
        }

        for slot in 0..BOX_SLOTS {
            BoxSlot::check_bound(slot).or(Err(Error::BoxSlot(slot)))?;
        }

        Ok(())
    }
}
