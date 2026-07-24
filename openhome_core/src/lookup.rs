use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::data_controller::{DataController, DataDir};
use crate::error::Result;
use crate::ohpkm_store::OhpkmBytesStore;

type IdentifierLookup = HashMap<String, String>;

pub const GEN12_FILENAME: &str = "gen12_lookup.json";
pub const GEN345_FILENAME: &str = "gen345_lookup.json";

#[cfg_attr(feature = "desktop", derive(specta::Type))]
#[derive(Default, Debug, Serialize, Deserialize, Clone)]
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

    pub fn union_with(&mut self, other: Self) {
        other.gen_12.into_iter().for_each(|(k, v)| {
            self.gen_12.insert(k, v);
        });
        other.gen_345.into_iter().for_each(|(k, v)| {
            self.gen_345.insert(k, v);
        });
    }

    pub fn with_dangling_removed(self, store: &OhpkmBytesStore) -> Self {
        Self {
            gen_12: self
                .gen_12
                .into_iter()
                .filter(|(_, openhome_id)| store.includes(openhome_id))
                .collect(),
            gen_345: self
                .gen_345
                .into_iter()
                .filter(|(_, openhome_id)| store.includes(openhome_id))
                .collect(),
        }
    }
}
