use pkm_rs_types::{NationalDex, PkmType, Stats8};

use crate::{
    levelup::{LearnsetFileReader, LearnsetReader},
    species::form_metadata::{BaseStats, MetadataTable, PersonalInfo, PersonalTable},
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
const SUN_MOON_PERSONAL_FILE_SIZE: usize = 80724;
const SUN_MOON_PERSONAL_BYTES: &[u8; SUN_MOON_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_sm");

const SUN_MOON_LEVELUP_FILE_SIZE: usize = 49262;
const SUN_MOON_LEVELUP_BYTES: &[u8; SUN_MOON_LEVELUP_FILE_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_sm.pkl");

const USUM_PERSONAL_FILE_SIZE: usize = 81984;
const USUM_PERSONAL_BYTES: &[u8; USUM_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_uu");

const USUM_LEVELUP_FILE_SIZE: usize = 50114;
const USUM_LEVELUP_BYTES: &[u8; USUM_LEVELUP_FILE_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_uu.pkl");

const GEN7_ALOLA_ENTRY_SIZE: usize = 0x54;

pub static METADATA_TABLE_SUN_MOON: MetadataTableSunMoon = MetadataTableSunMoon {
    personal: PersonalTableSunMoon::from_pkl_bytes(SUN_MOON_PERSONAL_BYTES),
    learnsets: LearnsetFileReader::from_pkl_bytes(SUN_MOON_LEVELUP_BYTES),
};

pub static METADATA_TABLE_USUM: MetadataTableUsum = MetadataTableUsum {
    personal: PersonalTableUsum::from_pkl_bytes(USUM_PERSONAL_BYTES),
    learnsets: LearnsetFileReader::from_pkl_bytes(USUM_LEVELUP_BYTES),
};

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoGen7Alola([u8; GEN7_ALOLA_ENTRY_SIZE]);

impl PersonalInfoGen7Alola {
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

impl PersonalInfo for PersonalInfoGen7Alola {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Zeraora;

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
        "Gen 7 (Alola)"
    }
}

pub type PersonalTableSunMoon =
    PersonalTable<PersonalInfoGen7Alola, SUN_MOON_PERSONAL_FILE_SIZE, GEN7_ALOLA_ENTRY_SIZE>;

#[derive(Debug)]
pub struct MetadataTableSunMoon {
    personal: PersonalTableSunMoon,
    learnsets: LearnsetFileReader,
}

impl MetadataTable for MetadataTableSunMoon {
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
        "Sun/Moon"
    }
}

pub type PersonalTableUsum =
    PersonalTable<PersonalInfoGen7Alola, USUM_PERSONAL_FILE_SIZE, GEN7_ALOLA_ENTRY_SIZE>;

#[derive(Debug)]
pub struct MetadataTableUsum {
    personal: PersonalTableUsum,
    learnsets: LearnsetFileReader,
}

impl MetadataTable for MetadataTableUsum {
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
        "Ultra Sun/Ultra Moon"
    }
}

#[cfg(test)]
mod tests {
    use pkm_rs_types::NationalDex;

    use super::*;

    #[test]
    fn unsupported_mon_doesnt_crash() {
        let metadata = &METADATA_TABLE_SUN_MOON;
        assert_eq!(
            metadata.get_game_index(NationalDex::Urshifu as u16, 0),
            None
        );
    }
}
