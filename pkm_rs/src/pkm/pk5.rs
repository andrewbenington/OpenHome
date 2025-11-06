use crate::pkm::traits::{IsShiny, IsShiny8192};
use crate::pkm::{Error, Ohpkm, Pkm, Result};
use crate::strings::Gen5String;
use crate::substructures::{Gender, PokeDate};
use crate::util;

use pkm_rs_resources::abilities::AbilityIndex;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::MoveSlot;
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::DsRibbonSet;
use pkm_rs_resources::species::{FormeMetadata, SpeciesAndForme, SpeciesMetadata};
use pkm_rs_types::{ContestStats, MarkingsSixShapes, OriginGame, Stats8, Stats16Le};
use serde::Serialize;

#[derive(Debug, Serialize, Clone, Copy, IsShiny8192)]
pub struct Pk5 {
    pub personality_value: u32,
    pub species_and_forme: SpeciesAndForme,
    pub stored_checksum: u16,
    pub held_item_index: u16,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub exp: u32,
    pub trainer_friendship: u8,
    pub ability_index: AbilityIndex,
    pub markings: MarkingsSixShapes,
    pub language_index: u8,
    pub evs: Stats8,
    pub contest: ContestStats,
    pub moves: [MoveSlot; 4],
    pub move_pp: [u8; 4],
    pub move_pp_ups: [u8; 4],
    pub ivs: Stats8,
    pub is_egg: bool,
    pub is_nicknamed: bool,
    pub gender: Gender,
    pub nature: NatureIndex,
    pub is_ns_pokemon: bool,
    pub ribbons: DsRibbonSet,
    pub game_of_origin: OriginGame,
    pub egg_date: Option<PokeDate>,
    pub met_date: PokeDate,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub pokerus_byte: u8,
    pub ball: Ball,
    pub met_level: u8,
    pub encounter_type: u8,
    pub poke_star_fame: u8,
    pub is_fateful_encounter: bool,
    pub nickname: Gen5String<24>,
    pub trainer_name: Gen5String<16>,
    pub trainer_gender: Gender,
    pub status_condition: u32,
    pub stat_level: u8,
    pub junk_byte: u8,
    pub current_hp: u8,
    pub stats: Stats16Le,
}

impl Pk5 {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        if size < Pk5::BOX_SIZE {
            return Err(Error::ByteLength {
                expected: Pk5::BOX_SIZE,
                received: size,
            });
        }
        // try_into() will always succeed thanks to the length check
        let mon = Pk5 {
            personality_value: u32::from_le_bytes(bytes[0..4].try_into().unwrap()),
            stored_checksum: u16::from_le_bytes(bytes[6..8].try_into().unwrap()),
            species_and_forme: SpeciesAndForme::new(
                u16::from_le_bytes(bytes[8..10].try_into().unwrap()),
                util::read_uint5_from_bits(bytes[64], 3).into(),
            )?,
            held_item_index: u16::from_le_bytes(bytes[10..12].try_into().unwrap()),
            trainer_id: u16::from_le_bytes(bytes[12..14].try_into().unwrap()),
            secret_id: u16::from_le_bytes(bytes[14..16].try_into().unwrap()),
            exp: u32::from_le_bytes(bytes[16..20].try_into().unwrap()),
            trainer_friendship: bytes[20],
            ability_index: AbilityIndex::try_from(bytes[21])?,
            markings: MarkingsSixShapes::from_byte(bytes[22]),
            language_index: bytes[23],
            evs: Stats8::from_bytes(bytes[24..30].try_into().unwrap()),
            contest: ContestStats::from_bytes(bytes[30..36].try_into().unwrap()),
            moves: [
                MoveSlot::from(u16::from_le_bytes(bytes[40..42].try_into().unwrap())),
                MoveSlot::from(u16::from_le_bytes(bytes[42..44].try_into().unwrap())),
                MoveSlot::from(u16::from_le_bytes(bytes[44..46].try_into().unwrap())),
                MoveSlot::from(u16::from_le_bytes(bytes[46..48].try_into().unwrap())),
            ],
            move_pp: [bytes[48], bytes[49], bytes[50], bytes[51]],
            move_pp_ups: [bytes[52], bytes[53], bytes[54], bytes[55]],
            ivs: Stats8::from_30_bits(bytes[56..60].try_into().unwrap()),
            is_egg: util::get_flag(bytes, 56, 30),
            is_nicknamed: util::get_flag(bytes, 56, 31),
            gender: Gender::from_bits_1_2(bytes[64]),
            nature: NatureIndex::try_from(bytes[65])?,
            is_ns_pokemon: util::get_flag(bytes, 66, 1),
            ribbons: DsRibbonSet::from_bytes(
                bytes[60..64].try_into().unwrap(),
                bytes[36..40].try_into().unwrap(),
                bytes[96..100].try_into().unwrap(),
            ),
            game_of_origin: OriginGame::from(bytes[95]),
            egg_date: PokeDate::from_bytes_optional(bytes[120..123].try_into().unwrap()),
            met_date: PokeDate::from_bytes(bytes[123..126].try_into().unwrap()),
            egg_location_index: u16::from_le_bytes(bytes[126..128].try_into().unwrap()),
            met_location_index: u16::from_le_bytes(bytes[128..130].try_into().unwrap()),
            pokerus_byte: bytes[130],
            ball: Ball::from(bytes[131]),
            met_level: bytes[132],
            encounter_type: bytes[133],
            poke_star_fame: bytes[135],
            is_fateful_encounter: util::get_flag(bytes, 64, 0),
            nickname: Gen5String::from_bytes(bytes[72..96].try_into().unwrap()),
            trainer_name: Gen5String::from_bytes(bytes[104..120].try_into().unwrap()),
            trainer_gender: util::get_flag(bytes, 132, 7).into(),
            status_condition: if bytes.len() > Self::BOX_SIZE {
                u32::from_le_bytes(bytes[136..140].try_into().unwrap())
            } else {
                0
            },
            stat_level: if bytes.len() > Self::BOX_SIZE {
                bytes[140]
            } else {
                0
            },
            junk_byte: if bytes.len() > Self::BOX_SIZE {
                bytes[141]
            } else {
                0
            },
            current_hp: if bytes.len() > Self::BOX_SIZE {
                bytes[142]
            } else {
                0
            },
            stats: if bytes.len() > Self::BOX_SIZE {
                Stats16Le::from_bytes(bytes[142..154].try_into().unwrap())
            } else {
                Stats16Le::default()
            },
        };
        Ok(mon)
    }
}

