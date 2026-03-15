use crate::error::Result;
use crate::storage;
use serde::Serialize;

use crate::state::synced_state::SyncedState;

type ConversionSettingsJson = serde_json::Map<String, serde_json::Value>;

#[derive(Debug, Clone, Serialize)]
pub struct ConversionSettings(ConversionSettingsJson);

const JSON_FILENAME: &str = "conversion_settings.json";

impl SyncedState for ConversionSettings {
    const ID: &'static str = "conversion_settings";

    fn union_with(&mut self, other: Self) {
        for (key, value) in other.0 {
            self.0.insert(key, value);
        }
    }
}

impl ConversionSettings {
    pub fn load_from_storage(app_handle: &tauri::AppHandle) -> Result<Self> {
        let json_value: ConversionSettingsJson =
            storage::read_or_create_default_json(app_handle, JSON_FILENAME)?;
        Ok(Self(json_value))
    }

    pub fn write_to_files(&self, app_handle: &tauri::AppHandle) -> Result<()> {
        storage::write_file_json(app_handle, JSON_FILENAME, &self.0)
    }
}
