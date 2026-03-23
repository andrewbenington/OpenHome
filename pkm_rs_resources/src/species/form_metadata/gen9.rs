use pkm_rs_types::{PkmType, Stats8};

use crate::abilities::AbilityIndex;

pub struct PersonalInfoGen9([u8; 42]);

impl PersonalInfoGen9 {
    pub const fn from_pkl_bytes(bytes: [u8; 42]) -> Self {
        Self(bytes)
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

    pub fn has_form(&self, form_index: u16) -> bool {
        form_index > 0 && self.form_stats_index().is_some() && form_index < self.form_count() as u16
    }

    pub fn ability1(&self) -> AbilityIndex {
        AbilityIndex::new(u16::from_le_bytes([self.0[0x12], self.0[0x13]]))
            .expect("Gen 9 ability 1 should be valid")
    }

    pub fn ability2(&self) -> AbilityIndex {
        AbilityIndex::from_index(u16::from_le_bytes([self.0[0x14], self.0[0x15]]))
            .expect("Gen 9 ability 2 should be valid")
    }

    pub fn ability_hidden(&self) -> AbilityIndex {
        AbilityIndex::from_index(u16::from_le_bytes([self.0[0x16], self.0[0x17]]))
            .expect("Gen 9 hidden ability should be valid")
    }

    pub const fn form_count(&self) -> u8 {
        self.0[0x1A]
    }
}
