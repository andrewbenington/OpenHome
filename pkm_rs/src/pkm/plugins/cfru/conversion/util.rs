use crate::pkm::plugins::cfru::conversion::{CFRU_TO_NATIONAL_DEX_MAP, NATIONAL_DEX_TO_CFRU_MAP};
use crate::pkm::{Error, NdexConvertSource, Result};
use crate::resources::SpeciesAndForme;

/// Convert game index to National Dex entry
pub fn from_gen3_cfru_pokemon_index(cfru_species_index: u16) -> Result<SpeciesAndForme> {
    CFRU_TO_NATIONAL_DEX_MAP
        .get(&cfru_species_index)
        .ok_or(Error::NationalDex {
            value: cfru_species_index,
            source: NdexConvertSource::Crfu,
        })
        .copied()
}

/// Convert National Dex + Form index to game index
pub fn to_gen3_cfru_pokemon_index(saf: &SpeciesAndForme) -> Result<u16> {
    NATIONAL_DEX_TO_CFRU_MAP
        .get(&saf.to_tuple())
        .ok_or(Error::UnsupportedPkm(*saf))
        .copied()
}
