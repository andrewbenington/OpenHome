use pkm_rs_types::{PkmType, Stats8};
use std::sync::LazyLock;

use crate::species::form_metadata::{PersonalTable, gen3::PersonalInfoGen3};

// from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
static FIRERED_LEAFGREEN_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal/personal_fr");
pub static FIRERED_LEAFGREEN_PERSONAL_TABLE: LazyLock<PersonalTableFireRedLeafGreen> =
    LazyLock::new(|| {
        PersonalTableFireRedLeafGreen::from_pkl_bytes(FIRERED_LEAFGREEN_PERSONAL_BYTES)
    });

pub struct PersonalInfoFireRedLeafGreen(PersonalInfoGen3);

const ENTRY_SIZE: usize = 0x1c;

impl PersonalInfoFireRedLeafGreen {
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

pub struct PersonalTableFireRedLeafGreen(Vec<PersonalInfoFireRedLeafGreen>);

impl PersonalTableFireRedLeafGreen {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let count = bytes.len() / ENTRY_SIZE;
        let mut entries = Vec::<PersonalInfoFireRedLeafGreen>::with_capacity(count);
        for i in 0..count {
            let offset = i * ENTRY_SIZE;
            entries.push(PersonalInfoFireRedLeafGreen::from_pkl_bytes(
                &bytes[offset..offset + ENTRY_SIZE],
            ));
        }
        Self(entries)
    }

    pub fn get_personal_info(
        &self,
        national_dex: u16,
        forme_index: u16,
    ) -> Option<&PersonalInfoFireRedLeafGreen> {
        if forme_index == 0 {
            self.0.get(national_dex as usize)
        } else {
            None
        }
    }

    pub fn get_form_stats(&self, national_dex: u16, forme_index: u16) -> Option<Stats8> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoFireRedLeafGreen::stats)
    }
}

impl PersonalTable for PersonalTableFireRedLeafGreen {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoFireRedLeafGreen::types)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        if forme_index == 0 {
            Some(national_dex)
        } else {
            None
        }
    }
}
