use std::sync::LazyLock;

use pkm_rs_types::{PkmType, Stats8};

use crate::{
    levelup::Learnset,
    species::form_metadata::{MetadataTable, PersonalTable},
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal

const SWSH_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal/personal_swsh");
const SWSH_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/levelup/lvlmove_swsh.pkl");

pub static METADATA_TABLE_SWSH: LazyLock<MetadataTableGen9> = LazyLock::new(|| MetadataTableGen9 {
    personal: PersonalTableGen9::from_pkl_bytes(SWSH_PERSONAL_BYTES),
    learnsets: Learnset::all_from_pkl_bytes(SWSH_LEVELUP_BYTES),
});

const BDSP_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal/personal_bdsp");
const BDSP_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/levelup/lvlmove_bdsp.pkl");

pub static METADATA_TABLE_BDSP: LazyLock<MetadataTableGen9> = LazyLock::new(|| MetadataTableGen9 {
    personal: PersonalTableGen9::from_pkl_bytes(BDSP_PERSONAL_BYTES),
    learnsets: Learnset::all_from_pkl_bytes(BDSP_LEVELUP_BYTES),
});

const LA_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal/personal_la");
const LA_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/levelup/lvlmove_la.pkl");

pub static METADATA_TABLE_LA: LazyLock<MetadataTableGen9> = LazyLock::new(|| MetadataTableGen9 {
    personal: PersonalTableGen9::from_pkl_bytes(LA_PERSONAL_BYTES),
    learnsets: Learnset::all_from_pkl_bytes(LA_LEVELUP_BYTES),
});

const SV_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal/personal_sv");
const SV_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/levelup/lvlmove_sv.pkl");

pub static METADATA_TABLE_SV: LazyLock<MetadataTableGen9> = LazyLock::new(|| MetadataTableGen9 {
    personal: PersonalTableGen9::from_pkl_bytes(SV_PERSONAL_BYTES),
    learnsets: Learnset::all_from_pkl_bytes(SV_LEVELUP_BYTES),
});

const ZA_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal/personal_za");
const ZA_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/levelup/lvlmove_za.pkl");

pub static METADATA_TABLE_ZA: LazyLock<MetadataTableGen9> = LazyLock::new(|| MetadataTableGen9 {
    personal: PersonalTableGen9::from_pkl_bytes(ZA_PERSONAL_BYTES),
    learnsets: Learnset::all_from_pkl_bytes(ZA_LEVELUP_BYTES),
});

const ENTRY_SIZE: usize = 0x50;

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoGen9([u8; 42]);

impl PersonalInfoGen9 {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let (gen9_bytes, _) = bytes.split_at(42);
        Self(gen9_bytes.try_into().unwrap())
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(self.0[0..6].try_into().unwrap())
    }

    pub const fn types(&self) -> (PkmType, PkmType) {
        (
            PkmType::from_byte(self.0[6]).expect("Gen 9 type 1 should be valid"),
            PkmType::from_byte(self.0[7]).expect("Gen 9 type 2 should be valid"),
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

pub struct PersonalTableGen9(Vec<PersonalInfoGen9>);

impl PersonalTableGen9 {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let count = bytes.len() / ENTRY_SIZE;
        let mut entries = Vec::<PersonalInfoGen9>::with_capacity(count);
        for i in 0..count {
            let offset = i * ENTRY_SIZE;
            entries.push(PersonalInfoGen9::from_pkl_bytes(
                bytes[offset..offset + ENTRY_SIZE]
                    .try_into()
                    .expect("incorrect slice length for gen 9 personal table"),
            ));
        }
        Self(entries)
    }

    pub fn get_personal_info(
        &self,
        national_dex: u16,
        forme_index: u16,
    ) -> Option<&PersonalInfoGen9> {
        self.get_game_index(national_dex, forme_index)
            .and_then(|game_index| self.0.get(game_index as usize))
    }

    pub fn get_form_stats(&self, national_dex: u16, forme_index: u16) -> Option<Stats8> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoGen9::stats)
    }
}

impl PersonalTable for PersonalTableGen9 {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoGen9::types)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.0
            .get(national_dex as usize)
            .map(|info| info.form_index(national_dex, forme_index))
    }
}

pub struct MetadataTableGen9 {
    personal: PersonalTableGen9,
    learnsets: Vec<Learnset>,
}

impl MetadataTableGen9 {
    pub fn get_base_stats(&self, national_dex: u16, forme_index: u16) -> Option<Stats8> {
        self.personal.get_form_stats(national_dex, forme_index)
    }
}

impl MetadataTable for MetadataTableGen9 {
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
