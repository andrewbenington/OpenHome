use pkm_rs_types::{NationalDex, PkmType, Stats8, log::ExpectLog};

use crate::{
    levelup::{LearnsetFileReader, LearnsetReader},
    species::form_metadata::{BaseStats, MetadataTable, PersonalInfo, PersonalTable},
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
const GEN3_PERSONAL_FILE_SIZE: usize = 10836;
const RUBY_SAPPHIRE_PERSONAL_BYTES: &[u8; GEN3_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_rs");
const EMERALD_PERSONAL_BYTES: &[u8; GEN3_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_e");
const FRLG_PERSONAL_BYTES: &[u8; GEN3_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_fr");

const RSE_LEVELUP_SIZE: usize = 12624;
const RUBY_SAPPHIRE_LEVELUP_BYTES: &[u8; RSE_LEVELUP_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_rs.pkl");
const EMERALD_LEVELUP_BYTES: &[u8; RSE_LEVELUP_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_e.pkl");

const FRLG_LEVELUP_SIZE: usize = 12816;
const FRLG_LEVELUP_BYTES: &[u8; FRLG_LEVELUP_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_fr.pkl");

const GEN3_ENTRY_SIZE: usize = 0x1C;

pub static METADATA_TABLE_RUBY_SAPPHIRE: MetadataTableGen3 = MetadataTableGen3 {
    personal: PersonalTableGen3::from_pkl_bytes(RUBY_SAPPHIRE_PERSONAL_BYTES),
    learnsets: LearnsetFileReader::from_pkl_bytes(RUBY_SAPPHIRE_LEVELUP_BYTES),
};

pub static METADATA_TABLE_EMERALD: MetadataTableGen3 = MetadataTableGen3 {
    personal: PersonalTableGen3::from_pkl_bytes(EMERALD_PERSONAL_BYTES),
    learnsets: LearnsetFileReader::from_pkl_bytes(EMERALD_LEVELUP_BYTES),
};
pub static METADATA_TABLE_FRLG: MetadataTableGen3 = MetadataTableGen3 {
    personal: PersonalTableGen3::from_pkl_bytes(FRLG_PERSONAL_BYTES),
    learnsets: LearnsetFileReader::from_pkl_bytes(FRLG_LEVELUP_BYTES),
};

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoGen3([u8; GEN3_ENTRY_SIZE]);

const UNOWN_QUESTION: u16 = 27;
const CASTFORM_SNOWY: u16 = 3;
const DEOXYS_SPEED: u16 = 3;

impl PersonalInfoGen3 {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(
            bytes
                .try_into()
                .expect_log("bad length for PersonalInfoGen3"),
        )
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(
            self.0[0..6]
                .try_into()
                .expect_log("bad length for PersonalInfoGen3::stats"),
        )
    }

    pub fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        if Self::supports_form(national_dex, form_index) {
            Some(national_dex)
        } else {
            None
        }
    }

    fn supports_form(national_dex: u16, form_index: u16) -> bool {
        let Ok(national_dex) = NationalDex::try_from(national_dex) else {
            return false;
        };
        match national_dex {
            NationalDex::Unown => form_index <= UNOWN_QUESTION,
            NationalDex::Castform => form_index <= CASTFORM_SNOWY,
            NationalDex::Deoxys => form_index <= DEOXYS_SPEED,
            _ => form_index == 0,
        }
    }
}

impl PersonalInfo for PersonalInfoGen3 {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Deoxys;

    fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
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
        "Black/White"
    }
}

pub type PersonalTableGen3 =
    PersonalTable<PersonalInfoGen3, GEN3_PERSONAL_FILE_SIZE, GEN3_ENTRY_SIZE>;

#[derive(Debug)]
pub struct MetadataTableGen3 {
    personal: PersonalTableGen3,
    learnsets: LearnsetFileReader,
}

impl MetadataTable for MetadataTableGen3 {
    fn get_types(&self, national_dex: u16, form_index: u16) -> Option<(PkmType, Option<PkmType>)> {
        self.personal.get_types(national_dex, form_index)
    }

    fn get_game_index(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        self.personal.get_game_index(national_dex, form_index)
    }

    fn get_levelup_learnset(&self, national_dex: u16, form_index: u16) -> Option<LearnsetReader> {
        self.learnsets
            .learnset_at_index(self.get_game_index(national_dex, form_index)?)
    }

    fn get_base_stats(&self, national_dex: u16, form_index: u16) -> Option<BaseStats> {
        self.personal.get_base_stats(national_dex, form_index)
    }

    fn get_source_name(&self) -> &'static str {
        "Gen 3"
    }
}

#[cfg(test)]
mod tests {
    use pkm_rs_types::NationalDex;

    use super::*;

    #[test]
    fn unsupported_mon_doesnt_crash() {
        let metadata = &METADATA_TABLE_EMERALD;
        assert_eq!(
            metadata.get_game_index(NationalDex::Urshifu as u16, 0),
            None
        );
    }
}
