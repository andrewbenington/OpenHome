use crate::pkm::plugins::ub::conversion::{NATIONAL_DEX_TO_UB_MAP, UB_TO_NATIONAL_DEX_MAP};
use crate::pkm::{Error, Result};
use crate::resources::SpeciesAndForme;

// Convert game index to National Dex entry
pub fn from_gen3_ub_pokemon_index(ub_species_index: u16) -> Result<SpeciesAndForme> {
    UB_TO_NATIONAL_DEX_MAP
        .get(&ub_species_index)
        .ok_or(Error::Other(format!(
            "Unsupported UB species index: {}",
            ub_species_index
        )))
        .copied()
}

// Convert National Dex + Form index to game index
pub fn to_gen3_ub_pokemon_index(saf: &SpeciesAndForme) -> Result<u16> {
    NATIONAL_DEX_TO_UB_MAP
        .get(&saf.to_tuple())
        .ok_or(Error::UnsupportedPkm(*saf))
        .copied()
}
