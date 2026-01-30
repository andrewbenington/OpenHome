use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::error::Result;
use crate::state::synced_state::{self, AllSyncedState};
use crate::util;

type IdentifierLookup = HashMap<String, String>;

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LookupState {
    gen_12: IdentifierLookup,
    gen_345: IdentifierLookup,
}

impl LookupState {
    pub fn load_from_storage(app_handle: &tauri::AppHandle) -> Result<Self> {
        Ok(Self {
            gen_12: util::get_storage_file_json(app_handle, "gen12_lookup.json")?,
            gen_345: util::get_storage_file_json(app_handle, "gen345_lookup.json")?,
        })
    }

    pub fn write_to_files(&self, app_handle: &tauri::AppHandle) -> Result<()> {
        util::write_storage_file_json(app_handle, "gen12_lookup.json", &self.gen_12)?;
        util::write_storage_file_json(app_handle, "gen345_lookup.json", &self.gen_345)
    }
}

impl synced_state::SyncedState for LookupState {
    const ID: &'static str = "lookups";

    fn update_from(&mut self, other: Self) {
        other.gen_12.into_iter().for_each(|(k, v)| {
            self.gen_12.insert(k, v);
        });
        other.gen_345.into_iter().for_each(|(k, v)| {
            self.gen_345.insert(k, v);
        });
    }
}

#[tauri::command]
pub fn get_lookups(synced_state: tauri::State<'_, AllSyncedState>) -> Result<LookupState> {
    synced_state.clone_lookups()
}

#[tauri::command]
pub fn add_to_lookups(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, AllSyncedState>,
    new_entries: LookupState,
) -> Result<()> {
    synced_state
        .lock()?
        .lookups
        .update(&app_handle, new_entries)
}
