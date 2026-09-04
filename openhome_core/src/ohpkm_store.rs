use crate::data_controller::{DataController, DataDir, MONS_V2_DIR};
use crate::error::{Error, Result};
use crate::pagination::{PaginatedPage, PaginationCursor};
use crate::util;
use base64::prelude::*;
use pkm_rs::ohpkm::OhpkmV2;
use pkm_rs::ohpkm::OpenHomeId;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::num::NonZeroU64;
use std::path::{Path, PathBuf};
use std::time::{Duration, UNIX_EPOCH};
use std::{collections::HashMap, fs};
use tracing::warn;

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct OhpkmBytesStore(HashMap<OpenHomeId, Vec<u8>>);

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

            if let Ok(mon_bytes) = util::read_file_bytes(path)
                && let Ok(mut mon) = OhpkmV2::from_bytes(&mon_bytes)
            {
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

        let mut store = Self(map);

        store.fix_errors();

        Ok(store)
    }

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
            output.insert(k.to_string(), BASE64_STANDARD.encode(v));
        }

        output
    }

    pub fn to_b64_entries(&self) -> Vec<(String, String)> {
        self.0
            .iter()
            .map(|(k, v)| (k.to_string(), BASE64_STANDARD.encode(v)))
            .collect()
    }

    pub fn get_b64_bytes_page_after(
        &self,
        current_cursor: PaginationCursor,
    ) -> PaginatedPage<String> {
        let entries = self.0.values().map(|bytes| BASE64_STANDARD.encode(bytes));

        PaginatedPage::next_after_cursor(current_cursor, entries, self.0.len())
    }

    pub fn lookup(&self, identifier: &OpenHomeId) -> Result<Option<OhpkmV2>> {
        Ok(self
            .0
            .get(identifier)
            .map(|bytes| OhpkmV2::from_bytes(bytes))
            .transpose()?)
    }

    pub fn includes(&self, identifier: &OpenHomeId) -> bool {
        self.0.contains_key(identifier)
    }

    pub fn insert(&mut self, identifier: &OpenHomeId, bytes: &[u8]) {
        self.0.insert(identifier.to_owned(), bytes.to_vec());
    }

    pub fn remove(&mut self, identifier: &OpenHomeId) -> bool {
        self.0.remove(identifier).is_some()
    }

    pub fn all_entries(&self) -> impl Iterator<Item = (&OpenHomeId, &Vec<u8>)> {
        self.0.iter()
    }
}
