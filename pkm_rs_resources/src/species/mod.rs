mod form_metadata;
mod metadata;
mod types;

pub use metadata::*;
pub use types::*;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = MetadataSummaryLookup))]
pub fn metadata_lookup(national_dex: u16, forme_index: u16) -> Option<FormeMetadata> {
    ALL_SPECIES
        .get(national_dex as usize - 1)
        .and_then(|s| s.formes.get(forme_index as usize))
        .cloned()
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = SpeciesLookup))]
pub fn species_lookup(national_dex: u16) -> Option<SpeciesMetadata> {
    ALL_SPECIES.get(national_dex as usize - 1).cloned()
}

pub mod form {
    pub const PICHU_SPIKY_EARED: u16 = 1;
    pub const UNOWN_QUESTION: u16 = 26;
    pub const CASTFORM_SNOWY: u16 = 3;
    pub const DEOXYS_SPEED: u16 = 3;
    pub const BURMY_TRASH: u16 = 2;
    pub const WORMADAM_TRASH: u16 = 2;
    pub const MOTHIM_TRASH: u16 = 2;
    pub const CHERRIM_SUNSHINE: u16 = 1;
    pub const SHELLOS_EAST_SEA: u16 = 1;
    pub const GASTRODON_EAST_SEA: u16 = 1;
    pub const ROTOM_MOW: u16 = 5;
    pub const ARCEUS_CURSE_GEN4: u16 = 9;
    pub const ARCEUS_DARK_GEN4: u16 = 17;
    pub const ARCEUS_LEGEND: u16 = 18;
}
