use super::conversion::util::{from_gen3_ub_pokemon_index, to_gen3_ub_pokemon_index};
use crate::pkm::plugins::cfru::pk3cfru::Pk3cfru;
use crate::pkm::{Result, plugins::cfru::pk3cfru::CfruMapping};
use crate::resources::SpeciesAndForme;

const FAKEMON_INDEXES: [u16; 0] = [];

pub struct UnboundMapping;

impl CfruMapping for UnboundMapping {
    fn mon_from_game_index(idx: u16) -> Result<SpeciesAndForme> {
        from_gen3_ub_pokemon_index(idx)
    }
    fn mon_to_game_index(species: &SpeciesAndForme) -> Result<u16> {
        to_gen3_ub_pokemon_index(species)
    }
    fn is_fakemon(species_idx: u16) -> bool {
        FAKEMON_INDEXES.contains(&species_idx)
    }
    fn plugin_identifier() -> &'static str {
        "radical_red"
    }
}

pub type Pk3ub = Pk3cfru<UnboundMapping>;
