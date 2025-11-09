use crate::pkm::traits::ModernEvs;
use crate::pkm::{Error, Pkm, Result};
use crate::strings::SizedUtf16String;
use crate::util;

use pkm_rs_derive::IsShiny4096;
use pkm_rs_resources::moves::MoveSlot;
use pkm_rs_resources::species::{FormeMetadata, SpeciesAndForme, SpeciesMetadata};
use pkm_rs_types::{ContestStats, HyperTraining, MarkingsSixShapesColors, Stats8, Stats16Le};
use pkm_rs_types::{FlagSet, Gender};
use serde::Serialize;

#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny4096)]
pub struct Pk8 {
    pub encryption_constant: u32,
    pub sanity: u16,
    pub checksum: u16,
    pub species_and_forme: SpeciesAndForme,
    pub held_item_index: u16,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub exp: u32,
    pub ability_index: u16,
    pub ability_num: u8,
    pub favorite: bool,
    pub can_gigantamax: bool,
    pub markings: MarkingsSixShapesColors,
    pub personality_value: u32,
    pub nature: u8,
    pub stat_nature: u8,
    pub is_fateful_encounter: bool,
    pub gender: Gender,
    pub flag_34_1: bool,
    pub evs: Stats8,
    pub contest: ContestStats,
    pub pokerus_byte: u8,
    pub ribbon_bytes: FlagSet<8>,
    pub contest_memory_count: u8,
    pub battle_memory_count: u8,
    pub sociability: u32,
    pub height: u8,
    pub weight: u8,
    pub nickname: SizedUtf16String<26>,
    pub moves: [MoveSlot; 4],
    pub move_pp: [u8; 4],
    pub move_pp_ups: [u8; 4],
    pub relearn_moves: [u16; 4],
    pub current_hp: u16,
    pub ivs: Stats8,
    pub is_egg: bool,
    pub is_nicknamed: bool,
    pub dynamax_level: u8,
    pub status_condition: u32,
    pub palma: u32,
    pub handler_name: SizedUtf16String<24>,
    pub handler_gender: Gender,
    pub handler_language: u8,
    pub handler_id: u16,
    pub handler_friendship: u8,
    pub fullness: u8,
    pub enjoyment: u8,
    pub game_of_origin: u8,
    pub game_of_origin_battle: u8,
    pub region: u8,
    pub console_region: u8,
    pub language_index: u8,
    pub form_argument: u32,
    pub affixed_ribbon: u8,
    pub trainer_name: SizedUtf16String<24>,
    pub trainer_friendship: u8,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub ball: u8,
    pub met_level: u8,
    pub tr_flags_sw_sh: [u8; 14],
    pub home_tracker: [u8; 8],
    pub is_current_handler: bool,
    pub hyper_training: HyperTraining,
    pub trainer_gender: Gender,
    pub level: u8,
    pub stats: Stats16Le,
}

