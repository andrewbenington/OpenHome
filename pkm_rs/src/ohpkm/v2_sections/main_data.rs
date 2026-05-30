use crate::ohpkm::extra_form::ExtraFormIndex;
use crate::ohpkm::issues::OhpkmIssue;
use crate::ohpkm::v2::OhpkmSectionTag;
use crate::result::{Error, Result};
use crate::sectioned_data::DataSection;
use crate::traits::IsShiny4096;
use crate::util;

use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::lookup;
use pkm_rs_resources::moves::{MoveDataOffsets, MoveIndex, MoveSlots, PpUpStorage};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::{ModernRibbon, OpenHomeRibbon, OpenHomeRibbonSet};
use pkm_rs_resources::species::{NatDexIndex, SpeciesAndForm};
use pkm_rs_types::Language;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{AbilityNumber, BinaryGender, ContestStats, Generation, Stats8};
use pkm_rs_types::{Gender, OriginGame, PokeDate, TrainerMemory};
use pkm_rs_types::{HyperTraining, MarkingsSixShapesColors};
#[cfg(feature = "randomize")]
use rand::RngExt;
use serde::Serialize;
use std::num::NonZeroU64;

#[cfg(feature = "randomize")]
use std::time::{Duration, SystemTime, UNIX_EPOCH};

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const MOVE_DATA_OFFSETS: MoveDataOffsets = MoveDataOffsets {
    moves: 84,
    pp: 92,
    pp_ups: 134,
};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny4096)]
pub struct MainDataV2 {
    pub personality_value: u32,
    pub encryption_constant: u32,
    pub species_and_form: SpeciesAndForm,
    pub held_item_index: u16,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub exp: u32,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ability_index: AbilityIndexBounded,
    pub ability_num: AbilityNumber,
    pub favorite: bool,
    pub is_shadow: bool,
    pub markings: MarkingsSixShapesColors,
    pub nature: NatureIndex,
    pub mint_nature: Option<NatureIndex>,
    pub is_fateful_encounter: bool,
    pub gender: Gender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
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
    pub moves: MoveSlots,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub nickname: SizedUtf16String<26>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub relearn_moves: [MoveIndex; 4],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ivs: Stats8,
    pub is_egg: bool,
    pub is_nicknamed: bool,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub handler_name: SizedUtf16String<26>,
    pub handler_language: Option<Language>,
    pub is_current_handler: bool,
    pub handler_id: u16,
    pub handler_friendship: u8,
    pub handler_memory: TrainerMemory,
    pub handler_affection: u8,
    pub handler_gender: BinaryGender,
    pub fullness: u8,
    pub enjoyment: u8,
    pub game_of_origin: OriginGame,
    pub game_of_origin_battle: Option<OriginGame>,
    pub console_region: u8,
    pub language: Language,
    pub form_argument: u32,
    pub affixed_ribbon: Option<ModernRibbon>,
    pub extra_form: Option<ExtraFormIndex>,
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
    pub trainer_gender: BinaryGender,
    pub obedience_level: u8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub home_tracker: [u8; 8],
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub display_color_rgb: Option<[u8; 3]>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub started_tracking_seconds: Option<NonZeroU64>,
    pub pid_bit_flipped_for_shiny: bool,
}

const NIDORAN_F: NatDexIndex = unsafe { NatDexIndex::new_unchecked(29) };
const NIDORAN_M: NatDexIndex = unsafe { NatDexIndex::new_unchecked(32) };

impl MainDataV2 {
    pub fn new(national_dex: u16, form_index: u16) -> Result<Self> {
        let species_and_form = SpeciesAndForm::new(national_dex, form_index)?;
        let national_dex = species_and_form.get_ndex();
        Ok(Self {
            species_and_form,
            language: Language::English,
            nickname: lookup::species_name(national_dex, Language::English).into(),
            ..Default::default()
        })
    }

