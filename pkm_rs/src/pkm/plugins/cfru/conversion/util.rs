use crate::pkm::{Error, Result};
use crate::resources::{NatDexIndex, SpeciesAndForme};

#[derive(Debug, Clone, Copy)]
pub struct GameToNationalDexEntry {
    pub national_dex_index: i16,
    pub form_index: i8,
}

/// Convert game index to National Dex entry
pub fn from_gen3_cfru_pokemon_index(
    radical_red_index: u16,
    game_to_ndex_map: &phf::Map<&'static str, GameToNationalDexEntry>,
) -> Result<SpeciesAndForme> {
    let key = radical_red_index.to_string();

    match game_to_ndex_map.get(&*key) {
        Some(entry) => {
            SpeciesAndForme::new(entry.national_dex_index as u16, entry.form_index as u16)
        }
        None => Err(Error::NationalDex {
            national_dex: radical_red_index,
        }),
    }
}

/// Convert National Dex + Form index to game index
pub fn to_gen3_cfru_pokemon_index(
    saf: &SpeciesAndForme,
    ndex_to_game_map: &phf::Map<&'static str, u16>,
) -> Result<u16> {
    let key = format!("{}_{}", saf.get_ndex().get(), saf.get_forme_index());
    match ndex_to_game_map.get(&*key) {
        Some(&radical_red_index) => Ok(radical_red_index),
        None => Err(Error::FormeIndex {
            national_dex: saf.get_ndex(),
            forme_index: saf.get_forme_index(),
        }),
    }
}
