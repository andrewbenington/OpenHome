use std::collections::HashMap;

use crate::{
    data_controller::{DataController, DataDir},
    error::Result,
};
use pkm_rs::convert_strategy::ConvertStrategy;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[cfg_attr(feature = "desktop", derive(specta::Type))]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NamedStrategy {
    name: String,
    strategy: ConvertStrategy,
}

impl NamedStrategy {
    pub fn inner(&self) -> &ConvertStrategy {
        &self.strategy
    }
}

type StrategiesById = HashMap<Uuid, NamedStrategy>;

#[cfg_attr(feature = "desktop", derive(specta::Type))]
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct ConvertStrategies {
    strategies_by_id: StrategiesById,
    default_strategy_id: Option<Uuid>,
}

impl ConvertStrategies {
    pub fn insert(&mut self, id: Uuid, strategy: NamedStrategy) {
        self.strategies_by_id.insert(id, strategy);
    }

    pub fn default_id(&self) -> Option<Uuid> {
        self.default_strategy_id
    }

    pub fn set_default(&mut self, default_id: Uuid) {
        if self.strategies_by_id.contains_key(&default_id) {
            self.default_strategy_id = Some(default_id)
        }
    }

    pub fn get(&self, id: &Uuid) -> Option<&NamedStrategy> {
        self.strategies_by_id.get(id)
    }

    pub fn all(&self) -> Vec<(Uuid, NamedStrategy)> {
        self.strategies_by_id.clone().into_iter().collect()
    }
}

pub const DATA_DIR: DataDir = DataDir::Storage;
pub const JSON_FILENAME: &str = "convert_strategies.json";

impl ConvertStrategies {
    pub fn load_from_storage(data_controller: &impl DataController) -> Result<Self> {
        data_controller.read_or_create_default_json_file(DATA_DIR, JSON_FILENAME)
    }

    pub fn write_to_files(&self, data_controller: &impl DataController) -> Result<()> {
        data_controller.write_file_json(DATA_DIR, JSON_FILENAME, self)
    }
}

#[cfg_attr(feature = "desktop", derive(specta::Type))]
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct ConvertStrategyEntries {
    ids_and_strategies: Vec<(Uuid, NamedStrategy)>,
    default_strategy_id: Uuid,
}
