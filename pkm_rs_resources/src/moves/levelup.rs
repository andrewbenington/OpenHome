use crate::moves::MoveSlot;
#[cfg(feature = "wasm")]
use pkm_rs_types::OriginMark;
use pkm_rs_types::{OriginGame, pkl_file::PklFileData};

mod sv;
mod za;

pub use sv::*;
pub use za::*;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LearnsetCondition {
    LevelUp(u8),
    Evolution,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LearnsetMove {
    pub(crate) move_id: MoveSlot,
    pub(crate) condition: LearnsetCondition,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Default)]
pub struct Learnset {
    pub(crate) moves: Vec<LearnsetMove>,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct LearnsetMoveJs {
    pub move_id: u16,
    pub is_evolution: bool,
    pub level: Option<u8>,
}

#[cfg(feature = "wasm")]
impl From<LearnsetMove> for LearnsetMoveJs {
    fn from(value: LearnsetMove) -> Self {
        match value.condition {
            LearnsetCondition::LevelUp(level) => Self {
                move_id: value.move_id.into(),
                is_evolution: false,
                level: Some(level),
            },
            LearnsetCondition::Evolution => Self {
                move_id: value.move_id.into(),
                is_evolution: true,
                level: None,
            },
        }
    }
}

impl Learnset {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let length = bytes.len();
        if length == 0 {
            return Self::default();
        }

        let levelup_move_count = length / 3; // 2 bytes per move, 1 byte per level
        let moves_span_size = (levelup_move_count) * 2;
        let move_indices_raw = u8_slice_to_u16_le(&bytes[..moves_span_size]);
        let levels = &bytes[moves_span_size..];

        // Implementation for parsing PKL data into learnset moves
        Self {
            moves: move_indices_raw
                .into_iter()
                .zip(levels)
                .map(|(move_id_raw, level)| {
                    if *level == 0 {
                        LearnsetMove {
                            move_id: MoveSlot::from_u16(move_id_raw),
                            condition: LearnsetCondition::Evolution,
                        }
                    } else {
                        LearnsetMove {
                            move_id: MoveSlot::from_u16(move_id_raw),
                            condition: LearnsetCondition::LevelUp(*level),
                        }
                    }
                })
                .collect(),
        }
    }

    pub fn all_from_pkl_bytes(file_data: &PklFileData) -> Vec<Self> {
        let mut all_learnsets = vec![Self::default()];
        for i in 1..file_data.length() {
            all_learnsets.push(Self::from_pkl_bytes(file_data.get_entry(i)));
        }

        all_learnsets
    }
}

fn u8_slice_to_u16_le(slice: &[u8]) -> Vec<u16> {
    slice
        .chunks_exact(2)
        .map(|chunk| u16::from_le_bytes([chunk[0], chunk[1]]))
        .collect()
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LevelupLearnsetSource {
    Gen1,
    Gen2,
    Gen3,
    Gen4,
    Gen5,
    Gen6,
    Alola,
    LetsGo,
    SwordShield,
    BrilliantDiamondShiningPearl,
    LegendsArceus,
    ScarletViolet,
    LegendsZa,
}

impl LevelupLearnsetSource {
    pub const fn first_origin_game(self) -> OriginGame {
        match self {
            LevelupLearnsetSource::Gen1 => OriginGame::Red,
            LevelupLearnsetSource::Gen2 => OriginGame::Gold,
            LevelupLearnsetSource::Gen3 => OriginGame::Ruby,
            LevelupLearnsetSource::Gen4 => OriginGame::Diamond,
            LevelupLearnsetSource::Gen5 => OriginGame::Black,
            LevelupLearnsetSource::Gen6 => OriginGame::X,
            LevelupLearnsetSource::Alola => OriginGame::Sun,
            LevelupLearnsetSource::LetsGo => OriginGame::LetsGoPikachu,
            LevelupLearnsetSource::SwordShield => OriginGame::Sword,
            LevelupLearnsetSource::BrilliantDiamondShiningPearl => OriginGame::BrilliantDiamond,
            LevelupLearnsetSource::LegendsArceus => OriginGame::LegendsArceus,
            LevelupLearnsetSource::ScarletViolet => OriginGame::Scarlet,
            LevelupLearnsetSource::LegendsZa => OriginGame::LegendsZa,
        }
    }

    pub const fn display(self) -> &'static str {
        match self {
            Self::Gen1 => "Generation 1",
            Self::Gen2 => "Generation 2",
            Self::Gen3 => "Generation 3",
            Self::Gen4 => "Generation 4",
            Self::Gen5 => "Generation 5",
            Self::Gen6 => "Generation 6",
            Self::Alola => "(Ultra) Sun/Moon",
            Self::LetsGo => "Let's Go Pikachu/Eevee",
            Self::SwordShield => "Sword/Shield",
            Self::BrilliantDiamondShiningPearl => "Brilliant Diamond/Shining Pearl",
            Self::LegendsArceus => "Legends: Arceus",
            Self::ScarletViolet => "Scarlet/Violet",
            Self::LegendsZa => "Legends: Z-A",
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct LevelupLearnsetSources;

#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
#[cfg(feature = "wasm")]
impl LevelupLearnsetSources {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getOriginMark"))]
    pub fn get_origin_mark(value: LevelupLearnsetSource) -> Option<OriginMark> {
        value.first_origin_game().mark()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen)]
    pub fn display(value: LevelupLearnsetSource) -> String {
        value.display().to_owned()
    }
}

pub const LEVELUP_LEARNSET_SOURCES: [LevelupLearnsetSource; 13] = [
    LevelupLearnsetSource::Gen1,
    LevelupLearnsetSource::Gen2,
    LevelupLearnsetSource::Gen3,
    LevelupLearnsetSource::Gen4,
    LevelupLearnsetSource::Gen5,
    LevelupLearnsetSource::Gen6,
    LevelupLearnsetSource::Alola,
    LevelupLearnsetSource::LetsGo,
    LevelupLearnsetSource::SwordShield,
    LevelupLearnsetSource::BrilliantDiamondShiningPearl,
    LevelupLearnsetSource::LegendsArceus,
    LevelupLearnsetSource::ScarletViolet,
    LevelupLearnsetSource::LegendsZa,
];

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "allLevelupLearnsetSources"))]
pub fn all_levelup_learnset_sources() -> Vec<LevelupLearnsetSource> {
    LEVELUP_LEARNSET_SOURCES.to_vec()
}
