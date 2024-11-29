use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::io::{Error, ErrorKind, Write};
use std::path::PathBuf;
use std::time::SystemTime;
use std::{fs::File, io::Read};
use tauri::Manager;

fn prepend_appdata_storage_to_path(
    app_handle: &tauri::AppHandle,
    path: &PathBuf,
) -> Result<PathBuf, String> {
    let appdata_dir = get_appdata_dir(app_handle)?;
    let mut full_path = PathBuf::new();

    full_path.push(&appdata_dir);
    full_path.push("storage".to_owned());
    full_path.push(path);
    return Ok(full_path);
}

pub fn get_storage_file_text(
    app_handle: tauri::AppHandle,
    relative_path: &PathBuf,
) -> Result<String, String> {
    let full_path = prepend_appdata_storage_to_path(&app_handle, relative_path)?;

    // Open the file, and return any error up the call stack
    let mut file = File::open(full_path).map_err(|e| e.to_string())?;

    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| e.to_string())?;

    return Ok(contents);
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

pub fn get_appdata_dir(app_handle: &tauri::AppHandle) -> Result<String, String> {
    // Open the file, and return any error up the call stack
    let path_buf = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    return Ok(path_buf
        .to_str()
        .map_or("uhoh".to_owned(), |f| f.to_owned()));
}

#[tauri::command]
pub fn get_ohpkm_files(app_handle: tauri::AppHandle) -> Result<HashMap<String, Vec<u8>>, String> {
    let mons_path = prepend_appdata_storage_to_path(&app_handle, &PathBuf::from("mons"))?;
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
        let full_path_r = prepend_appdata_storage_to_path(&app_handle, &relative_path);

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

// #[derive(Default)]
// struct MyState {
//   s: std::sync::Mutex<String>,
//   t: std::sync::Mutex<std::collections::HashMap<String, String>>,
// }
// remember to call `.manage(MyState::default())`
// #[tauri::command]
// async fn command_name(state: tauri::State<'_, MyState>) -> Result<(), String> {
//   *state.s.lock().unwrap() = "new string".into();
//   state.t.lock().unwrap().insert("key".into(), "value".into());
//   Ok(())
// }]

#[tauri::command]
pub fn write_file_bytes(absolute_path: PathBuf, bytes: Vec<u8>) -> Result<(), String> {
    let mut file = File::create(&absolute_path).map_err(|e| {
        format!(
            "Create/open file {}: {}",
            absolute_path.to_str().unwrap_or("Non-UTF Path"),
            e
        )
    })?;

    file.write_all(&bytes).map_err(|e| {
        format!(
            "Write file {}: {}",
            absolute_path.to_str().unwrap_or("Non-UTF Path"),
            e
        )
    })?;

    return Ok(());
}

#[tauri::command]
pub fn write_storage_file_bytes(
    app_handle: tauri::AppHandle,
    relative_path: PathBuf,
    bytes: Vec<u8>,
) -> Result<(), String> {
    let full_path = prepend_appdata_storage_to_path(&app_handle, &relative_path)?;

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
    let full_path = prepend_appdata_storage_to_path(&app_handle, &relative_path)?;

    // Open the file, and return any error up the call stack
    println!(
        "writing {}: {}",
        full_path.to_str().unwrap_or("(no path)"),
        text
    );
    let mut file = File::create(full_path).map_err(|e| e.to_string())?;
    return file.write_all(text.as_bytes()).map_err(|e| e.to_string());
}

#[tauri::command]
pub fn get_storage_file_json(
    app_handle: tauri::AppHandle,
    relative_path: PathBuf,
) -> Result<Value, String> {
    let json_data = get_storage_file_text(app_handle, &relative_path)
        .map_err(|e| format!("error opening {:#?}: {e}", &relative_path))?;
    let value = serde_json::from_str(json_data.as_str())
        .map_err(|e| format!("error opening {:#?}: {e}", relative_path));

    return value;
}
