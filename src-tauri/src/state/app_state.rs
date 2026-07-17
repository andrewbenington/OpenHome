use serde::Serialize;
use std::fs;
use std::ops::Deref;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use crate::commands::{CommandError, CommandResult};
use crate::error::{Error, Result};
use crate::state::PokedexState;
use crate::versioning::UpdateFeatures;

fn without_tmp_extension(path: &Path) -> PathBuf {
    let mut without_tmp = PathBuf::from(path);
    if without_tmp.extension().is_some_and(|ext| ext == "tmp") {
        without_tmp.set_extension("");
    }

    without_tmp
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

#[derive(Default, Serialize, Clone, specta::Type)]
pub struct AppStateInner {
    is_dev: bool,
    new_features_since_update: Vec<UpdateFeatures>,
    transaction: TransactionState,
}

impl AppStateInner {
    pub fn from_startup_messages(update_features: Vec<UpdateFeatures>) -> Self {
        Self {
            is_dev: cfg!(debug_assertions),
            new_features_since_update: update_features,
            ..Default::default()
        }
    }

    pub fn transaction_mut(&mut self) -> &mut TransactionState {
        &mut self.transaction
    }
}

#[derive(Default, Serialize, Clone, specta::Type)]
pub struct TransactionState {
    open_transaction: bool,
    temp_files: Vec<PathBuf>,
}

impl TransactionState {
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
        for temp_file_path in self.temp_files.iter() {
            let path_without_tmp = without_tmp_extension(temp_file_path);
            fs::rename(temp_file_path, &path_without_tmp)
                .map_err(|err| Error::file_access(temp_file_path, err))?;
            tracing::debug!(
                "file updated successfully: {}",
                path_without_tmp.to_string_lossy()
            );
        }

        self.open_transaction = false;
        self.temp_files.clear();
        Ok(())
    }

    pub fn write_file_bytes_temped<P>(&mut self, absolute_path: P, bytes: Vec<u8>) -> Result<()>
    where
        P: AsRef<Path>,
    {
        let mut path = absolute_path.as_ref().to_path_buf();
        if self.open_transaction {
            path.add_extension("tmp");
            self.temp_files.push(path.clone());
        }

        fs::write(&path, &bytes).map_err(|e| Error::file_write(&path, e))
    }
}

#[tauri::command]
#[specta::specta]
pub fn start_transaction(state: tauri::State<'_, AppState>) -> CommandResult<()> {
    state
        .lock()?
        .transaction_mut()
        .start_transaction()
        .map_err(CommandError::from)
}

#[tauri::command]
#[specta::specta]
pub fn rollback_transaction(state: tauri::State<'_, AppState>) -> CommandResult<()> {
    state
        .lock()?
        .transaction_mut()
        .rollback_transaction()
        .map_err(CommandError::from)
}

#[tauri::command]
#[specta::specta]
pub fn commit_transaction(
    mut app_handle: tauri::AppHandle,
    app_state: tauri::State<'_, AppState>,
    pokedex_state: tauri::State<'_, PokedexState>,
) -> CommandResult<()> {
    app_state.lock()?.transaction_mut().commit_transaction()?;
    pokedex_state
        .lock()?
        .write_to_storage(&mut app_handle)
        .map_err(CommandError::from)
}
