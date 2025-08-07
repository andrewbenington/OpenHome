use std::num::NonZeroU16;
use wasm_bindgen::prelude::*;

use serde::{Serialize, Serializer};

#[wasm_bindgen]
#[derive(Debug, Default, PartialEq, Eq, Clone, Copy)]
pub struct AbilityIndex(Option<NonZeroU16>);

impl AbilityIndex {
    pub fn get_metadata(&self) -> Option<&'static AbilityMetadata> {
        self.0.map(|idx| ALL_ABILITIES[(idx.get() - 1) as usize])
    }

    fn to_u16(self) -> u16 {
        match self.0 {
            None => 0,
            Some(idx) => idx.get(),
        }
    }

    pub fn to_le_bytes(self) -> [u8; 2] {
        self.to_u16().to_le_bytes()
    }
}

#[wasm_bindgen]
impl AbilityIndex {
    #[wasm_bindgen(constructor)]
    pub fn new(val: u16) -> AbilityIndex {
        AbilityIndex(NonZeroU16::new(val))
    }

    #[wasm_bindgen(getter)]
    pub fn index(self) -> u16 {
        self.to_u16()
    }
}

impl Serialize for AbilityIndex {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(match self.get_metadata() {
            None => "<empty>",
            Some(metadata) => metadata.name,
        })
    }
}

impl From<u8> for AbilityIndex {
    fn from(value: u8) -> Self {
        Self(match NonZeroU16::try_from(value as u16) {
            Err(_) => None,
            Ok(value) => Some(value),
        })
    }
}


impl From<AbilityIndex> for u8 {
    fn from(val: AbilityIndex) -> Self {
        val.to_u16() as u8
    }
}

impl From<u16> for AbilityIndex {
    fn from(value: u16) -> Self {
        Self(match NonZeroU16::try_from(value) {
            Err(_) => None,
            Ok(value) => Some(value),
        })
    }
}


impl From<AbilityIndex> for u16 {
    fn from(val: AbilityIndex) -> Self {
        val.to_u16()
    }
}

pub struct AbilityMetadata {
    id: u16,
    name: &'static str,
}
    
const STENCH: AbilityMetadata = AbilityMetadata {
    id: 1,
    name: "Stench",
};

const DRIZZLE: AbilityMetadata = AbilityMetadata {
    id: 2,
    name: "Drizzle",
};

const SPEED_BOOST: AbilityMetadata = AbilityMetadata {
    id: 3,
    name: "Speed Boost",
};

const BATTLE_ARMOR: AbilityMetadata = AbilityMetadata {
    id: 4,
    name: "Battle Armor",
};

const STURDY: AbilityMetadata = AbilityMetadata {
    id: 5,
    name: "Sturdy",
};

const DAMP: AbilityMetadata = AbilityMetadata {
    id: 6,
    name: "Damp",
};

const LIMBER: AbilityMetadata = AbilityMetadata {
    id: 7,
    name: "Limber",
};

const SAND_VEIL: AbilityMetadata = AbilityMetadata {
    id: 8,
    name: "Sand Veil",
};

const STATIC: AbilityMetadata = AbilityMetadata {
    id: 9,
    name: "Static",
};

const VOLT_ABSORB: AbilityMetadata = AbilityMetadata {
    id: 10,
    name: "Volt Absorb",
};

const WATER_ABSORB: AbilityMetadata = AbilityMetadata {
    id: 11,
    name: "Water Absorb",
};

const OBLIVIOUS: AbilityMetadata = AbilityMetadata {
    id: 12,
    name: "Oblivious",
};

const CLOUD_NINE: AbilityMetadata = AbilityMetadata {
    id: 13,
    name: "Cloud Nine",
};

const COMPOUND_EYES: AbilityMetadata = AbilityMetadata {
    id: 14,
    name: "Compound Eyes",
};

const INSOMNIA: AbilityMetadata = AbilityMetadata {
    id: 15,
    name: "Insomnia",
};

const COLOR_CHANGE: AbilityMetadata = AbilityMetadata {
    id: 16,
    name: "Color Change",
};

const IMMUNITY: AbilityMetadata = AbilityMetadata {
    id: 17,
    name: "Immunity",
};

const FLASH_FIRE: AbilityMetadata = AbilityMetadata {
    id: 18,
    name: "Flash Fire",
};

const SHIELD_DUST: AbilityMetadata = AbilityMetadata {
    id: 19,
    name: "Shield Dust",
};

const OWN_TEMPO: AbilityMetadata = AbilityMetadata {
    id: 20,
    name: "Own Tempo",
};

const SUCTION_CUPS: AbilityMetadata = AbilityMetadata {
    id: 21,
    name: "Suction Cups",
};

const INTIMIDATE: AbilityMetadata = AbilityMetadata {
    id: 22,
    name: "Intimidate",
};

const SHADOW_TAG: AbilityMetadata = AbilityMetadata {
    id: 23,
    name: "Shadow Tag",
};

const ROUGH_SKIN: AbilityMetadata = AbilityMetadata {
    id: 24,
    name: "Rough Skin",
};

const WONDER_GUARD: AbilityMetadata = AbilityMetadata {
    id: 25,
    name: "Wonder Guard",
};

const LEVITATE: AbilityMetadata = AbilityMetadata {
    id: 26,
    name: "Levitate",
};

const EFFECT_SPORE: AbilityMetadata = AbilityMetadata {
    id: 27,
    name: "Effect Spore",
};

const SYNCHRONIZE: AbilityMetadata = AbilityMetadata {
    id: 28,
    name: "Synchronize",
};

const CLEAR_BODY: AbilityMetadata = AbilityMetadata {
    id: 29,
    name: "Clear Body",
};

const NATURAL_CURE: AbilityMetadata = AbilityMetadata {
    id: 30,
    name: "Natural Cure",
};

const LIGHTNING_ROD: AbilityMetadata = AbilityMetadata {
    id: 31,
    name: "Lightning Rod",
};

const SERENE_GRACE: AbilityMetadata = AbilityMetadata {
    id: 32,
    name: "Serene Grace",
};

const SWIFT_SWIM: AbilityMetadata = AbilityMetadata {
    id: 33,
    name: "Swift Swim",
};

