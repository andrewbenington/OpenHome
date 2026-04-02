use crate::moves::MoveSlot;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use pkm_rs_types::pkl_file::PklFileData;

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

    pub fn get_move(&self, index: usize) -> Option<LearnsetMove> {
        if index >= self.move_count() {
            return None;
        }

        let moves_span_size = (self.move_count()) * 2;
        let move_indices_raw = u8_slice_to_u16_le(&self.0[..moves_span_size]);
        let move_id = MoveSlot::from_u16(move_indices_raw[index]);

        let levels = &self.0[moves_span_size..];
        let level = levels[index];
        let condition = if level == 0 {
            LearnsetCondition::Evolution
        } else {
            LearnsetCondition::LevelUp(level)
        };

        Some(LearnsetMove { move_id, condition })
    }

    pub fn all_moves(&self) -> Vec<LearnsetMove> {
        (0..self.move_count())
            .filter_map(|index| self.get_move(index))
            .collect()
    }
}

fn u8_slice_to_u16_le(slice: &[u8]) -> Vec<u16> {
    slice
        .chunks_exact(2)
        .map(|chunk| u16::from_le_bytes([chunk[0], chunk[1]]))
        .collect()
}
