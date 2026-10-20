use crate::ohpkm::v2::OhpkmSectionTag;
use crate::result::{Error, Result, StringErrorSource};
use crate::sectioned_data::DataSection;

use arrayref::array_ref;
use pkm_rs_types::OriginGame;
use pkm_rs_types::strings::SizedUtf16String;
use serde::Deserialize;
use serde::Serialize;

mod gameboy_data;
mod gen45_data;
mod gen67_data;
mod gen8_data;
mod gen9_data;
mod learned_moves;
mod main_data;
mod past_handlers;

pub mod pkm_bytes;

pub(crate) use gameboy_data::GameboyData;
pub(crate) use gen8_data::{LegendsArceusData, SwordShieldData};
pub(crate) use gen9_data::{LegendsZaData, SV_BASE_TM_BYTES_EXCLUDE_UNUSED, ScarletVioletData};
pub(crate) use gen45_data::Gen45Data;
pub(crate) use gen67_data::Gen67Data;
pub(crate) use learned_moves::LearnedMoves;
pub(crate) use main_data::MainDataV2;
pub(crate) use past_handlers::PastHandlerDataV2;

pub use past_handlers::UnknownHandlerSave;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

pub(crate) fn bytes_are_empty(bytes: &[u8]) -> bool {
    bytes.iter().all(|b| *b == 0)
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

        let trainer_id = u16::from_le_bytes(*array_ref![bytes, 0, 2]);
        let secret_id = u16::from_le_bytes(*array_ref![bytes, 2, 2]);
        let game = OriginGame::from(bytes[4]);
        let trainer_name = SizedUtf16String::<26>::from_bytes(*array_ref![bytes, 5, 26]);

        let file_path = String::from_utf8(bytes[31..].to_vec())
            .map_err(StringErrorSource::MostRecentSaveFilePath)?;

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

        Ok(String::from_utf8(bytes.to_vec())
            .map(Notes)
            .map_err(StringErrorSource::from)?)
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
