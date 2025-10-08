use pkm_rs_types::{Generation, Region};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub enum ColosseumOrXd {
    Colosseum,
    XD,
    Indeterminate,
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "OriginGame"))]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum OriginGame {
    Red,
    BlueGreen,
    BlueJpn,
    Yellow,
    Gold,
    Silver,
    Crystal,
    Ruby,
    Sapphire,
    Emerald,
    FireRed,
    LeafGreen,
    ColosseumXd,
    Diamond,
    Pearl,
    Platinum,
    HeartGold,
    SoulSilver,
    BattleRevolution,
    Black,
    White,
    Black2,
    White2,
    X,
    Y,
    OmegaRuby,
    AlphaSapphire,
    Go,
    Sun,
    Moon,
    UltraSun,
    UltraMoon,
    LetsGoPikachu,
    LetsGoEevee,
    Sword,
    Shield,
    Home,
    LegendsArceus,
    BrilliantDiamond,
    ShiningPearl,
    Scarlet,
    Violet,
}

impl OriginGame {
    pub const fn to_u32(&self) -> u32 {
        match self {
            OriginGame::Red => 35,
            OriginGame::BlueGreen => 36,
            OriginGame::BlueJpn => 37,
            OriginGame::Yellow => 38,
            OriginGame::Gold => 39,
            OriginGame::Silver => 40,
            OriginGame::Crystal => 41,
            OriginGame::Ruby => 2,
            OriginGame::Sapphire => 1,
            OriginGame::Emerald => 3,
            OriginGame::FireRed => 4,
            OriginGame::LeafGreen => 5,
            OriginGame::ColosseumXd => 15,
            OriginGame::Diamond => 10,
            OriginGame::Pearl => 11,
            OriginGame::Platinum => 12,
            OriginGame::HeartGold => 7,
            OriginGame::SoulSilver => 8,
            OriginGame::BattleRevolution => 16,
            OriginGame::Black => 21,
            OriginGame::White => 20,
            OriginGame::Black2 => 23,
            OriginGame::White2 => 22,
            OriginGame::X => 24,
            OriginGame::Y => 25,
            OriginGame::OmegaRuby => 27,
            OriginGame::AlphaSapphire => 26,
            OriginGame::Go => 34,
            OriginGame::Sun => 30,
            OriginGame::Moon => 31,
            OriginGame::UltraSun => 32,
            OriginGame::UltraMoon => 33,
            OriginGame::LetsGoPikachu => 42,
            OriginGame::LetsGoEevee => 43,
            OriginGame::Sword => 44,
            OriginGame::Shield => 45,
            OriginGame::Home => 46,
            OriginGame::LegendsArceus => 47,
            OriginGame::BrilliantDiamond => 48,
            OriginGame::ShiningPearl => 49,
            OriginGame::Scarlet => 50,
            OriginGame::Violet => 51,
        }
    }

