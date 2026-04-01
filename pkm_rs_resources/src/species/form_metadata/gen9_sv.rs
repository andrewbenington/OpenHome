use pkm_rs_types::{PkmType, Stats8};

use crate::{
    ExpectLog,
    levelup::LearnsetMoves,
    species::form_metadata::{BaseStats, MetadataTable, PersonalInfo, PersonalTable},
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
const SV_PERSONAL_FILE_SIZE: usize = 113920;
const SV_PERSONAL_BYTES: &[u8; SV_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_sv");
const SV_LEVELUP_FILE_SIZE: usize = 63433;
const SV_LEVELUP_BYTES: &[u8; SV_LEVELUP_FILE_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_sv.pkl");
pub const SV_ENTRY_SIZE: usize = 0x50;

pub static METADATA_TABLE_SV: MetadataTableScarletViolet = MetadataTableScarletViolet {
    personal_table: PersonalTableScarletViolet::from_pkl_bytes(SV_PERSONAL_BYTES),
    learnsets: vec![],
};

#[derive(Clone, Copy)]
pub struct PersonalInfoScarletViolet([u8; SV_ENTRY_SIZE]);

impl PersonalInfoScarletViolet {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(
            bytes
                .try_into()
                .expect_log("Scarlet/Violet entry too short"),
        )
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(
            self.0[0..6]
                .try_into()
                .expect_log("Scarlet/Violet entry too short for stats"),
        )
    }

    pub fn forms_offset(&self) -> Option<u16> {
        let stored_index = i16::from_le_bytes(
            self.0[0x18..0x1A]
                .try_into()
                .expect_log("Scarlet/Violet entry too short for forms_offset"),
        );
        if stored_index == -1 {
            None
        } else {
            Some(stored_index as u16)
        }
    }

    pub fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        if form_index == 0 {
            return Some(national_dex);
        }
        if let Some(forms_offset) = self.forms_offset()
            && form_index < self.form_count() as u16
        {
            Some(forms_offset + form_index - 1)
        } else {
            None
        }
    }

    pub const fn form_count(&self) -> u8 {
        self.0[0x1A]
    }
}

impl PersonalInfo for PersonalInfoScarletViolet {
    fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self::from_pkl_bytes(bytes)
    }

    fn stats(&self) -> BaseStats {
        BaseStats::Modern(self.stats())
    }

    fn types_fallible(&self) -> (Option<PkmType>, Option<PkmType>) {
        (PkmType::from_byte(self.0[6]), PkmType::from_byte(self.0[7]))
    }

    fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        self.game_index_for_form(national_dex, form_index)
    }

    fn source_name(&self) -> &'static str {
        "Scarlet/Violet"
    }
}

pub type PersonalTableScarletViolet =
    PersonalTable<PersonalInfoScarletViolet, SV_PERSONAL_FILE_SIZE, SV_ENTRY_SIZE>;

pub struct MetadataTableScarletViolet {
    personal_table: PersonalTableScarletViolet,
    learnsets: Vec<LearnsetMoves>,
}

impl MetadataTable for MetadataTableScarletViolet {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, Option<PkmType>)> {
        self.personal_table.get_types(national_dex, forme_index)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.personal_table
            .get_game_index(national_dex, forme_index)
    }

    fn get_levelup_learnset(&self, national_dex: u16, forme_index: u16) -> Option<&LearnsetMoves> {
        self.learnsets
            .get(self.get_game_index(national_dex, forme_index)? as usize)
    }

    fn get_base_stats(&self, national_dex: u16, forme_index: u16) -> Option<BaseStats> {
        self.personal_table
            .get_base_stats(national_dex, forme_index)
    }

    fn get_source_name(&self) -> &'static str {
        "Scarlet/Violet"
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_personal_info_scarlet_violet() {
        let bulbasaur_info = METADATA_TABLE_SV
            .get_base_stats(1, 0)
            .expect_log("Bulbasaur not found");
        let modern_stats = match bulbasaur_info {
            BaseStats::Modern(stats) => stats,
            _ => panic!("Expected modern stats"),
        };
        assert_eq!(
            modern_stats,
            Stats8 {
                hp: 45,
                atk: 49,
                def: 49,
                spa: 65,
                spd: 65,
                spe: 45
            }
        );
        assert_eq!(
            METADATA_TABLE_SV.get_types(1, 0),
            Some((PkmType::Grass, Some(PkmType::Poison)))
        );
        // assert_eq!(bulbasaur_info.form_count(), 1);
        // assert_eq!(bulbasaur_info.forms_offset(), None);
        // assert_eq!(bulbasaur_info.game_index_for_form(0), Some(0));
    }
}
