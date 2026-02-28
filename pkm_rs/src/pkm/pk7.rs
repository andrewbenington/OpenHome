use crate::encryption::ChecksumU16Le;
use crate::pkm::ohpkm::{self, OhpkmConvert};
use crate::pkm::traits::{IsShiny4096, ModernEvs};
use crate::pkm::{Error, HasSpeciesAndForme, OhpkmV2, PkmBytes, Result};
use crate::{encryption, util};

use arbitrary_int::{u3, u7};
use pkm_rs_resources::abilities::AbilityIndex;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::helpers;
use pkm_rs_resources::language::Language;
use pkm_rs_resources::moves::{MoveDataOffsets, MoveIndex, MoveSlots};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::{ModernRibbon, ModernRibbonSet, OpenHomeRibbonSet};
use pkm_rs_resources::species::{FormeMetadata, SpeciesAndForme, SpeciesMetadata};
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{
    AbilityNumber, BinaryGender, ContestStats, HyperTraining, MarkingsSixShapesColors, OriginGame,
    Stats8, Stats16Le, read_u16_le, read_u32_le,
};
use pkm_rs_types::{Gender, Geolocations, PokeDate, TrainerMemory};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny4096)]
pub struct Pk7 {
    pub encryption_constant: u32,
    pub sanity: u16,
    pub checksum: u16,
    pub species_and_forme: SpeciesAndForme,
    pub held_item_index: u16,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub exp: u32,
    pub ability_index: AbilityIndex,
    pub ability_num: AbilityNumber,
    pub markings: MarkingsSixShapesColors,
    pub personality_value: u32,
    pub nature: NatureIndex,
    pub is_fateful_encounter: bool,
    pub gender: Gender,
    pub evs: Stats8,
    pub contest: ContestStats,
    pub resort_event_status: u8,
    pub pokerus_byte: u8,
    pub super_training_flags: u32,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ribbons: ModernRibbonSet<7, MAX_RIBBON_ALOLA>,
    pub contest_memory_count: u8,
    pub battle_memory_count: u8,
    pub super_training_dist_flags: u8,
    pub form_argument: u32,
    pub nickname: SizedUtf16String<26>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub moves: MoveSlots,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub relearn_moves: [MoveIndex; 4],
    pub secret_super_training_unlocked: bool,
    pub secret_super_training_complete: bool,
    pub ivs: Stats8,
    pub is_egg: bool,
    pub is_nicknamed: bool,
    pub handler_name: SizedUtf16String<26>,
    pub handler_gender: BinaryGender,
    pub is_current_handler: bool,
    pub geolocations: Geolocations,
    pub handler_friendship: u8,
    pub handler_affection: u8,
    pub handler_memory: TrainerMemory,
    pub fullness: u8,
    pub enjoyment: u8,
    pub trainer_name: SizedUtf16String<26>,
    pub trainer_friendship: u8,
    pub trainer_affection: u8,
    pub trainer_memory: TrainerMemory,
    pub egg_date: Option<PokeDate>,
    pub met_date: PokeDate,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub ball: Ball,
    pub met_level: u8,
    pub trainer_gender: BinaryGender,
    pub hyper_training: HyperTraining,
    pub game_of_origin: OriginGame,
    pub country: u8,
    pub region: u8,
    pub console_region: u8,
    pub language: Language,
    pub status_condition: u32,
    pub stat_level: u8,
    pub form_argument_remain: u8,
    pub form_argument_elapsed: u8,
    pub current_hp: u16,
    pub stats: Stats16Le,
}

const MAX_RIBBON_ALOLA: usize = ModernRibbon::BattleTreeMaster as usize;

const MOVE_DATA_OFFSETS: MoveDataOffsets = MoveDataOffsets {
    moves: 90,
    pp: 98,
    pp_ups: 102,
};

impl Pk7 {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        if size < Self::BOX_SIZE {
            return Err(Error::buffer_size(Pk7::BOX_SIZE, size));
        }
        // try_into() will always succeed thanks to the length check

