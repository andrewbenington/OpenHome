use std::{
    fs::{rename, File},
    io::Write,
    path::PathBuf,
};

use serde::Serialize;

fn add_tmp(mut path: PathBuf) -> PathBuf {
    if let Some(stem) = path.file_name().and_then(|name| name.to_str()) {
        let new_name = format!("{}.tmp", stem);
        path.set_file_name(new_name);
    }
    return path;
}

fn remove_tmp(mut path: PathBuf) -> PathBuf {
    if let Some(stem) = path.clone().file_name().and_then(|name| name.to_str()) {
        let new_name_o = stem.strip_suffix(".tmp");
        if let Some(new_name) = new_name_o {
            path.set_file_name(new_name);
        }
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
    pub fn start_transaction(&self) -> Result<(), String> {
        if *self.open_transaction.lock().unwrap() {
            return Err("Previous transaction is still open".to_owned());
        }
        *self.open_transaction.lock().unwrap() = true;
        return Ok(());
    }

    pub fn rollback_transaction(&self) -> Result<(), String> {
        if !*self.open_transaction.lock().unwrap() {
            return Ok(());
        }

        let mut temp_files = self.temp_files.lock().unwrap();
        for temp_file in temp_files.iter() {
            let real_file = remove_tmp(temp_file.clone());
            rename(temp_file.clone(), real_file.clone()).map_err(|e| {
                format!(
                    "Rename file {} to {}: {}",
                    temp_file.to_str().unwrap_or("(unknown)"),
                    real_file.to_str().unwrap_or("(unknown)"),
                    e
                )
            })?;
        }
        *self.open_transaction.lock().unwrap() = false;
        temp_files.clear();
        return Ok(());
    }

    pub fn commit_transaction(&self) -> Result<(), String> {
        if !*self.open_transaction.lock().unwrap() {
            return Ok(());
        }

        let mut temp_files = self.temp_files.lock().unwrap();
        for temp_file in temp_files.iter() {
            let real_file = remove_tmp(temp_file.clone());
            rename(temp_file.clone(), real_file.clone()).map_err(|e| {
                format!(
                    "Rename file {} to {}: {}",
                    temp_file.to_str().unwrap_or("(unknown)"),
                    real_file.to_str().unwrap_or("(unknown)"),
                    e
                )
            })?;
        }
        *self.open_transaction.lock().unwrap() = false;
        temp_files.clear();
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
