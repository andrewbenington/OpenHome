use serde::Serialize;
use strum_macros::{Display, EnumString};
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub enum ColosseumOrXd {
    Colosseum,
    XD,
    Indeterminate,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, PartialEq, Eq, PartialOrd, Ord, Clone, Copy, Serialize)]
#[repr(u8)]
pub enum OriginGame {
    #[default]
    Invalid0,
    Sapphire,
    Ruby,
    Emerald,
    FireRed,
    LeafGreen,
    Invalid6,
    HeartGold,
    SoulSilver,
    Invalid9,
    Diamond,
    Pearl,
    Platinum,
    Invalid13,
    Invalid14,
    ColosseumXd,
    BattleRevolution,
    Invalid17,
    Invalid18,
    Invalid19,
    White,
    Black,
    White2,
    Black2,
    X,
    Y,
    AlphaSapphire,
    OmegaRuby,
    Invalid28,
    Invalid29,
    Sun,
    Moon,
    UltraSun,
    UltraMoon,
    Go,
    Red,
    BlueGreen,
    BlueJpn,
    Yellow,
    Gold,
    Silver,
    Crystal,
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
    LegendsZa,
}

impl OriginGame {
    pub fn try_from_u8(value: u8) -> Option<Self> {
        let origin = Self::from(value);
        if origin == Self::Invalid0 {
            None
        } else {
            Some(origin)
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
            Self::LetsGoEevee => "Let's Go Eevee",
            Self::Sword => "Sword",
            Self::Shield => "Shield",
            Self::Home => "Home",
            Self::LegendsArceus => "Legends: Arceus",
            Self::BrilliantDiamond => "Brilliant Diamond",
            Self::ShiningPearl => "Shining Pearl",
            Self::Scarlet => "Scarlet",
            Self::Violet => "Violet",
            Self::LegendsZa => "Legends: Z-A",
            Self::Invalid0 => "Invalid (0)",
            Self::Invalid6 => "Invalid (6)",
            Self::Invalid9 => "Invalid (9)",
            Self::Invalid13 => "Invalid (13)",
            Self::Invalid14 => "Invalid (14)",
            Self::Invalid17 => "Invalid (17)",
            Self::Invalid18 => "Invalid (18)",
            Self::Invalid19 => "Invalid (19)",
            Self::Invalid28 => "Invalid (28)",
            Self::Invalid29 => "Invalid (29)",
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
            Self::Scarlet | Self::Violet | Self::LegendsZa => Generation::G9,
            Self::Go | Self::Home => Generation::None,
            _ => Generation::None,
        }
    }

    pub const fn region(&self) -> Option<GameSetting> {
        match *self {
            Self::Red
            | Self::BlueGreen
            | Self::BlueJpn
            | Self::Yellow
            | Self::FireRed
            | Self::LeafGreen
            | Self::LetsGoPikachu
            | Self::LetsGoEevee => Some(GameSetting::Kanto),
            Self::Gold | Self::Silver | Self::Crystal | Self::HeartGold | Self::SoulSilver => {
                Some(GameSetting::Johto)
            }
            Self::Ruby | Self::Sapphire | Self::Emerald | Self::OmegaRuby | Self::AlphaSapphire => {
                Some(GameSetting::Hoenn)
            }
            Self::ColosseumXd => Some(GameSetting::Orre),
            Self::Diamond
            | Self::Pearl
            | Self::Platinum
            | Self::BrilliantDiamond
            | Self::ShiningPearl => Some(GameSetting::Sinnoh),
            Self::Black | Self::White | Self::Black2 | Self::White2 => Some(GameSetting::Unova),
            Self::X | Self::Y => Some(GameSetting::Kalos),
            Self::Sun | Self::Moon | Self::UltraSun | Self::UltraMoon => Some(GameSetting::Alola),
            Self::Sword | Self::Shield => Some(GameSetting::Galar),
            Self::LegendsArceus => Some(GameSetting::Hisui),
            Self::Scarlet | Self::Violet => Some(GameSetting::Paldea),
            Self::LegendsZa => Some(GameSetting::Lumiose),
            Self::Go => Some(GameSetting::PokemonGo),
            Self::BattleRevolution | Self::Home => None,
            _ => None,
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
            Self::LegendsZa => Some(OriginMark::Mega),
            Self::Go => Some(OriginMark::Go),
            _ => None,
        }
    }

