use crate::commands::CommandResult;
use crate::data_controller::TauriDataController;
use crate::synced_state;
use openhome_core::Error;
use openhome_core::data_controller::{DataController, DataDir, MONS_V2_DIR};
use openhome_core::ohpkm_store::OhpkmBytesStore;
use serde::Serialize;
use std::path::Path;
use std::{collections::HashMap, fs};

impl synced_state::SyncedState for OhpkmBytesStore {
    type Action = Self;
    const ID: &'static str = "ohpkm_store";

    fn to_command_response(&self) -> impl Clone + Serialize + tauri::ipc::IpcResponse {
        self.to_b64_map()
    }

    fn update(&mut self, other: Self) {
        other.all_entries().for_each(|(k, v)| {
            self.insert(k, v);
        });
    }
}

#[tauri::command]
#[specta::specta]
pub fn get_ohpkm_store(
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
) -> CommandResult<Vec<(String, String)>> {
    Ok(synced_state.ohpkm_store_b64()?)
}

#[tauri::command]
#[specta::specta]
pub fn add_to_ohpkm_store(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
    updates: OhpkmBytesStore,
) -> CommandResult<()> {
    Ok(synced_state
        .lock()?
        .ohpkm_store
        .update(&app_handle, updates)?)
}

type DeleteResultsById = HashMap<String, Option<String>>;

#[tauri::command]
#[specta::specta]
pub fn permanently_delete_ohpkms(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
    openhome_ids: Vec<String>,
) -> CommandResult<DeleteResultsById> {
    // first remove from the ohpkm store
    synced_state
        .lock()?
        .ohpkm_store
        .replace(&app_handle, |store| {
            let mut new_store = store.clone();
            for identifier in &openhome_ids {
                new_store.remove(identifier);
            }
            new_store
        })?;
    let mut results = HashMap::new();

    let controller = TauriDataController::new(&app_handle);
    // then delete from the disk
    for identifier in openhome_ids {
        let relative_path = Path::new(MONS_V2_DIR).join(format!("{identifier}.ohpkm"));
        match controller.absolute_path(DataDir::Storage, &relative_path) {
            Ok(full_path) => {
                let deletion_result = fs::remove_file(full_path)
                    .map_err(|e| Error::file_access(&relative_path, e).to_string());
                results.insert(identifier, deletion_result.err());
            }
            Err(source_err) => {
                let error = Error::file_access(&relative_path, source_err);
                results.insert(identifier, Some(error.to_string()));
            }
        };
    }

    Ok(results)
}
