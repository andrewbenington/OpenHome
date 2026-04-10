pub mod gen1;
pub mod gen2;
pub mod gen3;
pub mod gen4;
pub mod gen5;
pub mod gen6;
pub mod gen7_alola;
pub mod gen7_lgpe;
pub mod gen8_bdsp;
pub mod gen8_la;
pub mod gen8_swsh;
pub mod gen9_sv;
pub mod gen9_za;

use std::marker::PhantomData;

use pkm_rs_types::{NationalDex, OriginGame, PkmType, Stats8, StatsPreSplit};

#[cfg(feature = "wasm")]
use strum::IntoEnumIterator;
use strum_macros::EnumIter;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use pkm_rs_types::OriginMark;
#[cfg(feature = "wasm")]
use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::{
    ExpectLog,
    levelup::LearnsetReader,
    species::{
        form,
        form_metadata::{
            gen1::{METADATA_TABLE_RED_BLUE, METADATA_TABLE_YELLOW},
            gen2::{METADATA_TABLE_CRYSTAL, METADATA_TABLE_GOLD_SILVER},
            gen3::{METADATA_TABLE_EMERALD, METADATA_TABLE_FRLG, METADATA_TABLE_RUBY_SAPPHIRE},
            gen4::{METADATA_TABLE_DIAMOND_PEARL, METADATA_TABLE_HGSS, METADATA_TABLE_PLATINUM},
            gen5::{METADATA_TABLE_B2W2, METADATA_TABLE_BW},
            gen6::{METADATA_TABLE_ORAS, METADATA_TABLE_XY},
            gen7_alola::{METADATA_TABLE_SUN_MOON, METADATA_TABLE_USUM},
            gen7_lgpe::METADATA_TABLE_LGPE,
            gen8_bdsp::METADATA_TABLE_BDSP,
            gen8_la::METADATA_TABLE_LA,
            gen8_swsh::METADATA_TABLE_SWSH,
            gen9_sv::METADATA_TABLE_SV,
            gen9_za::METADATA_TABLE_ZA,
        },
    },
};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, EnumIter)]
pub enum MetadataSource {
    RedBlue,
    Yellow,
    GoldSilver,
    Crystal,
    RubySapphire,
    Emerald,
    FireRedLeafGreen,
    DiamondPearl,
    Platinum,
    HeartGoldSoulSilver,
    BlackWhite,
    Black2White2,
    XY,
    OmegaRubyAlphaSapphire,
    SunMoon,
    UltraSunUltraMoon,
    LetsGoPikachuEevee,
    SwordShield,
    BrilliantDiamondShiningPearl,
    LegendsArceus,
    #[default]
    ScarletViolet,
    LegendsZa,
}

impl MetadataSource {
    pub const fn first_origin_game(self) -> OriginGame {
        match self {
            Self::RedBlue => OriginGame::Red,
            Self::Yellow => OriginGame::Yellow,
            Self::GoldSilver => OriginGame::Gold,
            Self::Crystal => OriginGame::Crystal,
            Self::RubySapphire => OriginGame::Ruby,
            Self::Emerald => OriginGame::Emerald,
            Self::FireRedLeafGreen => OriginGame::FireRed,
            Self::DiamondPearl => OriginGame::Diamond,
            Self::Platinum => OriginGame::Platinum,
            Self::HeartGoldSoulSilver => OriginGame::HeartGold,
            Self::BlackWhite => OriginGame::Black,
            Self::Black2White2 => OriginGame::White2,
            Self::XY => OriginGame::X,
            Self::OmegaRubyAlphaSapphire => OriginGame::OmegaRuby,
            Self::SunMoon => OriginGame::Sun,
            Self::UltraSunUltraMoon => OriginGame::UltraSun,
            Self::LetsGoPikachuEevee => OriginGame::LetsGoPikachu,
            Self::SwordShield => OriginGame::Sword,
            Self::BrilliantDiamondShiningPearl => OriginGame::BrilliantDiamond,
            Self::LegendsArceus => OriginGame::LegendsArceus,
            Self::ScarletViolet => OriginGame::Scarlet,
            Self::LegendsZa => OriginGame::LegendsZa,
        }
    }

