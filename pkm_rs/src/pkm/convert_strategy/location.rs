use pkm_rs_types::{Generation, OriginGame};

use crate::pkm::{PkmFormat, ohpkm::OhpkmV2};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub enum Location {
    // General
    LinkTrade,
    CantTell,
    PalPark,
    PokeTransferLab,
    GoPark,
    FarawayPlace,
    FatefulEncounter,

    // Game Settings
    KantoGen3,
    KantoVirtualConsole,
    KantoLetsGo,

    JohtoGen4,
    JohtoVirtualConsole,

    HoennGen3,
    HoennGen6,

    OrreDistantLand,

    SinnohGen4,
    SinnohGen8,
    Hisui,

    Unova,

    Kalos,
    Lumiose,

    Alola,
    Galar,
    Paldea,

    // Games
    PokemonGo,
    PokemonHome,
}

const CANT_TELL_GEN2: u16 = 126;
const FATEFUL_ENCOUNTER_GEN_3: u16 = 255;
const PAL_PARK_GEN_4: u16 = 55;
const POKE_TRANSFER_LAB_GEN_5: u16 = 60;
const GO_PARK_LETS_GO: u16 = 50;
const FARAWAY_PLACE_SWSH: u16 = 40002;

impl Location {
    pub const fn game_setting_best_match(origin: OriginGame) -> Self {
        use OriginGame::*;
        match origin {
            FireRed | LeafGreen => Self::KantoGen3,
            Red | BlueGreen | BlueJpn | Yellow => Self::KantoVirtualConsole,
            LetsGoPikachu | LetsGoEevee => Self::KantoLetsGo,

            Sapphire | Ruby | Emerald => Self::HoennGen3,
            AlphaSapphire | OmegaRuby => Self::HoennGen6,

            HeartGold | SoulSilver => Self::JohtoGen4,
            Gold | Silver | Crystal => Self::JohtoVirtualConsole,

            Diamond | Pearl | Platinum => Self::SinnohGen4,
            BrilliantDiamond | ShiningPearl => Self::SinnohGen8,
            LegendsArceus => Self::Hisui,

            ColosseumXd => Self::OrreDistantLand,

            White | Black | White2 | Black2 => Self::Unova,

            X | Y => Self::Kalos,
            LegendsZa => Self::Lumiose,

            Sun | Moon | UltraSun | UltraMoon => Self::Alola,

            Go => Self::PokemonGo,

            Sword | Shield => Self::Galar,

            Home => Self::PokemonHome,

            Scarlet | Violet => Self::Paldea,

            // LEAVE THESE HERE EXPLICITLY!
            // We want a compiler error when a new OriginGame is introduced and not handled here, so we don't want to have a catch-all case
            Invalid0 | Invalid6 | Invalid9 | Invalid13 | Invalid14 | BattleRevolution
            | Invalid17 | Invalid18 | Invalid19 | Invalid28 | Invalid29 => Self::LinkTrade,
        }
    }

    // Return the game setting met location present in most games.
    // For example, KantoGen3 is present in Gen 4 and up, while KantoVirtualConsole is only present in Gen 7 and up, so the Gen 3 origin is used.
    pub const fn game_setting_most_compatible(origin: OriginGame) -> Self {
        use OriginGame::*;
        match origin {
            FireRed | LeafGreen | Red | BlueGreen | BlueJpn | Yellow | LetsGoPikachu
            | LetsGoEevee => Self::KantoGen3,

            Sapphire | Ruby | Emerald | AlphaSapphire | OmegaRuby => Self::HoennGen3,

            HeartGold | SoulSilver | Gold | Silver | Crystal => Self::JohtoGen4,

            Diamond | Pearl | Platinum | BrilliantDiamond | ShiningPearl | LegendsArceus => {
                Self::SinnohGen4
            }

            ColosseumXd => Self::OrreDistantLand,

            White | Black | White2 | Black2 => Self::Unova,

            X | Y | LegendsZa => Self::Kalos,

            Sun | Moon | UltraSun | UltraMoon => Self::Alola,

            Go => Self::PokemonGo,

            Sword | Shield => Self::Galar,

            Home => Self::PokemonHome,

            Scarlet | Violet => Self::Paldea,

            // LEAVE THESE HERE EXPLICITLY!
            // We want a compiler error when a new OriginGame is introduced and not handled here, so we don't want to have a catch-all case
            Invalid0 | Invalid6 | Invalid9 | Invalid13 | Invalid14 | BattleRevolution
            | Invalid17 | Invalid18 | Invalid19 | Invalid28 | Invalid29 => Self::LinkTrade,
        }
    }
}

