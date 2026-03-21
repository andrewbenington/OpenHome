use crate::moves::MoveSlot;
use pkm_rs_types::pkl_file::PklFileData;

static SV_LEVELUP_BYTES: &'static [u8] = include_bytes!("levelup_bin/lvlmove_sv.pkl");

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

#[derive(Debug, Clone, Default)]
pub struct Learnset {
    pub(crate) moves: Vec<LearnsetMove>,
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

pub fn get_sv_learnsets() -> Vec<Learnset> {
    let file_data = PklFileData::from_bytes(SV_LEVELUP_BYTES);
    Learnset::all_from_pkl_bytes(&file_data)
}

fn u8_slice_to_u16_le(slice: &[u8]) -> Vec<u16> {
    slice
        .chunks_exact(2)
        .map(|chunk| u16::from_le_bytes([chunk[0], chunk[1]]))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_sv_levelup() -> Result<(), Box<dyn std::error::Error>> {
        assert_eq!(SV_LEVELUP_BYTES.len(), 63433);

        let data = PklFileData::from_bytes(SV_LEVELUP_BYTES);
        let identifier = data.identifier()?;

        assert_eq!(identifier, "sv");
        assert_eq!(data.length(), 0x0590);
        Ok(())
    }

    #[test]
    fn print_first_learnset_sv() -> Result<(), Box<dyn std::error::Error>> {
        assert_eq!(SV_LEVELUP_BYTES.len(), 63433);

        let file_data = PklFileData::from_bytes(SV_LEVELUP_BYTES);
        let identifier = file_data.identifier()?;

        assert_eq!(identifier, "sv");

        let learnsets = Learnset::all_from_pkl_bytes(&file_data);

        for learnset_move in &learnsets[3].moves {
            println!(
                "move: {:?} - {}",
                learnset_move.condition,
                learnset_move
                    .move_id
                    .get_metadata()
                    .map_or("(invalid_move)", |m| m.name),
            );
        }

        Ok(())
    }
}