const CHLOROPHYLL: AbilityMetadata = AbilityMetadata {
    id: 34,
    name: "Chlorophyll",
};

const ILLUMINATE: AbilityMetadata = AbilityMetadata {
    id: 35,
    name: "Illuminate",
};

const TRACE: AbilityMetadata = AbilityMetadata {
    id: 36,
    name: "Trace",
};

const HUGE_POWER: AbilityMetadata = AbilityMetadata {
    id: 37,
    name: "Huge Power",
};

const POISON_POINT: AbilityMetadata = AbilityMetadata {
    id: 38,
    name: "Poison Point",
};

const INNER_FOCUS: AbilityMetadata = AbilityMetadata {
    id: 39,
    name: "Inner Focus",
};

const MAGMA_ARMOR: AbilityMetadata = AbilityMetadata {
    id: 40,
    name: "Magma Armor",
};

const WATER_VEIL: AbilityMetadata = AbilityMetadata {
    id: 41,
    name: "Water Veil",
};

const MAGNET_PULL: AbilityMetadata = AbilityMetadata {
    id: 42,
    name: "Magnet Pull",
};

const SOUNDPROOF: AbilityMetadata = AbilityMetadata {
    id: 43,
    name: "Soundproof",
};

const RAIN_DISH: AbilityMetadata = AbilityMetadata {
    id: 44,
    name: "Rain Dish",
};

const SAND_STREAM: AbilityMetadata = AbilityMetadata {
    id: 45,
    name: "Sand Stream",
};

const PRESSURE: AbilityMetadata = AbilityMetadata {
    id: 46,
    name: "Pressure",
};

const THICK_FAT: AbilityMetadata = AbilityMetadata {
    id: 47,
    name: "Thick Fat",
};

const EARLY_BIRD: AbilityMetadata = AbilityMetadata {
    id: 48,
    name: "Early Bird",
};

const FLAME_BODY: AbilityMetadata = AbilityMetadata {
    id: 49,
    name: "Flame Body",
};

const RUN_AWAY: AbilityMetadata = AbilityMetadata {
    id: 50,
    name: "Run Away",
};

const KEEN_EYE: AbilityMetadata = AbilityMetadata {
    id: 51,
    name: "Keen Eye",
};

const HYPER_CUTTER: AbilityMetadata = AbilityMetadata {
    id: 52,
    name: "Hyper Cutter",
};

const PICKUP: AbilityMetadata = AbilityMetadata {
    id: 53,
    name: "Pickup",
};

const TRUANT: AbilityMetadata = AbilityMetadata {
    id: 54,
    name: "Truant",
};

const HUSTLE: AbilityMetadata = AbilityMetadata {
    id: 55,
    name: "Hustle",
};

const CUTE_CHARM: AbilityMetadata = AbilityMetadata {
    id: 56,
    name: "Cute Charm",
};

const PLUS: AbilityMetadata = AbilityMetadata {
    id: 57,
    name: "Plus",
};

const MINUS: AbilityMetadata = AbilityMetadata {
    id: 58,
    name: "Minus",
};

const FORECAST: AbilityMetadata = AbilityMetadata {
    id: 59,
    name: "Forecast",
};

const STICKY_HOLD: AbilityMetadata = AbilityMetadata {
    id: 60,
    name: "Sticky Hold",
};

const SHED_SKIN: AbilityMetadata = AbilityMetadata {
    id: 61,
    name: "Shed Skin",
};

const GUTS: AbilityMetadata = AbilityMetadata {
    id: 62,
    name: "Guts",
};

const MARVEL_SCALE: AbilityMetadata = AbilityMetadata {
    id: 63,
    name: "Marvel Scale",
};

const LIQUID_OOZE: AbilityMetadata = AbilityMetadata {
    id: 64,
    name: "Liquid Ooze",
};

const OVERGROW: AbilityMetadata = AbilityMetadata {
    id: 65,
    name: "Overgrow",
};

const BLAZE: AbilityMetadata = AbilityMetadata {
    id: 66,
    name: "Blaze",
};

const TORRENT: AbilityMetadata = AbilityMetadata {
    id: 67,
    name: "Torrent",
};

const SWARM: AbilityMetadata = AbilityMetadata {
    id: 68,
    name: "Swarm",
};

const ROCK_HEAD: AbilityMetadata = AbilityMetadata {
    id: 69,
    name: "Rock Head",
};

const DROUGHT: AbilityMetadata = AbilityMetadata {
    id: 70,
    name: "Drought",
};

const ARENA_TRAP: AbilityMetadata = AbilityMetadata {
    id: 71,
    name: "Arena Trap",
};

const VITAL_SPIRIT: AbilityMetadata = AbilityMetadata {
    id: 72,
    name: "Vital Spirit",
};

const WHITE_SMOKE: AbilityMetadata = AbilityMetadata {
    id: 73,
    name: "White Smoke",
};

const PURE_POWER: AbilityMetadata = AbilityMetadata {
    id: 74,
    name: "Pure Power",
};

const SHELL_ARMOR: AbilityMetadata = AbilityMetadata {
    id: 75,
    name: "Shell Armor",
};

const AIR_LOCK: AbilityMetadata = AbilityMetadata {
    id: 76,
    name: "Air Lock",
};

const TANGLED_FEET: AbilityMetadata = AbilityMetadata {
    id: 77,
    name: "Tangled Feet",
};

const MOTOR_DRIVE: AbilityMetadata = AbilityMetadata {
    id: 78,
    name: "Motor Drive",
};

const RIVALRY: AbilityMetadata = AbilityMetadata {
    id: 79,
    name: "Rivalry",
};

const STEADFAST: AbilityMetadata = AbilityMetadata {
    id: 80,
    name: "Steadfast",
};

const SNOW_CLOAK: AbilityMetadata = AbilityMetadata {
    id: 81,
    name: "Snow Cloak",
};

const GLUTTONY: AbilityMetadata = AbilityMetadata {
    id: 82,
    name: "Gluttony",
};

const ANGER_POINT: AbilityMetadata = AbilityMetadata {
    id: 83,
    name: "Anger Point",
};

const UNBURDEN: AbilityMetadata = AbilityMetadata {
    id: 84,
    name: "Unburden",
};

const HEATPROOF: AbilityMetadata = AbilityMetadata {
    id: 85,
    name: "Heatproof",
};

