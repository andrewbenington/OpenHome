use pkm_rs::ohpkm::OhpkmV2;
use pkm_rs::traits::HasSpeciesAndForm;
use pkm_rs_resources::moves::MoveIndex;
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_types::{Gender, PkmType};

#[cfg_attr(feature = "desktop", derive(specta::Type))]
#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PaginationCursor {
    page_size: usize,
    page_index: usize,
}

impl PaginationCursor {
    pub fn get_offset(&self) -> usize {
        self.page_size.saturating_mul(self.page_index)
    }

    pub fn get_page_size(&self) -> usize {
        self.page_size
    }

    pub fn next(&self) -> Self {
        Self {
            page_index: self.page_index + 1,
            ..*self
        }
    }
}

#[cfg_attr(feature = "desktop", derive(specta::Type))]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedPage<T> {
    results: Vec<T>,
    next_page_exists: bool,
    current_cursor: PaginationCursor,
    next_cursor: PaginationCursor,
    total_count: usize,
}

impl<T> PaginatedPage<T> {
    pub fn get_for_cursor(
        current_cursor: PaginationCursor,
        data: impl Iterator<Item = T>,
        total_count: usize,
    ) -> PaginatedPage<T> {
        let page = data
            .skip(current_cursor.get_offset())
            .take(current_cursor.get_page_size());

        let next_cursor = current_cursor.next();

        PaginatedPage {
            results: page.collect(),
            next_page_exists: next_cursor.get_offset() < total_count,
            current_cursor,
            next_cursor,
            total_count,
        }
    }
}

#[cfg_attr(feature = "desktop", derive(specta::Type))]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum Filter {
    NationalDex(u16),
    FormIndex(u16),
    HasType(PkmType),
    LastSave(u8),
    OriginGame(u8),
    Nature(NatureIndex),
    IsShiny(bool),
    Gender(Gender),
    Level(u8),
    Move(u8, MoveIndex),
    MoveTextPrefixEng(String),
    NicknamePrefix(String),
    BaseEvolution(u16),
}

impl Filter {
    pub fn applies(&self, ohpkm: &OhpkmV2) -> bool {
        match self {
            Self::NationalDex(national_dex) => ohpkm.species_and_form().get_ndex() == *national_dex,
            Self::BaseEvolution(base_evo_ndex) => {
                ohpkm.species_and_form().get_base_evolution().get_ndex() == *base_evo_ndex
            }
            Self::FormIndex(form_index) => {
                ohpkm.species_and_form().get_forme_index() == *form_index
            }
            Self::HasType(pkm_type) => {
                ohpkm.type1() == *pkm_type || ohpkm.type2().is_some_and(|t2| t2 == *pkm_type)
            }
            Self::LastSave(game) => ohpkm
                .most_recent_save()
                .is_some_and(|save| save.game as u8 == *game),
            Self::OriginGame(game) => ohpkm.game_of_origin() as u8 == *game,
            Self::Nature(nature_index) => ohpkm.nature() == *nature_index,
            Self::IsShiny(is_shiny) => ohpkm.is_shiny() == *is_shiny,
            Self::Gender(gender) => ohpkm.gender() == *gender,
            Self::Level(level) => ohpkm.calculate_level() == *level,
            Self::Move(index, move_id) => {
                let u2_index = arbitrary_int::u2::extract_u8(*index, 0);
                *index <= 3 && ohpkm.moves().at(u2_index).move_index == *move_id
            }
            Self::MoveTextPrefixEng(prefix) => ohpkm.moves().into_iter().any(|move_slot| {
                move_slot.move_index.get_metadata().is_some_and(|metadata| {
                    metadata
                        .name
                        .to_lowercase()
                        .starts_with(&prefix.to_lowercase())
                })
            }),
            Self::NicknamePrefix(prefix) => ohpkm.nickname().to_string().starts_with(prefix),
        }
    }
}

pub type Filters = Vec<Filter>;
