use pkm_rs_types::{Generation, Language, OriginGame};

mod gen2;
mod gen3;
mod gen4;
mod gen5;
mod gen6;
mod gen7;
mod gen8;
mod gen8a;
mod gen8b;
mod gen9;
mod gen9a;

pub fn location_name(game: OriginGame, language: Language, index: usize) -> Option<&'static str> {
    match game.generation() {
        Generation::G1 => None,
        Generation::G2 => gen2::location_name(language, index),
        Generation::G3 => gen3::location_name(game, language, index),
        Generation::G4 => gen4::location_name(language, index),
        Generation::G5 => gen5::location_name(language, index),
        Generation::G6 => gen6::location_name(language, index),
        Generation::G7 => gen7::location_name(game, language, index),
        Generation::G8 if game.is_swsh() => gen8::location_name(language, index),
        Generation::G8 if game.is_bdsp() => gen8b::location_name(language, index),
        Generation::G8 if game == OriginGame::LegendsArceus => {
            gen8a::location_name(language, index)
        }
        Generation::G9 if game.is_scarlet_violet() => gen9::location_name(language, index),
        Generation::G9 if game == OriginGame::LegendsZa => gen9a::location_name(language, index),
        _ => None,
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_gen8_egg_location() {
        assert!(location_name(OriginGame::Shield, Language::English, 60002).is_some())
    }
}
