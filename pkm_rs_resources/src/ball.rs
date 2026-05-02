use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
#[cfg(feature = "randomize")]
use rand::RngExt;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
#[repr(u8)]
pub enum Ball {
    None,
    Master,
    Ultra,
    Great,
    #[default]
    Poke,
    Safari,
    Net,
    Dive,
    Nest,
    Repeat,
    Timer,
    Luxury,
    Premier,
    Dusk,
    Heal,
    Quick,
    Cherish,
    Fast,
    Level,
    Lure,
    Heavy,
    Love,
    Friend,
    Moon,
    Sport,
    Dream,
    Beast,
    Strange,
    PokeLegendsArceus,
    GreatLegendsArceus,
    UltraLegendsArceus,
    Feather,
    Wing,
    Jet,
    HeavyLegendsArceus,
    Leaden,
    Gigaton,
    Origin,
}

pub const BALL_COUNT: usize = 38;

impl From<u8> for Ball {
    fn from(value: u8) -> Self {
        match value {
            0 => Ball::None,
            1 => Ball::Master,
            2 => Ball::Ultra,
            3 => Ball::Great,
            4 => Ball::Poke,
            5 => Ball::Safari,
            6 => Ball::Net,
            7 => Ball::Dive,
            8 => Ball::Nest,
            9 => Ball::Repeat,
            10 => Ball::Timer,
            11 => Ball::Luxury,
            12 => Ball::Premier,
            13 => Ball::Dusk,
            14 => Ball::Heal,
            15 => Ball::Quick,
            16 => Ball::Cherish,
            17 => Ball::Fast,
            18 => Ball::Level,
            19 => Ball::Lure,
            20 => Ball::Heavy,
            21 => Ball::Love,
            22 => Ball::Friend,
            23 => Ball::Moon,
            24 => Ball::Sport,
            25 => Ball::Dream,
            26 => Ball::Beast,
            27 => Ball::Strange,
            28 => Ball::PokeLegendsArceus,
            29 => Ball::GreatLegendsArceus,
            30 => Ball::UltraLegendsArceus,
            31 => Ball::Feather,
            32 => Ball::Wing,
            33 => Ball::Jet,
            34 => Ball::HeavyLegendsArceus,
            35 => Ball::Leaden,
            36 => Ball::Gigaton,
            37 => Ball::Origin,
            _ => Ball::Strange,
        }
    }
}

impl From<arbitrary_int::u4> for Ball {
    fn from(value: arbitrary_int::u4) -> Self {
        Ball::from(value.value())
    }
}

impl Ball {
    pub fn poke_if_newer_than(self, other: Ball) -> Ball {
        if self > other { Ball::Poke } else { self }
    }

    pub fn strange_if_newer_than(self, other: Ball) -> Ball {
        if self > other { Ball::Strange } else { self }
    }

    pub const fn name(&self) -> &'static str {
        match self {
            Ball::None => "None",
            Ball::Master => "Master",
            Ball::Ultra => "Ultra",
            Ball::Great => "Great",
            Ball::Poke => "Poké",
            Ball::Safari => "Safari",
            Ball::Net => "Net",
            Ball::Dive => "Dive",
            Ball::Nest => "Nest",
            Ball::Repeat => "Repeat",
            Ball::Timer => "Timer",
            Ball::Luxury => "Luxury",
            Ball::Premier => "Premier",
            Ball::Dusk => "Dusk",
            Ball::Heal => "Heal",
            Ball::Quick => "Quick",
            Ball::Cherish => "Cherish",
            Ball::Fast => "Fast",
            Ball::Level => "Level",
            Ball::Lure => "Lure",
            Ball::Heavy => "Heavy",
            Ball::Love => "Love",
            Ball::Friend => "Friend",
            Ball::Moon => "Moon",
            Ball::Sport => "Sport",
            Ball::Dream => "Dream",
            Ball::Beast => "Beast",
            Ball::Strange => "Strange",
            Ball::PokeLegendsArceus => "Poké (Hisui)",
            Ball::GreatLegendsArceus => "Great (Hisui)",
            Ball::UltraLegendsArceus => "Ultra (Hisui)",
            Ball::Feather => "Feather",
            Ball::Wing => "Wing",
            Ball::Jet => "Jet",
            Ball::HeavyLegendsArceus => "Heavy (Hisui)",
            Ball::Leaden => "Leaden",
            Ball::Gigaton => "Gigaton",
            Ball::Origin => "Origin",
        }
    }

    pub fn get_name_full(&self) -> String {
        match self {
            Ball::PokeLegendsArceus => "Poké Ball (Hisui)".to_owned(),
            Ball::GreatLegendsArceus => "Great Ball (Hisui)".to_owned(),
            Ball::UltraLegendsArceus => "Ultra Ball (Hisui)".to_owned(),
            Ball::HeavyLegendsArceus => "Heavy Ball (Hisui)".to_owned(),
            _ => format!("{} Ball", self.name()),
        }
    }

    pub fn get_metadata(&self) -> BallMetadata {
        BallMetadata {
            index: *self as u8,
            name: self.name().to_owned(),
        }
    }
}

impl Serialize for Ball {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.name().serialize(serializer)
    }
}

#[cfg(feature = "randomize")]
impl Randomize for Ball {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        Ball::from(rng.random_range(0..BALL_COUNT) as u8)
    }
}

pub static ALL_BALLS: [Ball; BALL_COUNT] = [
    Ball::None,
    Ball::Master,
    Ball::Ultra,
    Ball::Great,
    Ball::Poke,
    Ball::Safari,
    Ball::Net,
    Ball::Dive,
    Ball::Nest,
    Ball::Repeat,
    Ball::Timer,
    Ball::Luxury,
    Ball::Premier,
    Ball::Dusk,
    Ball::Heal,
    Ball::Quick,
    Ball::Cherish,
    Ball::Fast,
    Ball::Level,
    Ball::Lure,
    Ball::Heavy,
    Ball::Love,
    Ball::Friend,
    Ball::Moon,
    Ball::Sport,
    Ball::Dream,
    Ball::Beast,
    Ball::Strange,
    Ball::PokeLegendsArceus,
    Ball::GreatLegendsArceus,
    Ball::UltraLegendsArceus,
    Ball::Feather,
    Ball::Wing,
    Ball::Jet,
    Ball::HeavyLegendsArceus,
    Ball::Leaden,
    Ball::Gigaton,
    Ball::Origin,
];

#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
#[allow(clippy::missing_const_for_fn)]
pub struct BallMetadata {
    pub index: u8,
    pub name: String,
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getAllBalls"))]
#[allow(clippy::missing_const_for_fn)]
pub fn get_all_balls() -> Vec<BallMetadata> {
    ALL_BALLS.iter().map(Ball::get_metadata).collect()
}
