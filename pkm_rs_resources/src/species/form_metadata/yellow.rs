use pkm_rs_types::{PkmType, StatsPreSplit};
use std::sync::LazyLock;

use crate::{
    moves::levelup::{Learnset, YELLOW_LEVELUP_LEARNSETS},
    species::form_metadata::{PersonalTable, gen1::PersonalInfoGen1},
};

// from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
static YELLOW_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal_y");
pub static YELLOW_PERSONAL_TABLE: LazyLock<PersonalTableYellow> =
    LazyLock::new(|| PersonalTableYellow::from_pkl_bytes(YELLOW_PERSONAL_BYTES));

pub struct PersonalInfoYellow(PersonalInfoGen1);

const ENTRY_SIZE: usize = 0x1c;

impl PersonalInfoYellow {
    fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let (gen1_bytes, _) = bytes.split_at(28);
        Self(PersonalInfoGen1::from_pkl_bytes(
            gen1_bytes.try_into().unwrap(),
        ))
    }

    pub fn stats(&self) -> StatsPreSplit {
        self.0.stats()
    }

    pub fn types(&self) -> (PkmType, PkmType) {
        self.0.types()
    }
}

pub struct PersonalTableYellow(Vec<PersonalInfoYellow>);

impl PersonalTableYellow {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let count = bytes.len() / ENTRY_SIZE;
        let mut entries = Vec::<PersonalInfoYellow>::with_capacity(count);
        for i in 0..count {
            let offset = i * ENTRY_SIZE;
            entries.push(PersonalInfoYellow::from_pkl_bytes(
                &bytes[offset..offset + ENTRY_SIZE],
            ));
        }
        Self(entries)
    }

    pub fn get_personal_info(
        &self,
        national_dex: u16,
        forme_index: u16,
    ) -> Option<&PersonalInfoYellow> {
        if forme_index == 0 {
            self.0.get(national_dex as usize)
        } else {
            None
        }
    }

    pub fn get_form_stats(&self, national_dex: u16, forme_index: u16) -> Option<StatsPreSplit> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoYellow::stats)
    }
}

impl PersonalTable for PersonalTableYellow {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoYellow::types)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        if forme_index == 0 {
            Some(national_dex)
        } else {
            None
        }
    }

    fn get_levelup_learnsets() -> &'static Vec<Learnset> {
        &YELLOW_LEVELUP_LEARNSETS
    }
}
