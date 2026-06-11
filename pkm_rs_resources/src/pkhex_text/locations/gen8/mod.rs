use crate::text_resource::TextResource;
use pkm_rs_types::Language;

static LOCATION_NAMES_00000_GERMAN: TextResource =
    TextResource::new(include_str!("text_swsh_00000_de.txt"));
static LOCATION_NAMES_00000_ENGLISH: TextResource =
    TextResource::new(include_str!("text_swsh_00000_en.txt"));
static LOCATION_NAMES_00000_SPANISH_EU: TextResource =
    TextResource::new(include_str!("text_swsh_00000_es.txt"));
static LOCATION_NAMES_00000_SPANISH_LA: TextResource =
    TextResource::new(include_str!("text_swsh_00000_es-419.txt"));
static LOCATION_NAMES_00000_FRENCH: TextResource =
    TextResource::new(include_str!("text_swsh_00000_fr.txt"));
static LOCATION_NAMES_00000_ITALIAN: TextResource =
    TextResource::new(include_str!("text_swsh_00000_it.txt"));
static LOCATION_NAMES_00000_JAPANESE: TextResource =
    TextResource::new(include_str!("text_swsh_00000_ja.txt"));
static LOCATION_NAMES_00000_KOREAN: TextResource =
    TextResource::new(include_str!("text_swsh_00000_ko.txt"));
static LOCATION_NAMES_00000_CH_SIMPLIFIED: TextResource =
    TextResource::new(include_str!("text_swsh_00000_zh-Hans.txt"));
static LOCATION_NAMES_00000_CH_TRADITIONAL: TextResource =
    TextResource::new(include_str!("text_swsh_00000_zh-Hant.txt"));

fn location_name_swsh_00000(language: Language, index: usize) -> Option<&'static str> {
    let text_resource = match language {
        Language::German => &LOCATION_NAMES_00000_GERMAN,
        Language::English => &LOCATION_NAMES_00000_ENGLISH,
        Language::SpanishSpain => &LOCATION_NAMES_00000_SPANISH_EU,
        Language::SpanishLatinAmerica => &LOCATION_NAMES_00000_SPANISH_LA,
        Language::French => &LOCATION_NAMES_00000_FRENCH,
        Language::Italian => &LOCATION_NAMES_00000_ITALIAN,
        Language::Japanese => &LOCATION_NAMES_00000_JAPANESE,
        Language::Korean => &LOCATION_NAMES_00000_KOREAN,
        Language::ChineseSimplified => &LOCATION_NAMES_00000_CH_SIMPLIFIED,
        Language::ChineseTraditional => &LOCATION_NAMES_00000_CH_TRADITIONAL,
        _ => return None,
    };

    text_resource.line(index)
}

static LOCATION_NAMES_30000_GERMAN: TextResource =
    TextResource::new(include_str!("text_swsh_30000_de.txt"));
static LOCATION_NAMES_30000_ENGLISH: TextResource =
    TextResource::new(include_str!("text_swsh_30000_en.txt"));
static LOCATION_NAMES_30000_SPANISH_EU: TextResource =
    TextResource::new(include_str!("text_swsh_30000_es.txt"));
static LOCATION_NAMES_30000_SPANISH_LA: TextResource =
    TextResource::new(include_str!("text_swsh_30000_es-419.txt"));
static LOCATION_NAMES_30000_FRENCH: TextResource =
    TextResource::new(include_str!("text_swsh_30000_fr.txt"));
static LOCATION_NAMES_30000_ITALIAN: TextResource =
    TextResource::new(include_str!("text_swsh_30000_it.txt"));
static LOCATION_NAMES_30000_JAPANESE: TextResource =
    TextResource::new(include_str!("text_swsh_30000_ja.txt"));
static LOCATION_NAMES_30000_KOREAN: TextResource =
    TextResource::new(include_str!("text_swsh_30000_ko.txt"));
static LOCATION_NAMES_30000_CH_SIMPLIFIED: TextResource =
    TextResource::new(include_str!("text_swsh_30000_zh-Hans.txt"));
static LOCATION_NAMES_30000_CH_TRADITIONAL: TextResource =
    TextResource::new(include_str!("text_swsh_30000_zh-Hant.txt"));

fn location_name_swsh_30000(language: Language, index: usize) -> Option<&'static str> {
    let text_resource = match language {
        Language::German => &LOCATION_NAMES_30000_GERMAN,
        Language::English => &LOCATION_NAMES_30000_ENGLISH,
        Language::SpanishSpain => &LOCATION_NAMES_30000_SPANISH_EU,
        Language::SpanishLatinAmerica => &LOCATION_NAMES_30000_SPANISH_LA,
        Language::French => &LOCATION_NAMES_30000_FRENCH,
        Language::Italian => &LOCATION_NAMES_30000_ITALIAN,
        Language::Japanese => &LOCATION_NAMES_30000_JAPANESE,
        Language::Korean => &LOCATION_NAMES_30000_KOREAN,
        Language::ChineseSimplified => &LOCATION_NAMES_30000_CH_SIMPLIFIED,
        Language::ChineseTraditional => &LOCATION_NAMES_30000_CH_TRADITIONAL,
        _ => return None,
    };

    text_resource.line(index)
}

static LOCATION_NAMES_40000_GERMAN: TextResource =
    TextResource::new(include_str!("text_swsh_40000_de.txt"));
