use std::sync::OnceLock;

pub struct TextResource {
    raw: &'static str,
    lines: OnceLock<Vec<&'static str>>,
}

impl TextResource {
    pub const fn new(raw: &'static str) -> Self {
        Self {
            raw,
            lines: OnceLock::new(),
        }
    }

    pub fn line(&self, n: usize) -> Option<&'static str> {
        self.lines
            .get_or_init(|| self.raw.lines().collect())
            .get(n)
            .copied()
    }
}
