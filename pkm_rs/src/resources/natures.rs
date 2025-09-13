#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use serde::{Serialize, Serializer};

use crate::{pkm::Error, resources::Stat};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, PartialEq, Eq, Clone, Copy)]
pub struct NatureIndex(u8);

impl NatureIndex {
    pub fn get_metadata(&self) -> Option<&'static NatureMetadata> {
        ALL_NATURES.get(self.0 as usize).copied()
    }

    pub const fn to_byte(self) -> u8 {
        self.0
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl NatureIndex {
    #[cfg(feature = "wasm")]
    #[wasm_bindgen(constructor)]
    pub fn new(val: u8) -> NatureIndex {
        NatureIndex(val)
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(getter)]
    pub fn index(self) -> u8 {
        self.0
    }
}

impl Serialize for NatureIndex {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(match self.get_metadata() {
            None => "<invalid>",
            Some(metadata) => metadata.name,
        })
    }
}

impl TryFrom<u8> for NatureIndex {
    type Error = Error;

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        if value > NATURE_MAX {
            return Err(Error::NatureIndex {
                nature_index: value,
            });
        }
        Ok(Self(value))
    }
}

impl From<NatureIndex> for u8 {
    fn from(val: NatureIndex) -> Self {
        val.0
    }
}

pub struct NatureStatData {
    pub increase: Stat,
    pub decrease: Stat,
}

pub struct NatureMetadata {
    id: u16,
    name: &'static str,
    stats: Option<NatureStatData>,
}

impl NatureMetadata {
    pub fn multiplier_for(&self, stat: Stat) -> f32 {
        match &self.stats {
            None => 1.0,
            Some(stat_changes) => {
                if stat_changes.increase == stat {
                    1.1
                } else if stat_changes.decrease == stat {
                    0.9
                } else {
                    1.0
                }
            }
        }
    }
}

const HARDY: NatureMetadata = NatureMetadata {
    id: 0,
    name: "Hardy",
    stats: None,
};

const LONELY: NatureMetadata = NatureMetadata {
    id: 1,
    name: "Lonely",
    stats: Some(NatureStatData {
        increase: Stat::Attack,
        decrease: Stat::Defense,
    }),
};

const BRAVE: NatureMetadata = NatureMetadata {
    id: 2,
    name: "Brave",
    stats: Some(NatureStatData {
        increase: Stat::Attack,
        decrease: Stat::Speed,
    }),
};

const ADAMANT: NatureMetadata = NatureMetadata {
    id: 3,
    name: "Adamant",
    stats: Some(NatureStatData {
        increase: Stat::Attack,
        decrease: Stat::SpecialAttack,
    }),
};

const NAUGHTY: NatureMetadata = NatureMetadata {
    id: 4,
    name: "Naughty",
    stats: Some(NatureStatData {
        increase: Stat::Attack,
        decrease: Stat::SpecialDefense,
    }),
};

const BOLD: NatureMetadata = NatureMetadata {
    id: 5,
    name: "Bold",
    stats: Some(NatureStatData {
        increase: Stat::Defense,
        decrease: Stat::Attack,
    }),
};

const DOCILE: NatureMetadata = NatureMetadata {
    id: 6,
    name: "Docile",
    stats: None,
};

const RELAXED: NatureMetadata = NatureMetadata {
    id: 7,
    name: "Relaxed",
    stats: Some(NatureStatData {
        increase: Stat::Defense,
        decrease: Stat::Speed,
    }),
};

const IMPISH: NatureMetadata = NatureMetadata {
    id: 8,
    name: "Impish",
    stats: Some(NatureStatData {
        increase: Stat::Defense,
        decrease: Stat::SpecialAttack,
    }),
};

const LAX: NatureMetadata = NatureMetadata {
    id: 9,
    name: "Lax",
    stats: Some(NatureStatData {
        increase: Stat::Defense,
        decrease: Stat::SpecialDefense,
    }),
};

const TIMID: NatureMetadata = NatureMetadata {
    id: 10,
    name: "Timid",
    stats: Some(NatureStatData {
        increase: Stat::Speed,
        decrease: Stat::Attack,
    }),
};

const HASTY: NatureMetadata = NatureMetadata {
    id: 11,
    name: "Hasty",
    stats: Some(NatureStatData {
        increase: Stat::Speed,
        decrease: Stat::Defense,
    }),
};

const SERIOUS: NatureMetadata = NatureMetadata {
    id: 12,
    name: "Serious",
    stats: None,
};

const JOLLY: NatureMetadata = NatureMetadata {
    id: 13,
    name: "Jolly",
    stats: Some(NatureStatData {
        increase: Stat::Speed,
        decrease: Stat::SpecialAttack,
    }),
};

const NAIVE: NatureMetadata = NatureMetadata {
    id: 14,
    name: "Naive",
    stats: Some(NatureStatData {
        increase: Stat::Speed,
        decrease: Stat::SpecialDefense,
    }),
};

const MODEST: NatureMetadata = NatureMetadata {
    id: 15,
    name: "Modest",
    stats: Some(NatureStatData {
        increase: Stat::SpecialAttack,
        decrease: Stat::Attack,
    }),
};

const MILD: NatureMetadata = NatureMetadata {
    id: 16,
    name: "Mild",
    stats: Some(NatureStatData {
        increase: Stat::SpecialAttack,
        decrease: Stat::Defense,
    }),
};

const QUIET: NatureMetadata = NatureMetadata {
    id: 17,
    name: "Quiet",
    stats: Some(NatureStatData {
        increase: Stat::SpecialAttack,
        decrease: Stat::Speed,
    }),
};

const BASHFUL: NatureMetadata = NatureMetadata {
    id: 18,
    name: "Bashful",
    stats: None,
};

const RASH: NatureMetadata = NatureMetadata {
    id: 19,
    name: "Rash",
    stats: Some(NatureStatData {
        increase: Stat::SpecialAttack,
        decrease: Stat::SpecialDefense,
    }),
};

const CALM: NatureMetadata = NatureMetadata {
    id: 20,
    name: "Calm",
    stats: Some(NatureStatData {
        increase: Stat::SpecialDefense,
        decrease: Stat::Attack,
    }),
};

const GENTLE: NatureMetadata = NatureMetadata {
    id: 21,
    name: "Gentle",
    stats: Some(NatureStatData {
        increase: Stat::SpecialDefense,
        decrease: Stat::Defense,
    }),
};

const SASSY: NatureMetadata = NatureMetadata {
    id: 22,
    name: "Sassy",
    stats: Some(NatureStatData {
        increase: Stat::SpecialDefense,
        decrease: Stat::Speed,
    }),
};

const CAREFUL: NatureMetadata = NatureMetadata {
    id: 23,
    name: "Careful",
    stats: Some(NatureStatData {
        increase: Stat::SpecialDefense,
        decrease: Stat::SpecialAttack,
    }),
};

const QUIRKY: NatureMetadata = NatureMetadata {
    id: 24,
    name: "Quirky",
    stats: None,
};

pub const NATURE_MAX: u8 = 24;

const ALL_NATURES: [&NatureMetadata; 25] = [
    &HARDY, &LONELY, &BRAVE, &ADAMANT, &NAUGHTY, &BOLD, &DOCILE, &RELAXED, &IMPISH, &LAX, &TIMID,
    &HASTY, &SERIOUS, &JOLLY, &NAIVE, &MODEST, &MILD, &QUIET, &BASHFUL, &RASH, &CALM, &GENTLE,
    &SASSY, &CAREFUL, &QUIRKY,
];