const SIMPLE: AbilityMetadata = AbilityMetadata {
    id: 86,
    name: "Simple",
};

const DRY_SKIN: AbilityMetadata = AbilityMetadata {
    id: 87,
    name: "Dry Skin",
};

const DOWNLOAD: AbilityMetadata = AbilityMetadata {
    id: 88,
    name: "Download",
};

const IRON_FIST: AbilityMetadata = AbilityMetadata {
    id: 89,
    name: "Iron Fist",
};

const POISON_HEAL: AbilityMetadata = AbilityMetadata {
    id: 90,
    name: "Poison Heal",
};

const ADAPTABILITY: AbilityMetadata = AbilityMetadata {
    id: 91,
    name: "Adaptability",
};

const SKILL_LINK: AbilityMetadata = AbilityMetadata {
    id: 92,
    name: "Skill Link",
};

const HYDRATION: AbilityMetadata = AbilityMetadata {
    id: 93,
    name: "Hydration",
};

const SOLAR_POWER: AbilityMetadata = AbilityMetadata {
    id: 94,
    name: "Solar Power",
};

const QUICK_FEET: AbilityMetadata = AbilityMetadata {
    id: 95,
    name: "Quick Feet",
};

const NORMALIZE: AbilityMetadata = AbilityMetadata {
    id: 96,
    name: "Normalize",
};

const SNIPER: AbilityMetadata = AbilityMetadata {
    id: 97,
    name: "Sniper",
};

const MAGIC_GUARD: AbilityMetadata = AbilityMetadata {
    id: 98,
    name: "Magic Guard",
};

const NO_GUARD: AbilityMetadata = AbilityMetadata {
    id: 99,
    name: "No Guard",
};

const STALL: AbilityMetadata = AbilityMetadata {
    id: 100,
    name: "Stall",
};

const TECHNICIAN: AbilityMetadata = AbilityMetadata {
    id: 101,
    name: "Technician",
};

const LEAF_GUARD: AbilityMetadata = AbilityMetadata {
    id: 102,
    name: "Leaf Guard",
};

const KLUTZ: AbilityMetadata = AbilityMetadata {
    id: 103,
    name: "Klutz",
};

const MOLD_BREAKER: AbilityMetadata = AbilityMetadata {
    id: 104,
    name: "Mold Breaker",
};

const SUPER_LUCK: AbilityMetadata = AbilityMetadata {
    id: 105,
    name: "Super Luck",
};

const AFTERMATH: AbilityMetadata = AbilityMetadata {
    id: 106,
    name: "Aftermath",
};

const ANTICIPATION: AbilityMetadata = AbilityMetadata {
    id: 107,
    name: "Anticipation",
};

const FOREWARN: AbilityMetadata = AbilityMetadata {
    id: 108,
    name: "Forewarn",
};

const UNAWARE: AbilityMetadata = AbilityMetadata {
    id: 109,
    name: "Unaware",
};

const TINTED_LENS: AbilityMetadata = AbilityMetadata {
    id: 110,
    name: "Tinted Lens",
};

const FILTER: AbilityMetadata = AbilityMetadata {
    id: 111,
    name: "Filter",
};

const SLOW_START: AbilityMetadata = AbilityMetadata {
    id: 112,
    name: "Slow Start",
};

const SCRAPPY: AbilityMetadata = AbilityMetadata {
    id: 113,
    name: "Scrappy",
};

const STORM_DRAIN: AbilityMetadata = AbilityMetadata {
    id: 114,
    name: "Storm Drain",
};

const ICE_BODY: AbilityMetadata = AbilityMetadata {
    id: 115,
    name: "Ice Body",
};

const SOLID_ROCK: AbilityMetadata = AbilityMetadata {
    id: 116,
    name: "Solid Rock",
};

const SNOW_WARNING: AbilityMetadata = AbilityMetadata {
    id: 117,
    name: "Snow Warning",
};

const HONEY_GATHER: AbilityMetadata = AbilityMetadata {
    id: 118,
    name: "Honey Gather",
};

const FRISK: AbilityMetadata = AbilityMetadata {
    id: 119,
    name: "Frisk",
};

const RECKLESS: AbilityMetadata = AbilityMetadata {
    id: 120,
    name: "Reckless",
};

const MULTITYPE: AbilityMetadata = AbilityMetadata {
    id: 121,
    name: "Multitype",
};

const FLOWER_GIFT: AbilityMetadata = AbilityMetadata {
    id: 122,
    name: "Flower Gift",
};

const BAD_DREAMS: AbilityMetadata = AbilityMetadata {
    id: 123,
    name: "Bad Dreams",
};

const PICKPOCKET: AbilityMetadata = AbilityMetadata {
    id: 124,
    name: "Pickpocket",
};

const SHEER_FORCE: AbilityMetadata = AbilityMetadata {
    id: 125,
    name: "Sheer Force",
};

const CONTRARY: AbilityMetadata = AbilityMetadata {
    id: 126,
    name: "Contrary",
};

const UNNERVE: AbilityMetadata = AbilityMetadata {
    id: 127,
    name: "Unnerve",
};

const DEFIANT: AbilityMetadata = AbilityMetadata {
    id: 128,
    name: "Defiant",
};

const DEFEATIST: AbilityMetadata = AbilityMetadata {
    id: 129,
    name: "Defeatist",
};

const CURSED_BODY: AbilityMetadata = AbilityMetadata {
    id: 130,
    name: "Cursed Body",
};

const HEALER: AbilityMetadata = AbilityMetadata {
    id: 131,
    name: "Healer",
};

const FRIEND_GUARD: AbilityMetadata = AbilityMetadata {
    id: 132,
    name: "Friend Guard",
};

const WEAK_ARMOR: AbilityMetadata = AbilityMetadata {
    id: 133,
    name: "Weak Armor",
};

const HEAVY_METAL: AbilityMetadata = AbilityMetadata {
    id: 134,
    name: "Heavy Metal",
};

const LIGHT_METAL: AbilityMetadata = AbilityMetadata {
    id: 135,
    name: "Light Metal",
};

const MULTISCALE: AbilityMetadata = AbilityMetadata {
    id: 136,
    name: "Multiscale",
};

