use crate::pkm::plugins::rr::conversion::{NATIONAL_DEX_TO_RR_MAP, RR_TO_NATIONAL_DEX_MAP};
use crate::pkm::{Error, NdexConvertSource, Result};
use crate::resources::SpeciesAndForme;

/// Convert game index to National Dex entry
pub fn from_gen3_rr_pokemon_index(rr_species_index: u16) -> Result<SpeciesAndForme> {
    RR_TO_NATIONAL_DEX_MAP
        .get(&rr_species_index)
        .ok_or(Error::NationalDex {
            value: rr_species_index,
            source: NdexConvertSource::RR,
        })
        .copied()
}

/// Convert National Dex + Form index to game index
pub fn to_gen3_rr_pokemon_index(saf: &SpeciesAndForme) -> Result<u16> {
    NATIONAL_DEX_TO_RR_MAP
        .get(&saf.to_tuple())
        .ok_or(Error::UnsupportedPkm(*saf))
        .copied()
}
