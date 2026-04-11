use crate::{language::Language, pkhex_text, species::NatDexIndex};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub fn species_name(national_dex: NatDexIndex, language: Language) -> &'static str {
    pkhex_text::species_name(language, national_dex)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct Lookup;

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl Lookup {
    #[wasm_bindgen(js_name = speciesName)]
    pub fn species_name(national_dex: u16, language: Language) -> String {
        let Ok(national_dex) = NatDexIndex::new(national_dex) else {
            return format!("UNKNOWN SPECIES ({national_dex})");
        };
        pkhex_text::species_name(language, national_dex).to_owned()
    }
}