    pub fn logo(&self) -> Option<String> {
        match *self {
            Self::Red => Some("Red".to_owned()),
            Self::BlueGreen => Some("BlueGreen".to_owned()),
            Self::BlueJpn => Some("BlueJpn".to_owned()),
            Self::Yellow => Some("Yellow".to_owned()),
            Self::Gold => Some("Gold".to_owned()),
            Self::Silver => Some("Silver".to_owned()),
            Self::Crystal => Some("Crystal".to_owned()),
            Self::Ruby => Some("Ruby".to_owned()),
            Self::Sapphire => Some("Sapphire".to_owned()),
            Self::Emerald => Some("Emerald".to_owned()),
            Self::FireRed => Some("FireRed".to_owned()),
            Self::LeafGreen => Some("LeafGreen".to_owned()),
            Self::ColosseumXd => Some("ColosseumXd".to_owned()),
            Self::Diamond => Some("Diamond".to_owned()),
            Self::Pearl => Some("Pearl".to_owned()),
            Self::Platinum => Some("Platinum".to_owned()),
            Self::HeartGold => Some("HeartGold".to_owned()),
            Self::SoulSilver => Some("SoulSilver".to_owned()),
            Self::BattleRevolution => Some("BattleRevolution".to_owned()),
            Self::Black => Some("Black".to_owned()),
            Self::White => Some("White".to_owned()),
            Self::Black2 => Some("Black2".to_owned()),
            Self::White2 => Some("White2".to_owned()),
            Self::X => Some("X".to_owned()),
            Self::Y => Some("Y".to_owned()),
            Self::OmegaRuby => Some("OmegaRuby".to_owned()),
            Self::AlphaSapphire => Some("AlphaSapphire".to_owned()),
            Self::Go => Some("Go".to_owned()),
            Self::Sun => Some("Sun".to_owned()),
            Self::Moon => Some("Moon".to_owned()),
            Self::UltraSun => Some("UltraSun".to_owned()),
            Self::UltraMoon => Some("UltraMoon".to_owned()),
            Self::LetsGoPikachu => Some("LetsGoPikachu".to_owned()),
            Self::LetsGoEevee => Some("LetsGoEevee".to_owned()),
            Self::Sword => Some("Sword".to_owned()),
            Self::Shield => Some("Shield".to_owned()),
            Self::Home => Some("Home".to_owned()),
            Self::LegendsArceus => Some("LegendsArceus".to_owned()),
            Self::BrilliantDiamond => Some("BrilliantDiamond".to_owned()),
            Self::ShiningPearl => Some("ShiningPearl".to_owned()),
            Self::Scarlet => Some("Scarlet".to_owned()),
            Self::Violet => Some("Violet".to_owned()),
            Self::LegendsZa => Some("LegendsZa".to_owned()),
            _ => None,
        }
    }

