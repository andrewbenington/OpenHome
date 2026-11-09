use crate::ohpkm::v2::OhpkmSectionTag;
use crate::result::{Error, Result};
use crate::sectioned_data::DataSection;
use crate::traits::{OhpkmByte, OhpkmBytes};

use pkm_rs_types::TrainerData;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{Gender, OriginGame, TrainerMemory};

use serde::Serialize;
use std::num::NonZeroU16;

#[deprecated(since = "1.10.4", note = "please use `PastHandlerDataV2` instead")]
#[derive(Debug, Default, Serialize, Clone)]
pub struct PastHandlerDataV1 {
    pub id: Option<NonZeroU16>,
    pub secret_id: Option<NonZeroU16>,
    pub name: SizedUtf16String<26>,
    pub friendship: u8,
    pub memory: TrainerMemory,
    pub affection: u8,
    pub gender: Gender,
    pub origin_game: Option<OriginGame>,
    pub origin_plugin: Option<String>,
}

impl PastHandlerDataV1 {
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

impl From<TrainerData> for PastHandlerDataV1 {
    fn from(other: TrainerData) -> Self {
        Self {
            id: NonZeroU16::new(other.id),
            secret_id: NonZeroU16::new(other.secret_id),
            name: other.name,
            gender: other.gender.into(),
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

    fn to_bytes(&self) -> Vec<u8> {
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

        vec
    }

    fn is_empty(&self) -> bool {
        self.name.is_empty()
    }
}