const TOXIC_BOOST: AbilityMetadata = AbilityMetadata {
    id: 137,
    name: "Toxic Boost",
};

const FLARE_BOOST: AbilityMetadata = AbilityMetadata {
    id: 138,
    name: "Flare Boost",
};

const HARVEST: AbilityMetadata = AbilityMetadata {
    id: 139,
    name: "Harvest",
};

const TELEPATHY: AbilityMetadata = AbilityMetadata {
    id: 140,
    name: "Telepathy",
};

const MOODY: AbilityMetadata = AbilityMetadata {
    id: 141,
    name: "Moody",
};

const OVERCOAT: AbilityMetadata = AbilityMetadata {
    id: 142,
    name: "Overcoat",
};

const POISON_TOUCH: AbilityMetadata = AbilityMetadata {
    id: 143,
    name: "Poison Touch",
};

const REGENERATOR: AbilityMetadata = AbilityMetadata {
    id: 144,
    name: "Regenerator",
};

const BIG_PECKS: AbilityMetadata = AbilityMetadata {
    id: 145,
    name: "Big Pecks",
};

const SAND_RUSH: AbilityMetadata = AbilityMetadata {
    id: 146,
    name: "Sand Rush",
};

const WONDER_SKIN: AbilityMetadata = AbilityMetadata {
    id: 147,
    name: "Wonder Skin",
};

const ANALYTIC: AbilityMetadata = AbilityMetadata {
    id: 148,
    name: "Analytic",
};

const ILLUSION: AbilityMetadata = AbilityMetadata {
    id: 149,
    name: "Illusion",
};

const IMPOSTER: AbilityMetadata = AbilityMetadata {
    id: 150,
    name: "Imposter",
};

const INFILTRATOR: AbilityMetadata = AbilityMetadata {
    id: 151,
    name: "Infiltrator",
};

const MUMMY: AbilityMetadata = AbilityMetadata {
    id: 152,
    name: "Mummy",
};

const MOXIE: AbilityMetadata = AbilityMetadata {
    id: 153,
    name: "Moxie",
};

const JUSTIFIED: AbilityMetadata = AbilityMetadata {
    id: 154,
    name: "Justified",
};

const RATTLED: AbilityMetadata = AbilityMetadata {
    id: 155,
    name: "Rattled",
};

const MAGIC_BOUNCE: AbilityMetadata = AbilityMetadata {
    id: 156,
    name: "Magic Bounce",
};

const SAP_SIPPER: AbilityMetadata = AbilityMetadata {
    id: 157,
    name: "Sap Sipper",
};

const PRANKSTER: AbilityMetadata = AbilityMetadata {
    id: 158,
    name: "Prankster",
};

const SAND_FORCE: AbilityMetadata = AbilityMetadata {
    id: 159,
    name: "Sand Force",
};

const IRON_BARBS: AbilityMetadata = AbilityMetadata {
    id: 160,
    name: "Iron Barbs",
};

const ZEN_MODE: AbilityMetadata = AbilityMetadata {
    id: 161,
    name: "Zen Mode",
};

const VICTORY_STAR: AbilityMetadata = AbilityMetadata {
    id: 162,
    name: "Victory Star",
};

const TURBOBLAZE: AbilityMetadata = AbilityMetadata {
    id: 163,
    name: "Turboblaze",
};

const TERAVOLT: AbilityMetadata = AbilityMetadata {
    id: 164,
    name: "Teravolt",
};

const AROMA_VEIL: AbilityMetadata = AbilityMetadata {
    id: 165,
    name: "Aroma Veil",
};

const FLOWER_VEIL: AbilityMetadata = AbilityMetadata {
    id: 166,
    name: "Flower Veil",
};

const CHEEK_POUCH: AbilityMetadata = AbilityMetadata {
    id: 167,
    name: "Cheek Pouch",
};

const PROTEAN: AbilityMetadata = AbilityMetadata {
    id: 168,
    name: "Protean",
};

const FUR_COAT: AbilityMetadata = AbilityMetadata {
    id: 169,
    name: "Fur Coat",
};

const MAGICIAN: AbilityMetadata = AbilityMetadata {
    id: 170,
    name: "Magician",
};

const BULLETPROOF: AbilityMetadata = AbilityMetadata {
    id: 171,
    name: "Bulletproof",
};

const COMPETITIVE: AbilityMetadata = AbilityMetadata {
    id: 172,
    name: "Competitive",
};

const STRONG_JAW: AbilityMetadata = AbilityMetadata {
    id: 173,
    name: "Strong Jaw",
};

const REFRIGERATE: AbilityMetadata = AbilityMetadata {
    id: 174,
    name: "Refrigerate",
};

const SWEET_VEIL: AbilityMetadata = AbilityMetadata {
    id: 175,
    name: "Sweet Veil",
};

const STANCE_CHANGE: AbilityMetadata = AbilityMetadata {
    id: 176,
    name: "Stance Change",
};

const GALE_WINGS: AbilityMetadata = AbilityMetadata {
    id: 177,
    name: "Gale Wings",
};

const MEGA_LAUNCHER: AbilityMetadata = AbilityMetadata {
    id: 178,
    name: "Mega Launcher",
};

const GRASS_PELT: AbilityMetadata = AbilityMetadata {
    id: 179,
    name: "Grass Pelt",
};

const SYMBIOSIS: AbilityMetadata = AbilityMetadata {
    id: 180,
    name: "Symbiosis",
};

const TOUGH_CLAWS: AbilityMetadata = AbilityMetadata {
    id: 181,
    name: "Tough Claws",
};

const PIXILATE: AbilityMetadata = AbilityMetadata {
    id: 182,
    name: "Pixilate",
};

const GOOEY: AbilityMetadata = AbilityMetadata {
    id: 183,
    name: "Gooey",
};

const AERILATE: AbilityMetadata = AbilityMetadata {
    id: 184,
    name: "Aerilate",
};

const PARENTAL_BOND: AbilityMetadata = AbilityMetadata {
    id: 185,
    name: "Parental Bond",
};

const DARK_AURA: AbilityMetadata = AbilityMetadata {
    id: 186,
    name: "Dark Aura",
};

const FAIRY_AURA: AbilityMetadata = AbilityMetadata {
    id: 187,
    name: "Fairy Aura",
};