    pub fn from_v1(old: crate::ohpkm::v1::OhpkmV1) -> Self {
        MainDataV2 {
            encryption_constant: old.encryption_constant,
            species_and_form: old.species_and_form,
            held_item_index: old.held_item_index,
            trainer_id: old.trainer_id,
            secret_id: old.secret_id,
            exp: old.exp,
            ability_index: old.ability_index.try_into().unwrap_or(
                AbilityIndexBounded::new(1).expect("1 is a valid ability index (Stench)"),
            ),
            ability_num: AbilityNumber::from_u8_first_three_bits(old.ability_num)
                .unwrap_or_default(),
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
            moves: MoveSlots::from_arrays(old.moves, old.move_pp, old.move_pp_ups),
            nickname: old.nickname,
            egg_date: old.egg_date,
            met_date: old.met_date,
            egg_location_index: none_if_zero_u16(old.egg_location_index),
            met_location_index: old.met_location_index,
            met_level: old.met_level,
            relearn_moves: old.relearn_moves,
            ivs: old.ivs,
            is_egg: old.is_egg,
            is_nicknamed: old.is_nicknamed,
            hyper_training: old.hyper_training,
            trainer_gender: bool::from(old.trainer_gender).into(),
            handler_name: old.handler_name,
            handler_language: Language::try_from(old.handler_language).ok(),
            is_current_handler: old.is_current_handler,
            handler_id: old.handler_id,
            handler_friendship: old.handler_friendship,
            handler_memory: old.handler_memory,
            handler_affection: old.handler_affection,
            handler_gender: old.handler_gender.into(),
            fullness: old.fullness,
            enjoyment: old.enjoyment,
            game_of_origin: old.game_of_origin,
            game_of_origin_battle: old.game_of_origin_battle,
            console_region: old.console_region,
            language: old.language,
            form_argument: old.form_argument,
            affixed_ribbon: old.affixed_ribbon,
            extra_form: None,
            trainer_name: old.trainer_name,
            trainer_friendship: old.trainer_friendship,
            trainer_memory: old.trainer_memory,
            trainer_affection: old.trainer_affection,
            obedience_level: old.obedience_level,
            home_tracker: old.home_tracker,
            display_color_rgb: None,
            started_tracking_seconds: old.file_timestamp_seconds,
            pid_bit_flipped_for_shiny: false,
        }
    }

    pub const fn national_dex(&self) -> NatDexIndex {
        self.species_and_form.get_ndex()
    }

    pub fn openhome_id(&self) -> String {
        let base_mon = self.species_and_form.get_base_evolution();
        format!(
            "{:04}-{:04x}{:04x}-{:08x}-{:02x}",
            base_mon.get_ndex().to_u16(),
            self.trainer_id,
            self.secret_id,
            self.personality_value,
            self.game_of_origin as u8
        )
    }

    pub const fn with_timestamp_if_missing(
        &mut self,
        started_tracking_seconds: Option<NonZeroU64>,
    ) -> &mut Self {
        if self.started_tracking_seconds.is_none() {
            self.started_tracking_seconds = started_tracking_seconds;
        }

        self
    }

    pub fn nickname_matches_species_ignore_case(&self) -> bool {
        self.nickname
            .to_string()
            .trim()
            .eq_ignore_ascii_case(lookup::species_name(self.national_dex(), self.language))
    }

    pub fn nickname_matches_species(&self) -> bool {
        self.nickname.to_string() == lookup::species_name(self.national_dex(), self.language)
    }

    pub fn reset_nickname_to_species(&mut self) {
        self.nickname = lookup::species_name(self.national_dex(), self.language).into();
        self.is_nicknamed = false;
    }

    fn ability_index_by_num(&self, ability_num: AbilityNumber) -> AbilityIndexBounded {
        let form_metadata = self.species_and_form.get_forme_metadata();
        form_metadata.get_ability(ability_num)
    }

