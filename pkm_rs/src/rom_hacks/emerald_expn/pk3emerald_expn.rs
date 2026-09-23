use super::EmeraldExpnPokemonIndex;
use crate::checksum::{Checksum, RefreshChecksum};
use crate::result::{Error, Result};
use crate::strings::Gen3String;
use crate::traits::{IsShiny, PkmBytes};
use crate::util;

use pkm_rs_derive::IsShiny8192;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::MoveIndex;
use pkm_rs_resources::ribbons::Gen3RibbonSet;
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_types::{
    BinaryGender, ContestStats, Ivs, MarkingsFourShapes, OriginGame, Pokerus, SimpleAbilityNumber,
    Stats8,
};
use pkm_rs_types::Gender;
use pkm_rs_types::{read_u16_le, read_u32_le};
use serde::Serialize;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

mod emerald_expn;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = Pk3ExpnWasm))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny8192)]
pub struct Pk3EmeraldExpn {
    // BoxPokemon
    /*0x00*/ pub personality_value: u32,
    /*0x04*/ pub trainer_id: u16,
    /*0x06*/ pub secret_id: u16,
    /*0x08*/ pub nickname: Gen3String<10>,  // characters 11 and 12 are stored in PokemonSubstruct0
    /*0x12*/ pub language: u8,  // u3
             pub mint_nature: u8,  // u5
    /*0x13*/ pub is_bad_egg: bool,
             pub has_species_data: bool,
             pub is_egg: bool,
//           pub block_box_rs: bool,
//           pub days_since_form_change: u8,  // u3
//           pub unused_13: bool,
    /*0x14*/ pub trainer_name: Gen3String<7>,
    /*0x1B*/ pub markings: MarkingsFourShapes,
//           pub current_status: u8,  // u4
    /*0x1C*/ pub checksum: u16,
//  /*0x1E*/ pub hp_lost: u16,  // u14, zeroed out when put in box
//           pub shiny_toggle: bool,
//           pub unused_1E: bool,
    
    // PokemonSubstruct0
    pub pokemon_index: EmeraldExpnPokemonIndex, // u11
    pub tera_type: TeraType,  // u5
    pub held_item_index: u16,  // u10
    // pub unused_02: u16,  // u6
    pub experience: u32,  // u21
    pub nickname_char_11: Gen3String<1>,
    // pub unused_04: u32,  // u3
    pub move_pp_ups: u8,
    pub trainer_friendship: u8,
    pub ball: Ball,  // u6
    pub nickname_char_12: Gen3String<1>,
    // pub unused_0A: u16,  // u2

    // PokemonSubstruct1
    pub moves: [MoveIndex; 4],  // each move is a u11
    // evolution trackers, cleared on box entry; two u5s
    pub move_pp: [u8; 4],  // each pp is a u7
    pub hyper_training: HyperTraining,  // each stat is a u1/bool

    // PokemonSubstruct2
    pub evs: Stats8,
    pub contest: ContestStats,

    // PokemonSubstruct3
    pub pokerus: Pokerus,
    pub met_location_index: u8,
    pub met_level: u8,  // u7
    pub game_of_origin: OriginGame,  // u4
    pub dynamax_level: u8,  // u4
    pub trainer_gender: BinaryGender,  // u1/bool
    pub ivs: Ivs,
    //pub is_egg: bool,
    pub can_gigantamax: bool,
    pub ribbons: Gen3RibbonSet,
    pub is_shadow: bool,
    // pub unused_0B: bool,
    pub ability_num: SimpleAbilityNumber,
    pub is_fateful_encounter: bool,
}

impl<I: EmeraldExpnSpeciesIndex> Pk3EmeraldExpn<I> {
    pub const BOX_SIZE: usize = 58;
    pub const PARTY_SIZE: usize = 100;

    /// Unpack 4×10-bit move IDs from 5 bytes at 0x27..0x2B
    #[inline]
    fn read_moves_10bit(bytes: &[u8]) -> [MoveIndex; 4] {
        let base = 0x27;
        let v = (bytes[base] as u64)
            | ((bytes[base + 1] as u64) << 8)
            | ((bytes[base + 2] as u64) << 16)
            | ((bytes[base + 3] as u64) << 24)
            | ((bytes[base + 4] as u64) << 32);

        let mut moves = [MoveIndex::from(0u16); 4];

        for (i, move_slot) in moves.iter_mut().enumerate() {
            let cfru_index = ((v >> (i * 10)) & 0x3FF) as usize;

            if cfru_index == 0 {
                *move_slot = MoveIndex::empty();
                continue;
            }

            let official_move_id = from_gen3_cfru_move_index(cfru_index).unwrap_or(0); // fallback to 0 if unknown

            *move_slot = MoveIndex::from(official_move_id as u16);
        }

        moves
    }

