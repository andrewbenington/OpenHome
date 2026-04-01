use crate::moves::MoveSlot;
#[cfg(feature = "wasm")]
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
    pub(crate) move_id: MoveSlot,
    pub(crate) condition: LearnsetCondition,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Default)]
pub struct LearnsetMoves {
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

impl LearnsetMoves {
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

    pub fn all_from_pkl_bytes(bytes: &[u8]) -> Vec<Self> {
        let pkl_file_data = PklFileData::from_bytes(bytes);
        let mut all_learnsets = vec![Self::default()];
        for i in 1..pkl_file_data.length() {
            all_learnsets.push(Self::from_pkl_bytes(pkl_file_data.get_entry(i)));
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

// #[derive(Debug, Clone, Copy)]
// pub struct Learnsets<const LENGTH: usize>(&'static [u8; LENGTH]);

// impl<const LENGTH: usize> Learnsets<LENGTH> {
//     pub fn from_pkl_bytes(bytes: &'static [u8; LENGTH]) -> Self {
//         Self(bytes)
//     }

//     pub fn get_learnset_by_game_index(&self, game_index: u16) -> Option<Learnset> {
//         if game_index as usize >= self.count() {
//             return None;
//         }

//         let move_indices_raw = u8_slice_to_u16_le(&self.0[..self.moves_span_size()]);
//         let levels = &self.0[self.moves_span_size()..];

//         let offset = (game_index as usize) * 3; // 2 bytes per move, 1 byte per level
//         LearnsetMoves::from_pkl_bytes(&self.0[offset..offset + 3])
//     }

//     pub const fn count(&self) -> usize {
//         LENGTH / 3
//     }

//     const fn moves_span_size(&self) -> usize {
//         self.count() * 2
//     }
// }

// #[derive(Debug, Clone, Copy)]
// pub struct Learnset(&'static [u8]);

// impl Learnset {
//     pub fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
//         Self(bytes)
//     }
// }