impl PkmFormat {
    pub fn fallback_location_index(&self) -> u16 {
        if *self == Self::PK8 {
            FARAWAY_PLACE_SWSH
        } else {
            self.link_trade_location_index()
        }
    }

    const fn link_trade_location_index(&self) -> u16 {
        match *self {
            Self::PK1 | Self::PK2 => CANT_TELL_GEN2,
            Self::PK3 | Self::COLOPKM | Self::XDPKM => LinkTradeIndex::PkmGen3 as u16,
            Self::PK4 => LinkTradeIndex::Pk4 as u16,
            Self::PK5 => LinkTradeIndex::Pk5 as u16,
            Self::PK6
            | Self::PK7
            | Self::PB7
            | Self::PK8
            | Self::PA8
            | Self::PB8
            | Self::PK9
            | Self::PA9 => LinkTradeIndex::Pkm3dsSwitch as u16,

            Self::PK3RR | Self::PK3UB => LinkTradeIndex::PkmGen3 as u16,
            Self::PB8LUMI => LinkTradeIndex::Pkm3dsSwitch as u16,
        }
    }

    pub fn origin_is_legal(&self, origin: OriginGame) -> bool {
        match self {
            Self::PK1 | Self::PK2 => false,
            Self::PK3 | Self::COLOPKM | Self::XDPKM => origin.generation() == Generation::G3,
            Self::PK4 => {
                origin.generation() == Generation::G3 || origin.generation() == Generation::G4
            }
            Self::PK5 => {
                origin.generation() >= Generation::G3 && origin.generation() <= Generation::G5
            }
            Self::PK6 => {
                origin.generation() >= Generation::G3 && origin.generation() <= Generation::G6
            }
            Self::PK7 => origin <= OriginGame::Crystal,
            Self::PB7 => origin.is_lets_go() || origin == OriginGame::Go,
            Self::PK8 => origin <= OriginGame::Shield,
            Self::PA8 | Self::PB8 => origin <= OriginGame::LegendsArceus,
            Self::PK9 => origin <= OriginGame::Violet,
            Self::PA9 => origin <= OriginGame::LegendsZa,
            Self::PK3RR => origin.generation() == Generation::G3,
            Self::PK3UB => origin.generation() == Generation::G3,
            Self::PB8LUMI => origin <= OriginGame::LegendsArceus,
        }
    }

    pub fn origin_if_legal(&self, origin: OriginGame) -> Option<OriginGame> {
        if self.origin_is_legal(origin) {
            Some(origin)
        } else {
            None
        }
    }

