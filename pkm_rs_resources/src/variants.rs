use crate::metadata_source::MetadataSource;
use crate::species::SpeciesForm;

use pkm_rs_types::{GameSetting, NationalDex};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub fn can_be_alpha(species_form: SpeciesForm) -> bool {
    can_be_alpha_lza(species_form) || can_be_alpha_la(species_form)
}

pub fn can_be_alpha_la(species_form: SpeciesForm) -> bool {
    let form_metadata = species_form.get_forme_metadata();
    MetadataSource::LegendsArceus.supports_form(species_form)
        && !form_metadata.is_sub_legend
        && !form_metadata.is_restricted_legend
        && !form_metadata.is_mythical
        && !form_metadata
            .regional
            .is_some_and(|setting| setting == GameSetting::Alola) // Alolan Vulpix cannot be alpha
}

const FLOETTE_ETERNAL: u16 = 5;

pub fn can_be_alpha_lza(species_form: SpeciesForm) -> bool {
    let form_metadata = species_form.get_forme_metadata();
    if species_form.get_ndex() == NationalDex::Floette
        && species_form.get_forme_index() == FLOETTE_ETERNAL
    {
        return false;
    }

    MetadataSource::LegendsZa.supports_form(species_form)
        && !form_metadata.is_sub_legend
        && !form_metadata.is_restricted_legend
        && !form_metadata.is_mythical
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "canBeAlpha"))]
#[allow(clippy::missing_const_for_fn)]
pub fn can_be_alpha_wasm(national_dex: NationalDex, form_index: u16) -> bool {
    SpeciesForm::new_valid_ndex(national_dex, form_index).is_ok_and(can_be_alpha)
}

pub const fn has_gigantamax_form(species_form: SpeciesForm) -> bool {
    match species_form.get_ndex() {
        NationalDex::Butterfree
        | NationalDex::Kingler
        | NationalDex::Lapras
        | NationalDex::Snorlax
        | NationalDex::Machamp
        | NationalDex::Garbodor
        | NationalDex::Melmetal
        | NationalDex::Corviknight
        | NationalDex::Orbeetle
        | NationalDex::Drednaw
        | NationalDex::Coalossal
        | NationalDex::Flapple
        | NationalDex::Appletun
        | NationalDex::Sandaconda
        | NationalDex::Toxtricity
        | NationalDex::Centiskorch
        | NationalDex::Hatterene
        | NationalDex::Grimmsnarl
        | NationalDex::Alcremie
        | NationalDex::Copperajah
        | NationalDex::Duraludon
        | NationalDex::Rillaboom
        | NationalDex::Cinderace
        | NationalDex::Inteleon
        | NationalDex::Eternatus
        | NationalDex::Urshifu => true,
        NationalDex::Venusaur
        | NationalDex::Charizard
        | NationalDex::Blastoise
        | NationalDex::Pikachu
        | NationalDex::Meowth
        | NationalDex::Gengar
        | NationalDex::Eevee => species_form.get_forme_index() == 0,
        _ => false,
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "hasGigantamaxForm"))]
#[allow(clippy::missing_const_for_fn)]
pub fn has_gigantamax_form_wasm(national_dex: NationalDex, form_index: u16) -> bool {
    SpeciesForm::new_valid_ndex(national_dex, form_index).is_ok_and(has_gigantamax_form)
}
