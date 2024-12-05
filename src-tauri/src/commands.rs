use serde::{Deserialize, Serialize};
use serde_json::Value;
use dirs;
use std::collections::{HashSet, HashMap};
use std::fs;
use std::fs::File;
use std::io::{Error, ErrorKind, Read, Write};
use std::path::PathBuf;
use std::time::SystemTime;

use crate::state::{AppState, AppStateSnapshot};
use crate::util;

#[tauri::command]
pub fn get_state(state: tauri::State<'_, AppState>) -> AppStateSnapshot {
    let temp_files = state.temp_files.lock().unwrap().clone();
    let open_transaction = state.open_transaction.lock().unwrap().clone();
    AppStateSnapshot {
        temp_files,
        open_transaction,
    }
}

#[tauri::command]
pub fn get_file_bytes(absolute_path: PathBuf) -> Result<Vec<u8>, String> {
    // let full_path = prepend_appdata_to_path(&app_handle, path)?;

    // Open the file, and return any error up the call stack
    let mut file = File::open(absolute_path).map_err(|e| e.to_string())?;

    let mut contents = Vec::new();
    file.read_to_end(&mut contents).map_err(|e| e.to_string())?;

    return Ok(contents);
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
    return Ok(unix_duration.as_millis());
}

#[tauri::command]
pub fn get_ohpkm_files(app_handle: tauri::AppHandle) -> Result<HashMap<String, Vec<u8>>, String> {
    let mons_path = util::prepend_appdata_storage_to_path(&app_handle, &PathBuf::from("mons"))?;
    let mon_files = fs::read_dir(mons_path).map_err(|e| e.to_string())?;

    let mut map = HashMap::new();
    for mon_file_r in mon_files {
        if let Ok(mon_file_os_str) = mon_file_r {
            let path = mon_file_os_str.path();
            if !path
                .extension()
                .is_some_and(|ext| ext.eq_ignore_ascii_case("ohpkm"))
            {
                continue;
            }

            let mon_bytes_r = get_file_bytes(path);
            if let Ok(mon_bytes) = mon_bytes_r {
                map.insert(
                    mon_file_os_str.file_name().to_string_lossy().into_owned(),
                    mon_bytes,
                );
            }
        }
    }

    return Ok(map);
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
            full_path_r
                .map_err(|e| Error::new(ErrorKind::Other, e))
                .and_then(fs::remove_file)
                .map_err(|e| e.to_string()),
        );
    }

    return result;
}

#[tauri::command]
pub fn start_transaction(state: tauri::State<'_, AppState>) -> Result<(), String> {
    return state.start_transaction();
}

#[tauri::command]
pub fn commit_transaction(state: tauri::State<'_, AppState>) -> Result<(), String> {
    return state.commit_transaction();
}

#[tauri::command]
pub fn write_file_bytes(
    state: tauri::State<'_, AppState>,
    absolute_path: PathBuf,
    bytes: Vec<u8>,
) -> Result<(), String> {
    return state.write_file_bytes(absolute_path, bytes);
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
            "Create/open file {}: {}",
            relative_path.to_str().unwrap_or("Non-UTF Path"),
            e
        )
    })?;

    file.write_all(&bytes).map_err(|e| {
        format!(
            "Write file {}: {}",
            relative_path.to_str().unwrap_or("Non-UTF Path"),
            e
        )
    })?;

    return Ok(());
}

#[tauri::command]
pub fn write_storage_file_json(
    app_handle: tauri::AppHandle,
    relative_path: PathBuf,
    data: Value,
) -> Result<(), String> {
    let serialized = data.to_string();
    return write_storage_file_text(app_handle, relative_path, serialized);
}

#[tauri::command]
pub fn write_storage_file_text(
    app_handle: tauri::AppHandle,
    relative_path: PathBuf,
    text: String,
) -> Result<(), String> {
    let full_path = util::prepend_appdata_storage_to_path(&app_handle, &relative_path)?;

    let mut file = File::create(full_path).map_err(|e| e.to_string())?;
    return file.write_all(text.as_bytes()).map_err(|e| e.to_string());
}