    pub fn legalize_origin(&self, origin: OriginGame) -> OriginGame {
        use OriginGame::*;
        if self.origin_is_legal(origin) {
            println!(
                "Origin game {:?} is legal in format {:?}, no need to legalize",
                origin, self
            );
            return origin;
        }

        match self {
            Self::PK1 | Self::PK2 => origin, // doesn't matter; these games don't store origin
            Self::PK3 | Self::COLOPKM | Self::XDPKM => match origin {
                Red | Yellow | LetsGoPikachu => FireRed,
                BlueGreen | BlueJpn | LetsGoEevee => LeafGreen,

                AlphaSapphire => Sapphire,
                OmegaRuby => Ruby,

                _ => Emerald,
            },
            Self::PK4 => match origin {
                Red | Yellow | LetsGoPikachu => FireRed,
                BlueGreen | BlueJpn | LetsGoEevee => LeafGreen,

                AlphaSapphire => Sapphire,
                OmegaRuby => Ruby,

                BrilliantDiamond => Diamond,
                ShiningPearl => Pearl,
                LegendsArceus => Platinum,

                Gold | Crystal => HeartGold,
                Silver => SoulSilver,

                _ => SoulSilver,
            },
            Self::PK5 => match origin {
                Red | Yellow | LetsGoPikachu => FireRed,
                BlueGreen | BlueJpn | LetsGoEevee => LeafGreen,

                AlphaSapphire => Sapphire,
                OmegaRuby => Ruby,

                BrilliantDiamond => Diamond,
                ShiningPearl => Pearl,
                LegendsArceus => Platinum,

                Gold | Crystal => HeartGold,
                Silver => SoulSilver,

                _ => White2,
            },
            Self::PK6 => match origin {
                Red | Yellow | LetsGoPikachu => FireRed,
                BlueGreen | BlueJpn | LetsGoEevee => LeafGreen,

                BrilliantDiamond => Diamond,
                ShiningPearl => Pearl,
                LegendsArceus => Platinum,

                Gold | Crystal => HeartGold,
                Silver => SoulSilver,

                LegendsZa => X,

                _ => Y,
            },
            Self::PK7 => match origin {
                LetsGoPikachu => FireRed,
                LetsGoEevee => LeafGreen,

                BrilliantDiamond => Diamond,
                ShiningPearl => Pearl,
                LegendsArceus => Platinum,

                LegendsZa => X,

                _ => UltraMoon,
            },
            Self::PB7 => match origin {
                FireRed | Red | Yellow => LetsGoPikachu,

                _ => LetsGoEevee,
            },
            Self::PK8 => Sword, // Pokémon HOME does this for all post-SwSh Pokémon transferred in
            Self::PA8 => LegendsArceus,
            Self::PB8 => ShiningPearl,
            Self::PK9 => match origin {
                LegendsZa => X,
                _ => Violet,
            },
            Self::PA9 => LegendsZa,
            Self::PK3RR => FireRed,
            Self::PK3UB => FireRed,
            Self::PB8LUMI => ShiningPearl,
        }
    }

    pub fn legalize_met_location(
        self,
        original_origin: OriginGame,
        legalized_origin: OriginGame,
        met_location_index: u16,
    ) -> u16 {
        if self == Self::PB7 {
            return if self.matches_origin(original_origin) {
                met_location_index
            } else if legalized_origin == OriginGame::Go {
                // Pokémon transferred from Pokémon Go to Let's Go must go through the Go Park
                GO_PARK_LETS_GO
            } else {
                LinkTradeIndex::Pkm3dsSwitch as u16
            };
        }

        if self == Self::PK4 && legalized_origin.generation() == Generation::G3 {
            // Gen 3 Pokémon transferred through Gen 4 must be obtained through the pal park
            return PAL_PARK_GEN_4;
        }

        if self.generation() >= Generation::G5 && legalized_origin.generation() <= Generation::G4 {
            // Pokémon transferred up through Gen 5 have their location reset to the Poké Transfer Lab
            return POKE_TRANSFER_LAB_GEN_5;
        }

        let origin_was_changed = original_origin != legalized_origin;
        if !origin_was_changed {
            return met_location_index;
        }

        if self.matches_origin(legalized_origin) {
            // the illegal origin was simply set to a game of this format, so the met location should be the default.
            // for most games, this will be a link trade, but for sword/shield it's "the Faraway place"
            return self.fallback_location_index();
        }

        // default to link trade if we can't find a better option
        self.link_trade_location_index()
    }

