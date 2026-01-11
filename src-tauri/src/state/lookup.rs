use std::collections::HashMap;

use serde::Serialize;

use crate::error::Result;
use crate::state::shared_state::{self, AllSharedState};
use crate::util;

type IdentifierLookup = HashMap<String, String>;

#[derive(Default, Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LookupState {
    gen_12: IdentifierLookup,
    gen_345: IdentifierLookup,
}

impl LookupState {
    pub fn from_components(gen_12: IdentifierLookup, gen_345: IdentifierLookup) -> Self {
        Self { gen_12, gen_345 }
    }

    pub fn load_from_storage(app_handle: &tauri::AppHandle) -> Result<Self> {
        Ok(Self {
            gen_12: util::get_storage_file_json(app_handle, "gen12_lookup.json")?,
            gen_345: util::get_storage_file_json(app_handle, "gen345_lookup.json")?,
        })
    }

    fn write_to_files(&self, app_handle: &tauri::AppHandle) -> Result<()> {
        util::write_storage_file_json(app_handle, "gen12_lookup.json", &self.gen_12)?;
        util::write_storage_file_json(app_handle, "gen345_lookup.json", &self.gen_345)
    }
}

impl shared_state::SharedState for LookupState {
    const ID: &'static str = "lookup";
}

#[tauri::command]
pub fn get_lookups(shared_state: tauri::State<'_, AllSharedState>) -> Result<LookupState> {
    println!("lookups: {:?}", shared_state.clone_lookups());
    shared_state.clone_lookups()
}

#[tauri::command]
pub fn update_lookups(
    app_handle: tauri::AppHandle,
    shared_state: tauri::State<'_, AllSharedState>,
    gen_12: IdentifierLookup,
    gen_345: IdentifierLookup,
) -> Result<()> {
    let new_lookups = LookupState::from_components(gen_12, gen_345);
    new_lookups.write_to_files(&app_handle)?;

    shared_state
        .lock()?
        .update_lookups(&app_handle, |_| new_lookups)
}
