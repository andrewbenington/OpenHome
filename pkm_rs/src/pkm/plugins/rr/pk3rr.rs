use super::conversion::util::{from_gen3_rr_pokemon_index, to_gen3_rr_pokemon_index};
use crate::pkm::plugins::cfru::pk3cfru::Pk3cfru;
use crate::pkm::{Result, plugins::cfru::pk3cfru::CfruMapping};
use crate::resources::SpeciesAndForme;

const FAKEMON_INDEXES: [u16; 22] = [
    1186, 1200, 1274, 1275, 1276, 1277, 1278, 1279, 1282, 1283, 1284, 1285, 1286, 1287, 1288, 1289,
    1290, 1291, 1292, 1293, 1294, 1375,
];

pub struct RadicalRedMapping;

impl CfruMapping for RadicalRedMapping {
    fn mon_from_game_index(idx: u16) -> Result<SpeciesAndForme> {
        from_gen3_rr_pokemon_index(idx)
    }
    fn mon_to_game_index(species: &SpeciesAndForme) -> Result<u16> {
        to_gen3_rr_pokemon_index(species)
    }
    fn is_fakemon(species_idx: u16) -> bool {
        FAKEMON_INDEXES.contains(&species_idx)
    }
    fn plugin_identifier() -> &'static str {
        "radical_red"
    }
}

pub type Pk3rr = Pk3cfru<RadicalRedMapping>;