    const fn ability_num_by_index(&self) -> Option<AbilityNumber> {
        let form_metadata = self.species_and_form.get_forme_metadata();
        if self.ability_index.to_u16() == form_metadata.abilities.0.to_u16() {
            Some(AbilityNumber::First)
        } else if self.ability_index.to_u16() == form_metadata.abilities.1.to_u16() {
            Some(AbilityNumber::Second)
        } else if let Some(hidden_ability) = form_metadata.hidden_ability
            && self.ability_index.to_u16() == hidden_ability.to_u16()
        {
            Some(AbilityNumber::Hidden)
        } else {
            None
        }
    }

    fn ability_num_matches_index(&self) -> bool {
        self.ability_index_by_num(self.ability_num) == self.ability_index
    }

    const fn ability_num_from_pid_gen34(&self) -> AbilityNumber {
        if self.personality_value % 2 == 1 {
            AbilityNumber::Second
        } else {
            AbilityNumber::First
        }
    }

    pub fn ability_changed_from(&self) -> Option<AbilityIndexBounded> {
        let form_metadata = self.species_and_form.get_forme_metadata();

        let origin_generation = self.game_of_origin.generation();
        if origin_generation == Generation::G3 {
            let gen34_ability_num = self.ability_num_from_pid_gen34();
            let gen3_ability_index: AbilityIndexBounded = form_metadata
                .ability_by_num_gen_3(gen34_ability_num)
                .try_into()
                .expect("gen 3 ability index always under ability index bound");
            if gen3_ability_index != self.ability_index {
                Some(gen3_ability_index)
            } else {
                None
            }
        } else if origin_generation == Generation::G4 {
            let gen34_ability_num = self.ability_num_from_pid_gen34();
            if gen34_ability_num != self.ability_num {
                Some(form_metadata.get_ability(gen34_ability_num))
            } else {
                None
            }
        } else {
            None
        }
    }

    pub fn ability_was_changed(&self) -> bool {
        self.ability_changed_from().is_some()
    }

    pub fn revert_ability_by_num(&mut self) {
        if let Some(original_ability_index) = self.ability_changed_from() {
            self.ability_index = original_ability_index;
        }
    }

