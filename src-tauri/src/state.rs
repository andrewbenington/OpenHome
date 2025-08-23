use std::{
    fs,
    path::{Path, PathBuf},
};

use serde::Serialize;

use crate::error::{OpenHomeError, OpenHomeResult};

fn add_tmp(path: &Path) -> PathBuf {
    if let Some(stem) = path.file_name() {
        return path.with_file_name(format!("{}.tmp", stem.to_string_lossy().into_owned()));
    }
    path.to_path_buf()
}

fn remove_tmp_extension(mut path: PathBuf) -> PathBuf {
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
    pub fn start_transaction(&self) -> OpenHomeResult<()> {
        let Ok(mut transaction_is_open) = self.open_transaction.lock() else {
            return Err(OpenHomeError::MutexFailure);
        };

        if *transaction_is_open {
            Err(OpenHomeError::TransactionOpen)
        } else {
            *transaction_is_open = true;
            Ok(())
        }
    }

    pub fn rollback_transaction(&self) -> OpenHomeResult<()> {
        let Ok(mut transaction_is_open) = self.open_transaction.lock() else {
            return Err(OpenHomeError::MutexFailure);
        };

        if !*transaction_is_open {
            return Ok(());
        }

        let Ok(mut temp_files) = self.temp_files.lock() else {
            return Err(OpenHomeError::MutexFailure);
        };
        for temp_file in temp_files.iter() {
            fs::remove_file(temp_file).unwrap_or_else(|e| {
                eprintln!("delete temp file {}: {}", temp_file.to_string_lossy(), e)
            });
        }

        *transaction_is_open = false;
        temp_files.clear();
        Ok(())
    }

    pub fn commit_transaction(&self) -> OpenHomeResult<()> {
        let Ok(mut transaction_is_open) = self.open_transaction.lock() else {
            return Err(OpenHomeError::MutexFailure);
        };

        if !*transaction_is_open {
            return Ok(());
        }

        // overwrite original files with the .tmp versions, deleting the temps
        let Ok(mut temp_files) = self.temp_files.lock() else {
            return Err(OpenHomeError::MutexFailure);
        };
        for temp_file in temp_files.iter() {
            fs::rename(temp_file, remove_tmp_extension(temp_file.clone()))
                .map_err(|err| OpenHomeError::file_access(temp_file, err))?;
        }

        *transaction_is_open = false;
        temp_files.clear();
        Ok(())
    }

    pub fn write_file_bytes_temped(
        &self,
        absolute_path: &Path,
        bytes: Vec<u8>,
    ) -> OpenHomeResult<()> {
        let mut path = absolute_path.to_path_buf();
        if *self.open_transaction.lock().unwrap() {
            let mut temp_files = self.temp_files.lock().unwrap();
            path = add_tmp(&path);
            temp_files.push(path.clone());
        }

        fs::write(&path, &bytes).map_err(|e| OpenHomeError::file_write(&path, e))
    }
}
