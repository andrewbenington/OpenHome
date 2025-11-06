use std::fmt::Display;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum Stat {
    HP,
    Attack,
    Defense,
    SpecialAttack,
    SpecialDefense,
    Speed,
}

impl Stat {
    pub const fn abbr(self) -> &'static str {
        match self {
            Stat::HP => "HP",
            Stat::Attack => "Atk",
            Stat::Defense => "Def",
            Stat::SpecialAttack => "SpA",
            Stat::SpecialDefense => "SpD",
            Stat::Speed => "Spe",
        }
    }
}

impl Display for Stat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match *self {
            Stat::HP => "HP",
            Stat::Attack => "Attack",
            Stat::Defense => "Defense",
            Stat::SpecialAttack => "Special Attack",
            Stat::SpecialDefense => "Special Defense",
            Stat::Speed => "Speed",
        })
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct Stats;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl Stats {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "abbrLower"))]
    pub fn abbr_lower(stat: Stat) -> String {
        stat.abbr().to_lowercase()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "fromAbbr"))]
    pub fn from_abbr(abbr: &str) -> Option<Stat> {
        match abbr {
            "HP" => Some(Stat::HP),
            "Atk" => Some(Stat::Attack),
            "Def" => Some(Stat::Defense),
            "SpA" => Some(Stat::SpecialAttack),
            "SpD" => Some(Stat::SpecialDefense),
            "Spe" => Some(Stat::Speed),
            _ => None,
        }
    }
}
