use pkm_rs_types::{NationalDex, PkmType, Stats8};

use crate::{
    levelup::{LearnsetFileReader, LearnsetReader},
    species::form_metadata::{BaseStats, MetadataTable, PersonalInfo, PersonalTable},
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
const ZA_PERSONAL_FILE_SIZE: usize = 115600;
const ZA_PERSONAL_BYTES: &[u8; ZA_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_za");

const ZA_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/levelup/lvlmove_za.pkl");

const ZA_ENTRY_SIZE: usize = 0x50;

pub static METADATA_TABLE_ZA: MetadataTableLegendsZa = MetadataTableLegendsZa {
    personal: PersonalTableLegendsZa::from_pkl_bytes(ZA_PERSONAL_BYTES),
    learnsets: LearnsetFileReader::from_pkl_bytes(ZA_LEVELUP_BYTES),
};

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoLegendsZa(&'static [u8]);

impl PersonalInfoLegendsZa {
    pub const fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self(bytes)
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(self.0[0..6].try_into().unwrap())
    }

    pub fn forms_offset(&self) -> Option<u16> {
        let stored_index = i16::from_le_bytes(self.0[0x18..0x1A].try_into().unwrap());
        if stored_index == -1 {
            None
        } else {
            Some(stored_index as u16)
        }
    }

    pub fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        if !self.is_present_in_game() {
            return None;
        }
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

    pub const fn is_present_in_game(&self) -> bool {
        self.0[0x1C] == 1
    }
}

impl PersonalInfo for PersonalInfoLegendsZa {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Baxcalibur;

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
        "Legends: Z-A"
    }
}

pub type PersonalTableLegendsZa =
    PersonalTable<PersonalInfoLegendsZa, ZA_PERSONAL_FILE_SIZE, ZA_ENTRY_SIZE>;

#[derive(Debug)]
pub struct MetadataTableLegendsZa {
    personal: PersonalTableLegendsZa,
    learnsets: LearnsetFileReader,
}

impl MetadataTable for MetadataTableLegendsZa {
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
        "Legends: Z-A"
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_personal_info_legends_za() {
        assert_eq!(
            METADATA_TABLE_ZA.get_types(NationalDex::Alakazam as u16, 0),
            Some((PkmType::Psychic, None))
        );
    }
}
