use pkm_rs_resources::abilities::AbilityIndexBounded;

pub mod save;
pub mod pk2_polished_crystal;


const SAND_STREAM: i32 = 256;

/**
todo!() Make sure Sand Stream is the right ability; just a placeholder right now
*/
pub type Pk2PolishedCrystalAbilityIndex = Pk2PolishedCrystalAbilityIndexBounded<crate::pk2_polished_crystal::SAND_STREAM>;

// todo!() Reminder that this game v3.2.3 handles shininess, IVs and a few other things differently from previous
// version of Polished Crystal.