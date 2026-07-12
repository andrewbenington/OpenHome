mod pk8;

mod pk8_buffer;
use pk8_buffer::Pk8Buffer;

mod save;
use pkm_rs_resources::metadata_source::MetadataSource;
// pub use save::Gen7AlolaSave;

pub use pk8::*;
use pkm_rs_resources;
use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::moves::MoveDataOffsets;
use pkm_rs_resources::ribbons::ModernRibbon;
use pkm_rs_resources::species::SpeciesAndForm;
use pkm_rs_resources::species::form_metadata::source_has_form_metadata;
#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

use serde::Serialize;

pub(crate) const PKM_DATA_SIZE: usize = 344;

const MAX_RIBBON_SWSH: usize = ModernRibbon::TowerMaster as usize;

const MOVE_DATA_OFFSETS: MoveDataOffsets = MoveDataOffsets {
    moves: 114,
    pp: 122,
    pp_ups: 126,
};

const AS_ONE_SHADOW_RIDER: u16 = 267;
pub type Pk8AbilityIndex = AbilityIndexBounded<AS_ONE_SHADOW_RIDER>;

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

impl Serialize for Pk8SpeciesAndForm {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
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

use crate::result::Error;

impl TryFrom<SpeciesAndForm> for Pk8SpeciesAndForm {
    type Error = Error;

    fn try_from(value: SpeciesAndForm) -> Result<Self, Self::Error> {
        Self::try_new(value).ok_or(Error::form_index(value))
    }
}
