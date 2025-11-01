use std::{
    fs,
    ops::Deref,
    path::{Path, PathBuf},
    sync::Mutex,
};

use serde::Serialize;

use crate::error::{Error, Result};

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
pub struct AppState(pub Mutex<AppStateInner>);

impl Deref for AppState {
    type Target = Mutex<AppStateInner>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[derive(Default, Serialize)]
pub struct AppStateInner {
    pub open_transaction: bool,
    pub temp_files: Vec<PathBuf>,
}

// A snapshot of the state for serialization
#[derive(Serialize)]
pub struct AppStateSnapshot {
    pub open_transaction: bool,
    pub temp_files: Vec<PathBuf>,
    pub is_dev: bool,
}

impl AppStateInner {
    pub fn start_transaction(&mut self) -> Result<()> {
        if self.open_transaction {
            Err(Error::TransactionOpen)
        } else {
            self.open_transaction = true;
            Ok(())
        }
    }

    pub fn rollback_transaction(&mut self) -> Result<()> {
        if !self.open_transaction {
            return Ok(());
        }

        for temp_file in self.temp_files.iter() {
            fs::remove_file(temp_file).unwrap_or_else(|err| {
                eprintln!("delete temp file {}: {err}", temp_file.to_string_lossy())
            });
        }

        self.open_transaction = false;
        self.temp_files.clear();
        Ok(())
    }

    pub fn commit_transaction(&mut self) -> Result<()> {
        if !self.open_transaction {
            return Ok(());
        }

        // overwrite original files with the .tmp versions, deleting the temps
        for temp_file in self.temp_files.iter() {
            fs::rename(temp_file, remove_tmp_extension(temp_file.clone()))
                .map_err(|err| Error::file_access(temp_file, err))?;
        }

        self.open_transaction = false;
        self.temp_files.clear();
        Ok(())
    }

    pub fn write_file_bytes_temped(&mut self, absolute_path: &Path, bytes: Vec<u8>) -> Result<()> {
        let mut path = absolute_path.to_path_buf();
        if self.open_transaction {
            path = add_tmp(&path);
            self.temp_files.push(path.clone());
        }

        fs::write(&path, &bytes).map_err(|e| Error::file_write(&path, e))
    }

    pub fn snapshot(&self) -> AppStateSnapshot {
        AppStateSnapshot {
            temp_files: self.temp_files.clone(),
            open_transaction: self.open_transaction,
            is_dev: cfg!(debug_assertions),
        }
    }
}