    pub fn all_origin_games(self) -> Vec<OriginGame> {
        match self {
            Self::RedBlue => vec![OriginGame::Red, OriginGame::BlueGreen, OriginGame::BlueJpn],
            Self::Yellow => vec![OriginGame::Yellow],
            Self::GoldSilver => vec![OriginGame::Gold, OriginGame::Silver],
            Self::Crystal => vec![OriginGame::Crystal],
            Self::RubySapphire => vec![OriginGame::Ruby, OriginGame::Sapphire],
            Self::Emerald => vec![OriginGame::Emerald],
            Self::FireRedLeafGreen => vec![OriginGame::FireRed, OriginGame::LeafGreen],
            Self::DiamondPearl => vec![OriginGame::Diamond, OriginGame::Pearl],
            Self::Platinum => vec![OriginGame::Platinum],
            Self::HeartGoldSoulSilver => vec![OriginGame::HeartGold, OriginGame::SoulSilver],
            Self::BlackWhite => vec![OriginGame::Black, OriginGame::White],
            Self::Black2White2 => vec![OriginGame::Black2, OriginGame::White2],
            Self::XY => vec![OriginGame::X, OriginGame::Y],
            Self::OmegaRubyAlphaSapphire => vec![OriginGame::OmegaRuby, OriginGame::AlphaSapphire],
            Self::SunMoon => vec![OriginGame::Sun, OriginGame::Moon],
            Self::UltraSunUltraMoon => vec![OriginGame::UltraSun, OriginGame::UltraMoon],
            Self::LetsGoPikachuEevee => vec![OriginGame::LetsGoPikachu, OriginGame::LetsGoEevee],
            Self::SwordShield => vec![OriginGame::Sword, OriginGame::Shield],
            Self::BrilliantDiamondShiningPearl => {
                vec![OriginGame::BrilliantDiamond, OriginGame::ShiningPearl]
            }
            Self::LegendsArceus => vec![OriginGame::LegendsArceus],
            Self::ScarletViolet => vec![OriginGame::Scarlet, OriginGame::Violet],
            Self::LegendsZa => vec![OriginGame::LegendsZa],
        }
    }

    pub const fn display(self) -> &'static str {
        match self {
            Self::RedBlue => "Red/Green/Blue",
            Self::Yellow => "Yellow",
            Self::GoldSilver => "Gold/Silver",
            Self::Crystal => "Crystal",
            Self::RubySapphire => "Ruby/Sapphire",
            Self::Emerald => "Emerald",
            Self::FireRedLeafGreen => "FireRed/LeafGreen",
            Self::DiamondPearl => "Diamond/Pearl",
            Self::Platinum => "Platinum",
            Self::HeartGoldSoulSilver => "HeartGold/SoulSilver",
            Self::BlackWhite => "Black/White",
            Self::Black2White2 => "Black 2/White 2",
            Self::XY => "X/Y",
            Self::OmegaRubyAlphaSapphire => "Omega Ruby/Alpha Sapphire",
            Self::SunMoon => "Sun/Moon",
            Self::UltraSunUltraMoon => "Ultra Sun/Ultra Moon",
            Self::LetsGoPikachuEevee => "Let's Go Pikachu/Eevee",
            Self::SwordShield => "Sword/Shield",
            Self::BrilliantDiamondShiningPearl => "Brilliant Diamond/Shining Pearl",
            Self::LegendsArceus => "Legends: Arceus",
            Self::ScarletViolet => "Scarlet/Violet",
            Self::LegendsZa => "Legends: Z-A",
        }
    }
}

#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct MetadataSources;

