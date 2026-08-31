use std::ops::Deref;
use crate::commands::{CommandError, CommandResult};
use crate::data_controller::ToDataController;
use openhome_core::{Error, Result};
use serde::Serialize;
use tauri::Emitter;
use lazy_state::LazyState;
pub mod convert_strategies;
pub mod lookup;
pub mod ohpkm_store;

pub mod lazy_state_change;
mod lazy_state_inner;
mod ohpkm_cache;
pub(crate) mod lazy_state;
mod lazy_state_change_list;
pub mod box_pointer;

pub trait SyncedState: Clone + Serialize + tauri::ipc::IpcResponse {
    type Action: Clone + Serialize + tauri::ipc::IpcResponse + serde::de::DeserializeOwned;
    const ID: &'static str;
    fn update(&mut self, action: Self::Action);
    fn to_command_response(&self) -> impl Clone + Serialize + tauri::ipc::IpcResponse;
}

/// SyncedStateWrapper wraps state synced with the React frontend. All mutations
/// result in an emitted event to ensure the React side is up to date.
pub struct SyncedStateWrapper<State: SyncedState>(State);

impl<State: SyncedState> SyncedStateWrapper<State> {
    fn emit_update(&self, app_handle: &tauri::AppHandle) -> Result<()> {
        let event = format!("synced_state_update::{}", State::ID);

        app_handle
            .emit(&event, self.0.to_command_response())
            .map_err(|err| {
                Error::other_with_source(&format!("Could not emit '{event}' to frontend"), err)
            })
    }

    pub fn read(&self) -> &State {
        &self.0
    }

    /// Safe to use even if called twice in one hook cycle. Better, debounced frontend code would probably eliminate
    /// that concern.
    pub fn update(&mut self, app_handle: &tauri::AppHandle, action: State::Action) -> Result<()> {
        self.0.update(action);
        self.emit_update(app_handle)
    }

    /// Will cause bugs if called too often. Only for "batch" mutations.
    pub fn replace<F>(&mut self, app_handle: &tauri::AppHandle, updater: F) -> Result<()>
    where
        F: FnOnce(&State) -> State,
    {
        self.0 = updater(&self.0);
        self.emit_update(app_handle)
    }
}

#[tauri::command]
#[specta::specta]
pub fn save_synced_state(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, LazyState>,
) -> CommandResult<()> {
    synced_state
        .save_to_files(&app_handle.controller())
        .map_err(CommandError::from)
}

#[tauri::command]
#[specta::specta]
pub fn update_synced_state(
    synced_state: tauri::State<'_, LazyState>,
    state_identifier: &str,
    action: serde_json::Value,
) -> CommandResult<()> {
    synced_state
        .update_from_frontend(state_identifier, action)
        .map_err(CommandError::from)
}
