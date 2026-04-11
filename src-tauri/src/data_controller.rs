use std::fs;
use std::path::{Path, PathBuf};

use crate::error::{Error, Result};

const STORAGE_DIR_NAME: &str = "storage";
pub const MONS_V2_DIR: &str = "mons_v2";
const PLUGINS_DIR_NAME: &str = "plugins";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DataDir {
    Storage,
    Plugins,
    OpenHomeRoot,
}

impl DataDir {
    fn get_relative_path(&self) -> Option<&str> {
        match self {
            DataDir::Storage => Some(STORAGE_DIR_NAME),
            DataDir::Plugins => Some(PLUGINS_DIR_NAME),
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
}

impl DataController for tauri::AppHandle {
    fn get_data_folder(&self) -> Result<PathBuf> {
        use tauri::Manager;
        Ok(self.path().app_data_dir()?)
    }

    fn get_config_folder(&self) -> Result<PathBuf> {
        use tauri::Manager;
        Ok(self.path().app_config_dir()?)
    }
}

fn read_file_text<P>(full_path: P) -> Result<String>
where
    P: AsRef<Path>,
{
    if !Path::exists(full_path.as_ref()) {
        return Err(Error::file_missing(full_path.as_ref()));
    }

    fs::read_to_string(full_path.as_ref()).map_err(|e| Error::file_malformed(&full_path, e))
}

fn read_file_json<P, T>(full_path: P) -> Result<T>
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

fn write_file_json<P, V>(path: P, value: V) -> Result<()>
where
    P: AsRef<Path>,
    V: serde::ser::Serialize,
{
    let text = serde_json::to_string(&value).map_err(|err| Error::file_malformed(&path, err))?;
    write_file_contents(path, text)
}

fn write_file_contents<P, C>(path: P, contents: C) -> Result<()>
where
    P: AsRef<Path>,
    C: AsRef<[u8]>,
{
    fs::write(&path, contents).map_err(|err| Error::file_access(&path, err))
}