static LOCATION_NAMES_40000_ENGLISH: TextResource =
    TextResource::new(include_str!("text_swsh_40000_en.txt"));
static LOCATION_NAMES_40000_SPANISH_EU: TextResource =
    TextResource::new(include_str!("text_swsh_40000_es.txt"));
static LOCATION_NAMES_40000_SPANISH_LA: TextResource =
    TextResource::new(include_str!("text_swsh_40000_es-419.txt"));
static LOCATION_NAMES_40000_FRENCH: TextResource =
    TextResource::new(include_str!("text_swsh_40000_fr.txt"));
static LOCATION_NAMES_40000_ITALIAN: TextResource =
    TextResource::new(include_str!("text_swsh_40000_it.txt"));
static LOCATION_NAMES_40000_JAPANESE: TextResource =
    TextResource::new(include_str!("text_swsh_40000_ja.txt"));
static LOCATION_NAMES_40000_KOREAN: TextResource =
    TextResource::new(include_str!("text_swsh_40000_ko.txt"));
static LOCATION_NAMES_40000_CH_SIMPLIFIED: TextResource =
    TextResource::new(include_str!("text_swsh_40000_zh-Hans.txt"));
static LOCATION_NAMES_40000_CH_TRADITIONAL: TextResource =
    TextResource::new(include_str!("text_swsh_40000_zh-Hant.txt"));

fn location_name_swsh_40000(language: Language, index: usize) -> Option<&'static str> {
    let text_resource = match language {
        Language::German => &LOCATION_NAMES_40000_GERMAN,
        Language::English => &LOCATION_NAMES_40000_ENGLISH,
        Language::SpanishSpain => &LOCATION_NAMES_40000_SPANISH_EU,
        Language::SpanishLatinAmerica => &LOCATION_NAMES_40000_SPANISH_LA,
        Language::French => &LOCATION_NAMES_40000_FRENCH,
        Language::Italian => &LOCATION_NAMES_40000_ITALIAN,
        Language::Japanese => &LOCATION_NAMES_40000_JAPANESE,
        Language::Korean => &LOCATION_NAMES_40000_KOREAN,
        Language::ChineseSimplified => &LOCATION_NAMES_40000_CH_SIMPLIFIED,
        Language::ChineseTraditional => &LOCATION_NAMES_40000_CH_TRADITIONAL,
        _ => return None,
    };

    text_resource.line(index)
}

static LOCATION_NAMES_60000_GERMAN: TextResource =
    TextResource::new(include_str!("text_swsh_60000_de.txt"));
static LOCATION_NAMES_60000_ENGLISH: TextResource =
    TextResource::new(include_str!("text_swsh_60000_en.txt"));
static LOCATION_NAMES_60000_SPANISH_EU: TextResource =
    TextResource::new(include_str!("text_swsh_60000_es.txt"));
static LOCATION_NAMES_60000_SPANISH_LA: TextResource =
    TextResource::new(include_str!("text_swsh_60000_es-419.txt"));
static LOCATION_NAMES_60000_FRENCH: TextResource =
    TextResource::new(include_str!("text_swsh_60000_fr.txt"));
static LOCATION_NAMES_60000_ITALIAN: TextResource =
    TextResource::new(include_str!("text_swsh_60000_it.txt"));
static LOCATION_NAMES_60000_JAPANESE: TextResource =
    TextResource::new(include_str!("text_swsh_60000_ja.txt"));
static LOCATION_NAMES_60000_KOREAN: TextResource =
    TextResource::new(include_str!("text_swsh_60000_ko.txt"));
static LOCATION_NAMES_60000_CH_SIMPLIFIED: TextResource =
    TextResource::new(include_str!("text_swsh_60000_zh-Hans.txt"));
static LOCATION_NAMES_60000_CH_TRADITIONAL: TextResource =
    TextResource::new(include_str!("text_swsh_60000_zh-Hant.txt"));

fn location_name_swsh_60000(language: Language, index: usize) -> Option<&'static str> {
    let text_resource = match language {
        Language::German => &LOCATION_NAMES_60000_GERMAN,
        Language::English => &LOCATION_NAMES_60000_ENGLISH,
        Language::SpanishSpain => &LOCATION_NAMES_60000_SPANISH_EU,
        Language::SpanishLatinAmerica => &LOCATION_NAMES_60000_SPANISH_LA,
        Language::French => &LOCATION_NAMES_60000_FRENCH,
        Language::Italian => &LOCATION_NAMES_60000_ITALIAN,
        Language::Japanese => &LOCATION_NAMES_60000_JAPANESE,
        Language::Korean => &LOCATION_NAMES_60000_KOREAN,
        Language::ChineseSimplified => &LOCATION_NAMES_60000_CH_SIMPLIFIED,
        Language::ChineseTraditional => &LOCATION_NAMES_60000_CH_TRADITIONAL,
        _ => return None,
    };

    text_resource.line(index)
}

pub(super) fn location_name(language: Language, index: usize) -> Option<&'static str> {
    match index {
        0..30000 => location_name_swsh_00000(language, index),
        30000..40000 => location_name_swsh_30000(language, index.checked_sub(30000)?),
        40000..60000 => location_name_swsh_40000(language, index.checked_sub(40000)?),
        60000.. => location_name_swsh_60000(language, index.checked_sub(60000)?),
    }
}
