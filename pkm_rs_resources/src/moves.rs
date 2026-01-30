use std::num::NonZeroU16;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use pkm_rs_types::{Generation, PkmType};
use serde::{Serialize, Serializer};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, PartialEq, Eq, Clone, Copy)]
pub struct MoveSlot(Option<NonZeroU16>);

impl MoveSlot {
    pub fn get_metadata(&self) -> Option<&'static MoveMetadata> {
        self.0.map(|idx| ALL_MOVES[(idx.get() - 1) as usize])
    }

    pub fn from_u16(value: u16) -> Self {
        Self(NonZeroU16::try_from(value).ok())
    }

    pub fn from_le_bytes(bytes: [u8; 2]) -> Self {
        Self(NonZeroU16::try_from(u16::from_le_bytes(bytes)).ok())
    }

    pub fn to_le_bytes(self) -> [u8; 2] {
        self.0.map(NonZeroU16::get).unwrap_or(0u16).to_le_bytes()
    }

    pub const fn empty() -> Self {
        Self(None)
    }

    pub const fn is_empty(&self) -> bool {
        self.0.is_none()
    }
}

impl Serialize for MoveSlot {
    fn serialize<S>(&self, serializer: S) -> core::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(match self.get_metadata() {
            None => "<empty>",
            Some(metadata) => metadata.name,
        })
    }
}

impl From<u16> for MoveSlot {
    fn from(value: u16) -> Self {
        Self(NonZeroU16::try_from(value).ok())
    }
}

impl From<MoveSlot> for u16 {
    fn from(val: MoveSlot) -> Self {
        match val.0 {
            None => 0,
            Some(idx) => idx.get(),
        }
    }
}

pub struct MoveMetadata {
    pub id: u16,
    pub name: &'static str,
    pub accuracy: Option<u8>,
    pub class: MoveClass,
    pub introduced: Generation,
    pub power: Option<u8>,
    pub pp: u8,
    pub pkm_type: PkmType,
}

impl MoveMetadata {
    pub const fn get_name(&self) -> &'static str {
        self.name
    }
}

pub enum MoveClass {
    Physical,
    Special,
    Status,
}

const POUND: MoveMetadata = MoveMetadata {
    id: 1,
    name: "Pound",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(40),
    pp: 35,
    pkm_type: PkmType::Normal,
};

const KARATE_CHOP: MoveMetadata = MoveMetadata {
    id: 2,
    name: "Karate Chop",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(50),
    pp: 25,
    pkm_type: PkmType::Fighting,
};

