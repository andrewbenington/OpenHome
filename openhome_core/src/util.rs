use std::collections::HashSet;
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::Path;

use crate::error::{Error, Result};

#[cfg_attr(feature = "desktop", derive(specta::Type))]
#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct PathData {
    pub raw: String,
    pub name: String,
    pub dir: String,
    pub ext: String,
    pub separator: String,
}

impl PartialEq for PathData {
    fn eq(&self, other: &Self) -> bool {
        self.raw == other.raw
    }
}

impl Eq for PathData {}
impl Hash for PathData {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.raw.hash(state);
    }
}

pub fn parse_path_data(path: &Path) -> PathData {
    let raw = path.to_string_lossy().to_string();
    let name = path
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .into();
    let ext = path
        .extension()
        .unwrap_or_default()
        .to_string_lossy()
        .into();
    let dir = path
        .parent()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();
    let separator = std::path::MAIN_SEPARATOR.to_string();
    PathData {
        raw,
        name,
        dir,
        ext,
        separator,
    }
}

pub fn create_directory<P>(path: P) -> Result<()>
where
    P: AsRef<Path>,
{
    fs::create_dir_all(&path).map_err(|err| Error::file_access(&path, err))
}

pub fn read_file_bytes<P>(path: P) -> Result<Vec<u8>>
where
    P: AsRef<Path>,
{
    fs::read(&path).map_err(|err| Error::file_access(&path, err))
}

pub fn dedupe_paths(paths: &mut Vec<PathData>) {
    let set: HashSet<PathData> = paths.drain(..).collect();
    *paths = set.into_iter().collect()
}