    pub const fn index_for(&self, notable_location: Location) -> Option<u16> {
        match self {
            Self::PK1 => None,
            Self::PK2 => match notable_location {
                Location::CantTell => Some(126),
                _ => None,
            },
            Self::PK3 => match notable_location {
                Location::LinkTrade => Some(254),
                Location::FatefulEncounter => Some(255),
                _ => None,
            },
            Self::COLOPKM | Self::XDPKM => match notable_location {
                Location::LinkTrade => Some(254),
                _ => None,
            },
            Self::PK4 => match notable_location {
                Location::PalPark => Some(PAL_PARK_GEN_4),
                Location::LinkTrade => Some(2001),
                Location::KantoGen3 => Some(2003),
                Location::JohtoGen4 => Some(2004),
                Location::HoennGen3 => Some(2005),
                Location::SinnohGen4 => Some(2006),
                Location::OrreDistantLand => Some(2008),
                _ => None,
            },
            Self::PK5 => match notable_location {
                Location::PokeTransferLab => Some(POKE_TRANSFER_LAB_GEN_5),
                Location::LinkTrade => Some(30002),
                Location::KantoGen3 => Some(30004),
                Location::JohtoGen4 => Some(30005),
                Location::HoennGen3 => Some(30006),
                Location::SinnohGen4 => Some(30007),
                Location::OrreDistantLand => Some(30008),
                Location::FarawayPlace => Some(40002),
                _ => None,
            },
            Self::PK6 => match notable_location {
                Location::LinkTrade => Some(30001),
                Location::KantoGen3 => Some(30003),
                Location::JohtoGen4 => Some(30004),
                Location::HoennGen3 => Some(30005),
                Location::SinnohGen4 => Some(30006),
                Location::OrreDistantLand => Some(30007),
                Location::Unova => Some(30009),
                Location::Kalos => Some(30010),
                Location::FarawayPlace => Some(40002),
                _ => None,
            },
            Self::PK7 => match notable_location {
                Location::LinkTrade => Some(30001),
                Location::KantoGen3 => Some(30003),
                Location::JohtoGen4 => Some(30004),
                Location::HoennGen3 => Some(30005),
                Location::SinnohGen4 => Some(30006),
                Location::OrreDistantLand => Some(30007),
                Location::Unova => Some(30009),
                Location::Kalos => Some(30010),
                Location::PokemonGo => Some(30012),
                Location::KantoVirtualConsole => Some(30013),
                Location::HoennGen6 => Some(30014),
                Location::Alola => Some(30015),
                Location::JohtoVirtualConsole => Some(30017),
                Location::FarawayPlace => Some(40002),
                _ => None,
            },
            Self::PB7 => match notable_location {
                Location::GoPark => Some(50),
                Location::LinkTrade => Some(30001),
                Location::KantoGen3 => Some(30003),
                Location::JohtoGen4 => Some(30004),
                Location::HoennGen3 => Some(30005),
                Location::SinnohGen4 => Some(30006),
                Location::OrreDistantLand => Some(30007),
                Location::Unova => Some(30009),
                Location::Kalos => Some(30010),
                Location::PokemonGo => Some(30012),
                Location::KantoVirtualConsole => Some(30013),
                Location::HoennGen6 => Some(30014),
                Location::Alola => Some(30015),
                Location::JohtoVirtualConsole => Some(30017),
                Location::FarawayPlace => Some(40002),
                _ => None,
            },
            Self::PK8 => match notable_location {
                Location::LinkTrade => Some(30001),
                Location::KantoGen3 => Some(30003),
                Location::JohtoGen4 => Some(30004),
                Location::HoennGen3 => Some(30005),
                Location::SinnohGen4 => Some(30006),
                Location::OrreDistantLand => Some(30007),
                Location::Unova => Some(30009),
                Location::Kalos => Some(30010),
                Location::PokemonGo => Some(30012),
                Location::KantoVirtualConsole => Some(30013),
                Location::HoennGen6 => Some(30014),
                Location::Alola => Some(30015),
                Location::JohtoVirtualConsole => Some(30017),
                Location::PokemonHome => Some(30018),
                Location::KantoLetsGo => Some(30019),
                Location::FarawayPlace => Some(40002),
                _ => None,
            },
            Self::PA8 => match notable_location {
                Location::LinkTrade => Some(30001),
                Location::KantoGen3 => Some(30003),
                Location::JohtoGen4 => Some(30004),
                Location::HoennGen3 => Some(30005),
                Location::SinnohGen4 => Some(30006),
                Location::OrreDistantLand => Some(30007),
                Location::Unova => Some(30009),
                Location::Kalos => Some(30010),
                Location::PokemonGo => Some(30012),
                Location::KantoVirtualConsole => Some(30013),
                Location::HoennGen6 => Some(30014),
                Location::Alola => Some(30015),
                Location::JohtoVirtualConsole => Some(30017),
                Location::PokemonHome => Some(30018),
                Location::KantoLetsGo => Some(30019),
                Location::Galar => Some(30020),
                Location::Hisui => Some(30021),
                Location::SinnohGen8 => Some(30022),
                Location::FarawayPlace => Some(40002),
                _ => None,
            },
            Self::PB8 | Self::PB8LUMI => match notable_location {
                Location::LinkTrade => Some(30001),
                Location::KantoGen3 => Some(30003),
                Location::JohtoGen4 => Some(30004),
                Location::HoennGen3 => Some(30005),
                Location::SinnohGen4 => Some(30006),
                Location::OrreDistantLand => Some(30007),
                Location::Unova => Some(30009),
                Location::Kalos => Some(30010),
                Location::PokemonGo => Some(30012),
                Location::KantoVirtualConsole => Some(30013),
                Location::HoennGen6 => Some(30014),
                Location::Alola => Some(30015),
                Location::JohtoVirtualConsole => Some(30017),
                Location::PokemonHome => Some(30018),
                Location::KantoLetsGo => Some(30019),
                Location::Galar => Some(30020),
                Location::SinnohGen8 => Some(30022),
                Location::FarawayPlace => Some(40002),
                _ => None,
            },
            Self::PK9 => match notable_location {
                Location::LinkTrade => Some(30001),
                Location::KantoGen3 => Some(30003),
                Location::JohtoGen4 => Some(30004),
                Location::HoennGen3 => Some(30005),
                Location::SinnohGen4 => Some(30006),
                Location::OrreDistantLand => Some(30007),
                Location::Unova => Some(30009),
                Location::Kalos => Some(30010),
                Location::PokemonGo => Some(30012),
                Location::KantoVirtualConsole => Some(30013),
                Location::HoennGen6 => Some(30014),
                Location::Alola => Some(30015),
                Location::JohtoVirtualConsole => Some(30017),
                Location::PokemonHome => Some(30018),
                Location::KantoLetsGo => Some(30019),
                Location::Galar => Some(30020),
                Location::Hisui => Some(30021),
                Location::SinnohGen8 => Some(30022),
                Location::FarawayPlace => Some(40002),
                _ => None,
            },
            Self::PA9 => match notable_location {
                Location::LinkTrade => Some(30001),
                Location::KantoGen3 => Some(30003),
                Location::JohtoGen4 => Some(30004),
                Location::HoennGen3 => Some(30005),
                Location::SinnohGen4 => Some(30006),
                Location::OrreDistantLand => Some(30007),
                Location::Unova => Some(30009),
                Location::Kalos => Some(30010),
                Location::PokemonGo => Some(30012),
                Location::KantoVirtualConsole => Some(30013),
                Location::HoennGen6 => Some(30014),
                Location::Alola => Some(30015),
                Location::JohtoVirtualConsole => Some(30017),
                Location::PokemonHome => Some(30018),
                Location::KantoLetsGo => Some(30019),
                Location::Galar => Some(30020),
                Location::Hisui => Some(30021),
                Location::SinnohGen8 => Some(30022),
                Location::Paldea => Some(30025),
                Location::Lumiose => Some(30026),
                Location::FarawayPlace => Some(40002),
                _ => None,
            },
            Self::PK3RR | Self::PK3UB => match notable_location {
                Location::LinkTrade => Some(254),
                Location::FatefulEncounter => Some(255),
                _ => None,
            },
        }
    }

