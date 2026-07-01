use std::collections::HashMap;

use crate::{
    data_controller::{DataController, DataDir},
    error::Result,
};
use pkm_rs::convert_strategy::ConvertStrategy;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::synced_state;

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

impl synced_state::SyncedState for ConvertStrategies {
    type Action = Self;
    const ID: &'static str = "convert_strategies";

    fn update(&mut self, action: Self::Action) {
        for (key, value) in action.strategies_by_id {
            self.strategies_by_id.insert(key, value);
        }
        if let Some(id) = action.default_strategy_id {
            self.default_strategy_id = Some(id);
        }
    }

    fn to_command_response(&self) -> impl Clone + Serialize + tauri::ipc::IpcResponse {
        self
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
        .update(&app_handle, updates)
}
