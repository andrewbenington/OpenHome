use crate::items::groups::{
    BALLS, BATTLE, KEY_ITEMS, KEY_ITEMS_EXCLUDED, MACHINE, MATERIAL, MEDICINE, OTHER, PICNIC,
    TREASURE,
};

use num_enum::{IntoPrimitive, TryFromPrimitive};
use pkm_rs_resources::items::Item;

#[cfg_attr(
    feature = "wasm",
    derive(tsify::Tsify, serde::Serialize, serde::Deserialize)
)]
#[derive(
    Debug,
    Default,
    Clone,
    Copy,
    PartialEq,
    Eq,
    Hash,
    strum::Display,
    strum::EnumString,
    strum::EnumIter,
    TryFromPrimitive,
    IntoPrimitive,
)]
#[repr(u32)]
pub enum OpenhomeItemCategory {
    #[default]
    General,
    Items,
    #[strum(to_string = "Key Items")]
    KeyItems,
    #[strum(to_string = "TMs + HMs")]
    TechnicalMachines,
    Medicine,
    Berries,
    Balls,
    #[strum(to_string = "Battle Items")]
    BattleItems,
    #[strum(to_string = "Mail")]
    Mail,
    #[strum(to_string = "PC Items")]
    PcItems,
    #[strum(to_string = "Free Space")]
    FreeSpace,
    #[strum(to_string = "Z Crystals")]
    ZCrystals,
    #[strum(to_string = "Species Items")] // Candy in LGPE, materials in SV
    SpeciesItems,
    Treasure,
    Food,
    #[strum(to_string = "Mega Stones")]
    MegaStones,
}

impl OpenhomeItemCategory {
    pub const fn icon_path(&self) -> &'static str {
        match self {
            Self::General => "items/category/generic.png",
            Self::Items => "items/category/other.png",
            Self::KeyItems => "items/category/key-items.png",
            Self::TechnicalMachines => "items/category/tms.png",
            Self::Medicine => "items/category/medicine.png",
            Self::Berries => "items/category/berries.png",
            Self::Balls => "items/category/balls.png",
            Self::BattleItems => "items/category/battle-items.png",
            Self::Mail => "items/category/mail.png",
            Self::PcItems => "items/category/generic.png",
            Self::FreeSpace => "items/category/free-space.png",
            Self::ZCrystals => "items/category/z-crystals.png",
            Self::SpeciesItems => "items/category/tm-materials.png",
            Self::Treasure => "items/category/treasure.png",
            Self::Food => "items/category/picnic.png",
            Self::MegaStones => "items/category/mega-stones.png",
        }
    }

    const fn ordered_item_slice(self) -> Option<&'static [u16]> {
        match self {
            Self::TechnicalMachines => Some(MACHINE),
            Self::Medicine => Some(MEDICINE),
            Self::Balls => Some(BALLS),
            Self::BattleItems => Some(BATTLE),
            Self::Treasure => Some(TREASURE),
            Self::Food => Some(PICNIC),
            Self::SpeciesItems => Some(MATERIAL),
            Self::Items => Some(OTHER),
            Self::KeyItems
            | Self::Berries
            | Self::MegaStones
            | Self::Mail
            | Self::PcItems
            | Self::FreeSpace
            | Self::ZCrystals
            | Self::General => None,
        }
    }

    pub fn for_item(item: Item) -> Self {
        if item.is_mega_stone() {
            Self::MegaStones
        } else if item.is_z_crystal() {
            Self::ZCrystals
        } else if item.is_berry() {
            Self::Berries
        } else if item.is_mail() {
            Self::Mail
        } else if item.is_tm() || item.is_tr() {
            Self::TechnicalMachines
        } else if item.is_hm() {
            Self::KeyItems
        } else if item.is_species_candy() {
            Self::SpeciesItems
        } else if item.is_curry_ingredient() {
            Self::Food
        } else if item.is_gem() {
            Self::Items
        } else if KEY_ITEMS.binary_search(&item.get()).is_ok()
            && !KEY_ITEMS_EXCLUDED.binary_search(&item.get()).is_ok()
        {
            Self::KeyItems
        } else {
            use strum::IntoEnumIterator;
            Self::iter()
                .find(|&category| {
                    category
                        .ordered_item_slice()
                        .is_some_and(|items| items.binary_search(&item.get()).is_ok())
                })
                .unwrap_or_default()
        }
    }
}

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;
    use strum::IntoEnumIterator;

    #[test]
    fn all_category_icons_exist() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../public")
            .canonicalize()
            .expect("canonical path is valid");

        let missing: Vec<&str> = OpenhomeItemCategory::iter()
            .map(|category| category.icon_path())
            .filter(|path| !root.join(path).is_file())
            .collect();

        assert!(
            missing.is_empty(),
            "{} category icon(s) missing under {}:\n{}",
            missing.len(),
            root.display(),
            missing.join("\n"),
        );
    }
}
