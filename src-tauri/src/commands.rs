use crate::data_controller::{DataController, DataDir};
use crate::error::{Error, Result};
use crate::plugin::{self, PluginMetadata, PluginMetadataWithIcon, list_downloaded_plugins};
use crate::state::{AppState, AppStateInner};
use crate::util::ImageResponse;
use crate::{menu, saves, util};
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
    mut app_handle: tauri::AppHandle,
) -> CommandResult<Vec<(String, saves::SaveRef)>> {
    Ok(saves::get_recent_saves(&mut app_handle)?)
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
    Ok(list_downloaded_plugins(&app_handle)?)
}

#[tauri::command]
#[specta::specta]
pub fn load_plugin_code(app_handle: tauri::AppHandle, plugin_id: String) -> CommandResult<String> {
    let relative_path = &PathBuf::from(plugin_id).join("dist").join("index.js");
    Ok(app_handle.read_file_text(DataDir::Plugins, relative_path)?)
}

#[tauri::command]
#[specta::specta]
pub fn delete_plugin(app_handle: tauri::AppHandle, plugin_id: String) -> CommandResult<()> {
    let plugin_dir = app_handle
        .absolute_dir_path(DataDir::Plugins)?
        .join(&plugin_id);
    Ok(util::delete_directory(&plugin_dir)?)
}

#[tauri::command]
#[specta::specta]
pub fn handle_windows_accelerator(app_handle: tauri::AppHandle, menu_event_id: String) {
    menu::handle_menu_event_id(&app_handle, menu_event_id.as_ref());
}