#[tauri::command]
pub fn get_storage_file_json(
    app_handle: tauri::AppHandle,
    relative_path: PathBuf,
) -> Result<Value, String> {
    let json_data = util::get_storage_file_text(app_handle, &relative_path)
        .map_err(|e| format!("error opening {:#?}: {e}", &relative_path))?;
    let value = serde_json::from_str(json_data.as_str())
        .map_err(|e| format!("error opening {:#?}: {e}", relative_path));

    return value;
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PathData {
    raw: String,
    base: String,
    name: String,
    dir: String,
    ext: String,
    root: String,
    separator: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PossibleSaves {
    citra: Vec<PathData>,
    desamume: Vec<PathData>,
    openEmu: Vec<PathData>,
}

const MAX_SEARCH_DEPTH: usize = 2;

#[tauri::command]
pub fn find_suggested_saves(save_folders: Vec<PathBuf>) -> Result<PossibleSaves, String> {
    let mut possible_saves = PossibleSaves {
        citra: Vec::new(),
        desamume: Vec::new(),
        openEmu: Vec::new(),
    };

    // Citra saves
    let citra_path = dirs::home_dir()
        .map(|home| home.join(".local/share/citra-emu/sdmc/Nintendo 3DS"));
    if let Some(citra_dir) = citra_path {
        if citra_dir.exists() {
            possible_saves.citra.extend(recursively_find_citra_saves(&citra_dir, 0)?);
        }
    }

    for folder in save_folders {
        if folder.exists() {
            possible_saves.citra.extend(recursively_find_citra_saves(&folder, 0)?);
            possible_saves.openEmu.extend(recursively_find_open_emu_saves(&folder, 0)?);
        }
    }

    // Remove dupes paths
    possible_saves.citra = deduplicate_paths(possible_saves.citra);
    possible_saves.openEmu = deduplicate_paths(possible_saves.openEmu);

    Ok(possible_saves)
}

fn recursively_find_citra_saves(path: &PathBuf, depth: usize) -> Result<Vec<PathData>, String> {
    if depth >= MAX_SEARCH_DEPTH {
        return Ok(vec![]);
    }

    let mut found_saves = Vec::new();
    if path.is_dir() {
        let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let entry_path = entry.path();

            if entry_path.is_dir() {
                found_saves.extend(recursively_find_citra_saves(&entry_path, depth + 1)?);
            } else if entry_path.ends_with("main") {
                found_saves.push(parse_path_data(&entry_path));
            }
        }
    }

    Ok(found_saves)
}

fn recursively_find_open_emu_saves(path: &PathBuf, depth: usize) -> Result<Vec<PathData>, String> {
    if depth >= MAX_SEARCH_DEPTH {
        return Ok(vec![]);
    }

    let mut found_saves = Vec::new();
    if path.is_dir() {
        let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let entry_path = entry.path();

            if entry_path.is_dir() {
                found_saves.extend(recursively_find_open_emu_saves(&entry_path, depth + 1)?);
            } else if entry_path.extension().is_some_and(|ext| ext == "sav") {
                found_saves.push(parse_path_data(&entry_path));
            }
        }
    }

    Ok(found_saves)
}

fn parse_path_data(path: &PathBuf) -> PathData {
    let raw = path.to_string_lossy().to_string();
    let base = path.file_name().unwrap_or_default().to_string_lossy().to_string();
    let name = path.file_stem().unwrap_or_default().to_string_lossy().to_string();
    let ext = path.extension().unwrap_or_default().to_string_lossy().to_string();
    let dir = path.parent().map(|p| p.to_string_lossy().to_string()).unwrap_or_else(|| String::new());
    let separator = std::path::MAIN_SEPARATOR.to_string();
    PathData {
        raw,
        base,
        name,
        dir,
        ext,
        root: String::new(),
        separator,
    }
}

fn deduplicate_paths(paths: Vec<PathData>) -> Vec<PathData> {
    let mut seen = HashSet::new();
    paths
        .into_iter()
        .filter(|path| seen.insert(path.raw.clone()))
        .collect()
}
