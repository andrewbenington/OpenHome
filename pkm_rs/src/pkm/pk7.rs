use crate::pkm::traits::{IsShiny4096, ModernEvs};
use crate::pkm::{Ohpkm, Pkm, PkmError, PkmResult, helpers};
use crate::resources::{
    AbilityIndex, Ball, FormeMetadata, GameOfOriginIndex, ModernRibbon, ModernRibbonSet, MoveSlot,
    NatureIndex, OpenHomeRibbonSet, SpeciesAndForme, SpeciesMetadata,
};
use crate::strings::SizedUtf16String;
use crate::substructures::{
    ContestStats, Gender, Geolocations, HyperTraining, MarkingsSixShapesColors, PokeDate, Stats8,
    Stats16Le, StatsPreSplit, TrainerMemory,
};
use crate::util;
use serde::Serialize;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
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
    pub ability_num: u8,
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
    pub ribbons: ModernRibbonSet<6>,
    pub contest_memory_count: u8,
    pub battle_memory_count: u8,
    pub super_training_dist_flags: u8,
    pub form_argument: u32,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub nickname: SizedUtf16String<26>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub moves: [MoveSlot; 4],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub move_pp: [u8; 4],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub move_pp_ups: [u8; 4],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub relearn_moves: [MoveSlot; 4],
    pub secret_super_training_unlocked: bool,
    pub secret_super_training_complete: bool,
    pub ivs: Stats8,
    pub is_egg: bool,
    pub is_nicknamed: bool,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub handler_name: SizedUtf16String<24>,
    pub handler_gender: bool,
    pub is_current_handler: bool,
    pub geolocations: Geolocations,
    pub handler_friendship: u8,
    pub handler_affection: u8,
    pub handler_memory: TrainerMemory,
    pub fullness: u8,
    pub enjoyment: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub trainer_name: SizedUtf16String<24>,
    pub trainer_friendship: u8,
    pub trainer_affection: u8,
    pub trainer_memory: TrainerMemory,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub egg_date: Option<PokeDate>,
    pub met_date: PokeDate,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub ball: Ball,
    pub met_level: u8,
    pub hyper_training: HyperTraining,
    pub game_of_origin: GameOfOriginIndex,
    pub country: u8,
    pub region: u8,
    pub console_region: u8,
    pub language_index: u8,
    pub trainer_gender: Gender,
    pub status_condition: u32,
    pub stat_level: u8,
    pub form_argument_remain: u8,
    pub form_argument_elapsed: u8,
    pub current_hp: u16,
    pub stats: Stats16Le,
}

impl Pkm for Pk7 {
    const BOX_SIZE: usize = 232;
    const PARTY_SIZE: usize = 260;

    fn box_size() -> usize {
        Self::BOX_SIZE
    }

    fn party_size() -> usize {
        Self::PARTY_SIZE
    }

