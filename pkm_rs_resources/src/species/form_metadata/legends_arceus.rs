use pkm_rs_types::{PkmType, Stats8};
use std::sync::LazyLock;

use crate::species::form_metadata::{PersonalTable, gen9::PersonalInfoGen9};

// from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
static LA_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal_la");
pub static LA_PERSONAL_TABLE: LazyLock<PersonalTableLa> =
    LazyLock::new(|| PersonalTableLa::from_pkl_bytes(LA_PERSONAL_BYTES));

pub struct PersonalInfoLa(PersonalInfoGen9);

const ENTRY_SIZE: usize = 0x50;

impl PersonalInfoLa {
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

pub struct PersonalTableLa(Vec<PersonalInfoLa>);

impl PersonalTableLa {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let count = bytes.len() / ENTRY_SIZE;
        let mut entries = Vec::<PersonalInfoLa>::with_capacity(count);
        for i in 0..count {
            let offset = i * ENTRY_SIZE;
            entries.push(PersonalInfoLa::from_pkl_bytes(
                &bytes[offset..offset + ENTRY_SIZE],
            ));
        }
        Self(entries)
    }

    pub fn get_personal_info(
        &self,
        national_dex: u16,
        forme_index: u16,
    ) -> Option<&PersonalInfoLa> {
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
            .map(PersonalInfoLa::stats)
    }
}

impl PersonalTable for PersonalTableLa {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoLa::types)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.get_form_index(national_dex, forme_index)
    }

    fn get_levelup_learnsets() -> &'static Vec<crate::moves::levelup::Learnset> {
        todo!()
    }
}
