use crate::conversion::gen3_pokemon_index::Gen3PokemonIndex;
use crate::pkm::traits::IsShiny8192;
use crate::pkm::{Error, HasSpeciesAndForme, PkmBytes, Result};
use crate::strings::Gen3String;
use crate::{read_move_index, util};

use arbitrary_int::{u2, u4, u7, u30};
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::language::Language;
use pkm_rs_resources::moves::MoveIndex;
use pkm_rs_resources::ribbons::Gen3RibbonSet;
use pkm_rs_resources::species::{FormeMetadata, NatDexIndex, SpeciesAndForme, SpeciesMetadata};
use pkm_rs_types::{
    BinaryGender, ContestStats, FlagReader, MarkingsFourShapes, OriginGame, Stats8, Stats16Le,
    read_u16_le, read_u32_le,
};
use serde::Serialize;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, IsShiny8192)]
pub struct Pk3 {
    pub personality_value: u32,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub nickname: Gen3String<10>,
    pub language_index: Language,
    is_bad_egg: bool,
    has_species: bool,
    use_egg_name: bool,
    box_rs_restricted: bool,
    pub trainer_name: Gen3String<7>,
    pub markings: MarkingsFourShapes,
    pub stored_checksum: u16,
    unknown_u16: u16,
    pub pokemon_index: Gen3PokemonIndex,
    pub held_item_index: u16,
    pub exp: u32,
    pub move_pp_ups: [u8; 4],
    pub trainer_friendship: u8,
    growth_block_unused_u16: u16,
    pub moves: [MoveIndex; 4],
    pub move_pp: [u8; 4],
    pub evs: Stats8,
    pub contest: ContestStats,
    pub pokerus_byte: u8,
    pub met_location_index: u8,
    pub met_level: u8,
    pub game_of_origin: OriginGame,
    pub ball: Ball,
    pub trainer_gender: BinaryGender,
    pub ivs: Stats8,
    pub is_egg: bool,
    pub has_second_ability: bool,
    pub ribbons: Gen3RibbonSet,
    pub is_fateful_encounter: bool,
    pub status_condition: u32,
    pub stat_level: u8,
    pub mail_id: u8,
    pub current_hp: u16,
    pub stats: Stats16Le,
}

const UNOWN_NATIONAL_DEX: NatDexIndex = unsafe { NatDexIndex::new_unchecked(201) };
const UNOWN_FORM_COUNT: u8 = 28;

