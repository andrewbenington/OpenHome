use crate::pkm::traits::{IsShiny4096, ModernEvs};
use crate::pkm::{Error, HasSpeciesAndForme, PkmBytes, Result};
use crate::util;
use crate::{read_u16_le, read_u32_le};

use pkm_rs_resources::abilities::AbilityIndex;
use pkm_rs_resources::moves::MoveSlot;
use pkm_rs_resources::species::{FormeMetadata, SpeciesAndForme, SpeciesMetadata};
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{Gender, PokeDate};
use pkm_rs_types::{HyperTraining, MarkingsSixShapesColors, Stats8, Stats16Le};
use serde::Serialize;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny4096)]
pub struct Pb7 {
    pub encryption_constant: u32,
    pub checksum: u16,
    pub species_and_forme: SpeciesAndForme,
    pub held_item_index: u16,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub exp: u32,
    pub ability_index: AbilityIndex,
    pub ability_num: u8,
    pub favorite: bool,
    pub markings: MarkingsSixShapesColors,
    pub personality_value: u32,
    pub nature: u8,
    pub is_fateful_encounter: bool,
    pub gender: Gender,
    pub evs: Stats8,
    pub avs: Stats8,
    pub resort_event_status: u8,
    pub pokerus_byte: u8,
    pub height_absolute_bytes: [u8; 4],
    pub height: u8,
    pub weight: u8,
    pub form_argument: u32,
    pub nickname: SizedUtf16String<26>,
    pub moves: [MoveSlot; 4],
    pub move_pp: [u8; 4],
    pub move_pp_ups: [u8; 4],
    pub relearn_moves: [MoveSlot; 4],
    pub ivs: Stats8,
    pub is_egg: bool,
    pub is_nicknamed: bool,
    pub handler_name: SizedUtf16String<24>,
    pub handler_gender: bool,
    pub is_current_handler: bool,
    pub handler_friendship: u8,
    pub field_event_fatigue1: u8,
    pub field_event_fatigue2: u8,
    pub fullness: u8,
    pub enjoyment: u8,
    pub trainer_name: SizedUtf16String<24>,
    pub trainer_friendship: u8,
    pub received_year: u8,
    pub received_month: u8,
    pub received_day: u8,
    pub received_hour: u8,
    pub received_minute: u8,
    pub received_second: u8,
    pub egg_date: PokeDate,
    pub met_date: PokeDate,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub ball: u8,
    pub met_level: u8,
    pub hyper_training: HyperTraining,
    pub game_of_origin: u8,
    pub language_index: u8,
    pub weight_absolute_bytes: [u8; 4],
    pub status_condition: u32,
    pub level: u8,
    pub dirt_type: u8,
    pub dirt_location: u8,
    pub current_hp: u16,
    pub stats: Stats16Le,
    pub cp: u16,
    pub is_mega: u8,
    pub mega_forme: u8,
    pub trainer_gender: Gender,
}

