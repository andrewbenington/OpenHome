use pkm_rs_types::{NationalDex, PkmType, Stats8};
use std::sync::LazyLock;

use crate::{
    moves::levelup::EMERALD_LEVELUP_LEARNSETS,
    species::form_metadata::{PersonalTable, gen3::PersonalInfoGen3},
};

// from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
static EMERALD_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal_e");
pub static EMERALD_PERSONAL_TABLE: LazyLock<PersonalTableEmerald> =
    LazyLock::new(|| PersonalTableEmerald::from_pkl_bytes(EMERALD_PERSONAL_BYTES));

pub struct PersonalInfoEmerald(PersonalInfoGen3);

const ENTRY_SIZE: usize = 0x1c;

impl PersonalInfoEmerald {
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

pub struct PersonalTableEmerald(Vec<PersonalInfoEmerald>);

impl PersonalTableEmerald {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let count = bytes.len() / ENTRY_SIZE;
        let mut entries = Vec::<PersonalInfoEmerald>::with_capacity(count);
        for i in 0..count {
            let offset = i * ENTRY_SIZE;
            entries.push(PersonalInfoEmerald::from_pkl_bytes(
                &bytes[offset..offset + ENTRY_SIZE],
            ));
        }
        Self(entries)
    }

    pub fn get_personal_info(
        &self,
        national_dex: u16,
        forme_index: u16,
    ) -> Option<&PersonalInfoEmerald> {
        if forme_index == 0 {
            self.0.get(national_dex as usize)
        } else {
            None
        }
    }

    pub fn get_form_stats(&self, national_dex: u16, forme_index: u16) -> Option<Stats8> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoEmerald::stats)
    }
}

const UNOWN_Z: u16 = 25;

impl PersonalTable for PersonalTableEmerald {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoEmerald::types)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        if forme_index == 0 || (national_dex == NationalDex::Unown && forme_index <= UNOWN_Z) {
            Some(national_dex)
        } else {
            None
        }
    }

    fn get_levelup_learnsets() -> &'static Vec<crate::moves::levelup::Learnset> {
        &EMERALD_LEVELUP_LEARNSETS
    }
}
