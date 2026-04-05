use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::error::Result;
use crate::state::synced_state::{self, AllSyncedState};
use crate::storage;

type IdentifierLookup = HashMap<String, String>;

pub const GEN12_FILENAME: &str = "gen12_lookup.json";
pub const GEN345_FILENAME: &str = "gen345_lookup.json";

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LookupState {
    gen_12: IdentifierLookup,
    gen_345: IdentifierLookup,
}

impl LookupState {
    pub fn load_from_storage(app_handle: &tauri::AppHandle) -> Result<Self> {
        Ok(Self {
            gen_12: storage::read_or_create_default_json(app_handle, GEN12_FILENAME)?,
            gen_345: storage::read_or_create_default_json(app_handle, GEN345_FILENAME)?,
        })
    }

    pub fn write_to_files(&self, app_handle: &tauri::AppHandle) -> Result<()> {
        storage::write_file_json(app_handle, GEN12_FILENAME, &self.gen_12)?;
        storage::write_file_json(app_handle, GEN345_FILENAME, &self.gen_345)
    }
}

impl synced_state::SyncedState for LookupState {
    const ID: &'static str = "lookups";

    fn union_with(&mut self, other: Self) {
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
        .union_with(&app_handle, new_entries)
}

#[tauri::command]
pub fn remove_dangling(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, AllSyncedState>,
) -> Result<()> {
    // definitely unnecessary clones here
    let mut synced_state = synced_state.lock()?;
    let ohpkm_store = synced_state.ohpkm_store.read().clone();

    synced_state.lookups.replace(&app_handle, |l| {
        let LookupState { gen_12, gen_345 } = l.clone();
        LookupState {
            gen_12: gen_12
                .into_iter()
                .filter(|(_, openhome_id)| ohpkm_store.includes(openhome_id))
                .collect(),
            gen_345: gen_345
                .into_iter()
                .filter(|(_, openhome_id)| ohpkm_store.includes(openhome_id))
                .collect(),
        }
    })
}