const AURA_BREAK: AbilityMetadata = AbilityMetadata {
    id: 188,
    name: "Aura Break",
};

const PRIMORDIAL_SEA: AbilityMetadata = AbilityMetadata {
    id: 189,
    name: "Primordial Sea",
};

const DESOLATE_LAND: AbilityMetadata = AbilityMetadata {
    id: 190,
    name: "Desolate Land",
};

const DELTA_STREAM: AbilityMetadata = AbilityMetadata {
    id: 191,
    name: "Delta Stream",
};

const STAMINA: AbilityMetadata = AbilityMetadata {
    id: 192,
    name: "Stamina",
};

const WIMP_OUT: AbilityMetadata = AbilityMetadata {
    id: 193,
    name: "Wimp Out",
};

const EMERGENCY_EXIT: AbilityMetadata = AbilityMetadata {
    id: 194,
    name: "Emergency Exit",
};

const WATER_COMPACTION: AbilityMetadata = AbilityMetadata {
    id: 195,
    name: "Water Compaction",
};

const MERCILESS: AbilityMetadata = AbilityMetadata {
    id: 196,
    name: "Merciless",
};

const SHIELDS_DOWN: AbilityMetadata = AbilityMetadata {
    id: 197,
    name: "Shields Down",
};

const STAKEOUT: AbilityMetadata = AbilityMetadata {
    id: 198,
    name: "Stakeout",
};

const WATER_BUBBLE: AbilityMetadata = AbilityMetadata {
    id: 199,
    name: "Water Bubble",
};

const STEELWORKER: AbilityMetadata = AbilityMetadata {
    id: 200,
    name: "Steelworker",
};

const BERSERK: AbilityMetadata = AbilityMetadata {
    id: 201,
    name: "Berserk",
};

const SLUSH_RUSH: AbilityMetadata = AbilityMetadata {
    id: 202,
    name: "Slush Rush",
};

const LONG_REACH: AbilityMetadata = AbilityMetadata {
    id: 203,
    name: "Long Reach",
};

const LIQUID_VOICE: AbilityMetadata = AbilityMetadata {
    id: 204,
    name: "Liquid Voice",
};

const TRIAGE: AbilityMetadata = AbilityMetadata {
    id: 205,
    name: "Triage",
};

const GALVANIZE: AbilityMetadata = AbilityMetadata {
    id: 206,
    name: "Galvanize",
};

const SURGE_SURFER: AbilityMetadata = AbilityMetadata {
    id: 207,
    name: "Surge Surfer",
};

const SCHOOLING: AbilityMetadata = AbilityMetadata {
    id: 208,
    name: "Schooling",
};

const DISGUISE: AbilityMetadata = AbilityMetadata {
    id: 209,
    name: "Disguise",
};

const BATTLE_BOND: AbilityMetadata = AbilityMetadata {
    id: 210,
    name: "Battle Bond",
};

const POWER_CONSTRUCT: AbilityMetadata = AbilityMetadata {
    id: 211,
    name: "Power Construct",
};

const CORROSION: AbilityMetadata = AbilityMetadata {
    id: 212,
    name: "Corrosion",
};

const COMATOSE: AbilityMetadata = AbilityMetadata {
    id: 213,
    name: "Comatose",
};

const QUEENLY_MAJESTY: AbilityMetadata = AbilityMetadata {
    id: 214,
    name: "Queenly Majesty",
};

const INNARDS_OUT: AbilityMetadata = AbilityMetadata {
    id: 215,
    name: "Innards Out",
};

const DANCER: AbilityMetadata = AbilityMetadata {
    id: 216,
    name: "Dancer",
};

const BATTERY: AbilityMetadata = AbilityMetadata {
    id: 217,
    name: "Battery",
};

const FLUFFY: AbilityMetadata = AbilityMetadata {
    id: 218,
    name: "Fluffy",
};

const DAZZLING: AbilityMetadata = AbilityMetadata {
    id: 219,
    name: "Dazzling",
};

const SOUL_HEART: AbilityMetadata = AbilityMetadata {
    id: 220,
    name: "Soul-Heart",
};

const TANGLING_HAIR: AbilityMetadata = AbilityMetadata {
    id: 221,
    name: "Tangling Hair",
};

const RECEIVER: AbilityMetadata = AbilityMetadata {
    id: 222,
    name: "Receiver",
};

const POWER_OF_ALCHEMY: AbilityMetadata = AbilityMetadata {
    id: 223,
    name: "Power of Alchemy",
};

const BEAST_BOOST: AbilityMetadata = AbilityMetadata {
    id: 224,
    name: "Beast Boost",
};

const RKS_SYSTEM: AbilityMetadata = AbilityMetadata {
    id: 225,
    name: "RKS System",
};

const ELECTRIC_SURGE: AbilityMetadata = AbilityMetadata {
    id: 226,
    name: "Electric Surge",
};

const PSYCHIC_SURGE: AbilityMetadata = AbilityMetadata {
    id: 227,
    name: "Psychic Surge",
};

const MISTY_SURGE: AbilityMetadata = AbilityMetadata {
    id: 228,
    name: "Misty Surge",
};

const GRASSY_SURGE: AbilityMetadata = AbilityMetadata {
    id: 229,
    name: "Grassy Surge",
};

const FULL_METAL_BODY: AbilityMetadata = AbilityMetadata {
    id: 230,
    name: "Full Metal Body",
};

const SHADOW_SHIELD: AbilityMetadata = AbilityMetadata {
    id: 231,
    name: "Shadow Shield",
};

const PRISM_ARMOR: AbilityMetadata = AbilityMetadata {
    id: 232,
    name: "Prism Armor",
};

const NEUROFORCE: AbilityMetadata = AbilityMetadata {
    id: 233,
    name: "Neuroforce",
};

const INTREPID_SWORD: AbilityMetadata = AbilityMetadata {
    id: 234,
    name: "Intrepid Sword",
};

const DAUNTLESS_SHIELD: AbilityMetadata = AbilityMetadata {
    id: 235,
    name: "Dauntless Shield",
};

const LIBERO: AbilityMetadata = AbilityMetadata {
    id: 236,
    name: "Libero",
};

