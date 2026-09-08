use pkm_rs_types::OriginGame;
use serde::{Deserialize, Serialize};
#[cfg(feature = "wasm")]
use strum::IntoEnumIterator;
use strum_macros::EnumIter;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use pkm_rs_types::OriginMark;

use crate::species::{self, SpeciesForm};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, EnumIter, Serialize, Deserialize)]
pub enum MetadataSource {
    RedBlue,
    Yellow,
    GoldSilver,
    Crystal,
    RubySapphire,
    Emerald,
    FireRedLeafGreen,
    DiamondPearl,
    Platinum,
    HeartGoldSoulSilver,
    BlackWhite,
    Black2White2,
    XY,
    OmegaRubyAlphaSapphire,
    SunMoon,
    UltraSunUltraMoon,
    LetsGoPikachuEevee,
    SwordShield,
    BrilliantDiamondShiningPearl,
    LegendsArceus,
    #[default]
    ScarletViolet,
    LegendsZa,
}

impl MetadataSource {
    pub const fn first_origin_game(self) -> OriginGame {
        match self {
            Self::RedBlue => OriginGame::Red,
            Self::Yellow => OriginGame::Yellow,
            Self::GoldSilver => OriginGame::Gold,
            Self::Crystal => OriginGame::Crystal,
            Self::RubySapphire => OriginGame::Ruby,
            Self::Emerald => OriginGame::Emerald,
            Self::FireRedLeafGreen => OriginGame::FireRed,
            Self::DiamondPearl => OriginGame::Diamond,
            Self::Platinum => OriginGame::Platinum,
            Self::HeartGoldSoulSilver => OriginGame::HeartGold,
            Self::BlackWhite => OriginGame::Black,
            Self::Black2White2 => OriginGame::White2,
            Self::XY => OriginGame::X,
            Self::OmegaRubyAlphaSapphire => OriginGame::OmegaRuby,
            Self::SunMoon => OriginGame::Sun,
            Self::UltraSunUltraMoon => OriginGame::UltraSun,
            Self::LetsGoPikachuEevee => OriginGame::LetsGoPikachu,
            Self::SwordShield => OriginGame::Sword,
            Self::BrilliantDiamondShiningPearl => OriginGame::BrilliantDiamond,
            Self::LegendsArceus => OriginGame::LegendsArceus,
            Self::ScarletViolet => OriginGame::Scarlet,
            Self::LegendsZa => OriginGame::LegendsZa,
        }
    }

    pub const fn from_origin_game(game: OriginGame) -> Option<Self> {
        match game {
            OriginGame::Red | OriginGame::BlueGreen | OriginGame::BlueJpn => Some(Self::RedBlue),
            OriginGame::Yellow => Some(Self::Yellow),

            OriginGame::Gold | OriginGame::Silver => Some(Self::GoldSilver),
            OriginGame::Crystal => Some(Self::Crystal),

            OriginGame::Sapphire | OriginGame::Ruby => Some(Self::RubySapphire),
            OriginGame::Emerald => Some(Self::Emerald),
            OriginGame::FireRed | OriginGame::LeafGreen => Some(Self::FireRedLeafGreen),
            OriginGame::ColosseumXd => None,

            OriginGame::Diamond | OriginGame::Pearl => Some(Self::DiamondPearl),
            OriginGame::Platinum => Some(Self::Platinum),
            OriginGame::HeartGold | OriginGame::SoulSilver => Some(Self::HeartGoldSoulSilver),
            OriginGame::BattleRevolution => None,

            OriginGame::White | OriginGame::Black => Some(Self::BlackWhite),
            OriginGame::White2 | OriginGame::Black2 => Some(Self::Black2White2),

            OriginGame::X | OriginGame::Y => Some(Self::XY),
            OriginGame::AlphaSapphire | OriginGame::OmegaRuby => Some(Self::OmegaRubyAlphaSapphire),

            OriginGame::Sun | OriginGame::Moon => Some(Self::SunMoon),
            OriginGame::UltraSun | OriginGame::UltraMoon => Some(Self::UltraSunUltraMoon),
            OriginGame::LetsGoPikachu | OriginGame::LetsGoEevee => Some(Self::LetsGoPikachuEevee),

            OriginGame::Sword | OriginGame::Shield => Some(Self::SwordShield),
            OriginGame::LegendsArceus => Some(Self::LegendsArceus),
            OriginGame::BrilliantDiamond | OriginGame::ShiningPearl => {
                Some(Self::BrilliantDiamondShiningPearl)
            }

            OriginGame::Scarlet | OriginGame::Violet => Some(Self::ScarletViolet),
            OriginGame::LegendsZa => Some(Self::LegendsZa),

            OriginGame::Go | OriginGame::Home => None,

            OriginGame::Invalid0
            | OriginGame::Invalid6
            | OriginGame::Invalid9
            | OriginGame::Invalid13
            | OriginGame::Invalid14
            | OriginGame::Invalid17
            | OriginGame::Invalid18
            | OriginGame::Invalid19
            | OriginGame::Invalid28
            | OriginGame::Invalid29 => None,
        }
    }