    pub fn fix_errors(&mut self) -> Vec<OhpkmIssue> {
        let mut errors_found = Vec::<OhpkmIssue>::new();
        let form_metadata = self.species_and_form.get_forme_metadata();

        // Previous versions of OpenHome incorrectly translated the gender symbols for the Nidorans; here we will fix that
        if (self.national_dex() == NIDORAN_F && self.nickname.to_string().contains("\u{E08F}"))
            || (self.national_dex() == NIDORAN_M && self.nickname.to_string().contains("\u{E08E}"))
        {
            errors_found.push(OhpkmIssue::SpeciesNameCorrupted {
                corrupted: self.nickname.to_string(),
                expected: lookup::species_name(self.national_dex(), self.language).to_owned(),
            });
            self.reset_nickname_to_species();
        } else if self.nickname_matches_species_ignore_case() {
            // Fix Pokémon imported from an older game that had their nicknames kept as all caps
            if !self.nickname_matches_species() {
                self.reset_nickname_to_species();
                errors_found.push(OhpkmIssue::SpeciesNameAllCaps)
            }

            // Ensure the is_nicknamed flag is accurate. Ignore the situation where the nickname was manually set to the species
            if self.is_nicknamed {
                self.is_nicknamed = false;
                errors_found.push(OhpkmIssue::NicknameFlagIncorrect { expected: false })
            }
        } else if is_prevo_species_name(
            &self.species_and_form,
            &self.nickname.to_string(),
            self.language,
        ) {
            self.reset_nickname_to_species();
            self.is_nicknamed = false;
            errors_found.push(OhpkmIssue::HadPrevoSpeciesName)
        } else if !self.is_nicknamed && !self.nickname_matches_species() {
            // If the nickname doesn't match the species name, it should be considered nicknamed
            self.is_nicknamed = true;
            errors_found.push(OhpkmIssue::NicknameFlagIncorrect { expected: true })
        }

        // PLA mons cannot have been hatched
        if self.game_of_origin == OriginGame::LegendsArceus
            && (self.egg_date.is_some() || self.egg_location_index.is_some())
        {
            self.egg_date = None;
            self.egg_location_index = None;
            errors_found.push(OhpkmIssue::UnexpectedEggData)
        }

        // Affixed ribbon must be in the mon's possession
        if let Some(affixed_ribbon) = self.affixed_ribbon
            && !self.ribbons.includes(OpenHomeRibbon::Mod(affixed_ribbon))
        {
            self.affixed_ribbon = None;
            errors_found.push(OhpkmIssue::AffixedRibbonNotPresent)
        }

        // Fix ability bug from pre-1.5.0 (affected Mind's Eye and Dragon's Maw)
        // Fix ability bug from pre-1.7.1 (abilities not updated after evolution/capsule/patch)
        // Fix ability num bug from some point in the past (set to 0 instead of 1)
        if !self.ability_num_matches_index() {
            if let Some(fixed_ability_num) = self.ability_num_by_index() {
                errors_found.push(OhpkmIssue::AbilityNumIndexMismatch {
                    index: self.ability_index,
                    number: self.ability_num,
                });
                // This ability is a valid one for the species! Set the appropriate ability number
                self.ability_num = fixed_ability_num;
            } else {
                // Hm, this ability is invalid for the species. Let's reset it using the ability number
                self.ability_index = form_metadata.get_ability(self.ability_num)
            }
        }

        if !form_metadata.gender_ratio.gender_is_allowed(self.gender) {
            errors_found.push(OhpkmIssue::InvalidGender {
                gender: self.gender,
                ratio: form_metadata.gender_ratio,
            });
            self.gender = form_metadata.gender_from_pid(self.personality_value);
        }

        errors_found
    }
}

fn is_prevo_species_name(
    species_and_form: &SpeciesAndForm,
    name: &str,
    language: Language,
) -> bool {
    species_and_form
        .get_prevos()
        .iter()
        .any(|prevo| name.eq_ignore_ascii_case(lookup::species_name(prevo.get_ndex(), language)))
}