const BALL_FETCH: AbilityMetadata = AbilityMetadata {
    id: 237,
    name: "Ball Fetch",
};

const COTTON_DOWN: AbilityMetadata = AbilityMetadata {
    id: 238,
    name: "Cotton Down",
};

const PROPELLER_TAIL: AbilityMetadata = AbilityMetadata {
    id: 239,
    name: "Propeller Tail",
};

const MIRROR_ARMOR: AbilityMetadata = AbilityMetadata {
    id: 240,
    name: "Mirror Armor",
};

const GULP_MISSILE: AbilityMetadata = AbilityMetadata {
    id: 241,
    name: "Gulp Missile",
};

const STALWART: AbilityMetadata = AbilityMetadata {
    id: 242,
    name: "Stalwart",
};

const STEAM_ENGINE: AbilityMetadata = AbilityMetadata {
    id: 243,
    name: "Steam Engine",
};

const PUNK_ROCK: AbilityMetadata = AbilityMetadata {
    id: 244,
    name: "Punk Rock",
};

const SAND_SPIT: AbilityMetadata = AbilityMetadata {
    id: 245,
    name: "Sand Spit",
};

const ICE_SCALES: AbilityMetadata = AbilityMetadata {
    id: 246,
    name: "Ice Scales",
};

const RIPEN: AbilityMetadata = AbilityMetadata {
    id: 247,
    name: "Ripen",
};

const ICE_FACE: AbilityMetadata = AbilityMetadata {
    id: 248,
    name: "Ice Face",
};

const POWER_SPOT: AbilityMetadata = AbilityMetadata {
    id: 249,
    name: "Power Spot",
};

const MIMICRY: AbilityMetadata = AbilityMetadata {
    id: 250,
    name: "Mimicry",
};

const SCREEN_CLEANER: AbilityMetadata = AbilityMetadata {
    id: 251,
    name: "Screen Cleaner",
};

const STEELY_SPIRIT: AbilityMetadata = AbilityMetadata {
    id: 252,
    name: "Steely Spirit",
};

const PERISH_BODY: AbilityMetadata = AbilityMetadata {
    id: 253,
    name: "Perish Body",
};

const WANDERING_SPIRIT: AbilityMetadata = AbilityMetadata {
    id: 254,
    name: "Wandering Spirit",
};

const GORILLA_TACTICS: AbilityMetadata = AbilityMetadata {
    id: 255,
    name: "Gorilla Tactics",
};

const NEUTRALIZING_GAS: AbilityMetadata = AbilityMetadata {
    id: 256,
    name: "Neutralizing Gas",
};

const PASTEL_VEIL: AbilityMetadata = AbilityMetadata {
    id: 257,
    name: "Pastel Veil",
};

const HUNGER_SWITCH: AbilityMetadata = AbilityMetadata {
    id: 258,
    name: "Hunger Switch",
};

const QUICK_DRAW: AbilityMetadata = AbilityMetadata {
    id: 259,
    name: "Quick Draw",
};

const UNSEEN_FIST: AbilityMetadata = AbilityMetadata {
    id: 260,
    name: "Unseen Fist",
};

const CURIOUS_MEDICINE: AbilityMetadata = AbilityMetadata {
    id: 261,
    name: "Curious Medicine",
};

const TRANSISTOR: AbilityMetadata = AbilityMetadata {
    id: 262,
    name: "Transistor",
};

const DRAGON_S_MAW: AbilityMetadata = AbilityMetadata {
    id: 263,
    name: "Dragon’s Maw",
};

const CHILLING_NEIGH: AbilityMetadata = AbilityMetadata {
    id: 264,
    name: "Chilling Neigh",
};

const GRIM_NEIGH: AbilityMetadata = AbilityMetadata {
    id: 265,
    name: "Grim Neigh",
};

const AS_ONE_ICE_RIDER: AbilityMetadata = AbilityMetadata {
    id: 266,
    name: "As One",
};

const AS_ONE_SHADOW_RIDER: AbilityMetadata = AbilityMetadata {
    id: 267,
    name: "As One",
};

const LINGERING_AROMA: AbilityMetadata = AbilityMetadata {
    id: 268,
    name: "Lingering Aroma",
};

const SEED_SOWER: AbilityMetadata = AbilityMetadata {
    id: 269,
    name: "Seed Sower",
};

const THERMAL_EXCHANGE: AbilityMetadata = AbilityMetadata {
    id: 270,
    name: "Thermal Exchange",
};

const ANGER_SHELL: AbilityMetadata = AbilityMetadata {
    id: 271,
    name: "Anger Shell",
};

const PURIFYING_SALT: AbilityMetadata = AbilityMetadata {
    id: 272,
    name: "Purifying Salt",
};

const WELL_BAKED_BODY: AbilityMetadata = AbilityMetadata {
    id: 273,
    name: "Well-Baked Body",
};

const WIND_RIDER: AbilityMetadata = AbilityMetadata {
    id: 274,
    name: "Wind Rider",
};

const GUARD_DOG: AbilityMetadata = AbilityMetadata {
    id: 275,
    name: "Guard Dog",
};

const ROCKY_PAYLOAD: AbilityMetadata = AbilityMetadata {
    id: 276,
    name: "Rocky Payload",
};

const WIND_POWER: AbilityMetadata = AbilityMetadata {
    id: 277,
    name: "Wind Power",
};

const ZERO_TO_HERO: AbilityMetadata = AbilityMetadata {
    id: 278,
    name: "Zero to Hero",
};

const COMMANDER: AbilityMetadata = AbilityMetadata {
    id: 279,
    name: "Commander",
};

const ELECTROMORPHOSIS: AbilityMetadata = AbilityMetadata {
    id: 280,
    name: "Electromorphosis",
};

const PROTOSYNTHESIS: AbilityMetadata = AbilityMetadata {
    id: 281,
    name: "Protosynthesis",
};

const QUARK_DRIVE: AbilityMetadata = AbilityMetadata {
    id: 282,
    name: "Quark Drive",
};

const GOOD_AS_GOLD: AbilityMetadata = AbilityMetadata {
    id: 283,
    name: "Good as Gold",
};

const VESSEL_OF_RUIN: AbilityMetadata = AbilityMetadata {
    id: 284,
    name: "Vessel of Ruin",
};

