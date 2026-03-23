use std::sync::LazyLock;

use pkm_rs_types::{NationalDex, PkmType, Stats8};

use crate::{
    levelup::Learnset,
    species::form_metadata::{MetadataTable, PersonalTable},
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal

const RUBY_SAPPHIRE_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal/personal_rs");
const RUBY_SAPPHIRE_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/levelup/lvlmove_rs.pkl");

pub static METADATA_TABLE_RUBY_SAPPHIRE: LazyLock<MetadataTableGen3> =
    LazyLock::new(|| MetadataTableGen3 {
        personal: PersonalTableGen3::from_pkl_bytes(RUBY_SAPPHIRE_PERSONAL_BYTES),
        learnsets: Learnset::all_from_pkl_bytes(RUBY_SAPPHIRE_LEVELUP_BYTES),
    });

const FIRERED_LEAFGREEN_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal/personal_fr");
const FIRERED_LEAFGREEN_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/levelup/lvlmove_fr.pkl");

pub static METADATA_TABLE_FIRERED_LEAFGREEN: LazyLock<MetadataTableGen3> =
    LazyLock::new(|| MetadataTableGen3 {
        personal: PersonalTableGen3::from_pkl_bytes(FIRERED_LEAFGREEN_PERSONAL_BYTES),
        learnsets: Learnset::all_from_pkl_bytes(FIRERED_LEAFGREEN_LEVELUP_BYTES),
    });

const EMERALD_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal/personal_e");
const EMERALD_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/levelup/lvlmove_e.pkl");

pub static METADATA_TABLE_EMERALD: LazyLock<MetadataTableGen3> =
    LazyLock::new(|| MetadataTableGen3 {
        personal: PersonalTableGen3::from_pkl_bytes(EMERALD_PERSONAL_BYTES),
        learnsets: Learnset::all_from_pkl_bytes(EMERALD_LEVELUP_BYTES),
    });

const ENTRY_SIZE: usize = 0x1c;

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoGen3([u8; 28]);

impl PersonalInfoGen3 {
    pub const fn from_pkl_bytes(bytes: [u8; 28]) -> Self {
        Self(bytes)
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(self.0[0..6].try_into().unwrap())
    }

    pub const fn types(&self) -> (PkmType, PkmType) {
        (
            PkmType::from_byte(self.0[6]).expect("Gen 3 type 1 should be valid"),
            PkmType::from_byte(self.0[7]).expect("Gen 3 type 2 should be valid"),
        )
    }
}

pub struct PersonalTableGen3(Vec<PersonalInfoGen3>);

impl PersonalTableGen3 {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let count = bytes.len() / ENTRY_SIZE;
        let mut entries = Vec::<PersonalInfoGen3>::with_capacity(count);
        for i in 0..count {
            let offset = i * ENTRY_SIZE;
            entries.push(PersonalInfoGen3::from_pkl_bytes(
                bytes[offset..offset + ENTRY_SIZE]
                    .try_into()
                    .expect("incorrect slice length for gen 3 personal table"),
            ));
        }
        Self(entries)
    }

    pub fn get_personal_info(
        &self,
        national_dex: u16,
        forme_index: u16,
    ) -> Option<&PersonalInfoGen3> {
        if forme_index == 0 {
            self.0.get(national_dex as usize)
        } else {
            None
        }
    }

    pub fn get_form_stats(&self, national_dex: u16, forme_index: u16) -> Option<Stats8> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoGen3::stats)
    }
}

const UNOWN_MAX: u16 = 27;
const DEOXYS_MAX: u16 = 3;
const CASTFORM_MAX: u16 = 3;

impl PersonalTable for PersonalTableGen3 {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoGen3::types)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        if forme_index == 0
            || (national_dex == NationalDex::Unown && forme_index <= UNOWN_MAX)
            || (national_dex == NationalDex::Deoxys && forme_index <= DEOXYS_MAX)
            || (national_dex == NationalDex::Castform && forme_index <= CASTFORM_MAX)
        {
            Some(national_dex)
        } else {
            None
        }
    }
}

pub struct MetadataTableGen3 {
    personal: PersonalTableGen3,
    learnsets: Vec<Learnset>,
}

impl MetadataTableGen3 {
    pub fn get_base_stats(&self, national_dex: u16, forme_index: u16) -> Option<Stats8> {
        self.personal.get_form_stats(national_dex, forme_index)
    }
}

impl MetadataTable for MetadataTableGen3 {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.personal.get_types(national_dex, forme_index)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        self.personal.get_game_index(national_dex, forme_index)
    }

    fn get_levelup_learnset(&self, national_dex: u16, forme_index: u16) -> Option<&Learnset> {
        self.learnsets
            .get(self.get_game_index(national_dex, forme_index)? as usize)
    }
}
