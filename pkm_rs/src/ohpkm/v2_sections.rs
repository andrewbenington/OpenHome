use crate::gen9_sv;
use crate::ohpkm::v2::OhpkmSectionTag;
use crate::result::{Error, Result, StringErrorSource};
use crate::sectioned_data::DataSection;

use pkm_rs_resources::species::SpeciesAndForm;
use pkm_rs_types::OriginGame;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{FlagSet, TeraType};
use serde::Deserialize;
use serde::Serialize;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

mod gameboy_data;
mod gen45_data;
mod gen67_data;
mod gen8_data;
mod main_data;
mod past_handlers;

pub mod pkm_bytes;

pub(crate) use gameboy_data::GameboyData;
pub(crate) use gen8_data::{BdspData, LegendsArceusData, SwordShieldData};
pub(crate) use gen45_data::Gen45Data;
pub(crate) use gen67_data::Gen67Data;
pub(crate) use main_data::MainDataV2;
pub(crate) use past_handlers::PastHandlerDataV2;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub(crate) fn bytes_are_empty(bytes: &[u8]) -> bool {
    bytes.iter().all(|b| *b == 0)
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct ScarletVioletData {
    pub tera_type_original: TeraType,
    pub tera_type_override: Option<TeraType>,
    pub tm_flags: FlagSet<{ gen9_sv::TM_FLAG_BYTE_LENGTH_BASE }>,
    pub tm_flags_dlc: FlagSet<{ gen9_sv::TM_FLAG_BYTE_LENGTH_DLC }>,
}

impl ScarletVioletData {
    pub fn from_v1(old: super::v1::OhpkmV1) -> Option<Self> {
        let tera_type_original = TeraType::from_byte_original(old.tera_type_original).ok()?;
        let tera_type_override = TeraType::from_byte_override(old.tera_type_override).ok()?;

        if !old.game_of_origin.is_scarlet_violet()
            && tera_type_override.is_none()
            && bytes_are_empty(&old.tm_flags_sv)
            && bytes_are_empty(&old.tm_flags_sv_dlc)
        {
            None
        } else {
            let mut corrected_base_tm_set_raw = [0u8; gen9_sv::TM_FLAG_BYTE_LENGTH_BASE];
            corrected_base_tm_set_raw.copy_from_slice(&old.tm_flags_sv);
            Some(Self {
                tera_type_original,
                tera_type_override,
                tm_flags: FlagSet::from_bytes(corrected_base_tm_set_raw),
                tm_flags_dlc: FlagSet::from_bytes(old.tm_flags_sv_dlc),
            })
        }
    }

    pub fn default_generated_tera_type(species_and_form: SpeciesAndForm) -> Self {
        Self {
            tera_type_original: species_and_form
                .get_forme_metadata()
                .transferred_tera_type(),
            ..Default::default()
        }
    }
}

impl DataSection for ScarletVioletData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::ScarletViolet;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        // try_into() will always succeed thanks to the buffer size check
        let tera_type_original = TeraType::from_byte_original(bytes[0])?;

        Ok(Self {
            tera_type_original,
            tera_type_override: TeraType::from_byte_override(bytes[1])?,
            tm_flags: FlagSet::from_bytes(bytes[2..24].try_into().unwrap()),
            tm_flags_dlc: FlagSet::from_bytes(bytes[24..37].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 37];

        bytes[0] = self.tera_type_original.to_byte();
        bytes[1] = self
            .tera_type_override
            .map_or(TeraType::NO_OVERRIDE, TeraType::to_byte);
        bytes[2..24].copy_from_slice(&self.tm_flags.to_bytes());
        bytes[24..37].copy_from_slice(&self.tm_flags_dlc.to_bytes());

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        self.tera_type_override.is_none()
            && self.tm_flags.is_empty()
            && self.tm_flags_dlc.is_empty()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Clone, Serialize)]
pub struct MostRecentSave {
    pub trainer_id: u16,
    pub secret_id: u16,
    pub game: OriginGame,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub trainer_name: SizedUtf16String<26>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
    pub file_path: String,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
#[allow(clippy::too_many_arguments)]
impl MostRecentSave {
    #[wasm_bindgen(getter)]
    pub fn trainer_name(&self) -> String {
        self.trainer_name.to_string()
    }
}

impl DataSection for MostRecentSave {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::MostRecentSave;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        let trainer_id = u16::from_le_bytes(bytes[0..=1].try_into().unwrap());
        let secret_id = u16::from_le_bytes(bytes[2..=3].try_into().unwrap());
        let game = OriginGame::from(bytes[4]);
        let trainer_name = SizedUtf16String::<26>::from_bytes(bytes[5..=30].try_into().unwrap());

        let file_path =
            String::from_utf8(bytes[31..].to_vec()).map_err(|e| Error::StringDecode {
                source: StringErrorSource::MostRecentSaveFilePath(e),
            })?;

        Ok(Self {
            trainer_id,
            secret_id,
            game,
            trainer_name,
            file_path,
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::new();

        bytes.extend_from_slice(&self.trainer_id.to_le_bytes());
        bytes.extend_from_slice(&self.secret_id.to_le_bytes());
        bytes.push(self.game as u8);
        bytes.extend_from_slice(&self.trainer_name.bytes());
        bytes.extend_from_slice(self.file_path.as_bytes());

        bytes
    }

    fn is_empty(&self) -> bool {
        self.file_path.is_empty()
    }
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Clone, Serialize)]
pub struct PluginData {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub plugin_origin: String,
}

impl PluginData {
    pub fn from_v1(old: super::v1::OhpkmV1) -> Option<Self> {
        if old.plugin_origin.is_empty() {
            None
        } else {
            Some(Self::from_origin(old.plugin_origin.to_string()))
        }
    }

    fn try_from_origin_utf8(origin_bytes: &[u8]) -> Result<Self> {
        String::from_utf8(origin_bytes.to_vec())
            .map(Self::from_origin)
            .map_err(Error::plugin_origin)
    }

    const fn from_origin(plugin_origin: String) -> Self {
        Self { plugin_origin }
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl PluginData {
    #[wasm_bindgen(getter = pluginOrigin)]
    pub fn plugin_origin(&self) -> String {
        self.plugin_origin.clone()
    }

    #[wasm_bindgen(setter = pluginOrigin)]
    pub fn set_plugin_origin(&mut self, value: String) {
        self.plugin_origin = value;
    }
}

impl DataSection for PluginData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::PluginData;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        Self::try_from_origin_utf8(bytes)
    }

    fn is_empty(&self) -> bool {
        false
    }

    fn to_bytes(&self) -> Vec<u8> {
        self.plugin_origin.clone().into_bytes()
    }
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Clone, Serialize)]
pub struct Notes(pub String);

impl DataSection for Notes {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::Notes;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        String::from_utf8(bytes.to_vec())
            .map(Notes)
            .map_err(|e| Error::StringDecode {
                source: StringErrorSource::Notes(e),
            })
    }

    fn to_bytes(&self) -> Vec<u8> {
        self.0.clone().into_bytes()
    }

    fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

/// Custom tags for a Pokemon (label + CSS color string + optional icon)
/// Stored as JSON string
#[derive(Debug, Default, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct MonTag {
    pub label: String,
    pub color: String,
    pub icon: Option<String>,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct MonTags(pub Vec<MonTag>);

impl DataSection for MonTags {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::Tag;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);
        let tags: Vec<MonTag> = serde_json::from_slice(bytes).unwrap_or_default();
        Ok(Self(tags))
    }

    fn to_bytes(&self) -> Vec<u8> {
        serde_json::to_vec(&self.0).unwrap_or_default()
    }

    fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}
