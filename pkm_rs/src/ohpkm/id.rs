use std::{fmt::Display, str::FromStr};

use arrayref::array_refs;
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_types::NationalDex;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, specta::Type)]
pub struct OpenHomeId {
    national_dex: u16,
    trainer_id: u16,
    secret_id: u16,
    personality_value: u32,
}

impl OpenHomeId {
    pub fn new(
        national_dex: NationalDex,
        trainer_id: u16,
        secret_id: u16,
        personality_value: u32,
    ) -> Self {
        let base_evolution = SpeciesForm::base_form(national_dex).get_base_evolution();
        Self {
            national_dex: base_evolution.get_ndex() as u16,
            trainer_id,
            secret_id,
            personality_value,
        }
    }

    /// Fails if any of the internal components are 0
    pub fn try_from_bytes(bytes: &[u8; 10]) -> Option<Self> {
        let (ndex_bytes, tid_bytes, sid_bytes, pid_bytes) = array_refs![bytes, 2, 2, 2, 4];

        let national_dex = NationalDex::from_le_bytes(*ndex_bytes).ok()? as u16;
        let trainer_id = u16::from_le_bytes(*tid_bytes);
        let secret_id = u16::from_le_bytes(*sid_bytes);
        let personality_value = u32::from_le_bytes(*pid_bytes);

        if trainer_id == 0 || secret_id == 0 || personality_value == 0 {
            None
        } else {
            Some(Self {
                national_dex,
                trainer_id,
                secret_id,
                personality_value,
            })
        }
    }

    pub fn to_bytes(self) -> [u8; 10] {
        let mut bytes = [0u8; 10];
        bytes[0..2].copy_from_slice(&self.national_dex.to_le_bytes());
        bytes[2..4].copy_from_slice(&self.trainer_id.to_le_bytes());
        bytes[4..6].copy_from_slice(&self.secret_id.to_le_bytes());
        bytes[6..10].copy_from_slice(&self.personality_value.to_le_bytes());

        bytes
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl OpenHomeId {
    #[wasm_bindgen(constructor)]
    pub fn new_wasm(
        national_dex: NationalDex,
        trainer_id: u16,
        secret_id: u16,
        personality_value: u32,
    ) -> Self {
        Self {
            national_dex: national_dex as u16,
            trainer_id,
            secret_id,
            personality_value,
        }
    }

    #[wasm_bindgen(js_name = toString)]
    pub fn to_string_wasm(&self) -> String {
        self.to_string()
    }
}

impl Display for OpenHomeId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{:04}-{:04x}{:04x}-{:08x}",
            self.national_dex, self.trainer_id, self.secret_id, self.personality_value,
        )
    }
}

impl Default for OpenHomeId {
    fn default() -> Self {
        Self {
            national_dex: NationalDex::default() as u16,
            trainer_id: Default::default(),
            secret_id: Default::default(),
            personality_value: Default::default(),
        }
    }
}

#[derive(Debug)]
pub enum ParseOpenHomeIdError {
    InvalidFormat,
}

impl Display for ParseOpenHomeIdError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "invalid OpenHomeId format")
    }
}

impl std::error::Error for ParseOpenHomeIdError {}

impl FromStr for OpenHomeId {
    type Err = ParseOpenHomeIdError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let parts: Vec<&str> = s.split('-').collect();
        if parts.len() < 3 {
            return Err(ParseOpenHomeIdError::InvalidFormat);
        }

        let national_dex = parts[0]
            .parse::<u16>()
            .map(national_dex_base_evo)
            .map_err(|_| ParseOpenHomeIdError::InvalidFormat)?;

        // middle segment is trainer_id (4 hex chars) + secret_id (4 hex chars)
        if parts[1].len() < 8 {
            return Err(ParseOpenHomeIdError::InvalidFormat);
        }
        let trainer_id = u16::from_str_radix(&parts[1][0..4], 16)
            .map_err(|_| ParseOpenHomeIdError::InvalidFormat)?;
        let secret_id = u16::from_str_radix(&parts[1][4..8], 16)
            .map_err(|_| ParseOpenHomeIdError::InvalidFormat)?;

        let personality_value =
            u32::from_str_radix(parts[2], 16).map_err(|_| ParseOpenHomeIdError::InvalidFormat)?;

        Ok(OpenHomeId {
            national_dex,
            trainer_id,
            secret_id,
            personality_value,
        })
    }
}

fn national_dex_base_evo(raw: u16) -> u16 {
    if let Ok(national_dex) = NationalDex::try_from(raw) {
        SpeciesForm::base_form(national_dex)
            .get_base_evolution()
            .get_ndex() as u16
    } else {
        raw
    }
}

impl serde::Serialize for OpenHomeId {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.to_string().serialize(serializer)
    }
}

impl<'de> serde::Deserialize<'de> for OpenHomeId {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        s.parse::<OpenHomeId>().map_err(serde::de::Error::custom)
    }
}
