use std::collections::HashMap;
use std::ops::Deref;
use std::sync::Mutex;

use serde::Serialize;
use tauri::Emitter;

use crate::error::{Error, Result};
use crate::state::{LookupState, OhpkmBytesStore};

pub trait SharedState: Clone + Serialize + tauri::ipc::IpcResponse {
    const ID: &'static str;
    fn update_from(&mut self, other: Self);
    fn to_command_response(&self) -> impl Clone + Serialize + tauri::ipc::IpcResponse {
        self
    }
}

pub struct SharedStateWrapper<State: SharedState>(State);

impl<State: SharedState> SharedStateWrapper<State> {
    pub fn update(&mut self, app_handle: &tauri::AppHandle, new_data: State) -> Result<()> {
        self.0.update_from(new_data);

        let event = format!("shared_state_update::{}", State::ID);

        app_handle
            .emit(&event, self.0.to_command_response())
            .map_err(|err| {
                Error::other_with_source(&format!("Could not emit '{event}' to frontend"), err)
            })
    }
}

pub struct AllSharedStateInner {
    pub lookups: SharedStateWrapper<LookupState>,
    pub ohpkm_store: SharedStateWrapper<OhpkmBytesStore>,
}

pub struct AllSharedState(pub Mutex<AllSharedStateInner>);

impl AllSharedState {
    pub fn from_states(lookups: LookupState, ohpkm_store: OhpkmBytesStore) -> Self {
        Self(Mutex::new(AllSharedStateInner {
            lookups: SharedStateWrapper(lookups),
            ohpkm_store: SharedStateWrapper(ohpkm_store),
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

impl Deref for AllSharedState {
    type Target = Mutex<AllSharedStateInner>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[tauri::command]
pub fn save_shared_state(
    app_handle: tauri::AppHandle,
    shared_state: tauri::State<'_, AllSharedState>,
) -> Result<()> {
    shared_state.save_to_files(&app_handle)
}
