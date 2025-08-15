use serde::{Serialize, Serializer};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy)]
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
#[derive(Debug, PartialEq, Eq, Default, Clone, Copy)]
pub struct GameOfOriginIndex(u8);

impl GameOfOriginIndex {
    pub fn get_metadata(&self) -> Option<&'static GameOfOrigin> {
        GAME_OF_ORIGIN_DATA.get(self.0 as usize).copied().flatten()
    }

    pub const fn to_byte(self) -> u8 {
        self.0
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl GameOfOriginIndex {
    #[cfg(feature = "wasm")]
    #[wasm_bindgen(constructor)]
    pub fn new(val: u8) -> GameOfOriginIndex {
        GameOfOriginIndex(val)
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(getter)]
    pub fn index(self) -> u8 {
        self.0
    }
}

impl Serialize for GameOfOriginIndex {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let description = match self.get_metadata() {
            None => format!("invalid origin: {}", self.0),
            Some(metadata) => String::from(metadata.name),
        };
        serializer.serialize_str(&description)
    }
}

impl From<u8> for GameOfOriginIndex {
    fn from(value: u8) -> Self {
        Self(value)
    }
}

impl From<GameOfOriginIndex> for u8 {
    fn from(val: GameOfOriginIndex) -> Self {
        val.0
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy)]
pub struct GameOfOrigin {
    name: &'static str,
    mark: Option<&'static str>,
    region: Option<&'static str>,
    generation: Generation,
    logo: Option<&'static str>,
    index: usize,
    gamecube_index: Option<usize>,
}

