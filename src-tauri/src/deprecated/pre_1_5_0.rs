use crate::pkm_storage;
use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub const BOXDATA_FILE: &str = "box-data.json";

#[derive(Deserialize, Serialize)]
pub struct BoxPreV1_5_0 {
    pub index: u8,
    #[serde(rename = "monIdentifiersByIndex")]
    pub mon_identifiers_by_index: HashMap<String, String>,
    pub name: Option<String>,
}

impl BoxPreV1_5_0 {
    pub fn upgrade(self) -> pkm_storage::Box {
        let mut identifiers: HashMap<u8, String> = HashMap::new();
        for (index_str, identifier) in self.mon_identifiers_by_index {
            match index_str.parse::<u8>() {
                Ok(index) => {
                    identifiers.insert(index, identifier);
                }
                Err(_) => continue,
            }
        }

        pkm_storage::Box {
            id: Uuid::new_v4(),
            name: self.name,
            index: self.index as usize,
            identifiers,
            ..Default::default()
        }
    }

    pub fn from_current(current: pkm_storage::Box) -> Self {
        let mut identifiers: HashMap<String, String> = HashMap::new();
        for (index, identifier) in current.identifiers {
            identifiers.insert(index.to_string(), identifier);
        }

        Self {
            name: current.name,
            index: current.index as u8,
            mon_identifiers_by_index: identifiers,
        }
    }
}