        let mut mon = Pk7 {
            encryption_constant: read_u32_le!(bytes, 0),
            sanity: read_u16_le!(bytes, 4),
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
            ability_num: u3::extract_u8(bytes[21], 0).try_into()?,
            markings: MarkingsSixShapesColors::from_bytes(bytes[22..24].try_into().unwrap()),
            personality_value: read_u32_le!(bytes, 24),
            nature: NatureIndex::try_from(bytes[28])?,
            is_fateful_encounter: util::get_flag(bytes, 29, 0),
            gender: Gender::from_bits_1_2(bytes[29]),
            evs: Stats8::from_bytes(bytes[30..36].try_into().unwrap()),
            contest: ContestStats::from_bytes(bytes[36..42].try_into().unwrap()),
            resort_event_status: bytes[42],
            pokerus_byte: bytes[43],
            super_training_flags: read_u32_le!(bytes, 44),
            ribbons: ModernRibbonSet::from_bytes(bytes[48..55].try_into().unwrap()),
            contest_memory_count: bytes[56],
            battle_memory_count: bytes[57],
            super_training_dist_flags: bytes[58],
            form_argument: read_u32_le!(bytes, 60),
            nickname: SizedUtf16String::<26>::from_bytes(bytes[64..90].try_into().unwrap()),
            moves: MoveSlots::from_bytes(bytes, MOVE_DATA_OFFSETS),
            relearn_moves: [
                MoveIndex::from_le_bytes(bytes[106..108].try_into().unwrap()),
                MoveIndex::from_le_bytes(bytes[108..110].try_into().unwrap()),
                MoveIndex::from_le_bytes(bytes[110..112].try_into().unwrap()),
                MoveIndex::from_le_bytes(bytes[112..114].try_into().unwrap()),
            ],
            secret_super_training_unlocked: util::get_flag(bytes, 114, 0),
            secret_super_training_complete: util::get_flag(bytes, 114, 1),
            ivs: Stats8::from_30_bits(bytes[116..120].try_into().unwrap()),
            is_egg: util::get_flag(bytes, 116, 30),
            is_nicknamed: util::get_flag(bytes, 116, 31),
            handler_name: SizedUtf16String::<26>::from_bytes(bytes[120..146].try_into().unwrap()),
            handler_gender: util::get_flag(bytes, 146, 0).into(),
            is_current_handler: util::get_flag(bytes, 147, 0),
            geolocations: Geolocations::from_bytes(bytes[148..158].try_into().unwrap()),
            handler_friendship: bytes[162],
            handler_affection: bytes[163],
            handler_memory: TrainerMemory {
                intensity: bytes[164],
                memory: bytes[165],
                feeling: bytes[166],
                text_variable: read_u16_le!(bytes, 168),
            },
            fullness: bytes[174],
            enjoyment: bytes[175],
            trainer_name: SizedUtf16String::<26>::from_bytes(bytes[176..202].try_into().unwrap()),
            trainer_friendship: bytes[202],
            trainer_affection: bytes[203],
            trainer_memory: TrainerMemory {
                intensity: bytes[204],
                memory: bytes[205],
                text_variable: read_u16_le!(bytes, 206),
                feeling: bytes[208],
            },
            egg_date: PokeDate::from_bytes_optional(bytes[209..212].try_into().unwrap()),
            met_date: PokeDate::from_bytes(bytes[212..215].try_into().unwrap()),
            egg_location_index: read_u16_le!(bytes, 216),
            met_location_index: read_u16_le!(bytes, 218),
            ball: Ball::from(bytes[220]),
            met_level: u7::extract_u8(bytes[221], 0).into(),
            trainer_gender: util::get_flag(bytes, 221, 7).into(),
            hyper_training: HyperTraining::from_byte(bytes[222]),
            game_of_origin: OriginGame::from(bytes[223]),
            country: bytes[224],
            region: bytes[225],
            console_region: bytes[226],
            language: Language::try_from(bytes[227])?,
            ..Default::default()
        };

        if bytes.len() > Self::BOX_SIZE {
            mon.status_condition = read_u32_le!(bytes, 232);
            mon.stat_level = bytes[237];
            mon.form_argument_remain = bytes[238];
            mon.form_argument_elapsed = bytes[239];
            mon.current_hp = read_u16_le!(bytes, 240);
            mon.stats = Stats16Le::from_bytes(bytes[242..254].try_into().unwrap());
        }

