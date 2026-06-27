use pkm_rs_types::Language;

use crate::text_resource::TextResource;

static LOCATION_NAMES_0000_GERMAN: TextResource =
    TextResource::new(include_str!("text_hgss_00000_de.txt"));
static LOCATION_NAMES_0000_ENGLISH: TextResource =
    TextResource::new(include_str!("text_hgss_00000_en.txt"));
static LOCATION_NAMES_0000_SPANISH_EU: TextResource =
    TextResource::new(include_str!("text_hgss_00000_es.txt"));
static LOCATION_NAMES_0000_SPANISH_LA: TextResource =
    TextResource::new(include_str!("text_hgss_00000_es-419.txt"));
static LOCATION_NAMES_0000_FRENCH: TextResource =
    TextResource::new(include_str!("text_hgss_00000_fr.txt"));
static LOCATION_NAMES_0000_ITALIAN: TextResource =
    TextResource::new(include_str!("text_hgss_00000_it.txt"));
static LOCATION_NAMES_0000_JAPANESE: TextResource =
    TextResource::new(include_str!("text_hgss_00000_ja.txt"));
static LOCATION_NAMES_0000_KOREAN: TextResource =
    TextResource::new(include_str!("text_hgss_00000_ko.txt"));
static LOCATION_NAMES_0000_CH_SIMPLIFIED: TextResource =
    TextResource::new(include_str!("text_hgss_00000_zh-Hans.txt"));
static LOCATION_NAMES_0000_CH_TRADITIONAL: TextResource =
    TextResource::new(include_str!("text_hgss_00000_zh-Hant.txt"));

fn location_name_0000(language: Language, index: usize) -> Option<&'static str> {
    let text_resource = match language {
        Language::German => &LOCATION_NAMES_0000_GERMAN,
        Language::English => &LOCATION_NAMES_0000_ENGLISH,
        Language::SpanishSpain => &LOCATION_NAMES_0000_SPANISH_EU,
        Language::SpanishLatinAmerica => &LOCATION_NAMES_0000_SPANISH_LA,
        Language::French => &LOCATION_NAMES_0000_FRENCH,
        Language::Italian => &LOCATION_NAMES_0000_ITALIAN,
        Language::Japanese => &LOCATION_NAMES_0000_JAPANESE,
        Language::Korean => &LOCATION_NAMES_0000_KOREAN,
        Language::ChineseSimplified => &LOCATION_NAMES_0000_CH_SIMPLIFIED,
        Language::ChineseTraditional => &LOCATION_NAMES_0000_CH_TRADITIONAL,
        _ => return None,
    };

    text_resource.line(index)
}

static LOCATION_NAMES_2000_GERMAN: TextResource =
    TextResource::new(include_str!("text_hgss_02000_de.txt"));
static LOCATION_NAMES_2000_ENGLISH: TextResource =
    TextResource::new(include_str!("text_hgss_02000_en.txt"));
static LOCATION_NAMES_2000_SPANISH_EU: TextResource =
    TextResource::new(include_str!("text_hgss_02000_es.txt"));
static LOCATION_NAMES_2000_SPANISH_LA: TextResource =
    TextResource::new(include_str!("text_hgss_02000_es-419.txt"));
static LOCATION_NAMES_2000_FRENCH: TextResource =
    TextResource::new(include_str!("text_hgss_02000_fr.txt"));
static LOCATION_NAMES_2000_ITALIAN: TextResource =
    TextResource::new(include_str!("text_hgss_02000_it.txt"));
static LOCATION_NAMES_2000_JAPANESE: TextResource =
    TextResource::new(include_str!("text_hgss_02000_ja.txt"));
static LOCATION_NAMES_2000_KOREAN: TextResource =
    TextResource::new(include_str!("text_hgss_02000_ko.txt"));
static LOCATION_NAMES_2000_CH_SIMPLIFIED: TextResource =
    TextResource::new(include_str!("text_hgss_02000_zh-Hans.txt"));
