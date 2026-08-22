use crate::moves::MoveIndex;

use pkm_rs_types::pkl_file::PklFileData;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

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

#[derive(Debug, Clone, Copy)]
pub struct LearnsetFileReader(PklFileData<'static>);

impl LearnsetFileReader {
    pub const fn from_pkl(pkl_data: PklFileData<'static>) -> Self {
        Self(pkl_data)
    }

    pub const fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self(PklFileData::from_bytes(bytes))
    }

    pub fn learnset_at_index(&self, game_index: u16) -> Option<LearnsetReader> {
        if game_index as usize >= self.0.length() {
            return None;
        }

        Some(LearnsetReader(self.0.get_entry(game_index as usize)))
    }
}

#[derive(Debug, Clone, Copy)]
pub struct LearnsetReader(&'static [u8]);

impl LearnsetReader {
    pub const fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self(bytes)
    }

    pub const fn move_count(&self) -> usize {
        self.0.len() / 3 // 2 bytes per move, 1 byte per level
    }

    fn get_move(&self, index: usize) -> Option<LearnsetMove> {
        if index >= self.move_count() {
            return None;
        }

        let moves_span_size = (self.move_count()) * 2;
        let move_indices_raw = u8_slice_to_u16_le(&self.0[..moves_span_size]);
        let move_id = MoveIndex::from_u16(move_indices_raw[index]);

        let levels = &self.0[moves_span_size..];
        let level = levels[index];
        let condition = if level == 0 {
            LearnsetCondition::Evolution
        } else {
            LearnsetCondition::LevelUp(level)
        };

        Some(LearnsetMove { move_id, condition })
    }

    pub fn move_data_by_id(&self, move_id: u16) -> Option<LearnsetMove> {
        (0..self.move_count())
            .filter_map(|index| self.get_move(index))
            .find(|m| m.move_id_raw() == move_id)
    }

    pub fn all_moves(&self) -> Vec<LearnsetMove> {
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
