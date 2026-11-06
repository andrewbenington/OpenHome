use crate::gen3::Gen3PokemonIndex;
use crate::pkm_trait_based_impl::pk_3_and_later::Gen3AndLater;
use crate::pkm_trait_based_impl::pk_8_and_earlier::Gen2ToGen8;

pub trait PK3 : Gen3AndLater + Gen2ToGen8 {

    fn pokemon_index() -> Gen3PokemonIndex;


    fn personality_value() -> u32;
}