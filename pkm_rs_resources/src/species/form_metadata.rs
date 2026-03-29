pub mod gen1;
pub mod gen2;
pub mod gen3;
pub mod gen9;

use std::sync::LazyLock;

use pkm_rs_types::{OriginGame, OriginMark, PkmType, Stats8, StatsPreSplit};
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::{
    levelup::Learnset,
    species::form_metadata::{
        gen1::{METADATA_TABLE_RED_BLUE, METADATA_TABLE_YELLOW},
        gen2::{METADATA_TABLE_CRYSTAL, METADATA_TABLE_GOLD_SILVER},
        gen3::{
            METADATA_TABLE_EMERALD, METADATA_TABLE_FIRERED_LEAFGREEN, METADATA_TABLE_RUBY_SAPPHIRE,
        },
        gen9::{
            METADATA_TABLE_BDSP, METADATA_TABLE_LA, METADATA_TABLE_SV, METADATA_TABLE_SWSH,
            METADATA_TABLE_ZA, MetadataTableGen9,
        },
    },
};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
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
            Self::SunMoon => "(Ultra) Sun/Moon",
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
}

pub const METADATA_SOURCES: [MetadataSource; 22] = [
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

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "allMetadataSources"))]
pub fn all_metadata_sources() -> Vec<MetadataSource> {
    METADATA_SOURCES.to_vec()
}

pub trait PersonalTable {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)>;

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16>;
}

impl<T: PersonalTable> PersonalTable for &T {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        (**self).get_types(national_dex, forme_index)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        (**self).get_game_index(national_dex, forme_index)
    }
}

pub trait MetadataTable {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)>;

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16>;

    fn get_levelup_learnset(&self, national_dex: u16, forme_index: u16) -> Option<&Learnset>;
}

impl<T: MetadataTable> MetadataTable for LazyLock<T> {
    fn get_types(&self, national_dex: u16, forme_index: u16) -> Option<(PkmType, PkmType)> {
        (**self).get_types(national_dex, forme_index)
    }

    fn get_game_index(&self, national_dex: u16, forme_index: u16) -> Option<u16> {
        (**self).get_game_index(national_dex, forme_index)
    }

    fn get_levelup_learnset(&self, national_dex: u16, forme_index: u16) -> Option<&Learnset> {
        (**self).get_levelup_learnset(national_dex, forme_index)
    }
}

fn current_metadata_table() -> &'static MetadataTableGen9 {
    &METADATA_TABLE_SV
}

pub fn base_stats_lookup(
    national_dex: u16,
    forme_index: u16,
    source: MetadataSource,
) -> Option<Stats8> {
    match source {
        MetadataSource::RubySapphire => {
            METADATA_TABLE_RUBY_SAPPHIRE.get_base_stats(national_dex, forme_index)
        }
        MetadataSource::Emerald => METADATA_TABLE_EMERALD.get_base_stats(national_dex, forme_index),
        MetadataSource::FireRedLeafGreen => {
            METADATA_TABLE_FIRERED_LEAFGREEN.get_base_stats(national_dex, forme_index)
        }
        // MetadataSource::SwordShield => {
        //     METADATA_TABLE_SWSH.get_base_stats(national_dex, forme_index)
        // }
        // MetadataSource::BrilliantDiamondShiningPearl => {
        //     METADATA_TABLE_BDSP.get_base_stats(national_dex, forme_index)
        // }
        // MetadataSource::LegendsArceus => {
        //     METADATA_TABLE_LA.get_base_stats(national_dex, forme_index)
        // }
        MetadataSource::ScarletViolet => {
            METADATA_TABLE_SV.get_base_stats(national_dex, forme_index)
        }
        // MetadataSource::LegendsZa => METADATA_TABLE_ZA.get_base_stats(national_dex, forme_index),
        _ => current_metadata_table().get_base_stats(national_dex, forme_index),
    }
}

pub fn base_stats_pre_split_lookup(
    national_dex: u16,
    forme_index: u16,
    source: MetadataSource,
) -> Option<StatsPreSplit> {
    match source {
        MetadataSource::RedBlue => {
            METADATA_TABLE_RED_BLUE.get_base_stats(national_dex, forme_index)
        }
        MetadataSource::Yellow => METADATA_TABLE_YELLOW.get_base_stats(national_dex, forme_index),
        MetadataSource::GoldSilver => {
            METADATA_TABLE_GOLD_SILVER.get_base_stats(national_dex, forme_index)
        }
        MetadataSource::Crystal => METADATA_TABLE_CRYSTAL.get_base_stats(national_dex, forme_index),
        _ => None,
    }
}

pub fn current_base_stats(national_dex: u16, forme_index: u16) -> Option<Stats8> {
    current_metadata_table().get_base_stats(national_dex, forme_index)
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
    forme_index: u16,
) -> bool {
    metadata_table_by_source(source)
        .get_types(national_dex, forme_index)
        .is_some()
}

