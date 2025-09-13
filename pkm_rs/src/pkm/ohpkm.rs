use crate::pkm::traits::IsShiny4096;
use crate::pkm::{Pkm, Error, Result};
use crate::resources::{
    AbilityIndex, Ball, FormeMetadata, GameOfOriginIndex, ModernRibbon, MoveSlot, NatureIndex,
    OpenHomeRibbonSet, SpeciesAndForme, SpeciesMetadata,
};
use crate::strings::SizedUtf16String;
use crate::substructures::{
    ContestStats, Gender, HyperTraining, MarkingsSixShapesColors, PokeDate, Stats8, Stats16Le,
    StatsPreSplit, TrainerMemory,
};
use crate::util;
use serde::Serialize;

const MIN_SIZE: usize = 420;

#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny4096)]
pub struct Ohpkm {
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
    pub favorite: bool,
    pub can_gigantamax: bool,
    pub is_alpha: bool,
    pub is_noble: bool,
    pub is_shadow: bool,
    pub markings: MarkingsSixShapesColors,
    pub alpha_move: u16,
    pub personality_value: u32,
    pub nature: NatureIndex,
    pub stat_nature: NatureIndex,
    pub is_fateful_encounter: bool,
    pub flag2_la: bool,
    pub gender: Gender,
    pub evs: Stats8,
    pub contest: ContestStats,
    pub pokerus_byte: u8,
    pub contest_memory_count: u8,
    pub battle_memory_count: u8,
    pub ribbons: OpenHomeRibbonSet<16>,
    pub sociability: u32,
    pub height_scalar: u8,
    pub weight_scalar: u8,
    pub scale: u8,
    pub moves: [MoveSlot; 4],
    pub move_pp: [u8; 4],
    pub nickname: SizedUtf16String<26>,
    pub avs: Stats16Le,
    pub move_pp_ups: [u8; 4],
    pub relearn_moves: [MoveSlot; 4],
    pub ivs: Stats8,
    pub is_egg: bool,
    pub is_nicknamed: bool,
    pub dynamax_level: u8,
    pub tera_type_original: u8,
    pub tera_type_override: u8,
    pub unknown_a0: u32,
    pub gvs: Stats8,
    pub dvs: StatsPreSplit,
    pub handler_name: SizedUtf16String<24>,
    pub handler_language: u8,
    pub resort_event_status: u8,
    pub handler_id: u16,
    pub handler_friendship: u8,
    pub handler_memory: TrainerMemory,
    pub handler_affection: u8,
    pub super_training_flags: u32,
    pub super_training_dist_flags: u8,
    pub secret_super_training_unlocked: bool,
    pub secret_super_training_complete: bool,
    pub training_bag_hits: u8,
    pub training_bag: u8,
    pub palma: u32,
    pub poke_star_fame: u8,
    pub met_time_of_day: u8,
    pub handler_gender: bool,
    pub is_ns_pokemon: bool,
    pub shiny_leaves: u8,
    pub fullness: u8,
    pub enjoyment: u8,
    pub game_of_origin: GameOfOriginIndex,
    pub game_of_origin_battle: Option<GameOfOriginIndex>,
    pub country: u8,
    pub region: u8,
    pub console_region: u8,
    pub language_index: u8,
    pub unknown_f3: u8,
    pub form_argument: u32,
    pub affixed_ribbon: Option<ModernRibbon>,
    pub encounter_type: u8,
    pub performance: u8,
    pub trainer_name: SizedUtf16String<24>,
    pub trainer_friendship: u8,
    pub trainer_memory: TrainerMemory,
    pub trainer_affection: u8,
    pub egg_date: Option<PokeDate>,
    pub met_date: PokeDate,
    pub ball: Ball,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub met_level: u8,
    pub hyper_training: HyperTraining,
    pub trainer_gender: Gender,
    pub obedience_level: u8,
    pub home_tracker: [u8; 8],
    pub tr_flags_swsh: [u8; 14],
    pub tm_flags_bdsp: [u8; 14],
    pub move_flags_la: [u8; 14],
    pub tutor_flags_la: [u8; 8],
    pub master_flags_la: [u8; 8],
    pub tm_flags_sv: [u8; 22],
    pub tm_flags_sv_dlc: [u8; 13],
}

