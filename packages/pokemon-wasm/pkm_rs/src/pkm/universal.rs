use rand::{SeedableRng, rngs::StdRng};

use crate::{
    pkm::PkmResult,
    resources::{
        AbilityIndex, Ball, FormeMetadata, FormeReference, GameOfOriginIndex, ModernRibbon,
        MoveSlot, NatDexIndex, NatureIndex, OpenHomeRibbon, PkmType, TeraType,
    },
    substructures::{
        ContestStats, Gender, HyperTraining, Markings, MarkingsSixShapesColors, PokeDate, Stats8,
        Stats16Le, StatsPreSplit, TrainerMemory,
    },
};

pub trait UniversalPkm {
    fn get_encryption_constant(&self) -> Option<u32> {
        None
    }

    fn get_national_dex(&self) -> NatDexIndex;
    fn get_held_item_index(&self) -> Option<u16> {
        None
    }

    fn get_trainer_id(&self) -> u16;
    fn get_secret_id(&self) -> Option<u16> {
        None
    }

    fn get_exp(&self) -> Option<u32> {
        None
    }

    fn get_ability_index(&self) -> Option<AbilityIndex> {
        None
    }

    fn get_ability_num(&self) -> Option<u8> {
        None
    }

    fn get_favorite(&self) -> Option<bool> {
        None
    }

    fn get_can_gigantimax(&self) -> Option<bool> {
        None
    }

    fn get_is_alpha(&self) -> Option<bool> {
        None
    }

    fn get_is_noble(&self) -> Option<bool> {
        None
    }

    fn is_shadow(&self) -> Option<bool> {
        None
    }

    fn get_markings(&self) -> Option<MarkingsSixShapesColors> {
        None
    }

    fn get_alpha_move(&self) -> Option<MoveSlot> {
        None
    }

    fn get_personality_value(&self) -> Option<u32> {
        None
    }

    fn get_nature(&self) -> Option<NatureIndex> {
        None
    }

    fn get_stat_nature(&self) -> Option<NatureIndex> {
        None
    }

    fn get_is_fateful_encounter(&self) -> bool {
        false
    }

    fn get_flag2_la(&self) -> Option<bool> {
        None
    }

    fn get_gender(&self) -> Option<Gender> {
        None
    }

    fn get_forme_num(&self) -> Option<u16> {
        None
    }

    fn get_evs(&self) -> Option<Stats8> {
        None
    }

    fn get_contest(&self) -> Option<ContestStats> {
        None
    }

    fn get_pokerus_byte(&self) -> Option<u8> {
        None
    }

    fn get_contest_memory_count(&self) -> Option<u8> {
        None
    }

    fn get_battle_memory_count(&self) -> Option<u8> {
        None
    }

    fn get_ribbons(&self) -> Vec<OpenHomeRibbon> {
        Vec::new()
    }

    fn get_sociability(&self) -> Option<u32> {
        None
    }

    fn get_height_scalar(&self) -> Option<u8> {
        None
    }

    fn get_weight_scalar(&self) -> Option<u8> {
        None
    }

    fn get_scale(&self) -> Option<u8> {
        None
    }

    fn get_moves(&self) -> [MoveSlot; 4];
    fn get_move_pp(&self) -> [u8; 4];
    fn get_move_pp_ups(&self) -> [u8; 4];
    fn get_nickname(&self) -> String;

    fn get_avs(&self) -> Option<Stats16Le> {
        None
    }

    fn get_relearn_moves(&self) -> Option<[MoveSlot; 4]> {
        None
    }

    fn get_ivs(&self) -> Option<Stats8> {
        None
    }

    fn get_is_egg(&self) -> bool {
        false
    }

    fn get_is_nicknamed(&self) -> Option<bool> {
        None
    }

    fn get_dynamax_level(&self) -> u8 {
        0
    }

    fn get_tera_type_original(&self) -> Option<TeraType> {
        None
    }

    fn get_tera_type_override(&self) -> Option<TeraType> {
        None
    }

    fn get_unknown_a0(&self) -> Option<u32> {
        None
    }

    fn get_gvs(&self) -> Option<Stats8> {
        None
    }

    fn get_dvs(&self) -> Option<StatsPreSplit> {
        None
    }

    fn get_handler_name(&self) -> Option<String> {
        None
    }

    fn get_handler_language(&self) -> Option<u8> {
        None
    }

    fn get_resort_event_status(&self) -> Option<u8> {
        None
    }

    fn get_handler_id(&self) -> Option<u32> {
        None
    }

    fn get_handler_friendship(&self) -> Option<u8> {
        None
    }

    fn get_handler_memory(&self) -> Option<TrainerMemory> {
        None
    }

    fn get_handler_affection(&self) -> Option<u8> {
        None
    }

    fn get_super_training_flags(&self) -> u32 {
        0
    }

