use serde::Serialize;
use std::fs;
use std::ops::Deref;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use crate::error::{Error, Result};
use crate::state::PokedexState;
use crate::versioning::UpdateFeatures;

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

#[derive(Serialize)]
pub struct AppState(pub Mutex<AppStateInner>);

impl AppState {
    pub fn from_update_features(update_features: Vec<UpdateFeatures>) -> Self {
        Self(Mutex::new(AppStateInner::from_startup_messages(
            update_features,
        )))
    }
}

impl Deref for AppState {
    type Target = Mutex<AppStateInner>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[derive(Default, Serialize, Clone)]
pub struct AppStateInner {
    open_transaction: bool,
    temp_files: Vec<PathBuf>,
    is_dev: bool,
    new_features_since_update: Vec<UpdateFeatures>,
}

impl AppStateInner {
    pub fn from_startup_messages(update_features: Vec<UpdateFeatures>) -> Self {
        Self {
            is_dev: cfg!(debug_assertions),
            new_features_since_update: update_features,
            ..Default::default()
        }
    }

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
}

#[tauri::command]
pub fn start_transaction(state: tauri::State<'_, AppState>) -> Result<()> {
    state.lock()?.start_transaction()
}

#[tauri::command]
pub fn rollback_transaction(state: tauri::State<'_, AppState>) -> Result<()> {
    state.lock()?.rollback_transaction()
}

#[tauri::command]
pub fn commit_transaction(
    app_handle: tauri::AppHandle,
    app_state: tauri::State<'_, AppState>,
    pokedex_state: tauri::State<'_, PokedexState>,
) -> Result<()> {
    app_state.lock()?.commit_transaction()?;
    pokedex_state.lock()?.write_to_storage(&app_handle)
}