const SWORD_OF_RUIN: AbilityMetadata = AbilityMetadata {
    id: 285,
    name: "Sword of Ruin",
};

const TABLETS_OF_RUIN: AbilityMetadata = AbilityMetadata {
    id: 286,
    name: "Tablets of Ruin",
};

const BEADS_OF_RUIN: AbilityMetadata = AbilityMetadata {
    id: 287,
    name: "Beads of Ruin",
};

const ORICHALCUM_PULSE: AbilityMetadata = AbilityMetadata {
    id: 288,
    name: "Orichalcum Pulse",
};

const HADRON_ENGINE: AbilityMetadata = AbilityMetadata {
    id: 289,
    name: "Hadron Engine",
};

const OPPORTUNIST: AbilityMetadata = AbilityMetadata {
    id: 290,
    name: "Opportunist",
};

const CUD_CHEW: AbilityMetadata = AbilityMetadata {
    id: 291,
    name: "Cud Chew",
};

const SHARPNESS: AbilityMetadata = AbilityMetadata {
    id: 292,
    name: "Sharpness",
};

const SUPREME_OVERLORD: AbilityMetadata = AbilityMetadata {
    id: 293,
    name: "Supreme Overlord",
};

const COSTAR: AbilityMetadata = AbilityMetadata {
    id: 294,
    name: "Costar",
};

const TOXIC_DEBRIS: AbilityMetadata = AbilityMetadata {
    id: 295,
    name: "Toxic Debris",
};

const ARMOR_TAIL: AbilityMetadata = AbilityMetadata {
    id: 296,
    name: "Armor Tail",
};

const EARTH_EATER: AbilityMetadata = AbilityMetadata {
    id: 297,
    name: "Earth Eater",
};

const MYCELIUM_MIGHT: AbilityMetadata = AbilityMetadata {
    id: 298,
    name: "Mycelium Might",
};

const HOSPITALITY: AbilityMetadata = AbilityMetadata {
    id: 299,
    name: "Hospitality",
};

const MIND_S_EYE: AbilityMetadata = AbilityMetadata {
    id: 300,
    name: "Mind’s Eye",
};

const EMBODY_ASPECT_SPEED: AbilityMetadata = AbilityMetadata {
    id: 301,
    name: "Embody Aspect",
};

const EMBODY_ASPECT_SP_DEF: AbilityMetadata = AbilityMetadata {
    id: 302,
    name: "Embody Aspect",
};

const EMBODY_ASPECT_ATK: AbilityMetadata = AbilityMetadata {
    id: 303,
    name: "Embody Aspect",
};

const EMBODY_ASPECT_DEF: AbilityMetadata = AbilityMetadata {
    id: 304,
    name: "Embody Aspect",
};

const TOXIC_CHAIN: AbilityMetadata = AbilityMetadata {
    id: 305,
    name: "Toxic Chain",
};

const SUPERSWEET_SYRUP: AbilityMetadata = AbilityMetadata {
    id: 306,
    name: "Supersweet Syrup",
};

const TERA_SHIFT: AbilityMetadata = AbilityMetadata {
    id: 307,
    name: "Tera Shift",
};

const TERA_SHELL: AbilityMetadata = AbilityMetadata {
    id: 308,
    name: "Tera Shell",
};

const TERAFORM_ZERO: AbilityMetadata = AbilityMetadata {
    id: 309,
    name: "Teraform Zero",
};

