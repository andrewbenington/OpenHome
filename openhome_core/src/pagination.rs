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
    pub fn next_after_cursor(
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
            current_cursor: next_cursor,
            next_cursor: next_cursor.next(),
            total_count,
        }
    }
}
