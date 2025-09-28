mod metadata;
mod types;

pub use metadata::*;
pub use types::*;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = MetadataLookup))]
pub fn metadata_lookup(national_dex: u16, forme_index: u16) -> Option<FormeMetadata> {
    ALL_SPECIES
        .get(national_dex as usize)
        .and_then(|s| s.formes.get(forme_index as usize))
        .cloned()
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = SpeciesLookup))]
pub fn species_lookup(national_dex: u16) -> Option<SpeciesMetadata> {
    ALL_SPECIES.get(national_dex as usize).cloned()
}
