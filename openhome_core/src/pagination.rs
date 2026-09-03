#[cfg_attr(feature = "desktop", derive(specta::Type))]
#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PaginationCursor {
    page_size: usize,
    page_index: usize,
}

impl PaginationCursor {
    pub fn get_skip_count(&self) -> usize {
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
    pub results: Vec<T>,
    pub next_page_exists: bool,
    pub this_cursor: PaginationCursor,
    pub next_cursor: PaginationCursor,
    pub total_count: usize,
}
