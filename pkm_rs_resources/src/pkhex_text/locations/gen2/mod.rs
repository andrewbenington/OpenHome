use pkm_rs_types::Language;

use crate::text_resource::TextResource;

static LOCATION_NAMES_GERMAN: TextResource =
    TextResource::new(include_str!("text_gsc_00000_de.txt"));
static LOCATION_NAMES_ENGLISH: TextResource =
    TextResource::new(include_str!("text_gsc_00000_en.txt"));
static LOCATION_NAMES_SPANISH_EU: TextResource =
    TextResource::new(include_str!("text_gsc_00000_es.txt"));
static LOCATION_NAMES_SPANISH_LA: TextResource =
    TextResource::new(include_str!("text_gsc_00000_es-419.txt"));
static LOCATION_NAMES_FRENCH: TextResource =
    TextResource::new(include_str!("text_gsc_00000_fr.txt"));
static LOCATION_NAMES_ITALIAN: TextResource =
    TextResource::new(include_str!("text_gsc_00000_it.txt"));
static LOCATION_NAMES_JAPANESE: TextResource =
    TextResource::new(include_str!("text_gsc_00000_ja.txt"));
static LOCATION_NAMES_KOREAN: TextResource =
    TextResource::new(include_str!("text_gsc_00000_ko.txt"));
static LOCATION_NAMES_CH_SIMPLIFIED: TextResource =
    TextResource::new(include_str!("text_gsc_00000_zh-Hans.txt"));
static LOCATION_NAMES_CH_TRADITIONAL: TextResource =
    TextResource::new(include_str!("text_gsc_00000_zh-Hant.txt"));

pub(super) fn location_name(language: Language, index: usize) -> Option<&'static str> {
    let text_resource = match language {
        Language::German => &LOCATION_NAMES_GERMAN,
        Language::English => &LOCATION_NAMES_ENGLISH,
        Language::SpanishSpain => &LOCATION_NAMES_SPANISH_EU,
        Language::SpanishLatinAmerica => &LOCATION_NAMES_SPANISH_LA,
        Language::French => &LOCATION_NAMES_FRENCH,
        Language::Italian => &LOCATION_NAMES_ITALIAN,
        Language::Japanese => &LOCATION_NAMES_JAPANESE,
        Language::Korean => &LOCATION_NAMES_KOREAN,
        Language::ChineseSimplified => &LOCATION_NAMES_CH_SIMPLIFIED,
        Language::ChineseTraditional => &LOCATION_NAMES_CH_TRADITIONAL,
        _ => return None,
    };

    text_resource.line(index)
}
