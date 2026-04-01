use pkm_rs_types::{PkmType, Stats8};

use crate::{
    levelup::LearnsetMoves,
    species::form_metadata::{BaseStats, MetadataTable, PersonalInfo, PersonalTable},
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
const SWSH_PERSONAL_FILE_SIZE: usize = 209792;
const SWSH_PERSONAL_BYTES: &[u8; SWSH_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_swsh");

const SWSH_LEVELUP_FILE_SIZE: usize = 39140;
const SWSH_LEVELUP_BYTES: &[u8; SWSH_LEVELUP_FILE_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_swsh.pkl");

const SWSH_ENTRY_SIZE: usize = 0xB0;

pub static METADATA_TABLE_SWSH: MetadataTableSwordShield = MetadataTableSwordShield {
    personal: PersonalTableSwordShield::from_pkl_bytes(SWSH_PERSONAL_BYTES),
    learnsets: vec![],
};

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoSwordShield(&'static [u8]);

impl PersonalInfoSwordShield {
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
        if form_index == 0 {
            return Some(national_dex);
        }
        if let Some(forms_offset) = self.forms_offset()
            && form_index > 0
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

impl PersonalInfo for PersonalInfoSwordShield {
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
        "Sword/Shield"
    }
}

type PersonalTableSwordShield =
    PersonalTable<PersonalInfoSwordShield, SWSH_PERSONAL_FILE_SIZE, SWSH_ENTRY_SIZE>;

#[derive(Debug)]
pub struct MetadataTableSwordShield {
    personal: PersonalTableSwordShield,
    learnsets: Vec<LearnsetMoves>,
}

impl MetadataTable for MetadataTableSwordShield {
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
        "Sword/Shield"
    }
}