    // source: https://bulbapedia.bulbagarden.net/wiki/Help:Color_templates
    pub const fn color(&self) -> &'static str {
        match *self {
            Self::Red => "#DA3914",
            Self::BlueGreen | Self::BlueJpn => "#2E50D8",
            Self::Yellow => "#FFD733",
            Self::Gold => "#DAA520",
            Self::Silver => "#C0C0C0",
            Self::Crystal => "#3D51A7",
            Self::Ruby => "#CD2236",
            Self::Sapphire => "#3D51A7",
            Self::Emerald => "#50C878",
            Self::FireRed => "#F15C01",
            Self::LeafGreen => "#9FDC00",
            Self::ColosseumXd => "#604E82",
            Self::Diamond => "#90BEED",
            Self::Pearl => "#DD7CB1",
            Self::Platinum => "#A0A08D",
            Self::HeartGold => "#E8B502",
            Self::SoulSilver => "#AAB9CF",
            Self::BattleRevolution => "#DCA202",
            Self::Black => "#444444",
            Self::White => "#E1E1E1",
            Self::Black2 => "#303E51",
            Self::White2 => "#EBC5C3",
            Self::X => "#025DA6",
            Self::Y => "#EA1A3E",
            Self::OmegaRuby => "#AB2813",
            Self::AlphaSapphire => "#26649C",
            Self::Go => "#66C49F",
            Self::Sun => "#F1912B",
            Self::Moon => "#5599CA",
            Self::UltraSun => "#E95B2B",
            Self::UltraMoon => "#226DB5",
            Self::LetsGoPikachu => "#F5DA26",
            Self::LetsGoEevee => "#D4924B",
            Self::Sword => "#006998",
            Self::Shield => "#7C0033",
            Self::Home => "#009F7A",
            Self::LegendsArceus => "#36597B",
            Self::BrilliantDiamond => "#44BAE5",
            Self::ShiningPearl => "#DA7D99",
            Self::Scarlet => "#F34134",
            Self::Violet => "#8334B7",
            Self::LegendsZa => "#31CA56",
            _ => "#666666",
        }
    }

    pub const fn all_valid() -> [OriginGame; 41] {
        [
            Self::Sapphire,
            Self::Ruby,
            Self::Emerald,
            Self::FireRed,
            Self::LeafGreen,
            Self::HeartGold,
            Self::SoulSilver,
            Self::Diamond,
            Self::Pearl,
            Self::Platinum,
            Self::ColosseumXd,
            Self::White,
            Self::Black,
            Self::White2,
            Self::Black2,
            Self::X,
            Self::Y,
            Self::AlphaSapphire,
            Self::OmegaRuby,
            Self::Sun,
            Self::Moon,
            Self::UltraSun,
            Self::UltraMoon,
            Self::Go,
            Self::Red,
            Self::BlueGreen,
            Self::BlueJpn,
            Self::Yellow,
            Self::Gold,
            Self::Silver,
            Self::Crystal,
            Self::LetsGoPikachu,
            Self::LetsGoEevee,
            Self::Sword,
            Self::Shield,
            Self::LegendsArceus,
            Self::BrilliantDiamond,
            Self::ShiningPearl,
            Self::Scarlet,
            Self::Violet,
            Self::LegendsZa,
        ]
    }

    pub fn is_gameboy(self) -> bool {
        self >= Self::Red && self <= Self::Crystal
    }

    pub fn is_gba(self) -> bool {
        self <= Self::LeafGreen
    }

    pub fn is_ds(self) -> bool {
        (self >= Self::HeartGold && self <= Self::Platinum)
            || (self >= Self::White && self <= Self::Black2)
    }

    pub fn is_3ds(self) -> bool {
        self >= Self::X && self <= Self::UltraMoon
    }

    pub fn is_lets_go(self) -> bool {
        self == Self::LetsGoEevee || self == Self::LetsGoPikachu
    }

    pub fn is_swsh(self) -> bool {
        self == Self::Sword || self == Self::Shield
    }

    pub fn is_bdsp(self) -> bool {
        self == Self::BrilliantDiamond || self == Self::ShiningPearl
    }

    pub fn is_scarlet_violet(self) -> bool {
        self == Self::Scarlet || self == Self::Violet
    }
}

impl From<u8> for OriginGame {
    fn from(value: u8) -> Self {
        match value {
            0 => OriginGame::Invalid0,
            1 => OriginGame::Sapphire,
            2 => OriginGame::Ruby,
            3 => OriginGame::Emerald,
            4 => OriginGame::FireRed,
            5 => OriginGame::LeafGreen,
            6 => OriginGame::Invalid6,
            7 => OriginGame::HeartGold,
            8 => OriginGame::SoulSilver,
            9 => OriginGame::Invalid9,
            10 => OriginGame::Diamond,
            11 => OriginGame::Pearl,
            12 => OriginGame::Platinum,
            13 => OriginGame::Invalid13,
            14 => OriginGame::Invalid14,
            15 => OriginGame::ColosseumXd,
            16 => OriginGame::BattleRevolution,
            17 => OriginGame::Invalid17,
            18 => OriginGame::Invalid18,
            19 => OriginGame::Invalid19,
            20 => OriginGame::White,
            21 => OriginGame::Black,
            22 => OriginGame::White2,
            23 => OriginGame::Black2,
            24 => OriginGame::X,
            25 => OriginGame::Y,
            26 => OriginGame::AlphaSapphire,
            27 => OriginGame::OmegaRuby,
            28 => OriginGame::Invalid28,
            29 => OriginGame::Invalid29,
            30 => OriginGame::Sun,
            31 => OriginGame::Moon,
            32 => OriginGame::UltraSun,
            33 => OriginGame::UltraMoon,
            34 => OriginGame::Go,
            35 => OriginGame::Red,
            36 => OriginGame::BlueGreen,
            37 => OriginGame::BlueJpn,
            38 => OriginGame::Yellow,
            39 => OriginGame::Gold,
            40 => OriginGame::Silver,
            41 => OriginGame::Crystal,
            42 => OriginGame::LetsGoPikachu,
            43 => OriginGame::LetsGoEevee,
            44 => OriginGame::Sword,
            45 => OriginGame::Shield,
            46 => OriginGame::Home,
            47 => OriginGame::LegendsArceus,
            48 => OriginGame::BrilliantDiamond,
            49 => OriginGame::ShiningPearl,
            50 => OriginGame::Scarlet,
            51 => OriginGame::Violet,
            52 => OriginGame::LegendsZa,
            _ => OriginGame::Invalid0,
        }
    }
}
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct OriginGames;

