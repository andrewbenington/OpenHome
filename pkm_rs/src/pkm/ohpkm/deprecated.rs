use crate::pkm::ohpkm::sectioned_data::DataSection;
use crate::pkm::ohpkm::{OhpkmSectionTag, OhpkmV1};
use crate::pkm::traits::{OhpkmByte, OhpkmBytes};
use crate::pkm::{Error, Result};

use pkm_rs_types::TrainerData;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{Gender, OriginGame, TrainerMemory};

use serde::Serialize;
use std::num::NonZeroU16;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[deprecated(since = "1.10.4", note = "please use `PastHandlerDataV2` instead")]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone)]
pub struct PastHandlerDataV1 {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub id: Option<NonZeroU16>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub secret_id: Option<NonZeroU16>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub name: SizedUtf16String<26>,
    pub friendship: u8,
    pub memory: TrainerMemory,
    pub affection: u8,
    pub gender: Gender,
    pub origin_game: Option<OriginGame>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
    pub origin_plugin: Option<String>,
}

impl PastHandlerDataV1 {
    pub fn from_v1(old: OhpkmV1) -> Option<Self> {
        if !old.handler_name.is_empty() {
            Some(PastHandlerDataV1 {
                id: NonZeroU16::new(old.handler_id),
                secret_id: None,
                name: old.handler_name,
                friendship: old.handler_friendship,
                memory: old.handler_memory,
                affection: old.handler_affection,
                gender: Gender::from(old.handler_gender),
                origin_game: None,
                origin_plugin: None,
            })
        } else {
            None
        }
    }

    #[cfg(feature = "wasm")]
    pub fn known_trainer_data_matches(
        &self,
        tid: u16,
        sid: u16,
        game: OriginGame,
        plugin: &Option<String>,
    ) -> bool {
        self.id.is_some_and(|t| t.get() == tid)
            && self.secret_id.is_some_and(|s| s.get() == sid)
            && self.origin_game.is_some_and(|g| g == game)
            && self.origin_plugin == *plugin
    }

    #[cfg(feature = "wasm")]
    pub fn unknown_trainer_data_matches(
        &self,
        name: &SizedUtf16String<26>,
        gender: Gender,
    ) -> bool {
        self.gender == gender && self.name == *name && self.origin_game.is_none()
    }

    #[cfg(feature = "wasm")]
    pub fn update_from(&mut self, other: &TrainerData, plugin: Option<String>) {
        self.id = NonZeroU16::new(other.id);
        self.secret_id = NonZeroU16::new(other.secret_id);
        self.friendship = other.friendship;
        self.memory = other.memory;
        self.affection = other.affection;
        self.origin_game = other.origin_game;
        self.origin_plugin = plugin;
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
#[allow(clippy::too_many_arguments)]
impl PastHandlerDataV1 {
    #[wasm_bindgen(getter)]
    pub fn id(&self) -> Option<u16> {
        self.id.map(NonZeroU16::get)
    }

    #[wasm_bindgen(setter)]
    pub fn set_id(&mut self, value: u16) {
        self.id = NonZeroU16::new(value)
    }

    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        self.name.to_string()
    }

    #[wasm_bindgen(getter = secretId)]
    pub fn secret_id(&self) -> u16 {
        self.secret_id.map(NonZeroU16::get).unwrap_or(0)
    }

    #[wasm_bindgen(setter = secretId)]
    pub fn set_secret_id(&mut self, value: u16) {
        self.secret_id = NonZeroU16::new(value)
    }

    #[wasm_bindgen(constructor)]
    pub fn new(
        id: Option<u16>,
        secret_id: Option<u16>,
        name: String,
        friendship: u8,
        memory: Option<TrainerMemory>,
        affection: u8,
        gender: Gender,
        origin_game: Option<OriginGame>,
        origin_plugin: Option<String>,
    ) -> Self {
        Self {
            id: id.and_then(NonZeroU16::new),
            secret_id: secret_id.and_then(NonZeroU16::new),
            name: name.into(),
            friendship,
            memory: memory.unwrap_or_default(),
            affection,
            gender,
            origin_game,
            origin_plugin,
        }
    }
}

impl From<TrainerData> for PastHandlerDataV1 {
    fn from(other: TrainerData) -> Self {
        Self {
            id: NonZeroU16::new(other.id),
            secret_id: NonZeroU16::new(other.secret_id),
            name: other.name,
            gender: other.gender,
            friendship: other.friendship,
            memory: other.memory,
            affection: other.affection,
            origin_game: other.origin_game,
            origin_plugin: None,
        }
    }
}

impl DataSection for PastHandlerDataV1 {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::PastHandlerV1;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let origin_plugin = if bytes.len() > OhpkmSectionTag::PastHandlerV1.min_size() {
            String::from_utf8(bytes[OhpkmSectionTag::PastHandlerV1.min_size()..].to_vec()).ok()
        } else {
            None
        };

        Ok(Self {
            id: Option::<NonZeroU16>::from_ohpkm_bytes(bytes[0..=1].try_into().unwrap()),
            secret_id: Option::<NonZeroU16>::from_ohpkm_bytes(bytes[2..=3].try_into().unwrap()),
            name: SizedUtf16String::<26>::from_bytes(bytes[4..=29].try_into().unwrap()),
            friendship: bytes[30],
            memory: TrainerMemory::from_bytes_in_order(bytes[31..=35].try_into().unwrap()),
            affection: bytes[36],
            gender: Gender::from_u8(bytes[37]),
            origin_game: Option::<OriginGame>::from_ohpkm_byte(bytes[38]),
            origin_plugin,
        })
    }

    fn to_bytes(&self) -> Result<Vec<u8>> {
        let mut bytes = [0u8; 39];

        bytes[0..=1].copy_from_slice(&self.id.to_ohpkm_bytes());
        bytes[2..=3].copy_from_slice(&self.secret_id.to_ohpkm_bytes());
        bytes[4..=29].copy_from_slice(&self.name.bytes());
        bytes[30] = self.friendship;
        bytes[31..=35].copy_from_slice(&self.memory.to_bytes_in_order());
        bytes[36] = self.affection;
        bytes[37] = self.gender.to_byte();
        bytes[38] = self.origin_game.to_ohpkm_byte();

        let mut vec = bytes.to_vec();

        if let Some(origin_plugin) = &self.origin_plugin {
            vec.extend_from_slice(origin_plugin.as_bytes());
        }

        Ok(vec)
    }

    fn is_empty(&self) -> bool {
        self.name.is_empty()
    }
}
