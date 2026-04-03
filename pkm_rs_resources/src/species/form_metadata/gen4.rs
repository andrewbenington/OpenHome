use pkm_rs_types::{NationalDex, PkmType, Stats8, log::ExpectLog};

use crate::{
    levelup::{LearnsetFileReader, LearnsetReader},
    species::{
        form,
        form_metadata::{BaseStats, MetadataTable, PersonalInfo, PersonalTable},
    },
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal
const DIAMOND_PEARL_PERSONAL_FILE_SIZE: usize = 22044;
const DIAMOND_PEARL_PERSONAL_BYTES: &[u8; DIAMOND_PEARL_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_dp");

const PLATINUM_HGSS_PERSONAL_FILE_SIZE: usize = 22352;
const PLATINUM_PERSONAL_BYTES: &[u8; PLATINUM_HGSS_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_pt");
const HGSS_PERSONAL_BYTES: &[u8; PLATINUM_HGSS_PERSONAL_FILE_SIZE] =
    include_bytes!("pkhex_bin/personal/personal_hgss");

const DIAMOND_PEARL_LEVELUP_SIZE: usize = 20799;
const DIAMOND_PEARL_LEVELUP_BYTES: &[u8; DIAMOND_PEARL_LEVELUP_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_dp.pkl");

const PLATINUM_LEVELUP_SIZE: usize = 21281;
const PLATINUM_LEVELUP_BYTES: &[u8; PLATINUM_LEVELUP_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_pt.pkl");

const HGSS_LEVELUP_SIZE: usize = 21314;
const HGSS_LEVELUP_BYTES: &[u8; HGSS_LEVELUP_SIZE] =
    include_bytes!("pkhex_bin/levelup/lvlmove_hgss.pkl");

const GEN4_ENTRY_SIZE: usize = 0x2C;

pub static METADATA_TABLE_DIAMOND_PEARL: MetadataTableDiamondPearl = MetadataTableDiamondPearl {
    personal: PersonalTableDiamondPearl::from_pkl_bytes(DIAMOND_PEARL_PERSONAL_BYTES),
    learnsets: LearnsetFileReader::from_pkl_bytes(DIAMOND_PEARL_LEVELUP_BYTES),
};

pub static METADATA_TABLE_PLATINUM: MetadataTablePlatinumHgss = MetadataTablePlatinumHgss {
    personal: PersonalTablePlatinumHgss::from_pkl_bytes(PLATINUM_PERSONAL_BYTES),
    learnsets: LearnsetFileReader::from_pkl_bytes(PLATINUM_LEVELUP_BYTES),
};
pub static METADATA_TABLE_HGSS: MetadataTablePlatinumHgss = MetadataTablePlatinumHgss {
    personal: PersonalTablePlatinumHgss::from_pkl_bytes(HGSS_PERSONAL_BYTES),
    learnsets: LearnsetFileReader::from_pkl_bytes(HGSS_LEVELUP_BYTES),
};

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoGen4([u8; GEN4_ENTRY_SIZE]);

impl PersonalInfoGen4 {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(
            bytes
                .try_into()
                .expect_log("bad length for PersonalInfoGen4"),
        )
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(
            self.0[0..6]
                .try_into()
                .expect_log("bad length for PersonalInfoGen4::stats"),
        )
    }

    pub fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        if form_index == 0 {
            return Some(national_dex);
        }

        // Spiky Eared Pichu's metadata is zeroed out, so if this is HGSS return Pichu's data.
        if Self::supports_form(national_dex, form_index)
            && national_dex == NationalDex::Pichu as u16
        {
            Some(NationalDex::Pichu as u16)
        } else if Self::supports_form(national_dex, form_index)
            && let Some(forms_offset) = self.forms_offset()
            && form_index < self.form_count() as u16
        {
            Some(forms_offset + form_index - 1)
        } else {
            None
        }
    }

    pub fn forms_offset(&self) -> Option<u16> {
        let stored_index = i16::from_le_bytes(
            self.0[0x2a..0x2c]
                .try_into()
                .expect_log("bad length for i16 in PersonalInfoGen4::forms_offset"),
        );
        if stored_index == -1 {
            None
        } else {
            Some(stored_index as u16)
        }
    }

    fn supports_form(national_dex: u16, form_index: u16) -> bool {
        let Ok(national_dex) = NationalDex::try_from(national_dex) else {
            return false;
        };
        match national_dex {
            NationalDex::Pichu => form_index <= form::PICHU_SPIKY_EARED,
            NationalDex::Unown => form_index <= form::UNOWN_QUESTION,
            NationalDex::Castform => form_index <= form::CASTFORM_SNOWY,
            NationalDex::Deoxys => form_index <= form::DEOXYS_SPEED,
            NationalDex::Burmy => form_index <= form::BURMY_TRASH,
            NationalDex::Wormadam => form_index <= form::WORMADAM_TRASH,
            NationalDex::Mothim => form_index <= form::MOTHIM_TRASH,
            NationalDex::Cherrim => form_index <= form::CHERRIM_SUNSHINE,
            NationalDex::Shellos => form_index <= form::SHELLOS_EAST_SEA,
            NationalDex::Gastrodon => form_index <= form::GASTRODON_EAST_SEA,
            NationalDex::Rotom => form_index <= form::ROTOM_MOW,
            NationalDex::Arceus => {
                form_index != form::ARCEUS_CURSE_GEN4 && form_index <= form::ARCEUS_DARK_GEN4
            }
            _ => form_index == 0,
        }
    }

    pub const fn form_count(&self) -> u8 {
        self.0[0x29]
    }
}

impl PersonalInfo for PersonalInfoGen4 {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Arceus;

    fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self::from_pkl_bytes(bytes)
    }

    fn stats(&self) -> BaseStats {
        BaseStats::Modern(self.stats())
    }

    fn types_fallible(&self) -> (Option<PkmType>, Option<PkmType>) {
        (PkmType::from_byte(self.0[6]), PkmType::from_byte(self.0[7]))
    }

    fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        self.game_index_for_form(national_dex, form_index)
    }

    fn source_name(&self) -> &'static str {
        "Gen 4"
    }
}

