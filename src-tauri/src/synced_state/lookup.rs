use openhome_core::lookup::LookupState;
use serde::Serialize;

use crate::commands::{CommandError, CommandResult};
use crate::synced_state;

impl synced_state::SyncedState for LookupState {
    type Action = Self;
    const ID: &'static str = "lookups";

    fn update(&mut self, other: Self::Action) {
        self.union_with(other);
    }

    fn to_command_response(&self) -> impl Clone + Serialize + tauri::ipc::IpcResponse {
        self
    }
}

#[tauri::command]
#[specta::specta]
pub fn get_lookups(
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
) -> CommandResult<LookupState> {
    Ok(synced_state.clone_lookups()?)
}

#[tauri::command]
#[specta::specta]
pub fn add_to_lookups(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
    new_entries: LookupState,
) -> CommandResult<()> {
    synced_state
        .lock()?
        .lookups
        .update(&app_handle, new_entries)
        .map_err(CommandError::from)
}

#[tauri::command]
#[specta::specta]
pub fn remove_dangling(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
) -> CommandResult<()> {
    // definitely unnecessary clones here
    let mut synced_state = synced_state.lock()?;
    let ohpkm_store = synced_state.ohpkm_store.read().clone();

    synced_state
        .lookups
        .replace(&app_handle, |l| {
            l.clone().with_dangling_removed(&ohpkm_store)
        })
        .map_err(CommandError::from)
}
