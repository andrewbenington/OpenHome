use std::{fs::File, io::Write, path::PathBuf};

use serde::Serialize;

fn add_tmp(mut path: PathBuf) -> PathBuf {
    if let Some(stem) = path.file_name().and_then(|name| name.to_str()) {
        let new_name = format!("{}.tmp", stem);
        path.set_file_name(new_name);
    }
    return path;
}

#[derive(Default, Serialize)]
pub struct AppState {
    pub open_transaction: std::sync::Mutex<bool>,
    pub temp_files: std::sync::Mutex<Vec<PathBuf>>,
}
// A snapshot of the state for serialization
#[derive(Serialize)]
pub struct AppStateSnapshot {
    pub open_transaction: bool,
    pub temp_files: Vec<PathBuf>,
}

impl AppState {
    pub fn start_transaction(&mut self) -> Result<(), String> {
        if *self.open_transaction.lock().unwrap() {
            return Err("Previous transaction is still open".to_owned());
        }
        *self.open_transaction.lock().unwrap() = true;
        return Ok(());
    }

    pub fn write_file_bytes(&self, absolute_path: PathBuf, bytes: Vec<u8>) -> Result<(), String> {
        let mut path = absolute_path.clone();
        if *self.open_transaction.lock().unwrap() {
            path = add_tmp(path);
            let mut temp_files = self.temp_files.lock().unwrap();
            temp_files.push(path.clone());
        }

        let mut file = File::create(&path).map_err(|e| {
            format!(
                "Create/open file {}: {}",
                path.to_str().unwrap_or("Non-UTF Path"),
                e
            )
        })?;

        file.write_all(&bytes).map_err(|e| {
            format!(
                "Write file {}: {}",
                path.to_str().unwrap_or("Non-UTF Path"),
                e
            )
        })?;

        return Ok(());
    }
}
