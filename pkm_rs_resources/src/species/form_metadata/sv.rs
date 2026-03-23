use pkm_rs_types::{PkmType, Stats8};
use std::sync::LazyLock;

use crate::moves::levelup::SV_LEVELUP_LEARNSETS;

use crate::species::form_metadata::Learnset;
use crate::species::form_metadata::{PersonalTable, gen9::PersonalInfoGen9};

#[cfg(test)]
use crate::result::Result;
#[cfg(test)]
use crate::species::SpeciesAndForme;

// from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
static SV_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal_sv");
pub static SV_PERSONAL_TABLE: LazyLock<PersonalTableSv> =
    LazyLock::new(|| PersonalTableSv::from_pkl_bytes(SV_PERSONAL_BYTES));

pub struct PersonalInfoSv(PersonalInfoGen9);

const ENTRY_SIZE: usize = 0x50;

impl PersonalInfoSv {
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

pub struct PersonalTableSv(Vec<PersonalInfoSv>);

impl PersonalTableSv {
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

    pub fn get_personal_info(
        &self,
        national_dex: u16,
        forme_index: u16,
    ) -> Option<&PersonalInfoSv> {
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
            .map(PersonalInfoSv::stats)
    }
}

impl PersonalTable for PersonalTableSv {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoSv::types)
    }

    fn get_levelup_learnset(
        &self,
        national_dex: u16,
        forme_index: u16,
    ) -> Option<&'static Learnset> {
        SV_LEVELUP_LEARNSETS.get(self.get_form_index(national_dex, forme_index)? as usize)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.get_form_index(national_dex, forme_index)
    }

    fn get_levelup_learnsets() -> &'static Vec<Learnset> {
        todo!()
    }
}

#[cfg(test)]
pub struct FormMetadataSv(SpeciesAndForme);

#[cfg(test)]
impl FormMetadataSv {
    pub const fn new(species_and_forme: SpeciesAndForme) -> Self {
        Self(species_and_forme)
    }

    pub fn game_index(&self) -> Option<u16> {
        SV_PERSONAL_TABLE.get_form_index(self.0.get_ndex().get(), self.0.get_forme_index())
    }

    fn table_entry(&self) -> Option<&PersonalInfoSv> {
        self.game_index()
            .and_then(|form_index| SV_PERSONAL_TABLE.0.get(form_index as usize))
    }

    pub fn get_stats(&self) -> Option<Stats8> {
        self.table_entry().map(|info| info.stats())
    }

    pub fn get_levelup_learnset(&self) -> Option<&'static Learnset> {
        self.game_index()
            .and_then(|form_index| SV_LEVELUP_LEARNSETS.get(form_index as usize))
    }
}

#[cfg(test)]
mod tests {
    use crate::moves::levelup::LearnsetCondition;

    use super::*;

    #[test]
    fn valid_stats() -> Result<()> {
        let table = &SV_PERSONAL_TABLE;
        let form_index = table.get_form_index(1, 0);
        assert_eq!(form_index, Some(1));

        // Bulbasaur
        let bulbasaur_metadata = FormMetadataSv::new(SpeciesAndForme::new(1, 0)?);
        assert_eq!(
            bulbasaur_metadata.get_stats(),
            Some(Stats8::new(45, 49, 49, 65, 65, 45))
        );

        // Unovan Lilligant
        let lilligant_unova_metadata = FormMetadataSv::new(SpeciesAndForme::new(549, 0)?);
        assert_eq!(
            lilligant_unova_metadata.get_stats(),
            Some(Stats8::new(70, 60, 75, 110, 75, 90))
        );

        // Hisuian Lilligant
        let lilligant_hisui_metadata = FormMetadataSv::new(SpeciesAndForme::new(549, 1)?);
        assert_eq!(
            lilligant_hisui_metadata.get_stats(),
            Some(Stats8::new(70, 105, 75, 50, 75, 105))
        );

        for learnset_move in &lilligant_hisui_metadata
            .get_levelup_learnset()
            .expect("hisui lilligant metadata is present")
            .moves
        {
            println!(
                "move: {:?} - {}",
                learnset_move.condition,
                learnset_move
                    .move_id
                    .get_metadata()
                    .map_or("(invalid_move)", |m| m.name),
            );
        }

        // Panpour
        assert_eq!(
            table.get_form_stats(515, 0),
            Some(Stats8::new(50, 53, 48, 53, 48, 64))
        );

        Ok(())
    }

    #[test]
    fn level_up_learnset() -> Result<()> {
        // Hisuian Lilligant
        let lilligant_hisui_metadata = FormMetadataSv::new(SpeciesAndForme::new(549, 1)?);
        let lilligant_hisui_learnset = lilligant_hisui_metadata
            .get_levelup_learnset()
            .expect("hisui lilligant metadata is present");

        const VICTORY_DANCE: u16 = 837;

        let evolution_move = lilligant_hisui_learnset.moves.iter().find(|m| {
            m.condition == LearnsetCondition::Evolution && u16::from(m.move_id) == VICTORY_DANCE
        });
        assert!(
            evolution_move.is_some(),
            "Hisuian Lilligant should learn Victory Dance upon evolution"
        );

        Ok(())
    }

    #[test]
    fn valid_types() {
        let table = &SV_PERSONAL_TABLE;

        // Bulbasaur
        assert_eq!(table.0[1].types(), (PkmType::Grass, PkmType::Poison));

        // Unovan Lilligant
        assert_eq!(table.0[549].types(), (PkmType::Grass, PkmType::Grass));

        // Hisuian Lilligant
        assert_eq!(table.0[549].types(), (PkmType::Grass, PkmType::Grass));

        // Panpour
        assert_eq!(table.0[515].types(), (PkmType::Water, PkmType::Water));
    }
}
