use openhome_core::pkm_storage;
use pkm_rs::ohpkm::OpenHomeId;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
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
        let mut identifiers: HashMap<u8, OpenHomeId> = HashMap::new();
        for (index_str, identifier) in self.mon_identifiers_by_index {
            if let Ok(index) = index_str.parse::<u8>()
                && let Ok(openhome_id) = identifier.parse()
            {
                identifiers.insert(index, openhome_id);
            };
        }

        pkm_storage::Box {
            id: Uuid::new_v4(),
            name: self.name,
            index: self.index as usize,
            identifiers,
        }
    }
}
