mod pk7;

mod pk7_buffer;
use pk7_buffer::Pk7Buffer;

mod save;
use pkm_rs_resources::metadata_source::MetadataSource;
pub use save::Gen7AlolaSave;

pub use pk7::*;
use pkm_rs_resources;
use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::ribbons::ModernRibbon;
use pkm_rs_resources::species::SpeciesAndForm;
use pkm_rs_resources::species::form_metadata::source_has_form_metadata;
#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

use serde::Serialize;

pub(crate) const BOX_SIZE: usize = 232;
pub(crate) const PARTY_SIZE: usize = 260;

pub const BOX_COUNT: u8 = 32;
pub const BOX_ROWS: u8 = 5;
pub const BOX_COLS: u8 = 6;
pub const BOX_SLOTS: u8 = BOX_ROWS * BOX_COLS;

const MAX_RIBBON_ALOLA: usize = ModernRibbon::BattleTreeMaster as usize;

const NEUROFORCE: u16 = 233;
pub type Pk7AbilityIndex = AbilityIndexBounded<NEUROFORCE>;

#[derive(Debug, Clone, Copy, Default)]
pub struct Pk7SpeciesAndForm(SpeciesAndForm);

impl Pk7SpeciesAndForm {
    fn try_new(species_and_form: SpeciesAndForm) -> Option<Self> {
        if source_has_form_metadata(
            MetadataSource::UltraSunUltraMoon,
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

impl Serialize for Pk7SpeciesAndForm {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.0.serialize(serializer)
    }
}

#[cfg(feature = "randomize")]
impl Randomize for Pk7SpeciesAndForm {
    fn randomized<R: rand::prelude::Rng>(rng: &mut R) -> Self {
        loop {
            if let Some(randomized) = Self::try_new(SpeciesAndForm::randomized(rng)) {
                return randomized;
            }
        }
    }
}

use crate::result::Error;

impl TryFrom<SpeciesAndForm> for Pk7SpeciesAndForm {
    type Error = Error;

    fn try_from(value: SpeciesAndForm) -> Result<Self, Self::Error> {
        Self::try_new(value).ok_or(Error::form_index(value))
    }
}

type BoxIndex = pkm_rs_types::BoundedU8<{ BOX_COUNT - 1 }>;
type BoxSlot = pkm_rs_types::BoundedU8<{ BOX_SLOTS - 1 }>;

#[cfg(test)]
mod test {
    use super::{BOX_COUNT, BOX_SLOTS, BoxIndex, BoxSlot};
    use crate::result::{Error, Result};

    #[test]
    fn all_boxes_valid() -> Result<()> {
        for index in 0..BOX_COUNT {
            BoxIndex::check_bound(index).or(Err(Error::BoxIndex(index)))?;
        }

        for slot in 0..BOX_SLOTS {
            BoxSlot::check_bound(slot).or(Err(Error::BoxSlot(slot)))?;
        }

        Ok(())
    }
}
