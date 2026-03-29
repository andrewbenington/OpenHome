use crate::pkm::location::{self, MetData};
use crate::pkm::ohpkm::OhpkmV2;

use super::location::{LinkTradeIndex, Location};
use pkm_rs_types::{Generation, OriginGame};
use serde::{Deserialize, Serialize};
use tsify::Tsify;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", derive(Tsify, Serialize, Deserialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PkmFormat {
    PK1,
    PK2,
    PK3,
    #[serde(rename = "COLOPKM")]
    ColoPkm,
    #[serde(rename = "XDPKM")]
    XdPkm,
    PK4,
    PK5,
    PK6,
    PK7,
    PB7,
    PK8,
    PA8,
    PB8,
    PK9,
    PA9,

    PK3RR,
    PK3UB,
    PB8LUMI,
}

impl PkmFormat {
    pub const fn species_nickname_all_caps(&self) -> bool {
        matches!(
            self,
            Self::PK1 | Self::PK2 | Self::PK3 | Self::ColoPkm | Self::XdPkm | Self::PK4
        )
    }

    pub const fn default_origin(&self) -> OriginGame {
        match self {
            Self::PK1 => OriginGame::Yellow,
            Self::PK2 => OriginGame::Crystal,
            Self::PK3 => OriginGame::Emerald,
            Self::ColoPkm | Self::XdPkm => OriginGame::ColosseumXd,
            Self::PK4 => OriginGame::HeartGold,
            Self::PK5 => OriginGame::Black2,
            Self::PK6 => OriginGame::OmegaRuby,
            Self::PK7 => OriginGame::UltraSun,
            Self::PB7 => OriginGame::LetsGoPikachu,
            Self::PK8 => OriginGame::Sword,
            Self::PA8 => OriginGame::LegendsArceus,
            Self::PB8 => OriginGame::BrilliantDiamond,
            Self::PK9 => OriginGame::Scarlet,
            Self::PA9 => OriginGame::LegendsZa,
            Self::PK3RR | Self::PK3UB => OriginGame::FireRed,
            Self::PB8LUMI => OriginGame::BrilliantDiamond,
        }
    }

    pub fn matches_origin(&self, origin: OriginGame) -> bool {
        match self {
            Self::PK1 => origin.generation() == Generation::G1,
            Self::PK2 => origin.generation() == Generation::G2,
            Self::PK3 => origin.is_gba(),
            Self::ColoPkm | Self::XdPkm => origin == OriginGame::ColosseumXd,
            Self::PK4 => origin.generation() == Generation::G4,
            Self::PK5 => origin.generation() == Generation::G5,
            Self::PK6 => origin.generation() == Generation::G6,
            Self::PK7 => origin.is_sm_usum(),
            Self::PB7 => origin.is_lets_go(),
            Self::PK8 => origin.is_swsh(),
            Self::PA8 => origin == OriginGame::LegendsArceus,
            Self::PB8 => origin.is_bdsp(),
            Self::PK9 => origin.is_scarlet_violet(),
            Self::PA9 => origin == OriginGame::LegendsZa,
            Self::PK3RR | Self::PK3UB | Self::PB8LUMI => false,
        }
    }

    pub const fn generation(&self) -> Generation {
        match self {
            Self::PK1 => Generation::G1,
            Self::PK2 => Generation::G2,
            Self::PK3 | Self::ColoPkm | Self::XdPkm => Generation::G3,
            Self::PK4 => Generation::G4,
            Self::PK5 => Generation::G5,
            Self::PK6 => Generation::G6,
            Self::PK7 | Self::PB7 => Generation::G7,
            Self::PK8 | Self::PA8 | Self::PB8 => Generation::G8,
            Self::PK9 | Self::PA9 => Generation::G9,
            Self::PK3RR | Self::PK3UB => Generation::G3,
            Self::PB8LUMI => Generation::G8,
        }
    }

    pub const fn supports_hyper_training(&self) -> bool {
        match self {
            Self::PK7
            | Self::PK8
            | Self::PA8
            | Self::PB8
            | Self::PB8LUMI
            | Self::PK9
            | Self::PA9 => true,
            Self::PK1
            | Self::PK2
            | Self::PK3
            | Self::PK3RR
            | Self::PK3UB
            | Self::ColoPkm
            | Self::XdPkm
            | Self::PK4
            | Self::PK5
            | Self::PK6
            | Self::PB7 => false,
        }
    }
}

impl PkmFormat {
    pub fn fallback_location_index(&self) -> u16 {
        if *self == Self::PK8 {
            super::location::FARAWAY_PLACE_SWSH
        } else {
            self.link_trade_location_index()
        }
    }

