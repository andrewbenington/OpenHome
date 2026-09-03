use std::fs::{self, DirEntry};
use std::path::{Path, PathBuf};

use crate::error::{Error, Result};

const STORAGE_DIR_NAME: &str = "storage";
pub const MONS_V2_DIR: &str = "mons_v2";
const PLUGINS_DIR_NAME: &str = "plugins";
const LOG_DIR_NAME: &str = "logs";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DataDir {
    Storage,
    Plugins,
    OpenHomeRoot,
    Logs,
}

impl DataDir {
    pub fn get_relative_path(&self) -> Option<&str> {
        match self {
            DataDir::Storage => Some(STORAGE_DIR_NAME),
            DataDir::Plugins => Some(PLUGINS_DIR_NAME),
            DataDir::Logs => Some(LOG_DIR_NAME),
            DataDir::OpenHomeRoot => None,
        }
    }
}

pub trait DataController {
    fn get_data_folder(&self) -> Result<PathBuf>;

    fn get_config_folder(&self) -> Result<PathBuf>;

    fn absolute_path<P>(&self, dir: DataDir, relative_path: P) -> Result<PathBuf>
    where
        P: AsRef<Path>,
    {
        self.absolute_dir_path(dir).map(|p| p.join(relative_path))
    }

    fn absolute_dir_path(&self, dir: DataDir) -> Result<PathBuf> {
        let data_folder = self.get_data_folder()?;
        if let Some(rel_path) = dir.get_relative_path() {
            Ok(data_folder.join(rel_path))
        } else {
            Ok(data_folder)
        }
    }

    fn read_file_json<P, T>(&self, dir: DataDir, relative_path: P) -> Result<T>
    where
        P: AsRef<Path>,
        T: serde::de::DeserializeOwned,
    {
        read_file_json(self.absolute_dir_path(dir)?.join(relative_path))
    }

    fn write_file_json<P, V>(&self, dir: DataDir, relative_path: P, value: V) -> Result<()>
    where
        P: AsRef<Path>,
        V: serde::ser::Serialize,
    {
        write_file_json(self.absolute_dir_path(dir)?.join(relative_path), value)
    }

    fn read_file_text<P>(&self, dir: DataDir, relative_path: P) -> Result<String>
    where
        P: AsRef<Path>,
    {
        read_file_text(self.absolute_dir_path(dir)?.join(relative_path))
    }

    fn read_file_text_if_exists<P>(&self, dir: DataDir, relative_path: P) -> Option<Result<String>>
    where
        P: AsRef<Path>,
    {
        let full_path = match self.absolute_path(dir, relative_path) {
            Ok(path) => path,
            Err(err) => return Some(Err(err)),
        };

        if !full_path.exists() {
            return None;
        }
        Some(read_file_text(full_path))
    }

    fn write_file_text<P>(&self, dir: DataDir, relative_path: P, value: &str) -> Result<()>
    where
        P: AsRef<Path>,
    {
        write_file_contents(self.absolute_dir_path(dir)?.join(relative_path), value)
    }

    fn delete_file<P>(&self, dir: DataDir, relative_path: P) -> Result<()>
    where
        P: AsRef<Path>,
    {
        delete_file(self.absolute_dir_path(dir)?.join(relative_path))
    }

    fn truncate_file<P>(&self, dir: DataDir, relative_path: P) -> crate::Result<()>
    where
        P: AsRef<std::path::Path>,
    {
        let full_path = self.absolute_dir_path(dir)?.join(relative_path);
        open_file_for_writing(&full_path).and_then(|file| {
            file.set_len(0)
                .map_err(|e| Error::file_write(&full_path, e))
        })
    }

    fn read_file_json_if_exists<P, T>(&self, dir: DataDir, relative_path: P) -> Option<Result<T>>
    where
        P: AsRef<Path>,
        T: serde::de::DeserializeOwned,
    {
        let full_path = match self.absolute_path(dir, relative_path) {
            Ok(path) => path,
            Err(err) => return Some(Err(err)),
        };

        if !full_path.exists() {
            return None;
        }
        Some(read_file_json(&full_path))
    }

