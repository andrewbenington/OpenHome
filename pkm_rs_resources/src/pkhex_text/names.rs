use crate::{species::NatDexIndex, text_resource::TextResource};
use pkm_rs_types::Language;

static SPECIES_NAMES_GERMAN: TextResource =
    TextResource::new(include_str!("species/text_Species_de.txt"));
static SPECIES_NAMES_ENGLISH: TextResource =
    TextResource::new(include_str!("species/text_Species_en.txt"));
static SPECIES_NAMES_SPANISH_EU: TextResource =
    TextResource::new(include_str!("species/text_Species_es.txt"));
static SPECIES_NAMES_SPANISH_LA: TextResource =
    TextResource::new(include_str!("species/text_Species_es-419.txt"));
static SPECIES_NAMES_FRENCH: TextResource =
    TextResource::new(include_str!("species/text_Species_fr.txt"));
static SPECIES_NAMES_ITALIAN: TextResource =
    TextResource::new(include_str!("species/text_Species_it.txt"));
static SPECIES_NAMES_JAPANESE: TextResource =
    TextResource::new(include_str!("species/text_Species_ja.txt"));
static SPECIES_NAMES_KOREAN: TextResource =
    TextResource::new(include_str!("species/text_Species_ko.txt"));
static SPECIES_NAMES_CH_SIMPLIFIED: TextResource =
    TextResource::new(include_str!("species/text_Species_zh-Hans.txt"));
static SPECIES_NAMES_CH_TRADITIONAL: TextResource =
    TextResource::new(include_str!("species/text_Species_zh-Hant.txt"));

pub fn species_name_en(national_dex: NatDexIndex) -> &'static str {
    SPECIES_NAMES_ENGLISH
        .line(national_dex.to_u16() as usize)
        .expect("All valid NatDexIndex values should have a species name")
}

pub fn species_name(language: Language, national_dex: NatDexIndex) -> &'static str {
    let text_resource = match language {
        Language::German => &SPECIES_NAMES_GERMAN,
        Language::English => &SPECIES_NAMES_ENGLISH,
        Language::SpanishSpain => &SPECIES_NAMES_SPANISH_EU,
        Language::SpanishLatinAmerica => &SPECIES_NAMES_SPANISH_LA,
        Language::French => &SPECIES_NAMES_FRENCH,
        Language::Italian => &SPECIES_NAMES_ITALIAN,
        Language::Japanese => &SPECIES_NAMES_JAPANESE,
        Language::Korean => &SPECIES_NAMES_KOREAN,
        Language::ChineseSimplified => &SPECIES_NAMES_CH_SIMPLIFIED,
        Language::ChineseTraditional => &SPECIES_NAMES_CH_TRADITIONAL,
        _ => &SPECIES_NAMES_ENGLISH,
    };

    text_resource
        .line(national_dex.to_u16() as usize)
        .expect("All valid NatDexIndex values should have a species name")
}
