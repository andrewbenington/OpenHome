use crate::levelup::{LearnsetFileReader, LearnsetReader};
use crate::pkhex_bin::{LZA_LEVELUP_PKL, LZA_PERSONAL_FILE, LZA_PLUS_MOVES_PKL};
use crate::species::form_metadata::{BaseStats, GameMetadata, PersonalInfo};
use pkm_rs_types::{NationalDex, PkmType, Stats8};

const LZA_ENTRY_SIZE: usize = 0x50;

type GameMetadataLza = GameMetadata<PersonalInfoLza, LZA_ENTRY_SIZE>;

pub static METADATA_TABLE_LZA: GameMetadataLza =
    GameMetadataLza::from_binary(LZA_PERSONAL_FILE, LZA_LEVELUP_PKL);

const LZA_PLUS_MOVE_MASTERY: LearnsetFileReader = LearnsetFileReader::from_pkl(LZA_PLUS_MOVES_PKL);

pub fn get_levelup_plus_move_mastery(national_dex: u16, form_index: u16) -> Option<LearnsetReader> {
    LZA_PLUS_MOVE_MASTERY.learnset_at_index(
        METADATA_TABLE_LZA
            .personal
            .get_game_index(national_dex, form_index)?,
    )
}

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoLza(&'static [u8]);

impl PersonalInfoLza {
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

impl PersonalInfo for PersonalInfoLza {
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
