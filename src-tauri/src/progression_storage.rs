use crate::error::Result;
use crate::util;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RewardHistoryItem {
    pub reward_id: String,
    pub milestone_id: String,
    pub granted_at_iso: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressionState {
    pub version: u32,
    pub completed_milestones: HashMap<String, bool>,
    pub granted_rewards: HashMap<String, bool>,
    pub reward_history: Vec<RewardHistoryItem>,
}

impl ProgressionState {
    pub fn default_v1() -> Self {
        Self {
            version: 1,
            completed_milestones: HashMap::new(),
            granted_rewards: HashMap::new(),
            reward_history: Vec::new(),
        }
    }
}

#[tauri::command]
pub fn load_progression(app_handle: tauri::AppHandle) -> Result<ProgressionState> {
    let state: Result<ProgressionState> =
        util::get_storage_file_json(&app_handle, "progression.json");

    match state {
        Ok(s) => Ok(s),
        Err(_) => Ok(ProgressionState::default_v1()),
    }
}

#[tauri::command]
pub fn write_progression(
    app_handle: tauri::AppHandle,
    progression: ProgressionState,
) -> Result<()> {
    util::write_storage_file_json(&app_handle, "progression.json", &progression)
}

#[tauri::command]
pub fn reset_progression(app_handle: tauri::AppHandle) -> Result<()> {
    let progression = ProgressionState::default_v1();
    util::write_storage_file_json(&app_handle, "progression.json", &progression)
}