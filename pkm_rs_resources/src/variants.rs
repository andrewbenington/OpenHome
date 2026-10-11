use crate::metadata_source::MetadataSource;
use crate::species::BaseForm;
use crate::species::SpeciesForm;

use pkm_rs_types::{GameSetting, NationalDex};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub fn can_be_alpha(species_form: SpeciesForm) -> bool {
    can_be_alpha_lza(species_form)
        || can_be_alpha_la(species_form)
        || can_be_alpha_lza(species_form.get_base_evolution())
        || can_be_alpha_la(species_form.get_base_evolution())
}

pub fn can_be_alpha_la(species_form: SpeciesForm) -> bool {
    let form_metadata = species_form.get_form_metadata();
    MetadataSource::LegendsArceus.supports_form(species_form)
        && !form_metadata.is_sub_legend
        && !form_metadata.is_restricted_legend
        && !form_metadata.is_mythical
        && !form_metadata
            .regional
            .is_some_and(|setting| setting == GameSetting::Alola) // Alolan Vulpix cannot be alpha
}

const FLOETTE_ETERNAL: u16 = 5;
const GRENINJA_BATTLE_BOND: u16 = 1;

pub fn can_be_alpha_lza(species_form: SpeciesForm) -> bool {
    let form_metadata = species_form.get_form_metadata();

    match (species_form.get_ndex(), species_form.get_form_index()) {
        (NationalDex::Floette, FLOETTE_ETERNAL) | (NationalDex::Greninja, GRENINJA_BATTLE_BOND) => {
            false
        }
        _ => {
            MetadataSource::LegendsZa.supports_form(species_form)
                && !form_metadata.is_sub_legend
                && !form_metadata.is_restricted_legend
                && !form_metadata.is_mythical
        }
    }
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
        | NationalDex::Eevee => species_form.get_form_index() == 0,
        _ => false,
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "hasGigantamaxForm"))]
#[allow(clippy::missing_const_for_fn)]
pub fn has_gigantamax_form_wasm(national_dex: NationalDex, form_index: u16) -> bool {
    SpeciesForm::new_valid_ndex(national_dex, form_index).is_ok_and(has_gigantamax_form)
}

pub const fn is_acquirable_totem_form(species_form: SpeciesForm) -> bool {
    let (national_dex, form_index) = species_form.split();
    match national_dex {
        NationalDex::Gumshoos
        | NationalDex::Araquanid
        | NationalDex::Lurantis
        | NationalDex::Salazzle
        | NationalDex::Vikavolt
        | NationalDex::Togedemaru
        | NationalDex::Mimikyu
        | NationalDex::Ribombee
        | NationalDex::Kommoo => form_index == 1,
        NationalDex::Raticate | NationalDex::Marowak => form_index == 2,
        _ => false,
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "isAcquirableTotemForm"))]
#[allow(clippy::missing_const_for_fn)]
pub fn is_acquirable_totem_form_wasm(national_dex: NationalDex, form_index: u16) -> bool {
    SpeciesForm::new_valid_ndex(national_dex, form_index).is_ok_and(is_acquirable_totem_form)
}

pub const fn totem_form_acquirable(species_form: SpeciesForm) -> bool {
    match species_form.get_ndex() {
        NationalDex::Gumshoos
        | NationalDex::Araquanid
        | NationalDex::Lurantis
        | NationalDex::Salazzle
        | NationalDex::Vikavolt
        | NationalDex::Togedemaru
        | NationalDex::Mimikyu
        | NationalDex::Ribombee
        | NationalDex::Kommoo => true,
        NationalDex::Raticate | NationalDex::Marowak => species_form.get_form_index() == 1,
        _ => false,
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "totemFormAcquirable"))]
#[allow(clippy::missing_const_for_fn)]
pub fn totem_form_acquirable_wasm(national_dex: NationalDex, form_index: u16) -> bool {
    SpeciesForm::new_valid_ndex(national_dex, form_index).is_ok_and(totem_form_acquirable)
}

const RATICATE_ALOLA: SpeciesForm =
    unsafe { SpeciesForm::unchecked_form(NationalDex::Raticate, 1) };
const MAROWAK_ALOLA: SpeciesForm = unsafe { SpeciesForm::unchecked_form(NationalDex::Marowak, 1) };

pub const fn acquirable_totem_base_form(national_dex: NationalDex) -> Option<SpeciesForm> {
    match national_dex {
        NationalDex::Gumshoos
        | NationalDex::Araquanid
        | NationalDex::Lurantis
        | NationalDex::Salazzle
        | NationalDex::Vikavolt
        | NationalDex::Togedemaru
        | NationalDex::Mimikyu
        | NationalDex::Ribombee
        | NationalDex::Kommoo => Some(SpeciesForm::base_form(national_dex)),
        NationalDex::Marowak => Some(MAROWAK_ALOLA),
        NationalDex::Raticate => Some(RATICATE_ALOLA),
        _ => None,
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "acquirableTotemBaseForm"))]
#[allow(clippy::missing_const_for_fn)]
pub fn acquirable_totem_base_form_wasm(national_dex: NationalDex) -> Option<SpeciesForm> {
    acquirable_totem_base_form(national_dex)
}

pub const fn can_be_titan(species_form: SpeciesForm) -> bool {
    matches!(
        species_form.get_ndex(),
        NationalDex::Klawf
            | NationalDex::Bombirdier
            | NationalDex::Orthworm
            | NationalDex::GreatTusk
            | NationalDex::IronTreads
            | NationalDex::Tatsugiri
    )
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "canBeTitan"))]
#[allow(clippy::missing_const_for_fn)]
pub fn can_be_titan_wasm(national_dex: NationalDex, form_index: u16) -> bool {
    SpeciesForm::new_valid_ndex(national_dex, form_index).is_ok_and(can_be_titan)
}

pub fn can_be_ns_pokemon(species_form: SpeciesForm) -> bool {
    let (national_dex, form_index) = species_form.get_base_evolution().split();
    form_index == 0
        && (species_form.is_or_evolves_from(NationalDex::Boldore.base_form())
            || matches!(
                national_dex,
                NationalDex::Purrloin
                    | NationalDex::Pidove
                    | NationalDex::Timburr
                    | NationalDex::Tympole
                    | NationalDex::Woobat
                    | NationalDex::Sandile
                    | NationalDex::Darumaka
                    | NationalDex::Scraggy
                    | NationalDex::Sigilyph
                    | NationalDex::Zorua
                    | NationalDex::Joltik
                    | NationalDex::Ferroseed
                    | NationalDex::Klink
            ))
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "canBeNsPokemon"))]
#[allow(clippy::missing_const_for_fn)]
pub fn can_be_ns_pokemon_wasm(national_dex: NationalDex, form_index: u16) -> bool {
    SpeciesForm::new_valid_ndex(national_dex, form_index).is_ok_and(can_be_ns_pokemon)
}
