use pkm_rs_types::{PkmType, Stats8};
use std::sync::LazyLock;

use crate::{
    moves::levelup::{Learnset, SWSH_LEVELUP_LEARNSETS},
    species::form_metadata::{PersonalTable, gen9::PersonalInfoGen9},
};

// from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
static SWSH_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal_swsh");
pub static SWSH_PERSONAL_TABLE: LazyLock<PersonalTableSwSh> =
    LazyLock::new(|| PersonalTableSwSh::from_pkl_bytes(SWSH_PERSONAL_BYTES));

pub struct PersonalInfoSwSh(PersonalInfoGen9);

const ENTRY_SIZE: usize = 0x50;

impl PersonalInfoSwSh {
    fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let (gen9_bytes, _) = bytes.split_at(42);
        Self(PersonalInfoGen9::from_pkl_bytes(
            gen9_bytes.try_into().unwrap(),
        ))
    }

    pub fn stats(&self) -> Stats8 {
        self.0.stats()
    }

    pub fn types(&self) -> (PkmType, PkmType) {
        self.0.types()
    }

    pub fn form_index(&self, national_dex: u16, form_index: u16) -> u16 {
        self.0.form_index(national_dex, form_index)
    }
}

pub struct PersonalTableSwSh(Vec<PersonalInfoSwSh>);

impl PersonalTableSwSh {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let count = bytes.len() / ENTRY_SIZE;
        let mut entries = Vec::<PersonalInfoSwSh>::with_capacity(count);
        for i in 0..count {
            let offset = i * ENTRY_SIZE;
            entries.push(PersonalInfoSwSh::from_pkl_bytes(
                &bytes[offset..offset + ENTRY_SIZE],
            ));
        }
        Self(entries)
    }

    pub fn get_personal_info(
        &self,
        national_dex: u16,
        forme_index: u16,
    ) -> Option<&PersonalInfoSwSh> {
        self.get_form_index(national_dex, forme_index)
            .and_then(|form_index| self.0.get(form_index as usize))
    }

    pub fn get_form_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.0
            .get(national_dex as usize)
            .map(|info| info.form_index(national_dex, forme_index))
    }

    pub fn get_form_stats(&self, national_dex: u16, forme_index: u16) -> Option<Stats8> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoSwSh::stats)
    }
}

impl PersonalTable for PersonalTableSwSh {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoSwSh::types)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.get_form_index(national_dex, forme_index)
    }

    fn get_levelup_learnsets() -> &'static Vec<Learnset> {
        &SWSH_LEVELUP_LEARNSETS
    }
}