impl Pkm for Pk5 {
    const BOX_SIZE: usize = 136;
    const PARTY_SIZE: usize = 236;

    fn box_size() -> usize {
        Self::BOX_SIZE
    }

    fn party_size() -> usize {
        Self::PARTY_SIZE
    }

    fn from_bytes(bytes: &[u8]) -> Result<Box<Self>> {
        Self::from_bytes(bytes).map(Box::new)
    }

    fn write_box_bytes(&self, bytes: &mut [u8]) -> Result<()> {
        bytes[0..4].copy_from_slice(&self.personality_value.to_le_bytes());
        bytes[8..10].copy_from_slice(&self.species_and_forme.get_ndex().to_le_bytes());
        bytes[10..12].copy_from_slice(&self.held_item_index.to_le_bytes());
        bytes[12..14].copy_from_slice(&self.trainer_id.to_le_bytes());
        bytes[14..16].copy_from_slice(&self.secret_id.to_le_bytes());
        bytes[16..20].copy_from_slice(&self.exp.to_le_bytes());
        bytes[20] = self.trainer_friendship;
        bytes[21] = self.ability_index.into();
        bytes[22] = self.markings.to_byte();
        bytes[23] = self.language_index;
        bytes[24..30].copy_from_slice(&self.evs.to_bytes());
        bytes[30..36].copy_from_slice(&self.contest.to_bytes());

        bytes[40..42].copy_from_slice(&self.moves[0].to_le_bytes());
        bytes[42..44].copy_from_slice(&self.moves[1].to_le_bytes());
        bytes[44..46].copy_from_slice(&self.moves[2].to_le_bytes());
        bytes[46..48].copy_from_slice(&self.moves[3].to_le_bytes());

        bytes[48] = self.move_pp[0];
        bytes[49] = self.move_pp[1];
        bytes[50] = self.move_pp[2];
        bytes[51] = self.move_pp[3];

        bytes[52] = self.move_pp_ups[0];
        bytes[53] = self.move_pp_ups[1];
        bytes[54] = self.move_pp_ups[2];
        bytes[55] = self.move_pp_ups[3];

        self.ivs.write_30_bits(bytes, 56);
        util::set_flag(bytes, 56, 30, self.is_egg);
        util::set_flag(bytes, 56, 31, self.is_nicknamed);
        self.gender.set_bits_1_2(&mut bytes[64]);
        util::write_uint5_to_bits(
            self.species_and_forme.get_forme_index() as u8,
            &mut bytes[64],
            3,
        );
        bytes[65] = self.nature.to_byte();
        util::set_flag(bytes, 66, 1, self.is_ns_pokemon);

        bytes[95] = self.game_of_origin as u8;
        bytes[120..123].copy_from_slice(&PokeDate::to_bytes_optional(self.egg_date));
        bytes[123..126].copy_from_slice(&self.met_date.to_bytes());
        bytes[126..128].copy_from_slice(&self.egg_location_index.to_le_bytes());
        bytes[128..130].copy_from_slice(&self.met_location_index.to_le_bytes());
        bytes[130] = self.pokerus_byte;
        bytes[131] = self.ball as u8;
        bytes[132] = self.met_level;
        bytes[133] = self.encounter_type;
        bytes[135] = self.poke_star_fame;

        util::set_flag(bytes, 64, 0, self.is_fateful_encounter);
        bytes[72..96].copy_from_slice(self.nickname.bytes().as_ref());
        bytes[104..120].copy_from_slice(self.trainer_name.bytes().as_ref());
        util::set_flag(bytes, 132, 7, self.trainer_gender.into());

        Ok(())
    }

