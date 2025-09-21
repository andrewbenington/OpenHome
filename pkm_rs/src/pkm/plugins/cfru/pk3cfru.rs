use super::conversion::util::{from_gen3_cfru_pokemon_index, to_gen3_cfru_pokemon_index};
use super::conversion::{NATIONAL_DEX_TO_RADICAL_RED_MAP, RADICAL_RED_TO_NATIONAL_DEX_MAP};
use crate::pkm::traits::IsShiny;
use crate::pkm::{Error, Pkm, Result};
use crate::resources::{
    Ball, FormeMetadata, GameOfOriginIndex, MoveSlot, SpeciesAndForme, SpeciesMetadata,
};
use crate::strings::Gen3String;
use crate::substructures::{Gender, MarkingsFourShapes, Stats8};
use crate::util;

use serde::Serialize;

pub const CFRU_BALLS: [Ball; 27] = [
    Ball::Master,
    Ball::Ultra,
    Ball::Great,
    Ball::Poke,
    Ball::Safari,
    Ball::Net,
    Ball::Dive,
    Ball::Nest,
    Ball::Repeat,
    Ball::Timer,
    Ball::Luxury,
    Ball::Premier,
    Ball::Dusk,
    Ball::Heal,
    Ball::Quick,
    Ball::Cherish,
    Ball::None, // INVALID in TS, mapped to None here
    Ball::Fast,
    Ball::Level,
    Ball::Lure,
    Ball::Heavy,
    Ball::Love,
    Ball::Friend,
    Ball::Moon,
    Ball::PokeLegendsArceus, // PokeHisui in TS
    Ball::Beast,
    Ball::Dream,
];

#[inline]
fn cfru_ball_from_index(idx: u8) -> Ball {
    CFRU_BALLS.get(idx as usize).copied().unwrap_or(Ball::Poke)
}

#[inline]
fn cfru_ball_index(ball: Ball) -> u8 {
    if let Some(i) = CFRU_BALLS.iter().position(|&b| b == ball) {
        i as u8
    } else if (Ball::PokeLegendsArceus as u8) <= (ball as u8)
        && (ball as u8) <= (Ball::Origin as u8)
    {
        // Collapse all Hisui/LA balls to PokeLegendsArceus for CFRU writes (TS fallback).
        CFRU_BALLS
            .iter()
            .position(|&b| b == Ball::PokeLegendsArceus)
            .unwrap() as u8
    } else {
        // Fallback to Poke on unknown.
        CFRU_BALLS.iter().position(|&b| b == Ball::Poke).unwrap() as u8
    }
}

/// PK3CFRU (58 bytes)
#[derive(Debug, Default, Serialize, Clone)]
pub struct Pk3cfru {
    // Personality 0:4
    pub personality_value: u32,

    // OTID 4:8
    pub trainer_id: u16, // 0..6
    pub secret_id: u16,  // 6..8

    // Nickname 8:18
    pub nickname: Gen3String<10>,

    // Language 18
    pub language_index: u8,

    // Sanity 19
    // pub sanity: u8,

    // OT Name 20:27
    pub trainer_name: Gen3String<7>,

    // Markings 27
    pub markings: MarkingsFourShapes,

    // Species 28:30
    pub species_and_forme: SpeciesAndForme,
    cfru_species_index: u16, // raw CFRU game index

    // Held Item 30:32
    pub held_item_index: u16,

    // Exp 32:36
    pub exp: u32,

    // Move PP Up 36 (2 bits each)
    pub move_pp_ups: [u8; 4],

    // Friendship 37
    pub trainer_friendship: u8,

    // Pokeball 38
    pub ball: Ball,

    // Moves 38:43 (5 bytes total for 4 moves with 10 bits each)
    pub moves: [MoveSlot; 4],
    pub move_pp: [u8; 4], // computed; not stored in CFRU bytes

    // EVs 43:49
    pub evs: Stats8,

    // 49
    pub pokerus_byte: u8,

    // 50
    pub met_location_index: u8,

    // 51:53
    pub met_level: u8,                     // 0x34 bits 0..6
    pub game_of_origin: GameOfOriginIndex, // 0x34 bits 7..10
    pub can_gigantamax: bool,              // 0x34 bit 11
    pub trainer_gender: Gender,            // 0x34 bit 15

    // 53:57
    pub ivs: Stats8,              // 0x36..0x39 (30 bits)
    pub is_egg: bool,             // 0x36 bit 30
    pub has_hidden_ability: bool, // 0x36 bit 31

    // Values not stored in CFRU bytes
    pub is_nicknamed: bool,
    pub current_hp: u16,
}

impl Pk3cfru {
    pub const BOX_SIZE: usize = 58;
    pub const PARTY_SIZE: usize = 100;

