pub mod gen2;
pub mod gen3_gba;
pub mod gen4;

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
    pub fn from_english_text(text: &str) -> Option<Self> {
        use Location::*;
        match text {
            "Link Trade" => Some(LinkTrade),
            "Can't Tell" => Some(CantTell),
            "Pal Park" => Some(PalPark),
            "Poké Transfer Lab" => Some(PokeTransferLab),
            "GO Park" => Some(GoPark),
            "Faraway Place" => Some(FarawayPlace),
            "Fateful Encounter" => Some(FatefulEncounter),

            "Diglett's Cave" => Some(DiglettsCave),
            "Safari Zone" => Some(SafariZone),
            "Pokémon League" => Some(PokemonLeague),
            "Battle Tower" => Some(BattleTower),
            "Battle Frontier" => Some(BattleFrontier),
            "Victory Road" => Some(VictoryRoad),
            "Power Plant" => Some(PowerPlant),
            "Game Corner" => Some(GameCorner),
            "Rotom's Room" => Some(RotomsRoom),

            "Route 1" => Some(Route1),
            "Route 2" => Some(Route2),
            "Route 3" => Some(Route3),
            "Route 4" => Some(Route4),
            "Route 5" => Some(Route5),
            "Route 6" => Some(Route6),
            "Route 7" => Some(Route7),
            "Route 8" => Some(Route8),
            "Route 9" => Some(Route9),
            "Route 10" => Some(Route10),
            "Route 11" => Some(Route11),
            "Route 12" => Some(Route12),
            "Route 13" => Some(Route13),
            "Route 14" => Some(Route14),
            "Route 15" => Some(Route15),
            "Route 16" => Some(Route16),
            "Route 17" => Some(Route17),
            "Route 18" => Some(Route18),
            "Route 19" => Some(Route19),
            "Route 20" => Some(Route20),
            "Route 21" => Some(Route21),
            "Route 22" => Some(Route22),
            "Route 23" => Some(Route23),
            "Route 24" => Some(Route24),
            "Route 25" => Some(Route25),
            "Route 26" => Some(Route26),
            "Route 27" => Some(Route27),
            "Route 28" => Some(Route28),
            "Route 29" => Some(Route29),
            "Route 30" => Some(Route30),
            "Route 31" => Some(Route31),
            "Route 32" => Some(Route32),
            "Route 33" => Some(Route33),
            "Route 34" => Some(Route34),
            "Route 35" => Some(Route35),
            "Route 36" => Some(Route36),
            "Route 37" => Some(Route37),
            "Route 38" => Some(Route38),
            "Route 39" => Some(Route39),
            "Route 40" => Some(Route40),
            "Route 41" => Some(Route41),
            "Route 42" => Some(Route42),
            "Route 43" => Some(Route43),
            "Route 44" => Some(Route44),
            "Route 45" => Some(Route45),
            "Route 46" => Some(Route46),
            "Route 47" => Some(Route47),
            "Route 48" => Some(Route48),

            "Route 101" => Some(Route101),
            "Route 102" => Some(Route102),
            "Route 103" => Some(Route103),
            "Route 104" => Some(Route104),
            "Route 105" => Some(Route105),
            "Route 106" => Some(Route106),
            "Route 107" => Some(Route107),
            "Route 108" => Some(Route108),
            "Route 109" => Some(Route109),
            "Route 110" => Some(Route110),
            "Route 111" => Some(Route111),
            "Route 112" => Some(Route112),
            "Route 113" => Some(Route113),
            "Route 114" => Some(Route114),
            "Route 115" => Some(Route115),
            "Route 116" => Some(Route116),
            "Route 117" => Some(Route117),
            "Route 118" => Some(Route118),
            "Route 119" => Some(Route119),
            "Route 120" => Some(Route120),
            "Route 121" => Some(Route121),
            "Route 122" => Some(Route122),
            "Route 123" => Some(Route123),
            "Route 124" => Some(Route124),
            "Route 125" => Some(Route125),
            "Route 126" => Some(Route126),
            "Route 127" => Some(Route127),
            "Route 128" => Some(Route128),
            "Route 129" => Some(Route129),
            "Route 130" => Some(Route130),
            "Route 131" => Some(Route131),
            "Route 132" => Some(Route132),
            "Route 133" => Some(Route133),
            "Route 134" => Some(Route134),

            "Route 201" => Some(Route201),
            "Route 202" => Some(Route202),
            "Route 203" => Some(Route203),
            "Route 204" => Some(Route204),
            "Route 205" => Some(Route205),
            "Route 206" => Some(Route206),
            "Route 207" => Some(Route207),
            "Route 208" => Some(Route208),
            "Route 209" => Some(Route209),
            "Route 210" => Some(Route210),
            "Route 211" => Some(Route211),
            "Route 212" => Some(Route212),
            "Route 213" => Some(Route213),
            "Route 214" => Some(Route214),
            "Route 215" => Some(Route215),
            "Route 216" => Some(Route216),
            "Route 217" => Some(Route217),
            "Route 218" => Some(Route218),
            "Route 219" => Some(Route219),
            "Route 220" => Some(Route220),
            "Route 221" => Some(Route221),
            "Route 222" => Some(Route222),
            "Route 223" => Some(Route223),
            "Route 224" => Some(Route224),
            "Route 225" => Some(Route225),
            "Route 226" => Some(Route226),
            "Route 227" => Some(Route227),
            "Route 228" => Some(Route228),
            "Route 229" => Some(Route229),
            "Route 230" => Some(Route230),

            // Kanto
            "Pallet Town" => Some(PalletTown),
            "Viridian City" => Some(ViridianCity),
            "Pewter City" => Some(PewterCity),
            "Cerulean City" => Some(CeruleanCity),
            "Lavender Town" => Some(LavenderTown),
            "Vermilion City" => Some(VermilionCity),
            "Celadon City" => Some(CeladonCity),
            "Fuchsia City" => Some(FuchsiaCity),
            "Cinnabar Island" => Some(CinnabarIsland),
            "Indigo Plateau" => Some(IndigoPlateau),
            "Saffron City" => Some(SaffronCity),
            "Viridian Forest" => Some(ViridianForest),
            "Mt. Moon" => Some(MtMoon),
            "S.S. Anne" => Some(SsAnne),
            "Underground Path" => Some(UndergroundPath),
            "Rocket Hideout" => Some(RocketHideout),
            "Silph Co." => Some(SilphCo),
            "Pokémon Mansion" => Some(PokemonMansion),
            "Rock Tunnel" => Some(RockTunnel),
            "Seafoam Islands" => Some(SeafoamIslands),
            "Pokémon Tower" => Some(PokemonTower),
            "Cerulean Cave" => Some(CeruleanCave),

            // Johto
            "New Bark Town" => Some(NewBarkTown),
            "Cherrygrove City" => Some(CherrygroveCity),
            "Violet City" => Some(VioletCity),
            "Azalea Town" => Some(AzaleaTown),
            "Cianwood City" => Some(CianwoodCity),
            "Goldenrod City" => Some(GoldenrodCity),
            "Olivine City" => Some(OlivineCity),
            "Ecruteak City" => Some(EcruteakCity),
            "Mahogany Town" => Some(MahoganyTown),
            "Lake of Rage" => Some(LakeOfRage),
            "Blackthorn City" => Some(BlackthornCity),
            "Mt. Silver" => Some(MtSilver),
            "Sprout Tower" => Some(SproutTower),
            "Tin Tower" => Some(BellTower),
            "Bell Tower" => Some(BellTower),
            "Burned Tower" => Some(BurnedTower),
            "National Park" => Some(NationalPark),
            "Radio Tower" => Some(RadioTower),
            "Ruins of Alph" => Some(RuinsOfAlph),
            "Union Cave" => Some(UnionCave),
            "Slowpoke Well" => Some(SlowpokeWell),
            "Lighthouse" => Some(Lighthouse),
            "Team Rocket HQ" => Some(TeamRocketHq),
            "Ilex Forest" => Some(IlexForest),
            "Goldenrod Tunnel" => Some(GoldenrodTunnel),
            "Mt. Mortar" => Some(MtMortar),
            "Ice Path" => Some(IcePath),
            "Whirl Islands" => Some(WhirlIslands),
            "Mt. Silver Cave" => Some(MtSilverCave),
            "Dark Cave" => Some(DarkCave),
            "Dragon's Den" => Some(DragonsDen),
            "Tohjo Falls" => Some(TohjoFalls),
            "Fast Ship" => Some(SsAqua),
            "S.S. Aqua" => Some(SsAqua),

            // Hoenn
            "Littleroot Town" => Some(LittlerootTown),
            "Oldale Town" => Some(OldaleTown),
            "Dewford Town" => Some(DewfordTown),
            "Lavaridge Town" => Some(LavaridgeTown),
            "Fallarbor Town" => Some(FallarborTown),
            "Verdanturf Town" => Some(VerdanturfTown),
            "Pacifidlog Town" => Some(PacifidlogTown),
            "Petalburg City" => Some(PetalburgCity),
            "Slateport City" => Some(SlateportCity),
            "Mauville City" => Some(MauvilleCity),
            "Rustboro City" => Some(RustboroCity),
            "Fortree City" => Some(FortreeCity),
            "Lilycove City" => Some(LilycoveCity),
            "Mossdeep City" => Some(MossdeepCity),
            "Sootopolis City" => Some(SootopolisCity),
            "Ever Grande City" => Some(EverGrandeCity),
            "Granite Cave" => Some(GraniteCave),
            "Mt. Chimney" => Some(MtChimney),
            "Petalburg Woods" => Some(PetalburgWoods),
            "Rusturf Tunnel" => Some(RusturfTunnel),
            "Abandoned Ship" => Some(AbandonedShip),
            "New Mauville" => Some(NewMauville),
            "Meteor Falls" => Some(MeteorFalls),
            "Mt. Pyre" => Some(MtPyre),
            "Shoal Cave" => Some(ShoalCave),
            "Seafloor Cavern" => Some(SeafloorCavern),
            "Mirage Island" => Some(MirageIsland),
            "Cave of Origin" => Some(CaveOfOrigin),
            "Southern Island" => Some(SouthernIsland),
            "Fiery Path" => Some(FieryPath),
            "Jagged Pass" => Some(JaggedPass),
            "Sealed Chamber" => Some(SealedChamber),
            "Scorched Slab" => Some(ScorchedSlab),
            "Island Cave" => Some(IslandCave),
            "Desert Ruins" => Some(DesertRuins),
            "Ancient Tomb" => Some(AncientTomb),
            "Sky Pillar" => Some(SkyPillar),
            "Secret Base" => Some(SecretBase),
            "Ferry" => Some(Ferry),
            "Faraway Island" => Some(FarawawayIsland),
            "Team Aqua Hideout" => Some(TeamAquaHideout),
            "Aqua Hideout" => Some(TeamAquaHideout),
            "Team Magma Hideout" => Some(TeamMagmaHideout),
            "Magma Hideout" => Some(TeamMagmaHideout),

            // Sinnoh
            "Twinleaf Town" => Some(TwinleafTown),
            "Sandgem Town" => Some(SandgemTown),
            "Sandgem Flats" => Some(SandgemTown),
            "Floaroma Town" => Some(FloaromaTown),
            "Solaceon Town" => Some(SolaceonTown),
            "Celestic Town" => Some(CelesticTown),
            "Ancient Retreat" => Some(CelesticTown),
            "Jubilife City" => Some(JubilifeCity),
            "Jubilife Village" => Some(JubilifeCity),
            "Canalave City" => Some(CanalaveCity),
            "Oreburgh City" => Some(OreburghCity),
            "Eterna City" => Some(EternaCity),
            "Hearthome City" => Some(HearthomeCity),
            "Pastoria City" => Some(PastoriaCity),
            "Veilstone City" => Some(VeilstoneCity),
            "Sunyshore City" => Some(SunyshoreCity),
            "Snowpoint City" => Some(SnowpointCity),
            "Oreburgh Mine" => Some(OreburghMine),
            "Oreburrow Tunnel" => Some(OreburghMine),
            "Valley Windworks" => Some(ValleyWindworks),
            "Eterna Forest" => Some(EternaForest),
            "Fuego Ironworks" => Some(FuegoIronworks),
            "Mt. Coronet" => Some(MtCoronet),
            "Spear Pillar" => Some(SpearPillar),
            "Great Marsh" => Some(GreatMarsh),
            "Solaceon Ruins" => Some(SolaceonRuins),
            "Amity Square" => Some(AmitySquare),
            "Ravaged Path" => Some(RavagedPath),
            "Floaroma Meadow" => Some(FloaromaMeadow),
            "Floaro Gardens" => Some(FloaromaMeadow),
            "Oreburgh Gate" => Some(OreburghGate),
            "Fullmoon Island" => Some(FullmoonIsland),
            "Sendoff Spring" => Some(SendoffSpring),
            "Turnback Cave" => Some(TurnbackCave),
            "Flower Paradise" => Some(FlowerParadise),
            "Snowpoint Temple" => Some(SnowpointTemple),
            "Wayward Cave" => Some(WaywardCave),
            "Ruin Maniac Cave" => Some(RuinManiacCave),
            "Maniac Tunnel" => Some(ManiacTunnel),
            "Trophy Garden" => Some(TrophyGarden),
            "Iron Island" => Some(IronIsland),
            "Old Chateau" => Some(OldChateau),
            "Galactic HQ" => Some(GalacticHq),
            "Verity Lakefront" => Some(VerityLakefront),
            "Valor Lakefront" => Some(ValorLakefront),
            "Acuity Lakefront" => Some(AcuityLakefront),
            "Spring Path" => Some(SpringPath),
            "Lake Verity" => Some(LakeVerity),
            "Lake Valor" => Some(LakeValor),
            "Lake Acuity" => Some(LakeAcuity),
            "Newmoon Island" => Some(NewmoonIsland),
            "Fight Area" => Some(FightArea),
            "Survival Area" => Some(SurvivalArea),
            "Resort Area" => Some(ResortArea),
            "Stark Mountain" => Some(StarkMountain),
            "Seabreak Path" => Some(SeabreakPath),
            "Hall of Origin" => Some(HallOfOrigin),
            "Verity Cavern" => Some(VerityCavern),
            "Valor Cavern" => Some(ValorCavern),
            "Acuity Cavern" => Some(AcuityCavern),
            "Trainers' School" => Some(TrainersSchool),
            "Rock Peak Ruins" => Some(RockPeakRuins),
            "Iceberg Ruins" => Some(IcebergRuins),
            "Iron Ruins" => Some(IronRuins),
            "Ramanas Park" => Some(RamanasPark),
            "Ramanas Island" => Some(RamanasPark),

            // Lumiose
            "Lumiose City" => Some(LumioseCity),
            "Lumiose Station" => Some(LumioseStation),
            "Prism Tower" => Some(PrismTower),
            "Lysandre Labs" => Some(LysandreLabs),
            _ => None,
        }
    }
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
