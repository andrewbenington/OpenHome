use std::sync::LazyLock;

use pkm_rs_types::{PkmType, Stats8};

use crate::species::form_metadata::FormMetadata;
use crate::species::form_metadata::gen9::PersonalInfoGen9;

// from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
static ZA_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal_za");
pub static ZA_PERSONAL_TABLE: LazyLock<FormMetadataScarletViolet> =
    LazyLock::new(|| FormMetadataScarletViolet::from_pkl_bytes(ZA_PERSONAL_BYTES));

pub struct PersonalInfoZa(PersonalInfoGen9, Vec<u8>);

const ENTRY_SIZE: usize = 0x50;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct ZaFormIndex(u16);

impl PersonalInfoZa {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let (gen9_bytes, sv_bytes) = bytes.split_at(42);
        Self(
            PersonalInfoGen9::from_pkl_bytes(gen9_bytes.try_into().unwrap()),
            sv_bytes.to_vec(),
        )
    }
}

impl FormMetadata for PersonalInfoZa {
    type FormIndex = ZaFormIndex;

    fn stats(&self) -> Stats8 {
        self.0.stats()
    }

    fn types(&self) -> (PkmType, PkmType) {
        self.0.types()
    }

    fn form_stats_index(&self) -> Option<u16> {
        self.0.form_stats_index()
    }

    fn form_index(&self, national_dex: u16, form_index: u16) -> ZaFormIndex {
        if let Some(form_stats_index) = self.form_stats_index()
            && form_index > 0
            && form_index < self.form_count() as u16
        {
            ZaFormIndex(form_stats_index + form_index - 1)
        } else {
            ZaFormIndex(national_dex)
        }
    }

    fn has_form(&self, form_index: u16) -> bool {
        form_index > 0
            && self.form_stats_index().is_some()
            && form_index < self.0.form_count() as u16
    }

    fn form_count(&self) -> u8 {
        self.0.form_count()
    }
}
pub struct FormMetadataScarletViolet(Vec<PersonalInfoZa>);

impl FormMetadataScarletViolet {
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

    pub fn get_form_index(&self, national_dex: u16, forme_index: u16) -> Option<ZaFormIndex> {
        self.0
            .get(national_dex as usize)
            .map(|info| info.form_index(national_dex, forme_index))
    }

    pub fn get_form_stats(&self, national_dex: u16, forme_index: u16) -> Option<Stats8> {
        self.get_form_index(national_dex, forme_index)
            .and_then(|form_index| self.0.get(form_index.0 as usize))
            .map(|info| info.stats())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_form_index() {
        let bytes = include_bytes!("pkhex_bin/personal_za");
        let table = FormMetadataScarletViolet::from_pkl_bytes(bytes);
        let form_index = table.get_form_index(1, 0);
        assert_eq!(form_index.map(|i| i.0), Some(1));

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