    pub fn met_data_maximizing_legality(&self, ohpkm: &OhpkmV2) -> MetData {
        let source_origin = ohpkm.get_game_of_origin();
        let source_met_location = ohpkm.get_met_location_index();
        if self.matches_origin(source_origin) {
            // this format matches the origin game, so the met location index should be valid in the new format
            return MetData::new(source_origin, source_met_location);
        }

        println!(
            "Origin game {:?} is not legal in format {:?}, legalizing origin and met location",
            source_origin, self
        );

        match self {
            PkmFormat::PK1 | PkmFormat::PK2 => MetData::new(source_origin, CANT_TELL_GEN2),
            PkmFormat::PK3 => {
                let legalized_origin = self.legalize_origin(source_origin);
                let location_index = if legalized_origin == OriginGame::ColosseumXd
                    && ohpkm.get_is_fateful_encounter()
                {
                    // Pokémon caught in XD are given the Fateful Encounter location index, which sets the
                    // fateful encounter flag when transferred to Gen 4 or converted to OHPKM. Since the flag is set,
                    // the mon must be from XD and would have the fateful encounter location in the GBA games
                    FATEFUL_ENCOUNTER_GEN_3
                } else {
                    self.legalize_met_location(source_origin, legalized_origin, source_met_location)
                };

                MetData::new(legalized_origin, location_index)
            }
            PkmFormat::COLOPKM
            | PkmFormat::XDPKM
            | PkmFormat::PK4
            | PkmFormat::PK5
            | PkmFormat::PK6
            | PkmFormat::PK7
            | PkmFormat::PB7
            | PkmFormat::PK8
            | PkmFormat::PA8
            | PkmFormat::PB8
            | PkmFormat::PK9
            | PkmFormat::PA9 => {
                let legalized_origin = self.legalize_origin(source_origin);
                let location_index = self.legalize_met_location(
                    source_origin,
                    legalized_origin,
                    source_met_location,
                );

                MetData::new(legalized_origin, location_index)
            }
            PkmFormat::PK3RR | PkmFormat::PK3UB | PkmFormat::PB8LUMI => {
                let legalized_origin = self.legalize_origin(source_origin);
                let location_index = self.legalize_met_location(
                    source_origin,
                    legalized_origin,
                    source_met_location,
                );

                MetData::new(legalized_origin, location_index)
            }
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct MetData {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "gameOfOrigin"))]
    pub origin: OriginGame,
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "locationIndex"))]
    pub location_index: u16,
}