impl DataSection for MainDataV2 {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::MainData;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        // try_into() will always succeed if the buffer range size is correct.
        // if incorrect, it is a fatal coding flaw and will always panic.
        let data = Self {
            personality_value: u32::from_le_bytes(bytes[0..4].try_into().unwrap()),
            encryption_constant: u32::from_le_bytes(bytes[4..8].try_into().unwrap()),
            species_and_form: SpeciesAndForm::new(
                u16::from_le_bytes(bytes[8..10].try_into().unwrap()),
                u16::from_le_bytes(bytes[10..12].try_into().unwrap()),
            )?,
            trainer_id: u16::from_le_bytes(bytes[12..14].try_into().unwrap()),
            secret_id: u16::from_le_bytes(bytes[14..16].try_into().unwrap()),
            exp: u32::from_le_bytes(bytes[16..20].try_into().unwrap()),
            ability_index: AbilityIndexBounded::try_from(u16::from_le_bytes(
                bytes[20..22].try_into().unwrap(),
            ))?,
            ability_num: AbilityNumber::from_u8_first_three_bits(bytes[22])?,
            favorite: util::get_flag(bytes, 22, 3),
            is_shadow: util::get_flag(bytes, 22, 4),
            is_fateful_encounter: util::get_flag(bytes, 22, 5),
            trainer_gender: BinaryGender::from(util::get_flag(bytes, 22, 6)),
            pid_bit_flipped_for_shiny: util::get_flag(bytes, 22, 7),

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
            moves: MoveSlots::from_bytes(bytes, MOVE_DATA_OFFSETS, PpUpStorage::FourBytes),
            nickname: SizedUtf16String::<26>::from_bytes(bytes[96..122].try_into().unwrap()),
            egg_date: PokeDate::from_bytes_optional(bytes[122..125].try_into().unwrap()),
            met_date: PokeDate::from_bytes(bytes[125..128].try_into().unwrap()),
            met_level: bytes[128] & !0x80,
            egg_location_index: none_if_zero_u16(u16::from_le_bytes(
                bytes[129..131].try_into().unwrap(),
            )),
            met_location_index: u16::from_le_bytes(bytes[131..133].try_into().unwrap()),
            relearn_moves: [
                MoveIndex::from(u16::from_le_bytes(bytes[138..140].try_into().unwrap())),
                MoveIndex::from(u16::from_le_bytes(bytes[140..142].try_into().unwrap())),
                MoveIndex::from(u16::from_le_bytes(bytes[142..144].try_into().unwrap())),
                MoveIndex::from(u16::from_le_bytes(bytes[144..146].try_into().unwrap())),
            ],
            ivs: Stats8::from_30_bits(bytes[148..152].try_into().unwrap()),
            is_egg: util::get_flag(bytes, 148, 30),
            is_nicknamed: util::get_flag(bytes, 148, 31),
            // bytes[152],
            hyper_training: HyperTraining::from_byte(bytes[153]),
            display_color_rgb: if bytes[160] != 0 {
                Some(bytes[161..164].try_into().unwrap())
            } else {
                None
            },
            home_tracker: bytes[172..180].try_into().unwrap(),
            handler_name: SizedUtf16String::<26>::from_bytes(bytes[184..210].try_into().unwrap()),
            handler_language: bytes[211].try_into().ok(),
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
            started_tracking_seconds: NonZeroU64::new(u64::from_le_bytes(
                bytes[223..231].try_into().unwrap(),
            )),
            // poke_star_fame: bytes[232],
            obedience_level: bytes[233],
            // shiny_leaves: bytes[234] & 0x3f,
            handler_gender: util::get_flag(bytes, 234, 7).into(),
            // is_ns_pokemon: util::get_flag(bytes, 234, 6),
            fullness: bytes[235],
            enjoyment: bytes[236],
            // country: bytes[239],
            // region: bytes[240],
            console_region: bytes[240],
            language: Language::try_from(bytes[242])?,
            form_argument: u32::from_le_bytes(bytes[244..248].try_into().unwrap()),
            affixed_ribbon: ModernRibbon::from_affixed_byte(bytes[248]),
            // gap: 249-263

            // TODO: handle invalid values
            extra_form: u64::from_le_bytes(bytes[264..272].try_into().unwrap())
                .try_into()
                .ok(),
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

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 305];

        bytes[0..4].copy_from_slice(&self.personality_value.to_le_bytes());
        bytes[4..8].copy_from_slice(&self.encryption_constant.to_le_bytes());
        bytes[8..10].copy_from_slice(&self.species_and_form.get_ndex().to_le_bytes());
        bytes[10..12].copy_from_slice(&self.species_and_form.get_forme_index().to_le_bytes());
        bytes[12..14].copy_from_slice(&self.trainer_id.to_le_bytes());
        bytes[14..16].copy_from_slice(&self.secret_id.to_le_bytes());
        bytes[16..20].copy_from_slice(&self.exp.to_le_bytes());
        bytes[20..22].copy_from_slice(&self.ability_index.to_le_bytes());

        pkm_rs_types::write_uint3_to_bits(self.ability_num.to_byte(), &mut bytes[22], 0);
        util::set_flag(&mut bytes, 22, 3, self.favorite);
        util::set_flag(&mut bytes, 22, 4, self.is_shadow);
        util::set_flag(&mut bytes, 22, 5, self.is_fateful_encounter);
        util::set_flag(&mut bytes, 22, 6, bool::from(self.trainer_gender));
        util::set_flag(&mut bytes, 22, 7, self.pid_bit_flipped_for_shiny);

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

