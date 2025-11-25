use std::fmt::Debug;
use std::num::NonZeroU16;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use serde::{Serialize, Serializer};

use crate::{Error, Result};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct AbilityIndex(NonZeroU16);

impl AbilityIndex {
    pub fn new(index: u16) -> Option<AbilityIndex> {
        if (index as usize) > ALL_ABILITIES.len() {
            return None;
        }
        NonZeroU16::new(index).map(AbilityIndex)
    }

    /// # Safety
    ///
    /// - `index` must be greater than zero and at most the maximum ability index supported by this version of the library.
    pub const unsafe fn new_unchecked(index: u16) -> AbilityIndex {
        unsafe { AbilityIndex(NonZeroU16::new_unchecked(index)) }
    }

    pub const fn get(&self) -> u16 {
        self.0.get()
    }

    pub const fn get_metadata(&self) -> &AbilityMetadata {
        ALL_ABILITIES[(self.get() - 1) as usize]
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.get().to_le_bytes()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl AbilityIndex {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = fromIndex))]
    pub fn from_index(val: u16) -> Option<AbilityIndex> {
        AbilityIndex::new(val)
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn index(&self) -> u16 {
        self.get()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn name(&self) -> String {
        self.get_metadata().name.to_owned()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen)]
    pub fn equals(&self, other: &AbilityIndex) -> bool {
        self.0 == other.0
    }
}

impl Default for AbilityIndex {
    fn default() -> Self {
        Self(unsafe { NonZeroU16::new_unchecked(1) })
    }
}

impl Serialize for AbilityIndex {
    fn serialize<S>(&self, serializer: S) -> core::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.get_metadata().name)
    }
}

impl TryFrom<u8> for AbilityIndex {
    type Error = Error;

    fn try_from(value: u8) -> core::result::Result<Self, Self::Error> {
        if (value as usize) > ABILITY_MAX {
            return Err(Error::AbilityIndex {
                ability_index: value as u16,
            });
        }

        NonZeroU16::new(value as u16)
            .map(AbilityIndex)
            .ok_or(Error::AbilityIndex {
                ability_index: value as u16,
            })
    }
}

impl From<AbilityIndex> for u8 {
    fn from(val: AbilityIndex) -> Self {
        val.get() as u8
    }
}

impl TryFrom<u16> for AbilityIndex {
    type Error = Error;

    fn try_from(value: u16) -> Result<Self> {
        if (value as usize) > ABILITY_MAX {
            return Err(Error::AbilityIndex {
                ability_index: value,
            });
        }

        NonZeroU16::new(value)
            .map(AbilityIndex)
            .ok_or(Error::AbilityIndex {
                ability_index: value,
            })
    }
}

impl From<AbilityIndex> for u16 {
    fn from(val: AbilityIndex) -> Self {
        val.get()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Clone, Copy)]
pub struct AbilityMetadata {
    pub id: usize,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub name: &'static str,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl AbilityMetadata {
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn name(&self) -> String {
        self.name.to_owned()
    }
}

pub const ABILITY_MAX: usize = 310;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getAllAbilities"))]
#[allow(clippy::missing_const_for_fn)]
pub fn get_all_abilities() -> Vec<AbilityMetadata> {
    ALL_ABILITIES.into_iter().copied().collect()
}

