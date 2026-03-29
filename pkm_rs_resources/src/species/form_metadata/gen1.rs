use std::sync::LazyLock;

use pkm_rs_types::{PkmType, StatsPreSplit};

use crate::{
    levelup::Learnset,
    species::form_metadata::{MetadataTable, PersonalTable},
};

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoGen1([u8; 28]);

impl PersonalInfoGen1 {
    pub const fn from_pkl_bytes(bytes: [u8; 28]) -> Self {
        Self(bytes)
    }

    pub fn stats(&self) -> StatsPreSplit {
        StatsPreSplit::from_bytes_u8(self.0[0..5].try_into().unwrap())
    }

    pub const fn types(&self) -> (PkmType, PkmType) {
        (
            PkmType::from_byte_gen12(self.0[6]).expect("Gen 1 type 1 should be valid"),
            PkmType::from_byte_gen12(self.0[7]).expect("Gen 1 type 2 should be valid"),
        )
    }
}

const ENTRY_SIZE: usize = 0x1c;

pub struct PersonalTableGen1(Vec<PersonalInfoGen1>);

impl PersonalTableGen1 {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let count = bytes.len() / ENTRY_SIZE;
        let mut entries = Vec::<PersonalInfoGen1>::with_capacity(count);
        for i in 0..count {
            let offset = i * ENTRY_SIZE;
            entries.push(PersonalInfoGen1::from_pkl_bytes(
                bytes[offset..offset + ENTRY_SIZE]
                    .try_into()
                    .expect("incorrect slice length for gen 1 personal table"),
            ));
        }
        Self(entries)
    }

    pub fn get_personal_info(
        &self,
        national_dex: u16,
        forme_index: u16,
    ) -> Option<&PersonalInfoGen1> {
        if forme_index == 0 {
            self.0.get(national_dex as usize)
        } else {
            None
        }
    }

    pub fn get_form_stats(&self, national_dex: u16, forme_index: u16) -> Option<StatsPreSplit> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoGen1::stats)
    }
}

impl PersonalTable for PersonalTableGen1 {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoGen1::types)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        if forme_index == 0 {
            Some(national_dex)
        } else {
            None
        }
    }
}

pub struct MetadataTableGen1 {
    personal: PersonalTableGen1,
    learnsets: Vec<Learnset>,
}

impl MetadataTableGen1 {
    pub fn get_base_stats(&self, national_dex: u16, forme_index: u16) -> Option<StatsPreSplit> {
        self.personal.get_form_stats(national_dex, forme_index)
    }
}

impl MetadataTable for MetadataTableGen1 {
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

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal

const RED_BLUE_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal/personal_rb");
const RED_BLUE_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/levelup/lvlmove_rb.pkl");

pub static METADATA_TABLE_RED_BLUE: LazyLock<MetadataTableGen1> =
    LazyLock::new(|| MetadataTableGen1 {
        personal: PersonalTableGen1::from_pkl_bytes(RED_BLUE_PERSONAL_BYTES),
        learnsets: Learnset::all_from_pkl_bytes(RED_BLUE_LEVELUP_BYTES),
    });

const YELLOW_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal/personal_y");
const YELLOW_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/levelup/lvlmove_y.pkl");

pub static METADATA_TABLE_YELLOW: LazyLock<MetadataTableGen1> =
    LazyLock::new(|| MetadataTableGen1 {
        personal: PersonalTableGen1::from_pkl_bytes(YELLOW_PERSONAL_BYTES),
        learnsets: Learnset::all_from_pkl_bytes(YELLOW_LEVELUP_BYTES),
    });