    fn from_bytes(bytes: &[u8]) -> PkmResult<Self> {
        let size = bytes.len();
        if size < Self::BOX_SIZE {
            return Err(PkmError::ByteLength {
                expected: Self::BOX_SIZE,
                received: size,
            });
        }
        // try_into() will always succeed thanks to the length check
        let mon = Pk7 {
            encryption_constant: u32::from_le_bytes(bytes[0..4].try_into().unwrap()),
            sanity: u16::from_le_bytes(bytes[4..6].try_into().unwrap()),
            checksum: u16::from_le_bytes(bytes[6..8].try_into().unwrap()),
            species_and_forme: SpeciesAndForme::new(
                u16::from_le_bytes(bytes[8..10].try_into().unwrap()),
                util::read_uint5_from_bits(bytes[29], 3).into(),
            )?,
            held_item_index: u16::from_le_bytes(bytes[10..12].try_into().unwrap()),
            trainer_id: u16::from_le_bytes(bytes[12..14].try_into().unwrap()),
            secret_id: u16::from_le_bytes(bytes[14..16].try_into().unwrap()),
            exp: u32::from_le_bytes(bytes[16..20].try_into().unwrap()),
            ability_index: AbilityIndex::try_from(bytes[20])?,
            ability_num: bytes[21],
            markings: MarkingsSixShapesColors::from_bytes(bytes[22..24].try_into().unwrap()),
            personality_value: u32::from_le_bytes(bytes[24..28].try_into().unwrap()),
            nature: NatureIndex::try_from(bytes[28])?,
            is_fateful_encounter: util::get_flag(bytes, 29, 0),
            gender: Gender::from_bits_1_2(bytes[29]),
            evs: Stats8::from_bytes(bytes[30..36].try_into().unwrap()),
            contest: ContestStats::from_bytes(bytes[36..42].try_into().unwrap()),
            resort_event_status: bytes[42],
            pokerus_byte: bytes[43],
            super_training_flags: u32::from_le_bytes(bytes[44..48].try_into().unwrap()),
            ribbons: ModernRibbonSet::from_bytes(bytes[48..54].try_into().unwrap()),
            contest_memory_count: bytes[56],
            battle_memory_count: bytes[57],
            super_training_dist_flags: bytes[58],
            form_argument: u32::from_le_bytes(bytes[60..64].try_into().unwrap()),
            nickname: SizedUtf16String::<26>::from_bytes(bytes[64..90].try_into().unwrap()),
            moves: [
                MoveSlot::from_le_bytes(bytes[90..92].try_into().unwrap()),
                MoveSlot::from_le_bytes(bytes[92..94].try_into().unwrap()),
                MoveSlot::from_le_bytes(bytes[94..96].try_into().unwrap()),
                MoveSlot::from_le_bytes(bytes[96..98].try_into().unwrap()),
            ],
            move_pp: [bytes[98], bytes[99], bytes[100], bytes[101]],
            move_pp_ups: [bytes[102], bytes[103], bytes[104], bytes[105]],
            relearn_moves: [
                MoveSlot::from_le_bytes(bytes[106..108].try_into().unwrap()),
                MoveSlot::from_le_bytes(bytes[108..110].try_into().unwrap()),
                MoveSlot::from_le_bytes(bytes[110..112].try_into().unwrap()),
                MoveSlot::from_le_bytes(bytes[112..114].try_into().unwrap()),
            ],
            secret_super_training_unlocked: util::get_flag(bytes, 114, 0),
            secret_super_training_complete: util::get_flag(bytes, 114, 1),
            ivs: Stats8::from_30_bits(bytes[116..120].try_into().unwrap()),
            is_egg: util::get_flag(bytes, 116, 30),
            is_nicknamed: util::get_flag(bytes, 116, 31),
            handler_name: SizedUtf16String::<24>::from_bytes(bytes[120..144].try_into().unwrap()),
            handler_gender: util::get_flag(bytes, 146, 0),
            is_current_handler: util::get_flag(bytes, 147, 0),
            geolocations: Geolocations::from_bytes(bytes[148..158].try_into().unwrap()),
            handler_friendship: bytes[162],
            handler_affection: bytes[163],
            handler_memory: TrainerMemory {
                intensity: bytes[164],
                memory: bytes[165],
                feeling: bytes[166],
                text_variable: u16::from_le_bytes(bytes[168..170].try_into().unwrap()),
            },
            fullness: bytes[174],
            enjoyment: bytes[175],
            trainer_name: SizedUtf16String::<24>::from_bytes(bytes[176..200].try_into().unwrap()),
            trainer_friendship: bytes[202],
            trainer_affection: bytes[203],
            trainer_memory: TrainerMemory {
                intensity: bytes[204],
                memory: bytes[205],
                text_variable: u16::from_le_bytes(bytes[206..208].try_into().unwrap()),
                feeling: bytes[208],
            },
            egg_date: PokeDate::from_bytes_optional(bytes[209..212].try_into().unwrap()),
            met_date: PokeDate::from_bytes(bytes[212..215].try_into().unwrap()),
            egg_location_index: u16::from_le_bytes(bytes[216..218].try_into().unwrap()),
            met_location_index: u16::from_le_bytes(bytes[218..220].try_into().unwrap()),
            ball: Ball::from(bytes[220]),
            met_level: bytes[221],
            hyper_training: HyperTraining::from_byte(bytes[222]),
            game_of_origin: GameOfOriginIndex::from(bytes[223]),
            country: bytes[224],
            region: bytes[225],
            console_region: bytes[226],
            language_index: bytes[227],
            trainer_gender: util::get_flag(bytes, 221, 7).into(),
            status_condition: if bytes.len() > Self::BOX_SIZE {
                u32::from_le_bytes(bytes[232..236].try_into().unwrap())
            } else {
                0
            },
            stat_level: if bytes.len() > Self::BOX_SIZE {
                bytes[237]
            } else {
                0
            },
            form_argument_remain: if bytes.len() > Self::BOX_SIZE {
                bytes[238]
            } else {
                0
            },
            form_argument_elapsed: if bytes.len() > Self::BOX_SIZE {
                bytes[239]
            } else {
                0
            },
            current_hp: if bytes.len() > Self::BOX_SIZE {
                u16::from_le_bytes(bytes[240..242].try_into().unwrap())
            } else {
                0
            },
            stats: if bytes.len() > Self::BOX_SIZE {
                Stats16Le::from_bytes(bytes[242..254].try_into().unwrap())
            } else {
                Stats16Le::default()
            },
        };
        Ok(mon)
    }

