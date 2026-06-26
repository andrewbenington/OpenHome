use crate::data_controller::{DataController, DataDir};
use crate::error::{Error, Result};
use crate::plugin::{self, PluginMetadata, PluginMetadataWithIcon, list_downloaded_plugins};
use crate::saves::{Citra, Desmume, Gambatte, Mgba, SaveFileSearch};
use crate::state::{AppState, AppStateInner};
use crate::util::ImageResponse;
use crate::{menu, saves, util};
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use tauri::Manager;

#[tauri::command]
pub fn get_state(state: tauri::State<'_, AppState>) -> Result<AppStateInner> {
    Ok(state.lock()?.clone())
}

#[tauri::command]
pub fn get_file_bytes(absolute_path: PathBuf) -> Result<Vec<u8>> {
    util::read_file_bytes(absolute_path)
}

#[tauri::command]
pub fn get_file_created(absolute_path: PathBuf) -> Result<Option<u128>> {
    let metadata =
        fs::metadata(&absolute_path).map_err(|e| Error::file_access(&absolute_path, e))?;

    let Ok(created_or_modified_date) = metadata.created().or(metadata.modified()) else {
        return Ok(None);
    };

    Ok(created_or_modified_date
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|dur| dur.as_millis())
        .ok())
}

#[tauri::command]
pub fn write_storage_file_json(
    app_handle: tauri::AppHandle,
    relative_path: PathBuf,
    data: Value,
) -> Result<()> {
    write_storage_file_text(app_handle, relative_path, data.to_string())
}

fn write_storage_file_text(
    app_handle: tauri::AppHandle,
    relative_path: PathBuf,
    text: String,
) -> Result<()> {
    let full_path = app_handle.absolute_path(DataDir::Storage, relative_path)?;
    util::write_file_contents(full_path, text)
}

#[tauri::command]
pub fn get_storage_file_json(
    app_handle: tauri::AppHandle,
    relative_path: PathBuf,
) -> Result<Value> {
    app_handle.read_file_json(DataDir::Storage, &relative_path)
}

#[tauri::command]
pub async fn find_suggested_saves(
    app_handle: tauri::AppHandle,
    save_folders: Vec<PathBuf>,
) -> Result<saves::PossibleSaves> {
    let mut possible_saves = saves::PossibleSaves {
        citra: Vec::new(),
        desmume: Vec::new(),
        open_emu: Vec::new(),
    };

    let citra_dir_r = app_handle
        .path()
        .home_dir()
        .map(|home| home.join(".local/share/citra-emu/sdmc/Nintendo 3DS"));

    if let Ok(citra_dir) = citra_dir_r
        && citra_dir.exists()
    {
        possible_saves
            .citra
            .extend(Citra::recursively_find_saves(&citra_dir)?);
    }

    // Iterate over user-provided save folders
    for folder in save_folders {
        if folder.exists() {
            let folder_path = folder.to_string_lossy().into_owned();

            tracing::info!("checking saves in folder {folder_path}");
            let result = tokio::task::spawn_blocking(move || {
                get_possible_saves(&folder).map_err(|e| e.to_string())
            })
            .await
            .map_err(|e| {
                Error::other_with_source("tokio task failed in find_suggested_saves", e)
            })?;
            tracing::info!("finished checking");

            match result {
                Ok(newly_found) => possible_saves.add_all(newly_found),
                Err(e) => {
                    tracing::error!("failed to check saves in folder {folder_path}: {e}");
                    continue;
                }
            };
        } else {
            return Err(Error::file_missing(&folder));
        }
    }

    Ok(possible_saves)
}

fn get_possible_saves(folder: &PathBuf) -> Result<saves::PossibleSaves> {
    let mut possible_saves = saves::PossibleSaves {
        citra: Vec::new(),
        desmume: Vec::new(),
        open_emu: Vec::new(),
    };

    let citra_saves = Citra::recursively_find_saves(folder)?;
    possible_saves.citra.extend(citra_saves);

    let mgba_saves = Mgba::recursively_find_saves(folder)?;
    let gambatte_saves = Gambatte::recursively_find_saves(folder)?;

    possible_saves.open_emu.extend(mgba_saves);
    possible_saves.open_emu.extend(gambatte_saves);

    let desmume_saves = Desmume::recursively_find_saves(folder)?;
    possible_saves.desmume.extend(desmume_saves);

    Ok(possible_saves)
}

#[tauri::command]
pub fn write_file_bytes(
    state: tauri::State<'_, AppState>,
    absolute_path: &Path,
    bytes: Vec<u8>,
) -> Result<()> {
    state.lock()?.write_file_bytes_temped(absolute_path, bytes)
}

#[tauri::command]
pub fn set_app_theme(
    app_handle: tauri::AppHandle,
    app_theme: String,
) -> core::result::Result<(), String> {
    let main_window = app_handle
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    let theme_option: Option<tauri::Theme>;
    if app_theme == "dark" {
        theme_option = Some(tauri::Theme::Dark)
    } else if app_theme == "light" {
        theme_option = Some(tauri::Theme::Light)
    } else if app_theme == "system" {
        theme_option = None::<tauri::Theme>;
    } else {
        return Err(format!("Invalid theme: {}", app_theme));
    }

    main_window
        .set_theme(theme_option)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn validate_recent_saves(
    app_handle: tauri::AppHandle,
) -> core::result::Result<HashMap<String, saves::SaveRef>, String> {
    saves::get_recent_saves(&app_handle)
}

#[tauri::command]
pub fn get_image_data(absolute_path: String) -> Result<ImageResponse> {
    util::get_image_data(&PathBuf::from(absolute_path))
}

#[tauri::command]
pub fn open_directory(absolute_path: String) -> Result<()> {
    util::open_directory(&PathBuf::from(absolute_path))
}

#[tauri::command]
pub fn open_file_location(file_path: String) -> Result<()> {
    let Some(parent_dir) = Path::new(&file_path).parent() else {
        return Err(Error::other("File has no parent directory"));
    };
    util::open_directory(parent_dir)
}

#[tauri::command]
pub async fn download_plugin(app_handle: tauri::AppHandle, remote_url: String) -> Result<String> {
    let metadata_url = format!("{remote_url}/plugin.json");

    let plugin_metadata: PluginMetadata = util::download_json_file(&metadata_url).await?;

    plugin::download_async(app_handle, remote_url, plugin_metadata).await
}

#[tauri::command]
pub fn list_installed_plugins(app_handle: tauri::AppHandle) -> Result<Vec<PluginMetadataWithIcon>> {
    list_downloaded_plugins(&app_handle)
}

#[tauri::command]
pub fn load_plugin_code(app_handle: tauri::AppHandle, plugin_id: String) -> Result<String> {
    let relative_path = &PathBuf::from(plugin_id).join("dist").join("index.js");
    app_handle.read_file_text(DataDir::Plugins, relative_path)
}

#[tauri::command]
pub fn delete_plugin(app_handle: tauri::AppHandle, plugin_id: String) -> Result<()> {
    let plugin_dir = app_handle
        .absolute_dir_path(DataDir::Plugins)?
        .join(&plugin_id);
    util::delete_directory(&plugin_dir)
}

#[tauri::command]
pub fn handle_windows_accelerator(app_handle: tauri::AppHandle, menu_event_id: String) {
    menu::handle_menu_event_id(&app_handle, menu_event_id.as_ref());
}
