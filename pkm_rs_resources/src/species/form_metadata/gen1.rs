use pkm_rs_types::{PkmType, StatsPreSplit};

use crate::{
    ExpectLog,
    levelup::LearnsetMoves,
    species::form_metadata::{BaseStats, MetadataTable, PersonalInfo, PersonalTable},
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
const GEN1_PERSONAL_FILE_SIZE: usize = 4256;
const RED_BLUE_PERSONAL_BYTES: &[u8; GEN1_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_rb");
const YELLOW_PERSONAL_BYTES: &[u8; GEN1_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_y");

const RED_BLUE_LEVELUP_FILE_SIZE: usize = 2494;
const RED_BLUE_LEVELUP_BYTES: &[u8; RED_BLUE_LEVELUP_FILE_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_rb.pkl");

const YELLOW_LEVELUP_FILE_SIZE: usize = 2575;
const YELLOW_LEVELUP_BYTES: &[u8; YELLOW_LEVELUP_FILE_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_y.pkl");

const GEN1_ENTRY_SIZE: usize = 0x1c;

pub static METADATA_TABLE_RED_BLUE: MetadataTableGen1 = MetadataTableGen1 {
    personal: PersonalTableGen1::from_pkl_bytes(RED_BLUE_PERSONAL_BYTES),
    learnsets: vec![],
    // learnsets: LearnsetMoves::all_from_pkl_bytes(RED_BLUE_LEVELUP_BYTES),
};

pub static METADATA_TABLE_YELLOW: MetadataTableGen1 = MetadataTableGen1 {
    personal: PersonalTableGen1::from_pkl_bytes(YELLOW_PERSONAL_BYTES),
    learnsets: vec![],
    // learnsets: LearnsetMoves::all_from_pkl_bytes(YELLOW_LEVELUP_BYTES),
};

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoGen1(&'static [u8]);

impl PersonalInfoGen1 {
    pub const fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self(bytes)
    }

    pub fn stats(&self) -> StatsPreSplit {
        StatsPreSplit::from_bytes_u8(
            self.0[1..6]
                .try_into()
                .expect_log("Red/Blue personal entry too short for stats"),
        )
    }
}

impl PersonalInfo for PersonalInfoGen1 {
    fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self::from_pkl_bytes(bytes)
    }

    fn stats(&self) -> BaseStats {
        BaseStats::PreSplit(self.stats())
    }

    fn types_fallible(&self) -> (Option<PkmType>, Option<PkmType>) {
        (
            PkmType::from_byte_gen12(self.0[6]),
            PkmType::from_byte_gen12(self.0[7]),
        )
    }

    fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        if form_index == 0 {
            Some(national_dex)
        } else {
            None
        }
    }

    fn source_name(&self) -> &'static str {
        "Red/Blue"
    }
}

pub type PersonalTableGen1 =
    PersonalTable<PersonalInfoGen1, GEN1_PERSONAL_FILE_SIZE, GEN1_ENTRY_SIZE>;

#[derive(Debug)]
pub struct MetadataTableGen1 {
    personal: PersonalTableGen1,
    learnsets: Vec<LearnsetMoves>,
}

impl MetadataTable for MetadataTableGen1 {
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
        "Red/Blue"
    }
}

#[cfg(test)]
mod tests {
    use pkm_rs_types::NationalDex;

    use super::*;

    #[test]
    fn type_check_red_blue() {
        assert_eq!(
            METADATA_TABLE_RED_BLUE.get_types(1, 0),
            Some((PkmType::Grass, Some(PkmType::Poison)))
        );
    }

    #[test]
    fn pikachu_stats_match() -> Result<(), impl std::fmt::Debug> {
        let stats = METADATA_TABLE_RED_BLUE
            .get_base_stats(NationalDex::Pikachu as u16, 0)
            .ok_or("Failed to get base stats for Pikachu")?;

        if stats
            != BaseStats::PreSplit(StatsPreSplit {
                hp: 35,
                atk: 55,
                def: 30,
                spe: 90,
                spc: 50,
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

    #[test]
    fn magnemite_is_just_electric_gen1() -> Result<(), impl std::fmt::Debug> {
        let types = METADATA_TABLE_RED_BLUE
            .get_types(NationalDex::Magnemite as u16, 0)
            .ok_or("Failed to get types for Magnemite")?;

        if types != (PkmType::Electric, None) {
            Err(format!(
                "Expected Magnemite to be just Electric in Gen 1, but got types: {:?}",
                types
            ))
        } else {
            Ok(())
        }
    }
}
