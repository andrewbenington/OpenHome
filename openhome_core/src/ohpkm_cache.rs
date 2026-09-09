use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tracing::warn;
use pkm_rs::ohpkm::{OhpkmV2, OpenHomeId};
use crate::data_controller::{DataController, DataDir, MONS_V2_DIR};
use crate::Error;

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct OhpkmCache(HashMap<OpenHomeId, Vec<u8>>);


impl OhpkmCache {

    pub fn new() -> Self {
        Self { 0: HashMap::new() }
    }

    pub const OHPKM_MONS_CAPACITY: i32 = 1500;

    // noinspection DuplicatedCode
    // TODO If necessary, if this ends up still being duplicated,
    // TODO Maybe refactor a common interface out of ohpkm_store and ohpkm_cache
    fn fix_errors(&mut self) {
        for (identifier, bytes) in self.0.iter_mut() {
            if let Ok(mut mon) = OhpkmV2::from_bytes(bytes) {
                let errors = mon.fix_errors();
                if !errors.is_empty() {
                    let errors_fixed_msgs: Vec<String> =
                        errors.into_iter().map(|e| e.to_string()).collect();
                    let errors_fixed_serialized = json!({"errors_fixed": errors_fixed_msgs});
                    warn!(event = "ohpkm_errors_fixed", context = %errors_fixed_serialized, ohpkm_id = mon.openhome_id().to_string(), "Fixed Ohpkm {identifier} with nickname {}", mon.get_nickname());
                    *bytes = mon.to_bytes();
                }
            }
        }
    }

    //noinspection DuplicatedCode
    // TODO If after completing this branch this code is still duplicated, do a refactor for this
    // class as well as OHPKM_Store
    fn write_to_directory(data: &Self, path: &Path) -> crate::Result<()> {
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


    pub fn write_to_mons_v2(&self, data_controller: &impl DataController) -> crate::Result<()> {
        let mons_v2_dir = data_controller.absolute_path(DataDir::Storage, MONS_V2_DIR)?;
        Self::write_to_directory(self, &mons_v2_dir)
    }

    //noinspection DuplicatedCode
    // TODO If after completing this branch this code is still duplicated, do a refactor for this
    // class as well as OHPKM_Store
    pub fn to_b64_map(&self) -> HashMap<String, String> {
        let mut output: HashMap<String, String> = HashMap::new();
        for (k, v) in self.0.clone() {
            output.insert(k.to_string(), BASE64_STANDARD.encode(v));
        }

        output
    }


    pub fn all_entries(&self) -> impl Iterator<Item = (&OpenHomeId, &Vec<u8>)> {
        self.0.iter()
    }

    pub fn insert(&mut self, identifier: &OpenHomeId, bytes: &[u8]) {
        self.0.insert(identifier.to_owned(), bytes.to_vec());
    }

    pub fn remove(&mut self, identifier: &OpenHomeId) -> bool {
        self.0.remove(identifier).is_some()
    }
}
