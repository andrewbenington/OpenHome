use std::{cmp::max, collections::HashMap, ops::Deref, sync::Mutex};

use serde::{Deserialize, Serialize};
use tauri::Emitter;

use crate::data_controller::{DataController, DataDir};
use crate::error::{Error, Result};

const POKEDEX_FILENAME: &str = "pokedex.json";

#[derive(Default, Debug, Serialize)]
pub struct PokedexState(pub Mutex<Pokedex>);

impl PokedexState {
    pub fn load_from_storage(app_handle: &tauri::AppHandle) -> Result<Self> {
        let inner = Pokedex::load_from_storage(app_handle)?;
        Ok(Self(Mutex::new(inner)))
    }
}

impl Deref for PokedexState {
    type Target = Mutex<Pokedex>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

pub type DexNumber = u16;
pub type FormeNumber = u16;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum PokedexStatus {
    Seen,
    Caught,
    ShinyCaught,
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct PokedexEntry {
    #[serde(rename = "formes", alias = "forms")]
    forms: HashMap<FormeNumber, PokedexStatus>,
}

impl PokedexEntry {
    pub fn register(&mut self, form_index: FormeNumber, status: PokedexStatus) {
        self.forms
            .entry(form_index)
            .and_modify(|prev| *prev = max(*prev, status))
            .or_insert(status);
    }
}

#[derive(Default, Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Pokedex {
    by_dex_number: HashMap<DexNumber, PokedexEntry>,
}

impl Pokedex {
    fn load_from_storage(app_handle: &tauri::AppHandle) -> Result<Self> {
        Ok(Self {
            by_dex_number: app_handle.read_file_json(DataDir::Storage, POKEDEX_FILENAME)?,
        })
    }

    pub fn write_to_storage(&self, app_handle: &tauri::AppHandle) -> Result<()> {
        app_handle.write_file_json(DataDir::Storage, POKEDEX_FILENAME, &self.by_dex_number)
    }

    pub fn register(
        &mut self,
        dex_number: DexNumber,
        form_index: FormeNumber,
        status: PokedexStatus,
    ) {
        self.by_dex_number
            .entry(dex_number)
            .or_default()
            .register(form_index, status);
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PokedexUpdate {
    dex_number: DexNumber,
    form_index: FormeNumber,
    status: PokedexStatus,
}

#[tauri::command]
pub fn get_pokedex(pokedex_state: tauri::State<'_, PokedexState>) -> Result<Pokedex> {
    Ok(pokedex_state.lock()?.clone())
}

#[tauri::command]
pub fn update_pokedex(
    app_handle: tauri::AppHandle,
    pokedex_state: tauri::State<'_, PokedexState>,
    updates: Vec<PokedexUpdate>,
) -> Result<()> {
    let mut pokedex = pokedex_state.lock()?;
    for update in updates {
        pokedex.register(update.dex_number, update.form_index, update.status);
    }

    app_handle
        .emit("pokedex_update", pokedex.clone())
        .map_err(|err| Error::other_with_source("Could not emit 'pokedex_update' to frontend", err))
}
