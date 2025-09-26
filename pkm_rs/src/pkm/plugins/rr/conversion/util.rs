use crate::pkm::plugins::rr::conversion::{NATIONAL_DEX_TO_RR_MAP, RR_TO_NATIONAL_DEX_MAP};
use crate::pkm::{Error, NdexConvertSource, Result};
use crate::resources::SpeciesAndForme;

/// Convert game index to National Dex entry
pub fn from_gen3_rr_pokemon_index(species_index: u16) -> Result<SpeciesAndForme> {
    RR_TO_NATIONAL_DEX_MAP
        .get(&species_index)
        .ok_or(Error::GameDex {
            value: species_index,
            game: NdexConvertSource::Gen3RR,
        })
        .copied()
}

/// Convert National Dex + Form index to game index
pub fn to_gen3_rr_pokemon_index(saf: &SpeciesAndForme) -> Result<u16> {
    NATIONAL_DEX_TO_RR_MAP
        .get(&saf.to_tuple())
        .ok_or(Error::GenDex {
            saf: *saf,
            generation: NdexConvertSource::Gen3RR,
        })
        .copied()
}
