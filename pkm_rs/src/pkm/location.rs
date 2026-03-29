use pkm_rs_types::OriginGame;

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

    // Routes
    Route1,
    Route2,
    Route3,
    Route4,
    Route5,
    Route6,
    Route7,
    Route8,
    Route9,
    Route10,
    Route11,
    Route12,
    Route13,
    Route14,
    Route15,
    Route16,
    Route17,
    Route18,
    Route19,
    Route20,
    Route21,
    Route22,
    Route23,
    Route24,
    Route25,
    Route26,
    Route27,
    Route28,
    Route29,
    Route30,
    Route31,
    Route32,
    Route33,
    Route34,
    Route35,
    Route36,
    Route37,
    Route38,
    Route39,
    Route40,
    Route41,
    Route42,
    Route43,
    Route44,
    Route45,
    Route46,
    Route47,
    Route48,

    // Kanto
    PalletTown,
    ViridianCity,
    PewterCity,
    CeruleanCity,
    LavenderTown,
    VermilionCity,
    CeladonCity,
    FuchsiaCity,
    CinnabarIsland,
    IndigoPlateau,
    SaffronCity,
    ViridianForest,
    MtMoon,
    SsAnne,
    UndergroundPath,
    RocketHideout,
    SilphCo,
    PokemonMansion,
    RockTunnel,
    SeafoamIslands,
    PokemonTower,
    CeruleanCave,
    SafariZoneKanto,
    VictoryRoadKanto,

    // Johto
    NewBarkTown,
    CherrygroveCity,
    VioletCity,
    AzaleaTown,
    CianwoodCity,
    GoldenrodCity,
    OlivineCity,
    EcruteakCity,
    MahoganyTown,
    LakeOfRage,
    BlackthornCity,
    MtSilver,
    SproutTower,
    BellTower,
    BurnedTower,
    NationalPark,
    RadioTower,
    RuinsOfAlph,
    UnionCave,
    SlowpokeWell,
    Lighthouse,
    TeamRocketHq,
    IlexForest,
    GoldenrodTunnel,
    MtMortar,
    IcePath,
    WhirlIslands,
    MtSilverCave,
    DarkCave,
    DragonsDen,
    TohjoFalls,
    SsAqua,

    // Hoenn
    LittlerootTown,
    OldaleTown,
    DewfordTown,
    LavaridgeTown,
    FallarborTown,
    VerdanturfTown,
    PacifidlogTown,
    PetalburgCity,
    SlateportCity,
    MauvilleCity,
    RustboroCity,
    FortreeCity,
    LilycoveCity,
    MossdeepCity,
    SootopolisCity,
    EverGrandeCity,
    Route101,
    Route102,
    Route103,
    Route104,
    Route105,
    Route106,
    Route107,
    Route108,
    Route109,
    Route110,
    Route111,
    Route112,
    Route113,
    Route114,
    Route115,
    Route116,
    Route117,
    Route118,
    Route119,
    Route120,
    Route121,
    Route122,
    Route123,
    Route124,
    Route125,
    Route126,
    Route127,
    Route128,
    Route129,
    Route130,
    Route131,
    Route132,
    Route133,
    Route134,
    GraniteCave,
    MtChimney,
    PetalburgWoods,
    RusturfTunnel,
    AbandonedShip,
    NewMauville,
    MeteorFalls,
    MtPyre,
    Hideout,
    ShoalCave,
    SeafloorCavern,
    MirageIsland,
    CaveOfOrigin,
    SouthernIsland,
    FieryPath,
    JaggedPass,
    SealedChamber,
    ScorchedSlab,
    IslandCave,
    DesertRuins,
    AncientTomb,
    SkyPillar,
    SecretBase,
    Ferry,
    FarawawayIsland,
    VictoryRoadHoenn,
    SafariZoneHoenn,
    PokemonLeagueHoenn,
    TeamAquaHideout,
    TeamMagmaHideout,

    // Sinnoh
    TwinleafTown,
    SandgemTown,
    FloaromaTown,
    SolaceonTown,
    CelesticTown,
    JubilifeCity,
    CanalaveCity,
    OreburghCity,
    EternaCity,
    HearthomeCity,
    PastoriaCity,
    VeilstoneCity,
    SunyshoreCity,
    SnowpointCity,
    Route201,
    Route202,
    Route203,
    Route204,
    Route205,
    Route206,
    Route207,
    Route208,
    Route209,
    Route210,
    Route211,
    Route212,
    Route213,
    Route214,
    Route215,
    Route216,
    Route217,
    Route218,
    Route219,
    Route220,
    Route221,
    Route222,
    Route223,
    Route224,
    Route225,
    Route226,
    Route227,
    Route228,
    Route229,
    Route230,
    OreburghMine,
    ValleyWindworks,
    EternaForest,
    FuegoIronworks,
    MtCoronet,
    SpearPillar,
    GreatMarsh,
    SolaceonRuins,
    AmitySquare,
    RavagedPath,
    FloaromaMeadow,
    OreburghGate,
    FullmoonIsland,
    SendoffSpring,
    TurnbackCave,
    FlowerParadise,
    SnowpointTemple,
    WaywardCave,
    RuinManiacCave,
    ManiacTunnel,
    TrophyGarden,
    IronIsland,
    OldChateau,
    GalacticHq,
    VerityLakefront,
    ValorLakefront,
    AcuityLakefront,
    SpringPath,
    LakeVerity,
    LakeValor,
    LakeAcuity,
    NewmoonIsland,
    FightArea,
    SurvivalArea,
    ResortArea,
    StarkMountain,
    SeabreakPath,
    HallOfOrigin,
    VerityCavern,
    ValorCavern,
    AcuityCavern,
    TrainersSchool,
    VictoryRoadSinnoh,
    RockPeakRuins,
    IcebergRuins,
    IronRuins,
    RamanasPark,

    // Lumiose
    LumioseCity,
    LumioseStation,
    PrismTower,
    LysandreLabs,

    // Other
    DiglettsCave,
    SafariZone,
    PokemonLeague,
    BattleTower,
    BattleFrontier,
    VictoryRoad,
    PowerPlant,
    GameCorner,
    RotomsRoom,
}

pub const CANT_TELL_GEN2: u16 = 126;
pub const FATEFUL_ENCOUNTER_GEN_3: u16 = 255;
pub const PAL_PARK_GEN_4: u16 = 55;
pub const POKE_TRANSFER_LAB_GEN_5: u16 = 60;
pub const GO_PARK_LETS_GO: u16 = 50;
pub const FARAWAY_PLACE_SWSH: u16 = 40002;

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
    use crate::pkm::format::PkmFormat;
    use crate::pkm::ohpkm::OhpkmV2;

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