#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
#[cfg(feature = "wasm")]
impl MetadataSources {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getOriginMark"))]
    pub fn get_origin_mark(value: MetadataSource) -> Option<OriginMark> {
        value.first_origin_game().mark()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen)]
    pub fn display(value: MetadataSource) -> String {
        value.display().to_owned()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "supportsForm"))]
    pub fn supports_form(source: MetadataSource, national_dex: u16, form_index: u16) -> bool {
        source_has_form_metadata(source, national_dex, form_index)
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "supportedGameOrigins"))]
    pub fn supported_game_origins(national_dex: u16, form_index: u16) -> Vec<OriginGame> {
        MetadataSource::iter()
            .filter(|source| source_has_form_metadata(*source, national_dex, form_index))
            .flat_map(MetadataSource::all_origin_games)
            .collect()
    }
}

#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "allMetadataSources"))]
pub fn all_metadata_sources() -> Vec<MetadataSource> {
    MetadataSource::iter().collect()
}

pub trait PersonalInfo: Sized {
    const MAX_NATIONAL_DEX: NationalDex;

    fn from_pkl_bytes(bytes: &'static [u8]) -> Self;

    fn stats(&self) -> BaseStats;

    fn types_fallible(&self) -> (Option<PkmType>, Option<PkmType>);

    // gives the game index for this species' form of index form_index if present.
    // base forms are usually in national dex order, so other form game indices
    // need to be found using the base form's personal info entry
    fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16>;

    // pub fn ability1(&self) -> AbilityIndex {
    //     AbilityIndex::new(u16::from_le_bytes([self.0[0x12], self.0[0x13]]))
    //         .expect("Gen 9 ability 1 should be valid")
    // }

    // pub fn ability2(&self) -> AbilityIndex {
    //     AbilityIndex::from_index(u16::from_le_bytes([self.0[0x14], self.0[0x15]]))
    //         .expect("Gen 9 ability 2 should be valid")
    // }

    // pub fn ability_hidden(&self) -> AbilityIndex {
    //     AbilityIndex::from_index(u16::from_le_bytes([self.0[0x16], self.0[0x17]]))
    //         .expect("Gen 9 hidden ability should be valid")
    // }

    fn source_name(&self) -> &'static str;
}

fn format_bad_type_error(
    national_dex: u16,
    form_index: u16,
    source_name: &'static str,
    type_index: u8,
) -> String {
    format!(
        "Invalid type {type_index} for national dex {national_dex} form index {form_index} in personal table {source_name}"
    )
}

#[derive(Debug, Clone, Copy)]
pub struct PersonalTable<
    INFO: PersonalInfo,
    const TABLE_BYTE_LEN: usize,
    const ENTRY_BYTE_LEN: usize,
>(&'static [u8; TABLE_BYTE_LEN], PhantomData<INFO>);

impl<INFO: PersonalInfo, const TABLE_BYTE_LEN: usize, const ENTRY_BYTE_LEN: usize>
    PersonalTable<INFO, TABLE_BYTE_LEN, ENTRY_BYTE_LEN>
{
    pub const fn from_pkl_bytes(bytes: &'static [u8; TABLE_BYTE_LEN]) -> Self {
        Self(bytes, PhantomData)
    }

    pub fn get_personal_info_by_game_index(&self, game_index: u16) -> INFO {
        let offset = (game_index as usize) * ENTRY_BYTE_LEN;
        INFO::from_pkl_bytes(&self.0[offset..offset + ENTRY_BYTE_LEN])
    }

    pub fn get_base_form_personal_info(&self, national_dex: u16) -> INFO {
        self.get_personal_info_by_game_index(national_dex)
    }

    pub fn get_game_index(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        if national_dex > INFO::MAX_NATIONAL_DEX as u16 {
            return None;
        }

        self.get_base_form_personal_info(national_dex)
            .game_index_for_form(national_dex, form_index)
    }

    pub fn get_personal_info(&self, national_dex: u16, form_index: u16) -> Option<INFO> {
        self.get_game_index(national_dex, form_index)
            .map(|game_index| self.get_personal_info_by_game_index(game_index))
    }

    fn get_types(&self, national_dex: u16, form_index: u16) -> Option<(PkmType, Option<PkmType>)> {
        let personal_info = self.get_personal_info(national_dex, form_index)?;
        let types_fallible = personal_info.types_fallible();

        let type1 = types_fallible.0.expect_log(format_bad_type_error(
            national_dex,
            form_index,
            personal_info.source_name(),
            1,
        ));

        let type2 = types_fallible.1.expect_log(format_bad_type_error(
            national_dex,
            form_index,
            personal_info.source_name(),
            2,
        ));

        Some(deduplicate_types(type1, type2))
    }

    pub fn get_base_stats(&self, national_dex: u16, form_index: u16) -> Option<BaseStats> {
        self.get_personal_info(national_dex, form_index)
            .as_ref()
            .map(PersonalInfo::stats)
    }
}

pub trait MetadataTable {
    fn get_types(&self, national_dex: u16, form_index: u16) -> Option<(PkmType, Option<PkmType>)>;

    fn get_game_index(&self, national_dex: u16, form_index: u16) -> Option<u16>;

    fn get_levelup_learnset(&self, national_dex: u16, form_index: u16) -> Option<LearnsetReader>;

    fn get_base_stats(&self, national_dex: u16, form_index: u16) -> Option<BaseStats>;

    fn form_is_present(&self, national_dex: u16, form_index: u16) -> bool {
        self.get_game_index(national_dex, form_index).is_some()
    }

    fn get_source_name(&self) -> &'static str;
}

impl<T, U> MetadataTable for T
where
    T: std::ops::Deref<Target = U>,
    U: MetadataTable + ?Sized + 'static,
{
    fn get_types(&self, national_dex: u16, form_index: u16) -> Option<(PkmType, Option<PkmType>)> {
        (**self).get_types(national_dex, form_index)
    }

    fn get_game_index(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        (**self).get_game_index(national_dex, form_index)
    }

    fn get_levelup_learnset(&self, national_dex: u16, form_index: u16) -> Option<LearnsetReader> {
        (**self).get_levelup_learnset(national_dex, form_index)
    }

    fn get_base_stats(&self, national_dex: u16, form_index: u16) -> Option<BaseStats> {
        (**self).get_base_stats(national_dex, form_index)
    }

    fn form_is_present(&self, national_dex: u16, form_index: u16) -> bool {
        (**self).form_is_present(national_dex, form_index)
    }

    fn get_source_name(&self) -> &'static str {
        (**self).get_source_name()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct MetadataTableReader {
    inner: Box<dyn MetadataTable>,
    national_dex: u16,
    form_index: u16,
}

const READER_SHOULD_BE_VALID: &str =
    "MetadataTableReader should only be constructed if the form is present in the table";

impl MetadataTableReader {
    pub fn new(inner: Box<dyn MetadataTable>, national_dex: u16, form_index: u16) -> Option<Self> {
        if inner.form_is_present(national_dex, form_index) {
            Some(Self {
                inner,
                national_dex,
                form_index,
            })
        } else {
            None
        }
    }

    pub fn get_types(&self) -> (PkmType, Option<PkmType>) {
        self.inner
            .get_types(self.national_dex, self.form_index)
            .expect_log(READER_SHOULD_BE_VALID)
    }

    pub fn get_game_index(&self) -> u16 {
        self.inner
            .get_game_index(self.national_dex, self.form_index)
            .expect_log(READER_SHOULD_BE_VALID)
    }

    pub fn get_levelup_learnset(&self) -> LearnsetReader {
        self.inner
            .get_levelup_learnset(self.national_dex, self.form_index)
            .expect_log(READER_SHOULD_BE_VALID)
    }

    pub fn get_base_stats(&self) -> BaseStats {
        self.inner
            .get_base_stats(self.national_dex, self.form_index)
            .expect_log(READER_SHOULD_BE_VALID)
    }

    pub fn types(&self) -> (PkmType, Option<PkmType>) {
        self.inner
            .get_types(self.national_dex, self.form_index)
            .expect_log(READER_SHOULD_BE_VALID)
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
impl MetadataTableReader {
    #[cfg_attr(feature = "wasm", wasm_bindgen)]
    pub fn type1(&self) -> PkmType {
        self.types().0
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen)]
    pub fn type2(&self) -> Option<PkmType> {
        self.types().1
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "baseStats"))]
    pub fn base_stats(&self) -> BaseStats {
        self.get_base_stats()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter = "sourceName"))]
    pub fn source_name(&self) -> String {
        self.inner.get_source_name().to_owned()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "metadataReaderFor"))]