    fn write_party_bytes(&self, bytes: &mut [u8]) -> Result<()> {
        self.write_box_bytes(bytes)?;
        bytes[136..140].copy_from_slice(&self.status_condition.to_le_bytes());
        bytes[140] = self.stat_level;
        bytes[141] = self.junk_byte;
        bytes[142] = self.current_hp;
        bytes[142..154].copy_from_slice(&self.stats.to_bytes());

        Ok(())
    }

    fn to_box_bytes(&self) -> Result<Vec<u8>> {
        let mut bytes = [0; Self::BOX_SIZE];
        self.write_box_bytes(&mut bytes)?;

        Ok(Vec::from(bytes))
    }

    fn to_party_bytes(&self) -> Result<Vec<u8>> {
        let mut bytes = [0; Self::PARTY_SIZE];
        self.write_party_bytes(&mut bytes)?;

        Ok(Vec::from(bytes))
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

impl From<Pk5> for Ohpkm {
    fn from(other: Pk5) -> Self {
        Ohpkm {
            // TODO: adjust to preserve shininess
            encryption_constant: other.personality_value,
            sanity: 0,
            checksum: 0,
            species_and_forme: other.species_and_forme,
            held_item_index: other.held_item_index,
            trainer_id: other.trainer_id,
            secret_id: other.secret_id,
            exp: other.exp,
            ability_index: other.ability_index,
            ability_num: 0,
            markings: other.markings.into(),
            personality_value: other.personality_value,
            nature: other.nature,
            stat_nature: other.nature,
            is_fateful_encounter: other.is_fateful_encounter,
            gender: other.gender,
            evs: other.evs,
            contest: other.contest,
            pokerus_byte: other.pokerus_byte,
            contest_memory_count: 0,
            battle_memory_count: 0,
            ribbons: other.ribbons.to_openhome(),
            moves: other.moves,
            move_pp: other.move_pp,
            nickname: other.nickname.to_string().into(),
            move_pp_ups: other.move_pp_ups,
            relearn_moves: [MoveSlot::from(0); 4],
            ivs: other.ivs,
            is_egg: other.is_egg,
            is_nicknamed: other.is_nicknamed,
            gvs: other.ivs.gvs_from_ivs(),
            dvs: other.ivs.dvs_from_ivs(other.is_shiny()),
            poke_star_fame: other.poke_star_fame,
            is_ns_pokemon: other.is_ns_pokemon,
            game_of_origin: other.game_of_origin,
            language_index: other.language_index,
            encounter_type: other.encounter_type,
            trainer_name: other.trainer_name.to_string().into(),
            trainer_friendship: other.trainer_friendship,
            egg_date: other.egg_date,
            met_date: other.met_date,
            ball: other.ball,
            egg_location_index: other.egg_location_index,
            met_location_index: other.met_location_index,
            met_level: other.met_level,
            trainer_gender: other.trainer_gender,
            ..Default::default()
        }
    }
}

impl From<Ohpkm> for Pk5 {
    fn from(other: Ohpkm) -> Self {
        Self {
            personality_value: other.personality_value,
            species_and_forme: other.species_and_forme,
            trainer_id: other.trainer_id,
            stored_checksum: 0,
            held_item_index: other.held_item_index,
            secret_id: other.secret_id,
            exp: other.exp,
            trainer_friendship: other.trainer_friendship,
            ability_index: other.ability_index,
            markings: other.markings.into(),
            language_index: other.language_index,
            evs: other.evs,
            contest: other.contest,
            moves: other.moves,
            move_pp: other.move_pp,
            move_pp_ups: other.move_pp_ups,
            ivs: other.ivs,
            is_egg: other.is_egg,
            is_nicknamed: other.is_nicknamed,
            gender: other.gender,
            nature: other.nature,
            is_ns_pokemon: other.is_ns_pokemon,
            ribbons: DsRibbonSet::from_openhome(other.ribbons),
            game_of_origin: other.game_of_origin,
            egg_date: other.egg_date,
            met_date: other.met_date,
            egg_location_index: other.egg_location_index,
            met_location_index: other.met_location_index,
            pokerus_byte: other.pokerus_byte,
            ball: other.ball,
            met_level: other.met_level,
            encounter_type: other.encounter_type,
            poke_star_fame: other.poke_star_fame,
            is_fateful_encounter: other.is_fateful_encounter,
            nickname: other.nickname.to_string().into(),
            trainer_name: other.trainer_name.to_string().into(),
            trainer_gender: other.trainer_gender,
            current_hp: 0,
            junk_byte: 0,
            stat_level: other.calculate_level(),
            stats: Stats16Le::default(),
            status_condition: 0,
        }
    }
}
