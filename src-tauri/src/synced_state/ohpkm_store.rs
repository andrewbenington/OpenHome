use crate::commands::CommandResult;
use crate::data_controller::TauriDataController;
use crate::synced_state;
use openhome_core::data_controller::{DataController, DataDir, MONS_V2_DIR};
use openhome_core::ohpkm_store::OhpkmBytesStore;
use openhome_core::Error;
use serde::Serialize;
use std::path::Path;
use std::{collections::HashMap, fs};
use crate::synced_state::lazy_state_change::LazyStateChange;

impl synced_state::SyncedState for OhpkmBytesStore {
    type Action = Self;
    const ID: &'static str = "ohpkm_store";

    fn update(&mut self, other: Self) {
        other.all_entries().for_each(|(k, v)| {
            self.insert(k, v);
        });
    }

    fn to_command_response(&self) -> impl Clone + Serialize + tauri::ipc::IpcResponse {
        self.to_b64_map()
    }
}

#[tauri::command]
#[specta::specta]
pub fn add_to_ohpkm_store(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::LazyState>,
    lazy_state_changes: Vec<LazyStateChange>,
) -> CommandResult<()> {
    Ok(synced_state
        .lock()?

        // TODO change the logic of ohpkm_store so it properly reflects new behaviour

        .update(&app_handle, lazy_state_changes)?)
}

type DeleteResultsById = HashMap<String, Option<String>>;

#[tauri::command]
#[specta::specta]
pub fn permanently_delete_ohpkms(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::LazyState>,
    openhome_ids: Vec<String>,
) -> CommandResult<DeleteResultsById> {
    // first remove from the ohpkm store
    synced_state
        .lock()?
        .remove_all_mons(&app_handle, {
            openhome_ids.iter().filter_map(|id_str| id_str.parse().ok())
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
