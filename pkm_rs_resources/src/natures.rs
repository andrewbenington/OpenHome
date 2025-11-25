#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use serde::{Serialize, Serializer};

use crate::{Error, stats::Stat};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, PartialEq, Eq, Clone, Copy)]
pub struct NatureIndex(u8);

impl NatureIndex {
    pub fn get_metadata(&self) -> &'static NatureMetadata {
        ALL_NATURES
            .get(self.0 as usize)
            .expect("NatureIndex should never have an invalid index")
    }

    pub fn to_byte(&self) -> u8 {
        self.0
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl NatureIndex {
    //! IMPORTANT: DO NOT ADD NON-BORROWING SELF METHODS
    //! (JavaScript will be copying this value and consuming
    //! methods could result in use-after-free)

    #[cfg_attr(feature = "wasm", wasm_bindgen(constructor))]
    pub fn new_js(val: u8) -> Result<NatureIndex, JsValue> {
        // log("creating new");
        if val > NATURE_MAX {
            Err(format!("Invalid nature index: {val}").into())
        } else {
            Ok(NatureIndex(val))
        }
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "newFromPid"))]
    pub fn new_from_pid(val: u32) -> NatureIndex {
        Self((val % (NATURE_COUNT as u32)) as u8)
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn index(&self) -> u8 {
        // log("getting index rust");
        self.0
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn summary(&self) -> String {
        if let Some(stats) = &self.get_metadata().stats {
            format!("+{}, -{}", stats.increase.abbr(), stats.decrease.abbr())
        } else {
            String::new()
        }
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn stats(&self) -> Option<NatureStatData> {
        self.get_metadata().stats
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "multiplierFor"))]
    pub fn multiplier_for(&self, stat: Stat) -> f32 {
        self.get_metadata().multiplier_for(stat)
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn name(&self) -> String {
        self.get_metadata().name.to_owned()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen)]
    pub fn copy(&self) -> NatureIndex {
        NatureIndex(self.0)
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen)]
    pub fn equals(&self, other: &NatureIndex) -> bool {
        self.0 == other.index()
    }
}

impl Serialize for NatureIndex {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.get_metadata().name)
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

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy)]
pub struct NatureStatData {
    pub increase: Stat,
    pub decrease: Stat,
}

pub struct NatureMetadata {
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
    name: "Hardy",
    stats: None,
};

const LONELY: NatureMetadata = NatureMetadata {
    name: "Lonely",
    stats: Some(NatureStatData {
        increase: Stat::Attack,
        decrease: Stat::Defense,
    }),
};

const BRAVE: NatureMetadata = NatureMetadata {
    name: "Brave",
    stats: Some(NatureStatData {
        increase: Stat::Attack,
        decrease: Stat::Speed,
    }),
};

const ADAMANT: NatureMetadata = NatureMetadata {
    name: "Adamant",
    stats: Some(NatureStatData {
        increase: Stat::Attack,
        decrease: Stat::SpecialAttack,
    }),
};

const NAUGHTY: NatureMetadata = NatureMetadata {
    name: "Naughty",
    stats: Some(NatureStatData {
        increase: Stat::Attack,
        decrease: Stat::SpecialDefense,
    }),
};

const BOLD: NatureMetadata = NatureMetadata {
    name: "Bold",
    stats: Some(NatureStatData {
        increase: Stat::Defense,
        decrease: Stat::Attack,
    }),
};

const DOCILE: NatureMetadata = NatureMetadata {
    name: "Docile",
    stats: None,
};

const RELAXED: NatureMetadata = NatureMetadata {
    name: "Relaxed",
    stats: Some(NatureStatData {
        increase: Stat::Defense,
        decrease: Stat::Speed,
    }),
};

const IMPISH: NatureMetadata = NatureMetadata {
    name: "Impish",
    stats: Some(NatureStatData {
        increase: Stat::Defense,
        decrease: Stat::SpecialAttack,
    }),
};

const LAX: NatureMetadata = NatureMetadata {
    name: "Lax",
    stats: Some(NatureStatData {
        increase: Stat::Defense,
        decrease: Stat::SpecialDefense,
    }),
};

const TIMID: NatureMetadata = NatureMetadata {
    name: "Timid",
    stats: Some(NatureStatData {
        increase: Stat::Speed,
        decrease: Stat::Attack,
    }),
};

const HASTY: NatureMetadata = NatureMetadata {
    name: "Hasty",
    stats: Some(NatureStatData {
        increase: Stat::Speed,
        decrease: Stat::Defense,
    }),
};

const SERIOUS: NatureMetadata = NatureMetadata {
    name: "Serious",
    stats: None,
};

const JOLLY: NatureMetadata = NatureMetadata {
    name: "Jolly",
    stats: Some(NatureStatData {
        increase: Stat::Speed,
        decrease: Stat::SpecialAttack,
    }),
};

const NAIVE: NatureMetadata = NatureMetadata {
    name: "Naive",
    stats: Some(NatureStatData {
        increase: Stat::Speed,
        decrease: Stat::SpecialDefense,
    }),
};

const MODEST: NatureMetadata = NatureMetadata {
    name: "Modest",
    stats: Some(NatureStatData {
        increase: Stat::SpecialAttack,
        decrease: Stat::Attack,
    }),
};

const MILD: NatureMetadata = NatureMetadata {
    name: "Mild",
    stats: Some(NatureStatData {
        increase: Stat::SpecialAttack,
        decrease: Stat::Defense,
    }),
};

const QUIET: NatureMetadata = NatureMetadata {
    name: "Quiet",
    stats: Some(NatureStatData {
        increase: Stat::SpecialAttack,
        decrease: Stat::Speed,
    }),
};

const BASHFUL: NatureMetadata = NatureMetadata {
    name: "Bashful",
    stats: None,
};

const RASH: NatureMetadata = NatureMetadata {
    name: "Rash",
    stats: Some(NatureStatData {
        increase: Stat::SpecialAttack,
        decrease: Stat::SpecialDefense,
    }),
};

const CALM: NatureMetadata = NatureMetadata {
    name: "Calm",
    stats: Some(NatureStatData {
        increase: Stat::SpecialDefense,
        decrease: Stat::Attack,
    }),
};

const GENTLE: NatureMetadata = NatureMetadata {
    name: "Gentle",
    stats: Some(NatureStatData {
        increase: Stat::SpecialDefense,
        decrease: Stat::Defense,
    }),
};

const SASSY: NatureMetadata = NatureMetadata {
    name: "Sassy",
    stats: Some(NatureStatData {
        increase: Stat::SpecialDefense,
        decrease: Stat::Speed,
    }),
};

const CAREFUL: NatureMetadata = NatureMetadata {
    name: "Careful",
    stats: Some(NatureStatData {
        increase: Stat::SpecialDefense,
        decrease: Stat::SpecialAttack,
    }),
};

const QUIRKY: NatureMetadata = NatureMetadata {
    name: "Quirky",
    stats: None,
};

pub const NATURE_MAX: u8 = 24;
pub const NATURE_COUNT: u8 = NATURE_MAX + 1;

const ALL_NATURES: [&NatureMetadata; 25] = [
    &HARDY, &LONELY, &BRAVE, &ADAMANT, &NAUGHTY, &BOLD, &DOCILE, &RELAXED, &IMPISH, &LAX, &TIMID,
    &HASTY, &SERIOUS, &JOLLY, &NAIVE, &MODEST, &MILD, &QUIET, &BASHFUL, &RASH, &CALM, &GENTLE,
    &SASSY, &CAREFUL, &QUIRKY,
];