    /// Pack 4×10-bit move IDs into 5 bytes at 0x27..0x2B
    #[inline]
    fn write_moves_10bit(moves: &[MoveIndex; 4], bytes: &mut [u8]) {
        let base = 0x27;

        let mut v: u64 = 0;
        for (i, move_slot) in moves.iter().enumerate() {
            let cfru_index = if move_slot.is_empty() {
                // if the slot is empty, force EM index 0
                0
            } else {
                let nat_id = u16::from(*move_slot) as usize;
                to_gen3_cfru_move_index(nat_id).unwrap_or(0) as usize
            };

            v |= (cfru_index as u64 & 0x3FF) << (i * 10);
        }

        bytes[base] = (v & 0xFF) as u8;
        bytes[base + 1] = ((v >> 8) & 0xFF) as u8;
        bytes[base + 2] = ((v >> 16) & 0xFF) as u8;
        bytes[base + 3] = ((v >> 24) & 0xFF) as u8;
        bytes[base + 4] = ((v >> 32) & 0xFF) as u8;
    }
}

impl<I: EmeraldExpnSpeciesIndex> PkmBytes for Pk3EmeraldExpn<I> {
    const BOX_SIZE: usize = Pk3Cfru::<I>::BOX_SIZE;
    const PARTY_SIZE: usize = Pk3Cfru::<I>::PARTY_SIZE;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        if size < Self::BOX_SIZE {
            return Err(Error::buffer_size(Self::BOX_SIZE, size));
        }

        // 0x34..0x36: met info & flags
        let meta = u16::from_le_bytes(bytes[0x34..0x36].try_into().unwrap());
        let met_level = (meta & 0x7F) as u8;
        let game_of_origin = OriginGame::from(((meta >> 7) & 0xF) as u8);
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

        let mon = Pk3Cfru {
            personality_value: read_u32_le!(bytes, 0),
            trainer_id: read_u16_le!(bytes, 4),
            secret_id: read_u16_le!(bytes, 6),
            nickname: Gen3String::from_bytes(bytes[8..18].try_into().unwrap()),

            // Sanity 19
            // sanity = bytes[19];

            // Language 18
            language_index: bytes[18],

            // OT Name 20:27
            trainer_name: Gen3String::from_bytes(bytes[20..27].try_into().unwrap()),

            // Markings 27
            markings: MarkingsFourShapes::from_byte(bytes[27]),

            // Species 28:30
            cfru_species_index: I::from(read_u16_le!(bytes, 28)),

            held_item_index: read_u16_le!(bytes, 30),
            exp: read_u32_le!(bytes, 32),
            move_pp_ups,
            trainer_friendship: bytes[37],
            ball: cfru_ball_from_index(bytes[38]),
            moves: Self::read_moves_10bit(bytes),
            move_pp: [0, 0, 0, 0], // to be computed later
            evs: Stats8::from_bytes(bytes[44..50].try_into().unwrap()),
            pokerus: bytes[50],
            met_location_index: bytes[51],
            met_level,
            game_of_origin,
            can_gigantamax,
            trainer_gender,
            ivs,
            is_egg,
            has_hidden_ability,
            is_nicknamed: true,
            current_hp: 0,
        };

        Ok(mon)
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
        bytes[28..30].copy_from_slice(&self.cfru_species_index.into().to_le_bytes());

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
        bytes[50] = self.pokerus;

        // 51 Met Location
        bytes[51] = self.met_location_index;

        // 52:53 Met Info (packed: level, game of origin, Gigantamax, trainer gender)
        let mut meta: u16 = 0;
        meta |= self.met_level as u16 & 0x7F;
        meta |= (self.game_of_origin as u16 & 0x0F) << 7;
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
}

impl<I: CfruSpeciesIndex> IsShiny for Pk3Cfru<I> {
    fn is_shiny(&self) -> bool {
        let tid = self.trainer_id as u32;
        let sid = self.secret_id as u32;
        let pid = self.personality_value;

        let xor = tid ^ sid ^ (pid & 0xFFFF) ^ ((pid >> 16) & 0xFFFF);
        xor < 8
    }

    fn is_square_shiny(&self) -> bool {
        let tid = self.trainer_id as u32;
        let sid = self.secret_id as u32;
        let pid = self.personality_value;

        let xor = tid ^ sid ^ (pid & 0xFFFF) ^ ((pid >> 16) & 0xFFFF);
        xor == 0
    }

}
impl PkmBytes for Pk3EmeraldExpn {
    const BOX_SIZE: usize = 80;
    const PARTY_SIZE: usize = 100;

    fn from_bytes(bytes: &[u8]) -> Rresullt<Self> {
        Self::try_from_bytes(bytes)
    }
}
