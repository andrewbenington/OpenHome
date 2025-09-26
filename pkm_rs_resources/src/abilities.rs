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
    #[cfg(feature = "wasm")]
    #[wasm_bindgen]
    pub fn new_js(val: u16) -> Option<AbilityIndex> {
        AbilityIndex::new(val)
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(getter)]
    pub fn index(self) -> u16 {
        self.get()
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

pub struct AbilityMetadata {
    name: &'static str,
}

pub const ABILITY_MAX: usize = 310;

pub static ALL_ABILITIES: [&AbilityMetadata; ABILITY_MAX] = [
    &AbilityMetadata { name: "Stench" },
    &AbilityMetadata { name: "Drizzle" },
    &AbilityMetadata {
        name: "Speed Boost",
    },
    &AbilityMetadata {
        name: "Battle Armor",
    },
    &AbilityMetadata { name: "Sturdy" },
    &AbilityMetadata { name: "Damp" },
    &AbilityMetadata { name: "Limber" },
    &AbilityMetadata { name: "Sand Veil" },
    &AbilityMetadata { name: "Static" },
    &AbilityMetadata {
        name: "Volt Absorb",
    },
    &AbilityMetadata {
        name: "Water Absorb",
    },
    &AbilityMetadata { name: "Oblivious" },
    &AbilityMetadata { name: "Cloud Nine" },
    &AbilityMetadata {
        name: "Compound Eyes",
    },
    &AbilityMetadata { name: "Insomnia" },
    &AbilityMetadata {
        name: "Color Change",
    },
    &AbilityMetadata { name: "Immunity" },
    &AbilityMetadata { name: "Flash Fire" },
    &AbilityMetadata {
        name: "Shield Dust",
    },
    &AbilityMetadata { name: "Own Tempo" },
    &AbilityMetadata {
        name: "Suction Cups",
    },
    &AbilityMetadata { name: "Intimidate" },
    &AbilityMetadata { name: "Shadow Tag" },
    &AbilityMetadata { name: "Rough Skin" },
    &AbilityMetadata {
        name: "Wonder Guard",
    },
    &AbilityMetadata { name: "Levitate" },
    &AbilityMetadata {
        name: "Effect Spore",
    },
    &AbilityMetadata {
        name: "Synchronize",
    },
    &AbilityMetadata { name: "Clear Body" },
    &AbilityMetadata {
        name: "Natural Cure",
    },
    &AbilityMetadata {
        name: "Lightning Rod",
    },
    &AbilityMetadata {
        name: "Serene Grace",
    },
    &AbilityMetadata { name: "Swift Swim" },
    &AbilityMetadata {
        name: "Chlorophyll",
    },
    &AbilityMetadata { name: "Illuminate" },
    &AbilityMetadata { name: "Trace" },
    &AbilityMetadata { name: "Huge Power" },
    &AbilityMetadata {
        name: "Poison Point",
    },
    &AbilityMetadata {
        name: "Inner Focus",
    },
    &AbilityMetadata {
        name: "Magma Armor",
    },
    &AbilityMetadata { name: "Water Veil" },
    &AbilityMetadata {
        name: "Magnet Pull",
    },
    &AbilityMetadata { name: "Soundproof" },
    &AbilityMetadata { name: "Rain Dish" },
    &AbilityMetadata {
        name: "Sand Stream",
    },
    &AbilityMetadata { name: "Pressure" },
    &AbilityMetadata { name: "Thick Fat" },
    &AbilityMetadata { name: "Early Bird" },
    &AbilityMetadata { name: "Flame Body" },
    &AbilityMetadata { name: "Run Away" },
    &AbilityMetadata { name: "Keen Eye" },
    &AbilityMetadata {
        name: "Hyper Cutter",
    },
    &AbilityMetadata { name: "Pickup" },
    &AbilityMetadata { name: "Truant" },
    &AbilityMetadata { name: "Hustle" },
    &AbilityMetadata { name: "Cute Charm" },
    &AbilityMetadata { name: "Plus" },
    &AbilityMetadata { name: "Minus" },
    &AbilityMetadata { name: "Forecast" },
    &AbilityMetadata {
        name: "Sticky Hold",
    },
    &AbilityMetadata { name: "Shed Skin" },
    &AbilityMetadata { name: "Guts" },
    &AbilityMetadata {
        name: "Marvel Scale",
    },
    &AbilityMetadata {
        name: "Liquid Ooze",
    },
    &AbilityMetadata { name: "Overgrow" },
    &AbilityMetadata { name: "Blaze" },
    &AbilityMetadata { name: "Torrent" },
    &AbilityMetadata { name: "Swarm" },
    &AbilityMetadata { name: "Rock Head" },
    &AbilityMetadata { name: "Drought" },
    &AbilityMetadata { name: "Arena Trap" },
    &AbilityMetadata {
        name: "Vital Spirit",
    },
    &AbilityMetadata {
        name: "White Smoke",
    },
    &AbilityMetadata { name: "Pure Power" },
    &AbilityMetadata {
        name: "Shell Armor",
    },
    &AbilityMetadata { name: "Air Lock" },
    &AbilityMetadata {
        name: "Tangled Feet",
    },
    &AbilityMetadata {
        name: "Motor Drive",
    },
    &AbilityMetadata { name: "Rivalry" },
    &AbilityMetadata { name: "Steadfast" },
    &AbilityMetadata { name: "Snow Cloak" },
    &AbilityMetadata { name: "Gluttony" },
    &AbilityMetadata {
        name: "Anger Point",
    },
    &AbilityMetadata { name: "Unburden" },
    &AbilityMetadata { name: "Heatproof" },
    &AbilityMetadata { name: "Simple" },
    &AbilityMetadata { name: "Dry Skin" },
    &AbilityMetadata { name: "Download" },
    &AbilityMetadata { name: "Iron Fist" },
    &AbilityMetadata {
        name: "Poison Heal",
    },
    &AbilityMetadata {
        name: "Adaptability",
    },
    &AbilityMetadata { name: "Skill Link" },
    &AbilityMetadata { name: "Hydration" },
    &AbilityMetadata {
        name: "Solar Power",
    },
    &AbilityMetadata { name: "Quick Feet" },
    &AbilityMetadata { name: "Normalize" },
    &AbilityMetadata { name: "Sniper" },
    &AbilityMetadata {
        name: "Magic Guard",
    },
    &AbilityMetadata { name: "No Guard" },
    &AbilityMetadata { name: "Stall" },
    &AbilityMetadata { name: "Technician" },
    &AbilityMetadata { name: "Leaf Guard" },
    &AbilityMetadata { name: "Klutz" },
    &AbilityMetadata {
        name: "Mold Breaker",
    },
    &AbilityMetadata { name: "Super Luck" },
    &AbilityMetadata { name: "Aftermath" },
    &AbilityMetadata {
        name: "Anticipation",
    },
    &AbilityMetadata { name: "Forewarn" },
    &AbilityMetadata { name: "Unaware" },
    &AbilityMetadata {
        name: "Tinted Lens",
    },
    &AbilityMetadata { name: "Filter" },
    &AbilityMetadata { name: "Slow Start" },
    &AbilityMetadata { name: "Scrappy" },
    &AbilityMetadata {
        name: "Storm Drain",
    },
    &AbilityMetadata { name: "Ice Body" },
    &AbilityMetadata { name: "Solid Rock" },
    &AbilityMetadata {
        name: "Snow Warning",
    },
    &AbilityMetadata {
        name: "Honey Gather",
    },
    &AbilityMetadata { name: "Frisk" },
    &AbilityMetadata { name: "Reckless" },
    &AbilityMetadata { name: "Multitype" },
    &AbilityMetadata {
        name: "Flower Gift",
    },
    &AbilityMetadata { name: "Bad Dreams" },
    &AbilityMetadata { name: "Pickpocket" },
    &AbilityMetadata {
        name: "Sheer Force",
    },
    &AbilityMetadata { name: "Contrary" },
    &AbilityMetadata { name: "Unnerve" },
    &AbilityMetadata { name: "Defiant" },
    &AbilityMetadata { name: "Defeatist" },
    &AbilityMetadata {
        name: "Cursed Body",
    },
    &AbilityMetadata { name: "Healer" },
    &AbilityMetadata {
        name: "Friend Guard",
    },
    &AbilityMetadata { name: "Weak Armor" },
    &AbilityMetadata {
        name: "Heavy Metal",
    },
    &AbilityMetadata {
        name: "Light Metal",
    },
    &AbilityMetadata { name: "Multiscale" },
    &AbilityMetadata {
        name: "Toxic Boost",
    },
    &AbilityMetadata {
        name: "Flare Boost",
    },
    &AbilityMetadata { name: "Harvest" },
    &AbilityMetadata { name: "Telepathy" },
    &AbilityMetadata { name: "Moody" },
    &AbilityMetadata { name: "Overcoat" },
    &AbilityMetadata {
        name: "Poison Touch",
    },
    &AbilityMetadata {
        name: "Regenerator",
    },
    &AbilityMetadata { name: "Big Pecks" },
    &AbilityMetadata { name: "Sand Rush" },
    &AbilityMetadata {
        name: "Wonder Skin",
    },
    &AbilityMetadata { name: "Analytic" },
    &AbilityMetadata { name: "Illusion" },
    &AbilityMetadata { name: "Imposter" },
    &AbilityMetadata {
        name: "Infiltrator",
    },
    &AbilityMetadata { name: "Mummy" },
    &AbilityMetadata { name: "Moxie" },
    &AbilityMetadata { name: "Justified" },
    &AbilityMetadata { name: "Rattled" },
    &AbilityMetadata {
        name: "Magic Bounce",
    },
    &AbilityMetadata { name: "Sap Sipper" },
    &AbilityMetadata { name: "Prankster" },
    &AbilityMetadata { name: "Sand Force" },
    &AbilityMetadata { name: "Iron Barbs" },
    &AbilityMetadata { name: "Zen Mode" },
    &AbilityMetadata {
        name: "Victory Star",
    },
    &AbilityMetadata { name: "Turboblaze" },
    &AbilityMetadata { name: "Teravolt" },
    &AbilityMetadata { name: "Aroma Veil" },
    &AbilityMetadata {
        name: "Flower Veil",
    },
    &AbilityMetadata {
        name: "Cheek Pouch",
    },
    &AbilityMetadata { name: "Protean" },
    &AbilityMetadata { name: "Fur Coat" },
    &AbilityMetadata { name: "Magician" },
    &AbilityMetadata {
        name: "Bulletproof",
    },
    &AbilityMetadata {
        name: "Competitive",
    },
    &AbilityMetadata { name: "Strong Jaw" },
    &AbilityMetadata {
        name: "Refrigerate",
    },
    &AbilityMetadata { name: "Sweet Veil" },
    &AbilityMetadata {
        name: "Stance Change",
    },
    &AbilityMetadata { name: "Gale Wings" },
    &AbilityMetadata {
        name: "Mega Launcher",
    },
    &AbilityMetadata { name: "Grass Pelt" },
    &AbilityMetadata { name: "Symbiosis" },
    &AbilityMetadata {
        name: "Tough Claws",
    },
    &AbilityMetadata { name: "Pixilate" },
    &AbilityMetadata { name: "Gooey" },
    &AbilityMetadata { name: "Aerilate" },
    &AbilityMetadata {
        name: "Parental Bond",
    },
    &AbilityMetadata { name: "Dark Aura" },
    &AbilityMetadata { name: "Fairy Aura" },
    &AbilityMetadata { name: "Aura Break" },
    &AbilityMetadata {
        name: "Primordial Sea",
    },
    &AbilityMetadata {
        name: "Desolate Land",
    },
    &AbilityMetadata {
        name: "Delta Stream",
    },
    &AbilityMetadata { name: "Stamina" },
    &AbilityMetadata { name: "Wimp Out" },
    &AbilityMetadata {
        name: "Emergency Exit",
    },
    &AbilityMetadata {
        name: "Water Compaction",
    },
    &AbilityMetadata { name: "Merciless" },
    &AbilityMetadata {
        name: "Shields Down",
    },
    &AbilityMetadata { name: "Stakeout" },
    &AbilityMetadata {
        name: "Water Bubble",
    },
    &AbilityMetadata {
        name: "Steelworker",
    },
    &AbilityMetadata { name: "Berserk" },
    &AbilityMetadata { name: "Slush Rush" },
    &AbilityMetadata { name: "Long Reach" },
    &AbilityMetadata {
        name: "Liquid Voice",
    },
    &AbilityMetadata { name: "Triage" },
    &AbilityMetadata { name: "Galvanize" },
    &AbilityMetadata {
        name: "Surge Surfer",
    },
    &AbilityMetadata { name: "Schooling" },
    &AbilityMetadata { name: "Disguise" },
    &AbilityMetadata {
        name: "Battle Bond",
    },
    &AbilityMetadata {
        name: "Power Construct",
    },
    &AbilityMetadata { name: "Corrosion" },
    &AbilityMetadata { name: "Comatose" },
    &AbilityMetadata {
        name: "Queenly Majesty",
    },
    &AbilityMetadata {
        name: "Innards Out",
    },
    &AbilityMetadata { name: "Dancer" },
    &AbilityMetadata { name: "Battery" },
    &AbilityMetadata { name: "Fluffy" },
    &AbilityMetadata { name: "Dazzling" },
    &AbilityMetadata { name: "Soul-Heart" },
    &AbilityMetadata {
        name: "Tangling Hair",
    },
    &AbilityMetadata { name: "Receiver" },
    &AbilityMetadata {
        name: "Power of Alchemy",
    },
    &AbilityMetadata {
        name: "Beast Boost",
    },
    &AbilityMetadata { name: "RKS System" },
    &AbilityMetadata {
        name: "Electric Surge",
    },
    &AbilityMetadata {
        name: "Psychic Surge",
    },
    &AbilityMetadata {
        name: "Misty Surge",
    },
    &AbilityMetadata {
        name: "Grassy Surge",
    },
    &AbilityMetadata {
        name: "Full Metal Body",
    },
    &AbilityMetadata {
        name: "Shadow Shield",
    },
    &AbilityMetadata {
        name: "Prism Armor",
    },
    &AbilityMetadata { name: "Neuroforce" },
    &AbilityMetadata {
        name: "Intrepid Sword",
    },
    &AbilityMetadata {
        name: "Dauntless Shield",
    },
    &AbilityMetadata { name: "Libero" },
    &AbilityMetadata { name: "Ball Fetch" },
    &AbilityMetadata {
        name: "Cotton Down",
    },
    &AbilityMetadata {
        name: "Propeller Tail",
    },
    &AbilityMetadata {
        name: "Mirror Armor",
    },
    &AbilityMetadata {
        name: "Gulp Missile",
    },
    &AbilityMetadata { name: "Stalwart" },
    &AbilityMetadata {
        name: "Steam Engine",
    },
    &AbilityMetadata { name: "Punk Rock" },
    &AbilityMetadata { name: "Sand Spit" },
    &AbilityMetadata { name: "Ice Scales" },
    &AbilityMetadata { name: "Ripen" },
    &AbilityMetadata { name: "Ice Face" },
    &AbilityMetadata { name: "Power Spot" },
    &AbilityMetadata { name: "Mimicry" },
    &AbilityMetadata {
        name: "Screen Cleaner",
    },
    &AbilityMetadata {
        name: "Steely Spirit",
    },
    &AbilityMetadata {
        name: "Perish Body",
    },
    &AbilityMetadata {
        name: "Wandering Spirit",
    },
    &AbilityMetadata {
        name: "Gorilla Tactics",
    },
    &AbilityMetadata {
        name: "Neutralizing Gas",
    },
    &AbilityMetadata {
        name: "Pastel Veil",
    },
    &AbilityMetadata {
        name: "Hunger Switch",
    },
    &AbilityMetadata { name: "Quick Draw" },
    &AbilityMetadata {
        name: "Unseen Fist",
    },
    &AbilityMetadata {
        name: "Curious Medicine",
    },
    &AbilityMetadata { name: "Transistor" },
    &AbilityMetadata {
        name: "Dragon’s Maw",
    },
    &AbilityMetadata {
        name: "Chilling Neigh",
    },
    &AbilityMetadata { name: "Grim Neigh" },
    &AbilityMetadata { name: "As One" },
    &AbilityMetadata { name: "As One" },
    &AbilityMetadata {
        name: "Lingering Aroma",
    },
    &AbilityMetadata { name: "Seed Sower" },
    &AbilityMetadata {
        name: "Thermal Exchange",
    },
    &AbilityMetadata {
        name: "Anger Shell",
    },
    &AbilityMetadata {
        name: "Purifying Salt",
    },
    &AbilityMetadata {
        name: "Well-Baked Body",
    },
    &AbilityMetadata { name: "Wind Rider" },
    &AbilityMetadata { name: "Guard Dog" },
    &AbilityMetadata {
        name: "Rocky Payload",
    },
    &AbilityMetadata { name: "Wind Power" },
    &AbilityMetadata {
        name: "Zero to Hero",
    },
    &AbilityMetadata { name: "Commander" },
    &AbilityMetadata {
        name: "Electromorphosis",
    },
    &AbilityMetadata {
        name: "Protosynthesis",
    },
    &AbilityMetadata {
        name: "Quark Drive",
    },
    &AbilityMetadata {
        name: "Good as Gold",
    },
    &AbilityMetadata {
        name: "Vessel of Ruin",
    },
    &AbilityMetadata {
        name: "Sword of Ruin",
    },
    &AbilityMetadata {
        name: "Tablets of Ruin",
    },
    &AbilityMetadata {
        name: "Beads of Ruin",
    },
    &AbilityMetadata {
        name: "Orichalcum Pulse",
    },
    &AbilityMetadata {
        name: "Hadron Engine",
    },
    &AbilityMetadata {
        name: "Opportunist",
    },
    &AbilityMetadata { name: "Cud Chew" },
    &AbilityMetadata { name: "Sharpness" },
    &AbilityMetadata {
        name: "Supreme Overlord",
    },
    &AbilityMetadata { name: "Costar" },
    &AbilityMetadata {
        name: "Toxic Debris",
    },
    &AbilityMetadata { name: "Armor Tail" },
    &AbilityMetadata {
        name: "Earth Eater",
    },
    &AbilityMetadata {
        name: "Mycelium Might",
    },
    &AbilityMetadata {
        name: "Hospitality",
    },
    &AbilityMetadata {
        name: "Mind’s Eye"
    },
    &AbilityMetadata {
        name: "Embody Aspect",
    },
    &AbilityMetadata {
        name: "Embody Aspect",
    },
    &AbilityMetadata {
        name: "Embody Aspect",
    },
    &AbilityMetadata {
        name: "Embody Aspect",
    },
    &AbilityMetadata {
        name: "Toxic Chain",
    },
    &AbilityMetadata {
        name: "Supersweet Syrup",
    },
    &AbilityMetadata { name: "Tera Shift" },
    &AbilityMetadata { name: "Tera Shell" },
    &AbilityMetadata {
        name: "Teraform Zero",
    },
    &AbilityMetadata {
        name: "Poison Puppeteer",
    },
];
