use crate::plugin::{self, list_plugins, PluginMetadata, PluginMetadataWithIcon};
use crate::state::{AppState, AppStateSnapshot};
use crate::util::ImageResponse;
use crate::{menu, saves, util};
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use tauri::Manager;

#[tauri::command]
pub fn get_state(state: tauri::State<'_, AppState>) -> AppStateSnapshot {
    let temp_files = state.temp_files.lock().unwrap().clone();
    let open_transaction = *state.open_transaction.lock().unwrap();
    AppStateSnapshot {
        temp_files,
        open_transaction,
        is_dev: cfg!(debug_assertions),
    }
}

#[tauri::command]
pub fn get_file_bytes(absolute_path: PathBuf) -> Result<Vec<u8>, String> {
    // let full_path = prepend_appdata_to_path(&app_handle, path)?;

    // Open the file, and return any error up the call stack
    let mut file = File::open(absolute_path).map_err(|e| e.to_string())?;

    let mut contents = Vec::new();
    file.read_to_end(&mut contents).map_err(|e| e.to_string())?;

    Ok(contents)
}

#[tauri::command]
pub fn get_file_created(absolute_path: PathBuf) -> Result<u128, String> {
    // let full_path = prepend_appdata_to_path(&app_handle, path)?;

    // Open the file, and return any error up the call stack
    let file = File::open(absolute_path).map_err(|e| e.to_string())?;
    let metadata = file.metadata().map_err(|e| e.to_string())?;
    let created_date = metadata.created().map_err(|e| e.to_string())?;
    let unix_duration = created_date
        .duration_since(SystemTime::UNIX_EPOCH)
        .map_err(|e| e.to_string())?;
    Ok(unix_duration.as_millis())
}

#[tauri::command]
pub fn get_ohpkm_files(app_handle: tauri::AppHandle) -> Result<HashMap<String, Vec<u8>>, String> {
    let mons_path = util::prepend_appdata_storage_to_path(&app_handle, &PathBuf::from("mons"))?;
    let mon_files = fs::read_dir(mons_path).map_err(|e| e.to_string())?;

    let mut map = HashMap::new();
    for mon_file_os_str in mon_files.flatten() {
        let path = mon_file_os_str.path();
        if !path
            .extension()
            .is_some_and(|ext| ext.eq_ignore_ascii_case("ohpkm"))
        {
            continue;
        }

        let mon_bytes_r = get_file_bytes(path);
        let mon_filename = mon_file_os_str.file_name().to_string_lossy().into_owned();
        if let Ok(mon_bytes) = mon_bytes_r {
            map.insert(mon_filename, mon_bytes);
        }
    }

    Ok(map)
}

#[tauri::command]
pub fn delete_storage_files(
    app_handle: tauri::AppHandle,
    relative_paths: Vec<PathBuf>,
) -> HashMap<PathBuf, Result<(), String>> {
    let mut result = HashMap::new();
    for relative_path in relative_paths {
        let full_path_r = util::prepend_appdata_storage_to_path(&app_handle, &relative_path);

        result.insert(
            relative_path,
            full_path_r.and_then(|fp| fs::remove_file(fp).map_err(|e| e.to_string())),
        );
    }

    result
}

#[tauri::command]
pub fn start_transaction(state: tauri::State<'_, AppState>) -> Result<(), String> {
    state.start_transaction()
}

#[tauri::command]
pub fn rollback_transaction(state: tauri::State<'_, AppState>) -> Result<(), String> {
    println!("Rolling back transaction");
    state.rollback_transaction()
}

#[tauri::command]
pub fn commit_transaction(state: tauri::State<'_, AppState>) -> Result<(), String> {
    println!("Committing transaction");
    state.commit_transaction()
}

#[tauri::command]
pub fn write_file_bytes(
    state: tauri::State<'_, AppState>,
    absolute_path: &Path,
    bytes: Vec<u8>,
) -> Result<(), String> {
    state.write_file_bytes(absolute_path, bytes)
}

#[tauri::command]
pub fn write_storage_file_bytes(
    app_handle: tauri::AppHandle,
    relative_path: PathBuf,
    bytes: Vec<u8>,
) -> Result<(), String> {
    let full_path = util::prepend_appdata_storage_to_path(&app_handle, &relative_path)?;

    let mut file = File::create(full_path).map_err(|e| {
        format!(
            "create/open file {}: {}",
            relative_path.to_string_lossy(),
            e
        )
    })?;

    file.write_all(&bytes)
        .map_err(|e| format!("write file {}: {}", relative_path.to_string_lossy(), e))
}

