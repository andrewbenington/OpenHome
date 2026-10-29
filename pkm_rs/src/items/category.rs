#[cfg_attr(
    feature = "wasm",
    derive(tsify::Tsify, serde::Serialize, serde::Deserialize)
)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, strum::EnumString, strum::EnumIter)]
pub enum PkhexItemCategory {
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
    Ingredients,
    #[strum(to_string = "Mega Stones")]
    MegaStones,
}

impl PkhexItemCategory {
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
            Self::Ingredients => "items/category/picnic.png",
            Self::MegaStones => "items/category/mega-stones.png",
        }
    }
}

#[cfg(feature = "wasm")]
use pkm_rs_types::JsResult;
#[cfg(feature = "wasm")]
use tsify::Ts;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "itemCategoryIconPath")]
pub fn item_category_icon_path(category: Ts<PkhexItemCategory>) -> JsResult<String> {
    Ok(category.to_rust()?.icon_path().to_owned())
}

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

        let missing: Vec<&str> = PkhexItemCategory::iter()
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
