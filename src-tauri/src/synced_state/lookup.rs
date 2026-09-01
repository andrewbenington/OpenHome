use openhome_core::lookup::LookupState;
use serde::Serialize;
use std::sync::MutexGuard;

use crate::commands::{CommandError, CommandResult};
use crate::synced_state;
use crate::synced_state::LazyStateInner;

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
    synced_state: tauri::State<'_, synced_state::LazyState>,
) -> CommandResult<LookupState> {
    Ok(synced_state.clone_lookups()?)
}

#[tauri::command]
#[specta::specta]
pub fn add_to_lookups(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::LazyState>,
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
    this_async_state: tauri::State<'_, synced_state::LazyState>,
) -> CommandResult<()> {
    // TODO: Add dangling checks to other boxes when loading them as well, since we are
    // no longer loading everything at once.

    // definitely unnecessary clones here
    let mut async_state: MutexGuard<LazyStateInner> = this_async_state.lock()?;
    let ohpkm_store = async_state.get_current_box().read().clone();

    async_state
        .lookups
        .replace(&app_handle, |l| {
            l.clone().with_dangling_removed(&ohpkm_store)
        })
        .map_err(CommandError::from)
}
