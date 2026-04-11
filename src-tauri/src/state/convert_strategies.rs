use std::collections::HashMap;

use crate::{
    data_controller::{DataController, DataDir},
    error::Result,
};
use pkm_rs::convert_strategy::ConvertStrategy;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::state::synced_state::{self, SyncedState};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct NamedStrategy {
    name: String,
    strategy: ConvertStrategy,
}

type StrategiesById = HashMap<Uuid, NamedStrategy>;

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct ConvertStrategies {
    strategies_by_id: StrategiesById,
    default_strategy_id: Option<Uuid>,
}

const JSON_FILENAME: &str = "convert_strategies.json";

impl SyncedState for ConvertStrategies {
    const ID: &'static str = "convert_strategies";

    fn union_with(&mut self, other: Self) {
        println!("Updating convert strategies: {:?}", other);
        for (key, value) in other.strategies_by_id {
            self.strategies_by_id.insert(key, value);
        }
        if let Some(id) = other.default_strategy_id {
            self.default_strategy_id = Some(id);
        }
    }
}

impl ConvertStrategies {
    pub fn load_from_storage(data_controller: &impl DataController) -> Result<Self> {
        data_controller.read_or_create_default_json_file(DataDir::Storage, JSON_FILENAME)
    }

    pub fn write_to_files(&self, data_controller: &impl DataController) -> Result<()> {
        data_controller.write_file_json(DataDir::Storage, JSON_FILENAME, self)
    }
}

#[tauri::command]
pub fn get_convert_strategies(
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
) -> Result<ConvertStrategies> {
    synced_state.get_convert_strategies()
}

#[tauri::command]
pub fn update_convert_strategies(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
    updates: ConvertStrategies,
) -> Result<()> {
    synced_state
        .lock()?
        .convert_strategies
        .union_with(&app_handle, updates)
}
