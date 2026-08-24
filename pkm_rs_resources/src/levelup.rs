use crate::moves::MoveIndex;

use pkm_rs_types::pkl_file::PklFileData;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone, Copy)]
pub struct LevelupLearnsetFileReader(PklFileData<'static>);

impl LevelupLearnsetFileReader {
    pub const fn from_pkl(pkl_data: PklFileData<'static>) -> Self {
        Self(pkl_data)
    }

    pub const fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self(PklFileData::from_bytes(bytes))
    }

    pub fn learnset_at_index(&self, game_index: u16) -> Option<LevelupLearnsetReader> {
        if game_index as usize >= self.0.length() {
            return None;
        }

        Some(LevelupLearnsetReader(self.0.get_entry(game_index as usize)))
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LevelupLearnsetMove {
    pub(crate) move_id: MoveIndex,
    pub(crate) level: u8,
}

impl LevelupLearnsetMove {
    pub fn move_id_raw(&self) -> u16 {
        self.move_id
            .to_raw()
            .expect("levelup learnset move has a valid id")
    }

    pub const fn get_level(&self) -> u8 {
        self.level
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl LevelupLearnsetMove {
    #[wasm_bindgen(getter = "moveId")]
    pub fn move_id_wasm(&self) -> u16 {
        self.move_id_raw()
    }

    #[wasm_bindgen(getter = "level")]
    pub fn level_wasm(&self) -> u8 {
        self.level
    }
}

#[derive(Debug, Clone, Copy)]
pub struct LevelupLearnsetReader(&'static [u8]);

impl LevelupLearnsetReader {
    pub const fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self(bytes)
    }

    pub const fn move_count(&self) -> usize {
        self.0.len() / 3 // 2 bytes per move, 1 byte per level
    }

    fn get_move(&self, index: usize) -> Option<LevelupLearnsetMove> {
        if index >= self.move_count() {
            return None;
        }

        let moves_span_size = (self.move_count()) * 2;
        let move_indices_raw = u8_slice_to_u16_le(&self.0[..moves_span_size]);
        let move_id = MoveIndex::from_u16(move_indices_raw[index]);

        let levels = &self.0[moves_span_size..];
        let level = levels[index];

        Some(LevelupLearnsetMove { move_id, level })
    }

    pub fn move_data_by_id(&self, move_id: u16) -> Option<LevelupLearnsetMove> {
        (0..self.move_count())
            .filter_map(|index| self.get_move(index))
            .find(|m| m.move_id_raw() == move_id)
    }

    pub fn all_moves(&self) -> Vec<LevelupLearnsetMove> {
        (0..self.move_count())
            .filter_map(|index| self.get_move(index))
            .collect()
    }
}

fn u8_slice_to_u16_le(slice: &[u8]) -> Vec<u16> {
    slice
        .as_chunks::<2>()
        .0
        .iter()
        .map(|chunk| u16::from_le_bytes([chunk[0], chunk[1]]))
        .collect()
}

#[macro_export]
macro_rules! learnset_pkl {
    ($path:expr) => {
        LearnsetFileReader::from_pkl_bytes(include_bytes!($path))
    };
}

#[macro_export]
macro_rules! include_pkl {
    ($path:expr) => {
        PklFileData::from_bytes(include_bytes!($path))
    };
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LearnsetCondition {
    LevelUp(u8),
    Evolution,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LearnsetMove {
    pub(crate) move_id: MoveIndex,
    pub(crate) condition: LearnsetCondition,
}

impl LearnsetMove {
    pub const fn get_condition(&self) -> LearnsetCondition {
        self.condition
    }

    pub fn move_id_raw(&self) -> u16 {
        self.move_id.to_raw().expect("learnset move has a valid id")
    }
}

impl From<LevelupLearnsetMove> for LearnsetMove {
    fn from(value: LevelupLearnsetMove) -> Self {
        Self {
            move_id: value.move_id,
            condition: match value.level {
                0 => LearnsetCondition::Evolution,
                level => LearnsetCondition::LevelUp(level),
            },
        }
    }
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
        Self {
            move_id: value.move_id.into(),
            is_evolution: matches!(value.condition, LearnsetCondition::Evolution),
            level: match value.condition {
                LearnsetCondition::LevelUp(level) => Some(level),
                LearnsetCondition::Evolution => None,
            },
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct LearnsetFileReader(LevelupLearnsetFileReader);

impl LearnsetFileReader {
    pub const fn from_pkl(pkl_data: PklFileData<'static>) -> Self {
        Self(LevelupLearnsetFileReader::from_pkl(pkl_data))
    }

    pub const fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self(LevelupLearnsetFileReader::from_pkl_bytes(bytes))
    }

    pub fn learnset_at_index(&self, game_index: u16) -> Option<LearnsetReader> {
        self.0.learnset_at_index(game_index).map(LearnsetReader)
    }
}

#[derive(Debug, Clone, Copy)]
pub struct LearnsetReader(LevelupLearnsetReader);

impl LearnsetReader {
    pub const fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self(LevelupLearnsetReader::from_pkl_bytes(bytes))
    }

    pub const fn move_count(&self) -> usize {
        self.0.move_count()
    }

    pub fn move_data_by_id(&self, move_id: u16) -> Option<LearnsetMove> {
        self.0.move_data_by_id(move_id).map(LearnsetMove::from)
    }

    pub fn all_moves(&self) -> Vec<LearnsetMove> {
        self.0
            .all_moves()
            .into_iter()
            .map(LearnsetMove::from)
            .collect()
    }
}
