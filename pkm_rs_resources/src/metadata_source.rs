use pkm_rs_types::{
    NationalDex, OriginGame,
    form::{
        BASE_FORM, FLOETTE_ETERNAL, LEGENDARY_BIRD_GALAR, MAGEARNA_ORIGINAL, URSALUNA_BLOODMOON,
        VIVILLON_FANCY, VIVILLON_GARDEN, VIVILLON_MARINE, VIVILLON_MEADOW, VIVILLON_POKEBALL,
    },
};
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
            OriginGame::FireRed
            | OriginGame::LeafGreen
            | OriginGame::FireRedSwitch
            | OriginGame::LeafGreenSwitch => Some(Self::FireRedLeafGreen),
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
            | OriginGame::Invalid29
            | OriginGame::Invalid53
            | OriginGame::Invalid54
            | OriginGame::Invalid55 => None,
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
            Self::FireRedLeafGreen => vec![
                OriginGame::FireRed,
                OriginGame::LeafGreen,
                OriginGame::FireRedSwitch,
                OriginGame::LeafGreenSwitch,
            ],
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
        species::metadata_table::source_has_form_metadata(
            *self,
            species_form.get_ndex() as u16,
            species_form.get_form_index(),
        )
    }

    pub fn form_obtainable_with_origin_without_events(&self, species_form: SpeciesForm) -> bool {
        if !self.supports_form(species_form) {
            false
        } else {
            use NationalDex as ND;
            // this should handle all non-breedable mons + games without breeding
            match species_form.split() {
                (ND::Articuno | ND::Zapdos | ND::Moltres, BASE_FORM) => matches!(
                    self,
                    Self::RedBlue
                        | Self::Yellow
                        | Self::FireRedLeafGreen
                        | Self::Platinum
                        | Self::HeartGoldSoulSilver
                        | Self::XY
                        | Self::UltraSunUltraMoon
                        | Self::LetsGoPikachuEevee
                        | Self::SwordShield
                        | Self::BrilliantDiamondShiningPearl
                        | Self::ScarletViolet
                ),
                (ND::Articuno | ND::Zapdos | ND::Moltres, LEGENDARY_BIRD_GALAR) => {
                    matches!(self, Self::SwordShield)
                }
                (ND::Mewtwo, _) => matches!(
                    self,
                    Self::RedBlue
                        | Self::Yellow
                        | Self::FireRedLeafGreen
                        | Self::HeartGoldSoulSilver
                        | Self::XY
                        | Self::UltraSunUltraMoon
                        | Self::LetsGoPikachuEevee
                        | Self::SwordShield
                        | Self::BrilliantDiamondShiningPearl
                ),
                (ND::Mew, _) => matches!(self, Self::BrilliantDiamondShiningPearl), // LGPE save data gift
                (ND::Unown, _) => !matches!(
                    self,
                    Self::RubySapphire
                        | Self::Emerald
                        | Self::BlackWhite
                        | Self::Black2White2
                        | Self::XY
                        | Self::SunMoon
                        | Self::UltraSunUltraMoon
                ),
                (ND::HoOh | ND::Lugia, _) => {
                    matches!(
                        self,
                        Self::GoldSilver
                            | Self::Crystal
                            | Self::HeartGoldSoulSilver
                            | Self::OmegaRubyAlphaSapphire
                            | Self::UltraSunUltraMoon
                            | Self::SwordShield
                            | Self::BrilliantDiamondShiningPearl
                            | Self::ScarletViolet
                    )
                }
                (ND::Celebi, _) => false, // Virtual console only
                (ND::Regirock | ND::Regice | ND::Registeel, _) => {
                    matches!(
                        self,
                        Self::RubySapphire
                            | Self::Emerald
                            // Platinum requires a special event Regigigas
                            | Self::Black2White2
                            | Self::OmegaRubyAlphaSapphire
                            | Self::UltraSunUltraMoon
                            | Self::SwordShield
                            | Self::BrilliantDiamondShiningPearl
                    )
                }
                (ND::Latias | ND::Latios, _) => {
                    matches!(
                        self,
                        Self::RubySapphire
                            | Self::Emerald
                            | Self::HeartGoldSoulSilver
                            | Self::Black2White2
                            | Self::OmegaRubyAlphaSapphire
                            | Self::UltraSunUltraMoon
                            | Self::SwordShield
                            | Self::BrilliantDiamondShiningPearl
                            | Self::ScarletViolet
                            | Self::LegendsZa
                    )
                }
                (ND::Kyogre | ND::Groudon | ND::Rayquaza, _) => {
                    matches!(
                        self,
                        Self::RubySapphire
                            | Self::Emerald
                            | Self::HeartGoldSoulSilver
                            | Self::OmegaRubyAlphaSapphire
                            | Self::UltraSunUltraMoon
                            | Self::SwordShield
                            | Self::BrilliantDiamondShiningPearl
                            | Self::LegendsZa
                    )
                }
                (ND::Jirachi, _) => {
                    matches!(self, Self::BrilliantDiamondShiningPearl) // Sword/Shield save data gift
                }
                (ND::Deoxys, _) => {
                    matches!(self, Self::OmegaRubyAlphaSapphire)
                }
                (ND::Uxie | ND::Mesprit | ND::Azelf, _) => {
                    matches!(
                        self,
                        Self::DiamondPearl
                            | Self::Platinum
                            | Self::Black2White2
                            | Self::OmegaRubyAlphaSapphire
                            | Self::UltraSunUltraMoon
                            | Self::SwordShield
                            | Self::BrilliantDiamondShiningPearl
                            | Self::LegendsArceus
                    )
                }
                (ND::Dialga | ND::Palkia | ND::Giratina, _) => {
                    matches!(
                        self,
                        Self::DiamondPearl
                            | Self::Platinum
                            | Self::OmegaRubyAlphaSapphire
                            | Self::UltraSunUltraMoon
                            | Self::SwordShield
                            | Self::BrilliantDiamondShiningPearl
                            | Self::LegendsArceus
                    )
                }
                (ND::Heatran, _) => {
                    matches!(
                        self,
                        Self::DiamondPearl
                            | Self::Platinum
                            | Self::Black2White2
                            | Self::OmegaRubyAlphaSapphire
                            | Self::UltraSunUltraMoon
                            | Self::SwordShield
                            | Self::BrilliantDiamondShiningPearl
                            | Self::LegendsArceus
                            | Self::LegendsZa
                    )
                }
                (ND::Regigigas | ND::Cresselia, _) => {
                    matches!(
                        self,
                        Self::DiamondPearl
                            | Self::Platinum
                            | Self::Black2White2
                            | Self::OmegaRubyAlphaSapphire
                            | Self::UltraSunUltraMoon
                            | Self::SwordShield
                            | Self::BrilliantDiamondShiningPearl
                            | Self::LegendsArceus
                    )
                }
                (ND::Manaphy, _) => matches!(self, Self::LegendsArceus),
                (ND::Darkrai, _) => {
                    matches!(
                        self,
                        Self::LegendsArceus // BDSP save data
                         | Self::LegendsZa
                    )
                }
                (ND::Shaymin, _) => matches!(self, Self::LegendsArceus), // Sword/Shield save data
                (ND::Arceus, _) => {
                    matches!(
                        self,
                        Self::BrilliantDiamondShiningPearl  // Legends Arceus completed save data
                        | Self::LegendsArceus
                    )
                }
                (ND::Victini, _) => false,
                (ND::Cobalion | ND::Terrakion | ND::Virizion, _) => {
                    matches!(
                        self,
                        Self::BlackWhite
                            | Self::Black2White2
                            | Self::OmegaRubyAlphaSapphire
                            | Self::UltraSunUltraMoon
                            | Self::SwordShield
                            | Self::ScarletViolet
                            | Self::LegendsZa
                    )
                }
                (ND::Tornadus | ND::Thundurus | ND::Landorus, _) => {
                    matches!(
                        self,
                        Self::BlackWhite
                        // Black 2/White 2 requires Dream Radar
                            | Self::OmegaRubyAlphaSapphire
                            | Self::UltraSunUltraMoon
                            | Self::SwordShield
                            | Self::LegendsArceus
                    )
                }
                (ND::Reshiram | ND::Zekrom | ND::Kyurem, _) => {
                    matches!(
                        self,
                        Self::BlackWhite
                            | Self::Black2White2
                            | Self::OmegaRubyAlphaSapphire
                            | Self::UltraSunUltraMoon
                            | Self::SwordShield
                            | Self::ScarletViolet
                    )
                }
                (ND::Keldeo, _) => matches!(self, Self::SwordShield | Self::LegendsZa),
                (ND::Meloetta, _) => matches!(self, Self::ScarletViolet | Self::LegendsZa),
                (ND::Genesect, _) => matches!(self, Self::LegendsZa),
                (ndex @ (ND::Scatterbug | ND::Spewpa | ND::Vivillon), form_index) => {
                    match form_index {
                        VIVILLON_GARDEN | VIVILLON_MEADOW => {
                            // catchable in Legends Z-A (Lumiose + Hyperspace)
                            *self != Self::ScarletViolet
                        }
                        VIVILLON_MARINE => {
                            // sidequest Spewpa in Legends Z-A
                            *self != Self::ScarletViolet
                                && (ndex != ND::Scatterbug || *self != Self::LegendsZa)
                        }
                        VIVILLON_FANCY => *self == Self::ScarletViolet,
                        VIVILLON_POKEBALL.. => false, // pokedex form and currently invalid values above it
                        _ => !matches!(self, Self::ScarletViolet | Self::LegendsZa), // all other forms
                    }
                }
                (ND::Floette, FLOETTE_ETERNAL) => matches!(self, Self::LegendsZa),
                (ND::Xerneas | ND::Yveltal, _) => {
                    matches!(
                        self,
                        Self::XY | Self::UltraSunUltraMoon | Self::SwordShield | Self::LegendsZa
                    )
                }
                (ND::Zygarde, _) => {
                    matches!(
                        self,
                        Self::XY
                            | Self::SunMoon
                            | Self::UltraSunUltraMoon
                            | Self::SwordShield
                            | Self::LegendsZa
                    )
                }
                (ND::Diancie, _) => false,
                (ND::Hoopa | ND::Volcanion, _) => matches!(self, Self::LegendsZa),
                (ND::TapuKoko | ND::TapuLele | ND::TapuBulu | ND::TapuFini, _) => {
                    matches!(
                        self,
                        Self::SunMoon | Self::UltraSunUltraMoon | Self::SwordShield
                    )
                }
                (ND::Cosmog | ND::Cosmoem, _) => {
                    matches!(
                        self,
                        Self::SunMoon | Self::UltraSunUltraMoon | Self::SwordShield
                    )
                }
                (ND::Solgaleo | ND::Lunala | ND::Necrozma, _) => {
                    matches!(
                        self,
                        Self::SunMoon
                            | Self::UltraSunUltraMoon
                            | Self::SwordShield
                            | Self::ScarletViolet
                    )
                }
                (
                    ND::Nihilego
                    | ND::Buzzwole
                    | ND::Pheromosa
                    | ND::Xurkitree
                    | ND::Celesteela
                    | ND::Kartana
                    | ND::Guzzlord,
                    _,
                ) => {
                    matches!(
                        self,
                        Self::SunMoon | Self::UltraSunUltraMoon | Self::SwordShield
                    )
                }
                (ND::Magearna, BASE_FORM) => {
                    matches!(
                        self,
                        Self::SunMoon | Self::UltraSunUltraMoon | Self::LegendsZa
                    )
                }
                (ND::Magearna, MAGEARNA_ORIGINAL) => false,
                (ND::Marshadow, _) => {
                    matches!(
                        self,
                        Self::SunMoon | Self::UltraSunUltraMoon | Self::LegendsZa
                    )
                }
                (ND::Poipole | ND::Naganadel | ND::Stakataka | ND::Blacephalon, _) => {
                    matches!(self, Self::UltraSunUltraMoon | Self::SwordShield)
                }
                (ND::Zeraora | ND::Meltan | ND::Melmetal, _) => false,
                (ND::Zacian | ND::Zamazenta | ND::Eternatus | ND::Calyrex, _) => {
                    matches!(self, Self::SwordShield)
                }
                (ND::Kubfu | ND::Urshifu | ND::Glastrier | ND::Spectrier, _) => {
                    matches!(self, Self::SwordShield | Self::ScarletViolet)
                }
                (ND::Zarude, _) => false,
                (ND::Regieleki | ND::Regidrago, _) => {
                    matches!(self, Self::SwordShield)
                }
                (ND::Ursaluna, URSALUNA_BLOODMOON) => matches!(self, Self::ScarletViolet),
                (ND::Enamorus, _) => matches!(self, Self::LegendsArceus),
                (
                    ND::GreatTusk
                    | ND::ScreamTail
                    | ND::BruteBonnet
                    | ND::FlutterMane
                    | ND::SlitherWing
                    | ND::SandyShocks
                    | ND::IronTreads
                    | ND::IronBundle
                    | ND::IronHands
                    | ND::IronJugulis
                    | ND::IronMoth
                    | ND::IronThorns
                    | ND::RoaringMoon
                    | ND::IronValiant
                    | ND::GougingFire
                    | ND::RagingBolt
                    | ND::IronBoulder
                    | ND::IronCrown,
                    _,
                ) => matches!(self, Self::ScarletViolet),
                (ND::WalkingWake | ND::IronLeaves, _) => false, // event only
                (
                    ND::WoChien
                    | ND::ChienPao
                    | ND::TingLu
                    | ND::ChiYu
                    | ND::Koraidon
                    | ND::Miraidon
                    | ND::Okidogi
                    | ND::Munkidori
                    | ND::Fezandipiti
                    | ND::Ogerpon
                    | ND::Terapagos,
                    _,
                ) => matches!(self, Self::ScarletViolet), // event only
                (ND::Pecharunt, _) => false,
                _ => true,
            }
        }
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

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "defaultOriginGame"))]
    pub fn first_origin_game(source: MetadataSource) -> OriginGame {
        source.first_origin_game()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "originMark"))]
    pub fn origin_mark(source: MetadataSource) -> Option<OriginMark> {
        source.first_origin_game().mark()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "originGamesFor"))]
    pub fn all_origin_games(source: MetadataSource) -> Vec<OriginGame> {
        source.all_origin_games()
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

    #[cfg_attr(
        feature = "wasm",
        wasm_bindgen(js_name = "formObtainableWithOriginWithoutEvents")
    )]
    pub fn form_obtainable_with_origin_without_events(
        source: MetadataSource,
        national_dex: u16,
        form_index: u16,
    ) -> bool {
        match SpeciesForm::new(national_dex, form_index) {
            Ok(species_form) => source.form_obtainable_with_origin_without_events(species_form),
            Err(_) => false,
        }
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "all"))]
    pub fn all_metadata_sources() -> Vec<MetadataSource> {
        MetadataSource::iter().collect()
    }
}
