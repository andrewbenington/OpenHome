use super::EmeraldExPokemonIndex;
use crate::checksum::{Checksum, RefreshChecksum};
use crate::result::{Error, Result};
use crate::strings::Gen3String;
use crate::traits::{IsShiny, PkmBytes};
use crate::util;

use pkm_rs_derive::IsShiny8192;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::MoveIndex;
use pkm_rs_resources::ribbons::Gen3RibbonSet;
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_types::{
    BinaryGender, ContestStats, Ivs, MarkingsFourShapes, OriginGame, Pokerus, SimpleAbilityNumber,
    Stats8,
};
use pkm_rs_types::Gender;
use pkm_rs_types::{read_u16_le, read_u32_le};
use serde::Serialize;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

mod emerald_expansion;

#[cfg(not(feature = "randomize"))]
pub trait EmeraldExSpeciesIndex: From<u16> + Into<u16> + Serialize + Copy {
    fn try_to_species_and_form(self) -> Result<SpeciesForm>;
    fn try_from_species_and_form(species: &SpeciesForm) -> Result<Self>;

    fn is_fakemon(&self) -> bool;
    fn plugin_identifier() -> &'static str;
}

#[cfg(feature = "randomize")]
pub trait EmeraldExSpeciesIndex: From<u16> + Into<u16> + Serialize + Copy + Randomize {
    fn try_to_species_and_form(self) -> Result<SpeciesForm>;
    fn try_from_species_and_form(species: &SpeciesForm) -> Result<Self>;

    fn is_fakemon(&self) -> bool;
    fn plugin_identifier() -> &'static str;
}


#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny8192)]
pub struct Pk3Ex {
    // BoxPokemon
    /*0x00*/ pub personality_value: u32,
    /*0x04*/ pub trainer_id: u16,
    /*0x06*/ pub secret_id: u16,
    /*0x08*/ pub nickname: Gen3String<10>,  // characters 11 and 12 are stored in PokemonSubstruct0
    /*0x12*/ pub language: u8,  // u3
             pub mint_nature: u8,  // u5
    /*0x13*/ pub is_bad_egg: bool,
             pub has_species_data: bool,
             pub is_egg: bool,
//           pub block_box_rs: bool,
//           pub days_since_form_change: u8,  // u3
//           pub unused_13: bool,
    /*0x14*/ pub trainer_name: Gen3String<7>,
    /*0x1B*/ pub markings: MarkingsFourShapes,
//           pub current_status: u8,  // u4
    /*0x1C*/ pub checksum: u16,
//  /*0x1E*/ pub hp_lost: u16,  // u14, zeroed out when put in box
//           pub shiny_toggle: bool,
//           pub unused_1E: bool,
    
    // PokemonSubstruct0
    pub pokemon_index: EmeraldExPokemonIndex,  // u11
    pub tera_type: TeraType,  // u5
    pub held_item_index: u16,  // u10
    // pub unused_02: u16,  // u6
    pub experience: u32,  // u21
    pub nickname_char_11: Gen3String<1>,
    // pub unused_04: u32,  // u3
    pub move_pp_ups: u8,
    pub trainer_friendship: u8,
    pub ball: Ball,  // u6
    pub nickname_char_12: Gen3String<1>,
    // pub unused_0A: u16,  // u2

    // PokemonSubstruct1
    pub moves: [MoveIndex; 4],  // each move is a u11
    // evolution trackers, cleared on box entry; two u5s
    pub move_pp: [u8; 4],  // each pp is a u7
    pub hyper_training: HyperTraining,  // each stat is a u1/bool

    // PokemonSubstruct2
    pub evs: Stats8,
    pub contest: ContestStats,

    // PokemonSubstruct3
    pub pokerus: Pokerus,
    pub met_location_index: u8,
    pub met_level: u8,  // u7
    pub game_of_origin: OriginGame,  // u4
    pub dynamax_level: u8,  // u4
    pub trainer_gender: BinaryGender,  // u1/bool
    pub ivs: Ivs,
    //pub is_egg: bool,
    pub can_gigantamax: bool,
    pub ribbons: Gen3RibbonSet,
    pub is_shadow: bool,
    // pub unused_0B: bool,
    pub ability_num: SimpleAbilityNumber,
    pub is_fateful_encounter: bool,
}

//impl Pk3Ex {
//    
//}

impl PkmBytes for Pk3Ex {
    const BOX_SIZE: usize = 80;
    const PARTY_SIZE: usize = 100;

    fn from_bytes(bytes: &[u8]) -> Rresullt<Self> {
        Self::try_from_bytes(bytes)
    }
}
