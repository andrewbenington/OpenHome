use std::{collections::HashMap, ops::Deref, sync::Mutex};

use serde::Serialize;
use tauri::Emitter;

use crate::error::{OpenHomeError, OpenHomeResult};
use crate::util;

// type OhpkmBytesLookup = HashMap<String, Vec<u8>>;
type IdentifierLookup = HashMap<String, String>;

#[derive(Default, Serialize)]
pub struct LookupState(pub Mutex<LookupStateInner>);

impl Deref for LookupState {
    type Target = Mutex<LookupStateInner>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl LookupState {
    pub fn load_from_storage(app_handle: &tauri::AppHandle) -> OpenHomeResult<Self> {
        let inner = LookupStateInner::load_from_storage(app_handle)?;
        Ok(Self(Mutex::new(inner)))
    }
}

#[derive(Default, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LookupStateInner {
    // pub openhome: OhpkmBytesLookup,
    gen_12: IdentifierLookup,
    gen_345: IdentifierLookup,
}

impl LookupStateInner {
    fn load_from_storage(app_handle: &tauri::AppHandle) -> OpenHomeResult<Self> {
        Ok(Self {
            gen_12: util::get_storage_file_json(app_handle, "gen12_lookup.json")?,
            gen_345: util::get_storage_file_json(app_handle, "gen345_lookup.json")?,
        })
    }

    fn update_lookups(
        &mut self,
        app_handle: &tauri::AppHandle,
        gen_12: IdentifierLookup,
        gen_345: IdentifierLookup,
    ) -> OpenHomeResult<()> {
        self.gen_12.extend(gen_12);
        self.gen_345.extend(gen_345);

        util::write_storage_file_json(app_handle, "gen12_lookup.json", &self.gen_12)?;
        util::write_storage_file_json(app_handle, "gen345_lookup.json", &self.gen_345)?;

        app_handle
            .emit("lookups_update", self.clone())
            .map_err(|err| {
                OpenHomeError::other_with_source("Could not emit 'lookups_update' to frontend", err)
            })
    }
}

#[tauri::command]
pub fn get_lookups(
    lookup_state: tauri::State<'_, LookupState>,
) -> OpenHomeResult<LookupStateInner> {
    Ok(lookup_state.lock()?.clone())
}

#[tauri::command]
pub fn update_lookups(
    app_handle: tauri::AppHandle,
    lookup_state: tauri::State<'_, LookupState>,
    gen_12: IdentifierLookup,
    gen_345: IdentifierLookup,
) -> OpenHomeResult<()> {
    println!(
        "updating lookups: {} gen12, {} gen234",
        gen_12.len(),
        gen_345.len()
    );
    lookup_state
        .lock()?
        .update_lookups(&app_handle, gen_12, gen_345)
}