pub static GAME_OF_ORIGIN_DATA: [Option<&'static GameOfOrigin>; 52] = [
    None,
    Some(&GameOfOrigin {
        name: "Sapphire",
        region: Some("Hoenn"),
        index: 1,
        generation: Generation::G3,
        gamecube_index: Some(8),
        mark: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Ruby",
        region: Some("Hoenn"),
        index: 2,
        generation: Generation::G3,
        gamecube_index: Some(9),
        mark: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Emerald",
        region: Some("Hoenn"),
        index: 3,
        generation: Generation::G3,
        gamecube_index: Some(10),
        mark: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "FireRed",
        region: Some("Kanto"),
        index: 4,
        generation: Generation::G3,
        gamecube_index: Some(1),
        mark: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "LeafGreen",
        region: Some("Kanto"),
        index: 5,
        generation: Generation::G3,
        gamecube_index: Some(2),
        mark: None,
        logo: None,
    }),
    None,
    Some(&GameOfOrigin {
        name: "HeartGold",
        region: Some("Johto"),
        index: 7,
        generation: Generation::G4,
        gamecube_index: None,
        mark: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "SoulSilver",
        region: Some("Johto"),
        index: 8,
        generation: Generation::G4,
        gamecube_index: None,
        mark: None,
        logo: None,
    }),
    None,
    Some(&GameOfOrigin {
        name: "Diamond",
        region: Some("Sinnoh"),
        index: 10,
        generation: Generation::G4,
        gamecube_index: None,
        mark: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Pearl",
        region: Some("Sinnoh"),
        index: 11,
        generation: Generation::G4,
        gamecube_index: None,
        mark: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Platinum",
        region: Some("Sinnoh"),
        index: 12,
        generation: Generation::G4,
        gamecube_index: None,
        mark: None,
        logo: None,
    }),
    None,
    None,
    Some(&GameOfOrigin {
        name: "Colosseum/XD",
        region: Some("Orre"),
        index: 15,
        generation: Generation::G3,
        gamecube_index: Some(11),
        mark: None,
        logo: None,
    }),
    None,
    None,
    None,
    None,
    Some(&GameOfOrigin {
        name: "White",
        region: Some("Unova"),
        index: 20,
        generation: Generation::G5,
        gamecube_index: None,
        mark: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Black",
        region: Some("Unova"),
        index: 21,
        generation: Generation::G5,
        gamecube_index: None,
        mark: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "White 2",
        region: Some("Unova"),
        index: 22,
        generation: Generation::G5,
        gamecube_index: None,
        mark: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Black 2",
        region: Some("Unova"),
        index: 23,
        generation: Generation::G5,
        gamecube_index: None,
        mark: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "X",
        region: Some("Kalos"),
        mark: Some("G6"),
        index: 24,
        generation: Generation::G6,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Y",
        region: Some("Kalos"),
        mark: Some("G6"),
        index: 25,
        generation: Generation::G6,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Alpha Sapphire",
        region: Some("Hoenn"),
        mark: Some("G6"),
        index: 26,
        generation: Generation::G6,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Omega Ruby",
        region: Some("Hoenn"),
        mark: Some("G6"),
        index: 27,
        generation: Generation::G6,
        gamecube_index: None,
        logo: None,
    }),
    None,
    None,
    Some(&GameOfOrigin {
        name: "Sun",
        region: Some("Alola"),
        mark: Some("Alola"),
        index: 30,
        generation: Generation::G7,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Moon",
        region: Some("Alola"),
        mark: Some("Alola"),
        index: 31,
        generation: Generation::G7,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Ultra Sun",
        region: Some("Alola"),
        mark: Some("Alola"),
        index: 32,
        generation: Generation::G7,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Ultra Moon",
        region: Some("Alola"),
        mark: Some("Alola"),
        index: 33,
        generation: Generation::G7,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "GO",
        mark: Some("GO"),
        index: 34,
        generation: Generation::None,
        region: None,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Red",
        region: Some("Kanto"),
        mark: Some("GB"),
        index: 35,
        generation: Generation::G1,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Blue/Green",
        region: Some("Kanto"),
        mark: Some("GB"),
        logo: Some("BlueGreen"),
        index: 36,
        generation: Generation::G1,
        gamecube_index: None,
    }),
    Some(&GameOfOrigin {
        name: "Blue (Japan)",
        region: Some("Kanto"),
        mark: Some("GB"),
        logo: Some("BlueJP"),
        index: 37,
        generation: Generation::G1,
        gamecube_index: None,
    }),
    Some(&GameOfOrigin {
        name: "Yellow",
        region: Some("Kanto"),
        mark: Some("GB"),
        index: 38,
        generation: Generation::G1,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Gold",
        region: Some("Johto"),
        mark: Some("GB"),
        index: 39,
        generation: Generation::G2,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Silver",
        region: Some("Johto"),
        mark: Some("GB"),
        index: 40,
        generation: Generation::G2,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Crystal",
        region: Some("Johto"),
        mark: Some("GB"),
        index: 41,
        generation: Generation::G2,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Let's Go, Pikachu!",
        region: Some("Kanto"),
        mark: Some("LGPE"),
        logo: Some("LetsGoPikachu"),
        index: 42,
        generation: Generation::G7,
        gamecube_index: None,
    }),
    Some(&GameOfOrigin {
        name: "Let's Go, Eevee!",
        region: Some("Kanto"),
        mark: Some("LGPE"),
        logo: Some("LetsGoEevee"),
        index: 43,
        generation: Generation::G7,
        gamecube_index: None,
    }),
    Some(&GameOfOrigin {
        name: "Sword",
        region: Some("Galar"),
        mark: Some("Galar"),
        index: 44,
        generation: Generation::G8,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Shield",
        region: Some("Galar"),
        mark: Some("Galar"),
        index: 45,
        generation: Generation::G8,
        gamecube_index: None,
        logo: None,
    }),
    None,
    Some(&GameOfOrigin {
        name: "Legends: Arceus",
        region: Some("Hisui"),
        mark: Some("LA"),
        logo: Some("LegendsArceus"),
        index: 47,
        generation: Generation::G8,
        gamecube_index: None,
    }),
    Some(&GameOfOrigin {
        name: "Brilliant Diamond",
        region: Some("Sinnoh"),
        mark: Some("BDSP"),
        index: 48,
        generation: Generation::G8,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Shining Pearl",
        region: Some("Sinnoh"),
        mark: Some("BDSP"),
        index: 49,
        generation: Generation::G8,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Scarlet",
        region: Some("Paldea"),
        mark: Some("Tera"),
        index: 50,
        generation: Generation::G9,
        gamecube_index: None,
        logo: None,
    }),
    Some(&GameOfOrigin {
        name: "Violet",
        region: Some("Paldea"),
        mark: Some("Tera"),
        index: 51,
        generation: Generation::G9,
        gamecube_index: None,
        logo: None,
    }),
];
