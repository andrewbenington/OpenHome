use pkm_rs_types::{PkmType, Stats8};
use std::sync::LazyLock;

use crate::{
    log,
    moves::levelup::RUBY_SAPPHIRE_LEVELUP_LEARNSETS,
    species::form_metadata::{PersonalTable, gen3::PersonalInfoGen3},
};

// from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
static RUBY_SAPPHIRE_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal_rs");
pub static RUBY_SAPPHIRE_PERSONAL_TABLE: LazyLock<PersonalTableRubySapphire> =
    LazyLock::new(|| PersonalTableRubySapphire::from_pkl_bytes(RUBY_SAPPHIRE_PERSONAL_BYTES));

pub struct PersonalInfoRubySapphire(PersonalInfoGen3);

const ENTRY_SIZE: usize = 0x1c;

impl PersonalInfoRubySapphire {
    fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let (gen3_bytes, _) = bytes.split_at(28);
        Self(PersonalInfoGen3::from_pkl_bytes(
            gen3_bytes.try_into().unwrap(),
        ))
    }

    pub fn stats(&self) -> Stats8 {
        self.0.stats()
    }

    pub fn types(&self) -> (PkmType, PkmType) {
        self.0.types()
    }
}

pub struct PersonalTableRubySapphire(Vec<PersonalInfoRubySapphire>);

impl PersonalTableRubySapphire {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        log!("from_pkl_bytes RubySapphire: {}", bytes.len());
        let count = bytes.len() / ENTRY_SIZE;
        let mut entries = Vec::<PersonalInfoRubySapphire>::with_capacity(count);
        for i in 0..count {
            let offset = i * ENTRY_SIZE;
            entries.push(PersonalInfoRubySapphire::from_pkl_bytes(
                &bytes[offset..offset + ENTRY_SIZE],
            ));
        }
        log!(
            "loaded {} entries for RubySapphire personal table",
            entries.len()
        );
        Self(entries)
    }

    pub fn get_personal_info(
        &self,
        national_dex: u16,
        forme_index: u16,
    ) -> Option<&PersonalInfoRubySapphire> {
        if forme_index == 0 {
            self.0.get(national_dex as usize)
        } else {
            None
        }
    }

    pub fn get_form_stats(&self, national_dex: u16, forme_index: u16) -> Option<Stats8> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoRubySapphire::stats)
    }
}

impl PersonalTable for PersonalTableRubySapphire {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoRubySapphire::types)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        if forme_index == 0 {
            Some(national_dex)
        } else {
            None
        }
    }

    fn get_levelup_learnsets() -> &'static Vec<crate::moves::levelup::Learnset> {
        &RUBY_SAPPHIRE_LEVELUP_LEARNSETS
    }
}