pub fn types_lookup(national_dex: u16, forme_index: u16) -> Option<(PkmType, Option<PkmType>)> {
    let (type1, type2) = current_metadata_table().get_types(national_dex, forme_index)?;

    Some(deduplicate_types(type1, type2))
}

fn metadata_table_by_source(source: MetadataSource) -> &'static dyn MetadataTable {
    match source {
        MetadataSource::RedBlue => &METADATA_TABLE_RED_BLUE,
        MetadataSource::Yellow => &METADATA_TABLE_YELLOW,
        MetadataSource::GoldSilver => &METADATA_TABLE_GOLD_SILVER,
        MetadataSource::Crystal => &METADATA_TABLE_CRYSTAL,
        MetadataSource::RubySapphire => &METADATA_TABLE_RUBY_SAPPHIRE,
        MetadataSource::Emerald => &METADATA_TABLE_EMERALD,
        MetadataSource::FireRedLeafGreen => &METADATA_TABLE_FIRERED_LEAFGREEN,
        MetadataSource::SwordShield => &METADATA_TABLE_SWSH,
        MetadataSource::BrilliantDiamondShiningPearl => &METADATA_TABLE_BDSP,
        MetadataSource::LegendsArceus => &METADATA_TABLE_LA,
        MetadataSource::ScarletViolet => &METADATA_TABLE_SV,
        MetadataSource::LegendsZa => &METADATA_TABLE_ZA,
        MetadataSource::DiamondPearl => todo!(),
        MetadataSource::Platinum => todo!(),
        MetadataSource::HeartGoldSoulSilver => todo!(),
        MetadataSource::BlackWhite => todo!(),
        MetadataSource::Black2White2 => todo!(),
        MetadataSource::XY => todo!(),
        MetadataSource::OmegaRubyAlphaSapphire => todo!(),
        MetadataSource::SunMoon => todo!(),
        MetadataSource::UltraSunUltraMoon => todo!(),
        MetadataSource::LetsGoPikachuEevee => todo!(),
    }
}

pub fn types_lookup_with_source(
    national_dex: u16,
    forme_index: u16,
    source: MetadataSource,
) -> Option<(PkmType, Option<PkmType>)> {
    let (type1, type2) = metadata_table_by_source(source).get_types(national_dex, forme_index)?;

    Some(deduplicate_types(type1, type2))
}

pub fn levelup_learnset_lookup(
    national_dex: u16,
    forme_index: u16,
    source: MetadataSource,
) -> Option<&'static Learnset> {
    metadata_table_by_source(source).get_levelup_learnset(national_dex, forme_index)
}

#[cfg(test)]
mod test {
    use pkm_rs_types::{NationalDex, PkmType, Stats8};

    use crate::species::{NatDexIndex, form_metadata::MetadataSource};

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
            super::types_lookup(NationalDex::Pikachu as u16, 0),
            Some((PkmType::Electric, None))
        );
    }

    #[test]
    fn all_forms_have_types() -> Result<(), String> {
        for national_dex in NationalDex::Bulbasaur as u16..=NationalDex::Pecharunt as u16 {
            let species_metadata = NatDexIndex::new(national_dex)
                .expect("1-1025 are valid national dex indices")
                .get_species_metadata();
            for form in species_metadata.formes {
                super::types_lookup(national_dex, form.forme_index)
                    .ok_or(format!("Missing types for {}", form.forme_name))?;
            }
        }

        Ok(())
    }

    #[test]
    fn no_form_duplicates_type() -> Result<(), String> {
        for national_dex in NationalDex::Bulbasaur as u16..=NationalDex::Pecharunt as u16 {
            let species_metadata = NatDexIndex::new(national_dex)
                .expect("1-1025 are valid national dex indices")
                .get_species_metadata();
            for form in species_metadata.formes {
                let (type1, type2) = super::types_lookup(national_dex, form.forme_index)
                    .ok_or(format!("Missing types for {}", form.forme_name))?;
                if let Some(type2) = type2
                    && type1 == type2
                {
                    return Err(format!(
                        "Form {} has duplicate types: {:?} and {:?}",
                        form.forme_name, type1, type2
                    ));
                }
            }
        }

        Ok(())
    }

    #[test]
    fn no_zero_stats() -> Result<(), String> {
        for national_dex in NationalDex::Bulbasaur as u16..=NationalDex::Pecharunt as u16 {
            let species_metadata = NatDexIndex::new(national_dex)
                .expect("1-1025 are valid national dex indices")
                .get_species_metadata();
            for form in species_metadata.formes {
                let stats = super::base_stats_lookup(
                    national_dex,
                    form.forme_index,
                    MetadataSource::ScarletViolet,
                )
                .ok_or(format!("Missing stats for {}", form.forme_name))?;
                if stats.hp == 0
                    || stats.atk == 0
                    || stats.def == 0
                    || stats.spa == 0
                    || stats.spd == 0
                    || stats.spe == 0
                {
                    return Err(format!(
                        "Form {} has one or more zero base stats: {:?}",
                        form.forme_name, stats
                    ));
                }
            }
        }

        Ok(())
    }
}