    pub const fn game_name(&self) -> &'static str {
        match *self {
            Self::Red => "Red",
            Self::BlueGreen => "Blue/Green",
            Self::BlueJpn => "BlueJpn",
            Self::Yellow => "Yellow",
            Self::Gold => "Gold",
            Self::Silver => "Silver",
            Self::Crystal => "Crystal",
            Self::Ruby => "Ruby",
            Self::Sapphire => "Sapphire",
            Self::Emerald => "Emerald",
            Self::FireRed => "FireRed",
            Self::LeafGreen => "LeafGreen",
            Self::ColosseumXd => "Colosseum/XD",
            Self::Diamond => "Diamond",
            Self::Pearl => "Pearl",
            Self::Platinum => "Platinum",
            Self::HeartGold => "HeartGold",
            Self::SoulSilver => "SoulSilver",
            Self::BattleRevolution => "Battle Revolution",
            Self::Black => "Black",
            Self::White => "White",
            Self::Black2 => "Black 2",
            Self::White2 => "White 2",
            Self::X => "X",
            Self::Y => "Y",
            Self::OmegaRuby => "Omega Ruby",
            Self::AlphaSapphire => "Alpha Sapphire",
            Self::Go => "Go",
            Self::Sun => "Sun",
            Self::Moon => "Moon",
            Self::UltraSun => "Ultra Sun",
            Self::UltraMoon => "Ultra Moon",
            Self::LetsGoPikachu => "Let's Go Pikachu",
            Self::LetsGoEevee => "Lets Go Eevee",
            Self::Sword => "Sword",
            Self::Shield => "Shield",
            Self::Home => "Home",
            Self::LegendsArceus => "Legends Arceus",
            Self::BrilliantDiamond => "Brilliant Diamond",
            Self::ShiningPearl => "Shining Pearl",
            Self::Scarlet => "Scarlet",
            Self::Violet => "Violet",
        }
    }

    pub const fn from_u32(index: u32) -> Option<Self> {
        match index {
            35 => Some(OriginGame::Red),
            36 => Some(OriginGame::BlueGreen),
            37 => Some(OriginGame::BlueJpn),
            38 => Some(OriginGame::Yellow),
            39 => Some(OriginGame::Gold),
            40 => Some(OriginGame::Silver),
            41 => Some(OriginGame::Crystal),
            2 => Some(OriginGame::Ruby),
            1 => Some(OriginGame::Sapphire),
            3 => Some(OriginGame::Emerald),
            4 => Some(OriginGame::FireRed),
            5 => Some(OriginGame::LeafGreen),
            15 => Some(OriginGame::ColosseumXd),
            10 => Some(OriginGame::Diamond),
            11 => Some(OriginGame::Pearl),
            12 => Some(OriginGame::Platinum),
            7 => Some(OriginGame::HeartGold),
            8 => Some(OriginGame::SoulSilver),
            16 => Some(OriginGame::BattleRevolution),
            21 => Some(OriginGame::Black),
            20 => Some(OriginGame::White),
            23 => Some(OriginGame::Black2),
            22 => Some(OriginGame::White2),
            24 => Some(OriginGame::X),
            25 => Some(OriginGame::Y),
            27 => Some(OriginGame::OmegaRuby),
            26 => Some(OriginGame::AlphaSapphire),
            34 => Some(OriginGame::Go),
            30 => Some(OriginGame::Sun),
            31 => Some(OriginGame::Moon),
            32 => Some(OriginGame::UltraSun),
            33 => Some(OriginGame::UltraMoon),
            42 => Some(OriginGame::LetsGoPikachu),
            43 => Some(OriginGame::LetsGoEevee),
            44 => Some(OriginGame::Sword),
            45 => Some(OriginGame::Shield),
            46 => Some(OriginGame::Home),
            47 => Some(OriginGame::LegendsArceus),
            48 => Some(OriginGame::BrilliantDiamond),
            49 => Some(OriginGame::ShiningPearl),
            50 => Some(OriginGame::Scarlet),
            51 => Some(OriginGame::Violet),
            _ => None,
        }
    }

    pub const fn generation(&self) -> Generation {
        match *self {
            Self::Red | Self::BlueGreen | Self::BlueJpn | Self::Yellow => Generation::G1,
            Self::Gold | Self::Silver | Self::Crystal => Generation::G2,
            Self::Ruby
            | Self::Sapphire
            | Self::Emerald
            | Self::FireRed
            | Self::LeafGreen
            | Self::ColosseumXd => Generation::G3,
            Self::Diamond
            | Self::Pearl
            | Self::Platinum
            | Self::HeartGold
            | Self::SoulSilver
            | Self::BattleRevolution => Generation::G4,
            Self::Black | Self::White | Self::Black2 | Self::White2 => Generation::G5,
            Self::X | Self::Y | Self::OmegaRuby | Self::AlphaSapphire => Generation::G6,
            Self::Sun
            | Self::Moon
            | Self::UltraSun
            | Self::UltraMoon
            | Self::LetsGoPikachu
            | Self::LetsGoEevee => Generation::G7,
            Self::Sword
            | Self::Shield
            | Self::LegendsArceus
            | Self::BrilliantDiamond
            | Self::ShiningPearl => Generation::G8,
            Self::Scarlet | Self::Violet => Generation::G9,
            Self::Go | Self::Home => Generation::None,
        }
    }

    pub const fn region(&self) -> Option<Region> {
        match *self {
            Self::Red
            | Self::BlueGreen
            | Self::BlueJpn
            | Self::Yellow
            | Self::FireRed
            | Self::LeafGreen
            | Self::LetsGoPikachu
            | Self::LetsGoEevee => Some(Region::Kanto),
            Self::Gold | Self::Silver | Self::Crystal | Self::HeartGold | Self::SoulSilver => {
                Some(Region::Johto)
            }
            Self::Ruby | Self::Sapphire | Self::Emerald | Self::OmegaRuby | Self::AlphaSapphire => {
                Some(Region::Hoenn)
            }
            Self::ColosseumXd => Some(Region::Orre),
            Self::Diamond
            | Self::Pearl
            | Self::Platinum
            | Self::BrilliantDiamond
            | Self::ShiningPearl => Some(Region::Sinnoh),
            Self::Black | Self::White | Self::Black2 | Self::White2 => Some(Region::Unova),
            Self::X | Self::Y => Some(Region::Kalos),
            Self::Sun | Self::Moon | Self::UltraSun | Self::UltraMoon => Some(Region::Alola),
            Self::Sword | Self::Shield => Some(Region::Galar),
            Self::LegendsArceus => Some(Region::Hisui),
            Self::Scarlet | Self::Violet => Some(Region::Paldea),
            Self::BattleRevolution | Self::Go | Self::Home => None,
        }
    }

    pub const fn gamecube_index(&self) -> Option<u8> {
        match *self {
            Self::FireRed => Some(1),
            Self::LeafGreen => Some(2),
            Self::Sapphire => Some(8),
            Self::Ruby => Some(9),
            Self::Emerald => Some(10),
            Self::ColosseumXd => Some(11),
            Self::BattleRevolution => Some(12),
            _ => None,
        }
    }

    pub const fn mark(&self) -> Option<OriginMark> {
        match *self {
            Self::Red | Self::BlueGreen | Self::BlueJpn | Self::Yellow => Some(OriginMark::GameBoy),
            Self::Gold | Self::Silver | Self::Crystal => Some(OriginMark::GameBoy),
            Self::X | Self::Y => Some(OriginMark::Pentagon),
            Self::OmegaRuby | Self::AlphaSapphire => Some(OriginMark::Pentagon),
            Self::Sun | Self::Moon | Self::UltraSun | Self::UltraMoon => Some(OriginMark::Alola),
            Self::LetsGoPikachu | Self::LetsGoEevee => Some(OriginMark::LetsGo),
            Self::Sword | Self::Shield => Some(OriginMark::Galar),
            Self::LegendsArceus => Some(OriginMark::Hisui),
            Self::BrilliantDiamond | Self::ShiningPearl => Some(OriginMark::Bdsp),
            Self::Scarlet | Self::Violet => Some(OriginMark::Tera),
            Self::Go => Some(OriginMark::Go),
            _ => None,
        }
    }

    pub const fn logo(&self) -> &'static str {
        match *self {
            Self::Red => "Red",
            Self::BlueGreen => "BlueGreen",
            Self::BlueJpn => "BlueJpn",
            Self::Yellow => "Yellow",
            Self::Gold => "Gold",
            Self::Silver => "Silver",
            Self::Crystal => "Crystal",
            Self::Ruby => "Ruby",
            Self::Sapphire => "Sapphire",
            Self::Emerald => "Emerald",
            Self::FireRed => "FireRed",
            Self::LeafGreen => "LeafGreen",
            Self::ColosseumXd => "ColosseumXd",
            Self::Diamond => "Diamond",
            Self::Pearl => "Pearl",
            Self::Platinum => "Platinum",
            Self::HeartGold => "HeartGold",
            Self::SoulSilver => "SoulSilver",
            Self::BattleRevolution => "BattleRevolution",
            Self::Black => "Black",
            Self::White => "White",
            Self::Black2 => "Black2",
            Self::White2 => "White2",
            Self::X => "X",
            Self::Y => "Y",
            Self::OmegaRuby => "OmegaRuby",
            Self::AlphaSapphire => "AlphaSapphire",
            Self::Go => "Go",
            Self::Sun => "Sun",
            Self::Moon => "Moon",
            Self::UltraSun => "UltraSun",
            Self::UltraMoon => "UltraMoon",
            Self::LetsGoPikachu => "LetsGoPikachu",
            Self::LetsGoEevee => "LetsGoEevee",
            Self::Sword => "Sword",
            Self::Shield => "Shield",
            Self::Home => "Home",
            Self::LegendsArceus => "LegendsArceus",
            Self::BrilliantDiamond => "BrilliantDiamond",
            Self::ShiningPearl => "ShiningPearl",
            Self::Scarlet => "Scarlet",
            Self::Violet => "Violet",
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
struct OriginGameMetadata(OriginGame);

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl OriginGameMetadata {
    #[cfg(feature = "wasm")]
    #[wasm_bindgen(js_name = "fromIndex")]
    pub fn from_index(val: u32) -> Option<OriginGameMetadata> {
        OriginGame::from_u32(val).map(OriginGameMetadata)
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(getter = "gameName")]
    pub fn game_name(&self) -> String {
        self.0.game_name().to_owned()
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(getter)]
    pub fn index(&self) -> u32 {
        self.0.to_u32()
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(getter)]
    pub fn generation(&self) -> u8 {
        self.0.generation() as u8
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(getter)]
    pub fn region(&self) -> Option<String> {
        self.0.region().map(|r| r.to_string())
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(getter = "gamecubeIndex")]
    pub fn gamecube_index(&self) -> Option<u8> {
        self.0.gamecube_index()
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(getter)]
    pub fn mark(&self) -> Option<String> {
        self.0.mark().map(|m| m.to_string())
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(getter)]
    pub fn logo(&self) -> String {
        self.0.logo().to_owned()
    }
}

pub enum OriginMark {
    GameBoy,
    Pentagon,
    Alola,
    LetsGo,
    Galar,
    Hisui,
    Bdsp,
    Tera,
    Go,
}

impl std::fmt::Display for OriginMark {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            OriginMark::GameBoy => "GameBoy",
            OriginMark::Pentagon => "Pentagon",
            OriginMark::Alola => "Alola",
            OriginMark::LetsGo => "LetsGo",
            OriginMark::Galar => "Galar",
            OriginMark::Hisui => "Hisui",
            OriginMark::Bdsp => "Bdsp",
            OriginMark::Tera => "Tera",
            OriginMark::Go => "Go",
        };
        write!(f, "{s}")
    }
}
