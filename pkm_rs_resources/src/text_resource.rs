use std::sync::OnceLock;

pub struct TextResource(RawTextResource);

impl TextResource {
    pub const fn new(raw: &'static str) -> Self {
        Self(RawTextResource::new(raw))
    }

    pub fn lines(&self) -> &[&'static str] {
        self.0.get_lines()
    }

    // only requested text resources are ever loaded
    pub fn line(&self, n: usize) -> Option<&'static str> {
        self.lines().get(n).copied()
    }

    #[cfg(test)]
    pub fn count(&self) -> usize {
        self.lines().len()
    }
}

struct RawTextResource {
    raw: &'static str,
    lines: OnceLock<Vec<&'static str>>,
}

impl RawTextResource {
    const fn new(raw: &'static str) -> Self {
        Self {
            raw,
            lines: OnceLock::new(),
        }
    }

    fn get_lines(&self) -> &[&'static str] {
        self.lines.get_or_init(|| self.raw.lines().collect())
    }
}
