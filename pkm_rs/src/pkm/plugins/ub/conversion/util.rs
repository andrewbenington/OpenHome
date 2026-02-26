use pkm_rs_resources::species::SpeciesAndForme;

use crate::pkm::plugins::ub::conversion::{NATIONAL_DEX_TO_UB_MAP, UB_TO_NATIONAL_DEX_MAP};
use crate::pkm::{Error, NdexConvertSource, Result};

/// Convert game index to National Dex entry
pub fn from_gen3_ub_pokemon_index(species_index: u16) -> Result<SpeciesAndForme> {
    UB_TO_NATIONAL_DEX_MAP
        .get(&species_index)
        .ok_or(Error::GameDex {
            value: species_index,
            game: NdexConvertSource::Gen3UB,
        })
        .copied()
}
