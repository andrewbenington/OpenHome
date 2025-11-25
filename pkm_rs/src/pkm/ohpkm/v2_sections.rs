use pkm_rs_derive::IsShiny4096;
use pkm_rs_resources::{
    abilities::AbilityIndex,
    ball::Ball,
    language::Language,
    moves::MoveSlot,
    natures::NatureIndex,
    ribbons::{ModernRibbon, OpenHomeRibbonSet},
    species::SpeciesAndForme,
};

use pkm_rs_types::{
    ContestStats, FlagSet, Gender, Geolocations, HyperTraining, MarkingsSixShapesColors,
    OriginGame, PokeDate, ShinyLeaves, Stats8, Stats16Le, StatsPreSplit, TeraType, TrainerMemory,
};
use serde::Serialize;

use crate::{
    pkm::{
        Error, Result, StringErrorSource,
        ohpkm::{OhpkmV1, SectionTagV2, sectioned_data::DataSection},
    },
    strings::SizedUtf16String,
    util,
};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const fn none_if_zero_u16(value: u16) -> Option<u16> {
    if value != 0 { Some(value) } else { None }
}

fn bytes_are_empty(bytes: &[u8]) -> bool {
    bytes.iter().all(|b| *b == 0)
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny4096)]
pub struct MainDataV2 {
    pub personality_value: u32,
    pub encryption_constant: u32,
    pub species_and_forme: SpeciesAndForme,
    pub held_item_index: u16,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub exp: u32,
    pub ability_index: AbilityIndex,
    pub ability_num: u8,
    pub favorite: bool,
    pub is_shadow: bool,
    pub markings: MarkingsSixShapesColors,
    pub nature: NatureIndex,
    pub mint_nature: Option<NatureIndex>,
    pub is_fateful_encounter: bool,
    pub gender: Gender,
    pub evs: Stats8,
    pub contest: ContestStats,
    pub pokerus_byte: u8,
    pub contest_memory_count: u8,
    pub battle_memory_count: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ribbons: OpenHomeRibbonSet<16>,
    pub sociability: u32,
    pub height_scalar: u8,
    pub weight_scalar: u8,
    pub scale: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub moves: [MoveSlot; 4],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub move_pp: [u8; 4],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub nickname: SizedUtf16String<26>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub move_pp_ups: [u8; 4],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub relearn_moves: [MoveSlot; 4],
    pub ivs: Stats8,
    pub is_egg: bool,
    pub is_nicknamed: bool,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub handler_name: SizedUtf16String<24>,
    pub handler_language: u8,
    pub is_current_handler: bool,
    pub handler_id: u16,
    pub handler_friendship: u8,
    pub handler_memory: TrainerMemory,
    pub handler_affection: u8,
    pub handler_gender: bool,
    pub fullness: u8,
    pub enjoyment: u8,
    pub game_of_origin: OriginGame,
    pub game_of_origin_battle: Option<OriginGame>,
    pub console_region: u8,
    pub language: Language,
    pub form_argument: u32,
    pub affixed_ribbon: Option<ModernRibbon>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub trainer_name: SizedUtf16String<26>,
    pub trainer_friendship: u8,
    pub trainer_memory: TrainerMemory,
    pub trainer_affection: u8,
    pub egg_date: Option<PokeDate>,
    pub met_date: PokeDate,
    pub ball: Ball,
    pub egg_location_index: Option<u16>,
    pub met_location_index: u16,
    pub met_level: u8,
    pub hyper_training: HyperTraining,
    pub trainer_gender: Gender,
    pub obedience_level: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub home_tracker: [u8; 8],
}

