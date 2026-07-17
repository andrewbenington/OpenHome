use std::collections::HashMap;

use crate::{
    commands::{CommandError, CommandResult},
    data_controller::{DataController, DataDir},
    error::Result,
};
use pkm_rs::convert_strategy::ConvertStrategy;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::synced_state;

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct NamedStrategy {
    name: String,
    strategy: ConvertStrategy,
}

impl NamedStrategy {
    #[cfg(test)]
    pub fn inner(&self) -> &ConvertStrategy {
        &self.strategy
    }
}

type StrategiesById = HashMap<Uuid, NamedStrategy>;

#[derive(Debug, Default, Clone, Serialize, Deserialize, specta::Type)]
pub struct ConvertStrategies {
    strategies_by_id: StrategiesById,
    default_strategy_id: Option<Uuid>,
}

pub const DATA_DIR: DataDir = DataDir::Storage;
pub const JSON_FILENAME: &str = "convert_strategies.json";

impl synced_state::SyncedState for ConvertStrategies {
    type Action = ConvertStrategyEntries;
    const ID: &'static str = "convert_strategies";

    fn update(&mut self, action: Self::Action) {
        for (key, value) in action.ids_and_strategies {
            self.strategies_by_id.insert(key, value);
        }
        self.default_strategy_id = Some(action.default_strategy_id);
    }

    fn to_command_response(&self) -> impl Clone + Serialize + tauri::ipc::IpcResponse {
        self
    }
}

impl ConvertStrategies {
    pub fn load_from_storage(data_controller: &mut impl DataController) -> Result<Self> {
        data_controller.read_or_create_default_json_file(DATA_DIR, JSON_FILENAME)
    }

    pub fn write_to_files(&self, data_controller: &mut impl DataController) -> Result<()> {
        data_controller.write_file_json(DATA_DIR, JSON_FILENAME, self)
    }

    #[cfg(test)]
    pub fn get(&self, key: Uuid) -> Option<&NamedStrategy> {
        self.strategies_by_id.get(&key)
    }
}

#[derive(Debug, Default, Clone, Serialize, Deserialize, specta::Type)]
pub struct ConvertStrategyEntries {
    ids_and_strategies: Vec<(Uuid, NamedStrategy)>,
    default_strategy_id: Uuid,
}

#[tauri::command]
#[specta::specta]
pub fn get_convert_strategies(
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
) -> CommandResult<ConvertStrategyEntries> {
    synced_state
        .get_convert_strategies()
        .map(|strategies| ConvertStrategyEntries {
            ids_and_strategies: strategies.strategies_by_id.into_iter().collect(),
            default_strategy_id: strategies.default_strategy_id.unwrap_or_default(),
        })
        .map_err(CommandError::from)
}

#[tauri::command]
#[specta::specta]
pub fn update_convert_strategies(
    app_handle: tauri::AppHandle,
    synced_state: tauri::State<'_, synced_state::AllSyncedState>,
    updates: ConvertStrategyEntries,
) -> CommandResult<()> {
    synced_state
        .lock()?
        .convert_strategies
        .update(&app_handle, updates)
        .map_err(CommandError::from)
}
