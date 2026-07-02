use std::collections::HashMap;
use std::ops::Deref;
use std::sync::Mutex;

use serde::Serialize;
use tauri::Emitter;

use crate::commands::{CommandError, CommandResult};
use crate::data_controller;
use crate::error::{Error, Result};

pub mod convert_strategies;
pub mod lookup;
pub mod ohpkm_store;

use convert_strategies::ConvertStrategies;
use lookup::LookupState;
use ohpkm_store::OhpkmBytesStore;

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

pub struct AllSyncedStateInner {
    pub lookups: SyncedStateWrapper<LookupState>,
    pub ohpkm_store: SyncedStateWrapper<OhpkmBytesStore>,
    pub convert_strategies: SyncedStateWrapper<ConvertStrategies>,
}

pub struct AllSyncedState(pub Mutex<AllSyncedStateInner>);

impl AllSyncedState {
    pub fn from_states(
        lookups: LookupState,
        ohpkm_store: OhpkmBytesStore,
        convert_strategies: ConvertStrategies,
    ) -> Self {
        Self(Mutex::new(AllSyncedStateInner {
            lookups: SyncedStateWrapper(lookups),
            ohpkm_store: SyncedStateWrapper(ohpkm_store),
            convert_strategies: SyncedStateWrapper(convert_strategies),
        }))
    }

    pub fn clone_lookups(&self) -> Result<LookupState> {
        Ok(self.lock()?.lookups.0.clone())
    }

    pub fn ohpkm_store_b64(&self) -> Result<HashMap<String, String>> {
        Ok(self.lock()?.ohpkm_store.0.to_b64_map())
    }

    pub fn get_convert_strategies(&self) -> Result<ConvertStrategies> {
        Ok(self.lock()?.convert_strategies.0.clone())
    }

    pub fn save_to_files(
        &self,
        data_controller: &impl data_controller::DataController,
    ) -> Result<()> {
        let locked = self.lock()?;
        locked.ohpkm_store.0.write_to_mons_v2(data_controller)?;
        locked.lookups.0.write_to_files(data_controller)?;
        locked.convert_strategies.0.write_to_files(data_controller)
    }

    fn update_from_frontend(
        &self,
        state_identifier: &str,
        action: serde_json::Value,
    ) -> Result<()> {
        match state_identifier {
            ConvertStrategies::ID => {
                let action: <ConvertStrategies as SyncedState>::Action =
                    serde_json::from_value(action).map_err(|e| {
                        Error::unexpeted_condition_with_source(
                            "update_from_frontend: invalid ConvertStrategies action received"
                                .to_owned(),
                            e,
                        )
                    })?;
                self.lock()?.convert_strategies.0.update(action);
            }
            LookupState::ID => {
                let action: <LookupState as SyncedState>::Action = serde_json::from_value(action)
                    .map_err(|e| {
                    Error::unexpeted_condition_with_source(
                        "update_from_frontend: invalid LookupState action received".to_owned(),
                        e,
                    )
                })?;
                self.lock()?.lookups.0.update(action);
            }
            OhpkmBytesStore::ID => {
                let action: <OhpkmBytesStore as SyncedState>::Action =
                    serde_json::from_value(action).map_err(|e| {
                        Error::unexpeted_condition_with_source(
                            "update_from_frontend: invalid OhpkmBytesStore action received"
                                .to_owned(),
                            e,
                        )
                    })?;
                self.lock()?.ohpkm_store.0.update(action);
            }
            _ => {
                return Err(Error::unexpeted_condition(format!(
                    "update_from_frontend: invalid state identifier received - '{state_identifier}'"
                )));
            }
        }

        Ok(())
    }
}

impl Deref for AllSyncedState {
    type Target = Mutex<AllSyncedStateInner>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[tauri::command]
#[specta::specta]
pub fn save_synced_state(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, AllSyncedState>,
) -> CommandResult<()> {
    synced_state
        .save_to_files(&app_handle)
        .map_err(CommandError::from)
}

#[tauri::command]
#[specta::specta]
pub fn update_synced_state(
    synced_state: tauri::State<'_, AllSyncedState>,
    state_identifier: &str,
    action: serde_json::Value,
) -> CommandResult<()> {
    synced_state
        .update_from_frontend(state_identifier, action)
        .map_err(CommandError::from)
}
