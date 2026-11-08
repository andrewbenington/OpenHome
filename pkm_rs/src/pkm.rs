use crate::gen7_alola::{Pk7AbilityIndex, Pk7SpeciesAndForm};
use boilermates::boilermates;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveSlot, MoveSlots};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::ModernRibbonSet;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{
    AbilityNumber, BinaryGender, ContestStats, Gender, Geolocations, HyperTraining, Ivs, Language,
    MarkingsSixShapesColors, OriginGame, PokeDate, Pokerus, Stats8, Stats16Le, TrainerMemory,
};
use serde::{Deserialize, Serialize};

/**
* A Pokémon within a main-series Pokemon Game or rom hack.
*/
#[boilermates("PK2PolishedCrystal")]
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Pkm {
    pub encryption_constant: u32,
    pub sanity: u16,
    pub checksum: u16,

    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub species_and_form: Pk7SpeciesAndForm,

    pub held_item_index: u16,
    pub exp: u32,

    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]


    pub ability_num: AbilityNumber,
    pub nature: NatureIndex,
    pub gender: Gender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub evs: Stats8,

    pub trainer_id: u16,
    pub secret_id: u16,

    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub markings: MarkingsSixShapesColors,
    pub personality_value: u32,
    pub pokerus: Pokerus,

    pub is_fateful_encounter: bool,

    pub super_training_flags: u32,
    pub super_training_dist_flags: u8,

    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub contest: ContestStats,
    pub resort_event_status: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ribbons: ModernRibbonSet<7, crate::gen7_alola::pk7::MAX_RIBBON_ALOLA>,
    pub contest_memory_count: u8,
    pub battle_memory_count: u8,
    pub form_argument: u32,
    pub nickname: SizedUtf16String<26>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub moves: MoveSlots,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub relearn_moves: [MoveSlot; 4],

    #[boilermates(not_in("Pk2PolishedCrystal"))]
    pub secret_super_training_unlocked: bool,


    pub secret_super_training_complete: bool,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ivs: Ivs,
    pub is_egg: bool,
    pub is_nicknamed: bool,
    pub handler_name: SizedUtf16String<26>,
    pub handler_gender: BinaryGender,
    pub is_current_handler: bool,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub geolocations: Geolocations,
    pub handler_friendship: u8,
    pub handler_affection: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub handler_memory: TrainerMemory,
    pub fullness: u8,
    pub enjoyment: u8,
    pub trainer_name: SizedUtf16String<26>,
    pub trainer_friendship: u8,
    pub trainer_affection: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub trainer_memory: TrainerMemory,
    pub egg_date: Option<PokeDate>,
    pub met_date: PokeDate,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub ball: Ball,
    pub met_level: u8,
    pub trainer_gender: BinaryGender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub hyper_training: HyperTraining,

    pub game_of_origin: OriginGame,
    pub country: u8,
    pub region: u8,
    pub console_region: u8,
    pub language: Language,

    pub status_condition: u32,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub stat_level: u8,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub form_argument_remain: u8,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub form_argument_elapsed: u8,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    pub current_hp: u16,
    #[cfg_attr(feature = "randomize", randomize(skip))]
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub stats: Stats16Le,
}