pub type PersonalTableDiamondPearl =
    PersonalTable<PersonalInfoGen4, DIAMOND_PEARL_PERSONAL_FILE_SIZE, GEN4_ENTRY_SIZE>;

#[derive(Debug)]
pub struct MetadataTableDiamondPearl {
    personal: PersonalTableDiamondPearl,
    learnsets: LearnsetFileReader,
}

impl MetadataTable for MetadataTableDiamondPearl {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, Option<PkmType>)> {
        self.personal.get_types(national_dex, forme_index)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.personal.get_game_index(national_dex, forme_index)
    }

    fn get_levelup_learnset(&self, national_dex: u16, forme_index: u16) -> Option<LearnsetReader> {
        self.learnsets
            .learnset_at_index(self.get_game_index(national_dex, forme_index)?)
    }

    fn get_base_stats(&self, national_dex: u16, forme_index: u16) -> Option<BaseStats> {
        self.personal.get_base_stats(national_dex, forme_index)
    }

    fn get_source_name(&self) -> &'static str {
        "Diamond/Pearl"
    }
}

pub type PersonalTablePlatinumHgss =
    PersonalTable<PersonalInfoGen4, PLATINUM_HGSS_PERSONAL_FILE_SIZE, GEN4_ENTRY_SIZE>;

#[derive(Debug)]
pub struct MetadataTablePlatinumHgss {
    personal: PersonalTablePlatinumHgss,
    learnsets: LearnsetFileReader,
}

impl MetadataTable for MetadataTablePlatinumHgss {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, Option<PkmType>)> {
        self.personal.get_types(national_dex, forme_index)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.personal.get_game_index(national_dex, forme_index)
    }

    fn get_levelup_learnset(&self, national_dex: u16, forme_index: u16) -> Option<LearnsetReader> {
        self.learnsets
            .learnset_at_index(self.get_game_index(national_dex, forme_index)?)
    }

    fn get_base_stats(&self, national_dex: u16, forme_index: u16) -> Option<BaseStats> {
        self.personal.get_base_stats(national_dex, forme_index)
    }

    fn get_source_name(&self) -> &'static str {
        "Platinum/HeartGold/SoulSilver"
    }
}

#[cfg(test)]
mod tests {
    use pkm_rs_types::NationalDex;

    use super::*;

    #[test]
    fn unsupported_mon_doesnt_crash() {
        let metadata = &METADATA_TABLE_DIAMOND_PEARL;
        assert_eq!(
            metadata.get_game_index(NationalDex::Urshifu as u16, 0),
            None
        );
    }
}