impl Pkm for Ohpkm {
    const BOX_SIZE: usize = 433;
    const PARTY_SIZE: usize = 433;

    fn box_size() -> usize {
        Self::BOX_SIZE
    }

    fn party_size() -> usize {
        Self::PARTY_SIZE
    }

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        if size < MIN_SIZE {
            return Err(Error::ByteLength {
                expected: MIN_SIZE,
                received: size,
            });
        }
        // try_into() will always succeed thanks to the length check
        let mon = Ohpkm {
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
            ability_index: AbilityIndex::try_from(u16::from_le_bytes(
                bytes[20..22].try_into().unwrap(),
            ))?,
            ability_num: util::read_uint3_from_bits(bytes[22], 0),
            favorite: util::get_flag(bytes, 22, 3),
            can_gigantamax: util::get_flag(bytes, 22, 4),
            is_alpha: util::get_flag(bytes, 22, 5),
            is_noble: util::get_flag(bytes, 22, 6),
            is_shadow: util::get_flag(bytes, 22, 7),
            markings: MarkingsSixShapesColors::from_bytes(bytes[24..26].try_into().unwrap()),
            alpha_move: u16::from_le_bytes(bytes[26..28].try_into().unwrap()),
            personality_value: u32::from_le_bytes(bytes[28..32].try_into().unwrap()),
            nature: NatureIndex::try_from(bytes[32])?,
            stat_nature: NatureIndex::try_from(bytes[33])?,
            is_fateful_encounter: util::get_flag(bytes, 34, 0),
            flag2_la: util::get_flag(bytes, 34, 1),
            gender: Gender::from_bits_2_3(bytes[34]),
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
            avs: Stats16Le::from_bytes(bytes[122..134].try_into().unwrap()),
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
            dynamax_level: bytes[152],
            tera_type_original: bytes[153],
            tera_type_override: bytes[154],
            unknown_a0: u32::from_le_bytes(bytes[160..164].try_into().unwrap()),
            gvs: Stats8::from_bytes(bytes[164..170].try_into().unwrap()),
            dvs: StatsPreSplit::from_dv_bytes(bytes[170..172].try_into().unwrap()),
            handler_name: SizedUtf16String::<24>::from_bytes(bytes[184..208].try_into().unwrap()),
            handler_language: bytes[211],
            resort_event_status: bytes[213],
            handler_id: u16::from_le_bytes(bytes[214..216].try_into().unwrap()),
            handler_friendship: bytes[216],
            handler_memory: TrainerMemory {
                intensity: bytes[217],
                memory: bytes[218],
                feeling: bytes[219],
                text_variable: u16::from_le_bytes(bytes[220..222].try_into().unwrap()),
            },
            handler_affection: bytes[222],
            super_training_flags: u32::from_le_bytes(bytes[223..227].try_into().unwrap()),
            super_training_dist_flags: bytes[227],
            secret_super_training_unlocked: util::get_flag(bytes, 228, 0),
            secret_super_training_complete: util::get_flag(bytes, 228, 1),
            training_bag_hits: bytes[229],
            training_bag: bytes[230],
            palma: u32::from_le_bytes(bytes[231..235].try_into().unwrap()),
            poke_star_fame: bytes[232],
            met_time_of_day: bytes[233],
            handler_gender: util::get_flag(bytes, 234, 7),
            is_ns_pokemon: util::get_flag(bytes, 234, 6),
            shiny_leaves: bytes[234],
            fullness: bytes[235],
            enjoyment: bytes[236],
            game_of_origin: GameOfOriginIndex::from(bytes[237]),
            game_of_origin_battle: match bytes[238] {
                0 => None,
                val => Some(GameOfOriginIndex::from(val)),
            },
            country: bytes[239],
            region: bytes[240],
            console_region: bytes[240],
            language_index: bytes[242],
            unknown_f3: bytes[243],
            form_argument: u32::from_le_bytes(bytes[244..248].try_into().unwrap()),
            affixed_ribbon: ModernRibbon::from_affixed_byte(bytes[248]),
            encounter_type: bytes[270],
            performance: bytes[271],
            trainer_name: SizedUtf16String::<24>::from_bytes(bytes[272..296].try_into().unwrap()),
            trainer_friendship: bytes[298],
            trainer_memory: TrainerMemory {
                intensity: bytes[299],
                memory: bytes[300],
                text_variable: u16::from_le_bytes(bytes[301..303].try_into().unwrap()),
                feeling: bytes[303],
            },
            trainer_affection: bytes[304],
            egg_date: PokeDate::from_bytes_optional(bytes[305..308].try_into().unwrap()),
            met_date: PokeDate::from_bytes(bytes[308..311].try_into().unwrap()),
            ball: Ball::from(bytes[311]),
            egg_location_index: u16::from_le_bytes(bytes[312..314].try_into().unwrap()),
            met_location_index: u16::from_le_bytes(bytes[314..316].try_into().unwrap()),
            met_level: bytes[316],
            hyper_training: HyperTraining::from_byte(bytes[317] & 0b111111),
            trainer_gender: Gender::from(util::get_flag(bytes, 317, 7)),
            obedience_level: bytes[318],
            home_tracker: bytes[319..327].try_into().unwrap(),
            tr_flags_swsh: bytes[326..340].try_into().unwrap(),
            tm_flags_bdsp: bytes[340..354].try_into().unwrap(),
            move_flags_la: bytes[354..368].try_into().unwrap(),
            tutor_flags_la: bytes[368..376].try_into().unwrap(),
            master_flags_la: bytes[376..384].try_into().unwrap(),
            tm_flags_sv: bytes[384..406].try_into().unwrap(),
            tm_flags_sv_dlc: if bytes.len() >= 433 {
                bytes[420..433].try_into().unwrap()
            } else {
                [0u8; 13]
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
        bytes[20..22].copy_from_slice(&self.ability_index.to_le_bytes());

        util::write_uint3_to_bits(self.ability_num, &mut bytes[22], 0);
        util::set_flag(bytes, 22, 3, self.favorite);
        util::set_flag(bytes, 22, 4, self.can_gigantamax);
        util::set_flag(bytes, 22, 5, self.is_alpha);
        util::set_flag(bytes, 22, 6, self.is_noble);
        util::set_flag(bytes, 22, 7, self.is_shadow);

        bytes[24..26].copy_from_slice(&self.markings.to_bytes());
        bytes[26..28].copy_from_slice(&self.alpha_move.to_le_bytes());
        bytes[28..32].copy_from_slice(&self.personality_value.to_le_bytes());
        bytes[32] = self.nature.to_byte();
        bytes[33] = self.stat_nature.to_byte();

        util::set_flag(bytes, 34, 0, self.is_fateful_encounter);
        util::set_flag(bytes, 34, 1, self.flag2_la);
        self.gender.set_bits_2_3(&mut bytes[34]);

        bytes[36..38].copy_from_slice(&self.species_and_forme.get_forme_index().to_le_bytes());
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
        bytes[122..134].copy_from_slice(&self.avs.to_bytes());

        bytes[134] = self.move_pp_ups[0];
        bytes[135] = self.move_pp_ups[1];
        bytes[136] = self.move_pp_ups[2];
        bytes[137] = self.move_pp_ups[3];

        bytes[138..140].copy_from_slice(&self.relearn_moves[0].to_le_bytes());
        bytes[140..142].copy_from_slice(&self.relearn_moves[1].to_le_bytes());
        bytes[142..144].copy_from_slice(&self.relearn_moves[2].to_le_bytes());
        bytes[144..146].copy_from_slice(&self.relearn_moves[3].to_le_bytes());

        self.ivs.write_30_bits(bytes, 148);
        util::set_flag(bytes, 148, 30, self.is_egg);
        util::set_flag(bytes, 148, 31, self.is_nicknamed);

        bytes[152] = self.dynamax_level;
        bytes[153] = self.tera_type_original;
        bytes[154] = self.tera_type_override;
        bytes[160..164].copy_from_slice(&self.unknown_a0.to_le_bytes());
        bytes[164..170].copy_from_slice(&self.gvs.to_bytes());
        bytes[170..172].copy_from_slice(&self.dvs.to_dv_bytes());

        // height_absolute and weight_absolute are now calculated on the fly, so thes bytes are skipped

        bytes[184..208].copy_from_slice(&self.handler_name);
        bytes[211] = self.handler_language;
        bytes[213] = self.resort_event_status;
        bytes[214..216].copy_from_slice(&self.handler_id.to_le_bytes());
        bytes[216] = self.handler_friendship;
        bytes[222] = self.handler_affection;
        bytes[223..227].copy_from_slice(&self.super_training_flags.to_le_bytes());
        bytes[227] = self.super_training_dist_flags;

        bytes[229] = self.training_bag_hits;
        bytes[230] = self.training_bag;
        bytes[231..235].copy_from_slice(&self.palma.to_le_bytes());
        bytes[232] = self.poke_star_fame;
        bytes[233] = self.met_time_of_day;

        bytes[234] = self.shiny_leaves;
        bytes[235] = self.fullness;
        bytes[236] = self.enjoyment;
        bytes[237] = self.game_of_origin.to_byte();
        bytes[238] = self
            .game_of_origin_battle
            .map_or(0, GameOfOriginIndex::to_byte);
        bytes[239] = self.country;
        bytes[240] = self.region;
        bytes[240] = self.console_region;
        bytes[242] = self.language_index;
        bytes[243] = self.unknown_f3;
        bytes[244..248].copy_from_slice(&self.form_argument.to_le_bytes());
        bytes[248] = ModernRibbon::to_affixed_byte(self.affixed_ribbon);
        bytes[270] = self.encounter_type;
        bytes[271] = self.performance;
        bytes[272..296].copy_from_slice(&self.trainer_name);
        bytes[298] = self.trainer_friendship;
        bytes[304] = self.trainer_affection;
        bytes[305..308].copy_from_slice(&PokeDate::to_bytes_optional(self.egg_date));
        bytes[308..311].copy_from_slice(&self.met_date.to_bytes());
        bytes[311] = self.ball as u8;
        bytes[312..314].copy_from_slice(&self.egg_location_index.to_le_bytes());
        bytes[314..316].copy_from_slice(&self.met_location_index.to_le_bytes());
        bytes[316] = self.met_level;
        bytes[317] = self.hyper_training.to_byte();
        util::set_flag(bytes, 317, 0, bool::from(self.trainer_gender));
        bytes[318] = self.obedience_level;
        bytes[319..327].copy_from_slice(&self.home_tracker);
        bytes[326..340].copy_from_slice(&self.tr_flags_swsh);
        bytes[340..354].copy_from_slice(&self.tm_flags_bdsp);
        bytes[354..368].copy_from_slice(&self.move_flags_la);
        bytes[368..376].copy_from_slice(&self.tutor_flags_la);
        bytes[376..384].copy_from_slice(&self.master_flags_la);
        bytes[384..406].copy_from_slice(&self.tm_flags_sv);
        bytes[420..433].copy_from_slice(&self.tm_flags_sv_dlc);
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