    fn write_box_bytes(&self, bytes: &mut [u8]) {
        bytes[0..4].copy_from_slice(&self.encryption_constant.to_le_bytes());
        bytes[4..6].copy_from_slice(&self.sanity.to_le_bytes());
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
        bytes[48..54].copy_from_slice(&self.ribbons.to_bytes());

        // 55 unused

        bytes[56] = self.contest_memory_count;
        bytes[57] = self.battle_memory_count;
        bytes[58] = self.super_training_dist_flags;
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

        util::set_flag(bytes, 114, 0, self.secret_super_training_unlocked);
        util::set_flag(bytes, 114, 1, self.secret_super_training_complete);

        self.ivs.write_30_bits(bytes, 116);
        util::set_flag(bytes, 116, 30, self.is_egg);
        util::set_flag(bytes, 116, 31, self.is_nicknamed);

        bytes[120..144].copy_from_slice(&self.handler_name);
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
        bytes[176..200].copy_from_slice(&self.trainer_name);
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
        bytes[221] = self.met_level;
        bytes[222] = self.hyper_training.to_byte();
        bytes[223] = self.game_of_origin.to_byte();
        bytes[224] = self.country;
        bytes[225] = self.region;
        bytes[226] = self.console_region;
        bytes[227] = self.language_index;
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

impl Pk7 {
    pub fn calculate_stats(&self) -> Stats16Le {
        helpers::calculate_stats_modern(
            self.species_and_forme,
            &self.ivs,
            &self.evs,
            self.calculate_level(),
            self.nature.get_metadata().expect("invalid nature index"),
        )
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl Pk7 {
    #[wasm_bindgen(js_name = fromOhpkmBytes)]
    pub fn from_ohpkm_bytes(bytes: Vec<u8>) -> Result<Pk7, JsValue> {
        let ohpkm = Ohpkm::from_bytes(&bytes).map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(Pk7::from(ohpkm))
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Vec<u8>) -> Result<Pk7, JsValue> {
        Pk7::from_bytes(&bytes).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = toBytes)]
    pub fn get_bytes_wasm(&self) -> Vec<u8> {
        self.to_box_bytes()
    }

    #[wasm_bindgen(getter)]
    pub fn nickname(&self) -> String {
        self.nickname.to_string()
    }

    #[wasm_bindgen(setter)]
    pub fn set_nickname(&mut self, value: String) {
        self.nickname = SizedUtf16String::<26>::from(value);
    }

    #[wasm_bindgen(getter)]
    pub fn trainer_name(&self) -> String {
        self.trainer_name.to_string()
    }

    #[wasm_bindgen(setter)]
    pub fn set_trainer_name(&mut self, value: String) {
        self.trainer_name = SizedUtf16String::<24>::from(value);
    }

    #[wasm_bindgen(getter)]
    pub fn handler_name(&self) -> String {
        self.handler_name.to_string()
    }

    #[wasm_bindgen(setter)]
    pub fn set_handler_name(&mut self, value: String) {
        self.handler_name = SizedUtf16String::<24>::from(value);
    }

    #[wasm_bindgen(getter)]
    pub fn move_indices(&self) -> Vec<u16> {
        self.moves.into_iter().map(u16::from).collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_indices(&mut self, value: Vec<u16>) {
        self.moves = [
            MoveSlot::from(value[0]),
            MoveSlot::from(value[1]),
            MoveSlot::from(value[2]),
            MoveSlot::from(value[3]),
        ]
    }

    #[wasm_bindgen(getter)]
    pub fn move_pp(&self) -> Vec<u8> {
        self.move_pp.into_iter().collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_pp(&mut self, value: Vec<u8>) {
        self.move_pp = [value[0], value[1], value[2], value[3]]
    }

    #[wasm_bindgen(getter)]
    pub fn move_pp_ups(&self) -> Vec<u8> {
        self.move_pp_ups.into_iter().collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_move_pp_ups(&mut self, value: Vec<u8>) {
        self.move_pp_ups = [value[0], value[1], value[2], value[3]]
    }

    #[wasm_bindgen(getter)]
    pub fn relearn_move_indices(&self) -> Vec<u16> {
        self.relearn_moves.into_iter().map(u16::from).collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_relearn_move_indices(&mut self, value: Vec<u16>) {
        self.relearn_moves = [
            MoveSlot::from(value[0]),
            MoveSlot::from(value[1]),
            MoveSlot::from(value[2]),
            MoveSlot::from(value[3]),
        ]
    }

    #[wasm_bindgen(setter)]
    pub fn set_egg_date(&mut self, value: Option<PokeDate>) {
        self.egg_date = value
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
            .set_ribbons(indices.into_iter().map(ModernRibbon::from).collect());
    }

    #[wasm_bindgen]
    pub fn set_species_and_forme(
        &mut self,
        national_dex: u16,
        forme_index: u16,
    ) -> Result<(), JsValue> {
        match SpeciesAndForme::new(national_dex, forme_index) {
            Ok(species_and_forme) => {
                self.species_and_forme = species_and_forme;
                Ok(())
            }
            Err(e) => Err(JsValue::from_str(&e.to_string())),
        }
    }
}

impl ModernEvs for Pk7 {
    fn get_evs(&self) -> crate::substructures::Stats8 {
        self.evs
    }
}

impl From<Pk7> for Ohpkm {
    fn from(other: Pk7) -> Ohpkm {
        Ohpkm {
            encryption_constant: other.encryption_constant,
            sanity: other.sanity,
            checksum: other.checksum,
            species_and_forme: other.species_and_forme,
            held_item_index: other.held_item_index,
            trainer_id: other.trainer_id,
            secret_id: other.secret_id,
            exp: other.exp,
            ability_index: other.ability_index,
            ability_num: other.ability_num,
            favorite: false,
            can_gigantamax: false,
            is_alpha: false,
            is_noble: false,
            is_shadow: false,
            markings: other.markings,
            alpha_move: 0,
            personality_value: other.personality_value,
            nature: other.nature,
            stat_nature: other.nature,
            is_fateful_encounter: other.is_fateful_encounter,
            flag2_la: false,
            gender: other.gender,
            evs: other.evs,
            contest: other.contest,
            pokerus_byte: other.pokerus_byte,
            contest_memory_count: other.contest_memory_count,
            battle_memory_count: other.battle_memory_count,
            ribbons: OpenHomeRibbonSet::from_modern(other.ribbons),
            sociability: 0,
            height_scalar: 0,
            weight_scalar: 0,
            scale: 0,
            moves: other.moves,
            move_pp: other.move_pp,
            nickname: other.nickname,
            avs: Stats16Le::default(),
            move_pp_ups: other.move_pp_ups,
            relearn_moves: other.relearn_moves,
            ivs: other.ivs,
            is_egg: other.is_egg,
            is_nicknamed: other.is_nicknamed,
            dynamax_level: 0,
            tera_type_original: 0,
            tera_type_override: 0,
            unknown_a0: 0,
            gvs: Stats8::default(),
            dvs: StatsPreSplit::default(),
            handler_name: other.handler_name,
            handler_language: 0,
            resort_event_status: other.resort_event_status,
            handler_id: 0,
            handler_friendship: other.handler_friendship,
            handler_memory: other.handler_memory,
            handler_affection: other.handler_affection,
            super_training_flags: other.super_training_flags,
            super_training_dist_flags: other.super_training_dist_flags,
            secret_super_training_unlocked: other.secret_super_training_unlocked,
            secret_super_training_complete: other.secret_super_training_complete,
            training_bag_hits: 0,
            training_bag: 0,
            palma: 0,
            poke_star_fame: 0,
            met_time_of_day: 0,
            handler_gender: other.handler_gender,
            is_ns_pokemon: false,
            shiny_leaves: 0,
            fullness: other.fullness,
            enjoyment: other.enjoyment,
            game_of_origin: other.game_of_origin,
            game_of_origin_battle: None,
            country: other.country,
            region: other.region,
            console_region: other.console_region,
            language_index: other.language_index,
            unknown_f3: 0,
            form_argument: other.form_argument,
            affixed_ribbon: None,
            encounter_type: 0,
            performance: 0,
            trainer_name: other.trainer_name,
            trainer_friendship: other.trainer_friendship,
            trainer_memory: other.trainer_memory,
            trainer_affection: other.trainer_affection,
            egg_date: other.egg_date,
            met_date: other.met_date,
            ball: other.ball,
            egg_location_index: other.egg_location_index,
            met_location_index: other.met_location_index,
            met_level: other.met_level,
            hyper_training: other.hyper_training,
            trainer_gender: other.trainer_gender,
            obedience_level: 0,
            home_tracker: [0; 8],
            tr_flags_swsh: [0; 14],
            tm_flags_bdsp: [0; 14],
            move_flags_la: [0; 14],
            tutor_flags_la: [0; 8],
            master_flags_la: [0; 8],
            tm_flags_sv: [0; 22],
            tm_flags_sv_dlc: [0; 13],
        }
    }
}

impl From<Ohpkm> for Pk7 {
    fn from(other: Ohpkm) -> Self {
        Self {
            encryption_constant: other.encryption_constant,
            sanity: other.sanity,
            checksum: other.checksum,
            species_and_forme: other.species_and_forme,
            held_item_index: other.held_item_index,
            trainer_id: other.trainer_id,
            secret_id: other.secret_id,
            exp: other.exp,
            ability_index: other.ability_index,
            ability_num: other.ability_num,
            markings: other.markings,
            personality_value: other.personality_value,
            nature: other.nature,
            is_fateful_encounter: other.is_fateful_encounter,
            gender: other.gender,
            evs: other.evs,
            contest: other.contest,
            resort_event_status: other.resort_event_status,
            pokerus_byte: other.pokerus_byte,
            super_training_flags: other.super_training_flags,
            ribbons: ModernRibbonSet::from_ribbons(
                other
                    .ribbons
                    .get_modern_not_past(ModernRibbon::BattleTreeMaster),
            ),
            contest_memory_count: other.contest_memory_count,
            battle_memory_count: other.battle_memory_count,
            super_training_dist_flags: other.super_training_dist_flags,
            form_argument: other.form_argument,
            nickname: other.nickname,
            moves: other.moves,
            move_pp: other.move_pp,
            move_pp_ups: other.move_pp_ups,
            relearn_moves: other.relearn_moves,
            secret_super_training_unlocked: other.secret_super_training_unlocked,
            secret_super_training_complete: other.secret_super_training_complete,
            ivs: other.ivs,
            is_egg: other.is_egg,
            is_nicknamed: other.is_nicknamed,
            handler_name: other.handler_name,
            handler_gender: other.handler_gender,
            is_current_handler: false,
            geolocations: Geolocations::default(),
            handler_friendship: other.handler_friendship,
            handler_affection: other.handler_affection,
            handler_memory: other.handler_memory,
            fullness: other.fullness,
            enjoyment: other.enjoyment,
            trainer_name: other.trainer_name,
            trainer_friendship: other.trainer_friendship,
            trainer_affection: other.trainer_affection,
            trainer_memory: other.trainer_memory,
            egg_date: other.egg_date,
            met_date: other.met_date,
            egg_location_index: other.egg_location_index,
            met_location_index: other.met_location_index,
            ball: other.ball.poke_if_newer_than(Ball::Beast),
            met_level: other.met_level,
            hyper_training: other.hyper_training,
            game_of_origin: other.game_of_origin,
            country: other.country,
            region: other.region,
            console_region: other.console_region,
            language_index: other.language_index,
            trainer_gender: other.trainer_gender,
            status_condition: 0,
            current_hp: 0,
            stat_level: 0,
            form_argument_remain: 0,
            form_argument_elapsed: 0,
            stats: helpers::calculate_stats_modern(
                other.species_and_forme,
                &other.ivs,
                &other.evs,
                other.calculate_level(),
                other.nature.get_metadata().expect("invalid nature value"),
            ),
        }
    }
}

// impl From<AnyPkm> for Pk7 {
//     fn from(other: AnyPkm) -> Self {
//         let rand = other.get_seeded_rng();
//         let Ok(forme_metadata) = other.get_forme_metadata() else {
//             panic!("Cannot convert to Pk7: invalid forme number");
//         };

//         Pk7 {
//             encryption_constant: other
//                 .get_encryption_constant()
//                 .unwrap_or(other.get_personality_value().unwrap_or(rand.next_u32())),
//             sanity: 0,
//             checksum: 0,
//             national_dex: other.get_national_dex(),
//             held_item_index: other.get_held_item_index().unwrap_or_default(),
//             trainer_id: other.get_trainer_id(),
//             secret_id: other.get_secret_id().unwrap_or_default(),
//             exp: other.get_exp().unwrap_or_default(),
//             ability_num: other.get_ability_num().unwrap_or_default(),
//             ability_index: forme_metadata.get_ability(other.get_ability_num().unwrap_or_default()),
//             markings: other.get_markings().unwrap_or_default(),
//         }
//     }
// }