static LOCATION_NAMES_2000_CH_TRADITIONAL: TextResource =
    TextResource::new(include_str!("text_hgss_02000_zh-Hant.txt"));

fn location_name_2000(language: Language, index: usize) -> Option<&'static str> {
    let text_resource = match language {
        Language::German => &LOCATION_NAMES_2000_GERMAN,
        Language::English => &LOCATION_NAMES_2000_ENGLISH,
        Language::SpanishSpain => &LOCATION_NAMES_2000_SPANISH_EU,
        Language::SpanishLatinAmerica => &LOCATION_NAMES_2000_SPANISH_LA,
        Language::French => &LOCATION_NAMES_2000_FRENCH,
        Language::Italian => &LOCATION_NAMES_2000_ITALIAN,
        Language::Japanese => &LOCATION_NAMES_2000_JAPANESE,
        Language::Korean => &LOCATION_NAMES_2000_KOREAN,
        Language::ChineseSimplified => &LOCATION_NAMES_2000_CH_SIMPLIFIED,
        Language::ChineseTraditional => &LOCATION_NAMES_2000_CH_TRADITIONAL,
        _ => return None,
    };

    text_resource.line(index)
}

static LOCATION_NAMES_3000_GERMAN: TextResource =
    TextResource::new(include_str!("text_hgss_03000_de.txt"));
static LOCATION_NAMES_3000_ENGLISH: TextResource =
    TextResource::new(include_str!("text_hgss_03000_en.txt"));
static LOCATION_NAMES_3000_SPANISH_EU: TextResource =
    TextResource::new(include_str!("text_hgss_03000_es.txt"));
static LOCATION_NAMES_3000_SPANISH_LA: TextResource =
    TextResource::new(include_str!("text_hgss_03000_es-419.txt"));
static LOCATION_NAMES_3000_FRENCH: TextResource =
    TextResource::new(include_str!("text_hgss_03000_fr.txt"));
static LOCATION_NAMES_3000_ITALIAN: TextResource =
    TextResource::new(include_str!("text_hgss_03000_it.txt"));
static LOCATION_NAMES_3000_JAPANESE: TextResource =
    TextResource::new(include_str!("text_hgss_03000_ja.txt"));
static LOCATION_NAMES_3000_KOREAN: TextResource =
    TextResource::new(include_str!("text_hgss_03000_ko.txt"));
static LOCATION_NAMES_3000_CH_SIMPLIFIED: TextResource =
    TextResource::new(include_str!("text_hgss_03000_zh-Hans.txt"));
static LOCATION_NAMES_3000_CH_TRADITIONAL: TextResource =
    TextResource::new(include_str!("text_hgss_03000_zh-Hant.txt"));

fn location_name_3000(language: Language, index: usize) -> Option<&'static str> {
    let text_resource = match language {
        Language::German => &LOCATION_NAMES_3000_GERMAN,
        Language::English => &LOCATION_NAMES_3000_ENGLISH,
        Language::SpanishSpain => &LOCATION_NAMES_3000_SPANISH_EU,
        Language::SpanishLatinAmerica => &LOCATION_NAMES_3000_SPANISH_LA,
        Language::French => &LOCATION_NAMES_3000_FRENCH,
        Language::Italian => &LOCATION_NAMES_3000_ITALIAN,
        Language::Japanese => &LOCATION_NAMES_3000_JAPANESE,
        Language::Korean => &LOCATION_NAMES_3000_KOREAN,
        Language::ChineseSimplified => &LOCATION_NAMES_3000_CH_SIMPLIFIED,
        Language::ChineseTraditional => &LOCATION_NAMES_3000_CH_TRADITIONAL,
        _ => return None,
    };

    text_resource.line(index)
}

pub(super) fn location_name(language: Language, index: usize) -> Option<&'static str> {
    match index {
        0..2000 => location_name_0000(language, index),
        2000..3000 => location_name_2000(language, index.checked_sub(2000)?),
        3000.. => location_name_3000(language, index.checked_sub(3000)?),
    }
}
