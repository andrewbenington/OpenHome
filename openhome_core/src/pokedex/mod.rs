use crate::Result;
use crate::data_controller::{DataController, DataDir, JsonDataReader};

use std::collections::HashSet;
use std::{collections::HashMap, ops::Deref, sync::Mutex};

use pkm_rs::PluginIdentifier;
use pkm_rs_types::{OriginGame, ShinyLeaves};
use serde::{Deserialize, Deserializer, Serialize, Serializer};

mod storage_format;

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
pub type FormNumber = u16;

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

impl FormEntry {
    pub fn update(&mut self, other: Self) {
        self.level = self.level.max(other.level);
        self.games.extend(other.games);
        self.extra.extend(other.extra);
        self.flags.extend(other.flags);
        self.shiny_leaves.update_from(&other.shiny_leaves);
    }

    #[cfg(test)]
    pub fn from_level(level: PokedexLevel) -> Self {
        Self {
            level,
            ..Default::default()
        }
    }
}

type FormEntries = HashMap<FormNumber, FormEntry>;
#[derive(Default, Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct PokedexEntry {
    // for compatibility with v1.10.* and earlier
    #[serde(alias = "formes", with = "storage_format")]
    forms: FormEntries,
}

impl PokedexEntry {
    fn form_mut(&mut self, form_index: FormNumber) -> &mut FormEntry {
        self.forms.entry(form_index).or_default()
    }

    #[cfg(test)]
    fn form_dex_level(&self, form_index: FormNumber) -> Option<PokedexLevel> {
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

    pub fn update(&mut self, national_dex: DexNumber, form_index: FormNumber, data: FormEntry) {
        self.by_dex_number
            .entry(national_dex)
            .or_default()
            .form_mut(form_index)
            .update(data);
    }

    #[cfg(test)]
    fn form_status(&self, national_dex: DexNumber, form_index: FormNumber) -> Option<PokedexLevel> {
        self.by_dex_number
            .get(&national_dex)?
            .form_dex_level(form_index)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PokedexUpdate {
    pub national_dex: DexNumber,
    pub form_index: FormNumber,
    pub data: FormEntry,
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::{Error, Result, data_controller::MockSingleJsonFile};

    #[test]
    fn serialize_deserialize() -> Result<()> {
        let mut pokedex = Pokedex::default();
        pokedex.update(25, 0, FormEntry::from_level(PokedexLevel::Caught));
        pokedex.update(26, 1, FormEntry::from_level(PokedexLevel::Seen));

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
        pokedex.update(25, 0, FormEntry::from_level(PokedexLevel::Caught));

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