impl MetData {
    pub const fn new(origin: OriginGame, location_index: u16) -> Self {
        Self {
            origin,
            location_index,
        }
    }
}

pub enum LinkTradeIndex {
    PkmGen3 = 254,
    Pk4 = 2001,
    Pk5 = 30002,
    Pkm3dsSwitch = 30001,
}

#[cfg(all(test, feature = "wasm"))]
mod tests {
    use super::*;
    use crate::pkm::Result;

    const POKEMON_GO_HOME_TRANSFER: u16 = 30012;

    fn ohpkm_with_origin_and_location(origin: OriginGame, location_index: u16) -> OhpkmV2 {
        let mut ohpkm = OhpkmV2::new(25, 0).expect("Failed to create OHPKM");
        ohpkm.set_game_of_origin(origin);
        ohpkm.set_met_location_index(location_index);
        ohpkm
    }

    mod pk5 {
        use super::*;

        #[test]
        fn to_black_from_omega_ruby() -> Result<()> {
            let ohpkm = ohpkm_with_origin_and_location(OriginGame::OmegaRuby, 20000);
            let met_data = PkmFormat::PK5.met_data_maximizing_legality(&ohpkm);

            // Omega Ruby treated as Ruby
            assert_eq!(met_data.origin, OriginGame::Ruby);
            assert_eq!(met_data.location_index, POKE_TRANSFER_LAB_GEN_5);

            Ok(())
        }
    }

    mod pk7 {
        use super::*;

        #[test]
        fn to_alola_from_ruby() -> Result<()> {
            let ohpkm = ohpkm_with_origin_and_location(OriginGame::Ruby, 200);
            let met_data = PkmFormat::PK8.met_data_maximizing_legality(&ohpkm);

            // Gen 3 games use the poké transfer lab
            assert_eq!(met_data.origin, OriginGame::Ruby);
            assert_eq!(met_data.location_index, POKE_TRANSFER_LAB_GEN_5);

            Ok(())
        }

        #[test]
        fn to_alola_from_diamond() -> Result<()> {
            let ohpkm = ohpkm_with_origin_and_location(OriginGame::Diamond, 2000);
            let met_data = PkmFormat::PK8.met_data_maximizing_legality(&ohpkm);

            // Gen 4 games use the poké transfer lab
            assert_eq!(met_data.origin, OriginGame::Diamond);
            assert_eq!(met_data.location_index, POKE_TRANSFER_LAB_GEN_5);

            Ok(())
        }