impl MainDataV2 {
    pub fn new(national_dex: u16, forme_index: u16) -> Result<Self> {
        Ok(Self {
            species_and_forme: SpeciesAndForme::new(national_dex, forme_index)?,
            ..Default::default()
        })
    }
    pub fn from_v1(old: OhpkmV1) -> Self {
        MainDataV2 {
            encryption_constant: old.encryption_constant,
            species_and_forme: old.species_and_forme,
            held_item_index: old.held_item_index,
            trainer_id: old.trainer_id,
            secret_id: old.secret_id,
            exp: old.exp,
            ability_index: old.ability_index,
            ability_num: old.ability_num,
            favorite: old.favorite,
            is_shadow: old.is_shadow,
            markings: old.markings,
            personality_value: old.personality_value,
            ball: old.ball,
            nature: old.nature,
            mint_nature: if old.nature != old.stat_nature {
                Some(old.stat_nature)
            } else {
                None
            },
            is_fateful_encounter: old.is_fateful_encounter,
            gender: old.gender,
            evs: old.evs,
            contest: old.contest,
            pokerus_byte: old.pokerus_byte,
            contest_memory_count: old.contest_memory_count,
            battle_memory_count: old.battle_memory_count,
            ribbons: old.ribbons,
            sociability: old.sociability,
            height_scalar: old.height_scalar,
            weight_scalar: old.weight_scalar,
            scale: old.scale,
            moves: old.moves,
            move_pp: old.move_pp,
            nickname: old.nickname,
            egg_date: old.egg_date,
            met_date: old.met_date,
            egg_location_index: none_if_zero_u16(old.egg_location_index),
            met_location_index: old.met_location_index,
            met_level: old.met_level,
            move_pp_ups: old.move_pp_ups,
            relearn_moves: old.relearn_moves,
            ivs: old.ivs,
            is_egg: old.is_egg,
            is_nicknamed: old.is_nicknamed,
            hyper_training: old.hyper_training,
            trainer_gender: old.trainer_gender,
            handler_name: old.handler_name,
            handler_language: old.handler_language,
            is_current_handler: old.is_current_handler,
            handler_id: old.handler_id,
            handler_friendship: old.handler_friendship,
            handler_memory: old.handler_memory,
            handler_affection: old.handler_affection,
            handler_gender: old.handler_gender,
            fullness: old.fullness,
            enjoyment: old.enjoyment,
            game_of_origin: old.game_of_origin,
            game_of_origin_battle: old.game_of_origin_battle,
            console_region: old.console_region,
            language: old.language,
            form_argument: old.form_argument,
            affixed_ribbon: old.affixed_ribbon,
            trainer_name: old.trainer_name,
            trainer_friendship: old.trainer_friendship,
            trainer_memory: old.trainer_memory,
            trainer_affection: old.trainer_affection,
            obedience_level: old.obedience_level,
            home_tracker: old.home_tracker,
        }
    }
}

