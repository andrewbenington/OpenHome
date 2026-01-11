use std::collections::HashMap;
use std::ops::Deref;
use std::sync::Mutex;

use serde::Serialize;
use tauri::Emitter;

use crate::error::{Error, Result};
use crate::state::{LookupState, OhpkmBytesStore};

pub trait SharedState: Clone + Serialize + tauri::ipc::IpcResponse {
    const ID: &'static str;
}

pub struct SharedStateWrapper<State: SharedState>(State);

impl<State: SharedState> SharedStateWrapper<State> {
    pub fn update<F>(&mut self, app_handle: &tauri::AppHandle, update_function: F) -> Result<()>
    where
        F: FnOnce(&State) -> State,
    {
        self.0 = update_function(&self.0);

        let event = format!("shared_state_update::{}", State::ID);

        app_handle.emit(&event, self.0.clone()).map_err(|err| {
            Error::other_with_source(&format!("Could not emit '{event}' to frontend"), err)
        })
    }
}

pub struct AllSharedStateInner {
    lookups: SharedStateWrapper<LookupState>,
    ohpkm_store: SharedStateWrapper<OhpkmBytesStore>,
}

impl AllSharedStateInner {
    pub fn update_lookups<F>(
        &mut self,
        app_handle: &tauri::AppHandle,
        update_function: F,
    ) -> Result<()>
    where
        F: FnOnce(&LookupState) -> LookupState,
    {
        self.lookups.update(app_handle, update_function)
    }

    pub fn update_ohpkm_store<F>(
        &mut self,
        app_handle: &tauri::AppHandle,
        update_function: F,
    ) -> Result<()>
    where
        F: FnOnce(&OhpkmBytesStore) -> OhpkmBytesStore,
    {
        self.ohpkm_store.update(app_handle, update_function)
    }
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
}

impl Deref for AllSharedState {
    type Target = Mutex<AllSharedStateInner>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
