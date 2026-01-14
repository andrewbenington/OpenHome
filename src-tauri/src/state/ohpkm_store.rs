use crate::error::{Error, Result};
use crate::{state::shared_state, util};
use base64::prelude::*;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::{collections::HashMap, fs};

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct OhpkmBytesStore(HashMap<String, Vec<u8>>);

impl OhpkmBytesStore {
    fn load_from_directory(path: &Path) -> Result<Self> {
        let mon_files = fs::read_dir(path).map_err(|e| Error::file_access(&path, e))?;

        let mut map = HashMap::new();
        for mon_file_os_str in mon_files.flatten() {
            let path = mon_file_os_str.path();
            if !path
                .extension()
                .is_some_and(|ext| ext.eq_ignore_ascii_case("ohpkm"))
            {
                continue;
            }

            if let Ok(mon_bytes) = util::read_file_bytes(path) {
                let mon_identifier = mon_file_os_str
                    .file_name()
                    .to_string_lossy()
                    .trim_end_matches(".ohpkm")
                    .to_owned();
                map.insert(mon_identifier, mon_bytes);
            }
        }

        Ok(Self(map))
    }

    fn write_to_directory(data: &Self, path: &Path) -> Result<()> {
        println!("writing {} ohpkm files", data.0.len());
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

    pub fn load_from_mons_v2(app_handle: &tauri::AppHandle) -> Result<Self> {
        let mons_v2_dir = util::prepend_appdata_storage_to_path(app_handle, "mons_v2")?;
        Self::load_from_directory(&mons_v2_dir)
    }

    pub fn write_to_mons_v2(&self, app_handle: &tauri::AppHandle) -> Result<()> {
        let mons_v2_dir = util::prepend_appdata_storage_to_path(app_handle, "mons_v2")?;
        Self::write_to_directory(self, &mons_v2_dir)
    }

    pub fn to_b64_map(&self) -> HashMap<String, String> {
        let mut output: HashMap<String, String> = HashMap::new();
        for (k, v) in self.0.clone() {
            output.insert(k, BASE64_STANDARD.encode(v));
        }

        output
    }
}

impl shared_state::SharedState for OhpkmBytesStore {
    const ID: &'static str = "ohpkm_store";

    fn to_command_response(&self) -> impl Clone + Serialize + tauri::ipc::IpcResponse {
        self.to_b64_map()
    }

    fn update_from(&mut self, other: Self) {
        other.0.into_iter().for_each(|(k, v)| {
            self.0.insert(k, v);
        });
    }
}

#[tauri::command]
pub fn get_ohpkm_store(
    shared_state: tauri::State<'_, shared_state::AllSharedState>,
) -> Result<HashMap<String, String>> {
    shared_state.ohpkm_store_b64()
}

#[tauri::command]
pub fn add_to_ohpkm_store(
    app_handle: tauri::AppHandle,
    shared_state: tauri::State<'_, shared_state::AllSharedState>,
    updates: OhpkmBytesStore,
) -> Result<()> {
    shared_state
        .lock()?
        .ohpkm_store
        .update(&app_handle, updates)
}