        Ok(mon)
    }

    pub fn from_encryped_bytes(bytes: &[u8]) -> Result<Self> {
        let decrypted = encryption::decrypt_pkm_bytes_gen_6_7(bytes)?;
        let unshuffled = encryption::unshuffle_blocks_gen_6_7(&decrypted)?;
        Self::from_bytes(&unshuffled)
    }

    pub fn to_box_bytes_encrypted(self) -> Result<Vec<u8>> {
        let shuffled = encryption::shuffle_blocks_gen_6_7(&self.to_box_bytes())?;
        encryption::decrypt_pkm_bytes_gen_6_7(&shuffled)
    }

    pub fn calculate_stats(&self) -> Stats16Le {
        helpers::calculate_stats_modern(
            self.species_and_forme,
            &self.ivs,
            &self.evs,
            self.calculate_level(),
            self.nature.get_metadata(),
        )
    }

    pub const fn move_data_offsets() -> MoveDataOffsets {
        MoveDataOffsets {
            moves: 90,
            pp: 98,
            pp_ups: 102,
        }
    }
}

impl PkmBytes for Pk7 {
    const BOX_SIZE: usize = 232;
    const PARTY_SIZE: usize = 260;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::from_bytes(bytes)
    }

    fn write_box_bytes(&self, bytes: &mut [u8]) {
        bytes[0..4].copy_from_slice(&self.encryption_constant.to_le_bytes());
        bytes[4..6].copy_from_slice(&self.sanity.to_le_bytes());
        bytes[8..10].copy_from_slice(&self.species_and_forme.get_ndex().to_le_bytes());
        bytes[10..12].copy_from_slice(&self.held_item_index.to_le_bytes());
        bytes[12..14].copy_from_slice(&self.trainer_id.to_le_bytes());
        bytes[14..16].copy_from_slice(&self.secret_id.to_le_bytes());
        bytes[16..20].copy_from_slice(&self.exp.to_le_bytes());
        bytes[20] = u8::from(self.ability_index);
        bytes[21] |= self.ability_num.to_byte();
        bytes[22..24].copy_from_slice(&self.markings.to_bytes());
        bytes[24..28].copy_from_slice(&self.personality_value.to_le_bytes());
        bytes[28] = self.nature.to_byte();

        self.gender.set_bits_1_2(&mut bytes[29]);
        util::set_flag(bytes, 29, 0, self.is_fateful_encounter);
        util::write_uint5_to_bits(
            self.species_and_forme.get_forme_index() as u8,
            &mut bytes[29],
            3,
        );

        bytes[30..36].copy_from_slice(&self.evs.to_bytes());
        bytes[36..42].copy_from_slice(&self.contest.to_bytes());
        bytes[42] = self.resort_event_status;
        bytes[43] = self.pokerus_byte;
        bytes[44..48].copy_from_slice(&self.super_training_flags.to_le_bytes());
        bytes[48..55].copy_from_slice(&self.ribbons.to_bytes());

        // 55 unused

        bytes[56] = self.contest_memory_count;
        bytes[57] = self.battle_memory_count;
        bytes[58] = self.super_training_dist_flags;
        bytes[60..64].copy_from_slice(&self.form_argument.to_le_bytes());
        bytes[64..90].copy_from_slice(&self.nickname);

        self.moves.write_spans(bytes, MOVE_DATA_OFFSETS);

        bytes[106..108].copy_from_slice(&self.relearn_moves[0].to_le_bytes());
        bytes[108..110].copy_from_slice(&self.relearn_moves[1].to_le_bytes());
        bytes[110..112].copy_from_slice(&self.relearn_moves[2].to_le_bytes());
        bytes[112..114].copy_from_slice(&self.relearn_moves[3].to_le_bytes());

        util::set_flag(bytes, 114, 0, self.secret_super_training_unlocked);
        util::set_flag(bytes, 114, 1, self.secret_super_training_complete);

        self.ivs.write_30_bits(bytes, 116);
        util::set_flag(bytes, 116, 30, self.is_egg);
        util::set_flag(bytes, 116, 31, self.is_nicknamed);

        bytes[120..146].copy_from_slice(&self.handler_name);
        util::set_flag(bytes, 146, 0, self.handler_gender);
        util::set_flag(bytes, 147, 0, self.is_current_handler);
        bytes[148..158].copy_from_slice(&self.geolocations.to_bytes());

        // 157..161 unused

        bytes[162] = self.handler_friendship;
        bytes[163] = self.handler_affection;
        bytes[164] = self.handler_memory.intensity;
        bytes[165] = self.handler_memory.memory;
        bytes[166] = self.handler_memory.feeling;
        bytes[168..170].copy_from_slice(&self.handler_memory.text_variable.to_le_bytes());

        // 170..173 unused

        bytes[174] = self.fullness;
        bytes[175] = self.enjoyment;
        bytes[176..202].copy_from_slice(&self.trainer_name);
        bytes[202] = self.trainer_friendship;
        bytes[203] = self.trainer_affection;
        bytes[204] = self.trainer_memory.intensity;
        bytes[205] = self.trainer_memory.memory;
        bytes[206..208].copy_from_slice(&self.trainer_memory.text_variable.to_le_bytes());
        bytes[208] = self.trainer_memory.feeling;

        bytes[209..212].copy_from_slice(&PokeDate::to_bytes_optional(self.egg_date));
        bytes[212..215].copy_from_slice(&self.met_date.to_bytes());
        bytes[216..218].copy_from_slice(&self.egg_location_index.to_le_bytes());
        bytes[218..220].copy_from_slice(&self.met_location_index.to_le_bytes());

        bytes[220] = self.ball as u8;
        bytes[221] |= self.met_level & 0x7F;
        util::set_flag(bytes, 221, 7, self.trainer_gender);
        bytes[222] = self.hyper_training.to_byte();
        bytes[223] = self.game_of_origin as u8;
        bytes[224] = self.country;
        bytes[225] = self.region;
        bytes[226] = self.console_region;
        bytes[227] = self.language as u8;

        Pk7::calc_and_write_checksum(bytes);
    }

    fn write_party_bytes(&self, bytes: &mut [u8]) {
        self.write_box_bytes(bytes);
        bytes[232..236].copy_from_slice(&self.status_condition.to_le_bytes());
        bytes[237] = self.stat_level;
        bytes[238] = self.form_argument_remain;
        bytes[239] = self.form_argument_elapsed;
        bytes[240..242].copy_from_slice(&self.current_hp.to_le_bytes());
        bytes[242..254].copy_from_slice(&self.stats.to_bytes());
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

impl HasSpeciesAndForme for Pk7 {
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

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl Pk7 {
    #[wasm_bindgen(js_name = fromOhpkmBytes)]
    pub fn from_ohpkm_bytes(bytes: Vec<u8>) -> core::result::Result<Pk7, JsValue> {
        let ohpkm = OhpkmV2::from_bytes(&bytes).map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(Pk7::from_ohpkm(&ohpkm))
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Vec<u8>) -> core::result::Result<Pk7, JsValue> {
        Pk7::from_bytes(&bytes).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = toBytes)]
    pub fn get_bytes_wasm(&self) -> Vec<u8> {
        self.to_box_bytes()
    }

    #[wasm_bindgen(getter)]
    pub fn move_indices(&self) -> Vec<u16> {
        self.moves.indices()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_indices(&mut self, value: &[u16]) {
        self.moves.set_indices(value);
    }

    #[wasm_bindgen(getter)]
    pub fn move_pp(&self) -> Vec<u8> {
        self.moves.pp()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_pp(&mut self, value: &[u8]) {
        self.moves.set_pp(value);
    }

    #[wasm_bindgen(getter)]
    pub fn move_pp_ups(&self) -> Vec<u8> {
        self.moves.pp_ups()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_pp_ups(&mut self, value: &[u8]) {
        self.moves.set_pp_ups(value);
    }

    #[wasm_bindgen(getter)]
    pub fn relearn_move_indices(&self) -> Vec<u16> {
        self.relearn_moves.into_iter().map(u16::from).collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_relearn_move_indices(&mut self, value: Vec<u16>) {
        self.relearn_moves = [
            MoveIndex::from(value[0]),
            MoveIndex::from(value[1]),
            MoveIndex::from(value[2]),
            MoveIndex::from(value[3]),
        ]
    }

    #[wasm_bindgen(getter)]
    pub fn ribbons(&self) -> Vec<String> {
        self.ribbons
            .get_ribbons()
            .iter()
            .map(|ribbon| ribbon.to_string())
            .collect()
    }

    #[wasm_bindgen(getter)]
    pub fn ribbon_bytes(&self) -> Vec<u8> {
        self.ribbons.to_bytes().into_iter().collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_ribbon_indices(&mut self, indices: Vec<usize>) {
        self.ribbons
            .set_ribbons(indices.into_iter().filter_map(ModernRibbon::from_index));
    }

    #[wasm_bindgen]
    pub fn set_species_and_forme(
        &mut self,
        national_dex: u16,
        forme_index: u16,
    ) -> core::result::Result<(), JsValue> {
        match SpeciesAndForme::new(national_dex, forme_index) {
            Ok(species_and_forme) => {
                self.species_and_forme = species_and_forme;
                Ok(())
            }
            Err(e) => Err(JsValue::from_str(&e.to_string())),
        }
    }

    #[wasm_bindgen(getter = languageString)]
    pub fn language_string(&self) -> String {
        self.language.as_str().to_owned()
    }

    #[wasm_bindgen(js_name = toOhpkm)]
    pub fn to_ohpkm(&self) -> OhpkmV2 {
        OhpkmV2::from(self)
    }
}

impl ModernEvs for Pk7 {
    fn get_evs(&self) -> Stats8 {
        self.evs
    }
}

impl OhpkmConvert for Pk7 {
    fn to_main_data(&self) -> ohpkm::v2_sections::MainDataV2 {
        ohpkm::v2_sections::MainDataV2 {
            personality_value: self.personality_value,
            encryption_constant: self.encryption_constant,
            species_and_forme: self.species_and_forme,
            held_item_index: self.held_item_index,
            trainer_id: self.trainer_id,
            secret_id: self.secret_id,
            exp: self.exp,
            ability_index: self.ability_index,
            ability_num: self.ability_num,
            markings: self.markings,
            nature: self.nature,
            is_fateful_encounter: self.is_fateful_encounter,
            gender: self.gender,
            evs: self.evs,
            contest: self.contest,
            pokerus_byte: self.pokerus_byte,
            contest_memory_count: self.contest_memory_count,
            battle_memory_count: self.battle_memory_count,
            ribbons: OpenHomeRibbonSet::from_modern(self.ribbons),
            moves: self.moves,
            nickname: self.nickname,
            relearn_moves: self.relearn_moves,
            ivs: self.ivs,
            is_egg: self.is_egg,
            is_nicknamed: self.is_nicknamed,
            handler_name: self.handler_name,
            is_current_handler: self.is_current_handler,
            handler_friendship: self.handler_friendship,
            handler_memory: self.handler_memory,
            handler_affection: self.handler_affection,
            handler_gender: self.handler_gender,
            fullness: self.fullness,
            enjoyment: self.enjoyment,
            game_of_origin: self.game_of_origin,
            console_region: self.console_region,
            language: self.language,
            form_argument: self.form_argument,
            trainer_name: self.trainer_name,
            trainer_friendship: self.trainer_friendship,
            trainer_memory: self.trainer_memory,
            trainer_affection: self.trainer_affection,
            egg_date: self.egg_date,
            met_date: self.met_date,
            ball: self.ball,
            egg_location_index: if self.egg_location_index == 0 {
                None
            } else {
                Some(self.egg_location_index)
            },
            met_location_index: self.met_location_index,
            met_level: self.met_level,
            hyper_training: self.hyper_training,
            trainer_gender: self.trainer_gender,
            ..Default::default()
        }
    }

    fn to_gen_67_data(&self) -> Option<ohpkm::v2_sections::Gen67Data> {
        Some(ohpkm::v2_sections::Gen67Data {
            country: self.country,
            region: self.region,
            geolocations: self.geolocations,
            resort_event_status: self.resort_event_status,
            super_training_flags: self.super_training_flags,
            super_training_dist_flags: self.super_training_dist_flags,
            secret_super_training_unlocked: self.secret_super_training_unlocked,
            secret_super_training_complete: self.secret_super_training_complete,
            ..Default::default()
        })
    }

    fn from_ohpkm(ohpkm: &OhpkmV2) -> Self {
        let mut mon = Self {
            encryption_constant: ohpkm.encryption_constant(),
            sanity: 0,
            checksum: 0,
            species_and_forme: ohpkm.species_and_forme(),
            held_item_index: ohpkm.held_item_index(),
            trainer_id: ohpkm.trainer_id(),
            secret_id: ohpkm.secret_id(),
            exp: ohpkm.exp(),
            ability_index: ohpkm.ability_index(),
            ability_num: ohpkm.ability_num(),
            markings: ohpkm.markings(),
            personality_value: ohpkm.personality_value(),
            nature: ohpkm.nature(),
            is_fateful_encounter: ohpkm.is_fateful_encounter(),
            gender: ohpkm.gender(),
            evs: ohpkm.evs(),
            contest: ohpkm.contest(),
            resort_event_status: ohpkm.resort_event_status().unwrap_or_default(),
            pokerus_byte: ohpkm.pokerus_byte(),
            super_training_flags: ohpkm.super_training_flags().unwrap_or_default(),
            ribbons: ohpkm.ribbons().get_modern().into_iter().collect(),
            contest_memory_count: ohpkm.contest_memory_count(),
            battle_memory_count: ohpkm.battle_memory_count(),
            super_training_dist_flags: ohpkm.super_training_dist_flags().unwrap_or_default(),
            form_argument: ohpkm.form_argument(),
            nickname: ohpkm.nickname(),
            moves: ohpkm.moves(),
            relearn_moves: ohpkm.relearn_moves(),
            secret_super_training_unlocked: ohpkm
                .secret_super_training_unlocked()
                .unwrap_or_default(),
            secret_super_training_complete: ohpkm
                .secret_super_training_complete()
                .unwrap_or_default(),
            ivs: ohpkm.ivs(),
            is_egg: ohpkm.is_egg(),
            is_nicknamed: ohpkm.is_nicknamed(),
            handler_name: ohpkm.handler_name(),
            handler_gender: ohpkm.handler_gender(),
            is_current_handler: ohpkm.is_current_handler(),
            geolocations: ohpkm.geolocations().unwrap_or_default(),
            handler_friendship: ohpkm.handler_friendship(),
            handler_affection: ohpkm.handler_affection(),
            handler_memory: ohpkm.handler_memory(),
            fullness: ohpkm.fullness(),
            enjoyment: ohpkm.enjoyment(),
            trainer_name: ohpkm.trainer_name(),
            trainer_friendship: ohpkm.trainer_friendship(),
            trainer_affection: ohpkm.trainer_affection(),
            trainer_memory: ohpkm.trainer_memory(),
            egg_date: ohpkm.egg_date(),
            met_date: ohpkm.met_date(),
            egg_location_index: ohpkm.egg_location_index().unwrap_or(0),
            met_location_index: ohpkm.met_location_index(),
            ball: ohpkm.ball(),
            met_level: ohpkm.met_level(),
            trainer_gender: ohpkm.trainer_gender(),
            hyper_training: ohpkm.hyper_training(),
            game_of_origin: ohpkm.game_of_origin(),
            country: ohpkm.country().unwrap_or_default(),
            region: ohpkm.region().unwrap_or_default(),
            console_region: ohpkm.console_region(),
            language: ohpkm.language(),
            status_condition: 0,
            stat_level: 0,
            form_argument_remain: 0,
            form_argument_elapsed: 0,
            current_hp: 0,
            stats: Stats16Le::default(),
        };

        mon.stat_level = mon.calculate_level();
        mon.stats = mon.calculate_stats();
        mon.current_hp = mon.stats.hp;

        mon.checksum = Pk7::calc_checksum(&mon.to_box_bytes());

        mon
    }
}

impl ChecksumU16Le for Pk7 {
    const CHECKSUMMED_SPAN_START: usize = 8;

    const CHECKSUMMED_SPAN_END: usize = Pk7::BOX_SIZE;

    const CHECKSUM_OFFSET: usize = 6;
}
