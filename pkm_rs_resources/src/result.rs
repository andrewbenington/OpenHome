use pkm_rs_types::NationalDex;
use serde::{Serialize, Serializer};
use std::fmt::Display;

use crate::abilities::ABILITY_MAX;
use crate::items::ITEM_MAX;
use crate::natures::NATURE_MAX;
use crate::pkhex_text;
use crate::species::NatDexIndex;

#[derive(Debug, Clone)]
pub enum Error {
    PkmRsTypes(pkm_rs_types::Error),
    NationalDex {
        national_dex: u16,
    },
    FormIndex {
        national_dex: NatDexIndex,
        form_index: u16,
    },
    NatureIndex {
        nature_index: u8,
    },
    AbilityIndex {
        ability_index: u16,
    },
    ItemIndex {
        item_index: u16,
    },
    TeraType {
        value: u8,
        is_override: bool,
    },
}

impl Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let message = match self {
            Self::PkmRsTypes(err) => err.to_string(),
            Self::NationalDex { national_dex } => format!(
                "Invalid National Dex number {national_dex} (must be between 1 and {})",
                NationalDex::MAX
            ),
            Self::FormIndex {
                national_dex,
                form_index,
            } => {
                let species_metadata = national_dex.get_species_metadata();
                format!(
                    "Invalid form index {form_index} for Pokémon {} (must be <= {})",
                    pkhex_text::species_name_en(*national_dex),
                    species_metadata.forms.len()
                )
            }
            Self::NatureIndex { nature_index } => {
                format!("Invalid nature index {nature_index} (must be between 1 and {NATURE_MAX})")
            }
            Self::AbilityIndex { ability_index } => format!(
                "Invalid ability index {ability_index} (must be between 1 and {ABILITY_MAX})"
            ),
            Self::ItemIndex { item_index } => {
                format!("Invalid item index {item_index} (must be between 1 and {ITEM_MAX})")
            }
            Self::TeraType { value, is_override } => match is_override {
                false => format!("Invalid original tera type value: {value}"),
                true => format!("Invalid override tera type value: {value}"),
            },
        };

        f.write_str(&message)
    }
}

impl std::error::Error for Error {}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<Error> for String {
    fn from(value: Error) -> Self {
        value.to_string()
    }
}

impl From<pkm_rs_types::Error> for Error {
    fn from(value: pkm_rs_types::Error) -> Self {
        Self::PkmRsTypes(value)
    }
}

pub type Result<T> = core::result::Result<T, Error>;
