use crate::pkm::plugins::cfru::conversion::NATIONAL_DEX_TO_RADICAL_RED_MAP;
use crate::pkm::{Error, Result};
use crate::resources::{NatDexIndex, SpeciesAndForme};

/// Convert National Dex + Form index to game index
pub fn to_gen3_cfru_pokemon_index(saf: &SpeciesAndForme) -> Result<u16> {
    NATIONAL_DEX_TO_RADICAL_RED_MAP
        .get(&saf.to_tuple())
        .ok_or(Error::UnsupportedPkm(*saf))
        .copied()
}
