mod gen3_rr_pokemon_index;
mod gen3_rr_species_map;

mod moves;

pub mod util;

pub use self::gen3_rr_species_map::{
    NATIONAL_DEX_TO_RADICAL_RED_MAP, RADICAL_RED_TO_NATIONAL_DEX_MAP,
};

pub use self::gen3_rr_pokemon_index::GEN3_RR_SPECIES;
