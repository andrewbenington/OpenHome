use std::{
    fs::{remove_file, rename, File},
    io::Write,
    path::{Path, PathBuf},
};

use serde::Serialize;

fn add_tmp(path: &Path) -> PathBuf {
    if let Some(stem) = path.file_name() {
        return path.with_file_name(format!("{}.tmp", stem.to_string_lossy().into_owned()));
    }
    path.to_path_buf()
}

fn remove_tmp(mut path: PathBuf) -> PathBuf {
    if let Some(stem) = path.clone().file_name().and_then(|name| name.to_str()) {
        let new_name_o = stem.strip_suffix(".tmp");
        if let Some(new_name) = new_name_o {
            path.set_file_name(new_name);
        }
    }
    path
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
    pub is_dev: bool,
}

impl AppState {
    pub fn start_transaction(&self) -> Result<(), String> {
        if *self.open_transaction.lock().unwrap() {
            return Err("Previous transaction is still open".to_owned());
        }
        *self.open_transaction.lock().unwrap() = true;
        Ok(())
    }

    pub fn rollback_transaction(&self) -> Result<(), String> {
        if !*self.open_transaction.lock().unwrap() {
            return Ok(());
        }

        let mut temp_files = self.temp_files.lock().unwrap();
        for temp_file in temp_files.iter() {
            remove_file(temp_file)
                .unwrap_or_else(|e| eprintln!("delete temp file {:?}: {}", temp_file, e));
        }

        *self.open_transaction.lock().unwrap() = false;
        temp_files.clear();
        Ok(())
    }

    pub fn commit_transaction(&self) -> Result<(), String> {
        if !*self.open_transaction.lock().unwrap() {
            println!("no transaction open");
            return Ok(());
        }

        // overwrite original files with the .tmp versions, deleting the temps
        let mut temp_files = self.temp_files.lock().unwrap();
        for temp_file in temp_files.iter() {
            println!("un-temping {}", temp_file.to_string_lossy().into_owned());
            rename(temp_file, remove_tmp(temp_file.clone()))
                .map_err(|e| format!("Un-Temp file {}: {}", temp_file.to_string_lossy(), e))?;
        }
        *self.open_transaction.lock().unwrap() = false;
        temp_files.clear();
        Ok(())
    }

    pub fn write_file_bytes(&self, absolute_path: &Path, bytes: Vec<u8>) -> Result<(), String> {
        let mut path = absolute_path.to_path_buf();
        if *self.open_transaction.lock().unwrap() {
            let mut temp_files = self.temp_files.lock().unwrap();
            path = add_tmp(&path);
            temp_files.push(path.clone());
        }

        let mut file = File::create(&path)
            .map_err(|e| format!("Create/open file {}: {}", path.to_string_lossy(), e))?;

        file.write_all(&bytes)
            .map_err(|e| format!("Write file {:?}: {}", path, e))
    }
}
