use std::sync::LazyLock;

use pkm_rs_types::{NationalDex, PkmType, StatsPreSplit};

use crate::{
    levelup::Learnset,
    log,
    species::form_metadata::{MetadataTable, PersonalTable},
};

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal

const GOLD_SILVER_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal/personal_gs");
const GOLD_SILVER_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/levelup/lvlmove_gs.pkl");

pub static METADATA_TABLE_GOLD_SILVER: LazyLock<MetadataTableGen2> =
    LazyLock::new(|| MetadataTableGen2 {
        personal: PersonalTableGen2::from_pkl_bytes(GOLD_SILVER_PERSONAL_BYTES),
        learnsets: Learnset::all_from_pkl_bytes(GOLD_SILVER_LEVELUP_BYTES),
    });

const CRYSTAL_PERSONAL_BYTES: &[u8] = include_bytes!("pkhex_bin/personal/personal_c");
const CRYSTAL_LEVELUP_BYTES: &[u8] = include_bytes!("pkhex_bin/levelup/lvlmove_c.pkl");

pub static METADATA_TABLE_CRYSTAL: LazyLock<MetadataTableGen2> =
    LazyLock::new(|| MetadataTableGen2 {
        personal: PersonalTableGen2::from_pkl_bytes(CRYSTAL_PERSONAL_BYTES),
        learnsets: Learnset::all_from_pkl_bytes(CRYSTAL_LEVELUP_BYTES),
    });

const ENTRY_SIZE: usize = 0x20;

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoGen2([u8; ENTRY_SIZE]);

impl PersonalInfoGen2 {
    pub const fn from_pkl_bytes(bytes: [u8; ENTRY_SIZE]) -> Self {
        Self(bytes)
    }

    pub fn stats(&self) -> StatsPreSplit {
        StatsPreSplit::from_bytes_u8(self.0[0..5].try_into().unwrap())
    }

    pub fn types(&self) -> (PkmType, PkmType) {
        log!(
            "getting types for gen 2 personal info with bytes: {:?}, type 1 byte: {}, type 2 byte: {}",
            self.0,
            self.0[7],
            self.0[8]
        );
        (
            PkmType::from_byte_gen12(self.0[7]).expect("Gen 2 type 1 should be valid"),
            PkmType::from_byte_gen12(self.0[8]).expect("Gen 2 type 2 should be valid"),
        )
    }
}

pub struct PersonalTableGen2(Vec<PersonalInfoGen2>);

impl PersonalTableGen2 {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        let count = bytes.len() / ENTRY_SIZE;
        let mut entries = Vec::<PersonalInfoGen2>::with_capacity(count);
        for i in 0..count {
            let offset = i * ENTRY_SIZE;
            entries.push(PersonalInfoGen2::from_pkl_bytes(
                bytes[offset..offset + ENTRY_SIZE]
                    .try_into()
                    .expect("incorrect slice length for gen 2 personal table"),
            ));
        }
        Self(entries)
    }

    pub fn get_personal_info(
        &self,
        national_dex: u16,
        forme_index: u16,
    ) -> Option<&PersonalInfoGen2> {
        self.get_game_index(national_dex, forme_index)
            .and_then(|game_index| self.0.get(game_index as usize))
    }

    pub fn get_form_stats(&self, national_dex: u16, forme_index: u16) -> Option<StatsPreSplit> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoGen2::stats)
    }
}

const UNOWN_Z: u16 = 25;

impl PersonalTable for PersonalTableGen2 {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        self.get_personal_info(national_dex, forme_index)
            .map(PersonalInfoGen2::types)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        log!(
            "looking up game index for national dex {} forme index {} in gen 2 personal table",
            national_dex,
            forme_index
        );
        if forme_index == 0 || (national_dex == NationalDex::Unown && forme_index <= UNOWN_Z) {
            Some(national_dex)
        } else {
            None
        }
    }
}

pub struct MetadataTableGen2 {
    personal: PersonalTableGen2,
    learnsets: Vec<Learnset>,
}

impl MetadataTableGen2 {
    pub fn get_base_stats(&self, national_dex: u16, forme_index: u16) -> Option<StatsPreSplit> {
        self.personal.get_form_stats(national_dex, forme_index)
    }
}

impl MetadataTable for MetadataTableGen2 {
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