const DOUBLE_SLAP: MoveMetadata = MoveMetadata {
    id: 3,
    name: "Double Slap",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(15),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const COMET_PUNCH: MoveMetadata = MoveMetadata {
    id: 4,
    name: "Comet Punch",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(18),
    pp: 15,
    pkm_type: PkmType::Normal,
};

const MEGA_PUNCH: MoveMetadata = MoveMetadata {
    id: 5,
    name: "Mega Punch",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(80),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const PAY_DAY: MoveMetadata = MoveMetadata {
    id: 6,
    name: "Pay Day",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(40),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const FIRE_PUNCH: MoveMetadata = MoveMetadata {
    id: 7,
    name: "Fire Punch",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(75),
    pp: 15,
    pkm_type: PkmType::Fire,
};

const ICE_PUNCH: MoveMetadata = MoveMetadata {
    id: 8,
    name: "Ice Punch",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(75),
    pp: 15,
    pkm_type: PkmType::Ice,
};

const THUNDER_PUNCH: MoveMetadata = MoveMetadata {
    id: 9,
    name: "Thunder Punch",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(75),
    pp: 15,
    pkm_type: PkmType::Electric,
};

const SCRATCH: MoveMetadata = MoveMetadata {
    id: 10,
    name: "Scratch",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(40),
    pp: 35,
    pkm_type: PkmType::Normal,
};

const VISE_GRIP: MoveMetadata = MoveMetadata {
    id: 11,
    name: "Vise Grip",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(55),
    pp: 30,
    pkm_type: PkmType::Normal,
};

const GUILLOTINE: MoveMetadata = MoveMetadata {
    id: 12,
    name: "Guillotine",
    accuracy: Some(30),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const RAZOR_WIND: MoveMetadata = MoveMetadata {
    id: 13,
    name: "Razor Wind",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const SWORDS_DANCE: MoveMetadata = MoveMetadata {
    id: 14,
    name: "Swords Dance",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const CUT: MoveMetadata = MoveMetadata {
    id: 15,
    name: "Cut",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(50),
    pp: 30,
    pkm_type: PkmType::Normal,
};

const GUST: MoveMetadata = MoveMetadata {
    id: 16,
    name: "Gust",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(40),
    pp: 35,
    pkm_type: PkmType::Flying,
};

const WING_ATTACK: MoveMetadata = MoveMetadata {
    id: 17,
    name: "Wing Attack",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(60),
    pp: 35,
    pkm_type: PkmType::Flying,
};

const WHIRLWIND: MoveMetadata = MoveMetadata {
    id: 18,
    name: "Whirlwind",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const FLY: MoveMetadata = MoveMetadata {
    id: 19,
    name: "Fly",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(90),
    pp: 15,
    pkm_type: PkmType::Flying,
};

const BIND: MoveMetadata = MoveMetadata {
    id: 20,
    name: "Bind",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(15),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const SLAM: MoveMetadata = MoveMetadata {
    id: 21,
    name: "Slam",
    accuracy: Some(75),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(80),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const VINE_WHIP: MoveMetadata = MoveMetadata {
    id: 22,
    name: "Vine Whip",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(45),
    pp: 25,
    pkm_type: PkmType::Grass,
};

const STOMP: MoveMetadata = MoveMetadata {
    id: 23,
    name: "Stomp",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(65),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const DOUBLE_KICK: MoveMetadata = MoveMetadata {
    id: 24,
    name: "Double Kick",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(30),
    pp: 30,
    pkm_type: PkmType::Fighting,
};

const MEGA_KICK: MoveMetadata = MoveMetadata {
    id: 25,
    name: "Mega Kick",
    accuracy: Some(75),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Normal,
};

const JUMP_KICK: MoveMetadata = MoveMetadata {
    id: 26,
    name: "Jump Kick",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const ROLLING_KICK: MoveMetadata = MoveMetadata {
    id: 27,
    name: "Rolling Kick",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(60),
    pp: 15,
    pkm_type: PkmType::Fighting,
};

const SAND_ATTACK: MoveMetadata = MoveMetadata {
    id: 28,
    name: "Sand Attack",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 15,
    pkm_type: PkmType::Ground,
};

const HEADBUTT: MoveMetadata = MoveMetadata {
    id: 29,
    name: "Headbutt",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(70),
    pp: 15,
    pkm_type: PkmType::Normal,
};

const HORN_ATTACK: MoveMetadata = MoveMetadata {
    id: 30,
    name: "Horn Attack",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(65),
    pp: 25,
    pkm_type: PkmType::Normal,
};

const FURY_ATTACK: MoveMetadata = MoveMetadata {
    id: 31,
    name: "Fury Attack",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(15),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const HORN_DRILL: MoveMetadata = MoveMetadata {
    id: 32,
    name: "Horn Drill",
    accuracy: Some(30),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const TACKLE: MoveMetadata = MoveMetadata {
    id: 33,
    name: "Tackle",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(40),
    pp: 35,
    pkm_type: PkmType::Normal,
};

const BODY_SLAM: MoveMetadata = MoveMetadata {
    id: 34,
    name: "Body Slam",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(85),
    pp: 15,
    pkm_type: PkmType::Normal,
};

const WRAP: MoveMetadata = MoveMetadata {
    id: 35,
    name: "Wrap",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(15),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const TAKE_DOWN: MoveMetadata = MoveMetadata {
    id: 36,
    name: "Take Down",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(90),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const THRASH: MoveMetadata = MoveMetadata {
    id: 37,
    name: "Thrash",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const DOUBLE_EDGE: MoveMetadata = MoveMetadata {
    id: 38,
    name: "Double-Edge",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(120),
    pp: 15,
    pkm_type: PkmType::Normal,
};

const TAIL_WHIP: MoveMetadata = MoveMetadata {
    id: 39,
    name: "Tail Whip",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 30,
    pkm_type: PkmType::Normal,
};

const POISON_STING: MoveMetadata = MoveMetadata {
    id: 40,
    name: "Poison Sting",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(15),
    pp: 35,
    pkm_type: PkmType::Poison,
};

const TWINEEDLE: MoveMetadata = MoveMetadata {
    id: 41,
    name: "Twineedle",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(25),
    pp: 20,
    pkm_type: PkmType::Bug,
};

const PIN_MISSILE: MoveMetadata = MoveMetadata {
    id: 42,
    name: "Pin Missile",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(25),
    pp: 20,
    pkm_type: PkmType::Bug,
};

const LEER: MoveMetadata = MoveMetadata {
    id: 43,
    name: "Leer",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 30,
    pkm_type: PkmType::Normal,
};

const BITE: MoveMetadata = MoveMetadata {
    id: 44,
    name: "Bite",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(60),
    pp: 25,
    pkm_type: PkmType::Dark,
};

const GROWL: MoveMetadata = MoveMetadata {
    id: 45,
    name: "Growl",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 40,
    pkm_type: PkmType::Normal,
};

const ROAR: MoveMetadata = MoveMetadata {
    id: 46,
    name: "Roar",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const SING: MoveMetadata = MoveMetadata {
    id: 47,
    name: "Sing",
    accuracy: Some(55),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 15,
    pkm_type: PkmType::Normal,
};

const SUPERSONIC: MoveMetadata = MoveMetadata {
    id: 48,
    name: "Supersonic",
    accuracy: Some(55),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const SONIC_BOOM: MoveMetadata = MoveMetadata {
    id: 49,
    name: "Sonic Boom",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const DISABLE: MoveMetadata = MoveMetadata {
    id: 50,
    name: "Disable",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const ACID: MoveMetadata = MoveMetadata {
    id: 51,
    name: "Acid",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(40),
    pp: 30,
    pkm_type: PkmType::Poison,
};

const EMBER: MoveMetadata = MoveMetadata {
    id: 52,
    name: "Ember",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(40),
    pp: 25,
    pkm_type: PkmType::Fire,
};

const FLAMETHROWER: MoveMetadata = MoveMetadata {
    id: 53,
    name: "Flamethrower",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(90),
    pp: 15,
    pkm_type: PkmType::Fire,
};

const MIST: MoveMetadata = MoveMetadata {
    id: 54,
    name: "Mist",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 30,
    pkm_type: PkmType::Ice,
};

const WATER_GUN: MoveMetadata = MoveMetadata {
    id: 55,
    name: "Water Gun",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(40),
    pp: 25,
    pkm_type: PkmType::Water,
};

const HYDRO_PUMP: MoveMetadata = MoveMetadata {
    id: 56,
    name: "Hydro Pump",
    accuracy: Some(80),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(110),
    pp: 5,
    pkm_type: PkmType::Water,
};

const SURF: MoveMetadata = MoveMetadata {
    id: 57,
    name: "Surf",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(90),
    pp: 15,
    pkm_type: PkmType::Water,
};

const ICE_BEAM: MoveMetadata = MoveMetadata {
    id: 58,
    name: "Ice Beam",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Ice,
};

const BLIZZARD: MoveMetadata = MoveMetadata {
    id: 59,
    name: "Blizzard",
    accuracy: Some(70),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(110),
    pp: 5,
    pkm_type: PkmType::Ice,
};

const PSYBEAM: MoveMetadata = MoveMetadata {
    id: 60,
    name: "Psybeam",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(65),
    pp: 20,
    pkm_type: PkmType::Psychic,
};

const BUBBLE_BEAM: MoveMetadata = MoveMetadata {
    id: 61,
    name: "Bubble Beam",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(65),
    pp: 20,
    pkm_type: PkmType::Water,
};

const AURORA_BEAM: MoveMetadata = MoveMetadata {
    id: 62,
    name: "Aurora Beam",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(65),
    pp: 20,
    pkm_type: PkmType::Ice,
};

const HYPER_BEAM: MoveMetadata = MoveMetadata {
    id: 63,
    name: "Hyper Beam",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Normal,
};

const PECK: MoveMetadata = MoveMetadata {
    id: 64,
    name: "Peck",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(35),
    pp: 35,
    pkm_type: PkmType::Flying,
};

const DRILL_PECK: MoveMetadata = MoveMetadata {
    id: 65,
    name: "Drill Peck",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(80),
    pp: 20,
    pkm_type: PkmType::Flying,
};

const SUBMISSION: MoveMetadata = MoveMetadata {
    id: 66,
    name: "Submission",
    accuracy: Some(80),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(80),
    pp: 20,
    pkm_type: PkmType::Fighting,
};

const LOW_KICK: MoveMetadata = MoveMetadata {
    id: 67,
    name: "Low Kick",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Fighting,
};

const COUNTER: MoveMetadata = MoveMetadata {
    id: 68,
    name: "Counter",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Fighting,
};

const SEISMIC_TOSS: MoveMetadata = MoveMetadata {
    id: 69,
    name: "Seismic Toss",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Fighting,
};

const STRENGTH: MoveMetadata = MoveMetadata {
    id: 70,
    name: "Strength",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Normal,
};

const ABSORB: MoveMetadata = MoveMetadata {
    id: 71,
    name: "Absorb",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(20),
    pp: 25,
    pkm_type: PkmType::Grass,
};

const MEGA_DRAIN: MoveMetadata = MoveMetadata {
    id: 72,
    name: "Mega Drain",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(40),
    pp: 15,
    pkm_type: PkmType::Grass,
};

const LEECH_SEED: MoveMetadata = MoveMetadata {
    id: 73,
    name: "Leech Seed",
    accuracy: Some(90),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 10,
    pkm_type: PkmType::Grass,
};

const GROWTH: MoveMetadata = MoveMetadata {
    id: 74,
    name: "Growth",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const RAZOR_LEAF: MoveMetadata = MoveMetadata {
    id: 75,
    name: "Razor Leaf",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(55),
    pp: 25,
    pkm_type: PkmType::Grass,
};

const SOLAR_BEAM: MoveMetadata = MoveMetadata {
    id: 76,
    name: "Solar Beam",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const POISON_POWDER: MoveMetadata = MoveMetadata {
    id: 77,
    name: "Poison Powder",
    accuracy: Some(75),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 35,
    pkm_type: PkmType::Poison,
};

const STUN_SPORE: MoveMetadata = MoveMetadata {
    id: 78,
    name: "Stun Spore",
    accuracy: Some(75),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 30,
    pkm_type: PkmType::Grass,
};

const SLEEP_POWDER: MoveMetadata = MoveMetadata {
    id: 79,
    name: "Sleep Powder",
    accuracy: Some(75),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 15,
    pkm_type: PkmType::Grass,
};

const PETAL_DANCE: MoveMetadata = MoveMetadata {
    id: 80,
    name: "Petal Dance",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const STRING_SHOT: MoveMetadata = MoveMetadata {
    id: 81,
    name: "String Shot",
    accuracy: Some(95),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 40,
    pkm_type: PkmType::Bug,
};

const DRAGON_RAGE: MoveMetadata = MoveMetadata {
    id: 82,
    name: "Dragon Rage",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: None,
    pp: 10,
    pkm_type: PkmType::Dragon,
};

const FIRE_SPIN: MoveMetadata = MoveMetadata {
    id: 83,
    name: "Fire Spin",
    accuracy: Some(85),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(35),
    pp: 15,
    pkm_type: PkmType::Fire,
};

const THUNDER_SHOCK: MoveMetadata = MoveMetadata {
    id: 84,
    name: "Thunder Shock",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(40),
    pp: 30,
    pkm_type: PkmType::Electric,
};

const THUNDERBOLT: MoveMetadata = MoveMetadata {
    id: 85,
    name: "Thunderbolt",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(90),
    pp: 15,
    pkm_type: PkmType::Electric,
};

const THUNDER_WAVE: MoveMetadata = MoveMetadata {
    id: 86,
    name: "Thunder Wave",
    accuracy: Some(90),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Electric,
};

const THUNDER: MoveMetadata = MoveMetadata {
    id: 87,
    name: "Thunder",
    accuracy: Some(70),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(110),
    pp: 10,
    pkm_type: PkmType::Electric,
};

const ROCK_THROW: MoveMetadata = MoveMetadata {
    id: 88,
    name: "Rock Throw",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(50),
    pp: 15,
    pkm_type: PkmType::Rock,
};

const EARTHQUAKE: MoveMetadata = MoveMetadata {
    id: 89,
    name: "Earthquake",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const FISSURE: MoveMetadata = MoveMetadata {
    id: 90,
    name: "Fissure",
    accuracy: Some(30),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: None,
    pp: 5,
    pkm_type: PkmType::Ground,
};

const DIG: MoveMetadata = MoveMetadata {
    id: 91,
    name: "Dig",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const TOXIC: MoveMetadata = MoveMetadata {
    id: 92,
    name: "Toxic",
    accuracy: Some(90),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 10,
    pkm_type: PkmType::Poison,
};

const CONFUSION: MoveMetadata = MoveMetadata {
    id: 93,
    name: "Confusion",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(50),
    pp: 25,
    pkm_type: PkmType::Psychic,
};

const PSYCHIC: MoveMetadata = MoveMetadata {
    id: 94,
    name: "Psychic",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const HYPNOSIS: MoveMetadata = MoveMetadata {
    id: 95,
    name: "Hypnosis",
    accuracy: Some(60),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Psychic,
};

const MEDITATE: MoveMetadata = MoveMetadata {
    id: 96,
    name: "Meditate",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 40,
    pkm_type: PkmType::Psychic,
};

const AGILITY: MoveMetadata = MoveMetadata {
    id: 97,
    name: "Agility",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 30,
    pkm_type: PkmType::Psychic,
};

const QUICK_ATTACK: MoveMetadata = MoveMetadata {
    id: 98,
    name: "Quick Attack",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(40),
    pp: 30,
    pkm_type: PkmType::Normal,
};

const RAGE: MoveMetadata = MoveMetadata {
    id: 99,
    name: "Rage",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(20),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const TELEPORT: MoveMetadata = MoveMetadata {
    id: 100,
    name: "Teleport",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Psychic,
};

const NIGHT_SHADE: MoveMetadata = MoveMetadata {
    id: 101,
    name: "Night Shade",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: None,
    pp: 15,
    pkm_type: PkmType::Ghost,
};

const MIMIC: MoveMetadata = MoveMetadata {
    id: 102,
    name: "Mimic",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const SCREECH: MoveMetadata = MoveMetadata {
    id: 103,
    name: "Screech",
    accuracy: Some(85),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 40,
    pkm_type: PkmType::Normal,
};

const DOUBLE_TEAM: MoveMetadata = MoveMetadata {
    id: 104,
    name: "Double Team",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 15,
    pkm_type: PkmType::Normal,
};

const RECOVER: MoveMetadata = MoveMetadata {
    id: 105,
    name: "Recover",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const HARDEN: MoveMetadata = MoveMetadata {
    id: 106,
    name: "Harden",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 30,
    pkm_type: PkmType::Normal,
};

const MINIMIZE: MoveMetadata = MoveMetadata {
    id: 107,
    name: "Minimize",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const SMOKESCREEN: MoveMetadata = MoveMetadata {
    id: 108,
    name: "Smokescreen",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const CONFUSE_RAY: MoveMetadata = MoveMetadata {
    id: 109,
    name: "Confuse Ray",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 10,
    pkm_type: PkmType::Ghost,
};

const WITHDRAW: MoveMetadata = MoveMetadata {
    id: 110,
    name: "Withdraw",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 40,
    pkm_type: PkmType::Water,
};

const DEFENSE_CURL: MoveMetadata = MoveMetadata {
    id: 111,
    name: "Defense Curl",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 40,
    pkm_type: PkmType::Normal,
};

const BARRIER: MoveMetadata = MoveMetadata {
    id: 112,
    name: "Barrier",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Psychic,
};

const LIGHT_SCREEN: MoveMetadata = MoveMetadata {
    id: 113,
    name: "Light Screen",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 30,
    pkm_type: PkmType::Psychic,
};

const HAZE: MoveMetadata = MoveMetadata {
    id: 114,
    name: "Haze",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 30,
    pkm_type: PkmType::Ice,
};

const REFLECT: MoveMetadata = MoveMetadata {
    id: 115,
    name: "Reflect",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Psychic,
};

const FOCUS_ENERGY: MoveMetadata = MoveMetadata {
    id: 116,
    name: "Focus Energy",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 30,
    pkm_type: PkmType::Normal,
};

const BIDE: MoveMetadata = MoveMetadata {
    id: 117,
    name: "Bide",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const METRONOME: MoveMetadata = MoveMetadata {
    id: 118,
    name: "Metronome",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const MIRROR_MOVE: MoveMetadata = MoveMetadata {
    id: 119,
    name: "Mirror Move",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Flying,
};

const SELF_DESTRUCT: MoveMetadata = MoveMetadata {
    id: 120,
    name: "Self-Destruct",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(200),
    pp: 5,
    pkm_type: PkmType::Normal,
};

const EGG_BOMB: MoveMetadata = MoveMetadata {
    id: 121,
    name: "Egg Bomb",
    accuracy: Some(75),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const LICK: MoveMetadata = MoveMetadata {
    id: 122,
    name: "Lick",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(30),
    pp: 30,
    pkm_type: PkmType::Ghost,
};

const SMOG: MoveMetadata = MoveMetadata {
    id: 123,
    name: "Smog",
    accuracy: Some(70),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(30),
    pp: 20,
    pkm_type: PkmType::Poison,
};

const SLUDGE: MoveMetadata = MoveMetadata {
    id: 124,
    name: "Sludge",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(65),
    pp: 20,
    pkm_type: PkmType::Poison,
};

const BONE_CLUB: MoveMetadata = MoveMetadata {
    id: 125,
    name: "Bone Club",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(65),
    pp: 20,
    pkm_type: PkmType::Ground,
};

const FIRE_BLAST: MoveMetadata = MoveMetadata {
    id: 126,
    name: "Fire Blast",
    accuracy: Some(85),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(110),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const WATERFALL: MoveMetadata = MoveMetadata {
    id: 127,
    name: "Waterfall",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Water,
};

const CLAMP: MoveMetadata = MoveMetadata {
    id: 128,
    name: "Clamp",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(35),
    pp: 15,
    pkm_type: PkmType::Water,
};

const SWIFT: MoveMetadata = MoveMetadata {
    id: 129,
    name: "Swift",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const SKULL_BASH: MoveMetadata = MoveMetadata {
    id: 130,
    name: "Skull Bash",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(130),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const SPIKE_CANNON: MoveMetadata = MoveMetadata {
    id: 131,
    name: "Spike Cannon",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(20),
    pp: 15,
    pkm_type: PkmType::Normal,
};

const CONSTRICT: MoveMetadata = MoveMetadata {
    id: 132,
    name: "Constrict",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(10),
    pp: 35,
    pkm_type: PkmType::Normal,
};

const AMNESIA: MoveMetadata = MoveMetadata {
    id: 133,
    name: "Amnesia",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Psychic,
};

const KINESIS: MoveMetadata = MoveMetadata {
    id: 134,
    name: "Kinesis",
    accuracy: Some(80),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 15,
    pkm_type: PkmType::Psychic,
};

const SOFT_BOILED: MoveMetadata = MoveMetadata {
    id: 135,
    name: "Soft-Boiled",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const HIGH_JUMP_KICK: MoveMetadata = MoveMetadata {
    id: 136,
    name: "High Jump Kick",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(130),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const GLARE: MoveMetadata = MoveMetadata {
    id: 137,
    name: "Glare",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 30,
    pkm_type: PkmType::Normal,
};

const DREAM_EATER: MoveMetadata = MoveMetadata {
    id: 138,
    name: "Dream Eater",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(100),
    pp: 15,
    pkm_type: PkmType::Psychic,
};

const POISON_GAS: MoveMetadata = MoveMetadata {
    id: 139,
    name: "Poison Gas",
    accuracy: Some(90),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 40,
    pkm_type: PkmType::Poison,
};

const BARRAGE: MoveMetadata = MoveMetadata {
    id: 140,
    name: "Barrage",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(15),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const LEECH_LIFE: MoveMetadata = MoveMetadata {
    id: 141,
    name: "Leech Life",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Bug,
};

const LOVELY_KISS: MoveMetadata = MoveMetadata {
    id: 142,
    name: "Lovely Kiss",
    accuracy: Some(75),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const SKY_ATTACK: MoveMetadata = MoveMetadata {
    id: 143,
    name: "Sky Attack",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(140),
    pp: 5,
    pkm_type: PkmType::Flying,
};

const TRANSFORM: MoveMetadata = MoveMetadata {
    id: 144,
    name: "Transform",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const BUBBLE: MoveMetadata = MoveMetadata {
    id: 145,
    name: "Bubble",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(40),
    pp: 30,
    pkm_type: PkmType::Water,
};

const DIZZY_PUNCH: MoveMetadata = MoveMetadata {
    id: 146,
    name: "Dizzy Punch",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(70),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const SPORE: MoveMetadata = MoveMetadata {
    id: 147,
    name: "Spore",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 15,
    pkm_type: PkmType::Grass,
};

const FLASH: MoveMetadata = MoveMetadata {
    id: 148,
    name: "Flash",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const PSYWAVE: MoveMetadata = MoveMetadata {
    id: 149,
    name: "Psywave",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: None,
    pp: 15,
    pkm_type: PkmType::Psychic,
};

const SPLASH: MoveMetadata = MoveMetadata {
    id: 150,
    name: "Splash",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 40,
    pkm_type: PkmType::Normal,
};

const ACID_ARMOR: MoveMetadata = MoveMetadata {
    id: 151,
    name: "Acid Armor",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 20,
    pkm_type: PkmType::Poison,
};

const CRABHAMMER: MoveMetadata = MoveMetadata {
    id: 152,
    name: "Crabhammer",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Water,
};

const EXPLOSION: MoveMetadata = MoveMetadata {
    id: 153,
    name: "Explosion",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(250),
    pp: 5,
    pkm_type: PkmType::Normal,
};

const FURY_SWIPES: MoveMetadata = MoveMetadata {
    id: 154,
    name: "Fury Swipes",
    accuracy: Some(80),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(18),
    pp: 15,
    pkm_type: PkmType::Normal,
};

const BONEMERANG: MoveMetadata = MoveMetadata {
    id: 155,
    name: "Bonemerang",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(50),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const REST: MoveMetadata = MoveMetadata {
    id: 156,
    name: "Rest",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 5,
    pkm_type: PkmType::Psychic,
};

const ROCK_SLIDE: MoveMetadata = MoveMetadata {
    id: 157,
    name: "Rock Slide",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(75),
    pp: 10,
    pkm_type: PkmType::Rock,
};

const HYPER_FANG: MoveMetadata = MoveMetadata {
    id: 158,
    name: "Hyper Fang",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Normal,
};

const SHARPEN: MoveMetadata = MoveMetadata {
    id: 159,
    name: "Sharpen",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 30,
    pkm_type: PkmType::Normal,
};

const CONVERSION: MoveMetadata = MoveMetadata {
    id: 160,
    name: "Conversion",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 30,
    pkm_type: PkmType::Normal,
};

const TRI_ATTACK: MoveMetadata = MoveMetadata {
    id: 161,
    name: "Tri Attack",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G1,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const SUPER_FANG: MoveMetadata = MoveMetadata {
    id: 162,
    name: "Super Fang",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const SLASH: MoveMetadata = MoveMetadata {
    id: 163,
    name: "Slash",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(70),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const SUBSTITUTE: MoveMetadata = MoveMetadata {
    id: 164,
    name: "Substitute",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G1,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const STRUGGLE: MoveMetadata = MoveMetadata {
    id: 165,
    name: "Struggle",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G1,
    power: Some(50),
    pp: 1,
    pkm_type: PkmType::Normal,
};

const SKETCH: MoveMetadata = MoveMetadata {
    id: 166,
    name: "Sketch",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 1,
    pkm_type: PkmType::Normal,
};

const TRIPLE_KICK: MoveMetadata = MoveMetadata {
    id: 167,
    name: "Triple Kick",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const THIEF: MoveMetadata = MoveMetadata {
    id: 168,
    name: "Thief",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(60),
    pp: 25,
    pkm_type: PkmType::Dark,
};

const SPIDER_WEB: MoveMetadata = MoveMetadata {
    id: 169,
    name: "Spider Web",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 10,
    pkm_type: PkmType::Bug,
};

const MIND_READER: MoveMetadata = MoveMetadata {
    id: 170,
    name: "Mind Reader",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const NIGHTMARE: MoveMetadata = MoveMetadata {
    id: 171,
    name: "Nightmare",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 15,
    pkm_type: PkmType::Ghost,
};

const FLAME_WHEEL: MoveMetadata = MoveMetadata {
    id: 172,
    name: "Flame Wheel",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(60),
    pp: 25,
    pkm_type: PkmType::Fire,
};

const SNORE: MoveMetadata = MoveMetadata {
    id: 173,
    name: "Snore",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(50),
    pp: 15,
    pkm_type: PkmType::Normal,
};

const CURSE: MoveMetadata = MoveMetadata {
    id: 174,
    name: "Curse",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 10,
    pkm_type: PkmType::Ghost,
};

const FLAIL: MoveMetadata = MoveMetadata {
    id: 175,
    name: "Flail",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: None,
    pp: 15,
    pkm_type: PkmType::Normal,
};

const CONVERSION_2: MoveMetadata = MoveMetadata {
    id: 176,
    name: "Conversion 2",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 30,
    pkm_type: PkmType::Normal,
};

const AEROBLAST: MoveMetadata = MoveMetadata {
    id: 177,
    name: "Aeroblast",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Flying,
};

const COTTON_SPORE: MoveMetadata = MoveMetadata {
    id: 178,
    name: "Cotton Spore",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 40,
    pkm_type: PkmType::Grass,
};

const REVERSAL: MoveMetadata = MoveMetadata {
    id: 179,
    name: "Reversal",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: None,
    pp: 15,
    pkm_type: PkmType::Fighting,
};

const SPITE: MoveMetadata = MoveMetadata {
    id: 180,
    name: "Spite",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 10,
    pkm_type: PkmType::Ghost,
};

const POWDER_SNOW: MoveMetadata = MoveMetadata {
    id: 181,
    name: "Powder Snow",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(40),
    pp: 25,
    pkm_type: PkmType::Ice,
};

const PROTECT: MoveMetadata = MoveMetadata {
    id: 182,
    name: "Protect",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const MACH_PUNCH: MoveMetadata = MoveMetadata {
    id: 183,
    name: "Mach Punch",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(40),
    pp: 30,
    pkm_type: PkmType::Fighting,
};

const SCARY_FACE: MoveMetadata = MoveMetadata {
    id: 184,
    name: "Scary Face",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const FEINT_ATTACK: MoveMetadata = MoveMetadata {
    id: 185,
    name: "Feint Attack",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Dark,
};

const SWEET_KISS: MoveMetadata = MoveMetadata {
    id: 186,
    name: "Sweet Kiss",
    accuracy: Some(75),
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const BELLY_DRUM: MoveMetadata = MoveMetadata {
    id: 187,
    name: "Belly Drum",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const SLUDGE_BOMB: MoveMetadata = MoveMetadata {
    id: 188,
    name: "Sludge Bomb",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Poison,
};

const MUD_SLAP: MoveMetadata = MoveMetadata {
    id: 189,
    name: "Mud-Slap",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(20),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const OCTAZOOKA: MoveMetadata = MoveMetadata {
    id: 190,
    name: "Octazooka",
    accuracy: Some(85),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(65),
    pp: 10,
    pkm_type: PkmType::Water,
};

const SPIKES: MoveMetadata = MoveMetadata {
    id: 191,
    name: "Spikes",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 20,
    pkm_type: PkmType::Ground,
};

const ZAP_CANNON: MoveMetadata = MoveMetadata {
    id: 192,
    name: "Zap Cannon",
    accuracy: Some(50),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Electric,
};

const FORESIGHT: MoveMetadata = MoveMetadata {
    id: 193,
    name: "Foresight",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 40,
    pkm_type: PkmType::Normal,
};

const DESTINY_BOND: MoveMetadata = MoveMetadata {
    id: 194,
    name: "Destiny Bond",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 5,
    pkm_type: PkmType::Ghost,
};

const PERISH_SONG: MoveMetadata = MoveMetadata {
    id: 195,
    name: "Perish Song",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const ICY_WIND: MoveMetadata = MoveMetadata {
    id: 196,
    name: "Icy Wind",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(55),
    pp: 15,
    pkm_type: PkmType::Ice,
};

const DETECT: MoveMetadata = MoveMetadata {
    id: 197,
    name: "Detect",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 5,
    pkm_type: PkmType::Fighting,
};

const BONE_RUSH: MoveMetadata = MoveMetadata {
    id: 198,
    name: "Bone Rush",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(25),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const LOCK_ON: MoveMetadata = MoveMetadata {
    id: 199,
    name: "Lock-On",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const OUTRAGE: MoveMetadata = MoveMetadata {
    id: 200,
    name: "Outrage",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Dragon,
};

const SANDSTORM: MoveMetadata = MoveMetadata {
    id: 201,
    name: "Sandstorm",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 10,
    pkm_type: PkmType::Rock,
};

const GIGA_DRAIN: MoveMetadata = MoveMetadata {
    id: 202,
    name: "Giga Drain",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(75),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const ENDURE: MoveMetadata = MoveMetadata {
    id: 203,
    name: "Endure",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const CHARM: MoveMetadata = MoveMetadata {
    id: 204,
    name: "Charm",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 20,
    pkm_type: PkmType::Fairy,
};

const ROLLOUT: MoveMetadata = MoveMetadata {
    id: 205,
    name: "Rollout",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(30),
    pp: 20,
    pkm_type: PkmType::Rock,
};

const FALSE_SWIPE: MoveMetadata = MoveMetadata {
    id: 206,
    name: "False Swipe",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(40),
    pp: 40,
    pkm_type: PkmType::Normal,
};

const SWAGGER: MoveMetadata = MoveMetadata {
    id: 207,
    name: "Swagger",
    accuracy: Some(85),
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 15,
    pkm_type: PkmType::Normal,
};

const MILK_DRINK: MoveMetadata = MoveMetadata {
    id: 208,
    name: "Milk Drink",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const SPARK: MoveMetadata = MoveMetadata {
    id: 209,
    name: "Spark",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(65),
    pp: 20,
    pkm_type: PkmType::Electric,
};

const FURY_CUTTER: MoveMetadata = MoveMetadata {
    id: 210,
    name: "Fury Cutter",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(40),
    pp: 20,
    pkm_type: PkmType::Bug,
};

const STEEL_WING: MoveMetadata = MoveMetadata {
    id: 211,
    name: "Steel Wing",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(70),
    pp: 25,
    pkm_type: PkmType::Steel,
};

const MEAN_LOOK: MoveMetadata = MoveMetadata {
    id: 212,
    name: "Mean Look",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const ATTRACT: MoveMetadata = MoveMetadata {
    id: 213,
    name: "Attract",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 15,
    pkm_type: PkmType::Normal,
};

const SLEEP_TALK: MoveMetadata = MoveMetadata {
    id: 214,
    name: "Sleep Talk",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const HEAL_BELL: MoveMetadata = MoveMetadata {
    id: 215,
    name: "Heal Bell",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const RETURN: MoveMetadata = MoveMetadata {
    id: 216,
    name: "Return",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const PRESENT: MoveMetadata = MoveMetadata {
    id: 217,
    name: "Present",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: None,
    pp: 15,
    pkm_type: PkmType::Normal,
};

const FRUSTRATION: MoveMetadata = MoveMetadata {
    id: 218,
    name: "Frustration",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const SAFEGUARD: MoveMetadata = MoveMetadata {
    id: 219,
    name: "Safeguard",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 25,
    pkm_type: PkmType::Normal,
};

const PAIN_SPLIT: MoveMetadata = MoveMetadata {
    id: 220,
    name: "Pain Split",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const SACRED_FIRE: MoveMetadata = MoveMetadata {
    id: 221,
    name: "Sacred Fire",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const MAGNITUDE: MoveMetadata = MoveMetadata {
    id: 222,
    name: "Magnitude",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: None,
    pp: 30,
    pkm_type: PkmType::Ground,
};

const DYNAMIC_PUNCH: MoveMetadata = MoveMetadata {
    id: 223,
    name: "Dynamic Punch",
    accuracy: Some(50),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Fighting,
};

const MEGAHORN: MoveMetadata = MoveMetadata {
    id: 224,
    name: "Megahorn",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Bug,
};

const DRAGON_BREATH: MoveMetadata = MoveMetadata {
    id: 225,
    name: "Dragon Breath",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Dragon,
};

const BATON_PASS: MoveMetadata = MoveMetadata {
    id: 226,
    name: "Baton Pass",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 40,
    pkm_type: PkmType::Normal,
};

const ENCORE: MoveMetadata = MoveMetadata {
    id: 227,
    name: "Encore",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const PURSUIT: MoveMetadata = MoveMetadata {
    id: 228,
    name: "Pursuit",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(40),
    pp: 20,
    pkm_type: PkmType::Dark,
};

const RAPID_SPIN: MoveMetadata = MoveMetadata {
    id: 229,
    name: "Rapid Spin",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(50),
    pp: 40,
    pkm_type: PkmType::Normal,
};

const SWEET_SCENT: MoveMetadata = MoveMetadata {
    id: 230,
    name: "Sweet Scent",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const IRON_TAIL: MoveMetadata = MoveMetadata {
    id: 231,
    name: "Iron Tail",
    accuracy: Some(75),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(100),
    pp: 15,
    pkm_type: PkmType::Steel,
};

const METAL_CLAW: MoveMetadata = MoveMetadata {
    id: 232,
    name: "Metal Claw",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(50),
    pp: 35,
    pkm_type: PkmType::Steel,
};

const VITAL_THROW: MoveMetadata = MoveMetadata {
    id: 233,
    name: "Vital Throw",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(70),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const MORNING_SUN: MoveMetadata = MoveMetadata {
    id: 234,
    name: "Morning Sun",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const SYNTHESIS: MoveMetadata = MoveMetadata {
    id: 235,
    name: "Synthesis",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 5,
    pkm_type: PkmType::Grass,
};

const MOONLIGHT: MoveMetadata = MoveMetadata {
    id: 236,
    name: "Moonlight",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 5,
    pkm_type: PkmType::Fairy,
};

const HIDDEN_POWER: MoveMetadata = MoveMetadata {
    id: 237,
    name: "Hidden Power",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(60),
    pp: 15,
    pkm_type: PkmType::Normal,
};

const CROSS_CHOP: MoveMetadata = MoveMetadata {
    id: 238,
    name: "Cross Chop",
    accuracy: Some(80),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Fighting,
};

const TWISTER: MoveMetadata = MoveMetadata {
    id: 239,
    name: "Twister",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(40),
    pp: 20,
    pkm_type: PkmType::Dragon,
};

const RAIN_DANCE: MoveMetadata = MoveMetadata {
    id: 240,
    name: "Rain Dance",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 5,
    pkm_type: PkmType::Water,
};

const SUNNY_DAY: MoveMetadata = MoveMetadata {
    id: 241,
    name: "Sunny Day",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 5,
    pkm_type: PkmType::Fire,
};

const CRUNCH: MoveMetadata = MoveMetadata {
    id: 242,
    name: "Crunch",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Dark,
};

const MIRROR_COAT: MoveMetadata = MoveMetadata {
    id: 243,
    name: "Mirror Coat",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: None,
    pp: 20,
    pkm_type: PkmType::Psychic,
};

const PSYCH_UP: MoveMetadata = MoveMetadata {
    id: 244,
    name: "Psych Up",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G2,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const EXTREME_SPEED: MoveMetadata = MoveMetadata {
    id: 245,
    name: "Extreme Speed",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(80),
    pp: 5,
    pkm_type: PkmType::Normal,
};

const ANCIENT_POWER: MoveMetadata = MoveMetadata {
    id: 246,
    name: "Ancient Power",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(60),
    pp: 5,
    pkm_type: PkmType::Rock,
};

const SHADOW_BALL: MoveMetadata = MoveMetadata {
    id: 247,
    name: "Shadow Ball",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Ghost,
};

const FUTURE_SIGHT: MoveMetadata = MoveMetadata {
    id: 248,
    name: "Future Sight",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const ROCK_SMASH: MoveMetadata = MoveMetadata {
    id: 249,
    name: "Rock Smash",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: Some(40),
    pp: 15,
    pkm_type: PkmType::Fighting,
};

const WHIRLPOOL: MoveMetadata = MoveMetadata {
    id: 250,
    name: "Whirlpool",
    accuracy: Some(85),
    class: MoveClass::Special,
    introduced: Generation::G2,
    power: Some(35),
    pp: 15,
    pkm_type: PkmType::Water,
};

const BEAT_UP: MoveMetadata = MoveMetadata {
    id: 251,
    name: "Beat Up",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G2,
    power: None,
    pp: 10,
    pkm_type: PkmType::Dark,
};

const FAKE_OUT: MoveMetadata = MoveMetadata {
    id: 252,
    name: "Fake Out",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(40),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const UPROAR: MoveMetadata = MoveMetadata {
    id: 253,
    name: "Uproar",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const STOCKPILE: MoveMetadata = MoveMetadata {
    id: 254,
    name: "Stockpile",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const SPIT_UP: MoveMetadata = MoveMetadata {
    id: 255,
    name: "Spit Up",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const SWALLOW: MoveMetadata = MoveMetadata {
    id: 256,
    name: "Swallow",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const HEAT_WAVE: MoveMetadata = MoveMetadata {
    id: 257,
    name: "Heat Wave",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(95),
    pp: 10,
    pkm_type: PkmType::Fire,
};

const HAIL: MoveMetadata = MoveMetadata {
    id: 258,
    name: "Hail",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 10,
    pkm_type: PkmType::Ice,
};

const TORMENT: MoveMetadata = MoveMetadata {
    id: 259,
    name: "Torment",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 15,
    pkm_type: PkmType::Dark,
};

const FLATTER: MoveMetadata = MoveMetadata {
    id: 260,
    name: "Flatter",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 15,
    pkm_type: PkmType::Dark,
};

const WILL_O_WISP: MoveMetadata = MoveMetadata {
    id: 261,
    name: "Will-O-Wisp",
    accuracy: Some(85),
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 15,
    pkm_type: PkmType::Fire,
};

const MEMENTO: MoveMetadata = MoveMetadata {
    id: 262,
    name: "Memento",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 10,
    pkm_type: PkmType::Dark,
};

const FACADE: MoveMetadata = MoveMetadata {
    id: 263,
    name: "Facade",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(70),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const FOCUS_PUNCH: MoveMetadata = MoveMetadata {
    id: 264,
    name: "Focus Punch",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(150),
    pp: 20,
    pkm_type: PkmType::Fighting,
};

const SMELLING_SALTS: MoveMetadata = MoveMetadata {
    id: 265,
    name: "Smelling Salts",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(70),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const FOLLOW_ME: MoveMetadata = MoveMetadata {
    id: 266,
    name: "Follow Me",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const NATURE_POWER: MoveMetadata = MoveMetadata {
    id: 267,
    name: "Nature Power",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const CHARGE: MoveMetadata = MoveMetadata {
    id: 268,
    name: "Charge",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Electric,
};

const TAUNT: MoveMetadata = MoveMetadata {
    id: 269,
    name: "Taunt",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Dark,
};

const HELPING_HAND: MoveMetadata = MoveMetadata {
    id: 270,
    name: "Helping Hand",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const TRICK: MoveMetadata = MoveMetadata {
    id: 271,
    name: "Trick",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const ROLE_PLAY: MoveMetadata = MoveMetadata {
    id: 272,
    name: "Role Play",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const WISH: MoveMetadata = MoveMetadata {
    id: 273,
    name: "Wish",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const ASSIST: MoveMetadata = MoveMetadata {
    id: 274,
    name: "Assist",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const INGRAIN: MoveMetadata = MoveMetadata {
    id: 275,
    name: "Ingrain",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Grass,
};

const SUPERPOWER: MoveMetadata = MoveMetadata {
    id: 276,
    name: "Superpower",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Fighting,
};

const MAGIC_COAT: MoveMetadata = MoveMetadata {
    id: 277,
    name: "Magic Coat",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 15,
    pkm_type: PkmType::Psychic,
};

const RECYCLE: MoveMetadata = MoveMetadata {
    id: 278,
    name: "Recycle",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const REVENGE: MoveMetadata = MoveMetadata {
    id: 279,
    name: "Revenge",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(60),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const BRICK_BREAK: MoveMetadata = MoveMetadata {
    id: 280,
    name: "Brick Break",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(75),
    pp: 15,
    pkm_type: PkmType::Fighting,
};

const YAWN: MoveMetadata = MoveMetadata {
    id: 281,
    name: "Yawn",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const KNOCK_OFF: MoveMetadata = MoveMetadata {
    id: 282,
    name: "Knock Off",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(65),
    pp: 20,
    pkm_type: PkmType::Dark,
};

const ENDEAVOR: MoveMetadata = MoveMetadata {
    id: 283,
    name: "Endeavor",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const ERUPTION: MoveMetadata = MoveMetadata {
    id: 284,
    name: "Eruption",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const SKILL_SWAP: MoveMetadata = MoveMetadata {
    id: 285,
    name: "Skill Swap",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const IMPRISON: MoveMetadata = MoveMetadata {
    id: 286,
    name: "Imprison",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const REFRESH: MoveMetadata = MoveMetadata {
    id: 287,
    name: "Refresh",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const GRUDGE: MoveMetadata = MoveMetadata {
    id: 288,
    name: "Grudge",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 5,
    pkm_type: PkmType::Ghost,
};

const SNATCH: MoveMetadata = MoveMetadata {
    id: 289,
    name: "Snatch",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 10,
    pkm_type: PkmType::Dark,
};

const SECRET_POWER: MoveMetadata = MoveMetadata {
    id: 290,
    name: "Secret Power",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(70),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const DIVE: MoveMetadata = MoveMetadata {
    id: 291,
    name: "Dive",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Water,
};

const ARM_THRUST: MoveMetadata = MoveMetadata {
    id: 292,
    name: "Arm Thrust",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(15),
    pp: 20,
    pkm_type: PkmType::Fighting,
};

const CAMOUFLAGE: MoveMetadata = MoveMetadata {
    id: 293,
    name: "Camouflage",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const TAIL_GLOW: MoveMetadata = MoveMetadata {
    id: 294,
    name: "Tail Glow",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Bug,
};

const LUSTER_PURGE: MoveMetadata = MoveMetadata {
    id: 295,
    name: "Luster Purge",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(70),
    pp: 5,
    pkm_type: PkmType::Psychic,
};

const MIST_BALL: MoveMetadata = MoveMetadata {
    id: 296,
    name: "Mist Ball",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(70),
    pp: 5,
    pkm_type: PkmType::Psychic,
};

const FEATHER_DANCE: MoveMetadata = MoveMetadata {
    id: 297,
    name: "Feather Dance",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 15,
    pkm_type: PkmType::Flying,
};

const TEETER_DANCE: MoveMetadata = MoveMetadata {
    id: 298,
    name: "Teeter Dance",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const BLAZE_KICK: MoveMetadata = MoveMetadata {
    id: 299,
    name: "Blaze Kick",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(85),
    pp: 10,
    pkm_type: PkmType::Fire,
};

const MUD_SPORT: MoveMetadata = MoveMetadata {
    id: 300,
    name: "Mud Sport",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 15,
    pkm_type: PkmType::Ground,
};

const ICE_BALL: MoveMetadata = MoveMetadata {
    id: 301,
    name: "Ice Ball",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(30),
    pp: 20,
    pkm_type: PkmType::Ice,
};

const NEEDLE_ARM: MoveMetadata = MoveMetadata {
    id: 302,
    name: "Needle Arm",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(60),
    pp: 15,
    pkm_type: PkmType::Grass,
};

const SLACK_OFF: MoveMetadata = MoveMetadata {
    id: 303,
    name: "Slack Off",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const HYPER_VOICE: MoveMetadata = MoveMetadata {
    id: 304,
    name: "Hyper Voice",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const POISON_FANG: MoveMetadata = MoveMetadata {
    id: 305,
    name: "Poison Fang",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(50),
    pp: 15,
    pkm_type: PkmType::Poison,
};

const CRUSH_CLAW: MoveMetadata = MoveMetadata {
    id: 306,
    name: "Crush Claw",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(75),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const BLAST_BURN: MoveMetadata = MoveMetadata {
    id: 307,
    name: "Blast Burn",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const HYDRO_CANNON: MoveMetadata = MoveMetadata {
    id: 308,
    name: "Hydro Cannon",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Water,
};

const METEOR_MASH: MoveMetadata = MoveMetadata {
    id: 309,
    name: "Meteor Mash",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Steel,
};

const ASTONISH: MoveMetadata = MoveMetadata {
    id: 310,
    name: "Astonish",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(30),
    pp: 15,
    pkm_type: PkmType::Ghost,
};

const WEATHER_BALL: MoveMetadata = MoveMetadata {
    id: 311,
    name: "Weather Ball",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(50),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const AROMATHERAPY: MoveMetadata = MoveMetadata {
    id: 312,
    name: "Aromatherapy",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 5,
    pkm_type: PkmType::Grass,
};

const FAKE_TEARS: MoveMetadata = MoveMetadata {
    id: 313,
    name: "Fake Tears",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Dark,
};

const AIR_CUTTER: MoveMetadata = MoveMetadata {
    id: 314,
    name: "Air Cutter",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(60),
    pp: 25,
    pkm_type: PkmType::Flying,
};

const OVERHEAT: MoveMetadata = MoveMetadata {
    id: 315,
    name: "Overheat",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(130),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const ODOR_SLEUTH: MoveMetadata = MoveMetadata {
    id: 316,
    name: "Odor Sleuth",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 40,
    pkm_type: PkmType::Normal,
};

const ROCK_TOMB: MoveMetadata = MoveMetadata {
    id: 317,
    name: "Rock Tomb",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(60),
    pp: 15,
    pkm_type: PkmType::Rock,
};

const SILVER_WIND: MoveMetadata = MoveMetadata {
    id: 318,
    name: "Silver Wind",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(60),
    pp: 5,
    pkm_type: PkmType::Bug,
};

const METAL_SOUND: MoveMetadata = MoveMetadata {
    id: 319,
    name: "Metal Sound",
    accuracy: Some(85),
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 40,
    pkm_type: PkmType::Steel,
};

const GRASS_WHISTLE: MoveMetadata = MoveMetadata {
    id: 320,
    name: "Grass Whistle",
    accuracy: Some(55),
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 15,
    pkm_type: PkmType::Grass,
};

const TICKLE: MoveMetadata = MoveMetadata {
    id: 321,
    name: "Tickle",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const COSMIC_POWER: MoveMetadata = MoveMetadata {
    id: 322,
    name: "Cosmic Power",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Psychic,
};

const WATER_SPOUT: MoveMetadata = MoveMetadata {
    id: 323,
    name: "Water Spout",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Water,
};

const SIGNAL_BEAM: MoveMetadata = MoveMetadata {
    id: 324,
    name: "Signal Beam",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(75),
    pp: 15,
    pkm_type: PkmType::Bug,
};

const SHADOW_PUNCH: MoveMetadata = MoveMetadata {
    id: 325,
    name: "Shadow Punch",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Ghost,
};

const EXTRASENSORY: MoveMetadata = MoveMetadata {
    id: 326,
    name: "Extrasensory",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(80),
    pp: 20,
    pkm_type: PkmType::Psychic,
};

const SKY_UPPERCUT: MoveMetadata = MoveMetadata {
    id: 327,
    name: "Sky Uppercut",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(85),
    pp: 15,
    pkm_type: PkmType::Fighting,
};

const SAND_TOMB: MoveMetadata = MoveMetadata {
    id: 328,
    name: "Sand Tomb",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(35),
    pp: 15,
    pkm_type: PkmType::Ground,
};

const SHEER_COLD: MoveMetadata = MoveMetadata {
    id: 329,
    name: "Sheer Cold",
    accuracy: Some(30),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: None,
    pp: 5,
    pkm_type: PkmType::Ice,
};

const MUDDY_WATER: MoveMetadata = MoveMetadata {
    id: 330,
    name: "Muddy Water",
    accuracy: Some(85),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Water,
};

const BULLET_SEED: MoveMetadata = MoveMetadata {
    id: 331,
    name: "Bullet Seed",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(25),
    pp: 30,
    pkm_type: PkmType::Grass,
};

const AERIAL_ACE: MoveMetadata = MoveMetadata {
    id: 332,
    name: "Aerial Ace",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Flying,
};

const ICICLE_SPEAR: MoveMetadata = MoveMetadata {
    id: 333,
    name: "Icicle Spear",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(25),
    pp: 30,
    pkm_type: PkmType::Ice,
};

const IRON_DEFENSE: MoveMetadata = MoveMetadata {
    id: 334,
    name: "Iron Defense",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 15,
    pkm_type: PkmType::Steel,
};

const BLOCK: MoveMetadata = MoveMetadata {
    id: 335,
    name: "Block",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const HOWL: MoveMetadata = MoveMetadata {
    id: 336,
    name: "Howl",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 40,
    pkm_type: PkmType::Normal,
};

const DRAGON_CLAW: MoveMetadata = MoveMetadata {
    id: 337,
    name: "Dragon Claw",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Dragon,
};

const FRENZY_PLANT: MoveMetadata = MoveMetadata {
    id: 338,
    name: "Frenzy Plant",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Grass,
};

const BULK_UP: MoveMetadata = MoveMetadata {
    id: 339,
    name: "Bulk Up",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Fighting,
};

const BOUNCE: MoveMetadata = MoveMetadata {
    id: 340,
    name: "Bounce",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(85),
    pp: 5,
    pkm_type: PkmType::Flying,
};

const MUD_SHOT: MoveMetadata = MoveMetadata {
    id: 341,
    name: "Mud Shot",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(55),
    pp: 15,
    pkm_type: PkmType::Ground,
};

const POISON_TAIL: MoveMetadata = MoveMetadata {
    id: 342,
    name: "Poison Tail",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(50),
    pp: 25,
    pkm_type: PkmType::Poison,
};

const COVET: MoveMetadata = MoveMetadata {
    id: 343,
    name: "Covet",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(60),
    pp: 25,
    pkm_type: PkmType::Normal,
};

const VOLT_TACKLE: MoveMetadata = MoveMetadata {
    id: 344,
    name: "Volt Tackle",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(120),
    pp: 15,
    pkm_type: PkmType::Electric,
};

const MAGICAL_LEAF: MoveMetadata = MoveMetadata {
    id: 345,
    name: "Magical Leaf",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Grass,
};

const WATER_SPORT: MoveMetadata = MoveMetadata {
    id: 346,
    name: "Water Sport",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 15,
    pkm_type: PkmType::Water,
};

const CALM_MIND: MoveMetadata = MoveMetadata {
    id: 347,
    name: "Calm Mind",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Psychic,
};

const LEAF_BLADE: MoveMetadata = MoveMetadata {
    id: 348,
    name: "Leaf Blade",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(90),
    pp: 15,
    pkm_type: PkmType::Grass,
};

const DRAGON_DANCE: MoveMetadata = MoveMetadata {
    id: 349,
    name: "Dragon Dance",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G3,
    power: None,
    pp: 20,
    pkm_type: PkmType::Dragon,
};

const ROCK_BLAST: MoveMetadata = MoveMetadata {
    id: 350,
    name: "Rock Blast",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G3,
    power: Some(25),
    pp: 10,
    pkm_type: PkmType::Rock,
};

const SHOCK_WAVE: MoveMetadata = MoveMetadata {
    id: 351,
    name: "Shock Wave",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Electric,
};

const WATER_PULSE: MoveMetadata = MoveMetadata {
    id: 352,
    name: "Water Pulse",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Water,
};

const DOOM_DESIRE: MoveMetadata = MoveMetadata {
    id: 353,
    name: "Doom Desire",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(140),
    pp: 5,
    pkm_type: PkmType::Steel,
};

const PSYCHO_BOOST: MoveMetadata = MoveMetadata {
    id: 354,
    name: "Psycho Boost",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G3,
    power: Some(140),
    pp: 5,
    pkm_type: PkmType::Psychic,
};

const ROOST: MoveMetadata = MoveMetadata {
    id: 355,
    name: "Roost",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 5,
    pkm_type: PkmType::Flying,
};

const GRAVITY: MoveMetadata = MoveMetadata {
    id: 356,
    name: "Gravity",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 5,
    pkm_type: PkmType::Psychic,
};

const MIRACLE_EYE: MoveMetadata = MoveMetadata {
    id: 357,
    name: "Miracle Eye",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 40,
    pkm_type: PkmType::Psychic,
};

const WAKE_UP_SLAP: MoveMetadata = MoveMetadata {
    id: 358,
    name: "Wake-Up Slap",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(70),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const HAMMER_ARM: MoveMetadata = MoveMetadata {
    id: 359,
    name: "Hammer Arm",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const GYRO_BALL: MoveMetadata = MoveMetadata {
    id: 360,
    name: "Gyro Ball",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: None,
    pp: 5,
    pkm_type: PkmType::Steel,
};

const HEALING_WISH: MoveMetadata = MoveMetadata {
    id: 361,
    name: "Healing Wish",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const BRINE: MoveMetadata = MoveMetadata {
    id: 362,
    name: "Brine",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(65),
    pp: 10,
    pkm_type: PkmType::Water,
};

const NATURAL_GIFT: MoveMetadata = MoveMetadata {
    id: 363,
    name: "Natural Gift",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: None,
    pp: 15,
    pkm_type: PkmType::Normal,
};

const FEINT: MoveMetadata = MoveMetadata {
    id: 364,
    name: "Feint",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(30),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const PLUCK: MoveMetadata = MoveMetadata {
    id: 365,
    name: "Pluck",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Flying,
};

const TAILWIND: MoveMetadata = MoveMetadata {
    id: 366,
    name: "Tailwind",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 15,
    pkm_type: PkmType::Flying,
};

const ACUPRESSURE: MoveMetadata = MoveMetadata {
    id: 367,
    name: "Acupressure",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 30,
    pkm_type: PkmType::Normal,
};

const METAL_BURST: MoveMetadata = MoveMetadata {
    id: 368,
    name: "Metal Burst",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Steel,
};

const U_TURN: MoveMetadata = MoveMetadata {
    id: 369,
    name: "U-turn",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(70),
    pp: 20,
    pkm_type: PkmType::Bug,
};

const CLOSE_COMBAT: MoveMetadata = MoveMetadata {
    id: 370,
    name: "Close Combat",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Fighting,
};

const PAYBACK: MoveMetadata = MoveMetadata {
    id: 371,
    name: "Payback",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(50),
    pp: 10,
    pkm_type: PkmType::Dark,
};

const ASSURANCE: MoveMetadata = MoveMetadata {
    id: 372,
    name: "Assurance",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(60),
    pp: 10,
    pkm_type: PkmType::Dark,
};

const EMBARGO: MoveMetadata = MoveMetadata {
    id: 373,
    name: "Embargo",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 15,
    pkm_type: PkmType::Dark,
};

const FLING: MoveMetadata = MoveMetadata {
    id: 374,
    name: "Fling",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Dark,
};

const PSYCHO_SHIFT: MoveMetadata = MoveMetadata {
    id: 375,
    name: "Psycho Shift",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const TRUMP_CARD: MoveMetadata = MoveMetadata {
    id: 376,
    name: "Trump Card",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const HEAL_BLOCK: MoveMetadata = MoveMetadata {
    id: 377,
    name: "Heal Block",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 15,
    pkm_type: PkmType::Psychic,
};

const WRING_OUT: MoveMetadata = MoveMetadata {
    id: 378,
    name: "Wring Out",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const POWER_TRICK: MoveMetadata = MoveMetadata {
    id: 379,
    name: "Power Trick",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const GASTRO_ACID: MoveMetadata = MoveMetadata {
    id: 380,
    name: "Gastro Acid",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Poison,
};

const LUCKY_CHANT: MoveMetadata = MoveMetadata {
    id: 381,
    name: "Lucky Chant",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 30,
    pkm_type: PkmType::Normal,
};

const ME_FIRST: MoveMetadata = MoveMetadata {
    id: 382,
    name: "Me First",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const COPYCAT: MoveMetadata = MoveMetadata {
    id: 383,
    name: "Copycat",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const POWER_SWAP: MoveMetadata = MoveMetadata {
    id: 384,
    name: "Power Swap",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const GUARD_SWAP: MoveMetadata = MoveMetadata {
    id: 385,
    name: "Guard Swap",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const PUNISHMENT: MoveMetadata = MoveMetadata {
    id: 386,
    name: "Punishment",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: None,
    pp: 5,
    pkm_type: PkmType::Dark,
};

const LAST_RESORT: MoveMetadata = MoveMetadata {
    id: 387,
    name: "Last Resort",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(140),
    pp: 5,
    pkm_type: PkmType::Normal,
};

const WORRY_SEED: MoveMetadata = MoveMetadata {
    id: 388,
    name: "Worry Seed",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Grass,
};

const SUCKER_PUNCH: MoveMetadata = MoveMetadata {
    id: 389,
    name: "Sucker Punch",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(70),
    pp: 5,
    pkm_type: PkmType::Dark,
};

const TOXIC_SPIKES: MoveMetadata = MoveMetadata {
    id: 390,
    name: "Toxic Spikes",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 20,
    pkm_type: PkmType::Poison,
};

const HEART_SWAP: MoveMetadata = MoveMetadata {
    id: 391,
    name: "Heart Swap",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const AQUA_RING: MoveMetadata = MoveMetadata {
    id: 392,
    name: "Aqua Ring",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 20,
    pkm_type: PkmType::Water,
};

const MAGNET_RISE: MoveMetadata = MoveMetadata {
    id: 393,
    name: "Magnet Rise",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Electric,
};

const FLARE_BLITZ: MoveMetadata = MoveMetadata {
    id: 394,
    name: "Flare Blitz",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(120),
    pp: 15,
    pkm_type: PkmType::Fire,
};

const FORCE_PALM: MoveMetadata = MoveMetadata {
    id: 395,
    name: "Force Palm",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(60),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const AURA_SPHERE: MoveMetadata = MoveMetadata {
    id: 396,
    name: "Aura Sphere",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(80),
    pp: 20,
    pkm_type: PkmType::Fighting,
};

const ROCK_POLISH: MoveMetadata = MoveMetadata {
    id: 397,
    name: "Rock Polish",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 20,
    pkm_type: PkmType::Rock,
};

const POISON_JAB: MoveMetadata = MoveMetadata {
    id: 398,
    name: "Poison Jab",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(80),
    pp: 20,
    pkm_type: PkmType::Poison,
};

const DARK_PULSE: MoveMetadata = MoveMetadata {
    id: 399,
    name: "Dark Pulse",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Dark,
};

const NIGHT_SLASH: MoveMetadata = MoveMetadata {
    id: 400,
    name: "Night Slash",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(70),
    pp: 15,
    pkm_type: PkmType::Dark,
};

const AQUA_TAIL: MoveMetadata = MoveMetadata {
    id: 401,
    name: "Aqua Tail",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Water,
};

const SEED_BOMB: MoveMetadata = MoveMetadata {
    id: 402,
    name: "Seed Bomb",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Grass,
};

const AIR_SLASH: MoveMetadata = MoveMetadata {
    id: 403,
    name: "Air Slash",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(75),
    pp: 15,
    pkm_type: PkmType::Flying,
};

const X_SCISSOR: MoveMetadata = MoveMetadata {
    id: 404,
    name: "X-Scissor",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Bug,
};

const BUG_BUZZ: MoveMetadata = MoveMetadata {
    id: 405,
    name: "Bug Buzz",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Bug,
};

const DRAGON_PULSE: MoveMetadata = MoveMetadata {
    id: 406,
    name: "Dragon Pulse",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(85),
    pp: 10,
    pkm_type: PkmType::Dragon,
};

const DRAGON_RUSH: MoveMetadata = MoveMetadata {
    id: 407,
    name: "Dragon Rush",
    accuracy: Some(75),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Dragon,
};

const POWER_GEM: MoveMetadata = MoveMetadata {
    id: 408,
    name: "Power Gem",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(80),
    pp: 20,
    pkm_type: PkmType::Rock,
};

const DRAIN_PUNCH: MoveMetadata = MoveMetadata {
    id: 409,
    name: "Drain Punch",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(75),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const VACUUM_WAVE: MoveMetadata = MoveMetadata {
    id: 410,
    name: "Vacuum Wave",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(40),
    pp: 30,
    pkm_type: PkmType::Fighting,
};

const FOCUS_BLAST: MoveMetadata = MoveMetadata {
    id: 411,
    name: "Focus Blast",
    accuracy: Some(70),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Fighting,
};

const ENERGY_BALL: MoveMetadata = MoveMetadata {
    id: 412,
    name: "Energy Ball",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const BRAVE_BIRD: MoveMetadata = MoveMetadata {
    id: 413,
    name: "Brave Bird",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(120),
    pp: 15,
    pkm_type: PkmType::Flying,
};

const EARTH_POWER: MoveMetadata = MoveMetadata {
    id: 414,
    name: "Earth Power",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const SWITCHEROO: MoveMetadata = MoveMetadata {
    id: 415,
    name: "Switcheroo",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Dark,
};

const GIGA_IMPACT: MoveMetadata = MoveMetadata {
    id: 416,
    name: "Giga Impact",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Normal,
};

const NASTY_PLOT: MoveMetadata = MoveMetadata {
    id: 417,
    name: "Nasty Plot",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 20,
    pkm_type: PkmType::Dark,
};

const BULLET_PUNCH: MoveMetadata = MoveMetadata {
    id: 418,
    name: "Bullet Punch",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(40),
    pp: 30,
    pkm_type: PkmType::Steel,
};

const AVALANCHE: MoveMetadata = MoveMetadata {
    id: 419,
    name: "Avalanche",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(60),
    pp: 10,
    pkm_type: PkmType::Ice,
};

const ICE_SHARD: MoveMetadata = MoveMetadata {
    id: 420,
    name: "Ice Shard",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(40),
    pp: 30,
    pkm_type: PkmType::Ice,
};

const SHADOW_CLAW: MoveMetadata = MoveMetadata {
    id: 421,
    name: "Shadow Claw",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(70),
    pp: 15,
    pkm_type: PkmType::Ghost,
};

const THUNDER_FANG: MoveMetadata = MoveMetadata {
    id: 422,
    name: "Thunder Fang",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(65),
    pp: 15,
    pkm_type: PkmType::Electric,
};

const ICE_FANG: MoveMetadata = MoveMetadata {
    id: 423,
    name: "Ice Fang",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(65),
    pp: 15,
    pkm_type: PkmType::Ice,
};

const FIRE_FANG: MoveMetadata = MoveMetadata {
    id: 424,
    name: "Fire Fang",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(65),
    pp: 15,
    pkm_type: PkmType::Fire,
};

const SHADOW_SNEAK: MoveMetadata = MoveMetadata {
    id: 425,
    name: "Shadow Sneak",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(40),
    pp: 30,
    pkm_type: PkmType::Ghost,
};

const MUD_BOMB: MoveMetadata = MoveMetadata {
    id: 426,
    name: "Mud Bomb",
    accuracy: Some(85),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(65),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const PSYCHO_CUT: MoveMetadata = MoveMetadata {
    id: 427,
    name: "Psycho Cut",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(70),
    pp: 20,
    pkm_type: PkmType::Psychic,
};

const ZEN_HEADBUTT: MoveMetadata = MoveMetadata {
    id: 428,
    name: "Zen Headbutt",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Psychic,
};

const MIRROR_SHOT: MoveMetadata = MoveMetadata {
    id: 429,
    name: "Mirror Shot",
    accuracy: Some(85),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(65),
    pp: 10,
    pkm_type: PkmType::Steel,
};

const FLASH_CANNON: MoveMetadata = MoveMetadata {
    id: 430,
    name: "Flash Cannon",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Steel,
};

const ROCK_CLIMB: MoveMetadata = MoveMetadata {
    id: 431,
    name: "Rock Climb",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(90),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const DEFOG: MoveMetadata = MoveMetadata {
    id: 432,
    name: "Defog",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 15,
    pkm_type: PkmType::Flying,
};

const TRICK_ROOM: MoveMetadata = MoveMetadata {
    id: 433,
    name: "Trick Room",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 5,
    pkm_type: PkmType::Psychic,
};

const DRACO_METEOR: MoveMetadata = MoveMetadata {
    id: 434,
    name: "Draco Meteor",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(130),
    pp: 5,
    pkm_type: PkmType::Dragon,
};

const DISCHARGE: MoveMetadata = MoveMetadata {
    id: 435,
    name: "Discharge",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Electric,
};

const LAVA_PLUME: MoveMetadata = MoveMetadata {
    id: 436,
    name: "Lava Plume",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Fire,
};

const LEAF_STORM: MoveMetadata = MoveMetadata {
    id: 437,
    name: "Leaf Storm",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(130),
    pp: 5,
    pkm_type: PkmType::Grass,
};

const POWER_WHIP: MoveMetadata = MoveMetadata {
    id: 438,
    name: "Power Whip",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const ROCK_WRECKER: MoveMetadata = MoveMetadata {
    id: 439,
    name: "Rock Wrecker",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Rock,
};

const CROSS_POISON: MoveMetadata = MoveMetadata {
    id: 440,
    name: "Cross Poison",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(70),
    pp: 20,
    pkm_type: PkmType::Poison,
};

const GUNK_SHOT: MoveMetadata = MoveMetadata {
    id: 441,
    name: "Gunk Shot",
    accuracy: Some(80),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Poison,
};

const IRON_HEAD: MoveMetadata = MoveMetadata {
    id: 442,
    name: "Iron Head",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Steel,
};

const MAGNET_BOMB: MoveMetadata = MoveMetadata {
    id: 443,
    name: "Magnet Bomb",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Steel,
};

const STONE_EDGE: MoveMetadata = MoveMetadata {
    id: 444,
    name: "Stone Edge",
    accuracy: Some(80),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Rock,
};

const CAPTIVATE: MoveMetadata = MoveMetadata {
    id: 445,
    name: "Captivate",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const STEALTH_ROCK: MoveMetadata = MoveMetadata {
    id: 446,
    name: "Stealth Rock",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 20,
    pkm_type: PkmType::Rock,
};

const GRASS_KNOT: MoveMetadata = MoveMetadata {
    id: 447,
    name: "Grass Knot",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: None,
    pp: 20,
    pkm_type: PkmType::Grass,
};

const CHATTER: MoveMetadata = MoveMetadata {
    id: 448,
    name: "Chatter",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(65),
    pp: 20,
    pkm_type: PkmType::Flying,
};

const JUDGMENT: MoveMetadata = MoveMetadata {
    id: 449,
    name: "Judgment",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const BUG_BITE: MoveMetadata = MoveMetadata {
    id: 450,
    name: "Bug Bite",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Bug,
};

const CHARGE_BEAM: MoveMetadata = MoveMetadata {
    id: 451,
    name: "Charge Beam",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(50),
    pp: 10,
    pkm_type: PkmType::Electric,
};

const WOOD_HAMMER: MoveMetadata = MoveMetadata {
    id: 452,
    name: "Wood Hammer",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(120),
    pp: 15,
    pkm_type: PkmType::Grass,
};

const AQUA_JET: MoveMetadata = MoveMetadata {
    id: 453,
    name: "Aqua Jet",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(40),
    pp: 20,
    pkm_type: PkmType::Water,
};

const ATTACK_ORDER: MoveMetadata = MoveMetadata {
    id: 454,
    name: "Attack Order",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(90),
    pp: 15,
    pkm_type: PkmType::Bug,
};

const DEFEND_ORDER: MoveMetadata = MoveMetadata {
    id: 455,
    name: "Defend Order",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Bug,
};

const HEAL_ORDER: MoveMetadata = MoveMetadata {
    id: 456,
    name: "Heal Order",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Bug,
};

const HEAD_SMASH: MoveMetadata = MoveMetadata {
    id: 457,
    name: "Head Smash",
    accuracy: Some(80),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Rock,
};

const DOUBLE_HIT: MoveMetadata = MoveMetadata {
    id: 458,
    name: "Double Hit",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(35),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const ROAR_OF_TIME: MoveMetadata = MoveMetadata {
    id: 459,
    name: "Roar of Time",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Dragon,
};

const SPACIAL_REND: MoveMetadata = MoveMetadata {
    id: 460,
    name: "Spacial Rend",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Dragon,
};

const LUNAR_DANCE: MoveMetadata = MoveMetadata {
    id: 461,
    name: "Lunar Dance",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const CRUSH_GRIP: MoveMetadata = MoveMetadata {
    id: 462,
    name: "Crush Grip",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: None,
    pp: 5,
    pkm_type: PkmType::Normal,
};

const MAGMA_STORM: MoveMetadata = MoveMetadata {
    id: 463,
    name: "Magma Storm",
    accuracy: Some(75),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const DARK_VOID: MoveMetadata = MoveMetadata {
    id: 464,
    name: "Dark Void",
    accuracy: Some(50),
    class: MoveClass::Status,
    introduced: Generation::G4,
    power: None,
    pp: 10,
    pkm_type: PkmType::Dark,
};

const SEED_FLARE: MoveMetadata = MoveMetadata {
    id: 465,
    name: "Seed Flare",
    accuracy: Some(85),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Grass,
};

const OMINOUS_WIND: MoveMetadata = MoveMetadata {
    id: 466,
    name: "Ominous Wind",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G4,
    power: Some(60),
    pp: 5,
    pkm_type: PkmType::Ghost,
};

const SHADOW_FORCE: MoveMetadata = MoveMetadata {
    id: 467,
    name: "Shadow Force",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G4,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Ghost,
};

const HONE_CLAWS: MoveMetadata = MoveMetadata {
    id: 468,
    name: "Hone Claws",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 15,
    pkm_type: PkmType::Dark,
};

const WIDE_GUARD: MoveMetadata = MoveMetadata {
    id: 469,
    name: "Wide Guard",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 10,
    pkm_type: PkmType::Rock,
};

const GUARD_SPLIT: MoveMetadata = MoveMetadata {
    id: 470,
    name: "Guard Split",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const POWER_SPLIT: MoveMetadata = MoveMetadata {
    id: 471,
    name: "Power Split",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const WONDER_ROOM: MoveMetadata = MoveMetadata {
    id: 472,
    name: "Wonder Room",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const PSYSHOCK: MoveMetadata = MoveMetadata {
    id: 473,
    name: "Psyshock",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const VENOSHOCK: MoveMetadata = MoveMetadata {
    id: 474,
    name: "Venoshock",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(65),
    pp: 10,
    pkm_type: PkmType::Poison,
};

const AUTOTOMIZE: MoveMetadata = MoveMetadata {
    id: 475,
    name: "Autotomize",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 15,
    pkm_type: PkmType::Steel,
};

const RAGE_POWDER: MoveMetadata = MoveMetadata {
    id: 476,
    name: "Rage Powder",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 20,
    pkm_type: PkmType::Bug,
};

const TELEKINESIS: MoveMetadata = MoveMetadata {
    id: 477,
    name: "Telekinesis",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 15,
    pkm_type: PkmType::Psychic,
};

const MAGIC_ROOM: MoveMetadata = MoveMetadata {
    id: 478,
    name: "Magic Room",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const SMACK_DOWN: MoveMetadata = MoveMetadata {
    id: 479,
    name: "Smack Down",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(50),
    pp: 15,
    pkm_type: PkmType::Rock,
};

const STORM_THROW: MoveMetadata = MoveMetadata {
    id: 480,
    name: "Storm Throw",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(60),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const FLAME_BURST: MoveMetadata = MoveMetadata {
    id: 481,
    name: "Flame Burst",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(70),
    pp: 15,
    pkm_type: PkmType::Fire,
};

const SLUDGE_WAVE: MoveMetadata = MoveMetadata {
    id: 482,
    name: "Sludge Wave",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(95),
    pp: 10,
    pkm_type: PkmType::Poison,
};

const QUIVER_DANCE: MoveMetadata = MoveMetadata {
    id: 483,
    name: "Quiver Dance",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 20,
    pkm_type: PkmType::Bug,
};

const HEAVY_SLAM: MoveMetadata = MoveMetadata {
    id: 484,
    name: "Heavy Slam",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: None,
    pp: 10,
    pkm_type: PkmType::Steel,
};

const SYNCHRONOISE: MoveMetadata = MoveMetadata {
    id: 485,
    name: "Synchronoise",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const ELECTRO_BALL: MoveMetadata = MoveMetadata {
    id: 486,
    name: "Electro Ball",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: None,
    pp: 10,
    pkm_type: PkmType::Electric,
};

const SOAK: MoveMetadata = MoveMetadata {
    id: 487,
    name: "Soak",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 20,
    pkm_type: PkmType::Water,
};

const FLAME_CHARGE: MoveMetadata = MoveMetadata {
    id: 488,
    name: "Flame Charge",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(50),
    pp: 20,
    pkm_type: PkmType::Fire,
};

const COIL: MoveMetadata = MoveMetadata {
    id: 489,
    name: "Coil",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 20,
    pkm_type: PkmType::Poison,
};

const LOW_SWEEP: MoveMetadata = MoveMetadata {
    id: 490,
    name: "Low Sweep",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(65),
    pp: 20,
    pkm_type: PkmType::Fighting,
};

const ACID_SPRAY: MoveMetadata = MoveMetadata {
    id: 491,
    name: "Acid Spray",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(40),
    pp: 20,
    pkm_type: PkmType::Poison,
};

const FOUL_PLAY: MoveMetadata = MoveMetadata {
    id: 492,
    name: "Foul Play",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(95),
    pp: 15,
    pkm_type: PkmType::Dark,
};

const SIMPLE_BEAM: MoveMetadata = MoveMetadata {
    id: 493,
    name: "Simple Beam",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 15,
    pkm_type: PkmType::Normal,
};

const ENTRAINMENT: MoveMetadata = MoveMetadata {
    id: 494,
    name: "Entrainment",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 15,
    pkm_type: PkmType::Normal,
};

const AFTER_YOU: MoveMetadata = MoveMetadata {
    id: 495,
    name: "After You",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 15,
    pkm_type: PkmType::Normal,
};

const ROUND: MoveMetadata = MoveMetadata {
    id: 496,
    name: "Round",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(60),
    pp: 15,
    pkm_type: PkmType::Normal,
};

const ECHOED_VOICE: MoveMetadata = MoveMetadata {
    id: 497,
    name: "Echoed Voice",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(40),
    pp: 15,
    pkm_type: PkmType::Normal,
};

const CHIP_AWAY: MoveMetadata = MoveMetadata {
    id: 498,
    name: "Chip Away",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(70),
    pp: 20,
    pkm_type: PkmType::Normal,
};

const CLEAR_SMOG: MoveMetadata = MoveMetadata {
    id: 499,
    name: "Clear Smog",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(50),
    pp: 15,
    pkm_type: PkmType::Poison,
};

const STORED_POWER: MoveMetadata = MoveMetadata {
    id: 500,
    name: "Stored Power",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(20),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const QUICK_GUARD: MoveMetadata = MoveMetadata {
    id: 501,
    name: "Quick Guard",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 15,
    pkm_type: PkmType::Fighting,
};

const ALLY_SWITCH: MoveMetadata = MoveMetadata {
    id: 502,
    name: "Ally Switch",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 15,
    pkm_type: PkmType::Psychic,
};

const SCALD: MoveMetadata = MoveMetadata {
    id: 503,
    name: "Scald",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Water,
};

const SHELL_SMASH: MoveMetadata = MoveMetadata {
    id: 504,
    name: "Shell Smash",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 15,
    pkm_type: PkmType::Normal,
};

const HEAL_PULSE: MoveMetadata = MoveMetadata {
    id: 505,
    name: "Heal Pulse",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const HEX: MoveMetadata = MoveMetadata {
    id: 506,
    name: "Hex",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(65),
    pp: 10,
    pkm_type: PkmType::Ghost,
};

const SKY_DROP: MoveMetadata = MoveMetadata {
    id: 507,
    name: "Sky Drop",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(60),
    pp: 10,
    pkm_type: PkmType::Flying,
};

const SHIFT_GEAR: MoveMetadata = MoveMetadata {
    id: 508,
    name: "Shift Gear",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 10,
    pkm_type: PkmType::Steel,
};

const CIRCLE_THROW: MoveMetadata = MoveMetadata {
    id: 509,
    name: "Circle Throw",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(60),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const INCINERATE: MoveMetadata = MoveMetadata {
    id: 510,
    name: "Incinerate",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(60),
    pp: 15,
    pkm_type: PkmType::Fire,
};

const QUASH: MoveMetadata = MoveMetadata {
    id: 511,
    name: "Quash",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 15,
    pkm_type: PkmType::Dark,
};

const ACROBATICS: MoveMetadata = MoveMetadata {
    id: 512,
    name: "Acrobatics",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(55),
    pp: 15,
    pkm_type: PkmType::Flying,
};

const REFLECT_TYPE: MoveMetadata = MoveMetadata {
    id: 513,
    name: "Reflect Type",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 15,
    pkm_type: PkmType::Normal,
};

const RETALIATE: MoveMetadata = MoveMetadata {
    id: 514,
    name: "Retaliate",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(70),
    pp: 5,
    pkm_type: PkmType::Normal,
};

const FINAL_GAMBIT: MoveMetadata = MoveMetadata {
    id: 515,
    name: "Final Gambit",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: None,
    pp: 5,
    pkm_type: PkmType::Fighting,
};

const BESTOW: MoveMetadata = MoveMetadata {
    id: 516,
    name: "Bestow",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 15,
    pkm_type: PkmType::Normal,
};

const INFERNO: MoveMetadata = MoveMetadata {
    id: 517,
    name: "Inferno",
    accuracy: Some(50),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const WATER_PLEDGE: MoveMetadata = MoveMetadata {
    id: 518,
    name: "Water Pledge",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Water,
};

const FIRE_PLEDGE: MoveMetadata = MoveMetadata {
    id: 519,
    name: "Fire Pledge",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Fire,
};

const GRASS_PLEDGE: MoveMetadata = MoveMetadata {
    id: 520,
    name: "Grass Pledge",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const VOLT_SWITCH: MoveMetadata = MoveMetadata {
    id: 521,
    name: "Volt Switch",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(70),
    pp: 20,
    pkm_type: PkmType::Electric,
};

const STRUGGLE_BUG: MoveMetadata = MoveMetadata {
    id: 522,
    name: "Struggle Bug",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(50),
    pp: 20,
    pkm_type: PkmType::Bug,
};

const BULLDOZE: MoveMetadata = MoveMetadata {
    id: 523,
    name: "Bulldoze",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Ground,
};

const FROST_BREATH: MoveMetadata = MoveMetadata {
    id: 524,
    name: "Frost Breath",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(60),
    pp: 10,
    pkm_type: PkmType::Ice,
};

const DRAGON_TAIL: MoveMetadata = MoveMetadata {
    id: 525,
    name: "Dragon Tail",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(60),
    pp: 10,
    pkm_type: PkmType::Dragon,
};

const WORK_UP: MoveMetadata = MoveMetadata {
    id: 526,
    name: "Work Up",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 30,
    pkm_type: PkmType::Normal,
};

const ELECTROWEB: MoveMetadata = MoveMetadata {
    id: 527,
    name: "Electroweb",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(55),
    pp: 15,
    pkm_type: PkmType::Electric,
};

const WILD_CHARGE: MoveMetadata = MoveMetadata {
    id: 528,
    name: "Wild Charge",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(90),
    pp: 15,
    pkm_type: PkmType::Electric,
};

const DRILL_RUN: MoveMetadata = MoveMetadata {
    id: 529,
    name: "Drill Run",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const DUAL_CHOP: MoveMetadata = MoveMetadata {
    id: 530,
    name: "Dual Chop",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(40),
    pp: 15,
    pkm_type: PkmType::Dragon,
};

const HEART_STAMP: MoveMetadata = MoveMetadata {
    id: 531,
    name: "Heart Stamp",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(60),
    pp: 25,
    pkm_type: PkmType::Psychic,
};

const HORN_LEECH: MoveMetadata = MoveMetadata {
    id: 532,
    name: "Horn Leech",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(75),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const SACRED_SWORD: MoveMetadata = MoveMetadata {
    id: 533,
    name: "Sacred Sword",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(90),
    pp: 15,
    pkm_type: PkmType::Fighting,
};

const RAZOR_SHELL: MoveMetadata = MoveMetadata {
    id: 534,
    name: "Razor Shell",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(75),
    pp: 10,
    pkm_type: PkmType::Water,
};

const HEAT_CRASH: MoveMetadata = MoveMetadata {
    id: 535,
    name: "Heat Crash",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: None,
    pp: 10,
    pkm_type: PkmType::Fire,
};

const LEAF_TORNADO: MoveMetadata = MoveMetadata {
    id: 536,
    name: "Leaf Tornado",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(65),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const STEAMROLLER: MoveMetadata = MoveMetadata {
    id: 537,
    name: "Steamroller",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(65),
    pp: 20,
    pkm_type: PkmType::Bug,
};

const COTTON_GUARD: MoveMetadata = MoveMetadata {
    id: 538,
    name: "Cotton Guard",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G5,
    power: None,
    pp: 10,
    pkm_type: PkmType::Grass,
};

const NIGHT_DAZE: MoveMetadata = MoveMetadata {
    id: 539,
    name: "Night Daze",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(85),
    pp: 10,
    pkm_type: PkmType::Dark,
};

const PSYSTRIKE: MoveMetadata = MoveMetadata {
    id: 540,
    name: "Psystrike",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const TAIL_SLAP: MoveMetadata = MoveMetadata {
    id: 541,
    name: "Tail Slap",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(25),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const HURRICANE: MoveMetadata = MoveMetadata {
    id: 542,
    name: "Hurricane",
    accuracy: Some(70),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(110),
    pp: 10,
    pkm_type: PkmType::Flying,
};

const HEAD_CHARGE: MoveMetadata = MoveMetadata {
    id: 543,
    name: "Head Charge",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(120),
    pp: 15,
    pkm_type: PkmType::Normal,
};

const GEAR_GRIND: MoveMetadata = MoveMetadata {
    id: 544,
    name: "Gear Grind",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(50),
    pp: 15,
    pkm_type: PkmType::Steel,
};

const SEARING_SHOT: MoveMetadata = MoveMetadata {
    id: 545,
    name: "Searing Shot",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const TECHNO_BLAST: MoveMetadata = MoveMetadata {
    id: 546,
    name: "Techno Blast",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Normal,
};

const RELIC_SONG: MoveMetadata = MoveMetadata {
    id: 547,
    name: "Relic Song",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(75),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const SECRET_SWORD: MoveMetadata = MoveMetadata {
    id: 548,
    name: "Secret Sword",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(85),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const GLACIATE: MoveMetadata = MoveMetadata {
    id: 549,
    name: "Glaciate",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(65),
    pp: 10,
    pkm_type: PkmType::Ice,
};

const BOLT_STRIKE: MoveMetadata = MoveMetadata {
    id: 550,
    name: "Bolt Strike",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(130),
    pp: 5,
    pkm_type: PkmType::Electric,
};

const BLUE_FLARE: MoveMetadata = MoveMetadata {
    id: 551,
    name: "Blue Flare",
    accuracy: Some(85),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(130),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const FIERY_DANCE: MoveMetadata = MoveMetadata {
    id: 552,
    name: "Fiery Dance",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Fire,
};

const FREEZE_SHOCK: MoveMetadata = MoveMetadata {
    id: 553,
    name: "Freeze Shock",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(140),
    pp: 5,
    pkm_type: PkmType::Ice,
};

const ICE_BURN: MoveMetadata = MoveMetadata {
    id: 554,
    name: "Ice Burn",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(140),
    pp: 5,
    pkm_type: PkmType::Ice,
};

const SNARL: MoveMetadata = MoveMetadata {
    id: 555,
    name: "Snarl",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(55),
    pp: 15,
    pkm_type: PkmType::Dark,
};

const ICICLE_CRASH: MoveMetadata = MoveMetadata {
    id: 556,
    name: "Icicle Crash",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(85),
    pp: 10,
    pkm_type: PkmType::Ice,
};

const V_CREATE: MoveMetadata = MoveMetadata {
    id: 557,
    name: "V-create",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(180),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const FUSION_FLARE: MoveMetadata = MoveMetadata {
    id: 558,
    name: "Fusion Flare",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G5,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const FUSION_BOLT: MoveMetadata = MoveMetadata {
    id: 559,
    name: "Fusion Bolt",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G5,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Electric,
};

const FLYING_PRESS: MoveMetadata = MoveMetadata {
    id: 560,
    name: "Flying Press",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const MAT_BLOCK: MoveMetadata = MoveMetadata {
    id: 561,
    name: "Mat Block",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const BELCH: MoveMetadata = MoveMetadata {
    id: 562,
    name: "Belch",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Poison,
};

const ROTOTILLER: MoveMetadata = MoveMetadata {
    id: 563,
    name: "Rototiller",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 10,
    pkm_type: PkmType::Ground,
};

const STICKY_WEB: MoveMetadata = MoveMetadata {
    id: 564,
    name: "Sticky Web",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 20,
    pkm_type: PkmType::Bug,
};

const FELL_STINGER: MoveMetadata = MoveMetadata {
    id: 565,
    name: "Fell Stinger",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(50),
    pp: 25,
    pkm_type: PkmType::Bug,
};

const PHANTOM_FORCE: MoveMetadata = MoveMetadata {
    id: 566,
    name: "Phantom Force",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Ghost,
};

const TRICK_OR_TREAT: MoveMetadata = MoveMetadata {
    id: 567,
    name: "Trick-or-Treat",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 20,
    pkm_type: PkmType::Ghost,
};

const NOBLE_ROAR: MoveMetadata = MoveMetadata {
    id: 568,
    name: "Noble Roar",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 30,
    pkm_type: PkmType::Normal,
};

const ION_DELUGE: MoveMetadata = MoveMetadata {
    id: 569,
    name: "Ion Deluge",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 25,
    pkm_type: PkmType::Electric,
};

const PARABOLIC_CHARGE: MoveMetadata = MoveMetadata {
    id: 570,
    name: "Parabolic Charge",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(65),
    pp: 20,
    pkm_type: PkmType::Electric,
};

const FOREST_S_CURSE: MoveMetadata = MoveMetadata {
    id: 571,
    name: "Forest’s Curse",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 20,
    pkm_type: PkmType::Grass,
};

const PETAL_BLIZZARD: MoveMetadata = MoveMetadata {
    id: 572,
    name: "Petal Blizzard",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(90),
    pp: 15,
    pkm_type: PkmType::Grass,
};

const FREEZE_DRY: MoveMetadata = MoveMetadata {
    id: 573,
    name: "Freeze-Dry",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(70),
    pp: 20,
    pkm_type: PkmType::Ice,
};

const DISARMING_VOICE: MoveMetadata = MoveMetadata {
    id: 574,
    name: "Disarming Voice",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(40),
    pp: 15,
    pkm_type: PkmType::Fairy,
};

const PARTING_SHOT: MoveMetadata = MoveMetadata {
    id: 575,
    name: "Parting Shot",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 20,
    pkm_type: PkmType::Dark,
};

const TOPSY_TURVY: MoveMetadata = MoveMetadata {
    id: 576,
    name: "Topsy-Turvy",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 20,
    pkm_type: PkmType::Dark,
};

const DRAINING_KISS: MoveMetadata = MoveMetadata {
    id: 577,
    name: "Draining Kiss",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(50),
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const CRAFTY_SHIELD: MoveMetadata = MoveMetadata {
    id: 578,
    name: "Crafty Shield",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const FLOWER_SHIELD: MoveMetadata = MoveMetadata {
    id: 579,
    name: "Flower Shield",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const GRASSY_TERRAIN: MoveMetadata = MoveMetadata {
    id: 580,
    name: "Grassy Terrain",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 10,
    pkm_type: PkmType::Grass,
};

const MISTY_TERRAIN: MoveMetadata = MoveMetadata {
    id: 581,
    name: "Misty Terrain",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const ELECTRIFY: MoveMetadata = MoveMetadata {
    id: 582,
    name: "Electrify",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 20,
    pkm_type: PkmType::Electric,
};

const PLAY_ROUGH: MoveMetadata = MoveMetadata {
    id: 583,
    name: "Play Rough",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const FAIRY_WIND: MoveMetadata = MoveMetadata {
    id: 584,
    name: "Fairy Wind",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(40),
    pp: 30,
    pkm_type: PkmType::Fairy,
};

const MOONBLAST: MoveMetadata = MoveMetadata {
    id: 585,
    name: "Moonblast",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(95),
    pp: 15,
    pkm_type: PkmType::Fairy,
};

const BOOMBURST: MoveMetadata = MoveMetadata {
    id: 586,
    name: "Boomburst",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(140),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const FAIRY_LOCK: MoveMetadata = MoveMetadata {
    id: 587,
    name: "Fairy Lock",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const KING_S_SHIELD: MoveMetadata = MoveMetadata {
    id: 588,
    name: "King’s Shield",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 10,
    pkm_type: PkmType::Steel,
};

const PLAY_NICE: MoveMetadata = MoveMetadata {
    id: 589,
    name: "Play Nice",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const CONFIDE: MoveMetadata = MoveMetadata {
    id: 590,
    name: "Confide",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const DIAMOND_STORM: MoveMetadata = MoveMetadata {
    id: 591,
    name: "Diamond Storm",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Rock,
};

const STEAM_ERUPTION: MoveMetadata = MoveMetadata {
    id: 592,
    name: "Steam Eruption",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(110),
    pp: 5,
    pkm_type: PkmType::Water,
};

const HYPERSPACE_HOLE: MoveMetadata = MoveMetadata {
    id: 593,
    name: "Hyperspace Hole",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(80),
    pp: 5,
    pkm_type: PkmType::Psychic,
};

const WATER_SHURIKEN: MoveMetadata = MoveMetadata {
    id: 594,
    name: "Water Shuriken",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(15),
    pp: 20,
    pkm_type: PkmType::Water,
};

const MYSTICAL_FIRE: MoveMetadata = MoveMetadata {
    id: 595,
    name: "Mystical Fire",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(75),
    pp: 10,
    pkm_type: PkmType::Fire,
};

const SPIKY_SHIELD: MoveMetadata = MoveMetadata {
    id: 596,
    name: "Spiky Shield",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 10,
    pkm_type: PkmType::Grass,
};

const AROMATIC_MIST: MoveMetadata = MoveMetadata {
    id: 597,
    name: "Aromatic Mist",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 20,
    pkm_type: PkmType::Fairy,
};

const EERIE_IMPULSE: MoveMetadata = MoveMetadata {
    id: 598,
    name: "Eerie Impulse",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 15,
    pkm_type: PkmType::Electric,
};

const VENOM_DRENCH: MoveMetadata = MoveMetadata {
    id: 599,
    name: "Venom Drench",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 20,
    pkm_type: PkmType::Poison,
};

const POWDER: MoveMetadata = MoveMetadata {
    id: 600,
    name: "Powder",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 20,
    pkm_type: PkmType::Bug,
};

const GEOMANCY: MoveMetadata = MoveMetadata {
    id: 601,
    name: "Geomancy",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const MAGNETIC_FLUX: MoveMetadata = MoveMetadata {
    id: 602,
    name: "Magnetic Flux",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 20,
    pkm_type: PkmType::Electric,
};

const HAPPY_HOUR: MoveMetadata = MoveMetadata {
    id: 603,
    name: "Happy Hour",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 30,
    pkm_type: PkmType::Normal,
};

const ELECTRIC_TERRAIN: MoveMetadata = MoveMetadata {
    id: 604,
    name: "Electric Terrain",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 10,
    pkm_type: PkmType::Electric,
};

const DAZZLING_GLEAM: MoveMetadata = MoveMetadata {
    id: 605,
    name: "Dazzling Gleam",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const CELEBRATE: MoveMetadata = MoveMetadata {
    id: 606,
    name: "Celebrate",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 40,
    pkm_type: PkmType::Normal,
};

const HOLD_HANDS: MoveMetadata = MoveMetadata {
    id: 607,
    name: "Hold Hands",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 40,
    pkm_type: PkmType::Normal,
};

const BABY_DOLL_EYES: MoveMetadata = MoveMetadata {
    id: 608,
    name: "Baby-Doll Eyes",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G6,
    power: None,
    pp: 30,
    pkm_type: PkmType::Fairy,
};

const NUZZLE: MoveMetadata = MoveMetadata {
    id: 609,
    name: "Nuzzle",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(20),
    pp: 20,
    pkm_type: PkmType::Electric,
};

const HOLD_BACK: MoveMetadata = MoveMetadata {
    id: 610,
    name: "Hold Back",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(40),
    pp: 40,
    pkm_type: PkmType::Normal,
};

const INFESTATION: MoveMetadata = MoveMetadata {
    id: 611,
    name: "Infestation",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(20),
    pp: 20,
    pkm_type: PkmType::Bug,
};

const POWER_UP_PUNCH: MoveMetadata = MoveMetadata {
    id: 612,
    name: "Power-Up Punch",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(40),
    pp: 20,
    pkm_type: PkmType::Fighting,
};

const OBLIVION_WING: MoveMetadata = MoveMetadata {
    id: 613,
    name: "Oblivion Wing",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Flying,
};

const THOUSAND_ARROWS: MoveMetadata = MoveMetadata {
    id: 614,
    name: "Thousand Arrows",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const THOUSAND_WAVES: MoveMetadata = MoveMetadata {
    id: 615,
    name: "Thousand Waves",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const LAND_S_WRATH: MoveMetadata = MoveMetadata {
    id: 616,
    name: "Land’s Wrath",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const LIGHT_OF_RUIN: MoveMetadata = MoveMetadata {
    id: 617,
    name: "Light of Ruin",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(140),
    pp: 5,
    pkm_type: PkmType::Fairy,
};

const ORIGIN_PULSE: MoveMetadata = MoveMetadata {
    id: 618,
    name: "Origin Pulse",
    accuracy: Some(85),
    class: MoveClass::Special,
    introduced: Generation::G6,
    power: Some(110),
    pp: 10,
    pkm_type: PkmType::Water,
};

const PRECIPICE_BLADES: MoveMetadata = MoveMetadata {
    id: 619,
    name: "Precipice Blades",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const DRAGON_ASCENT: MoveMetadata = MoveMetadata {
    id: 620,
    name: "Dragon Ascent",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Flying,
};

const HYPERSPACE_FURY: MoveMetadata = MoveMetadata {
    id: 621,
    name: "Hyperspace Fury",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G6,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Dark,
};

const BREAKNECK_BLITZ_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 622,
    name: "Breakneck Blitz",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Normal,
};

const BREAKNECK_BLITZ_SPECIAL: MoveMetadata = MoveMetadata {
    id: 623,
    name: "Breakneck Blitz",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Normal,
};

const ALL_OUT_PUMMELING_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 624,
    name: "All-Out Pummeling",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Fighting,
};

const ALL_OUT_PUMMELING_SPECIAL: MoveMetadata = MoveMetadata {
    id: 625,
    name: "All-Out Pummeling",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Fighting,
};

const SUPERSONIC_SKYSTRIKE_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 626,
    name: "Supersonic Skystrike",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Flying,
};

const SUPERSONIC_SKYSTRIKE_SPECIAL: MoveMetadata = MoveMetadata {
    id: 627,
    name: "Supersonic Skystrike",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Flying,
};

const ACID_DOWNPOUR_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 628,
    name: "Acid Downpour",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Poison,
};

const ACID_DOWNPOUR_SPECIAL: MoveMetadata = MoveMetadata {
    id: 629,
    name: "Acid Downpour",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Poison,
};

const TECTONIC_RAGE_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 630,
    name: "Tectonic Rage",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Ground,
};

const TECTONIC_RAGE_SPECIAL: MoveMetadata = MoveMetadata {
    id: 631,
    name: "Tectonic Rage",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Ground,
};

const CONTINENTAL_CRUSH_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 632,
    name: "Continental Crush",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Rock,
};

const CONTINENTAL_CRUSH_SPECIAL: MoveMetadata = MoveMetadata {
    id: 633,
    name: "Continental Crush",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Rock,
};

const SAVAGE_SPIN_OUT_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 634,
    name: "Savage Spin-Out",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Bug,
};

const SAVAGE_SPIN_OUT_SPECIAL: MoveMetadata = MoveMetadata {
    id: 635,
    name: "Savage Spin-Out",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Bug,
};

const NEVER_ENDING_NIGHTMARE_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 636,
    name: "Never-Ending Nightmare",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Ghost,
};

const NEVER_ENDING_NIGHTMARE_SPECIAL: MoveMetadata = MoveMetadata {
    id: 637,
    name: "Never-Ending Nightmare",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Ghost,
};

const CORKSCREW_CRASH_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 638,
    name: "Corkscrew Crash",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Steel,
};

const CORKSCREW_CRASH_SPECIAL: MoveMetadata = MoveMetadata {
    id: 639,
    name: "Corkscrew Crash",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Steel,
};

const INFERNO_OVERDRIVE_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 640,
    name: "Inferno Overdrive",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Fire,
};

const INFERNO_OVERDRIVE_SPECIAL: MoveMetadata = MoveMetadata {
    id: 641,
    name: "Inferno Overdrive",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Fire,
};

const HYDRO_VORTEX_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 642,
    name: "Hydro Vortex",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Water,
};

const HYDRO_VORTEX_SPECIAL: MoveMetadata = MoveMetadata {
    id: 643,
    name: "Hydro Vortex",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Water,
};

const BLOOM_DOOM_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 644,
    name: "Bloom Doom",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Grass,
};

const BLOOM_DOOM_SPECIAL: MoveMetadata = MoveMetadata {
    id: 645,
    name: "Bloom Doom",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Grass,
};

const GIGAVOLT_HAVOC_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 646,
    name: "Gigavolt Havoc",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Electric,
};

const GIGAVOLT_HAVOC_SPECIAL: MoveMetadata = MoveMetadata {
    id: 647,
    name: "Gigavolt Havoc",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Electric,
};

const SHATTERED_PSYCHE_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 648,
    name: "Shattered Psyche",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Psychic,
};

const SHATTERED_PSYCHE_SPECIAL: MoveMetadata = MoveMetadata {
    id: 649,
    name: "Shattered Psyche",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Psychic,
};

const SUBZERO_SLAMMER_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 650,
    name: "Subzero Slammer",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Ice,
};

const SUBZERO_SLAMMER_SPECIAL: MoveMetadata = MoveMetadata {
    id: 651,
    name: "Subzero Slammer",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Ice,
};

const DEVASTATING_DRAKE_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 652,
    name: "Devastating Drake",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Dragon,
};

const DEVASTATING_DRAKE_SPECIAL: MoveMetadata = MoveMetadata {
    id: 653,
    name: "Devastating Drake",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Dragon,
};

const BLACK_HOLE_ECLIPSE_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 654,
    name: "Black Hole Eclipse",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Dark,
};

const BLACK_HOLE_ECLIPSE_SPECIAL: MoveMetadata = MoveMetadata {
    id: 655,
    name: "Black Hole Eclipse",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Dark,
};

const TWINKLE_TACKLE_PHYSICAL: MoveMetadata = MoveMetadata {
    id: 656,
    name: "Twinkle Tackle",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Fairy,
};

const TWINKLE_TACKLE_SPECIAL: MoveMetadata = MoveMetadata {
    id: 657,
    name: "Twinkle Tackle",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Fairy,
};

const CATASTROPIKA: MoveMetadata = MoveMetadata {
    id: 658,
    name: "Catastropika",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(210),
    pp: 1,
    pkm_type: PkmType::Electric,
};

const SHORE_UP: MoveMetadata = MoveMetadata {
    id: 659,
    name: "Shore Up",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 5,
    pkm_type: PkmType::Ground,
};

const FIRST_IMPRESSION: MoveMetadata = MoveMetadata {
    id: 660,
    name: "First Impression",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Bug,
};

const BANEFUL_BUNKER: MoveMetadata = MoveMetadata {
    id: 661,
    name: "Baneful Bunker",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 10,
    pkm_type: PkmType::Poison,
};

const SPIRIT_SHACKLE: MoveMetadata = MoveMetadata {
    id: 662,
    name: "Spirit Shackle",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Ghost,
};

const DARKEST_LARIAT: MoveMetadata = MoveMetadata {
    id: 663,
    name: "Darkest Lariat",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(85),
    pp: 10,
    pkm_type: PkmType::Dark,
};

const SPARKLING_ARIA: MoveMetadata = MoveMetadata {
    id: 664,
    name: "Sparkling Aria",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Water,
};

const ICE_HAMMER: MoveMetadata = MoveMetadata {
    id: 665,
    name: "Ice Hammer",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Ice,
};

const FLORAL_HEALING: MoveMetadata = MoveMetadata {
    id: 666,
    name: "Floral Healing",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const HIGH_HORSEPOWER: MoveMetadata = MoveMetadata {
    id: 667,
    name: "High Horsepower",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(95),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const STRENGTH_SAP: MoveMetadata = MoveMetadata {
    id: 668,
    name: "Strength Sap",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 10,
    pkm_type: PkmType::Grass,
};

const SOLAR_BLADE: MoveMetadata = MoveMetadata {
    id: 669,
    name: "Solar Blade",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(125),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const LEAFAGE: MoveMetadata = MoveMetadata {
    id: 670,
    name: "Leafage",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(40),
    pp: 40,
    pkm_type: PkmType::Grass,
};

const SPOTLIGHT: MoveMetadata = MoveMetadata {
    id: 671,
    name: "Spotlight",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 15,
    pkm_type: PkmType::Normal,
};

const TOXIC_THREAD: MoveMetadata = MoveMetadata {
    id: 672,
    name: "Toxic Thread",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 20,
    pkm_type: PkmType::Poison,
};

const LASER_FOCUS: MoveMetadata = MoveMetadata {
    id: 673,
    name: "Laser Focus",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 30,
    pkm_type: PkmType::Normal,
};

const GEAR_UP: MoveMetadata = MoveMetadata {
    id: 674,
    name: "Gear Up",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 20,
    pkm_type: PkmType::Steel,
};

const THROAT_CHOP: MoveMetadata = MoveMetadata {
    id: 675,
    name: "Throat Chop",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Dark,
};

const POLLEN_PUFF: MoveMetadata = MoveMetadata {
    id: 676,
    name: "Pollen Puff",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(90),
    pp: 15,
    pkm_type: PkmType::Bug,
};

const ANCHOR_SHOT: MoveMetadata = MoveMetadata {
    id: 677,
    name: "Anchor Shot",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(80),
    pp: 20,
    pkm_type: PkmType::Steel,
};

const PSYCHIC_TERRAIN: MoveMetadata = MoveMetadata {
    id: 678,
    name: "Psychic Terrain",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const LUNGE: MoveMetadata = MoveMetadata {
    id: 679,
    name: "Lunge",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Bug,
};

const FIRE_LASH: MoveMetadata = MoveMetadata {
    id: 680,
    name: "Fire Lash",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Fire,
};

const POWER_TRIP: MoveMetadata = MoveMetadata {
    id: 681,
    name: "Power Trip",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(20),
    pp: 10,
    pkm_type: PkmType::Dark,
};

const BURN_UP: MoveMetadata = MoveMetadata {
    id: 682,
    name: "Burn Up",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(130),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const SPEED_SWAP: MoveMetadata = MoveMetadata {
    id: 683,
    name: "Speed Swap",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const SMART_STRIKE: MoveMetadata = MoveMetadata {
    id: 684,
    name: "Smart Strike",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(70),
    pp: 10,
    pkm_type: PkmType::Steel,
};

const PURIFY: MoveMetadata = MoveMetadata {
    id: 685,
    name: "Purify",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 20,
    pkm_type: PkmType::Poison,
};

const REVELATION_DANCE: MoveMetadata = MoveMetadata {
    id: 686,
    name: "Revelation Dance",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(90),
    pp: 15,
    pkm_type: PkmType::Normal,
};

const CORE_ENFORCER: MoveMetadata = MoveMetadata {
    id: 687,
    name: "Core Enforcer",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Dragon,
};

const TROP_KICK: MoveMetadata = MoveMetadata {
    id: 688,
    name: "Trop Kick",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(70),
    pp: 15,
    pkm_type: PkmType::Grass,
};

const INSTRUCT: MoveMetadata = MoveMetadata {
    id: 689,
    name: "Instruct",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 15,
    pkm_type: PkmType::Psychic,
};

const BEAK_BLAST: MoveMetadata = MoveMetadata {
    id: 690,
    name: "Beak Blast",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(100),
    pp: 15,
    pkm_type: PkmType::Flying,
};

const CLANGING_SCALES: MoveMetadata = MoveMetadata {
    id: 691,
    name: "Clanging Scales",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(110),
    pp: 5,
    pkm_type: PkmType::Dragon,
};

const DRAGON_HAMMER: MoveMetadata = MoveMetadata {
    id: 692,
    name: "Dragon Hammer",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(90),
    pp: 15,
    pkm_type: PkmType::Dragon,
};

const BRUTAL_SWING: MoveMetadata = MoveMetadata {
    id: 693,
    name: "Brutal Swing",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Dark,
};

const AURORA_VEIL: MoveMetadata = MoveMetadata {
    id: 694,
    name: "Aurora Veil",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 20,
    pkm_type: PkmType::Ice,
};

const SINISTER_ARROW_RAID: MoveMetadata = MoveMetadata {
    id: 695,
    name: "Sinister Arrow Raid",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(180),
    pp: 1,
    pkm_type: PkmType::Ghost,
};

const MALICIOUS_MOONSAULT: MoveMetadata = MoveMetadata {
    id: 696,
    name: "Malicious Moonsault",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(180),
    pp: 1,
    pkm_type: PkmType::Dark,
};

const OCEANIC_OPERETTA: MoveMetadata = MoveMetadata {
    id: 697,
    name: "Oceanic Operetta",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(195),
    pp: 1,
    pkm_type: PkmType::Water,
};

const GUARDIAN_OF_ALOLA: MoveMetadata = MoveMetadata {
    id: 698,
    name: "Guardian of Alola",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Fairy,
};

const SOUL_STEALING_7_STAR_STRIKE: MoveMetadata = MoveMetadata {
    id: 699,
    name: "Soul-Stealing 7-Star Strike",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(195),
    pp: 1,
    pkm_type: PkmType::Ghost,
};

const STOKED_SPARKSURFER: MoveMetadata = MoveMetadata {
    id: 700,
    name: "Stoked Sparksurfer",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(175),
    pp: 1,
    pkm_type: PkmType::Electric,
};

const PULVERIZING_PANCAKE: MoveMetadata = MoveMetadata {
    id: 701,
    name: "Pulverizing Pancake",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(210),
    pp: 1,
    pkm_type: PkmType::Normal,
};

const EXTREME_EVOBOOST: MoveMetadata = MoveMetadata {
    id: 702,
    name: "Extreme Evoboost",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 1,
    pkm_type: PkmType::Normal,
};

const GENESIS_SUPERNOVA: MoveMetadata = MoveMetadata {
    id: 703,
    name: "Genesis Supernova",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(185),
    pp: 1,
    pkm_type: PkmType::Psychic,
};

const SHELL_TRAP: MoveMetadata = MoveMetadata {
    id: 704,
    name: "Shell Trap",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const FLEUR_CANNON: MoveMetadata = MoveMetadata {
    id: 705,
    name: "Fleur Cannon",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(130),
    pp: 5,
    pkm_type: PkmType::Fairy,
};

const PSYCHIC_FANGS: MoveMetadata = MoveMetadata {
    id: 706,
    name: "Psychic Fangs",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(85),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const STOMPING_TANTRUM: MoveMetadata = MoveMetadata {
    id: 707,
    name: "Stomping Tantrum",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(75),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const SHADOW_BONE: MoveMetadata = MoveMetadata {
    id: 708,
    name: "Shadow Bone",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(85),
    pp: 10,
    pkm_type: PkmType::Ghost,
};

const ACCELEROCK: MoveMetadata = MoveMetadata {
    id: 709,
    name: "Accelerock",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(40),
    pp: 20,
    pkm_type: PkmType::Rock,
};

const LIQUIDATION: MoveMetadata = MoveMetadata {
    id: 710,
    name: "Liquidation",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(85),
    pp: 10,
    pkm_type: PkmType::Water,
};

const PRISMATIC_LASER: MoveMetadata = MoveMetadata {
    id: 711,
    name: "Prismatic Laser",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(160),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const SPECTRAL_THIEF: MoveMetadata = MoveMetadata {
    id: 712,
    name: "Spectral Thief",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Ghost,
};

const SUNSTEEL_STRIKE: MoveMetadata = MoveMetadata {
    id: 713,
    name: "Sunsteel Strike",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Steel,
};

const MOONGEIST_BEAM: MoveMetadata = MoveMetadata {
    id: 714,
    name: "Moongeist Beam",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Ghost,
};

const TEARFUL_LOOK: MoveMetadata = MoveMetadata {
    id: 715,
    name: "Tearful Look",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G7,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const ZING_ZAP: MoveMetadata = MoveMetadata {
    id: 716,
    name: "Zing Zap",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Electric,
};

const NATURE_S_MADNESS: MoveMetadata = MoveMetadata {
    id: 717,
    name: "Nature’s Madness",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const MULTI_ATTACK: MoveMetadata = MoveMetadata {
    id: 718,
    name: "Multi-Attack",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const TEN_MILLION_VOLT_THUNDERBOLT: MoveMetadata = MoveMetadata {
    id: 719,
    name: "10,000,000 Volt Thunderbolt",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(195),
    pp: 1,
    pkm_type: PkmType::Electric,
};

const MIND_BLOWN: MoveMetadata = MoveMetadata {
    id: 720,
    name: "Mind Blown",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const PLASMA_FISTS: MoveMetadata = MoveMetadata {
    id: 721,
    name: "Plasma Fists",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(100),
    pp: 15,
    pkm_type: PkmType::Electric,
};

const PHOTON_GEYSER: MoveMetadata = MoveMetadata {
    id: 722,
    name: "Photon Geyser",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Psychic,
};

const LIGHT_THAT_BURNS_THE_SKY: MoveMetadata = MoveMetadata {
    id: 723,
    name: "Light That Burns the Sky",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(200),
    pp: 1,
    pkm_type: PkmType::Psychic,
};

const SEARING_SUNRAZE_SMASH: MoveMetadata = MoveMetadata {
    id: 724,
    name: "Searing Sunraze Smash",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(200),
    pp: 1,
    pkm_type: PkmType::Steel,
};

const MENACING_MOONRAZE_MAELSTROM: MoveMetadata = MoveMetadata {
    id: 725,
    name: "Menacing Moonraze Maelstrom",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(200),
    pp: 1,
    pkm_type: PkmType::Ghost,
};

const LET_S_SNUGGLE_FOREVER: MoveMetadata = MoveMetadata {
    id: 726,
    name: "Let’s Snuggle Forever",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(190),
    pp: 1,
    pkm_type: PkmType::Fairy,
};

const SPLINTERED_STORMSHARDS: MoveMetadata = MoveMetadata {
    id: 727,
    name: "Splintered Stormshards",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(190),
    pp: 1,
    pkm_type: PkmType::Rock,
};

const CLANGOROUS_SOULBLAZE: MoveMetadata = MoveMetadata {
    id: 728,
    name: "Clangorous Soulblaze",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(185),
    pp: 1,
    pkm_type: PkmType::Dragon,
};

const ZIPPY_ZAP: MoveMetadata = MoveMetadata {
    id: 729,
    name: "Zippy Zap",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Electric,
};

const SPLISHY_SPLASH: MoveMetadata = MoveMetadata {
    id: 730,
    name: "Splishy Splash",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(90),
    pp: 15,
    pkm_type: PkmType::Water,
};

const FLOATY_FALL: MoveMetadata = MoveMetadata {
    id: 731,
    name: "Floaty Fall",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(90),
    pp: 15,
    pkm_type: PkmType::Flying,
};

const PIKA_PAPOW: MoveMetadata = MoveMetadata {
    id: 732,
    name: "Pika Papow",
    accuracy: None,
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: None,
    pp: 20,
    pkm_type: PkmType::Electric,
};

const BOUNCY_BUBBLE: MoveMetadata = MoveMetadata {
    id: 733,
    name: "Bouncy Bubble",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Water,
};

const BUZZY_BUZZ: MoveMetadata = MoveMetadata {
    id: 734,
    name: "Buzzy Buzz",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Electric,
};

const SIZZLY_SLIDE: MoveMetadata = MoveMetadata {
    id: 735,
    name: "Sizzly Slide",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Fire,
};

const GLITZY_GLOW: MoveMetadata = MoveMetadata {
    id: 736,
    name: "Glitzy Glow",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Psychic,
};

const BADDY_BAD: MoveMetadata = MoveMetadata {
    id: 737,
    name: "Baddy Bad",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Dark,
};

const SAPPY_SEED: MoveMetadata = MoveMetadata {
    id: 738,
    name: "Sappy Seed",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const FREEZY_FROST: MoveMetadata = MoveMetadata {
    id: 739,
    name: "Freezy Frost",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Ice,
};

const SPARKLY_SWIRL: MoveMetadata = MoveMetadata {
    id: 740,
    name: "Sparkly Swirl",
    accuracy: Some(85),
    class: MoveClass::Special,
    introduced: Generation::G7,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Fairy,
};

const VEEVEE_VOLLEY: MoveMetadata = MoveMetadata {
    id: 741,
    name: "Veevee Volley",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: None,
    pp: 20,
    pkm_type: PkmType::Normal,
};

const DOUBLE_IRON_BASH: MoveMetadata = MoveMetadata {
    id: 742,
    name: "Double Iron Bash",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G7,
    power: Some(60),
    pp: 5,
    pkm_type: PkmType::Steel,
};

const MAX_GUARD: MoveMetadata = MoveMetadata {
    id: 743,
    name: "Max Guard",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const DYNAMAX_CANNON: MoveMetadata = MoveMetadata {
    id: 744,
    name: "Dynamax Cannon",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Dragon,
};

const SNIPE_SHOT: MoveMetadata = MoveMetadata {
    id: 745,
    name: "Snipe Shot",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Water,
};

const JAW_LOCK: MoveMetadata = MoveMetadata {
    id: 746,
    name: "Jaw Lock",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Dark,
};

const STUFF_CHEEKS: MoveMetadata = MoveMetadata {
    id: 747,
    name: "Stuff Cheeks",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const NO_RETREAT: MoveMetadata = MoveMetadata {
    id: 748,
    name: "No Retreat",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 5,
    pkm_type: PkmType::Fighting,
};

const TAR_SHOT: MoveMetadata = MoveMetadata {
    id: 749,
    name: "Tar Shot",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 15,
    pkm_type: PkmType::Rock,
};

const MAGIC_POWDER: MoveMetadata = MoveMetadata {
    id: 750,
    name: "Magic Powder",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 20,
    pkm_type: PkmType::Psychic,
};

const DRAGON_DARTS: MoveMetadata = MoveMetadata {
    id: 751,
    name: "Dragon Darts",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(50),
    pp: 10,
    pkm_type: PkmType::Dragon,
};

const TEATIME: MoveMetadata = MoveMetadata {
    id: 752,
    name: "Teatime",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const OCTOLOCK: MoveMetadata = MoveMetadata {
    id: 753,
    name: "Octolock",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 15,
    pkm_type: PkmType::Fighting,
};

const BOLT_BEAK: MoveMetadata = MoveMetadata {
    id: 754,
    name: "Bolt Beak",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(85),
    pp: 10,
    pkm_type: PkmType::Electric,
};

const FISHIOUS_REND: MoveMetadata = MoveMetadata {
    id: 755,
    name: "Fishious Rend",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(85),
    pp: 10,
    pkm_type: PkmType::Water,
};

const COURT_CHANGE: MoveMetadata = MoveMetadata {
    id: 756,
    name: "Court Change",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 10,
    pkm_type: PkmType::Normal,
};

const MAX_FLARE: MoveMetadata = MoveMetadata {
    id: 757,
    name: "Max Flare",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Fire,
};

const MAX_FLUTTERBY: MoveMetadata = MoveMetadata {
    id: 758,
    name: "Max Flutterby",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Bug,
};

const MAX_LIGHTNING: MoveMetadata = MoveMetadata {
    id: 759,
    name: "Max Lightning",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Electric,
};

const MAX_STRIKE: MoveMetadata = MoveMetadata {
    id: 760,
    name: "Max Strike",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const MAX_KNUCKLE: MoveMetadata = MoveMetadata {
    id: 761,
    name: "Max Knuckle",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const MAX_PHANTASM: MoveMetadata = MoveMetadata {
    id: 762,
    name: "Max Phantasm",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Ghost,
};

const MAX_HAILSTORM: MoveMetadata = MoveMetadata {
    id: 763,
    name: "Max Hailstorm",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Ice,
};

const MAX_OOZE: MoveMetadata = MoveMetadata {
    id: 764,
    name: "Max Ooze",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Poison,
};

const MAX_GEYSER: MoveMetadata = MoveMetadata {
    id: 765,
    name: "Max Geyser",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Water,
};

const MAX_AIRSTREAM: MoveMetadata = MoveMetadata {
    id: 766,
    name: "Max Airstream",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Flying,
};

const MAX_STARFALL: MoveMetadata = MoveMetadata {
    id: 767,
    name: "Max Starfall",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const MAX_WYRMWIND: MoveMetadata = MoveMetadata {
    id: 768,
    name: "Max Wyrmwind",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Dragon,
};

const MAX_MINDSTORM: MoveMetadata = MoveMetadata {
    id: 769,
    name: "Max Mindstorm",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const MAX_ROCKFALL: MoveMetadata = MoveMetadata {
    id: 770,
    name: "Max Rockfall",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Rock,
};

const MAX_QUAKE: MoveMetadata = MoveMetadata {
    id: 771,
    name: "Max Quake",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const MAX_DARKNESS: MoveMetadata = MoveMetadata {
    id: 772,
    name: "Max Darkness",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Dark,
};

const MAX_OVERGROWTH: MoveMetadata = MoveMetadata {
    id: 773,
    name: "Max Overgrowth",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const MAX_STEELSPIKE: MoveMetadata = MoveMetadata {
    id: 774,
    name: "Max Steelspike",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(10),
    pp: 10,
    pkm_type: PkmType::Steel,
};

const CLANGOROUS_SOUL: MoveMetadata = MoveMetadata {
    id: 775,
    name: "Clangorous Soul",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 5,
    pkm_type: PkmType::Dragon,
};

const BODY_PRESS: MoveMetadata = MoveMetadata {
    id: 776,
    name: "Body Press",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const DECORATE: MoveMetadata = MoveMetadata {
    id: 777,
    name: "Decorate",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 15,
    pkm_type: PkmType::Fairy,
};

const DRUM_BEATING: MoveMetadata = MoveMetadata {
    id: 778,
    name: "Drum Beating",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const SNAP_TRAP: MoveMetadata = MoveMetadata {
    id: 779,
    name: "Snap Trap",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(35),
    pp: 15,
    pkm_type: PkmType::Grass,
};

const PYRO_BALL: MoveMetadata = MoveMetadata {
    id: 780,
    name: "Pyro Ball",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const BEHEMOTH_BLADE: MoveMetadata = MoveMetadata {
    id: 781,
    name: "Behemoth Blade",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Steel,
};

const BEHEMOTH_BASH: MoveMetadata = MoveMetadata {
    id: 782,
    name: "Behemoth Bash",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Steel,
};

const AURA_WHEEL: MoveMetadata = MoveMetadata {
    id: 783,
    name: "Aura Wheel",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(110),
    pp: 10,
    pkm_type: PkmType::Electric,
};

const BREAKING_SWIPE: MoveMetadata = MoveMetadata {
    id: 784,
    name: "Breaking Swipe",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(60),
    pp: 15,
    pkm_type: PkmType::Dragon,
};

const BRANCH_POKE: MoveMetadata = MoveMetadata {
    id: 785,
    name: "Branch Poke",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(40),
    pp: 40,
    pkm_type: PkmType::Grass,
};

const OVERDRIVE: MoveMetadata = MoveMetadata {
    id: 786,
    name: "Overdrive",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Electric,
};

const APPLE_ACID: MoveMetadata = MoveMetadata {
    id: 787,
    name: "Apple Acid",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const GRAV_APPLE: MoveMetadata = MoveMetadata {
    id: 788,
    name: "Grav Apple",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const SPIRIT_BREAK: MoveMetadata = MoveMetadata {
    id: 789,
    name: "Spirit Break",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(75),
    pp: 15,
    pkm_type: PkmType::Fairy,
};

const STRANGE_STEAM: MoveMetadata = MoveMetadata {
    id: 790,
    name: "Strange Steam",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const LIFE_DEW: MoveMetadata = MoveMetadata {
    id: 791,
    name: "Life Dew",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 10,
    pkm_type: PkmType::Water,
};

const OBSTRUCT: MoveMetadata = MoveMetadata {
    id: 792,
    name: "Obstruct",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 10,
    pkm_type: PkmType::Dark,
};

const FALSE_SURRENDER: MoveMetadata = MoveMetadata {
    id: 793,
    name: "False Surrender",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Dark,
};

const METEOR_ASSAULT: MoveMetadata = MoveMetadata {
    id: 794,
    name: "Meteor Assault",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Fighting,
};

const ETERNABEAM: MoveMetadata = MoveMetadata {
    id: 795,
    name: "Eternabeam",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(160),
    pp: 5,
    pkm_type: PkmType::Dragon,
};

const STEEL_BEAM: MoveMetadata = MoveMetadata {
    id: 796,
    name: "Steel Beam",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(140),
    pp: 5,
    pkm_type: PkmType::Steel,
};

const EXPANDING_FORCE: MoveMetadata = MoveMetadata {
    id: 797,
    name: "Expanding Force",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const STEEL_ROLLER: MoveMetadata = MoveMetadata {
    id: 798,
    name: "Steel Roller",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(130),
    pp: 5,
    pkm_type: PkmType::Steel,
};

const SCALE_SHOT: MoveMetadata = MoveMetadata {
    id: 799,
    name: "Scale Shot",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(25),
    pp: 20,
    pkm_type: PkmType::Dragon,
};

const METEOR_BEAM: MoveMetadata = MoveMetadata {
    id: 800,
    name: "Meteor Beam",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Rock,
};

const SHELL_SIDE_ARM: MoveMetadata = MoveMetadata {
    id: 801,
    name: "Shell Side Arm",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Poison,
};

const MISTY_EXPLOSION: MoveMetadata = MoveMetadata {
    id: 802,
    name: "Misty Explosion",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Fairy,
};

const GRASSY_GLIDE: MoveMetadata = MoveMetadata {
    id: 803,
    name: "Grassy Glide",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(70),
    pp: 20,
    pkm_type: PkmType::Grass,
};

const RISING_VOLTAGE: MoveMetadata = MoveMetadata {
    id: 804,
    name: "Rising Voltage",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(70),
    pp: 20,
    pkm_type: PkmType::Electric,
};

const TERRAIN_PULSE: MoveMetadata = MoveMetadata {
    id: 805,
    name: "Terrain Pulse",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(50),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const SKITTER_SMACK: MoveMetadata = MoveMetadata {
    id: 806,
    name: "Skitter Smack",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(70),
    pp: 10,
    pkm_type: PkmType::Bug,
};

const BURNING_JEALOUSY: MoveMetadata = MoveMetadata {
    id: 807,
    name: "Burning Jealousy",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(70),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const LASH_OUT: MoveMetadata = MoveMetadata {
    id: 808,
    name: "Lash Out",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(75),
    pp: 5,
    pkm_type: PkmType::Dark,
};

const POLTERGEIST: MoveMetadata = MoveMetadata {
    id: 809,
    name: "Poltergeist",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(110),
    pp: 5,
    pkm_type: PkmType::Ghost,
};

const CORROSIVE_GAS: MoveMetadata = MoveMetadata {
    id: 810,
    name: "Corrosive Gas",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 40,
    pkm_type: PkmType::Poison,
};

const COACHING: MoveMetadata = MoveMetadata {
    id: 811,
    name: "Coaching",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const FLIP_TURN: MoveMetadata = MoveMetadata {
    id: 812,
    name: "Flip Turn",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(60),
    pp: 20,
    pkm_type: PkmType::Water,
};

const TRIPLE_AXEL: MoveMetadata = MoveMetadata {
    id: 813,
    name: "Triple Axel",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(20),
    pp: 10,
    pkm_type: PkmType::Ice,
};

const DUAL_WINGBEAT: MoveMetadata = MoveMetadata {
    id: 814,
    name: "Dual Wingbeat",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(40),
    pp: 10,
    pkm_type: PkmType::Flying,
};

const SCORCHING_SANDS: MoveMetadata = MoveMetadata {
    id: 815,
    name: "Scorching Sands",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(70),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const JUNGLE_HEALING: MoveMetadata = MoveMetadata {
    id: 816,
    name: "Jungle Healing",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: None,
    pp: 10,
    pkm_type: PkmType::Grass,
};

const WICKED_BLOW: MoveMetadata = MoveMetadata {
    id: 817,
    name: "Wicked Blow",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(80),
    pp: 5,
    pkm_type: PkmType::Dark,
};

const SURGING_STRIKES: MoveMetadata = MoveMetadata {
    id: 818,
    name: "Surging Strikes",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(25),
    pp: 5,
    pkm_type: PkmType::Water,
};

const THUNDER_CAGE: MoveMetadata = MoveMetadata {
    id: 819,
    name: "Thunder Cage",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Electric,
};

const DRAGON_ENERGY: MoveMetadata = MoveMetadata {
    id: 820,
    name: "Dragon Energy",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Dragon,
};

const FREEZING_GLARE: MoveMetadata = MoveMetadata {
    id: 821,
    name: "Freezing Glare",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const FIERY_WRATH: MoveMetadata = MoveMetadata {
    id: 822,
    name: "Fiery Wrath",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Dark,
};

const THUNDEROUS_KICK: MoveMetadata = MoveMetadata {
    id: 823,
    name: "Thunderous Kick",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const GLACIAL_LANCE: MoveMetadata = MoveMetadata {
    id: 824,
    name: "Glacial Lance",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(130),
    pp: 5,
    pkm_type: PkmType::Ice,
};

const ASTRAL_BARRAGE: MoveMetadata = MoveMetadata {
    id: 825,
    name: "Astral Barrage",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Ghost,
};

const EERIE_SPELL: MoveMetadata = MoveMetadata {
    id: 826,
    name: "Eerie Spell",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(80),
    pp: 5,
    pkm_type: PkmType::Psychic,
};

const DIRE_CLAW: MoveMetadata = MoveMetadata {
    id: 827,
    name: "Dire Claw",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Poison,
};

const PSYSHIELD_BASH: MoveMetadata = MoveMetadata {
    id: 828,
    name: "Psyshield Bash",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(70),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const POWER_SHIFT: MoveMetadata = MoveMetadata {
    id: 829,
    name: "Power Shift",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: Some(0),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const STONE_AXE: MoveMetadata = MoveMetadata {
    id: 830,
    name: "Stone Axe",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(65),
    pp: 15,
    pkm_type: PkmType::Rock,
};

const SPRINGTIDE_STORM: MoveMetadata = MoveMetadata {
    id: 831,
    name: "Springtide Storm",
    accuracy: Some(80),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Fairy,
};

const MYSTICAL_POWER: MoveMetadata = MoveMetadata {
    id: 832,
    name: "Mystical Power",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(70),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const RAGING_FURY: MoveMetadata = MoveMetadata {
    id: 833,
    name: "Raging Fury",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Fire,
};

const WAVE_CRASH: MoveMetadata = MoveMetadata {
    id: 834,
    name: "Wave Crash",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Water,
};

const CHLOROBLAST: MoveMetadata = MoveMetadata {
    id: 835,
    name: "Chloroblast",
    accuracy: Some(95),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(150),
    pp: 5,
    pkm_type: PkmType::Grass,
};

const MOUNTAIN_GALE: MoveMetadata = MoveMetadata {
    id: 836,
    name: "Mountain Gale",
    accuracy: Some(85),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Ice,
};

const VICTORY_DANCE: MoveMetadata = MoveMetadata {
    id: 837,
    name: "Victory Dance",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: Some(0),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const HEADLONG_RUSH: MoveMetadata = MoveMetadata {
    id: 838,
    name: "Headlong Rush",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Ground,
};

const BARB_BARRAGE: MoveMetadata = MoveMetadata {
    id: 839,
    name: "Barb Barrage",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(60),
    pp: 10,
    pkm_type: PkmType::Poison,
};

const ESPER_WING: MoveMetadata = MoveMetadata {
    id: 840,
    name: "Esper Wing",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const BITTER_MALICE: MoveMetadata = MoveMetadata {
    id: 841,
    name: "Bitter Malice",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(75),
    pp: 10,
    pkm_type: PkmType::Ghost,
};

const SHELTER: MoveMetadata = MoveMetadata {
    id: 842,
    name: "Shelter",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: Some(0),
    pp: 10,
    pkm_type: PkmType::Steel,
};

const TRIPLE_ARROWS: MoveMetadata = MoveMetadata {
    id: 843,
    name: "Triple Arrows",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const INFERNAL_PARADE: MoveMetadata = MoveMetadata {
    id: 844,
    name: "Infernal Parade",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(60),
    pp: 15,
    pkm_type: PkmType::Ghost,
};

const CEASELESS_EDGE: MoveMetadata = MoveMetadata {
    id: 845,
    name: "Ceaseless Edge",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G8,
    power: Some(65),
    pp: 15,
    pkm_type: PkmType::Dark,
};

const BLEAKWIND_STORM: MoveMetadata = MoveMetadata {
    id: 846,
    name: "Bleakwind Storm",
    accuracy: Some(80),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Flying,
};

const WILDBOLT_STORM: MoveMetadata = MoveMetadata {
    id: 847,
    name: "Wildbolt Storm",
    accuracy: Some(80),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Electric,
};

const SANDSEAR_STORM: MoveMetadata = MoveMetadata {
    id: 848,
    name: "Sandsear Storm",
    accuracy: Some(80),
    class: MoveClass::Special,
    introduced: Generation::G8,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Ground,
};

const LUNAR_BLESSING: MoveMetadata = MoveMetadata {
    id: 849,
    name: "Lunar Blessing",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: Some(0),
    pp: 5,
    pkm_type: PkmType::Psychic,
};

const TAKE_HEART: MoveMetadata = MoveMetadata {
    id: 850,
    name: "Take Heart",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G8,
    power: Some(0),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const TERA_BLAST: MoveMetadata = MoveMetadata {
    id: 851,
    name: "Tera Blast",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const SILK_TRAP: MoveMetadata = MoveMetadata {
    id: 852,
    name: "Silk Trap",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G9,
    power: Some(0),
    pp: 10,
    pkm_type: PkmType::Bug,
};

const AXE_KICK: MoveMetadata = MoveMetadata {
    id: 853,
    name: "Axe Kick",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(120),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const LAST_RESPECTS: MoveMetadata = MoveMetadata {
    id: 854,
    name: "Last Respects",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(50),
    pp: 10,
    pkm_type: PkmType::Ghost,
};

const LUMINA_CRASH: MoveMetadata = MoveMetadata {
    id: 855,
    name: "Lumina Crash",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const ORDER_UP: MoveMetadata = MoveMetadata {
    id: 856,
    name: "Order Up",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Dragon,
};

const JET_PUNCH: MoveMetadata = MoveMetadata {
    id: 857,
    name: "Jet Punch",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(60),
    pp: 15,
    pkm_type: PkmType::Water,
};

const SPICY_EXTRACT: MoveMetadata = MoveMetadata {
    id: 858,
    name: "Spicy Extract",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G9,
    power: Some(0),
    pp: 15,
    pkm_type: PkmType::Grass,
};

const SPIN_OUT: MoveMetadata = MoveMetadata {
    id: 859,
    name: "Spin Out",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Steel,
};

const POPULATION_BOMB: MoveMetadata = MoveMetadata {
    id: 860,
    name: "Population Bomb",
    accuracy: Some(90),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(20),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const ICE_SPINNER: MoveMetadata = MoveMetadata {
    id: 861,
    name: "Ice Spinner",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Ice,
};

const GLAIVE_RUSH: MoveMetadata = MoveMetadata {
    id: 862,
    name: "Glaive Rush",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Dragon,
};

const REVIVAL_BLESSING: MoveMetadata = MoveMetadata {
    id: 863,
    name: "Revival Blessing",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G9,
    power: Some(0),
    pp: 1,
    pkm_type: PkmType::Normal,
};

const SALT_CURE: MoveMetadata = MoveMetadata {
    id: 864,
    name: "Salt Cure",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(40),
    pp: 15,
    pkm_type: PkmType::Rock,
};

const TRIPLE_DIVE: MoveMetadata = MoveMetadata {
    id: 865,
    name: "Triple Dive",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(30),
    pp: 10,
    pkm_type: PkmType::Water,
};

const MORTAL_SPIN: MoveMetadata = MoveMetadata {
    id: 866,
    name: "Mortal Spin",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(30),
    pp: 15,
    pkm_type: PkmType::Poison,
};

const DOODLE: MoveMetadata = MoveMetadata {
    id: 867,
    name: "Doodle",
    accuracy: Some(100),
    class: MoveClass::Status,
    introduced: Generation::G9,
    power: Some(0),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const FILLET_AWAY: MoveMetadata = MoveMetadata {
    id: 868,
    name: "Fillet Away",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G9,
    power: Some(0),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const KOWTOW_CLEAVE: MoveMetadata = MoveMetadata {
    id: 869,
    name: "Kowtow Cleave",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(85),
    pp: 10,
    pkm_type: PkmType::Dark,
};

const FLOWER_TRICK: MoveMetadata = MoveMetadata {
    id: 870,
    name: "Flower Trick",
    accuracy: None,
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(70),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const TORCH_SONG: MoveMetadata = MoveMetadata {
    id: 871,
    name: "Torch Song",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Fire,
};

const AQUA_STEP: MoveMetadata = MoveMetadata {
    id: 872,
    name: "Aqua Step",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Water,
};

const RAGING_BULL: MoveMetadata = MoveMetadata {
    id: 873,
    name: "Raging Bull",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const MAKE_IT_RAIN: MoveMetadata = MoveMetadata {
    id: 874,
    name: "Make It Rain",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Steel,
};

const PSYBLADE: MoveMetadata = MoveMetadata {
    id: 875,
    name: "Psyblade",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Psychic,
};

const HYDRO_STEAM: MoveMetadata = MoveMetadata {
    id: 876,
    name: "Hydro Steam",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Water,
};

const RUINATION: MoveMetadata = MoveMetadata {
    id: 877,
    name: "Ruination",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(1),
    pp: 10,
    pkm_type: PkmType::Dark,
};

const COLLISION_COURSE: MoveMetadata = MoveMetadata {
    id: 878,
    name: "Collision Course",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Fighting,
};

const ELECTRO_DRIFT: MoveMetadata = MoveMetadata {
    id: 879,
    name: "Electro Drift",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Electric,
};

const SHED_TAIL: MoveMetadata = MoveMetadata {
    id: 880,
    name: "Shed Tail",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G9,
    power: Some(0),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const CHILLY_RECEPTION: MoveMetadata = MoveMetadata {
    id: 881,
    name: "Chilly Reception",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G9,
    power: Some(0),
    pp: 10,
    pkm_type: PkmType::Ice,
};

const TIDY_UP: MoveMetadata = MoveMetadata {
    id: 882,
    name: "Tidy Up",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G9,
    power: Some(0),
    pp: 10,
    pkm_type: PkmType::Normal,
};

const SNOWSCAPE: MoveMetadata = MoveMetadata {
    id: 883,
    name: "Snowscape",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G9,
    power: Some(0),
    pp: 10,
    pkm_type: PkmType::Ice,
};

const POUNCE: MoveMetadata = MoveMetadata {
    id: 884,
    name: "Pounce",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(50),
    pp: 20,
    pkm_type: PkmType::Bug,
};

const TRAILBLAZE: MoveMetadata = MoveMetadata {
    id: 885,
    name: "Trailblaze",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(50),
    pp: 20,
    pkm_type: PkmType::Grass,
};

const CHILLING_WATER: MoveMetadata = MoveMetadata {
    id: 886,
    name: "Chilling Water",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(50),
    pp: 20,
    pkm_type: PkmType::Water,
};

const HYPER_DRILL: MoveMetadata = MoveMetadata {
    id: 887,
    name: "Hyper Drill",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Normal,
};

const TWIN_BEAM: MoveMetadata = MoveMetadata {
    id: 888,
    name: "Twin Beam",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(40),
    pp: 10,
    pkm_type: PkmType::Psychic,
};

const RAGE_FIST: MoveMetadata = MoveMetadata {
    id: 889,
    name: "Rage Fist",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(50),
    pp: 10,
    pkm_type: PkmType::Ghost,
};

const ARMOR_CANNON: MoveMetadata = MoveMetadata {
    id: 890,
    name: "Armor Cannon",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Fire,
};

const BITTER_BLADE: MoveMetadata = MoveMetadata {
    id: 891,
    name: "Bitter Blade",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(90),
    pp: 10,
    pkm_type: PkmType::Fire,
};

const DOUBLE_SHOCK: MoveMetadata = MoveMetadata {
    id: 892,
    name: "Double Shock",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Electric,
};

const GIGATON_HAMMER: MoveMetadata = MoveMetadata {
    id: 893,
    name: "Gigaton Hammer",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(160),
    pp: 5,
    pkm_type: PkmType::Steel,
};

const COMEUPPANCE: MoveMetadata = MoveMetadata {
    id: 894,
    name: "Comeuppance",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(1),
    pp: 10,
    pkm_type: PkmType::Dark,
};

const AQUA_CUTTER: MoveMetadata = MoveMetadata {
    id: 895,
    name: "Aqua Cutter",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(70),
    pp: 20,
    pkm_type: PkmType::Water,
};

const BLAZING_TORQUE: MoveMetadata = MoveMetadata {
    id: 896,
    name: "Blazing Torque",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Fire,
};

const WICKED_TORQUE: MoveMetadata = MoveMetadata {
    id: 897,
    name: "Wicked Torque",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Dark,
};

const NOXIOUS_TORQUE: MoveMetadata = MoveMetadata {
    id: 898,
    name: "Noxious Torque",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Poison,
};

const COMBAT_TORQUE: MoveMetadata = MoveMetadata {
    id: 899,
    name: "Combat Torque",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Fighting,
};

const MAGICAL_TORQUE: MoveMetadata = MoveMetadata {
    id: 900,
    name: "Magical Torque",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const BLOOD_MOON: MoveMetadata = MoveMetadata {
    id: 901,
    name: "Blood Moon",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(140),
    pp: 5,
    pkm_type: PkmType::Normal,
};

const MATCHA_GOTCHA: MoveMetadata = MoveMetadata {
    id: 902,
    name: "Matcha Gotcha",
    accuracy: Some(90),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(80),
    pp: 15,
    pkm_type: PkmType::Grass,
};

const SYRUP_BOMB: MoveMetadata = MoveMetadata {
    id: 903,
    name: "Syrup Bomb",
    accuracy: Some(85),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(60),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const IVY_CUDGEL: MoveMetadata = MoveMetadata {
    id: 904,
    name: "Ivy Cudgel",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(100),
    pp: 10,
    pkm_type: PkmType::Grass,
};

const ELECTRO_SHOT: MoveMetadata = MoveMetadata {
    id: 905,
    name: "Electro Shot",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(130),
    pp: 10,
    pkm_type: PkmType::Electric,
};

const TERA_STARSTORM: MoveMetadata = MoveMetadata {
    id: 906,
    name: "Tera Starstorm",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(120),
    pp: 5,
    pkm_type: PkmType::Normal,
};

const FICKLE_BEAM: MoveMetadata = MoveMetadata {
    id: 907,
    name: "Fickle Beam",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(80),
    pp: 5,
    pkm_type: PkmType::Dragon,
};

const BURNING_BULWARK: MoveMetadata = MoveMetadata {
    id: 908,
    name: "Burning Bulwark",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G9,
    power: None,
    pp: 10,
    pkm_type: PkmType::Fire,
};

const THUNDERCLAP: MoveMetadata = MoveMetadata {
    id: 909,
    name: "Thunderclap",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(70),
    pp: 5,
    pkm_type: PkmType::Electric,
};

const MIGHTY_CLEAVE: MoveMetadata = MoveMetadata {
    id: 910,
    name: "Mighty Cleave",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(95),
    pp: 5,
    pkm_type: PkmType::Rock,
};

const TACHYON_CUTTER: MoveMetadata = MoveMetadata {
    id: 911,
    name: "Tachyon Cutter",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(50),
    pp: 10,
    pkm_type: PkmType::Steel,
};

const HARD_PRESS: MoveMetadata = MoveMetadata {
    id: 912,
    name: "Hard Press",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: None,
    pp: 10,
    pkm_type: PkmType::Steel,
};

const DRAGON_CHEER: MoveMetadata = MoveMetadata {
    id: 913,
    name: "Dragon Cheer",
    accuracy: None,
    class: MoveClass::Status,
    introduced: Generation::G9,
    power: None,
    pp: 15,
    pkm_type: PkmType::Dragon,
};

const ALLURING_VOICE: MoveMetadata = MoveMetadata {
    id: 914,
    name: "Alluring Voice",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(80),
    pp: 10,
    pkm_type: PkmType::Fairy,
};

const TEMPER_FLARE: MoveMetadata = MoveMetadata {
    id: 915,
    name: "Temper Flare",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(75),
    pp: 10,
    pkm_type: PkmType::Fire,
};

const SUPERCELL_SLAM: MoveMetadata = MoveMetadata {
    id: 916,
    name: "Supercell Slam",
    accuracy: Some(95),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(100),
    pp: 15,
    pkm_type: PkmType::Electric,
};

const PSYCHIC_NOISE: MoveMetadata = MoveMetadata {
    id: 917,
    name: "Psychic Noise",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(75),
    pp: 15,
    pkm_type: PkmType::Electric,
};

const UPPER_HAND: MoveMetadata = MoveMetadata {
    id: 918,
    name: "Upper Hand",
    accuracy: Some(100),
    class: MoveClass::Physical,
    introduced: Generation::G9,
    power: Some(65),
    pp: 15,
    pkm_type: PkmType::Fighting,
};

const MALIGNANT_CHAIN: MoveMetadata = MoveMetadata {
    id: 919,
    name: "Malignant Chain",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(100),
    pp: 5,
    pkm_type: PkmType::Poison,
};

const NIHIL_LIGHT: MoveMetadata = MoveMetadata {
    id: 920,
    name: "Nihil Light",
    accuracy: Some(100),
    class: MoveClass::Special,
    introduced: Generation::G9,
    power: Some(200),
    pp: 10,
    pkm_type: PkmType::Dragon,
};

const ALL_MOVES: [&MoveMetadata; 920] = [
    &POUND,
    &KARATE_CHOP,
    &DOUBLE_SLAP,
    &COMET_PUNCH,
    &MEGA_PUNCH,
    &PAY_DAY,
    &FIRE_PUNCH,
    &ICE_PUNCH,
    &THUNDER_PUNCH,
    &SCRATCH,
    &VISE_GRIP,
    &GUILLOTINE,
    &RAZOR_WIND,
    &SWORDS_DANCE,
    &CUT,
    &GUST,
    &WING_ATTACK,
    &WHIRLWIND,
    &FLY,
    &BIND,
    &SLAM,
    &VINE_WHIP,
    &STOMP,
    &DOUBLE_KICK,
    &MEGA_KICK,
    &JUMP_KICK,
    &ROLLING_KICK,
    &SAND_ATTACK,
    &HEADBUTT,
    &HORN_ATTACK,
    &FURY_ATTACK,
    &HORN_DRILL,
    &TACKLE,
    &BODY_SLAM,
    &WRAP,
    &TAKE_DOWN,
    &THRASH,
    &DOUBLE_EDGE,
    &TAIL_WHIP,
    &POISON_STING,
    &TWINEEDLE,
    &PIN_MISSILE,
    &LEER,
    &BITE,
    &GROWL,
    &ROAR,
    &SING,
    &SUPERSONIC,
    &SONIC_BOOM,
    &DISABLE,
    &ACID,
    &EMBER,
    &FLAMETHROWER,
    &MIST,
    &WATER_GUN,
    &HYDRO_PUMP,
    &SURF,
    &ICE_BEAM,
    &BLIZZARD,
    &PSYBEAM,
    &BUBBLE_BEAM,
    &AURORA_BEAM,
    &HYPER_BEAM,
    &PECK,
    &DRILL_PECK,
    &SUBMISSION,
    &LOW_KICK,
    &COUNTER,
    &SEISMIC_TOSS,
    &STRENGTH,
    &ABSORB,
    &MEGA_DRAIN,
    &LEECH_SEED,
    &GROWTH,
    &RAZOR_LEAF,
    &SOLAR_BEAM,
    &POISON_POWDER,
    &STUN_SPORE,
    &SLEEP_POWDER,
    &PETAL_DANCE,
    &STRING_SHOT,
    &DRAGON_RAGE,
    &FIRE_SPIN,
    &THUNDER_SHOCK,
    &THUNDERBOLT,
    &THUNDER_WAVE,
    &THUNDER,
    &ROCK_THROW,
    &EARTHQUAKE,
    &FISSURE,
    &DIG,
    &TOXIC,
    &CONFUSION,
    &PSYCHIC,
    &HYPNOSIS,
    &MEDITATE,
    &AGILITY,
    &QUICK_ATTACK,
    &RAGE,
    &TELEPORT,
    &NIGHT_SHADE,
    &MIMIC,
    &SCREECH,
    &DOUBLE_TEAM,
    &RECOVER,
    &HARDEN,
    &MINIMIZE,
    &SMOKESCREEN,
    &CONFUSE_RAY,
    &WITHDRAW,
    &DEFENSE_CURL,
    &BARRIER,
    &LIGHT_SCREEN,
    &HAZE,
    &REFLECT,
    &FOCUS_ENERGY,
    &BIDE,
    &METRONOME,
    &MIRROR_MOVE,
    &SELF_DESTRUCT,
    &EGG_BOMB,
    &LICK,
    &SMOG,
    &SLUDGE,
    &BONE_CLUB,
    &FIRE_BLAST,
    &WATERFALL,
    &CLAMP,
    &SWIFT,
    &SKULL_BASH,
    &SPIKE_CANNON,
    &CONSTRICT,
    &AMNESIA,
    &KINESIS,
    &SOFT_BOILED,
    &HIGH_JUMP_KICK,
    &GLARE,
    &DREAM_EATER,
    &POISON_GAS,
    &BARRAGE,
    &LEECH_LIFE,
    &LOVELY_KISS,
    &SKY_ATTACK,
    &TRANSFORM,
    &BUBBLE,
    &DIZZY_PUNCH,
    &SPORE,
    &FLASH,
    &PSYWAVE,
    &SPLASH,
    &ACID_ARMOR,
    &CRABHAMMER,
    &EXPLOSION,
    &FURY_SWIPES,
    &BONEMERANG,
    &REST,
    &ROCK_SLIDE,
    &HYPER_FANG,
    &SHARPEN,
    &CONVERSION,
    &TRI_ATTACK,
    &SUPER_FANG,
    &SLASH,
    &SUBSTITUTE,
    &STRUGGLE,
    &SKETCH,
    &TRIPLE_KICK,
    &THIEF,
    &SPIDER_WEB,
    &MIND_READER,
    &NIGHTMARE,
    &FLAME_WHEEL,
    &SNORE,
    &CURSE,
    &FLAIL,
    &CONVERSION_2,
    &AEROBLAST,
    &COTTON_SPORE,
    &REVERSAL,
    &SPITE,
    &POWDER_SNOW,
    &PROTECT,
    &MACH_PUNCH,
    &SCARY_FACE,
    &FEINT_ATTACK,
    &SWEET_KISS,
    &BELLY_DRUM,
    &SLUDGE_BOMB,
    &MUD_SLAP,
    &OCTAZOOKA,
    &SPIKES,
    &ZAP_CANNON,
    &FORESIGHT,
    &DESTINY_BOND,
    &PERISH_SONG,
    &ICY_WIND,
    &DETECT,
    &BONE_RUSH,
    &LOCK_ON,
    &OUTRAGE,
    &SANDSTORM,
    &GIGA_DRAIN,
    &ENDURE,
    &CHARM,
    &ROLLOUT,
    &FALSE_SWIPE,
    &SWAGGER,
    &MILK_DRINK,
    &SPARK,
    &FURY_CUTTER,
    &STEEL_WING,
    &MEAN_LOOK,
    &ATTRACT,
    &SLEEP_TALK,
    &HEAL_BELL,
    &RETURN,
    &PRESENT,
    &FRUSTRATION,
    &SAFEGUARD,
    &PAIN_SPLIT,
    &SACRED_FIRE,
    &MAGNITUDE,
    &DYNAMIC_PUNCH,
    &MEGAHORN,
    &DRAGON_BREATH,
    &BATON_PASS,
    &ENCORE,
    &PURSUIT,
    &RAPID_SPIN,
    &SWEET_SCENT,
    &IRON_TAIL,
    &METAL_CLAW,
    &VITAL_THROW,
    &MORNING_SUN,
    &SYNTHESIS,
    &MOONLIGHT,
    &HIDDEN_POWER,
    &CROSS_CHOP,
    &TWISTER,
    &RAIN_DANCE,
    &SUNNY_DAY,
    &CRUNCH,
    &MIRROR_COAT,
    &PSYCH_UP,
    &EXTREME_SPEED,
    &ANCIENT_POWER,
    &SHADOW_BALL,
    &FUTURE_SIGHT,
    &ROCK_SMASH,
    &WHIRLPOOL,
    &BEAT_UP,
    &FAKE_OUT,
    &UPROAR,
    &STOCKPILE,
    &SPIT_UP,
    &SWALLOW,
    &HEAT_WAVE,
    &HAIL,
    &TORMENT,
    &FLATTER,
    &WILL_O_WISP,
    &MEMENTO,
    &FACADE,
    &FOCUS_PUNCH,
    &SMELLING_SALTS,
    &FOLLOW_ME,
    &NATURE_POWER,
    &CHARGE,
    &TAUNT,
    &HELPING_HAND,
    &TRICK,
    &ROLE_PLAY,
    &WISH,
    &ASSIST,
    &INGRAIN,
    &SUPERPOWER,
    &MAGIC_COAT,
    &RECYCLE,
    &REVENGE,
    &BRICK_BREAK,
    &YAWN,
    &KNOCK_OFF,
    &ENDEAVOR,
    &ERUPTION,
    &SKILL_SWAP,
    &IMPRISON,
    &REFRESH,
    &GRUDGE,
    &SNATCH,
    &SECRET_POWER,
    &DIVE,
    &ARM_THRUST,
    &CAMOUFLAGE,
    &TAIL_GLOW,
    &LUSTER_PURGE,
    &MIST_BALL,
    &FEATHER_DANCE,
    &TEETER_DANCE,
    &BLAZE_KICK,
    &MUD_SPORT,
    &ICE_BALL,
    &NEEDLE_ARM,
    &SLACK_OFF,
    &HYPER_VOICE,
    &POISON_FANG,
    &CRUSH_CLAW,
    &BLAST_BURN,
    &HYDRO_CANNON,
    &METEOR_MASH,
    &ASTONISH,
    &WEATHER_BALL,
    &AROMATHERAPY,
    &FAKE_TEARS,
    &AIR_CUTTER,
    &OVERHEAT,
    &ODOR_SLEUTH,
    &ROCK_TOMB,
    &SILVER_WIND,
    &METAL_SOUND,
    &GRASS_WHISTLE,
    &TICKLE,
    &COSMIC_POWER,
    &WATER_SPOUT,
    &SIGNAL_BEAM,
    &SHADOW_PUNCH,
    &EXTRASENSORY,
    &SKY_UPPERCUT,
    &SAND_TOMB,
    &SHEER_COLD,
    &MUDDY_WATER,
    &BULLET_SEED,
    &AERIAL_ACE,
    &ICICLE_SPEAR,
    &IRON_DEFENSE,
    &BLOCK,
    &HOWL,
    &DRAGON_CLAW,
    &FRENZY_PLANT,
    &BULK_UP,
    &BOUNCE,
    &MUD_SHOT,
    &POISON_TAIL,
    &COVET,
    &VOLT_TACKLE,
    &MAGICAL_LEAF,
    &WATER_SPORT,
    &CALM_MIND,
    &LEAF_BLADE,
    &DRAGON_DANCE,
    &ROCK_BLAST,
    &SHOCK_WAVE,
    &WATER_PULSE,
    &DOOM_DESIRE,
    &PSYCHO_BOOST,
    &ROOST,
    &GRAVITY,
    &MIRACLE_EYE,
    &WAKE_UP_SLAP,
    &HAMMER_ARM,
    &GYRO_BALL,
    &HEALING_WISH,
    &BRINE,
    &NATURAL_GIFT,
    &FEINT,
    &PLUCK,
    &TAILWIND,
    &ACUPRESSURE,
    &METAL_BURST,
    &U_TURN,
    &CLOSE_COMBAT,
    &PAYBACK,
    &ASSURANCE,
    &EMBARGO,
    &FLING,
    &PSYCHO_SHIFT,
    &TRUMP_CARD,
    &HEAL_BLOCK,
    &WRING_OUT,
    &POWER_TRICK,
    &GASTRO_ACID,
    &LUCKY_CHANT,
    &ME_FIRST,
    &COPYCAT,
    &POWER_SWAP,
    &GUARD_SWAP,
    &PUNISHMENT,
    &LAST_RESORT,
    &WORRY_SEED,
    &SUCKER_PUNCH,
    &TOXIC_SPIKES,
    &HEART_SWAP,
    &AQUA_RING,
    &MAGNET_RISE,
    &FLARE_BLITZ,
    &FORCE_PALM,
    &AURA_SPHERE,
    &ROCK_POLISH,
    &POISON_JAB,
    &DARK_PULSE,
    &NIGHT_SLASH,
    &AQUA_TAIL,
    &SEED_BOMB,
    &AIR_SLASH,
    &X_SCISSOR,
    &BUG_BUZZ,
    &DRAGON_PULSE,
    &DRAGON_RUSH,
    &POWER_GEM,
    &DRAIN_PUNCH,
    &VACUUM_WAVE,
    &FOCUS_BLAST,
    &ENERGY_BALL,
    &BRAVE_BIRD,
    &EARTH_POWER,
    &SWITCHEROO,
    &GIGA_IMPACT,
    &NASTY_PLOT,
    &BULLET_PUNCH,
    &AVALANCHE,
    &ICE_SHARD,
    &SHADOW_CLAW,
    &THUNDER_FANG,
    &ICE_FANG,
    &FIRE_FANG,
    &SHADOW_SNEAK,
    &MUD_BOMB,
    &PSYCHO_CUT,
    &ZEN_HEADBUTT,
    &MIRROR_SHOT,
    &FLASH_CANNON,
    &ROCK_CLIMB,
    &DEFOG,
    &TRICK_ROOM,
    &DRACO_METEOR,
    &DISCHARGE,
    &LAVA_PLUME,
    &LEAF_STORM,
    &POWER_WHIP,
    &ROCK_WRECKER,
    &CROSS_POISON,
    &GUNK_SHOT,
    &IRON_HEAD,
    &MAGNET_BOMB,
    &STONE_EDGE,
    &CAPTIVATE,
    &STEALTH_ROCK,
    &GRASS_KNOT,
    &CHATTER,
    &JUDGMENT,
    &BUG_BITE,
    &CHARGE_BEAM,
    &WOOD_HAMMER,
    &AQUA_JET,
    &ATTACK_ORDER,
    &DEFEND_ORDER,
    &HEAL_ORDER,
    &HEAD_SMASH,
    &DOUBLE_HIT,
    &ROAR_OF_TIME,
    &SPACIAL_REND,
    &LUNAR_DANCE,
    &CRUSH_GRIP,
    &MAGMA_STORM,
    &DARK_VOID,
    &SEED_FLARE,
    &OMINOUS_WIND,
    &SHADOW_FORCE,
    &HONE_CLAWS,
    &WIDE_GUARD,
    &GUARD_SPLIT,
    &POWER_SPLIT,
    &WONDER_ROOM,
    &PSYSHOCK,
    &VENOSHOCK,
    &AUTOTOMIZE,
    &RAGE_POWDER,
    &TELEKINESIS,
    &MAGIC_ROOM,
    &SMACK_DOWN,
    &STORM_THROW,
    &FLAME_BURST,
    &SLUDGE_WAVE,
    &QUIVER_DANCE,
    &HEAVY_SLAM,
    &SYNCHRONOISE,
    &ELECTRO_BALL,
    &SOAK,
    &FLAME_CHARGE,
    &COIL,
    &LOW_SWEEP,
    &ACID_SPRAY,
    &FOUL_PLAY,
    &SIMPLE_BEAM,
    &ENTRAINMENT,
    &AFTER_YOU,
    &ROUND,
    &ECHOED_VOICE,
    &CHIP_AWAY,
    &CLEAR_SMOG,
    &STORED_POWER,
    &QUICK_GUARD,
    &ALLY_SWITCH,
    &SCALD,
    &SHELL_SMASH,
    &HEAL_PULSE,
    &HEX,
    &SKY_DROP,
    &SHIFT_GEAR,
    &CIRCLE_THROW,
    &INCINERATE,
    &QUASH,
    &ACROBATICS,
    &REFLECT_TYPE,
    &RETALIATE,
    &FINAL_GAMBIT,
    &BESTOW,
    &INFERNO,
    &WATER_PLEDGE,
    &FIRE_PLEDGE,
    &GRASS_PLEDGE,
    &VOLT_SWITCH,
    &STRUGGLE_BUG,
    &BULLDOZE,
    &FROST_BREATH,
    &DRAGON_TAIL,
    &WORK_UP,
    &ELECTROWEB,
    &WILD_CHARGE,
    &DRILL_RUN,
    &DUAL_CHOP,
    &HEART_STAMP,
    &HORN_LEECH,
    &SACRED_SWORD,
    &RAZOR_SHELL,
    &HEAT_CRASH,
    &LEAF_TORNADO,
    &STEAMROLLER,
    &COTTON_GUARD,
    &NIGHT_DAZE,
    &PSYSTRIKE,
    &TAIL_SLAP,
    &HURRICANE,
    &HEAD_CHARGE,
    &GEAR_GRIND,
    &SEARING_SHOT,
    &TECHNO_BLAST,
    &RELIC_SONG,
    &SECRET_SWORD,
    &GLACIATE,
    &BOLT_STRIKE,
    &BLUE_FLARE,
    &FIERY_DANCE,
    &FREEZE_SHOCK,
    &ICE_BURN,
    &SNARL,
    &ICICLE_CRASH,
    &V_CREATE,
    &FUSION_FLARE,
    &FUSION_BOLT,
    &FLYING_PRESS,
    &MAT_BLOCK,
    &BELCH,
    &ROTOTILLER,
    &STICKY_WEB,
    &FELL_STINGER,
    &PHANTOM_FORCE,
    &TRICK_OR_TREAT,
    &NOBLE_ROAR,
    &ION_DELUGE,
    &PARABOLIC_CHARGE,
    &FOREST_S_CURSE,
    &PETAL_BLIZZARD,
    &FREEZE_DRY,
    &DISARMING_VOICE,
    &PARTING_SHOT,
    &TOPSY_TURVY,
    &DRAINING_KISS,
    &CRAFTY_SHIELD,
    &FLOWER_SHIELD,
    &GRASSY_TERRAIN,
    &MISTY_TERRAIN,
    &ELECTRIFY,
    &PLAY_ROUGH,
    &FAIRY_WIND,
    &MOONBLAST,
    &BOOMBURST,
    &FAIRY_LOCK,
    &KING_S_SHIELD,
    &PLAY_NICE,
    &CONFIDE,
    &DIAMOND_STORM,
    &STEAM_ERUPTION,
    &HYPERSPACE_HOLE,
    &WATER_SHURIKEN,
    &MYSTICAL_FIRE,
    &SPIKY_SHIELD,
    &AROMATIC_MIST,
    &EERIE_IMPULSE,
    &VENOM_DRENCH,
    &POWDER,
    &GEOMANCY,
    &MAGNETIC_FLUX,
    &HAPPY_HOUR,
    &ELECTRIC_TERRAIN,
    &DAZZLING_GLEAM,
    &CELEBRATE,
    &HOLD_HANDS,
    &BABY_DOLL_EYES,
    &NUZZLE,
    &HOLD_BACK,
    &INFESTATION,
    &POWER_UP_PUNCH,
    &OBLIVION_WING,
    &THOUSAND_ARROWS,
    &THOUSAND_WAVES,
    &LAND_S_WRATH,
    &LIGHT_OF_RUIN,
    &ORIGIN_PULSE,
    &PRECIPICE_BLADES,
    &DRAGON_ASCENT,
    &HYPERSPACE_FURY,
    &BREAKNECK_BLITZ_PHYSICAL,
    &BREAKNECK_BLITZ_SPECIAL,
    &ALL_OUT_PUMMELING_PHYSICAL,
    &ALL_OUT_PUMMELING_SPECIAL,
    &SUPERSONIC_SKYSTRIKE_PHYSICAL,
    &SUPERSONIC_SKYSTRIKE_SPECIAL,
    &ACID_DOWNPOUR_PHYSICAL,
    &ACID_DOWNPOUR_SPECIAL,
    &TECTONIC_RAGE_PHYSICAL,
    &TECTONIC_RAGE_SPECIAL,
    &CONTINENTAL_CRUSH_PHYSICAL,
    &CONTINENTAL_CRUSH_SPECIAL,
    &SAVAGE_SPIN_OUT_PHYSICAL,
    &SAVAGE_SPIN_OUT_SPECIAL,
    &NEVER_ENDING_NIGHTMARE_PHYSICAL,
    &NEVER_ENDING_NIGHTMARE_SPECIAL,
    &CORKSCREW_CRASH_PHYSICAL,
    &CORKSCREW_CRASH_SPECIAL,
    &INFERNO_OVERDRIVE_PHYSICAL,
    &INFERNO_OVERDRIVE_SPECIAL,
    &HYDRO_VORTEX_PHYSICAL,
    &HYDRO_VORTEX_SPECIAL,
    &BLOOM_DOOM_PHYSICAL,
    &BLOOM_DOOM_SPECIAL,
    &GIGAVOLT_HAVOC_PHYSICAL,
    &GIGAVOLT_HAVOC_SPECIAL,
    &SHATTERED_PSYCHE_PHYSICAL,
    &SHATTERED_PSYCHE_SPECIAL,
    &SUBZERO_SLAMMER_PHYSICAL,
    &SUBZERO_SLAMMER_SPECIAL,
    &DEVASTATING_DRAKE_PHYSICAL,
    &DEVASTATING_DRAKE_SPECIAL,
    &BLACK_HOLE_ECLIPSE_PHYSICAL,
    &BLACK_HOLE_ECLIPSE_SPECIAL,
    &TWINKLE_TACKLE_PHYSICAL,
    &TWINKLE_TACKLE_SPECIAL,
    &CATASTROPIKA,
    &SHORE_UP,
    &FIRST_IMPRESSION,
    &BANEFUL_BUNKER,
    &SPIRIT_SHACKLE,
    &DARKEST_LARIAT,
    &SPARKLING_ARIA,
    &ICE_HAMMER,
    &FLORAL_HEALING,
    &HIGH_HORSEPOWER,
    &STRENGTH_SAP,
    &SOLAR_BLADE,
    &LEAFAGE,
    &SPOTLIGHT,
    &TOXIC_THREAD,
    &LASER_FOCUS,
    &GEAR_UP,
    &THROAT_CHOP,
    &POLLEN_PUFF,
    &ANCHOR_SHOT,
    &PSYCHIC_TERRAIN,
    &LUNGE,
    &FIRE_LASH,
    &POWER_TRIP,
    &BURN_UP,
    &SPEED_SWAP,
    &SMART_STRIKE,
    &PURIFY,
    &REVELATION_DANCE,
    &CORE_ENFORCER,
    &TROP_KICK,
    &INSTRUCT,
    &BEAK_BLAST,
    &CLANGING_SCALES,
    &DRAGON_HAMMER,
    &BRUTAL_SWING,
    &AURORA_VEIL,
    &SINISTER_ARROW_RAID,
    &MALICIOUS_MOONSAULT,
    &OCEANIC_OPERETTA,
    &GUARDIAN_OF_ALOLA,
    &SOUL_STEALING_7_STAR_STRIKE,
    &STOKED_SPARKSURFER,
    &PULVERIZING_PANCAKE,
    &EXTREME_EVOBOOST,
    &GENESIS_SUPERNOVA,
    &SHELL_TRAP,
    &FLEUR_CANNON,
    &PSYCHIC_FANGS,
    &STOMPING_TANTRUM,
    &SHADOW_BONE,
    &ACCELEROCK,
    &LIQUIDATION,
    &PRISMATIC_LASER,
    &SPECTRAL_THIEF,
    &SUNSTEEL_STRIKE,
    &MOONGEIST_BEAM,
    &TEARFUL_LOOK,
    &ZING_ZAP,
    &NATURE_S_MADNESS,
    &MULTI_ATTACK,
    &TEN_MILLION_VOLT_THUNDERBOLT,
    &MIND_BLOWN,
    &PLASMA_FISTS,
    &PHOTON_GEYSER,
    &LIGHT_THAT_BURNS_THE_SKY,
    &SEARING_SUNRAZE_SMASH,
    &MENACING_MOONRAZE_MAELSTROM,
    &LET_S_SNUGGLE_FOREVER,
    &SPLINTERED_STORMSHARDS,
    &CLANGOROUS_SOULBLAZE,
    &ZIPPY_ZAP,
    &SPLISHY_SPLASH,
    &FLOATY_FALL,
    &PIKA_PAPOW,
    &BOUNCY_BUBBLE,
    &BUZZY_BUZZ,
    &SIZZLY_SLIDE,
    &GLITZY_GLOW,
    &BADDY_BAD,
    &SAPPY_SEED,
    &FREEZY_FROST,
    &SPARKLY_SWIRL,
    &VEEVEE_VOLLEY,
    &DOUBLE_IRON_BASH,
    &MAX_GUARD,
    &DYNAMAX_CANNON,
    &SNIPE_SHOT,
    &JAW_LOCK,
    &STUFF_CHEEKS,
    &NO_RETREAT,
    &TAR_SHOT,
    &MAGIC_POWDER,
    &DRAGON_DARTS,
    &TEATIME,
    &OCTOLOCK,
    &BOLT_BEAK,
    &FISHIOUS_REND,
    &COURT_CHANGE,
    &MAX_FLARE,
    &MAX_FLUTTERBY,
    &MAX_LIGHTNING,
    &MAX_STRIKE,
    &MAX_KNUCKLE,
    &MAX_PHANTASM,
    &MAX_HAILSTORM,
    &MAX_OOZE,
    &MAX_GEYSER,
    &MAX_AIRSTREAM,
    &MAX_STARFALL,
    &MAX_WYRMWIND,
    &MAX_MINDSTORM,
    &MAX_ROCKFALL,
    &MAX_QUAKE,
    &MAX_DARKNESS,
    &MAX_OVERGROWTH,
    &MAX_STEELSPIKE,
    &CLANGOROUS_SOUL,
    &BODY_PRESS,
    &DECORATE,
    &DRUM_BEATING,
    &SNAP_TRAP,
    &PYRO_BALL,
    &BEHEMOTH_BLADE,
    &BEHEMOTH_BASH,
    &AURA_WHEEL,
    &BREAKING_SWIPE,
    &BRANCH_POKE,
    &OVERDRIVE,
    &APPLE_ACID,
    &GRAV_APPLE,
    &SPIRIT_BREAK,
    &STRANGE_STEAM,
    &LIFE_DEW,
    &OBSTRUCT,
    &FALSE_SURRENDER,
    &METEOR_ASSAULT,
    &ETERNABEAM,
    &STEEL_BEAM,
    &EXPANDING_FORCE,
    &STEEL_ROLLER,
    &SCALE_SHOT,
    &METEOR_BEAM,
    &SHELL_SIDE_ARM,
    &MISTY_EXPLOSION,
    &GRASSY_GLIDE,
    &RISING_VOLTAGE,
    &TERRAIN_PULSE,
    &SKITTER_SMACK,
    &BURNING_JEALOUSY,
    &LASH_OUT,
    &POLTERGEIST,
    &CORROSIVE_GAS,
    &COACHING,
    &FLIP_TURN,
    &TRIPLE_AXEL,
    &DUAL_WINGBEAT,
    &SCORCHING_SANDS,
    &JUNGLE_HEALING,
    &WICKED_BLOW,
    &SURGING_STRIKES,
    &THUNDER_CAGE,
    &DRAGON_ENERGY,
    &FREEZING_GLARE,
    &FIERY_WRATH,
    &THUNDEROUS_KICK,
    &GLACIAL_LANCE,
    &ASTRAL_BARRAGE,
    &EERIE_SPELL,
    &DIRE_CLAW,
    &PSYSHIELD_BASH,
    &POWER_SHIFT,
    &STONE_AXE,
    &SPRINGTIDE_STORM,
    &MYSTICAL_POWER,
    &RAGING_FURY,
    &WAVE_CRASH,
    &CHLOROBLAST,
    &MOUNTAIN_GALE,
    &VICTORY_DANCE,
    &HEADLONG_RUSH,
    &BARB_BARRAGE,
    &ESPER_WING,
    &BITTER_MALICE,
    &SHELTER,
    &TRIPLE_ARROWS,
    &INFERNAL_PARADE,
    &CEASELESS_EDGE,
    &BLEAKWIND_STORM,
    &WILDBOLT_STORM,
    &SANDSEAR_STORM,
    &LUNAR_BLESSING,
    &TAKE_HEART,
    &TERA_BLAST,
    &SILK_TRAP,
    &AXE_KICK,
    &LAST_RESPECTS,
    &LUMINA_CRASH,
    &ORDER_UP,
    &JET_PUNCH,
    &SPICY_EXTRACT,
    &SPIN_OUT,
    &POPULATION_BOMB,
    &ICE_SPINNER,
    &GLAIVE_RUSH,
    &REVIVAL_BLESSING,
    &SALT_CURE,
    &TRIPLE_DIVE,
    &MORTAL_SPIN,
    &DOODLE,
    &FILLET_AWAY,
    &KOWTOW_CLEAVE,
    &FLOWER_TRICK,
    &TORCH_SONG,
    &AQUA_STEP,
    &RAGING_BULL,
    &MAKE_IT_RAIN,
    &PSYBLADE,
    &HYDRO_STEAM,
    &RUINATION,
    &COLLISION_COURSE,
    &ELECTRO_DRIFT,
    &SHED_TAIL,
    &CHILLY_RECEPTION,
    &TIDY_UP,
    &SNOWSCAPE,
    &POUNCE,
    &TRAILBLAZE,
    &CHILLING_WATER,
    &HYPER_DRILL,
    &TWIN_BEAM,
    &RAGE_FIST,
    &ARMOR_CANNON,
    &BITTER_BLADE,
    &DOUBLE_SHOCK,
    &GIGATON_HAMMER,
    &COMEUPPANCE,
    &AQUA_CUTTER,
    &BLAZING_TORQUE,
    &WICKED_TORQUE,
    &NOXIOUS_TORQUE,
    &COMBAT_TORQUE,
    &MAGICAL_TORQUE,
    &BLOOD_MOON,
    &MATCHA_GOTCHA,
    &SYRUP_BOMB,
    &IVY_CUDGEL,
    &ELECTRO_SHOT,
    &TERA_STARSTORM,
    &FICKLE_BEAM,
    &BURNING_BULWARK,
    &THUNDERCLAP,
    &MIGHTY_CLEAVE,
    &TACHYON_CUTTER,
    &HARD_PRESS,
    &DRAGON_CHEER,
    &ALLURING_VOICE,
    &TEMPER_FLARE,
    &SUPERCELL_SLAM,
    &PSYCHIC_NOISE,
    &UPPER_HAND,
    &MALIGNANT_CHAIN,
    &NIHIL_LIGHT,
];