    /// Unpack 4×10-bit move IDs from 5 bytes at 0x27..0x2B (little-endian bits).
    #[inline]
    fn read_moves_10bit(bytes: &[u8]) -> [MoveSlot; 4] {
        let base = 0x27;
        let v = (bytes[base] as u64)
            | ((bytes[base + 1] as u64) << 8)
            | ((bytes[base + 2] as u64) << 16)
            | ((bytes[base + 3] as u64) << 24)
            | ((bytes[base + 4] as u64) << 32);

        [
            MoveSlot::from((v & 0x3FF) as u16),
            MoveSlot::from(((v >> 10) & 0x3FF) as u16),
            MoveSlot::from(((v >> 20) & 0x3FF) as u16),
            MoveSlot::from(((v >> 30) & 0x3FF) as u16),
        ]
    }

    /// Pack 4×10-bit move IDs into 5 bytes at 0x27..0x2B (little-endian bits).
    #[inline]
    fn write_moves_10bit(moves: &[MoveSlot; 4], bytes: &mut [u8]) {
        let base = 0x27;
        let m0 = u16::from(moves[0]) as u64 & 0x3FF;
        let m1 = u16::from(moves[1]) as u64 & 0x3FF;
        let m2 = u16::from(moves[2]) as u64 & 0x3FF;
        let m3 = u16::from(moves[3]) as u64 & 0x3FF;

        let v = (m0) | (m1 << 10) | (m2 << 20) | (m3 << 30);

        bytes[base] = (v & 0xFF) as u8;
        bytes[base + 1] = ((v >> 8) & 0xFF) as u8;
        bytes[base + 2] = ((v >> 16) & 0xFF) as u8;
        bytes[base + 3] = ((v >> 24) & 0xFF) as u8;
        bytes[base + 4] = ((v >> 32) & 0xFF) as u8;
    }

    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        if size < Self::BOX_SIZE {
            return Err(Error::ByteLength {
                expected: Self::BOX_SIZE,
                received: size,
            });
        }

        // 0x1C..0x1E: CFRU game species index
        let cfru_species_index = u16::from_le_bytes(bytes[0x1C..0x1E].try_into().unwrap());
        let saf =
            from_gen3_cfru_pokemon_index(cfru_species_index, &RADICAL_RED_TO_NATIONAL_DEX_MAP)?;

        // 0x34..0x36: met info & flags
        let meta = u16::from_le_bytes(bytes[0x34..0x36].try_into().unwrap());
        let met_level = (meta & 0x7F) as u8;
        let game_of_origin = GameOfOriginIndex::from(((meta >> 7) & 0xF) as u8);
        let can_gigantamax = ((meta >> 11) & 1) != 0;
        let trainer_gender: Gender = (((meta >> 15) & 1) != 0).into();

        // IVs + flags (30 bits IVs starting at 0x36, then bits 30,31 flags)
        let ivs = Stats8::from_30_bits(bytes[0x36..0x3A].try_into().unwrap());
        let is_egg = util::get_flag(bytes, 0x36, 30);
        let has_hidden_ability = util::get_flag(bytes, 0x36, 31);

        // PP Ups (0x24): 2 bits per move
        let ppb = bytes[0x24];
        let move_pp_ups = [
            ppb & 0x3,
            (ppb >> 2) & 0x3,
            (ppb >> 4) & 0x3,
            (ppb >> 6) & 0x3,
        ];

        let mon = Pk3cfru {
            personality_value: u32::from_le_bytes(bytes[0..4].try_into().unwrap()),
            trainer_id: u16::from_le_bytes(bytes[4..6].try_into().unwrap()),
            secret_id: u16::from_le_bytes(bytes[6..8].try_into().unwrap()),
            nickname: Gen3String::from_bytes(bytes[8..18].try_into().unwrap()),
            language_index: bytes[18],
            trainer_name: Gen3String::from_bytes(bytes[19..26].try_into().unwrap()),
            markings: MarkingsFourShapes::from_byte(bytes[26]),
            species_and_forme: saf,
            cfru_species_index,
            held_item_index: u16::from_le_bytes(bytes[30..32].try_into().unwrap()),
            exp: u32::from_le_bytes(bytes[32..36].try_into().unwrap()),
            move_pp_ups,
            trainer_friendship: bytes[37],
            ball: cfru_ball_from_index(bytes[38]),
            moves: Self::read_moves_10bit(bytes),
            move_pp: [0, 0, 0, 0], // Not stored in CFRU; compute in UI layer if needed
            evs: Stats8::from_bytes(bytes[44..50].try_into().unwrap()),
            pokerus_byte: bytes[50],
            met_location_index: bytes[51],
            met_level,
            game_of_origin,
            can_gigantamax,
            trainer_gender,
            ivs,
            is_egg,
            has_hidden_ability,
            is_nicknamed: true, // TS default
            current_hp: 0,
        };

        Ok(mon)
    }
}

impl IsShiny for Pk3cfru {
    fn is_shiny(&self) -> bool {
        let tid = self.trainer_id as u32;
        let sid = self.secret_id as u32;
        let pid = self.personality_value;

        let xor = tid ^ sid ^ (pid & 0xFFFF) ^ ((pid >> 16) & 0xFFFF);
        xor < 8
    }
}

