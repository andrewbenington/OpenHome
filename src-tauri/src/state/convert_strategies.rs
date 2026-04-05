use std::collections::HashMap;

use crate::error::Result;
use crate::storage;
use pkm_rs::convert_strategy::ConvertStrategy;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::state::synced_state::{self, SyncedState};

#[cfg_attr(feature = "wasm", derive(Tsify))]
#[derive(Debug, Clone, Serialize, Deserialize)]
struct NamedStrategy {
    name: String,
    strategy: ConvertStrategy,
}

type StrategiesById = HashMap<Uuid, NamedStrategy>;

#[cfg_attr(feature = "wasm", derive(Tsify))]
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
    pub fn load_from_storage(app_handle: &tauri::AppHandle) -> Result<Self> {
        storage::read_or_create_default_json(app_handle, JSON_FILENAME)
    }

    pub fn write_to_files(&self, app_handle: &tauri::AppHandle) -> Result<()> {
        storage::write_file_json(app_handle, JSON_FILENAME, self)
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
