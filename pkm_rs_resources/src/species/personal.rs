use pkm_rs_types::{Stats8, pkl_file::PklFileData};

use crate::stats::Stats;

static SV_PERSONAL_BYTES: &'static [u8] = include_bytes!("pkhex_bin/personal_sv");

pub struct PersonalInfoSv(Vec<u8>);

const ENTRY_SIZE: usize = 0x50;

pub struct SvFormIndex(u16);

impl PersonalInfoSv {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(bytes.to_vec())
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(self.0[0..6].try_into().unwrap())
    }

    fn form_stats_index(&self) -> Option<u16> {
        let stored_index = i16::from_le_bytes(self.0[0x18..0x1A].try_into().unwrap());
        if stored_index == -1 {
            None
        } else {
            Some(stored_index as u16)
        }
    }

    pub fn form_index(&self, national_dex: u16, form_index: u16) -> SvFormIndex {
        if let Some(form_stats_index) = self.form_stats_index()
            && form_index > 0
            && form_index < self.form_count() as u16
        {
            SvFormIndex(form_stats_index + form_index - 1)
        } else {
            SvFormIndex(national_dex)
        }
    }

    pub fn has_form(&self, form_index: u16) -> bool {
        return form_index > 0
            && self.form_stats_index().is_some()
            && form_index < self.form_count() as u16;
    }

    pub fn form_count(&self) -> u8 {
        self.0[0x1A]
    }
}

pub struct PersonalInfoTableSv(Vec<PersonalInfoSv>);

impl PersonalInfoTableSv {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let count = bytes.len() / ENTRY_SIZE;
        let mut entries = Vec::<PersonalInfoSv>::with_capacity(count);
        for i in 0..count {
            let offset = i * ENTRY_SIZE;
            entries.push(PersonalInfoSv::from_pkl_bytes(
                &bytes[offset..offset + ENTRY_SIZE],
            ));
        }
        Self(entries)
    }

    pub fn get_form_index(&self, national_dex: u16, forme_index: u16) -> Option<SvFormIndex> {
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
        let bytes = include_bytes!("pkhex_bin/personal_sv");
        let table = PersonalInfoTableSv::from_pkl_bytes(bytes);
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

        let all_learnsets = crate::moves::levelup::get_sv_learnsets();
        let learnset = all_learnsets
            .get(table.get_form_index(549, 1).unwrap().0 as usize)
            .unwrap();

        for learnset_move in &learnset.moves {
            println!(
                "move: {:?} - {}",
                learnset_move.condition,
                learnset_move
                    .move_id
                    .get_metadata()
                    .map_or("(invalid_move)", |m| m.name),
            );
        }
    }
}
