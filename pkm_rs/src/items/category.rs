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
    None,
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
            Self::None => "items/category/none.png",
            Self::Items => "items/category/other.png",
            Self::KeyItems => "items/category/key-items.png",
            Self::TechnicalMachines => "items/category/tms.png",
            Self::Medicine => "items/category/medicine.png",
            Self::Berries => "items/category/berries.png",
            Self::Balls => "items/category/balls.png",
            Self::BattleItems => "items/category/battle-items.png",
            Self::Mail => "items/category/mail.png",
            Self::PcItems => "items/category/none.png",
            Self::FreeSpace => "items/category/free-space.png",
            Self::ZCrystals => "items/category/z-crystals.png",
            Self::SpeciesItems => "items/category/tm-materials.png",
            Self::Treasure => "items/category/treasure.png",
            Self::Food => "items/category/picnic.png",
            Self::MegaStones => "items/category/mega-stones.png",
        }
    }

    pub fn for_item(item: Item) -> Self {
        if item.is_mega_stone() {
            Self::MegaStones
        } else if item.is_z_crystal() {
            Self::ZCrystals
        } else {
            SvItemStorage::pouch_for(item.get())
                .map(Self::from)
                .unwrap_or_default()
        }
    }
}

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::items::SvItemStorage;

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