    // returns true if the file was created
    fn create_default_json_file_if_not_exists<P, T>(
        &self,
        dir: DataDir,
        relative_path: &P,
    ) -> Result<bool>
    where
        P: AsRef<Path>,
        T: serde::de::DeserializeOwned + serde::ser::Serialize + Default,
    {
        if !self.absolute_path(dir, relative_path)?.exists() {
            let default = T::default();
            self.write_file_json(dir, relative_path, &default)?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    fn read_or_create_default_json_file<P, T>(&self, dir: DataDir, relative_path: P) -> Result<T>
    where
        P: AsRef<Path>,
        T: serde::de::DeserializeOwned + serde::ser::Serialize + Default,
    {
        let default_file_created =
            self.create_default_json_file_if_not_exists::<P, T>(dir, &relative_path)?;

        if default_file_created {
            Ok(T::default())
        } else {
            self.read_file_json(dir, &relative_path)
        }
    }

    fn file_or_dir_exists<P>(&self, dir: DataDir, relative_path: P) -> Result<bool>
    where
        P: AsRef<Path>,
    {
        let absolute_path = self.absolute_path(dir, relative_path)?;
        fs::exists(&absolute_path).map_err(|e| Error::file_access(&absolute_path, e))
    }

    fn list_directory<P>(&self, dir: DataDir, relative_path: P) -> Result<Vec<DirEntry>>
    where
        P: AsRef<Path>,
    {
        let absolute_path = self.absolute_path(dir, relative_path)?;
        Ok(fs::read_dir(&absolute_path)
            .map_err(|e| Error::file_access(&absolute_path, e))?
            .filter_map(|r| r.ok())
            .collect())
    }
}

pub trait JsonDataReader {
    fn read_file_json<P, T>(&self, dir: DataDir, relative_path: P) -> Result<T>
    where
        P: AsRef<Path>,
        T: serde::de::DeserializeOwned;
}

impl<D: DataController> JsonDataReader for D {
    fn read_file_json<P, T>(&self, dir: DataDir, relative_path: P) -> Result<T>
    where
        P: AsRef<Path>,
        T: serde::de::DeserializeOwned,
    {
        self.read_file_json(dir, relative_path)
    }
}

pub struct MockSingleJsonFile(serde_json::Value);

impl MockSingleJsonFile {
    pub fn from_value(value: serde_json::Value) -> Self {
        Self(value)
    }
}

impl JsonDataReader for MockSingleJsonFile {
    fn read_file_json<P, T>(&self, _dir: DataDir, relative_path: P) -> Result<T>
    where
        P: AsRef<Path>,
        T: serde::de::DeserializeOwned,
    {
        serde_json::from_value(self.0.clone()).map_err(|e| Error::file_malformed(&relative_path, e))
    }
}

fn read_file_text<P>(full_path: P) -> Result<String>
where
    P: AsRef<Path>,
{
    if !full_path.as_ref().exists() {
        return Err(Error::file_missing(full_path.as_ref()));
    }

    fs::read_to_string(full_path.as_ref()).map_err(|e| Error::file_malformed(&full_path, e))
}

pub(crate) fn read_file_json<P, T>(full_path: P) -> Result<T>
where
    P: AsRef<Path>,
    T: serde::de::DeserializeOwned,
{
    if !full_path.as_ref().exists() {
        return Err(Error::file_missing(full_path.as_ref()));
    }
    let json_str = read_file_text(full_path.as_ref())?;
    serde_json::from_str(&json_str).map_err(|e| Error::file_malformed(&full_path, e))
}

pub(crate) fn write_file_json<P, V>(path: P, value: V) -> Result<()>
where
    P: AsRef<Path>,
    V: serde::ser::Serialize,
{
    let text = serde_json::to_string(&value).map_err(|err| Error::file_malformed(&path, err))?;
    write_file_contents(path, text)
}

fn write_file_contents<P, C>(full_path: P, contents: C) -> Result<()>
where
    P: AsRef<Path>,
    C: AsRef<[u8]>,
{
    fs::write(&full_path, contents).map_err(|err| Error::file_access(&full_path, err))
}

fn delete_file<P>(full_path: P) -> Result<()>
where
    P: AsRef<Path>,
{
    if !full_path.as_ref().exists() {
        return Err(Error::file_missing(full_path.as_ref()));
    }

    fs::remove_file(&full_path).map_err(|err| Error::file_access(&full_path, err))
}

fn open_file_for_writing<P>(full_path: P) -> Result<fs::File>
where
    P: AsRef<Path>,
{
    if !Path::exists(full_path.as_ref()) {
        return Err(Error::file_missing(full_path.as_ref()));
    }

    fs::File::create(&full_path).map_err(|err| Error::file_access(&full_path, err))
}

fn get_config_dir() -> Result<PathBuf> {
    dirs::config_dir().ok_or(Error::other("config directory not detected; please report this issue alongside your Linux distribution and OpenHome installation method"))
}

fn get_default_data_dir() -> Result<PathBuf> {
    dirs::data_dir().ok_or(Error::other("data directory not detected; please report this issue alongside your Linux distribution and OpenHome installation method"))
}

pub fn get_openhome_default_data_dir() -> Result<PathBuf> {
    get_default_data_dir().map(|dir| dir.join("OpenHome"))
}

pub fn get_openhome_config_dir() -> Result<PathBuf> {
    get_config_dir().map(|dir| dir.join("OpenHome"))
}