    const fn link_trade_location_index(&self) -> u16 {
        match *self {
            Self::PK1 | Self::PK2 => super::location::CANT_TELL_GEN2,
            Self::PK3 | Self::ColoPkm | Self::XdPkm => LinkTradeIndex::PkmGen3 as u16,
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
            Self::PK3 | Self::ColoPkm | Self::XdPkm => origin.generation() == Generation::G3,
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
            Self::PK3 | Self::ColoPkm | Self::XdPkm => match origin {
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
                super::location::GO_PARK_LETS_GO
            } else {
                LinkTradeIndex::Pkm3dsSwitch as u16
            };
        }

        if self == Self::PK4 && legalized_origin.generation() == Generation::G3 {
            // Gen 3 Pokémon transferred through Gen 4 must be obtained through the pal park
            return super::location::PAL_PARK_GEN_4;
        }

        if self.generation() >= Generation::G5 && legalized_origin.generation() <= Generation::G4 {
            // Pokémon transferred up through Gen 5 have their location reset to the Poké Transfer Lab
            return super::location::POKE_TRANSFER_LAB_GEN_5;
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

    pub const fn location_index_of(&self, location: Location) -> Option<u16> {
        match self {
            Self::PK1 => None,
            Self::PK2 => location::gen2::index_of(location),
            Self::PK3 => location::gen3_gba::index_of(location),
            Self::ColoPkm | Self::XdPkm => match location {
                Location::LinkTrade => Some(254),
                _ => None,
            },
            Self::PK4 => location::gen4::index_of(location),
            Self::PK5 => match location {
                Location::PokeTransferLab => Some(super::location::POKE_TRANSFER_LAB_GEN_5),
                Location::LinkTrade => Some(30002),
                Location::KantoGen3 => Some(30004),
                Location::JohtoGen4 => Some(30005),
                Location::HoennGen3 => Some(30006),
                Location::SinnohGen4 => Some(30007),
                Location::OrreDistantLand => Some(30008),
                Location::FarawayPlace => Some(40002),

                Location::Route1 => Some(14),
                Location::Route2 => Some(15),
                Location::Route3 => Some(16),
                Location::Route4 => Some(17),
                Location::Route5 => Some(18),
                Location::Route6 => Some(19),
                Location::Route7 => Some(20),
                Location::Route8 => Some(21),
                Location::Route9 => Some(22),
                Location::Route10 => Some(23),
                Location::Route11 => Some(24),
                Location::Route12 => Some(25),
                Location::Route13 => Some(26),
                Location::Route14 => Some(27),
                Location::Route15 => Some(28),
                Location::Route16 => Some(29),
                Location::Route17 => Some(30),
                Location::Route18 => Some(31),
                Location::VictoryRoad => Some(40),
                Location::PokemonLeague => Some(44),
                Location::Route19 => Some(124),
                Location::Route20 => Some(125),
                Location::Route21 => Some(126),
                Location::Route22 => Some(127),
                Location::Route23 => Some(128),
                Location::RockPeakRuins => Some(150),
                Location::IcebergRuins => Some(151),
                Location::IronRuins => Some(152),
                _ => None,
            },
            Self::PK6 => match location {
                Location::LinkTrade => Some(30001),
                Location::KantoGen3 => Some(30003),
                Location::JohtoGen4 => Some(30004),
                Location::HoennGen3 => Some(30005),
                Location::SinnohGen4 => Some(30006),
                Location::OrreDistantLand => Some(30007),
                Location::Unova => Some(30009),
                Location::Kalos => Some(30010),
                Location::FarawayPlace => Some(40002),

                Location::Route1 => Some(8),
                Location::Route2 => Some(12),
                Location::Route3 => Some(16),
                Location::Route4 => Some(20),
                Location::LumioseCity => Some(22),
                Location::Lumiose => Some(22),
                Location::PrismTower => Some(24),
                Location::LysandreLabs => Some(26),
                Location::Route5 => Some(28),
                Location::Route6 => Some(34),
                Location::Route7 => Some(38),
                Location::Route8 => Some(42),
                Location::Route9 => Some(46),
                Location::Route10 => Some(50),
                Location::Route11 => Some(54),
                Location::Route12 => Some(62),
                Location::Route13 => Some(66),
                Location::Route14 => Some(68),
                Location::Route15 => Some(75),
                Location::Route16 => Some(79),
                Location::Route17 => Some(84),
                Location::Route18 => Some(88),
                Location::Route19 => Some(92),
                Location::Route20 => Some(96),
                Location::Route21 => Some(100),
                Location::Route22 => Some(102),
                Location::VictoryRoad => Some(104),
                Location::PokemonLeague => Some(106),
                Location::PowerPlant => Some(136),
                Location::LumioseStation => Some(162),
                Location::LittlerootTown => Some(170),
                Location::OldaleTown => Some(172),
                Location::DewfordTown => Some(174),
                Location::LavaridgeTown => Some(176),
                Location::FallarborTown => Some(178),
                Location::VerdanturfTown => Some(180),
                Location::PacifidlogTown => Some(182),
                Location::PetalburgCity => Some(184),
                Location::SlateportCity => Some(186),
                Location::MauvilleCity => Some(188),
                Location::RustboroCity => Some(190),
                Location::FortreeCity => Some(192),
                Location::LilycoveCity => Some(194),
                Location::MossdeepCity => Some(196),
                Location::SootopolisCity => Some(198),
                Location::EverGrandeCity => Some(200),
                Location::PokemonLeagueHoenn => Some(202),
                Location::Route101 => Some(204),
                Location::Route102 => Some(206),
                Location::Route103 => Some(208),
                Location::Route104 => Some(210),
                Location::Route105 => Some(212),
                Location::Route106 => Some(214),
                Location::Route107 => Some(216),
                Location::Route108 => Some(218),
                Location::Route109 => Some(220),
                Location::Route110 => Some(222),
                Location::Route111 => Some(224),
                Location::Route112 => Some(226),
                Location::Route113 => Some(228),
                Location::Route114 => Some(230),
                Location::Route115 => Some(232),
                Location::Route116 => Some(234),
                Location::Route117 => Some(236),
                Location::Route118 => Some(238),
                Location::Route119 => Some(240),
                Location::Route120 => Some(242),
                Location::Route121 => Some(244),
                Location::Route122 => Some(246),
                Location::Route123 => Some(248),
                Location::Route124 => Some(250),
                Location::Route125 => Some(252),
                Location::Route126 => Some(254),
                Location::Route127 => Some(256),
                Location::Route128 => Some(258),
                Location::Route129 => Some(260),
                Location::Route130 => Some(262),
                Location::Route131 => Some(264),
                Location::Route132 => Some(266),
                Location::Route133 => Some(268),
                Location::Route134 => Some(270),
                Location::MeteorFalls => Some(272),
                Location::RusturfTunnel => Some(274),
                Location::DesertRuins => Some(278),
                Location::GraniteCave => Some(280),
                Location::PetalburgWoods => Some(282),
                Location::MtChimney => Some(284),
                Location::JaggedPass => Some(286),
                Location::FieryPath => Some(288),
                Location::MtPyre => Some(290),
                Location::TeamAquaHideout => Some(292),
                Location::SeafloorCavern => Some(294),
                Location::CaveOfOrigin => Some(296),
                Location::VictoryRoadHoenn => Some(298),
                Location::ShoalCave => Some(300),
                Location::NewMauville => Some(302),
                Location::IslandCave => Some(306),
                Location::AncientTomb => Some(308),
                Location::SealedChamber => Some(310),
                Location::ScorchedSlab => Some(312),
                Location::TeamMagmaHideout => Some(314),
                Location::SkyPillar => Some(316),
                Location::SouthernIsland => Some(320),
                Location::SafariZone => Some(325),
                Location::SafariZoneHoenn => Some(325),
                Location::MirageIsland => Some(330),
                Location::SecretBase => Some(354),
                _ => None,
            },
            Self::PK7 => match location {
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

                Location::Route1 => Some(6),
                Location::Route2 => Some(12),
                Location::Route3 => Some(10),
                Location::Route4 => Some(50),
                Location::Route5 => Some(52),
                Location::Route6 => Some(54),
                Location::Route7 => Some(56),
                Location::Route8 => Some(58),
                Location::Route9 => Some(60),
                Location::Route10 => Some(106),
                Location::Route11 => Some(108),
                Location::Route12 => Some(122),
                Location::Route13 => Some(112),
                Location::Route14 => Some(126),
                Location::Route15 => Some(116),
                Location::Route16 => Some(118),
                Location::Route17 => Some(121),
                Location::PokemonLeague => Some(154),
                _ => None,
            },
            Self::PB7 => match location {
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

                Location::Route1 => Some(3),
                Location::Route2 => Some(4),
                Location::Route3 => Some(5),
                Location::Route4 => Some(6),
                Location::Route5 => Some(7),
                Location::Route6 => Some(8),
                Location::Route7 => Some(9),
                Location::Route8 => Some(10),
                Location::Route9 => Some(11),
                Location::Route10 => Some(12),
                Location::Route11 => Some(13),
                Location::Route12 => Some(14),
                Location::Route13 => Some(15),
                Location::Route14 => Some(16),
                Location::Route15 => Some(17),
                Location::Route16 => Some(18),
                Location::Route17 => Some(19),
                Location::Route18 => Some(20),
                Location::Route19 => Some(21),
                Location::Route20 => Some(22),
                Location::Route21 => Some(23),
                Location::Route22 => Some(24),
                Location::Route23 => Some(25),
                Location::Route24 => Some(26),
                Location::Route25 => Some(27),
                Location::PalletTown => Some(28),
                Location::ViridianCity => Some(29),
                Location::PewterCity => Some(30),
                Location::CeruleanCity => Some(31),
                Location::LavenderTown => Some(32),
                Location::VermilionCity => Some(33),
                Location::CeladonCity => Some(34),
                Location::FuchsiaCity => Some(35),
                Location::CinnabarIsland => Some(36),
                Location::IndigoPlateau => Some(37),
                Location::SaffronCity => Some(38),
                Location::ViridianForest => Some(39),
                Location::MtMoon => Some(40),
                Location::RockTunnel => Some(41),
                Location::PowerPlant => Some(42),
                Location::DiglettsCave => Some(43),
                Location::SeafoamIslands => Some(44),
                Location::VictoryRoad => Some(45),
                Location::VictoryRoadKanto => Some(45),
                Location::CeruleanCave => Some(46),
                Location::PokemonTower => Some(47),
                Location::SsAnne => Some(48),
                Location::TeamRocketHq => Some(49),
                Location::PokemonMansion => Some(51),
                Location::SilphCo => Some(52),
                Location::PokemonLeague => Some(53),
                _ => None,
            },
            Self::PK8 => match location {
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
                Location::Route1 => Some(12),
                Location::Route2 => Some(18),
                Location::Route3 => Some(28),
                Location::Route4 => Some(32),
                Location::Route5 => Some(40),
                Location::Route6 => Some(68),
                Location::Route7 => Some(84),
                Location::Route8 => Some(86),
                Location::Route9 => Some(90),
                Location::Route10 => Some(106),
                Location::BattleTower => Some(158),
                Location::RockPeakRuins => Some(136),
                Location::IcebergRuins => Some(138),
                Location::IronRuins => Some(140),

                _ => None,
            },
            Self::PA8 => match location {
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

                Location::JubilifeCity => Some(6), // Jubilife Village
                Location::CelesticTown => Some(12), // Ancient Retreat
                Location::OreburghMine => Some(18), // Oreburrow Tunnel
                Location::EternaForest => Some(20), // Heartwood
                Location::LakeVerity => Some(23),
                Location::SandgemTown => Some(24), // Sandgem Flats
                Location::FloaromaMeadow => Some(26), // Floaro Gardens
                Location::FloaromaTown => Some(26), // Floaro Gardens
                Location::RamanasPark => Some(27), // Ramanas Island
                Location::SolaceonRuins => Some(35),
                Location::LakeValor => Some(41),
                Location::VeilstoneCity => Some(54), // Veilstone Cape
                Location::StarkMountain => Some(56), // Firespit Island
                Location::SpringPath => Some(58),
                Location::TurnbackCave => Some(67),
                Location::SpearPillar => Some(85),
                Location::WaywardCave => Some(86),
                Location::LakeAcuity => Some(94),
                Location::SnowpointTemple => Some(95),
                Location::VerityCavern => Some(104),
                Location::ValorCavern => Some(105),
                Location::AcuityCavern => Some(111),
                Location::GalacticHq => Some(114), // Galaxy Hall

                _ => None,
            },
            Self::PB8 | Self::PB8LUMI => match location {
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
                Location::JubilifeCity => Some(0),
                Location::CanalaveCity => Some(24),
                Location::OreburghCity => Some(38),
                Location::EternaCity => Some(54),
                Location::HearthomeCity => Some(74),
                Location::PastoriaCity => Some(110),
                Location::VeilstoneCity => Some(123),
                Location::SunyshoreCity => Some(142),
                Location::PokemonLeague => Some(167),
                Location::FightArea => Some(186),
                Location::OreburghMine => Some(195),
                Location::ValleyWindworks => Some(197),
                Location::EternaForest => Some(199),
                Location::FuegoIronworks => Some(201),
                Location::MtCoronet => Some(203),
                Location::SpearPillar => Some(216),
                Location::HallOfOrigin => Some(218),
                Location::GreatMarsh => Some(219),
                Location::SolaceonRuins => Some(225),
                Location::VictoryRoad => Some(244),
                Location::VictoryRoadSinnoh => Some(244),
                Location::RamanasPark => Some(250),
                Location::PalPark => Some(250),
                Location::AmitySquare => Some(251),
                Location::RavagedPath => Some(252),
                Location::FloaromaMeadow => Some(253),
                Location::OreburghGate => Some(255),
                Location::FullmoonIsland => Some(257),
                Location::StarkMountain => Some(259),
                Location::SendoffSpring => Some(263),
                Location::TurnbackCave => Some(264),
                Location::FlowerParadise => Some(285),
                Location::SnowpointTemple => Some(286),
                Location::WaywardCave => Some(292),
                Location::RuinManiacCave => Some(294),
                Location::ManiacTunnel => Some(296),
                Location::TrophyGarden => Some(297),
                Location::IronIsland => Some(298),
                Location::OldChateau => Some(306),
                Location::GalacticHq => Some(315),
                Location::LakeVerity => Some(323),
                Location::VerityCavern => Some(325),
                Location::LakeValor => Some(326),
                Location::ValorCavern => Some(328),
                Location::LakeAcuity => Some(329),
                Location::AcuityCavern => Some(331),
                Location::NewmoonIsland => Some(332),
                Location::BattleFrontier => Some(334),
                Location::BattleTower => Some(339),
                Location::VerityLakefront => Some(346),
                Location::ValorLakefront => Some(347),
                Location::AcuityLakefront => Some(351),
                Location::SpringPath => Some(352),
                Location::Route201 => Some(354),
                Location::Route202 => Some(355),
                Location::Route203 => Some(356),
                Location::Route204 => Some(357),
                Location::Route205 => Some(359),
                Location::Route206 => Some(362),
                Location::Route207 => Some(364),
                Location::Route208 => Some(365),
                Location::Route209 => Some(367),
                Location::Route210 => Some(373),
                Location::Route211 => Some(377),
                Location::Route212 => Some(379),
                Location::Route213 => Some(385),
                Location::Route214 => Some(392),
                Location::Route215 => Some(394),
                Location::Route216 => Some(395),
                Location::Route217 => Some(397),
                Location::Route218 => Some(400),
                Location::Route219 => Some(403),
                Location::Route220 => Some(485),
                Location::Route221 => Some(404),
                Location::Route222 => Some(407),
                Location::Route223 => Some(486),
                Location::Route224 => Some(411),
                Location::Route225 => Some(412),
                Location::Route226 => Some(487),
                Location::Route227 => Some(414),
                Location::Route228 => Some(416),
                Location::Route229 => Some(420),
                Location::TwinleafTown => Some(422),
                Location::SandgemTown => Some(429),
                Location::FloaromaTown => Some(438),
                Location::SolaceonTown => Some(446),
                Location::CelesticTown => Some(456),
                Location::SurvivalArea => Some(465),
                Location::ResortArea => Some(473),
                Location::Route230 => Some(489),
                Location::SeabreakPath => Some(490),
                Location::SecretBase => Some(627),
                _ => None,
            },
            Self::PK9 => match location {
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
                Location::PokemonLeague => Some(10),
                _ => None,
            },
            Self::PA9 => match location {
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
                Location::LumioseCity => Some(30026),
                Location::FarawayPlace => Some(40002),
                Location::LumioseStation => Some(26), // Station Front
                Location::PrismTower => Some(104),
                Location::LysandreLabs => Some(234),
                _ => None,
            },
            Self::PK3RR | Self::PK3UB => match location {
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
            PkmFormat::PK1 | PkmFormat::PK2 => {
                MetData::new(source_origin, super::location::CANT_TELL_GEN2)
            }
            PkmFormat::PK3 => {
                let legalized_origin = self.legalize_origin(source_origin);
                let location_index = if legalized_origin == OriginGame::ColosseumXd
                    && ohpkm.get_is_fateful_encounter()
                {
                    // Pokémon caught in XD are given the Fateful Encounter location index, which sets the
                    // fateful encounter flag when transferred to Gen 4 or converted to OHPKM. Since the flag is set,
                    // the mon must be from XD and would have the fateful encounter location in the GBA games
                    super::location::FATEFUL_ENCOUNTER_GEN_3
                } else {
                    self.legalize_met_location(source_origin, legalized_origin, source_met_location)
                };

                MetData::new(legalized_origin, location_index)
            }
            PkmFormat::ColoPkm
            | PkmFormat::XdPkm
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

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "formatMatchesOrigin")]
pub fn format_matches_origin(format: PkmFormat, origin: OriginGame) -> bool {
    format.matches_origin(origin)
}