impl Pkm for Pk3cfru {
    const BOX_SIZE: usize = Pk3cfru::BOX_SIZE;
    const PARTY_SIZE: usize = Pk3cfru::PARTY_SIZE;

    fn box_size() -> usize {
        Self::BOX_SIZE
    }

    fn party_size() -> usize {
        Self::PARTY_SIZE
    }

    fn from_bytes(bytes: &[u8]) -> Result<Box<Self>> {
        Self::from_bytes(bytes).map(Box::new)
    }

    fn write_box_bytes(&self, bytes: &mut [u8]) {
        // Zero buffer then fill
        for b in bytes.iter_mut().take(Self::BOX_SIZE) {
            *b = 0;
        }

        // 0:4 Personality
        bytes[0..4].copy_from_slice(&self.personality_value.to_le_bytes());

        // 4:8 OT ID (Trainer ID and Secret ID)
        bytes[4..6].copy_from_slice(&self.trainer_id.to_le_bytes());
        bytes[6..8].copy_from_slice(&self.secret_id.to_le_bytes());

        // 8:18 Nickname (10 bytes)
        bytes[8..18].copy_from_slice(self.nickname.bytes().as_ref());

        // 18 Language
        bytes[18] = self.language_index;

        // 19 Sanity
        // bytes[19] = ???; // not yet implemented

        // 20:27 OT Name (7 bytes)
        bytes[20..27].copy_from_slice(self.trainer_name.bytes().as_ref());

        // 27 Markings
        bytes[27] = self.markings.to_byte();

        // 28:30 Species (DexNum / CFRU game index)
        if let Ok(cfru_species) =
            to_gen3_cfru_pokemon_index(&self.species_and_forme, &NATIONAL_DEX_TO_RADICAL_RED_MAP)
        {
            bytes[28..30].copy_from_slice(&cfru_species.to_le_bytes());
        } else {
            // fallback or propagate error
            bytes[28..30].copy_from_slice(&0u16.to_le_bytes());
        }

        // 30:32 Held Item
        bytes[30..32].copy_from_slice(&self.held_item_index.to_le_bytes());

        // 32:36 Experience
        bytes[32..36].copy_from_slice(&self.exp.to_le_bytes());

        // 36 PP Bonuses (PP Ups, 2 bits each)
        bytes[36] = (self.move_pp_ups[0] & 0x3)
            | ((self.move_pp_ups[1] & 0x3) << 2)
            | ((self.move_pp_ups[2] & 0x3) << 4)
            | ((self.move_pp_ups[3] & 0x3) << 6);

        // 37 Friendship
        bytes[37] = self.trainer_friendship;

        // 38 Ball (Poké Ball index)
        bytes[38] = cfru_ball_index(self.ball);

        // 39–43 Moves (4 × 10-bit packed into 5 bytes)
        Self::write_moves_10bit(&self.moves, bytes);

        // 44:50 EVs (6 stats, 1 byte each)
        bytes[44..50].copy_from_slice(&self.evs.to_bytes());

        // 50 Pokerus
        bytes[50] = self.pokerus_byte;

        // 51 Met Location
        bytes[51] = self.met_location_index;

        // 52:53 Met Info (packed: level, game of origin, Gigantamax, trainer gender)
        let mut meta: u16 = 0;
        meta |= (self.met_level as u16 & 0x7F) << 0;
        meta |= (u8::from(self.game_of_origin) as u16 & 0x0F) << 7;
        meta |= ((self.can_gigantamax as u16) & 0x01) << 11;
        meta |= ((bool::from(self.trainer_gender) as u16) & 0x01) << 15;
        bytes[52..54].copy_from_slice(&meta.to_le_bytes());

        // 54:58 IVs + Flags (30-bit IVs + 2 flag bits)
        self.ivs.write_30_bits(bytes, 54);
        util::set_flag(bytes, 54, 30, self.is_egg);
        util::set_flag(bytes, 54, 31, self.has_hidden_ability);
    }

    fn write_party_bytes(&self, bytes: &mut [u8]) {
        // CFRU uses the same 58 bytes; no extra party-only block provided.
        self.write_box_bytes(bytes);
    }

    fn to_box_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![0; Self::BOX_SIZE];
        self.write_box_bytes(&mut bytes);
        bytes
    }

    fn to_party_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![0; Self::PARTY_SIZE];
        self.write_party_bytes(&mut bytes);
        bytes
    }

    fn get_species_metadata(&self) -> &'static SpeciesMetadata {
        self.species_and_forme.get_species_metadata()
    }

    fn get_forme_metadata(&self) -> &'static FormeMetadata {
        self.species_and_forme.get_forme_metadata()
    }

    fn calculate_level(&self) -> u8 {
        self.get_species_metadata()
            .level_up_type
            .calculate_level(self.exp)
    }
}
