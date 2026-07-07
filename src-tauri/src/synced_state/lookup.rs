use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::commands::{CommandError, CommandResult};
use crate::data_controller::{DataController, DataDir};
use crate::error::Result;
use crate::synced_state;

type IdentifierLookup = HashMap<String, String>;

pub const GEN12_FILENAME: &str = "gen12_lookup.json";
pub const GEN345_FILENAME: &str = "gen345_lookup.json";

#[derive(Default, Debug, Serialize, Deserialize, Clone, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LookupState {
    gen_12: IdentifierLookup,
    gen_345: IdentifierLookup,
}

impl LookupState {
    pub fn load_from_storage(data_controller: &impl DataController) -> Result<Self> {
        Ok(Self {
            gen_12: data_controller
                .read_or_create_default_json_file(DataDir::Storage, GEN12_FILENAME)?,
            gen_345: data_controller
                .read_or_create_default_json_file(DataDir::Storage, GEN345_FILENAME)?,
        })
    }

    pub fn write_to_files(&self, data_controller: &impl DataController) -> Result<()> {
        data_controller.write_file_json(DataDir::Storage, GEN12_FILENAME, &self.gen_12)?;
        data_controller.write_file_json(DataDir::Storage, GEN345_FILENAME, &self.gen_345)
    }
}

impl synced_state::SyncedState for LookupState {
    type Action = Self;
    const ID: &'static str = "lookups";

    fn update(&mut self, other: Self::Action) {
        other.gen_12.into_iter().for_each(|(k, v)| {
            self.gen_12.insert(k, v);
        });
        other.gen_345.into_iter().for_each(|(k, v)| {
            self.gen_345.insert(k, v);
        });
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
        .map_err(CommandError::from)
}
