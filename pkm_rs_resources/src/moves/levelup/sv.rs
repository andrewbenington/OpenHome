use std::sync::LazyLock;

use crate::moves::levelup::Learnset;
use pkm_rs_types::pkl_file::PklFileData;

static SV_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/lvlmove_sv.pkl");
pub static SV_LEVELUP_LEARNSETS: LazyLock<Vec<Learnset>> =
    LazyLock::new(|| Learnset::all_from_pkl_bytes(&PklFileData::from_bytes(SV_LEVELUP_BYTES)));

pub fn learnset_by_sv_index(index: usize) -> Option<&'static Learnset> {
    SV_LEVELUP_LEARNSETS.get(index)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn print_first_learnset_sv() -> Result<(), Box<dyn std::error::Error>> {
        let learnsets = &SV_LEVELUP_LEARNSETS;

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
