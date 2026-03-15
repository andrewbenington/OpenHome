use std::path::{Path, PathBuf};

use tauri::Manager;

use crate::error::Result;
use crate::util;

const STORAGE_DIR_NAME: &str = "storage";
pub const MONS_V2_DIR: &str = "mons_v2";

pub fn create_storage_dir(app_handle: &tauri::AppHandle) -> Result<()> {
    let full_path = app_handle.path().app_data_dir()?.join(STORAGE_DIR_NAME);
    util::create_directory(full_path)
}

pub fn get_path<P>(app_handle: &tauri::AppHandle, path: P) -> Result<PathBuf>
where
    P: AsRef<Path>,
{
    Ok(app_handle
        .path()
        .app_data_dir()?
        .join(STORAGE_DIR_NAME)
        .join(path))
}

pub fn write_file_json<P, V>(
    app_handle: &tauri::AppHandle,
    relative_path: P,
    value: V,
) -> Result<()>
where
    P: AsRef<Path>,
    V: serde::ser::Serialize,
{
    let full_path = get_path(app_handle, relative_path)?;
    util::write_file_json(&full_path, value)
}

pub fn read_file_json<P, T>(app_handle: &tauri::AppHandle, relative_path: P) -> Result<T>
where
    P: AsRef<Path>,
    T: serde::de::DeserializeOwned,
{
    let full_path = get_path(app_handle, relative_path)?;
    util::read_file_json(&full_path)
}

pub fn read_file_json_if_exists<P, T>(
    app_handle: &tauri::AppHandle,
    relative_path: P,
) -> Option<Result<T>>
where
    P: AsRef<Path>,
    T: serde::de::DeserializeOwned,
{
    let full_path = match get_path(app_handle, relative_path) {
        Ok(path) => path,
        Err(err) => return Some(Err(err)),
    };

    if !full_path.exists() {
        return None;
    }
    Some(util::read_file_json(&full_path))
}

// returns true if the file was created
pub fn create_default_json_if_not_exists<P, T>(
    app_handle: &tauri::AppHandle,
    relative_path: &P,
) -> Result<bool>
where
    P: AsRef<Path>,
    T: serde::de::DeserializeOwned + serde::ser::Serialize + Default,
{
    if !get_path(app_handle, relative_path)?.exists() {
        let default = T::default();
        write_file_json(app_handle, relative_path, &default)?;
        Ok(true)
    } else {
        Ok(false)
    }
}

pub fn read_or_create_default_json<P, T>(
    app_handle: &tauri::AppHandle,
    relative_path: P,
) -> Result<T>
where
    P: AsRef<Path>,
    T: serde::de::DeserializeOwned + serde::ser::Serialize + Default,
{
    let default_file_created =
        create_default_json_if_not_exists::<P, T>(app_handle, &relative_path)?;

    if default_file_created {
        Ok(T::default())
    } else {
        read_file_json(app_handle, &relative_path)
    }
}
