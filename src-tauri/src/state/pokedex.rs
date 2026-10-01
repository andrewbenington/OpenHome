use std::collections::HashSet;
use std::{collections::HashMap, ops::Deref, sync::Mutex};

use pkm_rs::PluginIdentifier;
use pkm_rs_types::{OriginGame, ShinyLeaves};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use tauri::Emitter;

use crate::commands::CommandResult;
use openhome_core::Result;
use openhome_core::data_controller::{DataController, DataDir, JsonDataReader};

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

#[derive(
    Debug,
    Default,
    Clone,
    Copy,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Serialize,
    Deserialize,
    strum::EnumString,
    specta::Type,
)]
pub enum PokedexLevel {
    #[default]
    Seen,
    Caught,
    ShinyCaught,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, specta::Type)]
pub enum PokedexFlag {
    Male,
    Female,
    NsPokemon,
    Gigantamax,
    Alpha,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize, specta::Type)]
pub struct FormEntry {
    pub level: PokedexLevel,
    pub games: HashSet<OriginGame>,
    pub extra: HashSet<PluginIdentifier>,
    pub flags: HashSet<PokedexFlag>,
    pub shiny_leaves: ShinyLeaves,
}

type FormEntries = HashMap<FormeNumber, FormEntry>;
#[derive(Default, Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct PokedexEntry {
    // for compatibility with v1.10.* and earlier
    #[serde(alias = "formes", with = "storage_format")]
    forms: FormEntries,
}

impl PokedexEntry {
    fn form_mut(&mut self, form_index: FormeNumber) -> &mut FormEntry {
        self.forms.entry(form_index).or_default()
    }

