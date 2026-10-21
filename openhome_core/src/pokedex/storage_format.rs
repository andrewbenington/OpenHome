use super::*;
use serde::de::value::MapAccessDeserializer;
use serde::de::{IntoDeserializer, Visitor};

type FormEntriesStored = HashMap<FormNumber, FormEntryStored>;
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