impl Pk8 {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        if size < Self::BOX_SIZE {
            return Err(Error::ByteLength {
                expected: Self::BOX_SIZE,
                received: size,
            });
        }
        // try_into() will always succeed thanks to the length check
        let mon = Pk8 {
            encryption_constant: u32::from_le_bytes(bytes[0..4].try_into().unwrap()),
            sanity: u16::from_le_bytes(bytes[4..6].try_into().unwrap()),
            checksum: u16::from_le_bytes(bytes[6..8].try_into().unwrap()),
            species_and_forme: SpeciesAndForme::new(
                u16::from_le_bytes(bytes[8..10].try_into().unwrap()),
                u16::from_le_bytes(bytes[36..38].try_into().unwrap()),
            )?,
            held_item_index: u16::from_le_bytes(bytes[10..12].try_into().unwrap()),
            trainer_id: u16::from_le_bytes(bytes[12..14].try_into().unwrap()),
            secret_id: u16::from_le_bytes(bytes[14..16].try_into().unwrap()),
            exp: u32::from_le_bytes(bytes[16..20].try_into().unwrap()),
            ability_index: u16::from_le_bytes(bytes[20..22].try_into().unwrap()),
            ability_num: bytes[22] & 0b111,
            favorite: util::get_flag(bytes, 22, 3),
            can_gigantamax: util::get_flag(bytes, 22, 4),
            markings: MarkingsSixShapesColors::from_bytes(bytes[24..26].try_into().unwrap()),
            personality_value: u32::from_le_bytes(bytes[28..32].try_into().unwrap()),
            nature: bytes[32],
            stat_nature: bytes[33],
            is_fateful_encounter: util::get_flag(bytes, 34, 0),
            gender: Gender::from_bits_2_3(bytes[34]),
            flag_34_1: util::get_flag(bytes, 34, 1),
            evs: Stats8::from_bytes(bytes[38..44].try_into().unwrap()),
            contest: ContestStats::from_bytes(bytes[44..50].try_into().unwrap()),
            pokerus_byte: bytes[50],
            ribbon_bytes: FlagSet::from_bytes(bytes[52..60].try_into().unwrap()),
            contest_memory_count: bytes[60],
            battle_memory_count: bytes[61],
            sociability: u32::from_le_bytes(bytes[72..76].try_into().unwrap()),
            height: bytes[80],
            weight: bytes[81],
            nickname: SizedUtf16String::<26>::from_bytes(bytes[88..114].try_into().unwrap()),
            moves: [
                MoveSlot::from(u16::from_le_bytes(bytes[114..116].try_into().unwrap())),
                MoveSlot::from(u16::from_le_bytes(bytes[116..118].try_into().unwrap())),
                MoveSlot::from(u16::from_le_bytes(bytes[118..120].try_into().unwrap())),
                MoveSlot::from(u16::from_le_bytes(bytes[120..122].try_into().unwrap())),
            ],
            move_pp: [bytes[122], bytes[123], bytes[124], bytes[125]],
            move_pp_ups: [bytes[126], bytes[127], bytes[128], bytes[129]],
            relearn_moves: [
                u16::from_le_bytes(bytes[130..132].try_into().unwrap()),
                u16::from_le_bytes(bytes[132..134].try_into().unwrap()),
                u16::from_le_bytes(bytes[134..136].try_into().unwrap()),
                u16::from_le_bytes(bytes[136..138].try_into().unwrap()),
            ],
            current_hp: u16::from_le_bytes(bytes[138..140].try_into().unwrap()),
            ivs: Stats8::from_30_bits(bytes[140..144].try_into().unwrap()),
            is_egg: util::get_flag(bytes, 140, 30),
            is_nicknamed: util::get_flag(bytes, 140, 31),
            dynamax_level: bytes[144],
            status_condition: u32::from_le_bytes(bytes[148..152].try_into().unwrap()),
            palma: u32::from_le_bytes(bytes[152..156].try_into().unwrap()),
            handler_name: SizedUtf16String::<24>::from_bytes(bytes[168..192].try_into().unwrap()),
            handler_gender: Gender::from(util::get_flag(bytes, 194, 0)),
            handler_language: bytes[195],
            is_current_handler: util::get_flag(bytes, 196, 0),
            handler_id: u16::from_le_bytes(bytes[198..200].try_into().unwrap()),
            handler_friendship: bytes[200],
            fullness: bytes[220],
            enjoyment: bytes[221],
            game_of_origin: bytes[222],
            game_of_origin_battle: bytes[223],
            region: bytes[224],
            console_region: bytes[224],
            language_index: bytes[226],
            form_argument: u32::from_le_bytes(bytes[228..232].try_into().unwrap()),
            affixed_ribbon: bytes[232],
            trainer_name: SizedUtf16String::<24>::from_bytes(bytes[248..272].try_into().unwrap()),
            trainer_friendship: bytes[274],
            egg_location_index: u16::from_le_bytes(bytes[288..290].try_into().unwrap()),
            met_location_index: u16::from_le_bytes(bytes[290..292].try_into().unwrap()),
            ball: bytes[292],
            met_level: util::int_from_buffer_bits_le::<u8>(bytes, 293, 0, 7).map_err(|e| {
                Error::FieldError {
                    field: "met_level",
                    source: e,
                }
            })?,
            tr_flags_sw_sh: bytes[295..309].try_into().unwrap(),
            home_tracker: bytes[309..317].try_into().unwrap(),
            hyper_training: HyperTraining::from_byte(bytes[294]),
            trainer_gender: util::get_flag(bytes, 293, 7).into(),
            level: bytes[328],
            stats: Stats16Le::from_bytes(bytes[330..342].try_into().unwrap()),
        };
        Ok(mon)
    }
}

