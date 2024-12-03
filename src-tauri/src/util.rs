use std::{fs::File, io::Read, path::PathBuf};

use tauri::Manager;

pub fn prepend_appdata_storage_to_path(
    app_handle: &tauri::AppHandle,
    path: &PathBuf,
) -> Result<PathBuf, String> {
    let appdata_dir = get_appdata_dir(app_handle)?;
    println!("{}", appdata_dir);
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

pub fn get_appdata_dir(app_handle: &tauri::AppHandle) -> Result<String, String> {
    // Open the file, and return any error up the call stack
    let path_buf_o = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    return match path_buf_o.to_str() {
        Some(path_buf) => Ok(path_buf.to_owned()),
        None => Err("Invalid appdata path".to_owned()),
    };
}
