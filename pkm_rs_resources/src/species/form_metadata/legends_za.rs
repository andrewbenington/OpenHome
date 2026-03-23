use std::sync::LazyLock;

use pkm_rs_types::{PkmType, Stats8};

use crate::species::form_metadata::{PersonalTable, gen9::PersonalInfoGen9};

// from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
static ZA_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal_za");
pub static ZA_PERSONAL_TABLE: LazyLock<PersonalTableZa> =
    LazyLock::new(|| PersonalTableZa::from_pkl_bytes(ZA_PERSONAL_BYTES));

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoZa(PersonalInfoGen9);

const ENTRY_SIZE: usize = 0x50;

impl PersonalInfoZa {
    pub const fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let shared_gen9_bytes: &[u8; 42] = bytes
            .as_array()
            .expect("Expected entry size to be 0x50 bytes");

        Self(PersonalInfoGen9::from_pkl_bytes(*shared_gen9_bytes))
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

#[derive(Debug, Clone)]
pub struct PersonalTableZa(Vec<PersonalInfoZa>);

impl PersonalTableZa {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let count = bytes.len() / ENTRY_SIZE;
        let mut entries = Vec::<PersonalInfoZa>::with_capacity(count);
        for i in 0..count {
            let offset = i * ENTRY_SIZE;
            entries.push(PersonalInfoZa::from_pkl_bytes(
                &bytes[offset..offset + ENTRY_SIZE],
            ));
        }
        Self(entries)
    }

    pub fn get_personal_info(
        &self,
        national_dex: u16,
        forme_index: u16,
    ) -> Option<&PersonalInfoZa> {
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
            .map(PersonalInfoZa::stats)
    }
}

impl PersonalTable for PersonalTableZa {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoZa::types)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.get_form_index(national_dex, forme_index)
    }

    fn get_levelup_learnsets() -> &'static Vec<crate::moves::levelup::Learnset> {
        todo!()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_form_index() {
        let bytes = include_bytes!("pkhex_bin/personal_za");
        let table = PersonalTableZa::from_pkl_bytes(bytes);
        let form_index = table.get_form_index(1, 0);
        assert_eq!(form_index, Some(1));

        // Bulbasaur
        assert_eq!(
            table.get_form_stats(1, 0),
            Some(Stats8::new(45, 49, 49, 65, 65, 45))
        );

        // Unovan Lilligant
        assert_eq!(
            table.get_form_stats(549, 0),
            Some(Stats8::new(70, 60, 75, 110, 75, 90))
        );

        // Hisuian Lilligant
        assert_eq!(
            table.get_form_stats(549, 1),
            Some(Stats8::new(70, 105, 75, 50, 75, 105))
        );

        // Panpour
        assert_eq!(
            table.get_form_stats(515, 0),
            Some(Stats8::new(50, 53, 48, 53, 48, 64))
        );
    }
}