impl Pkm for Pk8 {
    const BOX_SIZE: usize = 344;
    const PARTY_SIZE: usize = 344;

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
        bytes[0..4].copy_from_slice(&self.encryption_constant.to_le_bytes());
        bytes[4..6].copy_from_slice(&self.sanity.to_le_bytes());
        bytes[6..8].copy_from_slice(&self.checksum.to_le_bytes());
        bytes[8..10].copy_from_slice(&self.species_and_forme.get_ndex().to_le_bytes());
        bytes[10..12].copy_from_slice(&self.held_item_index.to_le_bytes());
        bytes[12..14].copy_from_slice(&self.trainer_id.to_le_bytes());
        bytes[14..16].copy_from_slice(&self.secret_id.to_le_bytes());
        bytes[16..20].copy_from_slice(&self.exp.to_le_bytes());
        bytes[20..22].copy_from_slice(&self.ability_index.to_le_bytes());
        bytes[22] = self.ability_num;

        bytes[28..32].copy_from_slice(&self.personality_value.to_le_bytes());
        bytes[32] = self.nature;
        bytes[33] = self.stat_nature;

        util::set_flag(bytes, 34, 0, self.is_fateful_encounter);
        util::set_flag(bytes, 34, 1, self.flag_34_1);
        self.gender.set_bits_2_3(&mut bytes[34]);

        bytes[38..44].copy_from_slice(&self.evs.to_bytes());
        bytes[44..50].copy_from_slice(&self.contest.to_bytes());
        bytes[50] = self.pokerus_byte;

        bytes[60] = self.contest_memory_count;
        bytes[61] = self.battle_memory_count;
        bytes[72..76].copy_from_slice(&self.sociability.to_le_bytes());

        // 76..79 unused

        bytes[80] = self.height;
        bytes[81] = self.weight;
        bytes[88..114].copy_from_slice(&self.nickname);

        bytes[114..116].copy_from_slice(&self.moves[0].to_le_bytes());
        bytes[116..118].copy_from_slice(&self.moves[1].to_le_bytes());
        bytes[118..120].copy_from_slice(&self.moves[2].to_le_bytes());
        bytes[120..122].copy_from_slice(&self.moves[3].to_le_bytes());

        bytes[138..140].copy_from_slice(&self.current_hp.to_le_bytes());

        bytes[144] = self.dynamax_level;
        bytes[148..152].copy_from_slice(&self.status_condition.to_le_bytes());
        bytes[152..156].copy_from_slice(&self.palma.to_le_bytes());
        bytes[168..192].copy_from_slice(&self.handler_name);

        bytes[195] = self.handler_language;
        bytes[198..200].copy_from_slice(&self.handler_id.to_le_bytes());
        bytes[200] = self.handler_friendship;
        bytes[220] = self.fullness;
        bytes[221] = self.enjoyment;
        bytes[222] = self.game_of_origin;
        bytes[223] = self.game_of_origin_battle;
        bytes[224] = self.region;
        bytes[224] = self.console_region;
        bytes[226] = self.language_index;
        bytes[228..232].copy_from_slice(&self.form_argument.to_le_bytes());

        bytes[248..272].copy_from_slice(&self.trainer_name);
        bytes[274] = self.trainer_friendship;
        bytes[288..290].copy_from_slice(&self.egg_location_index.to_le_bytes());
        bytes[290..292].copy_from_slice(&self.met_location_index.to_le_bytes());
        bytes[292] = self.ball;
        bytes[293] = self.met_level;

        bytes[294] = self.hyper_training.to_byte();

        bytes[328] = self.level;
        bytes[330..342].copy_from_slice(&self.stats.to_bytes());

        Ok(())
    }

    fn write_party_bytes(&self, bytes: &mut [u8]) -> Result<()> {
        self.write_box_bytes(bytes)
    }

    fn to_box_bytes(&self) -> Result<Vec<u8>> {
        let mut bytes = [0; Self::BOX_SIZE];
        self.write_box_bytes(&mut bytes)?;

        Ok(Vec::from(bytes))
    }

    fn to_party_bytes(&self) -> Result<Vec<u8>> {
        self.to_box_bytes()
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

impl ModernEvs for Pk8 {
    fn get_evs(&self) -> Stats8 {
        self.evs
    }
}