impl DataSection for MainDataV2 {
    type TagType = SectionTagV2;
    const TAG: Self::TagType = SectionTagV2::MainData;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes)?;

        // try_into() will always succeed if the buffer range size is correct.
        // if incorrect, it is a fatal coding flaw and will always panic.
        let data = Self {
            personality_value: u32::from_le_bytes(bytes[0..4].try_into().unwrap()),
            encryption_constant: u32::from_le_bytes(bytes[4..8].try_into().unwrap()),
            species_and_forme: SpeciesAndForme::new(
                u16::from_le_bytes(bytes[8..10].try_into().unwrap()),
                u16::from_le_bytes(bytes[10..12].try_into().unwrap()),
            )?,
            trainer_id: u16::from_le_bytes(bytes[12..14].try_into().unwrap()),
            secret_id: u16::from_le_bytes(bytes[14..16].try_into().unwrap()),
            exp: u32::from_le_bytes(bytes[16..20].try_into().unwrap()),
            ability_index: AbilityIndex::try_from(u16::from_le_bytes(
                bytes[20..22].try_into().unwrap(),
            ))?,

            ability_num: util::read_uint3_from_bits(bytes[22], 0),
            favorite: util::get_flag(bytes, 22, 3),
            is_shadow: util::get_flag(bytes, 22, 4),
            is_fateful_encounter: util::get_flag(bytes, 22, 5),
            trainer_gender: Gender::from(util::get_flag(bytes, 22, 6)),

            game_of_origin: OriginGame::from(bytes[24]),
            game_of_origin_battle: match bytes[25] {
                0 => None,
                val => Some(OriginGame::from(val)),
            },

            markings: MarkingsSixShapesColors::from_bytes(bytes[26..28].try_into().unwrap()),
            ball: Ball::from(bytes[29]),
            nature: NatureIndex::try_from(bytes[32])?,
            mint_nature: if bytes[32] != bytes[33] {
                Some(NatureIndex::try_from(bytes[33])?)
            } else {
                None
            },
            gender: Gender::from_u8(bytes[34]),

            held_item_index: u16::from_le_bytes(bytes[36..38].try_into().unwrap()),
            evs: Stats8::from_bytes(bytes[38..44].try_into().unwrap()),
            contest: ContestStats::from_bytes(bytes[44..50].try_into().unwrap()),
            pokerus_byte: bytes[50],
            contest_memory_count: bytes[52],
            battle_memory_count: bytes[53],
            ribbons: OpenHomeRibbonSet::from_bytes(bytes[54..76].try_into().unwrap()).map_err(
                |e| Error::FieldError {
                    field: "ribbons",
                    source: e,
                },
            )?,
            sociability: u32::from_le_bytes(bytes[76..80].try_into().unwrap()),
            height_scalar: bytes[80],
            weight_scalar: bytes[81],
            scale: bytes[82],
            moves: [
                MoveSlot::from(u16::from_le_bytes(bytes[84..86].try_into().unwrap())),
                MoveSlot::from(u16::from_le_bytes(bytes[86..88].try_into().unwrap())),
                MoveSlot::from(u16::from_le_bytes(bytes[88..90].try_into().unwrap())),
                MoveSlot::from(u16::from_le_bytes(bytes[90..92].try_into().unwrap())),
            ],
            move_pp: [bytes[92], bytes[93], bytes[94], bytes[95]],
            nickname: SizedUtf16String::<26>::from_bytes(bytes[96..122].try_into().unwrap()),
            egg_date: PokeDate::from_bytes_optional(bytes[122..125].try_into().unwrap()),
            met_date: PokeDate::from_bytes(bytes[125..128].try_into().unwrap()),
            met_level: bytes[128] & !0x80,
            egg_location_index: none_if_zero_u16(u16::from_le_bytes(
                bytes[129..131].try_into().unwrap(),
            )),
            met_location_index: u16::from_le_bytes(bytes[131..133].try_into().unwrap()),
            move_pp_ups: [bytes[134], bytes[135], bytes[136], bytes[137]],
            relearn_moves: [
                MoveSlot::from(u16::from_le_bytes(bytes[138..140].try_into().unwrap())),
                MoveSlot::from(u16::from_le_bytes(bytes[140..142].try_into().unwrap())),
                MoveSlot::from(u16::from_le_bytes(bytes[142..144].try_into().unwrap())),
                MoveSlot::from(u16::from_le_bytes(bytes[144..146].try_into().unwrap())),
            ],
            ivs: Stats8::from_30_bits(bytes[148..152].try_into().unwrap()),
            is_egg: util::get_flag(bytes, 148, 30),
            is_nicknamed: util::get_flag(bytes, 148, 31),
            // bytes[152],
            hyper_training: HyperTraining::from_byte(bytes[153]),
            home_tracker: bytes[172..180].try_into().unwrap(),
            handler_name: SizedUtf16String::<24>::from_bytes(bytes[184..208].try_into().unwrap()),
            handler_language: bytes[211],
            is_current_handler: util::get_flag(bytes, 212, 0),
            // resort_event_status: bytes[213],
            handler_id: u16::from_le_bytes(bytes[214..216].try_into().unwrap()),
            handler_friendship: bytes[216],
            handler_memory: TrainerMemory {
                intensity: bytes[217],
                memory: bytes[218],
                feeling: bytes[219],
                text_variable: u16::from_le_bytes(bytes[220..222].try_into().unwrap()),
            },
            handler_affection: bytes[222],
            // super_training_flags: u32::from_le_bytes(bytes[223..227].try_into().unwrap()),
            // super_training_dist_flags: bytes[227],
            // secret_super_training_unlocked: util::get_flag(bytes, 228, 0),
            // secret_super_training_complete: util::get_flag(bytes, 228, 1),
            // training_bag_hits: bytes[229],
            // training_bag: bytes[230],
            // 231..235
            // poke_star_fame: bytes[232],
            obedience_level: bytes[233],
            // shiny_leaves: bytes[234] & 0x3f,
            handler_gender: util::get_flag(bytes, 234, 7),
            // is_ns_pokemon: util::get_flag(bytes, 234, 6),
            fullness: bytes[235],
            enjoyment: bytes[236],
            // country: bytes[239],
            // region: bytes[240],
            console_region: bytes[240],
            language: Language::try_from(bytes[242])?,
            form_argument: u32::from_le_bytes(bytes[244..248].try_into().unwrap()),
            affixed_ribbon: ModernRibbon::from_affixed_byte(bytes[248]),
            // geolocations: Geolocations::from_bytes(bytes[249..259].try_into().unwrap()),
            // encounter_type: bytes[270],
            // performance: bytes[271],
            trainer_name: SizedUtf16String::<26>::from_bytes(bytes[272..298].try_into().unwrap()),
            trainer_friendship: bytes[298],
            trainer_memory: TrainerMemory {
                intensity: bytes[299],
                memory: bytes[300],
                text_variable: u16::from_le_bytes(bytes[301..303].try_into().unwrap()),
                feeling: bytes[303],
            },
            trainer_affection: bytes[304],
        };
        Ok(data)
    }

    fn to_bytes(&self) -> Result<Vec<u8>> {
        let mut bytes = [0u8; 305];

        bytes[0..4].copy_from_slice(&self.personality_value.to_le_bytes());
        bytes[4..8].copy_from_slice(&self.encryption_constant.to_le_bytes());
        bytes[8..10].copy_from_slice(&self.species_and_forme.get_ndex().to_le_bytes());
        bytes[10..12].copy_from_slice(&self.species_and_forme.get_forme_index().to_le_bytes());
        bytes[12..14].copy_from_slice(&self.trainer_id.to_le_bytes());
        bytes[14..16].copy_from_slice(&self.secret_id.to_le_bytes());
        bytes[16..20].copy_from_slice(&self.exp.to_le_bytes());
        bytes[20..22].copy_from_slice(&self.ability_index.to_le_bytes());

        util::write_uint3_to_bits(self.ability_num, &mut bytes[22], 0);
        util::set_flag(&mut bytes, 22, 3, self.favorite);
        util::set_flag(&mut bytes, 22, 4, self.is_shadow);
        util::set_flag(&mut bytes, 22, 5, self.is_fateful_encounter);
        util::set_flag(&mut bytes, 22, 6, bool::from(self.trainer_gender));

        bytes[24] = self.game_of_origin as u8;
        bytes[25] = self.game_of_origin_battle.map_or(0, |g| g as u8);

        bytes[26..28].copy_from_slice(&self.markings.to_bytes());
        bytes[29] = self.ball as u8;
        bytes[32] = self.nature.to_byte();
        bytes[33] = self.mint_nature.unwrap_or(self.nature).to_byte();
        bytes[34] = self.gender.to_byte();

        bytes[36..38].copy_from_slice(&self.held_item_index.to_le_bytes());
        bytes[38..44].copy_from_slice(&self.evs.to_bytes());
        bytes[44..50].copy_from_slice(&self.contest.to_bytes());
        bytes[50] = self.pokerus_byte;
        bytes[52] = self.contest_memory_count;
        bytes[53] = self.battle_memory_count;
        bytes[54..76].copy_from_slice(&self.ribbons.to_bytes());
        bytes[76..80].copy_from_slice(&self.sociability.to_le_bytes());
        bytes[80] = self.height_scalar;
        bytes[81] = self.weight_scalar;
        bytes[82] = self.scale;

        bytes[84..86].copy_from_slice(&self.moves[0].to_le_bytes());
        bytes[86..88].copy_from_slice(&self.moves[1].to_le_bytes());
        bytes[88..90].copy_from_slice(&self.moves[2].to_le_bytes());
        bytes[90..92].copy_from_slice(&self.moves[3].to_le_bytes());

        bytes[92] = self.move_pp[0];
        bytes[93] = self.move_pp[1];
        bytes[94] = self.move_pp[2];
        bytes[95] = self.move_pp[3];

        bytes[96..122].copy_from_slice(&self.nickname);

        bytes[122..125].copy_from_slice(&PokeDate::to_bytes_optional(self.egg_date));
        bytes[125..128].copy_from_slice(&self.met_date.to_bytes());
        bytes[128] = self.met_level;
        bytes[129..131].copy_from_slice(&self.egg_location_index.unwrap_or(0).to_le_bytes());
        bytes[131..133].copy_from_slice(&self.met_location_index.to_le_bytes());

        bytes[134] = self.move_pp_ups[0];
        bytes[135] = self.move_pp_ups[1];
        bytes[136] = self.move_pp_ups[2];
        bytes[137] = self.move_pp_ups[3];

        bytes[138..140].copy_from_slice(&self.relearn_moves[0].to_le_bytes());
        bytes[140..142].copy_from_slice(&self.relearn_moves[1].to_le_bytes());
        bytes[142..144].copy_from_slice(&self.relearn_moves[2].to_le_bytes());
        bytes[144..146].copy_from_slice(&self.relearn_moves[3].to_le_bytes());

        self.ivs.write_30_bits(&mut bytes, 148);
        util::set_flag(&mut bytes, 148, 30, self.is_egg);
        util::set_flag(&mut bytes, 148, 31, self.is_nicknamed);

        bytes[153] = self.hyper_training.to_byte();

        // gap: 160..172

        bytes[172..180].copy_from_slice(&self.home_tracker);

        bytes[184..208].copy_from_slice(&self.handler_name);
        bytes[211] = self.handler_language;
        util::set_flag(&mut bytes, 212, 0, self.is_current_handler);
        // bytes[213] = self.resort_event_status;
        bytes[214..216].copy_from_slice(&self.handler_id.to_le_bytes());
        bytes[216] = self.handler_friendship;

        bytes[217] = self.handler_memory.intensity;
        bytes[218] = self.handler_memory.memory;
        bytes[219] = self.handler_memory.feeling;
        bytes[220..222].copy_from_slice(&self.handler_memory.text_variable.to_le_bytes());

        bytes[222] = self.handler_affection;
        // bytes[223..227].copy_from_slice(&self.super_training_flags.to_le_bytes());
        // bytes[227] = self.super_training_dist_flags;

        // bytes[229] = self.training_bag_hits;
        // bytes[230] = self.training_bag;
        // bytes[232] = self.poke_star_fame;
        bytes[233] = self.obedience_level;

        bytes[234] = (self.handler_gender as u8) << 7;
        // | ((self.is_ns_pokemon as u8) << 6)
        // | (self.shiny_leaves & 0x3f);
        bytes[235] = self.fullness;
        bytes[236] = self.enjoyment;

        // bytes[239] = self.country;
        // bytes[240] = self.region;
        bytes[240] = self.console_region;
        bytes[242] = self.language as u8;

        bytes[244..248].copy_from_slice(&self.form_argument.to_le_bytes());
        bytes[248] = ModernRibbon::to_affixed_byte(self.affixed_ribbon);
        // bytes[249..259].copy_from_slice(&self.geolocations.to_bytes());
        // bytes[270] = self.encounter_type;
        // bytes[271] = self.performance;
        bytes[272..298].copy_from_slice(&self.trainer_name);
        bytes[298] = self.trainer_friendship;

        bytes[299] = self.trainer_memory.intensity;
        bytes[300] = self.trainer_memory.memory;
        bytes[301..303].copy_from_slice(&self.trainer_memory.text_variable.to_le_bytes());
        bytes[303] = self.trainer_memory.feeling;

        bytes[304] = self.trainer_affection;

        Ok(bytes.to_vec())
    }

    fn is_empty(&self) -> bool {
        false
    }
}

