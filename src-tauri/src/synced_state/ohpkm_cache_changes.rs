use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use serde::{Deserialize, Serialize};
use tauri::ipc::IpcResponse;
use openhome_core::data_controller::{DataController, DataDir, MONS_V2_DIR};
use openhome_core::Error;
use pkm_rs::ohpkm::OpenHomeId;
use crate::synced_state::SyncedState;

impl SyncedState for OhpkmCacheChanges {
    // TODO
    type Action = Self;
    const ID: &'static str = "lazy_state_change_list";

    fn update(&mut self, other: Self::Action) {
        other.all_entries().for_each(|(k, v)| {
            self.0.insert(*k, (*v.clone()).to_owned());
        });
    }

    fn to_command_response(&self) -> impl Clone + Serialize + IpcResponse {
        self.to_b64_map()
    }
}


#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct OhpkmCacheChanges(pub(crate) HashMap<OpenHomeId, Vec<u8>>);

impl OhpkmCacheChanges {
    pub fn all_entries(&self) -> impl Iterator<Item = (&OpenHomeId, &Vec<u8>)> {
        self.0.iter()
    }
}

impl OhpkmCacheChanges {
    pub(crate) fn to_b64_map(&self) -> impl Clone + Serialize + IpcResponse {
        let mut output: HashMap<String, String> = HashMap::new();
        for (k, v) in self.0.clone() {
            output.insert(k.to_string(), BASE64_STANDARD.encode(v));
        }

        output
    }
}

impl OhpkmCacheChanges {

    pub fn write_to_mons_v2(&self, data_controller: &impl DataController) -> openhome_core::Result<()> {
        let mons_v2_dir = data_controller.absolute_path(DataDir::Storage, MONS_V2_DIR)?;
        Self::write_to_directory(self, &mons_v2_dir)
    }

    //noinspection DuplicatedCode This code is duplicated elsewhere, but the other code will be
    // removed soon
    fn write_to_directory(data: &Self, path: &Path) -> openhome_core::Result<()> {
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

}