impl Pb7 {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        if size < Pb7::BOX_SIZE {
            return Err(Error::buffer_size(Pb7::BOX_SIZE, size));
        }
        // try_into() will always succeed thanks to the length check
        let mon = Pb7 {
            encryption_constant: read_u32_le!(bytes, 0),
            checksum: read_u16_le!(bytes, 6),
            species_and_forme: SpeciesAndForme::new(
                read_u16_le!(bytes, 8),
                util::read_uint5_from_bits(bytes[29], 3).into(),
            )?,
            held_item_index: read_u16_le!(bytes, 10),
            trainer_id: read_u16_le!(bytes, 12),
            secret_id: read_u16_le!(bytes, 14),
            exp: read_u32_le!(bytes, 16),
            ability_index: AbilityIndex::try_from(bytes[20])?,
            ability_num: bytes[21],
            markings: MarkingsSixShapesColors::from_bytes(bytes[22..24].try_into().unwrap()),
            favorite: util::get_flag(bytes, 21, 3),
            personality_value: read_u32_le!(bytes, 24),
            nature: bytes[28],
            is_fateful_encounter: util::get_flag(bytes, 29, 0),
            gender: Gender::from_bits_1_2(bytes[29]),
            evs: Stats8::from_bytes(bytes[30..36].try_into().unwrap()),
            avs: Stats8::from_bytes(bytes[36..42].try_into().unwrap()),
            resort_event_status: bytes[42],
            pokerus_byte: bytes[43],
            height_absolute_bytes: bytes[44..48].try_into().unwrap(),
            height: bytes[58],
            weight: bytes[59],
            form_argument: read_u32_le!(bytes, 60),
            nickname: SizedUtf16String::<26>::from_bytes(bytes[64..90].try_into().unwrap()),
            moves: [
                MoveSlot::from(read_u16_le!(bytes, 90)),
                MoveSlot::from(read_u16_le!(bytes, 92)),
                MoveSlot::from(read_u16_le!(bytes, 94)),
                MoveSlot::from(read_u16_le!(bytes, 96)),
            ],
            move_pp: [bytes[98], bytes[99], bytes[100], bytes[101]],
            move_pp_ups: [bytes[102], bytes[103], bytes[104], bytes[105]],
            relearn_moves: [
                MoveSlot::from(read_u16_le!(bytes, 106)),
                MoveSlot::from(read_u16_le!(bytes, 108)),
                MoveSlot::from(read_u16_le!(bytes, 110)),
                MoveSlot::from(read_u16_le!(bytes, 112)),
            ],
            ivs: Stats8::from_30_bits(bytes[116..120].try_into().unwrap()),
            is_egg: util::get_flag(bytes, 116, 30),
            is_nicknamed: util::get_flag(bytes, 116, 31),
            handler_name: SizedUtf16String::<24>::from_bytes(bytes[120..144].try_into().unwrap()),
            handler_gender: util::get_flag(bytes, 146, 0),
            is_current_handler: util::get_flag(bytes, 147, 0),
            handler_friendship: bytes[162],
            field_event_fatigue1: bytes[172],
            field_event_fatigue2: bytes[173],
            fullness: bytes[174],
            enjoyment: bytes[175],
            trainer_name: SizedUtf16String::<24>::from_bytes(bytes[176..200].try_into().unwrap()),
            trainer_friendship: bytes[202],
            received_year: bytes[203],
            received_month: bytes[204],
            received_day: bytes[205],
            received_hour: bytes[206],
            received_minute: bytes[207],
            received_second: bytes[208],
            egg_date: PokeDate::from_bytes(bytes[209..212].try_into().unwrap()),
            met_date: PokeDate::from_bytes(bytes[212..215].try_into().unwrap()),
            egg_location_index: read_u16_le!(bytes, 216),
            met_location_index: read_u16_le!(bytes, 218),
            ball: bytes[220],
            met_level: bytes[221],
            trainer_gender: util::get_flag(bytes, 221, 7).into(),
            hyper_training: HyperTraining::from_byte(bytes[222]),
            game_of_origin: bytes[223],
            language_index: bytes[227],
            weight_absolute_bytes: bytes[228..232].try_into().unwrap(),
            status_condition: read_u32_le!(bytes, 232),
            level: bytes[236],
            dirt_type: bytes[237],
            dirt_location: bytes[238],
            current_hp: read_u16_le!(bytes, 240),
            stats: Stats16Le::from_bytes(bytes[242..254].try_into().unwrap()),
            cp: read_u16_le!(bytes, 254),
            is_mega: bytes[256],
            mega_forme: bytes[257],
        };
        Ok(mon)
    }
}

