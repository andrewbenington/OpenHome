use pkm_rs_types::{NationalDex, PkmType, Stats8};

use crate::{
    levelup::{LearnsetFileReader, LearnsetReader},
    species::form_metadata::{BaseStats, MetadataTable, PersonalInfo, PersonalTable},
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
const XY_PERSONAL_FILE_SIZE: usize = 51136;
const XY_PERSONAL_BYTES: &[u8; XY_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_xy");

const XY_LEVELUP_FILE_SIZE: usize = 39197;
const XY_LEVELUP_BYTES: &[u8; XY_LEVELUP_FILE_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_xy.pkl");

const XY_ENTRY_SIZE: usize = 0x40;

const ORAS_PERSONAL_FILE_SIZE: usize = 66080;
const ORAS_PERSONAL_BYTES: &[u8; ORAS_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_ao");

const ORAS_LEVELUP_FILE_SIZE: usize = 41264;
const ORAS_LEVELUP_BYTES: &[u8; ORAS_LEVELUP_FILE_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_ao.pkl");

const ORAS_ENTRY_SIZE: usize = 0x50;

pub static METADATA_TABLE_XY: MetadataTableXY = MetadataTableXY {
    personal: PersonalTableXY::from_pkl_bytes(XY_PERSONAL_BYTES),
    learnsets: LearnsetFileReader::from_pkl_bytes(XY_LEVELUP_BYTES),
};

pub static METADATA_TABLE_ORAS: MetadataTableOras = MetadataTableOras {
    personal: PersonalTableOras::from_pkl_bytes(ORAS_PERSONAL_BYTES),
    learnsets: LearnsetFileReader::from_pkl_bytes(ORAS_LEVELUP_BYTES),
};

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoXy([u8; XY_ENTRY_SIZE]);

impl PersonalInfoXy {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(bytes.try_into().unwrap())
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(self.0[0..6].try_into().unwrap())
    }

    pub fn forms_offset(&self) -> Option<u16> {
        let stored_index = i16::from_le_bytes(self.0[0x1c..0x1e].try_into().unwrap());
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

impl PersonalInfo for PersonalInfoXy {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Volcanion;

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
        "Gen 6"
    }
}

pub type PersonalTableXY = PersonalTable<PersonalInfoXy, XY_PERSONAL_FILE_SIZE, XY_ENTRY_SIZE>;

#[derive(Debug)]
pub struct MetadataTableXY {
    personal: PersonalTableXY,
    learnsets: LearnsetFileReader,
}

impl MetadataTable for MetadataTableXY {
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
        "X/Y"
    }
}

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoOras([u8; ORAS_ENTRY_SIZE]);

impl PersonalInfoOras {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(bytes.try_into().unwrap())
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(self.0[0..6].try_into().unwrap())
    }

    pub fn forms_offset(&self) -> Option<u16> {
        let stored_index = i16::from_le_bytes(self.0[0x1c..0x1e].try_into().unwrap());
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

impl PersonalInfo for PersonalInfoOras {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Volcanion;

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
        "Gen 6"
    }
}

pub type PersonalTableOras =
    PersonalTable<PersonalInfoOras, ORAS_PERSONAL_FILE_SIZE, ORAS_ENTRY_SIZE>;

#[derive(Debug)]
pub struct MetadataTableOras {
    personal: PersonalTableOras,
    learnsets: LearnsetFileReader,
}

impl MetadataTable for MetadataTableOras {
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
        "Omega Ruby/Alpha Sapphire"
    }
}

#[cfg(test)]
mod tests {
    use pkm_rs_types::NationalDex;

    use super::*;

    #[test]
    fn unsupported_mon_doesnt_crash() {
        let metadata = &METADATA_TABLE_XY;
        assert_eq!(
            metadata.get_game_index(NationalDex::Urshifu as u16, 0),
            None
        );
    }
}