#[tauri::command]
pub fn write_storage_file_json(
    app_handle: tauri::AppHandle,
    relative_path: PathBuf,
    data: Value,
) -> Result<(), String> {
    write_storage_file_text(app_handle, relative_path, data.to_string())
}

#[tauri::command]
pub fn write_storage_file_text(
    app_handle: tauri::AppHandle,
    relative_path: PathBuf,
    text: String,
) -> Result<(), String> {
    let full_path = util::prepend_appdata_storage_to_path(&app_handle, &relative_path)?;

    fs::write(full_path, text.as_bytes())
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_storage_file_json(
    app_handle: tauri::AppHandle,
    relative_path: PathBuf,
) -> Result<Value, String> {
    util::get_storage_file_json(&app_handle, &relative_path)
}

#[tauri::command]
pub fn find_suggested_saves(
    app_handle: tauri::AppHandle,
    save_folders: Vec<PathBuf>,
) -> Result<saves::PossibleSaves, String> {
    let mut possible_saves = saves::PossibleSaves {
        citra: Vec::new(),
        desamume: Vec::new(),
        open_emu: Vec::new(),
    };

    let citra_dir_r = app_handle
        .path()
        .home_dir()
        .map(|home| home.join(".local/share/citra-emu/sdmc/Nintendo 3DS"));

    if let Ok(citra_dir) = citra_dir_r {
        if citra_dir.exists() {
            possible_saves
                .citra
                .extend(saves::recursively_find_citra_saves(&citra_dir, 0)?);
        }
    }

    // Iterate over user-provided save folders
    for folder in save_folders {
        if folder.exists() {
            let citra_saves = saves::recursively_find_citra_saves(&folder, 0)?;
            possible_saves.citra.extend(citra_saves);

            let mgba_saves = saves::recursively_find_mgba_saves(&folder, 0)?;
            let gambatte_saves = saves::recursively_find_gambatte_saves(&folder, 0)?;

            possible_saves.open_emu.extend(mgba_saves);
            possible_saves.open_emu.extend(gambatte_saves);

            let desamume_saves = saves::recursively_find_desamume_saves(&folder, 0)?;
            possible_saves.desamume.extend(desamume_saves);
        } else {
            println!(
                "Folder doesnt exist: {}",
                folder.to_str().unwrap_or("(no path)")
            )
        }
    }

    // Deduplicate paths
    possible_saves.citra = util::dedupe_paths(possible_saves.citra);
    possible_saves.open_emu = util::dedupe_paths(possible_saves.open_emu);
    possible_saves.desamume = util::dedupe_paths(possible_saves.desamume);

    Ok(possible_saves)
}

#[tauri::command]
pub fn set_app_theme(app_handle: tauri::AppHandle, app_theme: String) -> Result<(), String> {
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
) -> Result<HashMap<String, saves::SaveRef>, String> {
    saves::get_recent_saves(app_handle)
}

#[tauri::command]
pub fn get_image_data(absolute_path: String) -> Result<ImageResponse, String> {
    util::get_image_data(&PathBuf::from(absolute_path))
}

#[tauri::command]
pub async fn download_plugin(
    app_handle: tauri::AppHandle,
    remote_url: String,
) -> Result<String, String> {
    let metadata_url = format!("{}/plugin.json", remote_url);

    let plugin_metadata: PluginMetadata = util::download_json_file(metadata_url)
        .await
        .map_err(|e| e.to_string())?;

    plugin::download_async(app_handle, remote_url, plugin_metadata).await
}

#[tauri::command]
pub fn list_installed_plugins(
    app_handle: tauri::AppHandle,
) -> Result<Vec<PluginMetadataWithIcon>, String> {
    list_plugins(&app_handle).map_err(|e| format!("Error listing plugins: {}", e))
}

#[tauri::command]
pub fn load_plugin_code(app_handle: tauri::AppHandle, plugin_id: String) -> Result<String, String> {
    let relative_path = &PathBuf::from("plugins")
        .join(plugin_id)
        .join("dist")
        .join("index.js");

    util::get_appdata_file_text(&app_handle, relative_path)
}

#[tauri::command]
pub fn delete_plugin(app_handle: tauri::AppHandle, plugin_id: String) -> Result<(), String> {
    let plugins_dir = util::prepend_appdata_to_path(&app_handle, &PathBuf::from("plugins"))
        .map_err(|err| format!("Error finding the plugins directory: {}", err))?;
    let plugin_dir = plugins_dir.join(&plugin_id);

    util::delete_folder(&plugin_dir)
}

#[tauri::command]
pub fn handle_windows_accellerator(app_handle: tauri::AppHandle, menu_event_id: String) {
    menu::handle_menu_event_id(&app_handle, menu_event_id.as_ref());
}
