use crate::commands::CommandResult;
use crate::data_controller::TauriDataController;
use crate::synced_state;
use openhome_core::data_controller::{DataController, DataDir, MONS_V2_DIR};
use openhome_core::ohpkm_store::OhpkmBytesStore;
use openhome_core::{Error, search};
use pkm_rs::ohpkm::UnknownHandlerSave;
use pkm_rs_resources::metadata_source::MetadataSource;
use pkm_rs_types::{BinaryGender, OriginGame};
use serde::Serialize;
use std::path::Path;
use std::{collections::HashMap, fs};

impl synced_state::SyncedState for OhpkmBytesStore {
    type Action = Self;
    const ID: &'static str = "ohpkm_store";

    fn to_command_response(&self) -> impl Clone + Serialize + tauri::ipc::IpcResponse {
        self.to_b64_map()
    }

    fn update(&mut self, other: Self) {
        other.all_entries().for_each(|(k, v)| {
            self.insert(k, v);
        });
    }
}

#[tauri::command]
#[specta::specta]
pub fn get_ohpkm_store(
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
) -> CommandResult<Vec<(String, String)>> {
    Ok(synced_state.ohpkm_store_b64()?)
}

#[tauri::command]
#[specta::specta]
pub fn search_ohpkm_store(
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
    pagination_cursor: search::PaginationCursor,
    filters: Vec<search::Filter>,
) -> CommandResult<search::PaginatedPage<String>> {
    Ok(synced_state.search_ohpkm_store(pagination_cursor, filters)?)
}

#[tauri::command]
#[specta::specta]
pub fn get_ohpkm_ids_matching_unknown_handler(
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
    save_name: &str,
    save_gender: BinaryGender,
    save_game_origin_index: u8,
) -> CommandResult<Vec<String>> {
    let origin_game = OriginGame::try_from_u8(save_game_origin_index).ok_or(format!("Unsupported save game index encountered when trying to populate unknown handlers: {save_game_origin_index}"))?;

    Ok(synced_state.search_ohpkms_matching_unknown_handler(&UnknownHandlerSave::new(
            save_name.to_owned(),
            save_gender,
            MetadataSource::from_origin_game(origin_game).ok_or(format!("Unsupported save game type encountered when trying to populate unknown handlers: {save_game_origin_index}"))?,
        ))?.into_iter()
    .map(|ohpkm| ohpkm.openhome_id().to_string())
    .collect())
}

#[tauri::command]
#[specta::specta]
pub fn get_ohpkm_bytes_by_id(
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
    openhome_id: String,
) -> CommandResult<Option<Vec<u8>>> {
    Ok(synced_state
        .ohpkm_lookup(openhome_id.parse()?)?
        .map(|ohpkm| ohpkm.to_bytes().to_vec()))
}

#[tauri::command]
#[specta::specta]
pub fn add_to_ohpkm_store(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
    updates: OhpkmBytesStore,
) -> CommandResult<()> {
    Ok(synced_state
        .lock()?
        .ohpkm_store
        .update(&app_handle, updates)?)
}

type DeleteResultsById = HashMap<String, Option<String>>;

#[tauri::command]
#[specta::specta]
pub fn permanently_delete_ohpkms(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
    openhome_ids: Vec<String>,
) -> CommandResult<DeleteResultsById> {
    // first remove from the ohpkm store
    synced_state
        .lock()?
        .ohpkm_store
        .replace(&app_handle, |store| {
            let mut new_store = store.clone();
            for identifier in openhome_ids.iter().filter_map(|id_str| id_str.parse().ok()) {
                new_store.remove(&identifier);
            }
            new_store
        })?;
    let mut results = HashMap::new();

    let controller = TauriDataController::new(&app_handle);
    // then delete from the disk
    for identifier in openhome_ids {
        let relative_path = Path::new(MONS_V2_DIR).join(format!("{identifier}.ohpkm"));
        match controller.absolute_path(DataDir::Storage, &relative_path) {
            Ok(full_path) => {
                let deletion_result = fs::remove_file(full_path)
                    .map_err(|e| Error::file_access(&relative_path, e).to_string());
                results.insert(identifier, deletion_result.err());
            }
            Err(source_err) => {
                let error = Error::file_access(&relative_path, source_err);
                results.insert(identifier, Some(error.to_string()));
            }
        };
    }

    Ok(results)
}