impl PkmBytes for Pb7 {
    const BOX_SIZE: usize = 260;
    const PARTY_SIZE: usize = 260;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::from_bytes(bytes)
    }

    fn write_box_bytes(&self, bytes: &mut [u8]) {
        bytes[0..4].copy_from_slice(&self.encryption_constant.to_le_bytes());
        bytes[6..8].copy_from_slice(&self.checksum.to_le_bytes());
        bytes[8..10].copy_from_slice(&self.species_and_forme.get_ndex().to_le_bytes());
        bytes[10..12].copy_from_slice(&self.held_item_index.to_le_bytes());
        bytes[12..14].copy_from_slice(&self.trainer_id.to_le_bytes());
        bytes[14..16].copy_from_slice(&self.secret_id.to_le_bytes());
        bytes[16..20].copy_from_slice(&self.exp.to_le_bytes());
        bytes[20] = u8::from(self.ability_index);
        bytes[21] = self.ability_num;
        bytes[22..24].copy_from_slice(&self.markings.to_bytes());
        bytes[24..28].copy_from_slice(&self.personality_value.to_le_bytes());
        bytes[28] = self.nature;

        self.gender.set_bits_1_2(&mut bytes[29]);
        util::set_flag(bytes, 29, 0, self.is_fateful_encounter);
        util::write_uint5_to_bits(
            self.species_and_forme.get_forme_index() as u8,
            &mut bytes[29],
            3,
        );

        bytes[30..36].copy_from_slice(&self.evs.to_bytes());
        bytes[36..42].copy_from_slice(&self.avs.to_bytes());
        bytes[42] = self.resort_event_status;
        bytes[43] = self.pokerus_byte;
        bytes[44..48].copy_from_slice(&self.height_absolute_bytes);
        bytes[58] = self.height;
        bytes[59] = self.weight;
        bytes[60..64].copy_from_slice(&self.form_argument.to_le_bytes());
        bytes[64..90].copy_from_slice(&self.nickname);

        bytes[90..92].copy_from_slice(&self.moves[0].to_le_bytes());
        bytes[92..94].copy_from_slice(&self.moves[1].to_le_bytes());
        bytes[94..96].copy_from_slice(&self.moves[2].to_le_bytes());
        bytes[96..98].copy_from_slice(&self.moves[3].to_le_bytes());

        bytes[98] = self.move_pp[0];
        bytes[99] = self.move_pp[1];
        bytes[100] = self.move_pp[2];
        bytes[101] = self.move_pp[3];

        bytes[102] = self.move_pp_ups[0];
        bytes[103] = self.move_pp_ups[1];
        bytes[104] = self.move_pp_ups[2];
        bytes[105] = self.move_pp_ups[3];

        bytes[106..108].copy_from_slice(&self.relearn_moves[0].to_le_bytes());
        bytes[108..110].copy_from_slice(&self.relearn_moves[1].to_le_bytes());
        bytes[110..112].copy_from_slice(&self.relearn_moves[2].to_le_bytes());
        bytes[112..114].copy_from_slice(&self.relearn_moves[3].to_le_bytes());

        // 114..115 unused

        self.ivs.write_30_bits(bytes, 116);
        util::set_flag(bytes, 116, 30, self.is_egg);
        util::set_flag(bytes, 116, 31, self.is_nicknamed);

        bytes[120..144].copy_from_slice(&self.handler_name);
        util::set_flag(bytes, 147, 0, self.is_current_handler);

        // 148..161 unused

        bytes[162] = self.handler_friendship;
        bytes[172] = self.field_event_fatigue1;
        bytes[173] = self.field_event_fatigue2;
        bytes[174] = self.fullness;
        bytes[175] = self.enjoyment;
        bytes[176..200].copy_from_slice(&self.trainer_name);
        bytes[202] = self.trainer_friendship;
        bytes[203] = self.received_year;
        bytes[204] = self.received_month;
        bytes[205] = self.received_day;
        bytes[206] = self.received_hour;
        bytes[207] = self.received_minute;
        bytes[208] = self.received_second;
        bytes[209..212].copy_from_slice(&self.egg_date.to_bytes());
        bytes[212..215].copy_from_slice(&self.met_date.to_bytes());
        bytes[216..218].copy_from_slice(&self.egg_location_index.to_le_bytes());
        bytes[218..220].copy_from_slice(&self.met_location_index.to_le_bytes());
        bytes[220] = self.ball;
        bytes[221] = self.met_level;
        bytes[222] = self.hyper_training.to_byte();
        bytes[223] = self.game_of_origin;
        bytes[227] = self.language_index;
        bytes[228..232].copy_from_slice(&self.weight_absolute_bytes);
        bytes[232..236].copy_from_slice(&self.status_condition.to_le_bytes());
        bytes[236] = self.level;
        bytes[237] = self.dirt_type;
        bytes[238] = self.dirt_location;
        bytes[240..242].copy_from_slice(&self.current_hp.to_le_bytes());
        bytes[242..254].copy_from_slice(&self.stats.to_bytes());
        bytes[254..256].copy_from_slice(&self.cp.to_le_bytes());
        bytes[256] = self.is_mega;
        bytes[257] = self.mega_forme;
    }

    fn write_party_bytes(&self, bytes: &mut [u8]) {
        self.write_box_bytes(bytes);
    }

    fn to_box_bytes(&self) -> Vec<u8> {
        let mut bytes = [0; Self::BOX_SIZE];
        self.write_box_bytes(&mut bytes);

        Vec::from(bytes)
    }

    fn to_party_bytes(&self) -> Vec<u8> {
        self.to_box_bytes()
    }
}

impl HasSpeciesAndForme for Pb7 {
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

impl ModernEvs for Pb7 {
    fn get_evs(&self) -> Stats8 {
        self.evs
    }
}