const POISON_PUPPETEER: AbilityMetadata = AbilityMetadata {
    id: 310,
    name: "Poison Puppeteer",
};const ALL_ABILITIES: [&AbilityMetadata; 310] = [
&STENCH,
&DRIZZLE,
&SPEED_BOOST,
&BATTLE_ARMOR,
&STURDY,
&DAMP,
&LIMBER,
&SAND_VEIL,
&STATIC,
&VOLT_ABSORB,
&WATER_ABSORB,
&OBLIVIOUS,
&CLOUD_NINE,
&COMPOUND_EYES,
&INSOMNIA,
&COLOR_CHANGE,
&IMMUNITY,
&FLASH_FIRE,
&SHIELD_DUST,
&OWN_TEMPO,
&SUCTION_CUPS,
&INTIMIDATE,
&SHADOW_TAG,
&ROUGH_SKIN,
&WONDER_GUARD,
&LEVITATE,
&EFFECT_SPORE,
&SYNCHRONIZE,
&CLEAR_BODY,
&NATURAL_CURE,
&LIGHTNING_ROD,
&SERENE_GRACE,
&SWIFT_SWIM,
&CHLOROPHYLL,
&ILLUMINATE,
&TRACE,
&HUGE_POWER,
&POISON_POINT,
&INNER_FOCUS,
&MAGMA_ARMOR,
&WATER_VEIL,
&MAGNET_PULL,
&SOUNDPROOF,
&RAIN_DISH,
&SAND_STREAM,
&PRESSURE,
&THICK_FAT,
&EARLY_BIRD,
&FLAME_BODY,
&RUN_AWAY,
&KEEN_EYE,
&HYPER_CUTTER,
&PICKUP,
&TRUANT,
&HUSTLE,
&CUTE_CHARM,
&PLUS,
&MINUS,
&FORECAST,
&STICKY_HOLD,
&SHED_SKIN,
&GUTS,
&MARVEL_SCALE,
&LIQUID_OOZE,
&OVERGROW,
&BLAZE,
&TORRENT,
&SWARM,
&ROCK_HEAD,
&DROUGHT,
&ARENA_TRAP,
&VITAL_SPIRIT,
&WHITE_SMOKE,
&PURE_POWER,
&SHELL_ARMOR,
&AIR_LOCK,
&TANGLED_FEET,
&MOTOR_DRIVE,
&RIVALRY,
&STEADFAST,
&SNOW_CLOAK,
&GLUTTONY,
&ANGER_POINT,
&UNBURDEN,
&HEATPROOF,
&SIMPLE,
&DRY_SKIN,
&DOWNLOAD,
&IRON_FIST,
&POISON_HEAL,
&ADAPTABILITY,
&SKILL_LINK,
&HYDRATION,
&SOLAR_POWER,
&QUICK_FEET,
&NORMALIZE,
&SNIPER,
&MAGIC_GUARD,
&NO_GUARD,
&STALL,
&TECHNICIAN,
&LEAF_GUARD,
&KLUTZ,
&MOLD_BREAKER,
&SUPER_LUCK,
&AFTERMATH,
&ANTICIPATION,
&FOREWARN,
&UNAWARE,
&TINTED_LENS,
&FILTER,
&SLOW_START,
&SCRAPPY,
&STORM_DRAIN,
&ICE_BODY,
&SOLID_ROCK,
&SNOW_WARNING,
&HONEY_GATHER,
&FRISK,
&RECKLESS,
&MULTITYPE,
&FLOWER_GIFT,
&BAD_DREAMS,
&PICKPOCKET,
&SHEER_FORCE,
&CONTRARY,
&UNNERVE,
&DEFIANT,
&DEFEATIST,
&CURSED_BODY,
&HEALER,
&FRIEND_GUARD,
&WEAK_ARMOR,
&HEAVY_METAL,
&LIGHT_METAL,
&MULTISCALE,
&TOXIC_BOOST,
&FLARE_BOOST,
&HARVEST,
&TELEPATHY,
&MOODY,
&OVERCOAT,
&POISON_TOUCH,
&REGENERATOR,
&BIG_PECKS,
&SAND_RUSH,
&WONDER_SKIN,
&ANALYTIC,
&ILLUSION,
&IMPOSTER,
&INFILTRATOR,
&MUMMY,
&MOXIE,
&JUSTIFIED,
&RATTLED,
&MAGIC_BOUNCE,
&SAP_SIPPER,
&PRANKSTER,
&SAND_FORCE,
&IRON_BARBS,
&ZEN_MODE,
&VICTORY_STAR,
&TURBOBLAZE,
&TERAVOLT,
&AROMA_VEIL,
&FLOWER_VEIL,
&CHEEK_POUCH,
&PROTEAN,
&FUR_COAT,
&MAGICIAN,
&BULLETPROOF,
&COMPETITIVE,
&STRONG_JAW,
&REFRIGERATE,
&SWEET_VEIL,
&STANCE_CHANGE,
&GALE_WINGS,
&MEGA_LAUNCHER,
&GRASS_PELT,
&SYMBIOSIS,
&TOUGH_CLAWS,
&PIXILATE,
&GOOEY,
&AERILATE,
&PARENTAL_BOND,
&DARK_AURA,
&FAIRY_AURA,
&AURA_BREAK,
&PRIMORDIAL_SEA,
&DESOLATE_LAND,
&DELTA_STREAM,
&STAMINA,
&WIMP_OUT,
&EMERGENCY_EXIT,
&WATER_COMPACTION,
&MERCILESS,
&SHIELDS_DOWN,
&STAKEOUT,
&WATER_BUBBLE,
&STEELWORKER,
&BERSERK,
&SLUSH_RUSH,
&LONG_REACH,
&LIQUID_VOICE,
&TRIAGE,
&GALVANIZE,
&SURGE_SURFER,
&SCHOOLING,
&DISGUISE,
&BATTLE_BOND,
&POWER_CONSTRUCT,
&CORROSION,
&COMATOSE,
&QUEENLY_MAJESTY,
&INNARDS_OUT,
&DANCER,
&BATTERY,
&FLUFFY,
&DAZZLING,
&SOUL_HEART,
&TANGLING_HAIR,
&RECEIVER,
&POWER_OF_ALCHEMY,
&BEAST_BOOST,
&RKS_SYSTEM,
&ELECTRIC_SURGE,
&PSYCHIC_SURGE,
&MISTY_SURGE,
&GRASSY_SURGE,
&FULL_METAL_BODY,
&SHADOW_SHIELD,
&PRISM_ARMOR,
&NEUROFORCE,
&INTREPID_SWORD,
&DAUNTLESS_SHIELD,
&LIBERO,
&BALL_FETCH,
&COTTON_DOWN,
&PROPELLER_TAIL,
&MIRROR_ARMOR,
&GULP_MISSILE,
&STALWART,
&STEAM_ENGINE,
&PUNK_ROCK,
&SAND_SPIT,
&ICE_SCALES,
&RIPEN,
&ICE_FACE,
&POWER_SPOT,
&MIMICRY,
&SCREEN_CLEANER,
&STEELY_SPIRIT,
&PERISH_BODY,
&WANDERING_SPIRIT,
&GORILLA_TACTICS,
&NEUTRALIZING_GAS,
&PASTEL_VEIL,
&HUNGER_SWITCH,
&QUICK_DRAW,
&UNSEEN_FIST,
&CURIOUS_MEDICINE,
&TRANSISTOR,
&DRAGON_S_MAW,
&CHILLING_NEIGH,
&GRIM_NEIGH,
&AS_ONE_ICE_RIDER,
&AS_ONE_SHADOW_RIDER,
&LINGERING_AROMA,
&SEED_SOWER,
&THERMAL_EXCHANGE,
&ANGER_SHELL,
&PURIFYING_SALT,
&WELL_BAKED_BODY,
&WIND_RIDER,
&GUARD_DOG,
&ROCKY_PAYLOAD,
&WIND_POWER,
&ZERO_TO_HERO,
&COMMANDER,
&ELECTROMORPHOSIS,
&PROTOSYNTHESIS,
&QUARK_DRIVE,
&GOOD_AS_GOLD,
&VESSEL_OF_RUIN,
&SWORD_OF_RUIN,
&TABLETS_OF_RUIN,
&BEADS_OF_RUIN,
&ORICHALCUM_PULSE,
&HADRON_ENGINE,
&OPPORTUNIST,
&CUD_CHEW,
&SHARPNESS,
&SUPREME_OVERLORD,
&COSTAR,
&TOXIC_DEBRIS,
&ARMOR_TAIL,
&EARTH_EATER,
&MYCELIUM_MIGHT,
&HOSPITALITY,
&MIND_S_EYE,
&EMBODY_ASPECT_SPEED,
&EMBODY_ASPECT_SP_DEF,
&EMBODY_ASPECT_ATK,
&EMBODY_ASPECT_DEF,
&TOXIC_CHAIN,
&SUPERSWEET_SYRUP,
&TERA_SHIFT,
&TERA_SHELL,
&TERAFORM_ZERO,
&POISON_PUPPETEER];