use crate::data_controller::{DataController, DataDir, MONS_V2_DIR};
use crate::error::{Error, Result};
use crate::{state::synced_state, util};
use base64::prelude::*;
use pkm_rs::ohpkm::OhpkmV2;
use serde::{Deserialize, Serialize};
use std::num::NonZeroU64;
use std::path::{Path, PathBuf};
use std::time::{Duration, UNIX_EPOCH};
use std::{collections::HashMap, fs};

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct OhpkmBytesStore(HashMap<String, Vec<u8>>);

impl OhpkmBytesStore {
    fn load_from_directory(path: &Path) -> Result<Self> {
        let mon_files = fs::read_dir(path).map_err(|e| Error::file_access(&path, e))?;

        let mut map = HashMap::new();
        for dir_entry in mon_files.flatten() {
            let path = dir_entry.path();
            if !path
                .extension()
                .is_some_and(|ext| ext.eq_ignore_ascii_case("ohpkm"))
            {
                continue;
            }

            if let Ok(mon_bytes) = util::read_file_bytes(path) {
                if let Ok(mut mon) = OhpkmV2::from_bytes(&mon_bytes) {
                    let file_created_seconds = dir_entry
                        .metadata()
                        .ok()
                        .and_then(|m| m.created().or(m.modified()).ok())
                        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                        .as_ref()
                        .map(Duration::as_secs)
                        .and_then(NonZeroU64::new);

                    mon.set_started_tracking_if_missing(file_created_seconds);
                    map.insert(mon.openhome_id(), mon.to_bytes());
                }
            }
        }

        let mut store = Self(map);

        store.fix_errors();

        Ok(store)
    }

    fn fix_errors(&mut self) {
        for (identifier, bytes) in self.0.iter_mut() {
            if let Ok(mut mon) = OhpkmV2::from_bytes(bytes) {
                let had_errors = mon.fix_errors();
                if had_errors {
                    println!(
                        "Fixed errors Ohpkm {} with id {identifier}",
                        mon.get_nickname()
                    );
                    *bytes = mon.to_bytes();
                }
            }
        }
    }

    fn write_to_directory(data: &Self, path: &Path) -> Result<()> {
        let mut errors: Vec<(PathBuf, Box<dyn std::error::Error>)> = Vec::new();
        data.0.iter().for_each(|(identifier, bytes)| {
            let filename = format!("{identifier}.ohpkm");
            let file_path = path.join(filename);
            if let Err(err) = fs::write(&file_path, bytes) {
                errors.push((file_path, Box::new(err)));
            };
        });

        if !errors.is_empty() {
            Err(Error::FileWrites(errors))
        } else {
            Ok(())
        }
    }

    pub fn load_from_mons_v2(data_controller: &impl DataController) -> Result<Self> {
        let mons_v2_dir = data_controller.absolute_path(DataDir::Storage, MONS_V2_DIR)?;
        Self::load_from_directory(&mons_v2_dir)
    }

    pub fn write_to_mons_v2(&self, data_controller: &impl DataController) -> Result<()> {
        let mons_v2_dir = data_controller.absolute_path(DataDir::Storage, MONS_V2_DIR)?;
        Self::write_to_directory(self, &mons_v2_dir)
    }

    pub fn to_b64_map(&self) -> HashMap<String, String> {
        let mut output: HashMap<String, String> = HashMap::new();
        for (k, v) in self.0.clone() {
            output.insert(k, BASE64_STANDARD.encode(v));
        }

        output
    }

    pub fn includes(&self, identifier: &str) -> bool {
        self.0.contains_key(identifier)
    }

    pub fn remove(&mut self, identifier: &str) -> bool {
        self.0.remove(identifier).is_some()
    }
}

impl synced_state::SyncedState for OhpkmBytesStore {
    const ID: &'static str = "ohpkm_store";

    fn to_command_response(&self) -> impl Clone + Serialize + tauri::ipc::IpcResponse {
        self.to_b64_map()
    }

    fn union_with(&mut self, other: Self) {
        other.0.into_iter().for_each(|(k, v)| {
            self.0.insert(k, v);
        });
    }
}

#[tauri::command]
pub fn get_ohpkm_store(
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
) -> Result<HashMap<String, String>> {
    synced_state.ohpkm_store_b64()
}

#[tauri::command]
pub fn add_to_ohpkm_store(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
    updates: OhpkmBytesStore,
) -> Result<()> {
    synced_state
        .lock()?
        .ohpkm_store
        .union_with(&app_handle, updates)
}

type DeleteResultsById = HashMap<String, Result<()>>;

#[tauri::command]
pub fn permanently_delete_ohpkms(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
    openhome_ids: Vec<String>,
) -> Result<DeleteResultsById> {
    // first remove from the ohpkm store
    synced_state
        .lock()?
        .ohpkm_store
        .replace(&app_handle, |store| {
            let mut new_store = store.clone();
            for identifier in &openhome_ids {
                new_store.remove(&identifier);
            }
            new_store
        })?;
    let mut results = HashMap::new();

    // then delete from the disk
    for identifier in openhome_ids {
        let relative_path = Path::new(MONS_V2_DIR).join(format!("{identifier}.ohpkm"));
        match app_handle.absolute_path(DataDir::Storage, &relative_path) {
            Ok(full_path) => {
                let deletion_result =
                    fs::remove_file(full_path).map_err(|e| Error::file_access(&relative_path, e));
                results.insert(identifier, deletion_result);
            }
            Err(source_err) => {
                let error = Error::file_access(&relative_path, source_err);
                results.insert(identifier, Err(error));
            }
        };
    }

    Ok(results)
}