        // writes move indices, pp, and pp ups in one go to ensure consistency
        self.moves
            .write_spans(&mut bytes, MOVE_DATA_OFFSETS, PpUpStorage::FourBytes);

        bytes[96..122].copy_from_slice(&self.nickname);

        bytes[122..125].copy_from_slice(&PokeDate::to_bytes_optional(self.egg_date));
        bytes[125..128].copy_from_slice(&self.met_date.to_bytes());
        bytes[128] = self.met_level;
        bytes[129..131].copy_from_slice(&self.egg_location_index.unwrap_or(0).to_le_bytes());
        bytes[131..133].copy_from_slice(&self.met_location_index.to_le_bytes());

        // byte 133 is unused

        // bytes 134..=137 are used for move pp ups, written via self.moves.write_spans

        bytes[138..140].copy_from_slice(&self.relearn_moves[0].to_le_bytes());
        bytes[140..142].copy_from_slice(&self.relearn_moves[1].to_le_bytes());
        bytes[142..144].copy_from_slice(&self.relearn_moves[2].to_le_bytes());
        bytes[144..146].copy_from_slice(&self.relearn_moves[3].to_le_bytes());

        self.ivs.write_30_bits(&mut bytes, 148);
        util::set_flag(&mut bytes, 148, 30, self.is_egg);
        util::set_flag(&mut bytes, 148, 31, self.is_nicknamed);

        bytes[153] = self.hyper_training.to_byte();

        if let Some(rgb) = self.display_color_rgb {
            bytes[160] = 1;
            bytes[161..164].copy_from_slice(&rgb);
        }

        // gap: 160..172

        bytes[172..180].copy_from_slice(&self.home_tracker);

        bytes[184..210].copy_from_slice(&self.handler_name);
        bytes[211] = self.handler_language.map(|l| l as u8).unwrap_or_default();
        util::set_flag(&mut bytes, 212, 0, self.is_current_handler);
        // bytes[213] = self.resort_event_status;
        bytes[214..216].copy_from_slice(&self.handler_id.to_le_bytes());
        bytes[216] = self.handler_friendship;

        bytes[217] = self.handler_memory.intensity;
        bytes[218] = self.handler_memory.memory;
        bytes[219] = self.handler_memory.feeling;
        bytes[220..222].copy_from_slice(&self.handler_memory.text_variable.to_le_bytes());

        bytes[222] = self.handler_affection;
        if let Some(seconds) = self.started_tracking_seconds {
            bytes[223..231].copy_from_slice(&seconds.get().to_le_bytes());
        }
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
        // gap: 249-263
        bytes[264..272].copy_from_slice(&self.extra_form.map_or(0, |f| f as u64).to_le_bytes());
        bytes[272..298].copy_from_slice(&self.trainer_name);
        bytes[298] = self.trainer_friendship;

        bytes[299] = self.trainer_memory.intensity;
        bytes[300] = self.trainer_memory.memory;
        bytes[301..303].copy_from_slice(&self.trainer_memory.text_variable.to_le_bytes());
        bytes[303] = self.trainer_memory.feeling;

        bytes[304] = self.trainer_affection;

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        false
    }
}

#[cfg(feature = "randomize")]
fn current_time_unix_seconds() -> NonZeroU64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .ok()
        .as_ref()
        .map(Duration::as_secs)
        .and_then(NonZeroU64::new)
        .expect("current time is after the unix epoch")
}

