
#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

mod emerald_expn;

pub struct Pk3EmeraldExpn {}

impl Pk3Plugin for Pk3EmeraldExpn {

}

trait Pk3Plugin : PK3 + PkmPlugin {

}

trait Gen3AndLater : Gen2AndLater {

    fn ability_num() -> SimpleAbilityNumber;


    fn evs() -> Stats8;
    fn ivs() -> Ivs;

    fn markings() -> MarkingsFourShapes;

    fn ribbons() -> Gen3RibbonSet;
}

trait Gen2AndLater {

    fn is_bad_egg() -> bool;
    fn is_egg() -> bool;
    fn gender() -> Gender;
    fn trainer_gender() -> BinaryGender;
}

trait Gen8AndEarlier {

    fn pokerus() -> Pokerus;
}

trait Pkm {
    fn sanity()-> u16;
    fn checksum() -> u16;
    fn held_item_index() -> Option<ItemGen3>;
    fn trainer_id() -> u16;
    fn secret_id() -> u16;
    fn exp() -> u32;
    fn has_species_data() -> bool;
    fn is_fateful_encounter() -> bool;
    fn contest() -> ContestStats;
    fn moves() -> MoveSlots;
    fn trainer_name() -> TrainerString<7>;
    fn trainer_friendship() -> u8;
    fn nickname() -> NicknameString<10>;
    fn met_location_index() -> u8;
    fn ball() -> Ball;
    fn met_level() -> u8;
    fn game_of_origin() -> OriginGame;
    fn language() -> Language;
    fn status_condition() -> u32;
    fn stat_level() -> u8;
    fn current_hp() -> u16;
    fn stats() -> Stats16Le;
}

trait PK3 : Gen3AndLater + Gen8AndEarlier {

    fn pokemon_index() -> Gen3PokemonIndex;


    fn personality_value() -> u32;
}