impl Pk3 {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        if size < Pk3::BOX_SIZE {
            return Err(Error::buffer_size(Pk3::BOX_SIZE, size));
        }
        // try_into() will always succeed thanks to the length check
        let byte_19_flags = FlagReader::at_offset(bytes, 19, 1);
        let met_info = read_u16_le!(bytes, 70);
        let mut mon = Pk3 {
            personality_value: read_u32_le!(bytes, 0),
            trainer_id: read_u16_le!(bytes, 4),
            secret_id: read_u16_le!(bytes, 6),
            nickname: Gen3String::from_bytes(bytes[8..18].try_into().unwrap()),
            language_index: Language::try_from(bytes[18])?,
            is_bad_egg: byte_19_flags.get(0),
            has_species: byte_19_flags.get(1),
            use_egg_name: byte_19_flags.get(2),
            box_rs_restricted: byte_19_flags.get(3),
            trainer_name: Gen3String::from_bytes(bytes[20..27].try_into().unwrap()),
            markings: MarkingsFourShapes::from_byte(bytes[27]),
            stored_checksum: read_u16_le!(bytes, 28),
            unknown_u16: read_u16_le!(bytes, 30),
            pokemon_index: Gen3PokemonIndex::new(read_u16_le!(bytes, 32))?,
            held_item_index: read_u16_le!(bytes, 34),
            exp: read_u32_le!(bytes, 36),
            move_pp_ups: [
                u2::extract_u8(bytes[40], 0).into(),
                u2::extract_u8(bytes[40], 2).into(),
                u2::extract_u8(bytes[40], 4).into(),
                u2::extract_u8(bytes[40], 6).into(),
            ],
            trainer_friendship: bytes[41],
            growth_block_unused_u16: read_u16_le!(bytes, 42),
            moves: [
                read_move_index!(bytes, 44),
                read_move_index!(bytes, 46),
                read_move_index!(bytes, 48),
                read_move_index!(bytes, 50),
            ],
            move_pp: [bytes[52], bytes[53], bytes[54], bytes[55]],
            evs: Stats8::from_bytes(bytes[56..62].try_into().unwrap()),
            contest: ContestStats::from_bytes(bytes[62..68].try_into().unwrap()),
            pokerus_byte: bytes[68],
            met_location_index: bytes[69],
            met_level: u7::extract_u16(met_info, 0).value(),
            game_of_origin: OriginGame::from(u4::extract_u16(met_info, 7)),
            ball: Ball::from(u4::extract_u16(met_info, 11)),
            trainer_gender: BinaryGender::from(met_info & 15 == 1),
            ivs: Stats8::from_u30(u30::extract_u32(read_u32_le!(bytes, 72), 0)),
            is_egg: util::get_flag(bytes, 72, 30),
            has_second_ability: util::get_flag(bytes, 72, 31),
            ribbons: Gen3RibbonSet::from_u32(read_u32_le!(bytes, 76)),
            is_fateful_encounter: util::get_flag(bytes, 76, 31),
            ..Default::default()
        };
        if bytes.len() > Self::BOX_SIZE {
            mon.status_condition = read_u32_le!(bytes, 80);
            mon.stat_level = bytes[84];
            mon.mail_id = bytes[85];
            mon.current_hp = read_u16_le!(bytes, 86);
            mon.stats = Stats16Le::from_bytes(bytes[88..100].try_into().unwrap());
        }
        Ok(mon)
    }

    pub fn get_species_and_forme(&self) -> SpeciesAndForme {
        match self.get_unown_form() {
            Some(form) => form.to_species_and_forme(),
            None => SpeciesAndForme::base_form(self.pokemon_index.to_national_dex()),
        }
    }

    fn get_unown_form(&self) -> Option<UnownForm> {
        if self.pokemon_index.to_national_dex() == UNOWN_NATIONAL_DEX {
            Some(UnownForm::from_pid(self.personality_value))
        } else {
            None
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct UnownForm(u8);

impl UnownForm {
    #[cfg(test)]
    pub fn new(value: u8) -> Self {
        if value >= UNOWN_FORM_COUNT {
            panic!("Invalid Unown form value: {value}");
        }
        Self(value)
    }

    pub fn from_pid(pid: u32) -> Self {
        Self(
            pid.to_be_bytes()
                .into_iter()
                .map(|b| b & 0b11)
                .fold(0, |acc, bits| (acc << 2) | bits)
                % UNOWN_FORM_COUNT,
        )
    }

    pub const fn to_species_and_forme(self) -> SpeciesAndForme {
        unsafe { SpeciesAndForme::new_unchecked(UNOWN_NATIONAL_DEX.get(), self.0 as u16) }
    }
}

impl PkmBytes for Pk3 {
    const BOX_SIZE: usize = 80;
    const PARTY_SIZE: usize = 100;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::from_bytes(bytes)
    }

    fn write_box_bytes(&self, bytes: &mut [u8]) {
        bytes[0..4].copy_from_slice(&self.personality_value.to_le_bytes());
        bytes[4..6].copy_from_slice(&self.trainer_id.to_le_bytes());
        bytes[6..8].copy_from_slice(&self.secret_id.to_le_bytes());
        bytes[8..18].copy_from_slice(self.nickname.bytes().as_ref());
        bytes[18] = self.language_index as u8;
        util::set_flag(bytes, 19, 0, self.is_bad_egg);
        util::set_flag(bytes, 19, 1, self.has_species);
        util::set_flag(bytes, 19, 2, self.use_egg_name);
        util::set_flag(bytes, 19, 3, self.box_rs_restricted);
        bytes[20..27].copy_from_slice(self.trainer_name.bytes().as_ref());
        bytes[27] = self.markings.to_byte();
        bytes[28..30].copy_from_slice(&self.stored_checksum.to_le_bytes());
        bytes[30..32].copy_from_slice(&self.unknown_u16.to_le_bytes());
        bytes[32..34].copy_from_slice(&self.pokemon_index.to_le_bytes());
        bytes[34..36].copy_from_slice(&self.held_item_index.to_le_bytes());
        bytes[36..40].copy_from_slice(&self.exp.to_le_bytes());
        bytes[40] = (self.move_pp_ups[0] & 0b11)
            | (self.move_pp_ups[1] & 0b11) << 2
            | (self.move_pp_ups[2] & 0b11) << 4
            | (self.move_pp_ups[3] & 0b11) << 6;
        bytes[41] = self.trainer_friendship;
        bytes[42..44].copy_from_slice(&self.growth_block_unused_u16.to_le_bytes());

        bytes[44..46].copy_from_slice(&self.moves[0].to_le_bytes());
        bytes[46..48].copy_from_slice(&self.moves[1].to_le_bytes());
        bytes[48..50].copy_from_slice(&self.moves[2].to_le_bytes());
        bytes[50..52].copy_from_slice(&self.moves[3].to_le_bytes());

        bytes[52] = self.move_pp[0];
        bytes[53] = self.move_pp[1];
        bytes[54] = self.move_pp[2];
        bytes[55] = self.move_pp[3];

        bytes[56..62].copy_from_slice(self.evs.to_bytes().as_ref());
        bytes[62..68].copy_from_slice(self.contest.to_bytes().as_ref());
        bytes[68] = self.pokerus_byte;
        bytes[69] = self.met_location_index;
        let met_info = (self.met_level as u16 & 0b1111111)
            | ((self.game_of_origin as u16 & 0b1111) << 7)
            | ((self.ball as u16 & 0b1111) << 11);
        bytes[70..72].copy_from_slice(&met_info.to_le_bytes());
        self.ivs.write_30_bits(bytes, 72);
        util::set_flag(bytes, 72, 30, self.is_egg);
        util::set_flag(bytes, 72, 31, self.has_second_ability);
        bytes[76..80].copy_from_slice(&self.ribbons.to_u32().to_le_bytes());
        util::set_flag(bytes, 76, 31, self.is_fateful_encounter);
    }

    fn write_party_bytes(&self, bytes: &mut [u8]) {
        self.write_box_bytes(bytes);
        bytes[80..84].copy_from_slice(&self.status_condition.to_le_bytes());
        bytes[84] = self.stat_level;
        bytes[85] = self.mail_id;
        bytes[86..88].copy_from_slice(&self.current_hp.to_le_bytes());
        bytes[88..100].copy_from_slice(self.stats.to_bytes().as_ref());
    }

    fn to_box_bytes(&self) -> Vec<u8> {
        let mut bytes = [0; Self::BOX_SIZE];
        self.write_box_bytes(&mut bytes);

        Vec::from(bytes)
    }

    fn to_party_bytes(&self) -> Vec<u8> {
        let mut bytes = [0; Self::PARTY_SIZE];
        self.write_party_bytes(&mut bytes);

        Vec::from(bytes)
    }
}

impl HasSpeciesAndForme for Pk3 {
    fn get_species_metadata(&self) -> &'static SpeciesMetadata {
        self.get_species_and_forme().get_species_metadata()
    }

    fn get_forme_metadata(&self) -> &'static FormeMetadata {
        self.get_species_and_forme().get_forme_metadata()
    }

    fn calculate_level(&self) -> u8 {
        self.get_species_metadata()
            .level_up_type
            .calculate_level(self.exp)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_unown_form_calculation() {
        let letter_to_pid: std::collections::HashMap<char, u32> = [
            ('E', 0x7A12C368),
            ('Q', 0x7A1DC364),
            ('T', 0xF29D4BE7),
            ('Z', 0x1135A84D),
        ]
        .into_iter()
        .collect();

        for (letter, &pid) in &letter_to_pid {
            let expected_index = *letter as u8 - b'A';
            let unown = UnownForm::from_pid(pid);
            assert_eq!(
                unown,
                UnownForm::new(expected_index),
                "Expected Unown letter {letter}; but calculated {}.",
                (unown.0 + b'A') as char
            );
        }
    }
}