pub fn metadata_reader_for(
    source: MetadataSource,
    national_dex: u16,
    form_index: u16,
) -> Option<MetadataTableReader> {
    MetadataTableReader::new(
        Box::new(metadata_table_by_source(source)),
        national_dex,
        form_index,
    )
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "currentMetadataReader"))]
pub fn current_metadata_reader(national_dex: u16, form_index: u16) -> Option<MetadataTableReader> {
    MetadataTableReader::new(
        Box::new(most_recent_metadata_table_for(national_dex, form_index)),
        national_dex,
        form_index,
    )
}

#[cfg_attr(feature = "wasm", derive(Tsify, Serialize, Deserialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BaseStats {
    PreSplit(StatsPreSplit),
    Modern(Stats8),
}

fn most_recent_metadata_table_for(
    national_dex: u16,
    form_index: u16,
) -> &'static dyn MetadataTable {
    if METADATA_TABLE_SV.form_is_present(national_dex, form_index) {
        &METADATA_TABLE_SV
    } else if METADATA_TABLE_ZA.form_is_present(national_dex, form_index) {
        &METADATA_TABLE_ZA
    } else if METADATA_TABLE_BDSP.form_is_present(national_dex, form_index) {
        &METADATA_TABLE_BDSP
    } else if METADATA_TABLE_SWSH.form_is_present(national_dex, form_index) {
        &METADATA_TABLE_SWSH
    } else if METADATA_TABLE_LGPE.form_is_present(national_dex, form_index) {
        &METADATA_TABLE_LGPE
    } else if national_dex == NationalDex::Pichu as u16 && form_index == form::PICHU_SPIKY_EARED {
        &METADATA_TABLE_HGSS
    } else {
        &METADATA_TABLE_USUM
    }
}

