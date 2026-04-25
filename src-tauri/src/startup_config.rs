use serde::Deserialize;
use serde::Serialize;
use std::fs;
use std::ops::Deref;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

use crate::data_controller::DataController;
use crate::data_controller::read_file_json;
use crate::data_controller::write_file_json;
use crate::error::Error;
use crate::error::Result;

#[derive(Serialize)]
pub struct StartupConfigState(pub Mutex<StartupConfig>);

impl StartupConfigState {
    pub fn load_or_create(app_handle: &tauri::AppHandle) -> Result<Self> {
        let startup_config = StartupConfig::load_or_create(app_handle)?;
        Ok(Self(Mutex::new(startup_config)))
    }
}

impl Deref for StartupConfigState {
    type Target = Mutex<StartupConfig>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct StartupConfig {
    data_dir_path: Option<PathBuf>,
}

const STARTUP_CONFIG_FILENAME: &str = "startup-config.json";

impl StartupConfig {
    fn get_file_path(app_handle: &tauri::AppHandle) -> Result<PathBuf> {
        Ok(app_handle
            .get_config_folder()?
            .join(STARTUP_CONFIG_FILENAME))
    }

    fn load_or_create(app_handle: &tauri::AppHandle) -> Result<Self> {
        let file_path = Self::get_file_path(app_handle)?;
        if !file_path.exists() {
            let default = Self::default();
            default.write_to_storage(app_handle)?;
            Ok(default)
        } else {
            read_file_json(Self::get_file_path(app_handle)?)
        }
    }

    fn write_to_storage(&self, app_handle: &tauri::AppHandle) -> Result<()> {
        let full_path = Self::get_file_path(app_handle)?;
        write_file_json(full_path, self)
    }

    pub fn get_data_dir_path(&self) -> Option<PathBuf> {
        self.data_dir_path.clone()
    }
}

#[tauri::command]
pub async fn get_data_dir_path(
    app_handle: tauri::AppHandle,
    startup_config_state: tauri::State<'_, StartupConfigState>,
) -> Result<PathBuf> {
    let state = startup_config_state.lock()?;
    Ok(state
        .get_data_dir_path()
        .unwrap_or(app_handle.path().app_data_dir()?))
}

#[tauri::command]
pub async fn change_data_dir(
    app_handle: tauri::AppHandle,
    startup_config_state: tauri::State<'_, StartupConfigState>,
) -> Result<()> {
    let Some(selected_dir) = app_handle
        .dialog()
        .file()
        .set_title("Select a directory where OpenHome data should be stored")
        .blocking_pick_folder()
    else {
        return Ok(());
    };

    let Some(selected_dir) = selected_dir.as_path() else {
        return Ok(());
    };

    if !is_dir_empty_ignore_ds_store(selected_dir)? {
        return Err(Error::other(
            "Selected directory is not empty. Please select an empty directory.",
        ));
    }

    let current_data_dir = app_handle.get_data_folder()?;

    copy_all_directory_items(&current_data_dir, selected_dir)?;

    let mut state = startup_config_state.lock()?;

    // update startup config with the new path and save it to disk
    state.data_dir_path = Some(selected_dir.to_path_buf());
    state.write_to_storage(&app_handle)?;

    // if we fail to delete old files, log the error but don't abort the dir change process
    let old_storage_dir = current_data_dir.join("storage");
    if let Err(err) = fs::remove_dir_all(&old_storage_dir) {
        eprintln!("Failed to delete old storage directory at {old_storage_dir:?}: {err}");
    }
    let old_plugins_dir = current_data_dir.join("plugins");
    if old_plugins_dir.exists()
        && let Err(err) = fs::remove_dir_all(&old_plugins_dir)
    {
        eprintln!("Failed to delete old plugins directory at {old_plugins_dir:?}: {err}");
    }
    let old_version_file = current_data_dir.join("version.txt");
    if old_version_file.exists()
        && let Err(err) = fs::remove_file(&old_version_file)
    {
        eprintln!("Failed to delete old version file at {old_version_file:?}: {err}");
    }

    // restart the app for a fresh launch using the new data directory
    app_handle.restart();
}

fn copy_all_directory_items(src_path: &Path, dst_path: &Path) -> Result<()> {
    let dir_entries =
        fs::read_dir(src_path).map_err(|source| Error::file_access(&src_path, source))?;

    for entry in dir_entries {
        let entry = entry.map_err(|source| Error::file_access(&src_path, source))?;
        if entry.path().is_dir() {
            let dest_subdir = dst_path.join(entry.file_name());
            fs::create_dir(&dest_subdir)
                .map_err(|source| Error::file_access(&dest_subdir, source))?;
            copy_all_directory_items(&entry.path(), &dest_subdir)?;
            continue;
        }
        let file_name = entry.file_name();
        let dest_file = dst_path.join(&file_name);

        fs::copy(entry.path(), &dest_file)
            .map_err(|source| Error::file_access(&dest_file, source))?;
    }

    Ok(())
}

fn is_dir_empty_ignore_ds_store(path: &Path) -> Result<bool> {
    let mut entries = fs::read_dir(path).map_err(|source| Error::file_access(&path, source))?;
    for entry in entries.by_ref() {
        let entry = entry.map_err(|source| Error::file_access(&path, source))?;
        if entry.file_name() != ".DS_Store" {
            return Ok(false);
        }
    }

    Ok(true)
}
