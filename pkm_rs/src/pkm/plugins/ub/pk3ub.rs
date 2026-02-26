use pkm_rs_resources::species::SpeciesAndForme;
use serde::Serialize;

use crate::pkm::plugins::cfru::pk3cfru::Pk3Cfru;
use crate::pkm::plugins::ub::conversion::{NATIONAL_DEX_TO_UB_MAP, UB_TO_NATIONAL_DEX_MAP};
use crate::pkm::{Error, NdexConvertSource};
use crate::pkm::{Result, plugins::cfru::pk3cfru::CfruSpeciesIndex};

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[derive(Clone, Copy, Serialize)]
pub struct UnboundSpeciesIndex(u16);

impl CfruSpeciesIndex for UnboundSpeciesIndex {
    fn try_to_species_and_forme(self) -> Result<SpeciesAndForme> {
        UB_TO_NATIONAL_DEX_MAP
            .get(&self.0)
            .ok_or(Error::GameDex {
                value: self.0,
                game: NdexConvertSource::Gen3UB,
            })
            .copied()
    }

    fn try_from_species_and_forme(saf: &SpeciesAndForme) -> Result<Self> {
        NATIONAL_DEX_TO_UB_MAP
            .get(&saf.to_tuple())
            .ok_or(Error::GenDex {
                saf: *saf,
                generation: NdexConvertSource::Gen3UB,
            })
            .copied()
            .map(UnboundSpeciesIndex)
    }

    fn is_fakemon(&self) -> bool {
        false
    }

    fn plugin_identifier() -> &'static str {
        "unbound"
    }
}

impl From<u16> for UnboundSpeciesIndex {
    fn from(value: u16) -> Self {
        Self(value)
    }
}

impl From<UnboundSpeciesIndex> for u16 {
    fn from(value: UnboundSpeciesIndex) -> Self {
        value.0
    }
}

#[cfg(feature = "randomize")]
impl Randomize for UnboundSpeciesIndex {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        use rand::RngExt;

        let valid_ub_indices: Vec<_> = UB_TO_NATIONAL_DEX_MAP.keys().collect();

        let randomized_valid_index = *valid_ub_indices[rng.random_range(0..valid_ub_indices.len())];

        Self(randomized_valid_index)
    }
}
pub type Pk3ub = Pk3Cfru<UnboundSpeciesIndex>;
