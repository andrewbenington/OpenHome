use std::collections::HashMap;

use openhome_core::lookup::LookupState;
use serde::{Deserialize, Serialize};

use crate::commands::{CommandError, CommandResult};
use crate::synced_state;

impl synced_state::SyncedState for LookupState {
    type Action = Self;
    const ID: &'static str = "lookups";

    fn update(&mut self, other: Self::Action) {
        self.union_with(other);
    }

    fn to_command_response(&self) -> impl std::clone::Clone + Serialize + tauri::ipc::IpcResponse {
        LookupStateStringIds::from_lookup_state(self)
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LookupStateStringIds {
    gen_12: HashMap<String, String>,
    gen_345: HashMap<String, String>,
}

impl LookupStateStringIds {
    pub fn from_lookup_state(other: &LookupState) -> Self {
        Self {
            gen_12: other
                .gen_12_entries()
                .map(|(g12_id, openhome_id)| (g12_id, openhome_id.to_string()))
                .collect(),
            gen_345: other
                .gen_345_entries()
                .map(|(g345_id, openhome_id)| (g345_id, openhome_id.to_string()))
                .collect(),
        }
    }

    pub fn into_lookup_state(self) -> LookupState {
        LookupState::from_lookups(
            self.gen_12
                .into_iter()
                .filter_map(|(g12_id, openhome_id)| {
                    openhome_id
                        .parse()
                        .ok()
                        .map(|parsed_oh_id| (g12_id, parsed_oh_id))
                })
                .collect(),
            self.gen_345
                .into_iter()
                .filter_map(|(g345_id, openhome_id)| {
                    openhome_id
                        .parse()
                        .ok()
                        .map(|parsed_oh_id| (g345_id, parsed_oh_id))
                })
                .collect(),
        )
    }
}

#[tauri::command]
#[specta::specta]
pub fn get_lookups(
    synced_state: tauri::State<'_, synced_state::LazyState>,
) -> CommandResult<LookupStateStringIds> {
    Ok(LookupStateStringIds::from_lookup_state(
        &synced_state.clone_lookups()?,
    ))
}

#[tauri::command]
#[specta::specta]
pub fn add_to_lookups(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::LazyState>,
    new_entries: LookupStateStringIds,
) -> CommandResult<()> {
    synced_state
        .lock()?
        .lookups
        .update(&app_handle, new_entries.into_lookup_state())
        .map_err(CommandError::from)
}

#[tauri::command]
#[specta::specta]
pub fn remove_dangling(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::LazyState>,
) -> CommandResult<()> {
    // definitely unnecessary clones here
    let mut synced_state = synced_state.lock()?;
    let ohpkm_store = synced_state.ohpkm_store_partial.read().clone();

    synced_state
        .lookups
        .replace(&app_handle, |l| {
            l.clone().with_dangling_removed(&ohpkm_store)
        })
        .map_err(CommandError::from)
}
