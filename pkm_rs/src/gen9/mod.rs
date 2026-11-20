mod pokemon_index;
use pkm_rs_resources::abilities::AbilityIndexBounded;
pub use pokemon_index::*;

const MAX_ABILITY_INDEX: u16 = 310; // Poison Puppeteer

pub type Gen9AbilityIndex = AbilityIndexBounded<MAX_ABILITY_INDEX>;