    #[cfg(test)]
    fn form_dex_level(&self, form_index: FormeNumber) -> Option<PokedexLevel> {
        self.forms.get(&form_index).map(|entry| entry.level)
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone, specta::Type)]
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
        national_dex: DexNumber,
        form_index: FormeNumber,
        dex_level: PokedexLevel,
    ) {
        self.by_dex_number
            .entry(national_dex)
            .or_default()
            .form_mut(form_index)
            .level = dex_level;
    }

    #[cfg(test)]
    fn form_status(
        &self,
        national_dex: DexNumber,
        form_index: FormeNumber,
    ) -> Option<PokedexLevel> {
        self.by_dex_number
            .get(&national_dex)?
            .form_dex_level(form_index)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PokedexUpdate {
    national_dex: DexNumber,
    form_index: FormeNumber,
    status: PokedexLevel,
}

#[tauri::command]
#[specta::specta]
pub fn get_pokedex(pokedex_state: tauri::State<'_, PokedexState>) -> CommandResult<Pokedex> {
    Ok(pokedex_state.lock()?.clone())
}

#[tauri::command]
#[specta::specta]
pub fn update_pokedex(
    app_handle: tauri::AppHandle,
    pokedex_state: tauri::State<'_, PokedexState>,
    updates: Vec<PokedexUpdate>,
) -> CommandResult<()> {
    let mut pokedex = pokedex_state.lock()?;
    for update in updates {
        pokedex.register(update.national_dex, update.form_index, update.status);
    }

    app_handle
        .emit("pokedex_update", pokedex.clone())
        .map_err(|err| format!("Could not emit 'pokedex_update' to frontend: {err}").into())
}

mod storage_format {
    use super::*;
    use serde::de::value::MapAccessDeserializer;
    use serde::de::{IntoDeserializer, Visitor};

    type FormEntriesStored = HashMap<FormeNumber, FormEntryStored>;
    #[derive(Debug, Clone, specta::Type)]
    pub enum FormEntryStored {
        LevelOnly(PokedexLevel),
        Full(FormEntry),
    }

    impl From<FormEntryStored> for FormEntry {
        fn from(value: FormEntryStored) -> Self {
            match value {
                FormEntryStored::LevelOnly(level) => Self {
                    level,
                    ..Default::default()
                },
                FormEntryStored::Full(full_entry) => full_entry,
            }
        }
    }

    impl From<FormEntry> for FormEntryStored {
        fn from(value: FormEntry) -> Self {
            Self::Full(value)
        }
    }

    impl From<&FormEntry> for FormEntryStored {
        fn from(value: &FormEntry) -> Self {
            Self::Full(value.clone())
        }
    }

    impl Default for FormEntryStored {
        fn default() -> Self {
            Self::Full(FormEntry::default())
        }
    }

    pub struct FormEntryVisitor;
    impl<'de> Visitor<'de> for FormEntryVisitor {
        type Value = FormEntryStored;

        fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
            formatter.write_str("a string or a map")
        }

        fn visit_str<E>(self, v: &str) -> core::result::Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            PokedexLevel::deserialize(v.into_deserializer()).map(FormEntryStored::LevelOnly)
        }

        fn visit_map<A>(self, map: A) -> core::result::Result<Self::Value, A::Error>
        where
            A: serde::de::MapAccess<'de>,
        {
            FormEntry::deserialize(MapAccessDeserializer::new(map)).map(FormEntryStored::Full)
        }
    }

    impl Serialize for FormEntryStored {
        fn serialize<S>(&self, serializer: S) -> std::prelude::v1::Result<S::Ok, S::Error>
        where
            S: Serializer,
        {
            match self {
                FormEntryStored::LevelOnly(level) => level.serialize(serializer),
                FormEntryStored::Full(full_entry) => full_entry.serialize(serializer),
            }
        }
    }

    impl<'de> Deserialize<'de> for FormEntryStored {
        fn deserialize<D>(deserializer: D) -> core::result::Result<Self, D::Error>
        where
            D: serde::Deserializer<'de>,
        {
            deserializer.deserialize_any(FormEntryVisitor)
        }
    }

    pub fn serialize<S: Serializer>(
        forms: &FormEntries,
        serializer: S,
    ) -> core::result::Result<S::Ok, S::Error> {
        let stored: FormEntriesStored = forms.iter().map(|(&id, e)| (id, e.into())).collect();
        stored.serialize(serializer)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(
        deserializer: D,
    ) -> core::result::Result<FormEntries, D::Error> {
        Ok(FormEntriesStored::deserialize(deserializer)?
            .into_iter()
            .map(|(id, e)| (id, e.into()))
            .collect())
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use crate::state::{Pokedex, PokedexEntry, PokedexLevel};
    use openhome_core::{Error, Result, data_controller::MockSingleJsonFile};

    #[test]
    fn serialize_deserialize() -> Result<()> {
        let mut pokedex = Pokedex::default();
        pokedex.register(25, 0, PokedexLevel::Caught);
        pokedex.register(26, 1, PokedexLevel::Seen);

        let serialized = serde_json::to_string(&pokedex)
            .map_err(|err| Error::other_with_source("serialize Pokedex", err))?;

        let deserialized: Pokedex = serde_json::from_str(&serialized)
            .map_err(|err| Error::other_with_source("deserialize Pokedex", err))?;

        let pikachu_base_form_status = deserialized
            .form_status(25, 0)
            .expect("pikachu base form is present in pokedex");
        assert_eq!(pikachu_base_form_status, PokedexLevel::Caught);

        let raichu_alolan_form_status = deserialized
            .form_status(26, 1)
            .expect("raichu alolan form is present in pokedex");
        assert_eq!(raichu_alolan_form_status, PokedexLevel::Seen);

        Ok(())
    }

    #[test]
    fn serializes_to_forms() -> Result<()> {
        let mut pokedex = Pokedex::default();
        pokedex.register(25, 0, PokedexLevel::Caught);

        let serialized = serde_json::to_string(&pokedex)
            .map_err(|err| Error::other_with_source("serialize Pokédex", err))?;

        if !serialized.contains("forms") {
            if serialized.contains("formes") {
                Err(Error::other(
                    "expected pokédex to serialize forms field to 'forms', but instead found 'formes'",
                ))
            } else {
                Err(Error::other(
                    "expected pokédex to serialize forms field to 'forms', but 'forms' was not found in output",
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
            .form_dex_level(0)
            .expect("base form present in pokedex");

        assert_eq!(base_form_status, PokedexLevel::Seen);

        Ok(())
    }

    #[test]
    fn entry_deserializes_from_formes() -> Result<()> {
        let pokedex_json = json!({"formes":{"0":"Seen"}});
        let pikachu_entry: PokedexEntry = serde_json::from_value(pokedex_json)
            .map_err(|e| Error::other_with_source("deserialize pokedex entry", e))?;

        let base_form_status = pikachu_entry
            .form_dex_level(0)
            .expect("base form present in pokedex");

        assert_eq!(base_form_status, PokedexLevel::Seen);

        Ok(())
    }

    #[test]
    fn dex_deserializes_from_forms_level_only() -> Result<()> {
        let pokedex_json = json!({"25": {"forms":{"0":"Seen"}}});
        let mock_reader = MockSingleJsonFile::from_value(pokedex_json);
        let pokedex: Pokedex = Pokedex::load_from_storage(&mock_reader)?;

        let pikachu_base_form_status = pokedex
            .form_status(25, 0)
            .expect("pikachu base form is present in pokedex");

        assert_eq!(pikachu_base_form_status, PokedexLevel::Seen);

        Ok(())
    }

    #[test]
    fn dex_deserializes_from_forms_full() -> Result<()> {
        let pokedex_json = json!({"25": {"forms":{"0":"Seen"}}});
        let mock_reader = MockSingleJsonFile::from_value(pokedex_json);
        let pokedex: Pokedex = Pokedex::load_from_storage(&mock_reader)?;

        let pikachu_base_form_status = pokedex
            .form_status(25, 0)
            .expect("pikachu base form is present in pokedex");

        assert_eq!(pikachu_base_form_status, PokedexLevel::Seen);

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

        assert_eq!(pikachu_base_form_status, PokedexLevel::Seen);

        Ok(())
    }
}
