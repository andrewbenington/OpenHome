use pkm_rs_types::{Language, OriginGame};

use crate::text_resource::TextResource;

static LOCATION_NAMES_GBA_GERMAN: TextResource =
    TextResource::new(include_str!("text_rsefrlg_00000_de.txt"));
static LOCATION_NAMES_GBA_ENGLISH: TextResource =
    TextResource::new(include_str!("text_rsefrlg_00000_en.txt"));
static LOCATION_NAMES_GBA_SPANISH_EU: TextResource =
    TextResource::new(include_str!("text_rsefrlg_00000_es.txt"));
static LOCATION_NAMES_GBA_SPANISH_LA: TextResource =
    TextResource::new(include_str!("text_rsefrlg_00000_es-419.txt"));
static LOCATION_NAMES_GBA_FRENCH: TextResource =
    TextResource::new(include_str!("text_rsefrlg_00000_fr.txt"));
static LOCATION_NAMES_GBA_ITALIAN: TextResource =
    TextResource::new(include_str!("text_rsefrlg_00000_it.txt"));
static LOCATION_NAMES_GBA_JAPANESE: TextResource =
    TextResource::new(include_str!("text_rsefrlg_00000_ja.txt"));
static LOCATION_NAMES_GBA_KOREAN: TextResource =
    TextResource::new(include_str!("text_rsefrlg_00000_ko.txt"));
static LOCATION_NAMES_GBA_CH_SIMPLIFIED: TextResource =
    TextResource::new(include_str!("text_rsefrlg_00000_zh-Hans.txt"));
static LOCATION_NAMES_GBA_CH_TRADITIONAL: TextResource =
    TextResource::new(include_str!("text_rsefrlg_00000_zh-Hant.txt"));

static LOCATION_NAMES_COLOXD_GERMAN: TextResource =
    TextResource::new(include_str!("text_cxd_00000_de.txt"));
static LOCATION_NAMES_COLOXD_ENGLISH: TextResource =
    TextResource::new(include_str!("text_cxd_00000_en.txt"));
static LOCATION_NAMES_COLOXD_SPANISH_EU: TextResource =
    TextResource::new(include_str!("text_cxd_00000_es.txt"));
static LOCATION_NAMES_COLOXD_SPANISH_LA: TextResource =
    TextResource::new(include_str!("text_cxd_00000_es-419.txt"));
static LOCATION_NAMES_COLOXD_FRENCH: TextResource =
    TextResource::new(include_str!("text_cxd_00000_fr.txt"));
static LOCATION_NAMES_COLOXD_ITALIAN: TextResource =
    TextResource::new(include_str!("text_cxd_00000_it.txt"));
static LOCATION_NAMES_COLOXD_JAPANESE: TextResource =
    TextResource::new(include_str!("text_cxd_00000_ja.txt"));
static LOCATION_NAMES_COLOXD_CH_SIMPLIFIED: TextResource =
    TextResource::new(include_str!("text_cxd_00000_zh-Hans.txt"));
static LOCATION_NAMES_COLOXD_CH_TRADITIONAL: TextResource =
    TextResource::new(include_str!("text_cxd_00000_zh-Hant.txt"));

fn gba_location_name(language: Language, index: usize) -> Option<&'static str> {
    let text_resource = match language {
        Language::German => &LOCATION_NAMES_GBA_GERMAN,
        Language::English => &LOCATION_NAMES_GBA_ENGLISH,
        Language::SpanishSpain => &LOCATION_NAMES_GBA_SPANISH_EU,
        Language::SpanishLatinAmerica => &LOCATION_NAMES_GBA_SPANISH_LA,
        Language::French => &LOCATION_NAMES_GBA_FRENCH,
        Language::Italian => &LOCATION_NAMES_GBA_ITALIAN,
        Language::Japanese => &LOCATION_NAMES_GBA_JAPANESE,
        Language::Korean => &LOCATION_NAMES_GBA_KOREAN, // Gen 3 games were not released in Korea, but PKHeX has Korean location names somehow
        Language::ChineseSimplified => &LOCATION_NAMES_GBA_CH_SIMPLIFIED,
        Language::ChineseTraditional => &LOCATION_NAMES_GBA_CH_TRADITIONAL,
        _ => return None,
    };

    text_resource.line(index)
}

fn colo_xd_location_name(language: Language, index: usize) -> Option<&'static str> {
    let text_resource = match language {
        Language::German => &LOCATION_NAMES_COLOXD_GERMAN,
        Language::English => &LOCATION_NAMES_COLOXD_ENGLISH,
        Language::SpanishSpain => &LOCATION_NAMES_COLOXD_SPANISH_EU,
        Language::SpanishLatinAmerica => &LOCATION_NAMES_COLOXD_SPANISH_LA,
        Language::French => &LOCATION_NAMES_COLOXD_FRENCH,
        Language::Italian => &LOCATION_NAMES_COLOXD_ITALIAN,
        Language::Japanese => &LOCATION_NAMES_COLOXD_JAPANESE,
        Language::Korean => return None, // Gen 3 games were not released in Korea
        Language::ChineseSimplified => &LOCATION_NAMES_COLOXD_CH_SIMPLIFIED,
        Language::ChineseTraditional => &LOCATION_NAMES_COLOXD_CH_TRADITIONAL,
        _ => return None,
    };

    text_resource.line(index)
}

pub(super) fn location_name(
    game: OriginGame,
    language: Language,
    index: usize,
) -> Option<&'static str> {
    if game.is_gba() {
        gba_location_name(language, index)
    } else if game == OriginGame::ColosseumXd {
        colo_xd_location_name(language, index)
    } else {
        None
    }
}