#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct PastHandlerData {
    pub id: u16,
    pub friendship: u8,
    pub memory: TrainerMemory,
    pub affection: u8,
    pub gender: Gender,
    pub origin_game: OriginGame,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct GameboyData {
    pub dvs: StatsPreSplit,
    pub met_time_of_day: u8,
    pub evs_g12: StatsPreSplit,
}

impl GameboyData {
    pub fn from_v1(old: OhpkmV1) -> Option<Self> {
        if !old.game_of_origin.is_gameboy() && old.met_time_of_day == 0 && old.evs_g12.is_empty() {
            None
        } else {
            Some(Self {
                dvs: old.dvs,
                met_time_of_day: old.met_time_of_day,
                evs_g12: old.evs_g12,
            })
        }
    }
}

impl DataSection for GameboyData {
    type TagType = SectionTagV2;
    const TAG: Self::TagType = SectionTagV2::GameboyData;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes)?;

        // try_into() will always succeed thanks to the buffer size check
        Ok(Self {
            dvs: StatsPreSplit::from_dv_bytes(bytes[0..2].try_into().unwrap()),
            met_time_of_day: bytes[2],
            evs_g12: StatsPreSplit::from_bytes(bytes[3..13].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Result<Vec<u8>> {
        let mut bytes = [0u8; 13];

        bytes[0..2].copy_from_slice(&self.dvs.to_dv_bytes());
        bytes[2] = self.met_time_of_day;
        bytes[3..13].copy_from_slice(&self.evs_g12.to_bytes());

        Ok(bytes.to_vec())
    }

    fn is_empty(&self) -> bool {
        self.met_time_of_day == 0 && self.evs_g12.is_empty()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct Gen45Data {
    pub encounter_type: u8,
    pub performance: u8,
    pub shiny_leaves: ShinyLeaves,
    pub poke_star_fame: u8,
    pub is_ns_pokemon: bool,
}

impl Gen45Data {
    pub fn from_v1(old: OhpkmV1) -> Option<Self> {
        if !old.game_of_origin.is_ds()
            && old.encounter_type == 0
            && old.performance == 0
            && old.shiny_leaves.is_empty()
            && old.poke_star_fame == 0
            && !old.is_ns_pokemon
        {
            None
        } else {
            Some(Self {
                encounter_type: old.encounter_type,
                performance: old.performance,
                shiny_leaves: old.shiny_leaves,
                poke_star_fame: old.poke_star_fame,
                is_ns_pokemon: old.is_ns_pokemon,
            })
        }
    }
}

impl DataSection for Gen45Data {
    type TagType = SectionTagV2;
    const TAG: Self::TagType = SectionTagV2::Gen45Data;

    type ErrorType = Error;
    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes)?;

        Ok(Self {
            encounter_type: bytes[0],
            performance: bytes[1],
            shiny_leaves: ShinyLeaves::from_byte(bytes[2]),
            poke_star_fame: bytes[3],
            is_ns_pokemon: util::get_flag(bytes, 4, 0),
        })
    }

    fn to_bytes(&self) -> Result<Vec<u8>> {
        let mut bytes = [0u8; 33];

        bytes[0] = self.encounter_type;
        bytes[1] = self.performance;
        bytes[2] = self.shiny_leaves.to_byte();
        bytes[3] = self.poke_star_fame;
        util::set_flag(&mut bytes, 4, 0, self.is_ns_pokemon);

        Ok(bytes.to_vec())
    }

    fn is_empty(&self) -> bool {
        self.encounter_type == 0
            && self.performance == 0
            && self.shiny_leaves.is_empty()
            && self.poke_star_fame == 0
            && !self.is_ns_pokemon
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct Gen67Data {
    pub training_bag_hits: u8,
    pub training_bag: u8,
    pub super_training_flags: u32,
    pub super_training_dist_flags: u8,
    pub secret_super_training_unlocked: bool,
    pub secret_super_training_complete: bool,
    pub country: u8,
    pub region: u8,
    pub geolocations: Geolocations,
    pub resort_event_status: u8,
    pub avs: Stats16Le,
}

impl Gen67Data {
    pub fn from_v1(old: OhpkmV1) -> Option<Self> {
        if !old.game_of_origin.is_3ds()
            && !old.game_of_origin.is_lets_go()
            && old.training_bag == 0
            && old.training_bag_hits == 0
            && old.super_training_flags == 0
            && old.super_training_dist_flags == 0
            && !old.secret_super_training_unlocked
            && !old.secret_super_training_complete
            && old.country == 0
            && old.region == 0
            && bytes_are_empty(&old.geolocations.to_bytes())
            && old.resort_event_status == 0
            && bytes_are_empty(&old.avs.to_bytes())
        {
            None
        } else {
            Some(Self {
                training_bag_hits: old.training_bag_hits,
                training_bag: old.training_bag,
                super_training_flags: old.super_training_flags,
                super_training_dist_flags: old.super_training_dist_flags,
                secret_super_training_unlocked: old.secret_super_training_unlocked,
                secret_super_training_complete: old.secret_super_training_complete,
                country: old.country,
                region: old.region,
                geolocations: old.geolocations,
                resort_event_status: old.resort_event_status,
                avs: old.avs,
            })
        }
    }
}

impl DataSection for Gen67Data {
    type TagType = SectionTagV2;
    const TAG: Self::TagType = SectionTagV2::Gen67Data;

    type ErrorType = Error;
    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes)?;

        Ok(Self {
            training_bag_hits: bytes[0],
            training_bag: bytes[1],
            super_training_flags: u32::from_le_bytes(bytes[2..6].try_into().unwrap()),
            super_training_dist_flags: bytes[6],
            secret_super_training_unlocked: util::get_flag(bytes, 7, 0),
            secret_super_training_complete: util::get_flag(bytes, 7, 1),
            country: bytes[8],
            region: bytes[9],
            geolocations: Geolocations::from_bytes(bytes[10..20].try_into().unwrap()),
            resort_event_status: bytes[20],
            avs: Stats16Le::from_bytes(bytes[21..33].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Result<Vec<u8>> {
        let mut bytes = [0u8; 33];

        bytes[0] = self.training_bag_hits;
        bytes[1] = self.training_bag;
        bytes[2..6].copy_from_slice(&self.super_training_flags.to_le_bytes());
        bytes[6] = self.super_training_dist_flags;
        util::set_flag(&mut bytes, 7, 0, self.secret_super_training_unlocked);
        util::set_flag(&mut bytes, 7, 1, self.secret_super_training_complete);
        bytes[8] = self.country;
        bytes[9] = self.region;
        bytes[10..20].copy_from_slice(&self.geolocations.to_bytes());
        bytes[20] = self.resort_event_status;
        bytes[21..33].copy_from_slice(&self.avs.to_bytes());

        Ok(bytes.to_vec())
    }

    fn is_empty(&self) -> bool {
        self.training_bag == 0
            && self.training_bag_hits == 0
            && self.super_training_flags == 0
            && self.super_training_dist_flags == 0
            && !self.secret_super_training_unlocked
            && !self.secret_super_training_complete
            && self.country == 0
            && self.region == 0
            && bytes_are_empty(&self.geolocations.to_bytes())
            && self.resort_event_status == 0
            && bytes_are_empty(&self.avs.to_bytes())
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct SwordShieldData {
    pub can_gigantamax: bool,
    pub dynamax_level: u8,
    pub palma: u32,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tr_flags: [u8; 14],
}

impl SwordShieldData {
    pub fn from_v1(old: OhpkmV1) -> Option<Self> {
        if !old.game_of_origin.is_swsh()
            && !old.can_gigantamax
            && old.palma == 0
            && old.dynamax_level == 0
            && bytes_are_empty(&old.tr_flags_swsh)
        {
            None
        } else {
            Some(Self {
                can_gigantamax: old.can_gigantamax,
                palma: old.palma,
                dynamax_level: old.dynamax_level,
                tr_flags: old.tr_flags_swsh,
            })
        }
    }
}

impl DataSection for SwordShieldData {
    type TagType = SectionTagV2;
    const TAG: Self::TagType = SectionTagV2::SwordShield;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes)?;

        // try_into() will always succeed thanks to the buffer size check
        Ok(Self {
            can_gigantamax: util::get_flag(bytes, 0, 0),
            dynamax_level: bytes[1],
            palma: u32::from_le_bytes(bytes[2..6].try_into().unwrap()),
            tr_flags: bytes[6..20].try_into().unwrap(),
        })
    }

    fn to_bytes(&self) -> Result<Vec<u8>> {
        let mut bytes = [0u8; 20];

        util::set_flag(&mut bytes, 0, 0, self.can_gigantamax);
        bytes[1] = self.dynamax_level;
        bytes[2..6].copy_from_slice(&self.palma.to_le_bytes());
        bytes[6..20].copy_from_slice(&self.tr_flags);

        Ok(bytes.to_vec())
    }

    fn is_empty(&self) -> bool {
        !self.can_gigantamax
            && self.palma == 0
            && self.dynamax_level == 0
            && bytes_are_empty(&self.tr_flags)
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct BdspData {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tm_flags: FlagSet<14>,
}

impl BdspData {
    pub fn from_v1(old: OhpkmV1) -> Option<Self> {
        if !old.game_of_origin.is_bdsp() && bytes_are_empty(&old.tm_flags_bdsp) {
            None
        } else {
            Some(Self {
                tm_flags: FlagSet::from_bytes(old.tm_flags_bdsp),
            })
        }
    }
}

impl DataSection for BdspData {
    type TagType = SectionTagV2;
    const TAG: Self::TagType = SectionTagV2::BdspTmFlags;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes)?;

        // try_into() will always succeed thanks to the buffer size check
        Ok(Self {
            tm_flags: FlagSet::from_bytes(bytes[0..14].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Result<Vec<u8>> {
        let mut bytes = [0u8; 14];

        bytes.copy_from_slice(&self.tm_flags.to_bytes());

        Ok(bytes.to_vec())
    }

    fn is_empty(&self) -> bool {
        self.tm_flags.is_empty()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct LegendsArceusData {
    pub gvs: Stats8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub move_flags: FlagSet<14>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tutor_flags: FlagSet<8>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub master_flags: FlagSet<8>,
    pub is_alpha: bool,
    pub is_noble: bool,
    pub alpha_move: u16,
    pub flag2: bool,
    pub unknown_a0: u32,
    pub unknown_f3: u8,
}

impl LegendsArceusData {
    pub fn from_v1(old: OhpkmV1) -> Option<Self> {
        if old.game_of_origin != OriginGame::LegendsArceus
            && !old.is_alpha
            && !old.is_noble
            && bytes_are_empty(&old.move_flags_la)
            && bytes_are_empty(&old.tutor_flags_la)
            && bytes_are_empty(&old.master_flags_la)
        {
            None
        } else {
            Some(Self {
                gvs: old.gvs,
                alpha_move: old.alpha_move,
                move_flags: FlagSet::from_bytes(old.move_flags_la),
                tutor_flags: FlagSet::from_bytes(old.tutor_flags_la),
                master_flags: FlagSet::from_bytes(old.master_flags_la),
                is_alpha: old.is_alpha,
                is_noble: old.is_noble,
                flag2: old.flag2_la,
                unknown_f3: old.unknown_f3,
                unknown_a0: old.unknown_a0,
            })
        }
    }
}

impl DataSection for LegendsArceusData {
    type TagType = SectionTagV2;
    const TAG: Self::TagType = SectionTagV2::LegendsArceus;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes)?;

        // try_into() will always succeed thanks to the buffer size check
        Ok(Self {
            gvs: Stats8::from_bytes(bytes[0..6].try_into().unwrap()),
            alpha_move: u16::from_le_bytes(bytes[6..8].try_into().unwrap()),
            move_flags: FlagSet::from_bytes(bytes[8..22].try_into().unwrap()),
            tutor_flags: FlagSet::from_bytes(bytes[22..30].try_into().unwrap()),
            master_flags: FlagSet::from_bytes(bytes[30..38].try_into().unwrap()),
            is_alpha: util::get_flag(bytes, 38, 0),
            is_noble: util::get_flag(bytes, 38, 1),
            flag2: util::get_flag(bytes, 38, 2),
            unknown_f3: bytes[39],
            unknown_a0: u32::from_le_bytes(bytes[40..44].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Result<Vec<u8>> {
        let mut bytes = [0u8; 44];

        bytes[0..6].copy_from_slice(&self.gvs.to_bytes());
        bytes[6..8].copy_from_slice(&self.alpha_move.to_le_bytes());
        bytes[8..22].copy_from_slice(&self.move_flags.to_bytes());
        bytes[22..30].copy_from_slice(&self.tutor_flags.to_bytes());
        bytes[30..38].copy_from_slice(&self.master_flags.to_bytes());
        util::set_flag(&mut bytes, 38, 0, self.is_alpha);
        util::set_flag(&mut bytes, 38, 1, self.is_noble);
        util::set_flag(&mut bytes, 38, 2, self.flag2);
        bytes[39] = self.unknown_f3;
        bytes[40..44].copy_from_slice(&self.unknown_a0.to_le_bytes());

        Ok(bytes.to_vec())
    }

    fn is_empty(&self) -> bool {
        !self.is_alpha
            && !self.is_noble
            && self.move_flags.is_empty()
            && self.master_flags.is_empty()
            && self.tutor_flags.is_empty()
    }
}

#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct ScarletVioletData {
    pub tera_type_original: TeraType,
    pub tera_type_override: Option<TeraType>,
    pub tm_flags: FlagSet<22>,
    pub tm_flags_dlc: FlagSet<13>,
}

impl ScarletVioletData {
    pub fn from_v1(old: OhpkmV1) -> Option<Self> {
        let tera_type_original = TeraType::from_byte(old.tera_type_original)?;
        let tera_type_override = TeraType::from_byte(old.tera_type_override);

        if !old.game_of_origin.is_scarlet_violet()
            && tera_type_override.is_none()
            && bytes_are_empty(&old.tm_flags_sv)
            && bytes_are_empty(&old.tm_flags_sv_dlc)
        {
            None
        } else {
            Some(Self {
                tera_type_original,
                tera_type_override,
                tm_flags: FlagSet::from_bytes(old.tm_flags_sv),
                tm_flags_dlc: FlagSet::from_bytes(old.tm_flags_sv_dlc),
            })
        }
    }

    pub fn default_generated_tera_type(species_and_forme: SpeciesAndForme) -> Self {
        Self {
            tera_type_original: species_and_forme
                .get_forme_metadata()
                .transferred_tera_type(),
            ..Default::default()
        }
    }
}

impl DataSection for ScarletVioletData {
    type TagType = SectionTagV2;
    const TAG: Self::TagType = SectionTagV2::ScarletViolet;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes)?;

        // try_into() will always succeed thanks to the buffer size check
        let tera_type_original = TeraType::from_byte(bytes[0]).ok_or(Error::Other(format!(
            "Invalid original tera type index: {}",
            bytes[0]
        )))?;

        Ok(Self {
            tera_type_original,
            tera_type_override: TeraType::from_byte(bytes[1]),
            tm_flags: FlagSet::from_bytes(bytes[2..24].try_into().unwrap()),
            tm_flags_dlc: FlagSet::from_bytes(bytes[24..37].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Result<Vec<u8>> {
        let mut bytes = [0u8; 37];

        bytes[0] = self.tera_type_original.to_byte();
        bytes[1] = self.tera_type_override.map_or(0, TeraType::to_byte);
        bytes[2..24].copy_from_slice(&self.tm_flags.to_bytes());
        bytes[24..37].copy_from_slice(&self.tm_flags_dlc.to_bytes());

        Ok(bytes.to_vec())
    }

    fn is_empty(&self) -> bool {
        self.tera_type_override.is_none()
            && self.tm_flags.is_empty()
            && self.tm_flags_dlc.is_empty()
    }
}

#[derive(Debug, Default, Clone)]
pub struct PluginData {
    pub plugin_origin: String,
}

impl PluginData {
    pub fn from_v1(old: OhpkmV1) -> Option<Self> {
        if old.plugin_origin.is_empty() {
            None
        } else {
            Some(Self::from_origin(old.plugin_origin.to_string()))
        }
    }

    fn try_from_origin_utf8(origin_bytes: &[u8]) -> Result<Self> {
        String::from_utf8(origin_bytes.to_vec())
            .map(Self::from_origin)
            .map_err(Error::plugin_origin)
    }

    const fn from_origin(plugin_origin: String) -> Self {
        Self { plugin_origin }
    }
}

impl DataSection for PluginData {
    type TagType = SectionTagV2;
    const TAG: Self::TagType = SectionTagV2::PluginData;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes)?;

        Self::try_from_origin_utf8(bytes)
    }

    fn is_empty(&self) -> bool {
        false
    }

    fn to_bytes(&self) -> Result<Vec<u8>> {
        Ok(self.plugin_origin.clone().into_bytes())
    }
}

pub struct Notes(String);

impl DataSection for Notes {
    type TagType = SectionTagV2;
    const TAG: Self::TagType = SectionTagV2::Notes;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes)?;

        String::from_utf8(bytes.to_vec())
            .map(Notes)
            .map_err(|e| Error::StringDecode {
                source: StringErrorSource::Notes(e),
            })
    }

    fn to_bytes(&self) -> Result<Vec<u8>> {
        Ok(self.0.clone().into_bytes())
    }

    fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}
