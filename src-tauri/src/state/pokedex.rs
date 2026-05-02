use std::{cmp::max, collections::HashMap, ops::Deref, sync::Mutex};

use serde::{Deserialize, Serialize};
use tauri::Emitter;

use crate::data_controller::{DataController, DataDir, JsonDataReader};
use crate::error::{Error, Result};

const POKEDEX_FILENAME: &str = "pokedex.json";

#[derive(Default, Debug, Serialize)]
pub struct PokedexState(pub Mutex<Pokedex>);

impl PokedexState {
    pub fn load_from_storage(data_controller: &impl DataController) -> Result<Self> {
        let inner = Pokedex::load_from_storage(data_controller)?;
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
    // for compatibility with v1.10.*; for v1.12.0 the only macro should be #[serde(alias = "formes")]
    #[serde(rename = "formes")]
    #[serde(alias = "forms")]
    forms: HashMap<FormeNumber, PokedexStatus>,
}

impl PokedexEntry {
    pub fn register(&mut self, form_index: FormeNumber, status: PokedexStatus) {
        self.forms
            .entry(form_index)
            .and_modify(|prev| *prev = max(*prev, status))
            .or_insert(status);
    }

    #[cfg(test)]
    fn form_status(&self, form_index: FormeNumber) -> Option<PokedexStatus> {
        self.forms.get(&form_index).copied()
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Pokedex {
    by_dex_number: HashMap<DexNumber, PokedexEntry>,
}

impl Pokedex {
    fn load_from_storage(data_reader: &impl JsonDataReader) -> Result<Self> {
        Ok(Self {
            by_dex_number: data_reader.read_file_json(DataDir::Storage, POKEDEX_FILENAME)?,
        })
    }

    pub fn write_to_storage(&self, data_controller: &impl DataController) -> Result<()> {
        data_controller.write_file_json(DataDir::Storage, POKEDEX_FILENAME, &self.by_dex_number)
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

    #[cfg(test)]
    fn form_status(&self, dex_number: DexNumber, form_index: FormeNumber) -> Option<PokedexStatus> {
        self.by_dex_number.get(&dex_number)?.form_status(form_index)
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

#[cfg(test)]
mod test {
    use serde_json::json;

    use crate::data_controller::MockSingleJsonFile;
    use crate::error::{Error, Result};
    use crate::state::{Pokedex, PokedexEntry, PokedexStatus};

    #[test]
    fn serialize_deserialize() -> Result<()> {
        let mut pokedex = Pokedex::default();
        pokedex.register(25, 0, PokedexStatus::Caught);
        pokedex.register(26, 1, PokedexStatus::Seen);

        let serialized = serde_json::to_string(&pokedex)
            .map_err(|err| Error::other_with_source("serialize Pokedex", err))?;
        let deserialized: Pokedex = serde_json::from_str(&serialized)
            .map_err(|err| Error::other_with_source("deserialize Pokedex", err))?;

        let pikachu_base_form_status = deserialized
            .form_status(25, 0)
            .expect("pikachu base form is present in pokedex");
        assert_eq!(pikachu_base_form_status, PokedexStatus::Caught);

        let raichu_alolan_form_status = deserialized
            .form_status(26, 1)
            .expect("raichu alolan form is present in pokedex");
        assert_eq!(raichu_alolan_form_status, PokedexStatus::Seen);

        Ok(())
    }

    #[test]
    fn serializes_to_formes() -> Result<()> {
        let mut pokedex = Pokedex::default();
        pokedex.register(25, 0, PokedexStatus::Caught);

        let serialized = serde_json::to_string(&pokedex)
            .map_err(|err| Error::other_with_source("serialize Pokedex", err))?;

        if !serialized.contains("formes") {
            if serialized.contains("forms") {
                Err(Error::other(
                    "expected pokédex to serialize forms field to 'formes', but instead found 'forms'",
                ))
            } else {
                Err(Error::other(
                    "expected pokédex to serialize forms field to 'formes', but 'formes' was not found in output",
                ))
            }
        } else {
            Ok(())
        }
    }

    #[test]
    fn entry_deserializes_from_forms() -> Result<()> {
        let pokedex_json = json!({"forms":{"0":"Seen"}});
        let pikachu_entry: PokedexEntry = serde_json::from_value(pokedex_json)
            .map_err(|e| Error::other_with_source("deserialize pokedex entry", e))?;

        let base_form_status = pikachu_entry
            .form_status(0)
            .expect("base form present in pokedex");

        assert_eq!(base_form_status, PokedexStatus::Seen);

        Ok(())
    }

    #[test]
    fn entry_deserializes_from_formes() -> Result<()> {
        let pokedex_json = json!({"formes":{"0":"Seen"}});
        let pikachu_entry: PokedexEntry = serde_json::from_value(pokedex_json)
            .map_err(|e| Error::other_with_source("deserialize pokedex entry", e))?;

        let base_form_status = pikachu_entry
            .form_status(0)
            .expect("base form present in pokedex");

        assert_eq!(base_form_status, PokedexStatus::Seen);

        Ok(())
    }

    #[test]
    fn dex_deserializes_from_forms() -> Result<()> {
        let pokedex_json = json!({"25": {"forms":{"0":"Seen"}}});
        let mock_reader = MockSingleJsonFile::from_value(pokedex_json);
        let pokedex: Pokedex = Pokedex::load_from_storage(&mock_reader)?;

        let pikachu_base_form_status = pokedex
            .form_status(25, 0)
            .expect("pikachu base form is present in pokedex");

        assert_eq!(pikachu_base_form_status, PokedexStatus::Seen);

        Ok(())
    }

    #[test]
    fn dex_deserializes_from_formes() -> Result<()> {
        let pokedex_json = json!({"25": {"formes":{"0":"Seen"}}});
        let mock_reader = MockSingleJsonFile::from_value(pokedex_json);
        let pokedex: Pokedex = Pokedex::load_from_storage(&mock_reader)?;

        let pikachu_base_form_status = pokedex
            .form_status(25, 0)
            .expect("pikachu base form is present in pokedex");

        assert_eq!(pikachu_base_form_status, PokedexStatus::Seen);

        Ok(())
    }
}
