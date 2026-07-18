use crate::data_controller::ToDataController;
use crate::plugin::{self, PluginMetadata, PluginMetadataWithIcon, list_downloaded_plugins};
use crate::state::{AppState, AppStateInner};
use crate::util::ImageResponse;
use crate::{menu, util};
use openhome_core::data_controller::{DataController, DataDir};
use openhome_core::error::{Error, Result};
use openhome_core::pkm_storage::StoredBankData;
use openhome_core::saves::{self, SaveFileSearch};
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use tauri::Manager;

#[derive(serde::Serialize, serde::Deserialize, specta::Type)]
pub struct CommandError(String);

pub type CommandResult<T> = core::result::Result<T, CommandError>;

impl<T: ToString> From<T> for CommandError {
    fn from(value: T) -> Self {
        Self(value.to_string())
    }
}

#[tauri::command]
#[specta::specta]
pub fn get_state(state: tauri::State<'_, AppState>) -> CommandResult<AppStateInner> {
    Ok(state.lock()?.clone())
}

#[tauri::command]
pub fn get_file_bytes(absolute_path: PathBuf) -> Result<tauri::ipc::Response> {
    util::read_file_bytes(absolute_path).map(tauri::ipc::Response::new)
}

#[tauri::command]
#[specta::specta]
pub fn get_file_created(absolute_path: PathBuf) -> CommandResult<Option<u128>> {
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
    let full_path = app_handle
        .controller()
        .absolute_path(DataDir::Storage, relative_path)?;
    util::write_file_contents(full_path, text)
}

#[tauri::command]
pub fn get_storage_file_json(
    app_handle: tauri::AppHandle,
    relative_path: PathBuf,
) -> Result<Value> {
    app_handle
        .controller()
        .read_file_json(DataDir::Storage, &relative_path)
}

#[tauri::command]
#[specta::specta]
pub fn write_file_bytes(
    state: tauri::State<'_, AppState>,
    absolute_path: &str,
    bytes: Vec<u8>,
) -> CommandResult<()> {
    Ok(state
        .lock()?
        .transaction_mut()
        .write_file_bytes_temped(absolute_path, bytes)?)
}

#[tauri::command]
#[specta::specta]
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
#[specta::specta]
pub fn validate_recent_saves(
    app_handle: tauri::AppHandle,
) -> CommandResult<Vec<(String, saves::SaveRef)>> {
    Ok(saves::get_recent_saves(&app_handle.controller())?)
}

#[tauri::command]
#[specta::specta]
pub fn get_image_data(absolute_path: String) -> CommandResult<ImageResponse> {
    Ok(util::get_image_data(&PathBuf::from(absolute_path))?)
}

#[tauri::command]
#[specta::specta]
pub fn open_directory(absolute_path: String) -> CommandResult<()> {
    Ok(util::open_directory(&PathBuf::from(absolute_path))?)
}

#[tauri::command]
#[specta::specta]
pub fn open_file_location(file_path: String) -> CommandResult<()> {
    let Some(parent_dir) = Path::new(&file_path).parent() else {
        return Err(Error::other("File has no parent directory").into());
    };
    Ok(util::open_directory(parent_dir)?)
}

#[tauri::command]
#[specta::specta]
pub async fn download_plugin(
    app_handle: tauri::AppHandle,
    remote_url: String,
) -> CommandResult<String> {
    let metadata_url = format!("{remote_url}/plugin.json");

    let plugin_metadata: PluginMetadata = util::download_json_file(&metadata_url).await?;

    Ok(plugin::download_async(app_handle, remote_url, plugin_metadata).await?)
}

#[tauri::command]
#[specta::specta]
pub fn list_installed_plugins(
    app_handle: tauri::AppHandle,
) -> CommandResult<Vec<PluginMetadataWithIcon>> {
    Ok(list_downloaded_plugins(&app_handle.controller())?)
}

#[tauri::command]
#[specta::specta]
pub fn load_plugin_code(app_handle: tauri::AppHandle, plugin_id: String) -> CommandResult<String> {
    let relative_path = &PathBuf::from(plugin_id).join("dist").join("index.js");
    Ok(app_handle
        .controller()
        .read_file_text(DataDir::Plugins, relative_path)?)
}

#[tauri::command]
#[specta::specta]
pub fn delete_plugin(app_handle: tauri::AppHandle, plugin_id: String) -> CommandResult<()> {
    let plugin_dir = app_handle
        .controller()
        .absolute_dir_path(DataDir::Plugins)?
        .join(&plugin_id);
    Ok(util::delete_directory(&plugin_dir)?)
}

#[tauri::command]
#[specta::specta]
pub fn handle_windows_accelerator(app_handle: tauri::AppHandle, menu_event_id: String) {
    menu::handle_menu_event_id(&app_handle, menu_event_id.as_ref());
}

#[tauri::command]
#[specta::specta]
pub async fn find_suggested_saves(
    app_handle: tauri::AppHandle,
    save_folders: Vec<&str>,
) -> CommandResult<saves::PossibleSaves> {
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
            .extend(saves::Citra::recursively_find_saves(&citra_dir)?);
    }

    // Iterate over user-provided save folders
    for folder_str in save_folders {
        let folder_path = PathBuf::from(folder_str);
        if folder_path.exists() {
            tracing::info!("checking saves in folder {folder_str}");
            let result = tokio::task::spawn_blocking(move || {
                openhome_core::saves::get_possible_saves(&folder_path).map_err(|e| e.to_string())
            })
            .await
            .map_err(|e| {
                Error::other_with_source("tokio task failed in find_suggested_saves", e)
            })?;
            tracing::info!("finished checking");

            match result {
                Ok(newly_found) => possible_saves.add_all(newly_found),
                Err(e) => {
                    tracing::error!("failed to check saves in folder {folder_str}: {e}");
                    continue;
                }
            };
        } else {
            return Err(Error::file_missing(&folder_path).into());
        }
    }

    Ok(possible_saves)
}

#[tauri::command]
#[specta::specta]
pub fn load_banks(app_handle: tauri::AppHandle) -> CommandResult<StoredBankData> {
    Ok(openhome_core::pkm_storage::load_banks(
        &app_handle.controller(),
    )?)
}

#[tauri::command]
#[specta::specta]
pub fn write_banks(app_handle: tauri::AppHandle, bank_data: StoredBankData) -> CommandResult<()> {
    Ok(openhome_core::pkm_storage::write_banks(
        &app_handle.controller(),
        bank_data,
    )?)
}