        #[test]
        fn to_alola_from_white() -> Result<()> {
            let ohpkm = ohpkm_with_origin_and_location(OriginGame::White, 20000);
            let met_data = PkmFormat::PK8.met_data_maximizing_legality(&ohpkm);

            // Gen 5+ games keep their location
            assert_eq!(met_data.origin, OriginGame::White);
            assert_eq!(met_data.location_index, 20000);

            Ok(())
        }
    }

    mod pb7 {
        use super::*;

        #[test]
        fn to_lets_go_from_ruby() -> Result<()> {
            let ohpkm = ohpkm_with_origin_and_location(OriginGame::Ruby, 200);
            let met_data = PkmFormat::PB7.met_data_maximizing_legality(&ohpkm);

            // Gen 3 games use the poké transfer lab
            assert_eq!(met_data.origin, OriginGame::LetsGoEevee);
            assert_eq!(met_data.location_index, LinkTradeIndex::Pkm3dsSwitch as u16);

            Ok(())
        }

        #[test]
        fn to_lets_go_from_go_via_home() -> Result<()> {
            let ohpkm = ohpkm_with_origin_and_location(OriginGame::Go, POKEMON_GO_HOME_TRANSFER);
            let met_data = PkmFormat::PB7.met_data_maximizing_legality(&ohpkm);

            // Even Go mons transferred through Home get the Go Park location, since that's the only way to get them into Let's Go
            assert_eq!(met_data.origin, OriginGame::Go);
            assert_eq!(met_data.location_index, GO_PARK_LETS_GO);

            Ok(())
        }

        #[test]
        fn to_lets_go_from_scarlet() -> Result<()> {
            let ohpkm = ohpkm_with_origin_and_location(OriginGame::Scarlet, 20000);
            let met_data = PkmFormat::PB7.met_data_maximizing_legality(&ohpkm);

            // Future games get an origin of Sword and the faraway place met location
            assert_eq!(met_data.origin, OriginGame::LetsGoEevee);
            assert_eq!(met_data.location_index, LinkTradeIndex::Pkm3dsSwitch as u16);

            Ok(())
        }
    }

    mod pk8 {
        use super::*;

        #[test]
        fn to_swsh_from_scarlet() -> Result<()> {
            let ohpkm = ohpkm_with_origin_and_location(OriginGame::Scarlet, 20000);
            let met_data = PkmFormat::PK8.met_data_maximizing_legality(&ohpkm);

            // Future games get an origin of Sword and the faraway place met location
            assert_eq!(met_data.origin, OriginGame::Sword);
            assert_eq!(met_data.location_index, FARAWAY_PLACE_SWSH);

            Ok(())
        }

        #[test]
        fn to_swsh_from_ruby() -> Result<()> {
            let ohpkm = ohpkm_with_origin_and_location(OriginGame::Ruby, 200);
            let met_data = PkmFormat::PK8.met_data_maximizing_legality(&ohpkm);

            // Gen 3 games use the poké transfer lab
            assert_eq!(met_data.origin, OriginGame::Ruby);
            assert_eq!(met_data.location_index, POKE_TRANSFER_LAB_GEN_5);

            Ok(())
        }

        #[test]
        fn to_swsh_from_diamond() -> Result<()> {
            let ohpkm = ohpkm_with_origin_and_location(OriginGame::Diamond, 2000);
            let met_data = PkmFormat::PK8.met_data_maximizing_legality(&ohpkm);

            // Gen 4 games use the poké transfer lab
            assert_eq!(met_data.origin, OriginGame::Diamond);
            assert_eq!(met_data.location_index, POKE_TRANSFER_LAB_GEN_5);

            Ok(())
        }

        #[test]
        fn to_swsh_from_moon() -> Result<()> {
            let ohpkm = ohpkm_with_origin_and_location(OriginGame::Moon, 20000);
            let met_data = PkmFormat::PK8.met_data_maximizing_legality(&ohpkm);

            // Gen 5+ games keep their location
            assert_eq!(met_data.origin, OriginGame::Moon);
            assert_eq!(met_data.location_index, 20000);

            Ok(())
        }
    }
}
