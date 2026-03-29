use std::sync::LazyLock;

use pkm_rs_types::{PkmType, Stats8};

use crate::{
    levelup::Learnset,
    species::form_metadata::{MetadataTable, PersonalTable},
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal

const BDSP_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal/personal_bdsp");
const BDSP_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/levelup/lvlmove_bdsp.pkl");
const BDSP_ENTRY_SIZE: usize = 0x44;

const DEFAULT_FORM_OFFSET: usize = 0x18;

pub static METADATA_TABLE_BDSP: LazyLock<MetadataTableBdsp> = LazyLock::new(|| MetadataTableBdsp {
    personal: PersonalTableBdsp::from_pkl_bytes(BDSP_PERSONAL_BYTES),
    learnsets: Learnset::all_from_pkl_bytes(BDSP_LEVELUP_BYTES),
});

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoBdsp([u8; BDSP_ENTRY_SIZE]);

impl PersonalInfoBdsp {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(bytes.try_into().unwrap())
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(self.0[0..6].try_into().unwrap())
    }

    pub const fn types(&self) -> (PkmType, PkmType) {
        (
            PkmType::from_byte(self.0[6]).expect("legends z-a type 1 should be valid"),
            PkmType::from_byte(self.0[7]).expect("legends z-a type 2 should be valid"),
        )
    }

    pub fn form_stats_index(&self) -> Option<u16> {
        let stored_index = i16::from_le_bytes(self.0[0x18..0x1A].try_into().unwrap());
        if stored_index == -1 {
            None
        } else {
            Some(stored_index as u16)
        }
    }

    pub fn form_index(&self, national_dex: u16, form_index: u16) -> u16 {
        if let Some(form_stats_index) = self.form_stats_index()
            && form_index > 0
            && form_index < self.form_count() as u16
        {
            form_stats_index + form_index - 1
        } else {
            national_dex
        }
    }

    // pub fn has_form(&self, form_index: u16) -> bool {
    //     form_index > 0 && self.form_stats_index().is_some() && form_index < self.form_count() as u16
    // }

    // pub fn ability1(&self) -> AbilityIndex {
    //     AbilityIndex::new(u16::from_le_bytes([self.0[0x12], self.0[0x13]]))
    //         .expect("Gen 9 ability 1 should be valid")
    // }

    // pub fn ability2(&self) -> AbilityIndex {
    //     AbilityIndex::from_index(u16::from_le_bytes([self.0[0x14], self.0[0x15]]))
    //         .expect("Gen 9 ability 2 should be valid")
    // }

    // pub fn ability_hidden(&self) -> AbilityIndex {
    //     AbilityIndex::from_index(u16::from_le_bytes([self.0[0x16], self.0[0x17]]))
    //         .expect("Gen 9 hidden ability should be valid")
    // }

    pub const fn form_count(&self) -> u8 {
        self.0[0x1A]
    }
}

pub struct PersonalTableBdsp(Vec<PersonalInfoBdsp>);

impl PersonalTableBdsp {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let count = bytes.len() / BDSP_ENTRY_SIZE;
        let mut entries = Vec::<PersonalInfoBdsp>::with_capacity(count);
        for i in 0..count {
            let offset = i * BDSP_ENTRY_SIZE;
            entries.push(PersonalInfoBdsp::from_pkl_bytes(
                bytes[offset..offset + BDSP_ENTRY_SIZE]
                    .try_into()
                    .expect("incorrect slice length for legends z-a personal table"),
            ));
        }
        Self(entries)
    }

    pub fn get_personal_info(
        &self,
        national_dex: u16,
        forme_index: u16,
    ) -> Option<&PersonalInfoBdsp> {
        self.get_game_index(national_dex, forme_index)
            .and_then(|game_index| self.0.get(game_index as usize))
    }

    pub fn get_form_stats(&self, national_dex: u16, forme_index: u16) -> Option<Stats8> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoBdsp::stats)
    }
}

impl PersonalTable for PersonalTableBdsp {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoBdsp::types)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.0
            .get(national_dex as usize)
            .map(|info| info.form_index(national_dex, forme_index))
    }
}

pub struct MetadataTableBdsp {
    personal: PersonalTableBdsp,
    learnsets: Vec<Learnset>,
}

impl MetadataTableBdsp {
    pub fn get_base_stats(&self, national_dex: u16, forme_index: u16) -> Option<Stats8> {
        self.personal.get_form_stats(national_dex, forme_index)
    }
}

impl MetadataTable for MetadataTableBdsp {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.personal.get_types(national_dex, forme_index)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.personal.get_game_index(national_dex, forme_index)
    }

    fn get_levelup_learnset(&self, national_dex: u16, forme_index: u16) -> Option<&Learnset> {
        self.learnsets
            .get(self.get_game_index(national_dex, forme_index)? as usize)
    }
}
