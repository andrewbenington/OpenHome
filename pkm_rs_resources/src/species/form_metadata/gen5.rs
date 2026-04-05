use pkm_rs_types::{NationalDex, PkmType, Stats8, log::ExpectLog};

use crate::{
    levelup::{LearnsetFileReader, LearnsetReader},
    species::form_metadata::{BaseStats, MetadataTable, PersonalInfo, PersonalTable},
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
const BLACK_WHITE_PERSONAL_FILE_SIZE: usize = 40080;
const BLACK_WHITE_PERSONAL_BYTES: &[u8; BLACK_WHITE_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_bw");

const BLACK_WHITE_LEVELUP_FILE_SIZE: usize = 30469;
const BLACK_WHITE_LEVELUP_BYTES: &[u8; BLACK_WHITE_LEVELUP_FILE_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_bw.pkl");

const BW_ENTRY_SIZE: usize = 0x3C;

const B2W2_PERSONAL_FILE_SIZE: usize = 53884;
const B2W2_PERSONAL_BYTES: &[u8; B2W2_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_b2w2");

const B2W2_LEVELUP_FILE_SIZE: usize = 31403;
const B2W2_LEVELUP_BYTES: &[u8; B2W2_LEVELUP_FILE_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_b2w2.pkl");

const B2W2_ENTRY_SIZE: usize = 0x4C;

pub static METADATA_TABLE_BW: MetadataTableBw = MetadataTableBw {
    personal: PersonalTableBw::from_pkl_bytes(BLACK_WHITE_PERSONAL_BYTES),
    learnsets: LearnsetFileReader::from_pkl_bytes(BLACK_WHITE_LEVELUP_BYTES),
};

pub static METADATA_TABLE_B2W2: MetadataTableB2W2 = MetadataTableB2W2 {
    personal: PersonalTableB2W2::from_pkl_bytes(B2W2_PERSONAL_BYTES),
    learnsets: LearnsetFileReader::from_pkl_bytes(B2W2_LEVELUP_BYTES),
};

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoBw([u8; BW_ENTRY_SIZE]);

impl PersonalInfoBw {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(bytes.try_into().expect_log("bad length for PersonalInfoBw"))
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(
            self.0[0..6]
                .try_into()
                .expect_log("bad length for PersonalInfoBw::stats"),
        )
    }

    pub fn forms_offset(&self) -> Option<u16> {
        let stored_index = i16::from_le_bytes(
            self.0[0x1c..0x1e]
                .try_into()
                .expect_log("bad length for i16 in PersonalInfoBw::forms_offset"),
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
        self.0[0x20]
    }
}

impl PersonalInfo for PersonalInfoBw {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Genesect;

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

pub type PersonalTableBw =
    PersonalTable<PersonalInfoBw, BLACK_WHITE_PERSONAL_FILE_SIZE, BW_ENTRY_SIZE>;

#[derive(Debug)]
pub struct MetadataTableBw {
    personal: PersonalTableBw,
    learnsets: LearnsetFileReader,
}

impl MetadataTable for MetadataTableBw {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, Option<PkmType>)> {
        self.personal.get_types(national_dex, forme_index)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.personal.get_game_index(national_dex, forme_index)
    }

    fn get_levelup_learnset(&self, national_dex: u16, forme_index: u16) -> Option<LearnsetReader> {
        self.learnsets
            .learnset_at_index(self.get_game_index(national_dex, forme_index)?)
    }

    fn get_base_stats(&self, national_dex: u16, forme_index: u16) -> Option<BaseStats> {
        self.personal.get_base_stats(national_dex, forme_index)
    }

    fn get_source_name(&self) -> &'static str {
        "Black/White"
    }
}

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoB2W2([u8; B2W2_ENTRY_SIZE]);

impl PersonalInfoB2W2 {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(
            bytes
                .try_into()
                .expect_log("bad length for PersonalInfoB2W2"),
        )
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(
            self.0[0..6]
                .try_into()
                .expect_log("bad length for PersonalInfoB2W2::stats"),
        )
    }

    pub fn forms_offset(&self) -> Option<u16> {
        let stored_index = i16::from_le_bytes(
            self.0[0x1c..0x1e]
                .try_into()
                .expect_log("bad length for i16 in PersonalInfoB2W2::forms_offset"),
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
        self.0[0x20]
    }
}

impl PersonalInfo for PersonalInfoB2W2 {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Genesect;

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
        "Black 2/White 2"
    }
}

pub type PersonalTableB2W2 =
    PersonalTable<PersonalInfoB2W2, B2W2_PERSONAL_FILE_SIZE, B2W2_ENTRY_SIZE>;

#[derive(Debug)]
pub struct MetadataTableB2W2 {
    personal: PersonalTableB2W2,
    learnsets: LearnsetFileReader,
}

impl MetadataTable for MetadataTableB2W2 {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, Option<PkmType>)> {
        self.personal.get_types(national_dex, forme_index)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.personal.get_game_index(national_dex, forme_index)
    }

    fn get_levelup_learnset(&self, national_dex: u16, forme_index: u16) -> Option<LearnsetReader> {
        self.learnsets
            .learnset_at_index(self.get_game_index(national_dex, forme_index)?)
    }

    fn get_base_stats(&self, national_dex: u16, forme_index: u16) -> Option<BaseStats> {
        self.personal.get_base_stats(national_dex, forme_index)
    }

    fn get_source_name(&self) -> &'static str {
        "Black 2/White 2"
    }
}

#[cfg(test)]
mod tests {
    use pkm_rs_types::NationalDex;

    use super::*;

    #[test]
    fn unsupported_mon_doesnt_crash() {
        let metadata = &METADATA_TABLE_B2W2;
        assert_eq!(
            metadata.get_game_index(NationalDex::Urshifu as u16, 0),
            None
        );
    }
}