pub fn base_stats_lookup(
    national_dex: u16,
    form_index: u16,
    source: MetadataSource,
) -> Option<BaseStats> {
    metadata_table_by_source(source).get_base_stats(national_dex, form_index)
}

pub fn current_base_stats(national_dex: u16, form_index: u16) -> Option<Stats8> {
    most_recent_metadata_table_for(national_dex, form_index)
        .get_base_stats(national_dex, form_index)
        .map(|base_stats| match base_stats {
            BaseStats::PreSplit(_) => {
                panic!("Current metadata table should not have pre-split stats")
            }
            BaseStats::Modern(stats) => stats,
        })
}

fn deduplicate_types(type1: PkmType, type2: PkmType) -> (PkmType, Option<PkmType>) {
    if type1 == type2 {
        (type1, None)
    } else {
        (type1, Some(type2))
    }
}

pub fn source_has_form_metadata(
    source: MetadataSource,
    national_dex: u16,
    form_index: u16,
) -> bool {
    metadata_table_by_source(source).form_is_present(national_dex, form_index)
}

fn metadata_table_by_source(source: MetadataSource) -> &'static dyn MetadataTable {
    match source {
        MetadataSource::RedBlue => &METADATA_TABLE_RED_BLUE,
        MetadataSource::Yellow => &METADATA_TABLE_YELLOW,
        MetadataSource::GoldSilver => &METADATA_TABLE_GOLD_SILVER,
        MetadataSource::Crystal => &METADATA_TABLE_CRYSTAL,
        MetadataSource::RubySapphire => &METADATA_TABLE_RUBY_SAPPHIRE,
        MetadataSource::Emerald => &METADATA_TABLE_EMERALD,
        MetadataSource::FireRedLeafGreen => &METADATA_TABLE_FRLG,
        MetadataSource::DiamondPearl => &METADATA_TABLE_DIAMOND_PEARL,
        MetadataSource::Platinum => &METADATA_TABLE_PLATINUM,
        MetadataSource::HeartGoldSoulSilver => &METADATA_TABLE_HGSS,
        MetadataSource::BlackWhite => &METADATA_TABLE_BW,
        MetadataSource::Black2White2 => &METADATA_TABLE_B2W2,
        MetadataSource::XY => &METADATA_TABLE_XY,
        MetadataSource::OmegaRubyAlphaSapphire => &METADATA_TABLE_ORAS,
        MetadataSource::SunMoon => &METADATA_TABLE_SUN_MOON,
        MetadataSource::UltraSunUltraMoon => &METADATA_TABLE_USUM,
        MetadataSource::LetsGoPikachuEevee => &METADATA_TABLE_LGPE,
        MetadataSource::SwordShield => &METADATA_TABLE_SWSH,
        MetadataSource::BrilliantDiamondShiningPearl => &METADATA_TABLE_BDSP,
        MetadataSource::LegendsArceus => &METADATA_TABLE_LA,
        MetadataSource::ScarletViolet => &METADATA_TABLE_SV,
        MetadataSource::LegendsZa => &METADATA_TABLE_ZA,
    }
}