#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
#[cfg(feature = "wasm")]
impl OriginGames {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "gameName"))]
    pub fn game_name(value: u8) -> String {
        OriginGame::from(value).game_name().to_owned()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen)]
    pub fn generation(value: u8) -> Generation {
        OriginGame::from(value).generation()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen)]
    pub fn region(value: u8) -> Option<GameSetting> {
        OriginGame::from(value).region()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "regionName"))]
    pub fn region_name(value: u8) -> Option<String> {
        OriginGame::from(value).region().map(|r| r.to_string())
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "gamecubeIndex"))]
    pub fn gamecube_index(value: u8) -> Option<u8> {
        OriginGame::from(value).gamecube_index()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "markPath"))]
    pub fn mark_path(value: u8) -> Option<String> {
        OriginGame::from(value)
            .mark()
            .as_ref()
            .map(OriginMark::to_string)
            .map(|filename| format!("/origin_marks/{filename}.png"))
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen)]
    pub fn color(value: u8) -> String {
        OriginGame::from(value).color().to_owned()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "logoPath"))]
    pub fn logo_path(value: u8) -> Option<String> {
        OriginGame::from(value)
            .logo()
            .map(|filename| format!("/logos/{filename}.png"))
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getMetadata"))]
    pub fn get_metadata(value: u8) -> OriginGameWithData {
        OriginGameWithData::new(OriginGame::from(value))
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "allMetadata"))]
    pub fn all_metadata() -> Vec<OriginGameWithData> {
        OriginGame::all_valid()
            .map(OriginGameWithData::new)
            .to_vec()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "isGameboy"))]
    pub fn is_gameboy(value: u8) -> bool {
        OriginGame::from(value).is_gameboy()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "isGba"))]
    pub fn is_gba(value: u8) -> bool {
        OriginGame::from(value).is_gba()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "isLetsGo"))]
    pub fn is_lets_go(value: u8) -> bool {
        OriginGame::from(value).is_lets_go()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "isBdsp"))]
    pub fn is_bdsp(value: u8) -> bool {
        OriginGame::from(value).is_bdsp()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "isScarletViolet"))]
    pub fn is_scarlet_violet(value: u8) -> bool {
        OriginGame::from(value).is_scarlet_violet()
    }
}

pub fn plugin_color(plugin_identifier: &str) -> &'static str {
    match plugin_identifier {
        "unbound" => "#C127FE",
        "radical_red" => "#660000",
        _ => "#666666",
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getPluginColor"))]
pub fn plugin_color_js(plugin_identifier: &str) -> String {
    plugin_color(plugin_identifier).to_owned()
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Serialize, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Generation {
    None,
    G1,
    G2,
    G3,
    G4,
    G5,
    G6,
    G7,
    G8,
    G9,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, EnumString, Display, Serialize, Clone, Copy, PartialEq, Eq)]
pub enum GameSetting {
    Kanto,
    Johto,
    Hoenn,
    Sinnoh,
    Unova,
    Kalos,
    Alola,
    Galar,
    Hisui,
    Paldea,
    Lumiose,

    Orre,
    PokemonGo,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone)]
#[cfg(feature = "wasm")]
pub struct OriginGameWithData {
    origin: OriginGame,
    name: String,
    mark: Option<OriginMark>,
    generation: Generation,
}

#[cfg(feature = "wasm")]
impl OriginGameWithData {
    pub fn new(origin: OriginGame) -> Self {
        Self {
            origin,
            name: origin.game_name().to_owned(),
            mark: origin.mark(),
            generation: origin.generation(),
        }
    }
}

#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
#[cfg(feature = "wasm")]
impl OriginGameWithData {
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn game(&self) -> OriginGame {
        self.origin
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn name(&self) -> String {
        self.name.to_string()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn mark(&self) -> Option<String> {
        self.mark.map(|m| m.to_string())
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn generation(&self) -> Generation {
        self.generation
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum OriginMark {
    GameBoy,
    Pentagon,
    Alola,
    LetsGo,
    Galar,
    Hisui,
    Bdsp,
    Tera,
    Mega,
    Go,
}

impl std::fmt::Display for OriginMark {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            Self::GameBoy => "GameBoy",
            Self::Pentagon => "Pentagon",
            Self::Alola => "Alola",
            Self::LetsGo => "LetsGo",
            Self::Galar => "Galar",
            Self::Hisui => "Hisui",
            Self::Bdsp => "Bdsp",
            Self::Tera => "Tera",
            Self::Mega => "Mega",
            Self::Go => "Go",
        };
        write!(f, "{s}")
    }
}
