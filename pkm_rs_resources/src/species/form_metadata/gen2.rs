use pkm_rs_types::{NationalDex, PkmType, Stats8};

use crate::{
    ExpectLog,
    levelup::LearnsetMoves,
    species::form_metadata::{BaseStats, MetadataTable, PersonalInfo, PersonalTable},
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
const GEN2_PERSONAL_FILE_SIZE: usize = 8064;
const GOLD_SILVER_PERSONAL_BYTES: &[u8; GEN2_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_gs");
const CRYSTAL_PERSONAL_BYTES: &[u8; GEN2_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_c");

const GOLD_SILVER_LEVELUP_FILE_SIZE: usize = 7131;
const GOLD_SILVER_LEVELUP_BYTES: &[u8; GOLD_SILVER_LEVELUP_FILE_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_gs.pkl");

const GEN2_SILVER_ENTRY_SIZE: usize = 0x20;

pub static METADATA_TABLE_GOLD_SILVER: MetadataTableGen2 = MetadataTableGen2 {
    personal: PersonalTableGen2::from_pkl_bytes(GOLD_SILVER_PERSONAL_BYTES),
    learnsets: vec![],
    // learnsets: LearnsetMoves::all_from_pkl_bytes(GOLD_SILVER_LEVELUP_BYTES),
};

pub static METADATA_TABLE_CRYSTAL: MetadataTableGen2 = MetadataTableGen2 {
    personal: PersonalTableGen2::from_pkl_bytes(CRYSTAL_PERSONAL_BYTES),
    learnsets: vec![],
    // learnsets: LearnsetMoves::all_from_pkl_bytes(CRYSTAL_LEVELUP_BYTES),
};

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoGen2(&'static [u8]);

impl PersonalInfoGen2 {
    pub const fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self(bytes)
    }

    pub fn base_stats(&self) -> Stats8 {
        Stats8::from_bytes(
            self.0[1..7].try_into().expect_log(
                "Bad slice length for Stats8::from_bytes in PersonalInfoGen2::base_stats",
            ),
        )
    }
}

const UNOWN_Z: u16 = 26;

impl PersonalInfo for PersonalInfoGen2 {
    fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self::from_pkl_bytes(bytes)
    }

    fn stats(&self) -> BaseStats {
        BaseStats::Modern(self.base_stats())
    }

    fn types_fallible(&self) -> (Option<PkmType>, Option<PkmType>) {
        (
            PkmType::from_byte_gen12(self.0[7]),
            PkmType::from_byte_gen12(self.0[8]),
        )
    }

    fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        if form_index == 0 {
            return Some(national_dex);
        }
        if national_dex == NationalDex::Unown && form_index <= UNOWN_Z {
            Some(0)
        } else {
            None
        }
    }

    fn source_name(&self) -> &'static str {
        "Gen 2"
    }
}

pub type PersonalTableGen2 =
    PersonalTable<PersonalInfoGen2, GEN2_PERSONAL_FILE_SIZE, GEN2_SILVER_ENTRY_SIZE>;

#[derive(Debug)]
pub struct MetadataTableGen2 {
    personal: PersonalTableGen2,
    learnsets: Vec<LearnsetMoves>,
}

impl MetadataTable for MetadataTableGen2 {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, Option<PkmType>)> {
        self.personal.get_types(national_dex, forme_index)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.personal.get_game_index(national_dex, forme_index)
    }

    fn get_levelup_learnset(&self, national_dex: u16, forme_index: u16) -> Option<&LearnsetMoves> {
        self.learnsets
            .get(self.get_game_index(national_dex, forme_index)? as usize)
    }

    fn get_base_stats(&self, national_dex: u16, forme_index: u16) -> Option<BaseStats> {
        self.personal.get_base_stats(national_dex, forme_index)
    }

    fn get_source_name(&self) -> &'static str {
        "Gen 2"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pikachu_stats_match() -> Result<(), impl std::fmt::Debug> {
        let stats = METADATA_TABLE_GOLD_SILVER
            .get_base_stats(NationalDex::Pikachu as u16, 0)
            .ok_or("Failed to get base stats for Pikachu")?;

        if stats
            != BaseStats::Modern(Stats8 {
                hp: 35,
                atk: 55,
                def: 30,
                spe: 90,
                spa: 50,
                spd: 40,
            })
        {
            Err(format!(
                "Pikachu's stats do not match expected values. Got: {:?}",
                stats
            ))
        } else {
            Ok(())
        }
    }
}
