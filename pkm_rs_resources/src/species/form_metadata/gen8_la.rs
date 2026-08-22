use pkm_rs_types::{NationalDex, PkmType, Stats8};

use crate::{
    learnset_pkl,
    levelup::{LearnsetFileReader, LearnsetReader},
    species::form_metadata::{BaseStats, GameMetadata, PersonalInfo, PersonalTable},
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
const LA_PERSONAL_FILE_SIZE: usize = 224576;
const LA_PERSONAL_BYTES: &[u8; LA_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_la");

const LA_ENTRY_SIZE: usize = 0xB0;

type PersonalTableLegendsArceus = PersonalTable<PersonalInfoLegendsArceus, LA_ENTRY_SIZE>;

pub static METADATA_TABLE_LA: GameMetadata<PersonalInfoLegendsArceus, LA_ENTRY_SIZE> =
    GameMetadata {
        personal: PersonalTableLegendsArceus::from_pkl_bytes(LA_PERSONAL_BYTES),
        learnsets: learnset_pkl!("pkhex_bin/levelup/lvlmove_la.pkl"),
    };

const LA_MOVE_MASTERY: LearnsetFileReader = learnset_pkl!("pkhex_bin/levelup/mastery_la.pkl");

pub fn get_levelup_mastery(national_dex: u16, form_index: u16) -> Option<LearnsetReader> {
    LA_MOVE_MASTERY.learnset_at_index(
        METADATA_TABLE_LA
            .personal
            .get_game_index(national_dex, form_index)?,
    )
}

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoLegendsArceus([u8; LA_ENTRY_SIZE]);

impl PersonalInfoLegendsArceus {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(bytes.try_into().unwrap())
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(self.0[0..6].try_into().unwrap())
    }

    pub fn forms_offset(&self) -> Option<u16> {
        let stored_index = i16::from_le_bytes(self.0[0x1E..0x20].try_into().unwrap());
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

    const fn is_present_in_game(&self) -> bool {
        ((self.0[0x21] >> 6) & 1) == 1
    }
}

impl PersonalInfo for PersonalInfoLegendsArceus {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Enamorus;

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
        "Legends: Arceus"
    }
}