pub fn types_lookup(
    national_dex: u16,
    form_index: u16,
    source: Option<MetadataSource>,
) -> Option<(PkmType, Option<PkmType>)> {
    match source {
        Some(source) => metadata_table_by_source(source).get_types(national_dex, form_index),
        None => most_recent_metadata_table_for(national_dex, form_index)
            .get_types(national_dex, form_index),
    }
}

pub fn levelup_learnset_lookup(
    national_dex: u16,
    form_index: u16,
    source: Option<MetadataSource>,
) -> Option<LearnsetReader> {
    match source {
        Some(source) => {
            metadata_table_by_source(source).get_levelup_learnset(national_dex, form_index)
        }
        None => most_recent_metadata_table_for(national_dex, form_index)
            .get_levelup_learnset(national_dex, form_index),
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use pkm_rs_types::{NationalDex, PkmType, Stats8};

    use crate::species::{
        FormMetadata, NATIONAL_DEX_MAX, NatDexIndex, form_metadata::MetadataSource,
    };

    const ARCEUS_LEGEND: u16 = 18;

    const METADATA_SOURCES_IMPLEMENTED: [MetadataSource; 22] = [
        MetadataSource::RedBlue,
        MetadataSource::Yellow,
        MetadataSource::GoldSilver,
        MetadataSource::Crystal,
        MetadataSource::RubySapphire,
        MetadataSource::Emerald,
        MetadataSource::FireRedLeafGreen,
        MetadataSource::DiamondPearl,
        MetadataSource::Platinum,
        MetadataSource::HeartGoldSoulSilver,
        MetadataSource::BlackWhite,
        MetadataSource::Black2White2,
        MetadataSource::XY,
        MetadataSource::OmegaRubyAlphaSapphire,
        MetadataSource::SunMoon,
        MetadataSource::UltraSunUltraMoon,
        MetadataSource::LetsGoPikachuEevee,
        MetadataSource::SwordShield,
        MetadataSource::BrilliantDiamondShiningPearl,
        MetadataSource::LegendsArceus,
        MetadataSource::ScarletViolet,
        MetadataSource::LegendsZa,
    ];

    fn has_entry(source: MetadataSource, national_dex: u16, form_index: u16) -> bool {
        metadata_table_by_source(source).form_is_present(national_dex, form_index)
    }

    fn form_has_current_data(form: &FormMetadata) -> bool {
        !(form.form_name.contains("Totem")
        || (form.national_dex.get() == NationalDex::Xerneas && form.form_index == 1) // Active Xerneas
            || (form.national_dex.get() == NationalDex::Arceus && form.form_index == ARCEUS_LEGEND))
    }

    fn try_all_forms(callback: impl Fn(&FormMetadata) -> Result<(), String>) -> Result<(), String> {
        for national_dex in NationalDex::Bulbasaur as u16..=NATIONAL_DEX_MAX as u16 {
            let species_metadata = NatDexIndex::new(national_dex)
                .expect("1-1025 are valid national dex indices")
                .get_species_metadata();
            for form in species_metadata.forms {
                if !form_has_current_data(form) {
                    continue;
                }
                callback(form)?;
            }
        }
        Ok(())
    }

    #[test]
    fn test_get_stats() {
        assert_eq!(
            super::current_base_stats(NationalDex::Pikachu as u16, 0),
            Some(Stats8::new(35, 55, 40, 50, 50, 90))
        );
    }

    #[test]
    fn test_get_types() {
        assert_eq!(
            super::types_lookup(NationalDex::Pikachu as u16, 0, None),
            Some((PkmType::Electric, None))
        );
    }

    #[test]
    fn all_forms_have_types() -> Result<(), String> {
        try_all_forms(|form| {
            super::types_lookup(form.national_dex.get(), form.form_index, None)
                .ok_or(format!("Missing types for {}", form.form_name))?;
            Ok(())
        })
    }

    #[test]
    fn no_form_duplicates_type() -> Result<(), String> {
        try_all_forms(|form| {
            let form_name = &form.form_name;
            let (type1, type2) =
                super::types_lookup(form.national_dex.get(), form.form_index, None)
                    .ok_or(format!("Missing types for {form_name}"))?;
            if let Some(type2) = type2
                && type1 == type2
            {
                Err(format!(
                    "Form {form_name} has duplicate types: {type1:?} and {type2:?}"
                ))
            } else {
                Ok(())
            }
        })
    }

    #[test]
    fn no_zero_stats() -> Result<(), String> {
        try_all_forms(|form| {
            let form_name = &form.form_name;
            let stats = super::current_base_stats(form.national_dex.get(), form.form_index)
                .ok_or(format!("Missing stats for {form_name}"))?;
            if stats.hp == 0
                || stats.atk == 0
                || stats.def == 0
                || stats.spa == 0
                || stats.spd == 0
                || stats.spe == 0
            {
                Err(format!(
                    "Form {form_name} has one or more zero base stats: {stats:?}"
                ))
            } else {
                Ok(())
            }
        })
    }

    #[test]
    fn pikachu_present_in_all_sources() -> Result<(), impl std::fmt::Debug> {
        METADATA_SOURCES_IMPLEMENTED
            .into_iter()
            .try_for_each(|source| {
                if !has_entry(source, NationalDex::Pikachu as u16, 0) {
                    Err(format!("Pikachu not found in metadata source {source:?}"))
                } else {
                    Ok(())
                }
            })
    }

    #[test]
    fn no_form_panics_for_any_source() -> Result<(), String> {
        try_all_forms(|form| {
            METADATA_SOURCES_IMPLEMENTED.into_iter().for_each(|source| {
                super::base_stats_lookup(form.national_dex.get(), form.form_index, source);
            });
            Ok(())
        })
    }
}