#[cfg(feature = "randomize")]
impl Randomize for MainDataV2 {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        let species_and_form = SpeciesAndForm::randomized(rng);
        let ability_num = AbilityNumber::randomized(rng);
        let ability_index = species_and_form
            .get_forme_metadata()
            .get_ability(ability_num);
        Self {
            personality_value: u32::randomized(rng),
            encryption_constant: u32::randomized(rng),
            species_and_form,
            held_item_index: u16::randomized(rng),
            trainer_id: u16::randomized(rng),
            secret_id: u16::randomized(rng),
            exp: u32::randomized(rng),
            ability_index,
            ability_num,
            favorite: bool::randomized(rng),
            is_shadow: bool::randomized(rng),
            markings: MarkingsSixShapesColors::randomized(rng),
            nature: NatureIndex::randomized(rng),
            mint_nature: Option::<NatureIndex>::randomized(rng),
            is_fateful_encounter: bool::randomized(rng),
            gender: Gender::randomized(rng),
            evs: Stats8::randomized(rng),
            contest: ContestStats::randomized(rng),
            pokerus_byte: u8::randomized(rng),
            contest_memory_count: u8::randomized(rng),
            battle_memory_count: u8::randomized(rng),
            ribbons: OpenHomeRibbonSet::randomized(rng),
            sociability: u32::randomized(rng),
            height_scalar: u8::randomized(rng),
            weight_scalar: u8::randomized(rng),
            scale: u8::randomized(rng),
            moves: MoveSlots::randomized(rng),
            nickname: SizedUtf16String::randomized(rng),
            relearn_moves: [
                MoveIndex::randomized(rng),
                MoveIndex::randomized(rng),
                MoveIndex::randomized(rng),
                MoveIndex::randomized(rng),
            ],
            ivs: Stats8::randomized(rng),
            is_egg: bool::randomized(rng),
            is_nicknamed: bool::randomized(rng),
            handler_name: SizedUtf16String::randomized(rng),
            handler_language: Option::<Language>::randomized(rng),
            is_current_handler: bool::randomized(rng),
            handler_id: u16::randomized(rng),
            handler_friendship: u8::randomized(rng),
            handler_memory: TrainerMemory::randomized(rng),
            handler_affection: u8::randomized(rng),
            handler_gender: BinaryGender::randomized(rng),
            fullness: u8::randomized(rng),
            enjoyment: u8::randomized(rng),
            game_of_origin: OriginGame::randomized(rng),
            game_of_origin_battle: Option::<OriginGame>::randomized(rng),
            console_region: u8::randomized(rng),
            language: Language::randomized(rng),
            form_argument: u32::randomized(rng),
            affixed_ribbon: Option::<ModernRibbon>::randomized(rng),
            extra_form: {
                // randomize whether there should be an extra form or not with a 50/50 chance, and if there is, randomize it appropriately for the mon's species. If the species doesn't have any extra forms this will just be None.
                if bool::randomized(rng) {
                    ExtraFormIndex::randomized_for_national_dex(species_and_form.get_ndex(), rng)
                } else {
                    None
                }
            },
            trainer_name: SizedUtf16String::randomized(rng),
            trainer_friendship: u8::randomized(rng),
            trainer_memory: TrainerMemory::randomized(rng),
            trainer_affection: u8::randomized(rng),
            egg_date: Option::<PokeDate>::randomized(rng),
            met_date: PokeDate::randomized(rng),
            ball: Ball::randomized(rng),
            egg_location_index: Option::<u16>::randomized(rng),
            met_location_index: u16::randomized(rng),
            met_level: u8::randomized(rng),
            hyper_training: HyperTraining::randomized(rng),
            trainer_gender: BinaryGender::randomized(rng),
            obedience_level: u8::randomized(rng),
            home_tracker: rand::random(),
            display_color_rgb: Option::<[u8; 3]>::randomized(rng),
            started_tracking_seconds: match bool::randomized(rng) {
                false => None,
                true => NonZeroU64::new(rng.random_range(1..=current_time_unix_seconds().get())),
            },
            pid_bit_flipped_for_shiny: false,
        }
    }
}

const fn none_if_zero_u16(value: u16) -> Option<u16> {
    if value != 0 { Some(value) } else { None }
}