pub static ALL_ABILITIES: [&AbilityMetadata; ABILITY_MAX] = [
&AbilityMetadata {
    id: 1,
    name: "Stench",
},
&AbilityMetadata {
    id: 2,
    name: "Drizzle",
},
&AbilityMetadata {
    id: 3,
    name: "Speed Boost",
},
&AbilityMetadata {
    id: 4,
    name: "Battle Armor",
},
&AbilityMetadata {
    id: 5,
    name: "Sturdy",
},
&AbilityMetadata {
    id: 6,
    name: "Damp",
},
&AbilityMetadata {
    id: 7,
    name: "Limber",
},
&AbilityMetadata {
    id: 8,
    name: "Sand Veil",
},
&AbilityMetadata {
    id: 9,
    name: "Static",
},
&AbilityMetadata {
    id: 10,
    name: "Volt Absorb",
},
&AbilityMetadata {
    id: 11,
    name: "Water Absorb",
},
&AbilityMetadata {
    id: 12,
    name: "Oblivious",
},
&AbilityMetadata {
    id: 13,
    name: "Cloud Nine",
},
&AbilityMetadata {
    id: 14,
    name: "Compound Eyes",
},
&AbilityMetadata {
    id: 15,
    name: "Insomnia",
},
&AbilityMetadata {
    id: 16,
    name: "Color Change",
},
&AbilityMetadata {
    id: 17,
    name: "Immunity",
},
&AbilityMetadata {
    id: 18,
    name: "Flash Fire",
},
&AbilityMetadata {
    id: 19,
    name: "Shield Dust",
},
&AbilityMetadata {
    id: 20,
    name: "Own Tempo",
},
&AbilityMetadata {
    id: 21,
    name: "Suction Cups",
},
&AbilityMetadata {
    id: 22,
    name: "Intimidate",
},
&AbilityMetadata {
    id: 23,
    name: "Shadow Tag",
},
&AbilityMetadata {
    id: 24,
    name: "Rough Skin",
},
&AbilityMetadata {
    id: 25,
    name: "Wonder Guard",
},
&AbilityMetadata {
    id: 26,
    name: "Levitate",
},
&AbilityMetadata {
    id: 27,
    name: "Effect Spore",
},
&AbilityMetadata {
    id: 28,
    name: "Synchronize",
},
&AbilityMetadata {
    id: 29,
    name: "Clear Body",
},
&AbilityMetadata {
    id: 30,
    name: "Natural Cure",
},
&AbilityMetadata {
    id: 31,
    name: "Lightning Rod",
},
&AbilityMetadata {
    id: 32,
    name: "Serene Grace",
},
&AbilityMetadata {
    id: 33,
    name: "Swift Swim",
},
&AbilityMetadata {
    id: 34,
    name: "Chlorophyll",
},
&AbilityMetadata {
    id: 35,
    name: "Illuminate",
},
&AbilityMetadata {
    id: 36,
    name: "Trace",
},
&AbilityMetadata {
    id: 37,
    name: "Huge Power",
},
&AbilityMetadata {
    id: 38,
    name: "Poison Point",
},
&AbilityMetadata {
    id: 39,
    name: "Inner Focus",
},
&AbilityMetadata {
    id: 40,
    name: "Magma Armor",
},
&AbilityMetadata {
    id: 41,
    name: "Water Veil",
},
&AbilityMetadata {
    id: 42,
    name: "Magnet Pull",
},
&AbilityMetadata {
    id: 43,
    name: "Soundproof",
},
&AbilityMetadata {
    id: 44,
    name: "Rain Dish",
},
&AbilityMetadata {
    id: 45,
    name: "Sand Stream",
},
&AbilityMetadata {
    id: 46,
    name: "Pressure",
},
&AbilityMetadata {
    id: 47,
    name: "Thick Fat",
},
&AbilityMetadata {
    id: 48,
    name: "Early Bird",
},
&AbilityMetadata {
    id: 49,
    name: "Flame Body",
},
&AbilityMetadata {
    id: 50,
    name: "Run Away",
},
&AbilityMetadata {
    id: 51,
    name: "Keen Eye",
},
&AbilityMetadata {
    id: 52,
    name: "Hyper Cutter",
},
&AbilityMetadata {
    id: 53,
    name: "Pickup",
},
&AbilityMetadata {
    id: 54,
    name: "Truant",
},
&AbilityMetadata {
    id: 55,
    name: "Hustle",
},
&AbilityMetadata {
    id: 56,
    name: "Cute Charm",
},
&AbilityMetadata {
    id: 57,
    name: "Plus",
},
&AbilityMetadata {
    id: 58,
    name: "Minus",
},
&AbilityMetadata {
    id: 59,
    name: "Forecast",
},
&AbilityMetadata {
    id: 60,
    name: "Sticky Hold",
},
&AbilityMetadata {
    id: 61,
    name: "Shed Skin",
},
&AbilityMetadata {
    id: 62,
    name: "Guts",
},
&AbilityMetadata {
    id: 63,
    name: "Marvel Scale",
},
&AbilityMetadata {
    id: 64,
    name: "Liquid Ooze",
},
&AbilityMetadata {
    id: 65,
    name: "Overgrow",
},
&AbilityMetadata {
    id: 66,
    name: "Blaze",
},
&AbilityMetadata {
    id: 67,
    name: "Torrent",
},
&AbilityMetadata {
    id: 68,
    name: "Swarm",
},
&AbilityMetadata {
    id: 69,
    name: "Rock Head",
},
&AbilityMetadata {
    id: 70,
    name: "Drought",
},
&AbilityMetadata {
    id: 71,
    name: "Arena Trap",
},
&AbilityMetadata {
    id: 72,
    name: "Vital Spirit",
},
&AbilityMetadata {
    id: 73,
    name: "White Smoke",
},
&AbilityMetadata {
    id: 74,
    name: "Pure Power",
},
&AbilityMetadata {
    id: 75,
    name: "Shell Armor",
},
&AbilityMetadata {
    id: 76,
    name: "Air Lock",
},
&AbilityMetadata {
    id: 77,
    name: "Tangled Feet",
},
&AbilityMetadata {
    id: 78,
    name: "Motor Drive",
},
&AbilityMetadata {
    id: 79,
    name: "Rivalry",
},
&AbilityMetadata {
    id: 80,
    name: "Steadfast",
},
&AbilityMetadata {
    id: 81,
    name: "Snow Cloak",
},
&AbilityMetadata {
    id: 82,
    name: "Gluttony",
},
&AbilityMetadata {
    id: 83,
    name: "Anger Point",
},
&AbilityMetadata {
    id: 84,
    name: "Unburden",
},
&AbilityMetadata {
    id: 85,
    name: "Heatproof",
},
&AbilityMetadata {
    id: 86,
    name: "Simple",
},
&AbilityMetadata {
    id: 87,
    name: "Dry Skin",
},
&AbilityMetadata {
    id: 88,
    name: "Download",
},
&AbilityMetadata {
    id: 89,
    name: "Iron Fist",
},
&AbilityMetadata {
    id: 90,
    name: "Poison Heal",
},
&AbilityMetadata {
    id: 91,
    name: "Adaptability",
},
&AbilityMetadata {
    id: 92,
    name: "Skill Link",
},
&AbilityMetadata {
    id: 93,
    name: "Hydration",
},
&AbilityMetadata {
    id: 94,
    name: "Solar Power",
},
&AbilityMetadata {
    id: 95,
    name: "Quick Feet",
},
&AbilityMetadata {
    id: 96,
    name: "Normalize",
},
&AbilityMetadata {
    id: 97,
    name: "Sniper",
},
&AbilityMetadata {
    id: 98,
    name: "Magic Guard",
},
&AbilityMetadata {
    id: 99,
    name: "No Guard",
},
&AbilityMetadata {
    id: 100,
    name: "Stall",
},
&AbilityMetadata {
    id: 101,
    name: "Technician",
},
&AbilityMetadata {
    id: 102,
    name: "Leaf Guard",
},
&AbilityMetadata {
    id: 103,
    name: "Klutz",
},
&AbilityMetadata {
    id: 104,
    name: "Mold Breaker",
},
&AbilityMetadata {
    id: 105,
    name: "Super Luck",
},
&AbilityMetadata {
    id: 106,
    name: "Aftermath",
},
&AbilityMetadata {
    id: 107,
    name: "Anticipation",
},
&AbilityMetadata {
    id: 108,
    name: "Forewarn",
},
&AbilityMetadata {
    id: 109,
    name: "Unaware",
},
&AbilityMetadata {
    id: 110,
    name: "Tinted Lens",
},
&AbilityMetadata {
    id: 111,
    name: "Filter",
},
&AbilityMetadata {
    id: 112,
    name: "Slow Start",
},
&AbilityMetadata {
    id: 113,
    name: "Scrappy",
},
&AbilityMetadata {
    id: 114,
    name: "Storm Drain",
},
&AbilityMetadata {
    id: 115,
    name: "Ice Body",
},
&AbilityMetadata {
    id: 116,
    name: "Solid Rock",
},
&AbilityMetadata {
    id: 117,
    name: "Snow Warning",
},
&AbilityMetadata {
    id: 118,
    name: "Honey Gather",
},
&AbilityMetadata {
    id: 119,
    name: "Frisk",
},
&AbilityMetadata {
    id: 120,
    name: "Reckless",
},
&AbilityMetadata {
    id: 121,
    name: "Multitype",
},
&AbilityMetadata {
    id: 122,
    name: "Flower Gift",
},
&AbilityMetadata {
    id: 123,
    name: "Bad Dreams",
},
&AbilityMetadata {
    id: 124,
    name: "Pickpocket",
},
&AbilityMetadata {
    id: 125,
    name: "Sheer Force",
},
&AbilityMetadata {
    id: 126,
    name: "Contrary",
},
&AbilityMetadata {
    id: 127,
    name: "Unnerve",
},
&AbilityMetadata {
    id: 128,
    name: "Defiant",
},
&AbilityMetadata {
    id: 129,
    name: "Defeatist",
},
&AbilityMetadata {
    id: 130,
    name: "Cursed Body",
},
&AbilityMetadata {
    id: 131,
    name: "Healer",
},
&AbilityMetadata {
    id: 132,
    name: "Friend Guard",
},
&AbilityMetadata {
    id: 133,
    name: "Weak Armor",
},
&AbilityMetadata {
    id: 134,
    name: "Heavy Metal",
},
&AbilityMetadata {
    id: 135,
    name: "Light Metal",
},
&AbilityMetadata {
    id: 136,
    name: "Multiscale",
},
&AbilityMetadata {
    id: 137,
    name: "Toxic Boost",
},
&AbilityMetadata {
    id: 138,
    name: "Flare Boost",
},
&AbilityMetadata {
    id: 139,
    name: "Harvest",
},
&AbilityMetadata {
    id: 140,
    name: "Telepathy",
},
&AbilityMetadata {
    id: 141,
    name: "Moody",
},
&AbilityMetadata {
    id: 142,
    name: "Overcoat",
},
&AbilityMetadata {
    id: 143,
    name: "Poison Touch",
},
&AbilityMetadata {
    id: 144,
    name: "Regenerator",
},
&AbilityMetadata {
    id: 145,
    name: "Big Pecks",
},
&AbilityMetadata {
    id: 146,
    name: "Sand Rush",
},
&AbilityMetadata {
    id: 147,
    name: "Wonder Skin",
},
&AbilityMetadata {
    id: 148,
    name: "Analytic",
},
&AbilityMetadata {
    id: 149,
    name: "Illusion",
},
&AbilityMetadata {
    id: 150,
    name: "Imposter",
},
&AbilityMetadata {
    id: 151,
    name: "Infiltrator",
},
&AbilityMetadata {
    id: 152,
    name: "Mummy",
},
&AbilityMetadata {
    id: 153,
    name: "Moxie",
},
&AbilityMetadata {
    id: 154,
    name: "Justified",
},
&AbilityMetadata {
    id: 155,
    name: "Rattled",
},
&AbilityMetadata {
    id: 156,
    name: "Magic Bounce",
},
&AbilityMetadata {
    id: 157,
    name: "Sap Sipper",
},
&AbilityMetadata {
    id: 158,
    name: "Prankster",
},
&AbilityMetadata {
    id: 159,
    name: "Sand Force",
},
&AbilityMetadata {
    id: 160,
    name: "Iron Barbs",
},
&AbilityMetadata {
    id: 161,
    name: "Zen Mode",
},
&AbilityMetadata {
    id: 162,
    name: "Victory Star",
},
&AbilityMetadata {
    id: 163,
    name: "Turboblaze",
},
&AbilityMetadata {
    id: 164,
    name: "Teravolt",
},
&AbilityMetadata {
    id: 165,
    name: "Aroma Veil",
},
&AbilityMetadata {
    id: 166,
    name: "Flower Veil",
},
&AbilityMetadata {
    id: 167,
    name: "Cheek Pouch",
},
&AbilityMetadata {
    id: 168,
    name: "Protean",
},
&AbilityMetadata {
    id: 169,
    name: "Fur Coat",
},
&AbilityMetadata {
    id: 170,
    name: "Magician",
},
&AbilityMetadata {
    id: 171,
    name: "Bulletproof",
},
&AbilityMetadata {
    id: 172,
    name: "Competitive",
},
&AbilityMetadata {
    id: 173,
    name: "Strong Jaw",
},
&AbilityMetadata {
    id: 174,
    name: "Refrigerate",
},
&AbilityMetadata {
    id: 175,
    name: "Sweet Veil",
},
&AbilityMetadata {
    id: 176,
    name: "Stance Change",
},
&AbilityMetadata {
    id: 177,
    name: "Gale Wings",
},
&AbilityMetadata {
    id: 178,
    name: "Mega Launcher",
},
&AbilityMetadata {
    id: 179,
    name: "Grass Pelt",
},
&AbilityMetadata {
    id: 180,
    name: "Symbiosis",
},
&AbilityMetadata {
    id: 181,
    name: "Tough Claws",
},
&AbilityMetadata {
    id: 182,
    name: "Pixilate",
},
&AbilityMetadata {
    id: 183,
    name: "Gooey",
},
&AbilityMetadata {
    id: 184,
    name: "Aerilate",
},
&AbilityMetadata {
    id: 185,
    name: "Parental Bond",
},
&AbilityMetadata {
    id: 186,
    name: "Dark Aura",
},
&AbilityMetadata {
    id: 187,
    name: "Fairy Aura",
},
&AbilityMetadata {
    id: 188,
    name: "Aura Break",
},
&AbilityMetadata {
    id: 189,
    name: "Primordial Sea",
},
&AbilityMetadata {
    id: 190,
    name: "Desolate Land",
},
&AbilityMetadata {
    id: 191,
    name: "Delta Stream",
},
&AbilityMetadata {
    id: 192,
    name: "Stamina",
},
&AbilityMetadata {
    id: 193,
    name: "Wimp Out",
},
&AbilityMetadata {
    id: 194,
    name: "Emergency Exit",
},
&AbilityMetadata {
    id: 195,
    name: "Water Compaction",
},
&AbilityMetadata {
    id: 196,
    name: "Merciless",
},
&AbilityMetadata {
    id: 197,
    name: "Shields Down",
},
&AbilityMetadata {
    id: 198,
    name: "Stakeout",
},
&AbilityMetadata {
    id: 199,
    name: "Water Bubble",
},
&AbilityMetadata {
    id: 200,
    name: "Steelworker",
},
&AbilityMetadata {
    id: 201,
    name: "Berserk",
},
&AbilityMetadata {
    id: 202,
    name: "Slush Rush",
},
&AbilityMetadata {
    id: 203,
    name: "Long Reach",
},
&AbilityMetadata {
    id: 204,
    name: "Liquid Voice",
},
&AbilityMetadata {
    id: 205,
    name: "Triage",
},
&AbilityMetadata {
    id: 206,
    name: "Galvanize",
},
&AbilityMetadata {
    id: 207,
    name: "Surge Surfer",
},
&AbilityMetadata {
    id: 208,
    name: "Schooling",
},
&AbilityMetadata {
    id: 209,
    name: "Disguise",
},
&AbilityMetadata {
    id: 210,
    name: "Battle Bond",
},
&AbilityMetadata {
    id: 211,
    name: "Power Construct",
},
&AbilityMetadata {
    id: 212,
    name: "Corrosion",
},
&AbilityMetadata {
    id: 213,
    name: "Comatose",
},
&AbilityMetadata {
    id: 214,
    name: "Queenly Majesty",
},
&AbilityMetadata {
    id: 215,
    name: "Innards Out",
},
&AbilityMetadata {
    id: 216,
    name: "Dancer",
},
&AbilityMetadata {
    id: 217,
    name: "Battery",
},
&AbilityMetadata {
    id: 218,
    name: "Fluffy",
},
&AbilityMetadata {
    id: 219,
    name: "Dazzling",
},
&AbilityMetadata {
    id: 220,
    name: "Soul-Heart",
},
&AbilityMetadata {
    id: 221,
    name: "Tangling Hair",
},
&AbilityMetadata {
    id: 222,
    name: "Receiver",
},
&AbilityMetadata {
    id: 223,
    name: "Power of Alchemy",
},
&AbilityMetadata {
    id: 224,
    name: "Beast Boost",
},
&AbilityMetadata {
    id: 225,
    name: "RKS System",
},
&AbilityMetadata {
    id: 226,
    name: "Electric Surge",
},
&AbilityMetadata {
    id: 227,
    name: "Psychic Surge",
},
&AbilityMetadata {
    id: 228,
    name: "Misty Surge",
},
&AbilityMetadata {
    id: 229,
    name: "Grassy Surge",
},
&AbilityMetadata {
    id: 230,
    name: "Full Metal Body",
},
&AbilityMetadata {
    id: 231,
    name: "Shadow Shield",
},
&AbilityMetadata {
    id: 232,
    name: "Prism Armor",
},
&AbilityMetadata {
    id: 233,
    name: "Neuroforce",
},
&AbilityMetadata {
    id: 234,
    name: "Intrepid Sword",
},
&AbilityMetadata {
    id: 235,
    name: "Dauntless Shield",
},
&AbilityMetadata {
    id: 236,
    name: "Libero",
},
&AbilityMetadata {
    id: 237,
    name: "Ball Fetch",
},
&AbilityMetadata {
    id: 238,
    name: "Cotton Down",
},
&AbilityMetadata {
    id: 239,
    name: "Propeller Tail",
},
&AbilityMetadata {
    id: 240,
    name: "Mirror Armor",
},
&AbilityMetadata {
    id: 241,
    name: "Gulp Missile",
},
&AbilityMetadata {
    id: 242,
    name: "Stalwart",
},
&AbilityMetadata {
    id: 243,
    name: "Steam Engine",
},
&AbilityMetadata {
    id: 244,
    name: "Punk Rock",
},
&AbilityMetadata {
    id: 245,
    name: "Sand Spit",
},
&AbilityMetadata {
    id: 246,
    name: "Ice Scales",
},
&AbilityMetadata {
    id: 247,
    name: "Ripen",
},
&AbilityMetadata {
    id: 248,
    name: "Ice Face",
},
&AbilityMetadata {
    id: 249,
    name: "Power Spot",
},
&AbilityMetadata {
    id: 250,
    name: "Mimicry",
},
&AbilityMetadata {
    id: 251,
    name: "Screen Cleaner",
},
&AbilityMetadata {
    id: 252,
    name: "Steely Spirit",
},
&AbilityMetadata {
    id: 253,
    name: "Perish Body",
},
&AbilityMetadata {
    id: 254,
    name: "Wandering Spirit",
},
&AbilityMetadata {
    id: 255,
    name: "Gorilla Tactics",
},
&AbilityMetadata {
    id: 256,
    name: "Neutralizing Gas",
},
&AbilityMetadata {
    id: 257,
    name: "Pastel Veil",
},
&AbilityMetadata {
    id: 258,
    name: "Hunger Switch",
},
&AbilityMetadata {
    id: 259,
    name: "Quick Draw",
},
&AbilityMetadata {
    id: 260,
    name: "Unseen Fist",
},
&AbilityMetadata {
    id: 261,
    name: "Curious Medicine",
},
&AbilityMetadata {
    id: 262,
    name: "Transistor",
},
&AbilityMetadata {
    id: 263,
    name: "Dragon’s Maw",
},
&AbilityMetadata {
    id: 264,
    name: "Chilling Neigh",
},
&AbilityMetadata {
    id: 265,
    name: "Grim Neigh",
},
&AbilityMetadata {
    id: 266,
    name: "As One",
},
&AbilityMetadata {
    id: 267,
    name: "As One",
},
&AbilityMetadata {
    id: 268,
    name: "Lingering Aroma",
},
&AbilityMetadata {
    id: 269,
    name: "Seed Sower",
},
&AbilityMetadata {
    id: 270,
    name: "Thermal Exchange",
},
&AbilityMetadata {
    id: 271,
    name: "Anger Shell",
},
&AbilityMetadata {
    id: 272,
    name: "Purifying Salt",
},
&AbilityMetadata {
    id: 273,
    name: "Well-Baked Body",
},
&AbilityMetadata {
    id: 274,
    name: "Wind Rider",
},
&AbilityMetadata {
    id: 275,
    name: "Guard Dog",
},
&AbilityMetadata {
    id: 276,
    name: "Rocky Payload",
},
&AbilityMetadata {
    id: 277,
    name: "Wind Power",
},
&AbilityMetadata {
    id: 278,
    name: "Zero to Hero",
},
&AbilityMetadata {
    id: 279,
    name: "Commander",
},
&AbilityMetadata {
    id: 280,
    name: "Electromorphosis",
},
&AbilityMetadata {
    id: 281,
    name: "Protosynthesis",
},
&AbilityMetadata {
    id: 282,
    name: "Quark Drive",
},
&AbilityMetadata {
    id: 283,
    name: "Good as Gold",
},
&AbilityMetadata {
    id: 284,
    name: "Vessel of Ruin",
},
&AbilityMetadata {
    id: 285,
    name: "Sword of Ruin",
},
&AbilityMetadata {
    id: 286,
    name: "Tablets of Ruin",
},
&AbilityMetadata {
    id: 287,
    name: "Beads of Ruin",
},
&AbilityMetadata {
    id: 288,
    name: "Orichalcum Pulse",
},
&AbilityMetadata {
    id: 289,
    name: "Hadron Engine",
},
&AbilityMetadata {
    id: 290,
    name: "Opportunist",
},
&AbilityMetadata {
    id: 291,
    name: "Cud Chew",
},
&AbilityMetadata {
    id: 292,
    name: "Sharpness",
},
&AbilityMetadata {
    id: 293,
    name: "Supreme Overlord",
},
&AbilityMetadata {
    id: 294,
    name: "Costar",
},
&AbilityMetadata {
    id: 295,
    name: "Toxic Debris",
},
&AbilityMetadata {
    id: 296,
    name: "Armor Tail",
},
&AbilityMetadata {
    id: 297,
    name: "Earth Eater",
},
&AbilityMetadata {
    id: 298,
    name: "Mycelium Might",
},
&AbilityMetadata {
    id: 299,
    name: "Hospitality",
},
&AbilityMetadata {
    id: 300,
    name: "Mind’s Eye",
},
&AbilityMetadata {
    id: 301,
    name: "Embody Aspect",
},
&AbilityMetadata {
    id: 302,
    name: "Embody Aspect",
},
&AbilityMetadata {
    id: 303,
    name: "Embody Aspect",
},
&AbilityMetadata {
    id: 304,
    name: "Embody Aspect",
},
&AbilityMetadata {
    id: 305,
    name: "Toxic Chain",
},
&AbilityMetadata {
    id: 306,
    name: "Supersweet Syrup",
},
&AbilityMetadata {
    id: 307,
    name: "Tera Shift",
},
&AbilityMetadata {
    id: 308,
    name: "Tera Shell",
},
&AbilityMetadata {
    id: 309,
    name: "Teraform Zero",
},
&AbilityMetadata {
    id: 310,
    name: "Poison Puppeteer",
}];