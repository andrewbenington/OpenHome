use std::path::PathBuf;

use crate::{
    error::{OpenHomeError, OpenHomeResult},
    util::{prepend_appdata_to_path, read_file_text},
};

const VERSION_FILE: &str = "version.txt";

pub fn get_version_last_used(app_handle: &tauri::AppHandle) -> OpenHomeResult<Option<String>> {
    let last_version_path = prepend_appdata_to_path(app_handle, VERSION_FILE)?;

    match read_file_text(&last_version_path) {
        Ok(version_string) => Ok(Some(version_string)),
        Err(e) => match e {
            OpenHomeError::FileMissing { path: _ } => Ok(None),
            other => Err(other),
        },
    }
}
