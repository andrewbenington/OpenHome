use crate::commands::{CommandError, CommandResult};
use openhome_core::convert_strategies::{ConvertStrategies, NamedStrategy};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::synced_state;

impl synced_state::SyncedState for ConvertStrategies {
    type Action = ConvertStrategyEntries;
    const ID: &'static str = "convert_strategies";

    fn update(&mut self, action: Self::Action) {
        for (key, value) in action.ids_and_strategies {
            self.insert(key, value);
        }
        self.set_default(action.default_strategy_id);
    }

    fn to_command_response(&self) -> impl Clone + Serialize + tauri::ipc::IpcResponse {
        self
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
            ids_and_strategies: strategies.all(),
            default_strategy_id: strategies.default_id().unwrap_or_default(),
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