    fn get_super_training_dist_flags(&self) -> u8 {
        0
    }

    fn get_secret_super_training_unlocked(&self) -> bool {
        false
    }

    fn get_secret_super_training_completed(&self) -> bool {
        false
    }

    fn get_training_bag_hits(&self) -> Option<u8> {
        None
    }

    fn get_training_bag(&self) -> Option<u8> {
        None
    }

    fn get_palma(&self) -> Option<u32> {
        None
    }

    fn get_poke_star_fame(&self) -> u8 {
        0
    }

    fn get_met_time_of_day(&self) -> Option<u8> {
        None
    }

    fn get_handler_gender(&self) -> Option<Gender> {
        None
    }

    fn get_is_ns_pokemon(&self) -> bool {
        false
    }

    fn get_shiny_leaves(&self) -> Option<u8> {
        None
    }

    fn get_fullness(&self) -> Option<u8> {
        None
    }

    fn get_enjoyment(&self) -> Option<u8> {
        None
    }

    fn get_game_of_origin(&self) -> Option<GameOfOriginIndex> {
        None
    }

    fn get_game_of_origin_battle(&self) -> Option<GameOfOriginIndex> {
        None
    }

    fn get_country(&self) -> Option<u8> {
        None
    }

    fn get_region(&self) -> Option<u8> {
        None
    }

    fn get_console_region(&self) -> Option<u8> {
        None
    }

    fn get_language_index(&self) -> Option<u8> {
        None
    }

    fn get_unknown_f3(&self) -> Option<u8> {
        None
    }

    fn get_form_argument(&self) -> Option<u32> {
        None
    }

    fn get_affiixed_ribbon(&self) -> Option<ModernRibbon> {
        None
    }

    fn get_encounter_type(&self) -> Option<u8> {
        None
    }

    fn get_performance(&self) -> Option<u8> {
        None
    }

    fn get_trainer_name(&self) -> String;

    fn get_trainer_friendship(&self) -> Option<u8> {
        None
    }

    fn get_trainer_memory(&self) -> Option<TrainerMemory> {
        None
    }

    fn get_trainer_affection(&self) -> Option<u8> {
        None
    }

    fn get_egg_date(&self) -> Option<PokeDate> {
        None
    }

    fn get_met_date(&self) -> Option<PokeDate> {
        None
    }

    fn get_ball(&self) -> Ball {
        Ball::Poke
    }

    fn get_egg_location_index(&self) -> Option<u16> {
        None
    }

    fn get_met_location_index(&self) -> Option<u16> {
        None
    }

    fn met_level(&self) -> Option<u8> {
        None
    }

    fn hyper_training(&self) -> Option<HyperTraining> {
        None
    }

    fn trainer_gender(&self) -> Gender;

    fn obedience_level(&self) -> Option<u8> {
        None
    }

    fn home_tracker(&self) -> Option<[u8; 8]> {
        None
    }

    fn tr_flags_swsh(&self) -> Option<[u8; 14]> {
        None
    }

    fn tm_flags_bdsp(&self) -> Option<[u8; 14]> {
        None
    }

    fn move_flags_la(&self) -> Option<[u8; 14]> {
        None
    }

    fn tutor_flags_la(&self) -> Option<[u8; 8]> {
        None
    }

    fn master_flags_la(&self) -> Option<[u8; 8]> {
        None
    }

    fn tm_flags_sv(&self) -> Option<[u8; 22]> {
        None
    }

    fn tm_flags_sv_dlc(&self) -> Option<[u8; 13]> {
        None
    }

    fn get_seeded_rng(&self) -> StdRng {
        match self.get_encryption_constant() {
            Some(encryption_constant) => seeded_rng_from_u32(encryption_constant),
            None => match self.get_personality_value() {
                Some(personality_value) => seeded_rng_from_u32(personality_value),
                None => seeded_rng_from_u16(self.get_trainer_id()),
            },
        }
    }

    fn get_forme_reference(&self) -> PkmResult<FormeReference> {
        FormeReference::new_ndex_verified(
            self.get_national_dex(),
            self.get_forme_num().unwrap_or(0),
        )
    }

    fn get_forme_metadata(&self) -> PkmResult<&FormeMetadata> {
        self.get_forme_reference().map(|r| r.get_forme_metadata())
    }
}

fn seeded_rng_from_u32(seed: u32) -> StdRng {
    let seed_u64: u64 = (seed as u64) | ((seed as u64) << 32);
    StdRng::seed_from_u64(seed_u64)
}

fn seeded_rng_from_u16(seed: u16) -> StdRng {
    let seed_u64: u64 =
        (seed as u64) | ((seed as u64) << 16) | ((seed as u64) << 32) | ((seed as u64) << 48);
    StdRng::seed_from_u64(seed_u64)
}

pub type AnyPkm = Box<dyn UniversalPkm>;
