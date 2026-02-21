use std::collections::HashMap;
use std::ops::Deref;
use std::sync::Mutex;

use serde::Serialize;
use tauri::Emitter;

use crate::error::{Error, Result};
use crate::state::{LookupState, OhpkmBytesStore};

pub trait SyncedState: Clone + Serialize + tauri::ipc::IpcResponse {
    const ID: &'static str;
    fn union_with(&mut self, other: Self);
    fn to_command_response(&self) -> impl Clone + Serialize + tauri::ipc::IpcResponse {
        self
    }
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
    pub fn union_with(&mut self, app_handle: &tauri::AppHandle, new_data: State) -> Result<()> {
        self.0.union_with(new_data);
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

pub struct AllSyncedStateInner {
    pub lookups: SyncedStateWrapper<LookupState>,
    pub ohpkm_store: SyncedStateWrapper<OhpkmBytesStore>,
}

pub struct AllSyncedState(pub Mutex<AllSyncedStateInner>);

impl AllSyncedState {
    pub fn from_states(lookups: LookupState, ohpkm_store: OhpkmBytesStore) -> Self {
        Self(Mutex::new(AllSyncedStateInner {
            lookups: SyncedStateWrapper(lookups),
            ohpkm_store: SyncedStateWrapper(ohpkm_store),
        }))
    }

    pub fn clone_lookups(&self) -> Result<LookupState> {
        Ok(self.lock()?.lookups.0.clone())
    }

    pub fn ohpkm_store_b64(&self) -> Result<HashMap<String, String>> {
        Ok(self.lock()?.ohpkm_store.0.to_b64_map())
    }

    pub fn save_to_files(&self, app_handle: &tauri::AppHandle) -> Result<()> {
        let locked = self.lock()?;
        locked.ohpkm_store.0.write_to_mons_v2(app_handle)?;
        locked.lookups.0.write_to_files(app_handle)
    }
}

impl Deref for AllSyncedState {
    type Target = Mutex<AllSyncedStateInner>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[tauri::command]
pub fn save_synced_state(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, AllSyncedState>,
) -> Result<()> {
    synced_state.save_to_files(&app_handle)
}