    pub fn all_origin_games(self) -> Vec<OriginGame> {
        match self {
            Self::RedBlue => vec![OriginGame::Red, OriginGame::BlueGreen, OriginGame::BlueJpn],
            Self::Yellow => vec![OriginGame::Yellow],
            Self::GoldSilver => vec![OriginGame::Gold, OriginGame::Silver],
            Self::Crystal => vec![OriginGame::Crystal],
            Self::RubySapphire => vec![OriginGame::Ruby, OriginGame::Sapphire],
            Self::Emerald => vec![OriginGame::Emerald],
            Self::FireRedLeafGreen => vec![OriginGame::FireRed, OriginGame::LeafGreen],
            Self::DiamondPearl => vec![OriginGame::Diamond, OriginGame::Pearl],
            Self::Platinum => vec![OriginGame::Platinum],
            Self::HeartGoldSoulSilver => vec![OriginGame::HeartGold, OriginGame::SoulSilver],
            Self::BlackWhite => vec![OriginGame::Black, OriginGame::White],
            Self::Black2White2 => vec![OriginGame::Black2, OriginGame::White2],
            Self::XY => vec![OriginGame::X, OriginGame::Y],
            Self::OmegaRubyAlphaSapphire => vec![OriginGame::OmegaRuby, OriginGame::AlphaSapphire],
            Self::SunMoon => vec![OriginGame::Sun, OriginGame::Moon],
            Self::UltraSunUltraMoon => vec![OriginGame::UltraSun, OriginGame::UltraMoon],
            Self::LetsGoPikachuEevee => vec![OriginGame::LetsGoPikachu, OriginGame::LetsGoEevee],
            Self::SwordShield => vec![OriginGame::Sword, OriginGame::Shield],
            Self::BrilliantDiamondShiningPearl => {
                vec![OriginGame::BrilliantDiamond, OriginGame::ShiningPearl]
            }
            Self::LegendsArceus => vec![OriginGame::LegendsArceus],
            Self::ScarletViolet => vec![OriginGame::Scarlet, OriginGame::Violet],
            Self::LegendsZa => vec![OriginGame::LegendsZa],
        }
    }

    pub const fn display(&self) -> &'static str {
        match self {
            Self::RedBlue => "Red/Green/Blue",
            Self::Yellow => "Yellow",
            Self::GoldSilver => "Gold/Silver",
            Self::Crystal => "Crystal",
            Self::RubySapphire => "Ruby/Sapphire",
            Self::Emerald => "Emerald",
            Self::FireRedLeafGreen => "FireRed/LeafGreen",
            Self::DiamondPearl => "Diamond/Pearl",
            Self::Platinum => "Platinum",
            Self::HeartGoldSoulSilver => "HeartGold/SoulSilver",
            Self::BlackWhite => "Black/White",
            Self::Black2White2 => "Black 2/White 2",
            Self::XY => "X/Y",
            Self::OmegaRubyAlphaSapphire => "Omega Ruby/Alpha Sapphire",
            Self::SunMoon => "Sun/Moon",
            Self::UltraSunUltraMoon => "Ultra Sun/Ultra Moon",
            Self::LetsGoPikachuEevee => "Let's Go Pikachu/Eevee",
            Self::SwordShield => "Sword/Shield",
            Self::BrilliantDiamondShiningPearl => "Brilliant Diamond/Shining Pearl",
            Self::LegendsArceus => "Legends: Arceus",
            Self::ScarletViolet => "Scarlet/Violet",
            Self::LegendsZa => "Legends: Z-A",
        }
    }

    pub fn supports_form(&self, species_form: SpeciesForm) -> bool {
        species::form_metadata::source_has_form_metadata(
            *self,
            species_form.get_ndex() as u16,
            species_form.get_forme_index(),
        )
    }
}

#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct MetadataSources;

#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
#[cfg(feature = "wasm")]
impl MetadataSources {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getOriginMark"))]
    pub fn get_origin_mark(value: MetadataSource) -> Option<OriginMark> {
        value.first_origin_game().mark()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen)]
    pub fn display(value: MetadataSource) -> String {
        value.display().to_owned()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "supportsForm"))]
    pub fn supports_form(source: MetadataSource, national_dex: u16, form_index: u16) -> bool {
        species::metadata_table::source_has_form_metadata(source, national_dex, form_index)
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "supportedGameOrigins"))]
    pub fn supported_game_origins(national_dex: u16, form_index: u16) -> Vec<OriginGame> {
        MetadataSource::iter()
            .filter(|source| {
                species::metadata_table::source_has_form_metadata(*source, national_dex, form_index)
            })
            .flat_map(MetadataSource::all_origin_games)
            .collect()
    }
}

#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "allMetadataSources"))]
pub fn all_metadata_sources() -> Vec<MetadataSource> {
    MetadataSource::iter().collect()
}
