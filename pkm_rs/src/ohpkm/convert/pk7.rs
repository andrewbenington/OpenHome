use pkm_rs_resources::ribbons::OpenHomeRibbonSet;
use pkm_rs_types::Stats16Le;

use crate::{gen7_alola::Pk7, ohpkm::OhpkmV2, traits::HasSpeciesAndForme};

use super::OhpkmConvert;
use crate::ohpkm;

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
        println!("stat level: {}", mon.stat_level);
        mon.stats = mon.calculate_stats();
        mon.current_hp = mon.stats.hp;

        mon.refresh_checksum();

        mon
    }
}
