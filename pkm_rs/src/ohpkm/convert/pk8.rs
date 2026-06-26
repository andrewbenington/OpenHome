use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::{metadata_source::MetadataSource, ribbons::OpenHomeRibbonSet};
use pkm_rs_types::FlagSet;
use pkm_rs_types::{AbilityNumber, Stats16Le};

use super::OhpkmConvert;
use crate::convert_strategy::ConvertStrategy;
use crate::convert_strategy::PkmConverter;
use crate::format::PkmFormat;
use crate::gen8_swsh;
use crate::gen8_swsh::Pk8;
use crate::ohpkm;
use crate::ohpkm::OhpkmV2;
use crate::ohpkm::v2_sections::pkm_bytes::StoredPkmBytes;
use crate::result::{Error, Result};
use crate::traits::HasSpeciesAndForm;

impl OhpkmConvert for Pk8 {
    fn to_main_data(&self) -> ohpkm::v2_sections::MainDataV2 {
        ohpkm::v2_sections::MainDataV2 {
            personality_value: self.personality_value,
            encryption_constant: self.encryption_constant,
            species_and_form: self.species_and_form.into_inner(),
            held_item_index: self.held_item_index,
            trainer_id: self.trainer_id,
            secret_id: self.secret_id,
            exp: self.exp,
            ability_index: self
                .ability_index
                .change_bound()
                .expect("Pk8 max ability <= overall max ability"),
            ability_num: self.ability_num,
            markings: self.markings,
            nature: self.nature,
            mint_nature: if self.mint_nature != self.nature {
                Some(self.mint_nature)
            } else {
                None
            },
            is_fateful_encounter: self.is_fateful_encounter,
            gender: self.gender,
            evs: self.evs,
            contest: self.contest,
            pokerus_byte: self.pokerus_byte,
            contest_memory_count: self.contest_memory_count,
            battle_memory_count: self.battle_memory_count,
            sociability: self.sociability,
            height_scalar: self.height_scalar,
            weight_scalar: self.weight_scalar,
            ribbons: OpenHomeRibbonSet::from_modern(self.ribbons),
            moves: self
                .moves
                .to_pp_adjusted(MetadataSource::SwordShield, ohpkm::MOVE_METADATA_SOURCE),
            nickname: self.nickname,
            relearn_moves: self.relearn_moves,
            ivs: self.ivs,
            is_egg: self.is_egg,
            is_nicknamed: self.is_nicknamed,
            handler_name: self.handler_name,
            is_current_handler: self.is_current_handler,
            handler_friendship: self.handler_friendship,
            handler_memory: self.handler_memory,
            handler_gender: self.handler_gender,
            handler_language: self.handler_language,
            fullness: self.fullness,
            enjoyment: self.enjoyment,
            game_of_origin: self.game_of_origin,
            game_of_origin_battle: self.game_of_origin_battle,
            language: self.language,
            form_argument: self.form_argument,
            affixed_ribbon: self.affixed_ribbon,
            trainer_name: self.trainer_name,
            trainer_friendship: self.trainer_friendship,
            trainer_memory: self.trainer_memory,
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
            home_tracker: self.home_tracker,
            ..Default::default()
        }
    }

    fn to_swsh_data(&self) -> Option<ohpkm::v2_sections::SwordShieldData> {
        Some(ohpkm::v2_sections::SwordShieldData {
            can_gigantamax: self.can_gigantamax,
            dynamax_level: self.dynamax_level,
            palma: self.palma,
            tr_flags: self.tr_flags_swsh.to_bytes(),
        })
    }

    fn from_ohpkm(ohpkm: &OhpkmV2, strategy: ConvertStrategy) -> Self {
        let form_metadata = ohpkm.get_forme_metadata();
        let converter = PkmConverter::new(PkmFormat::PK8, strategy);
        let met_data = converter.met_data(ohpkm);

        let mut mon = Self {
            encryption_constant: ohpkm.encryption_constant(),
            sanity: 0,
            checksum: 0,
            species_and_form: ohpkm
                .species_and_form()
                .try_into()
                .expect("pk8 mon/form should be valid"),
            held_item_index: ohpkm.held_item_index(),
            trainer_id: ohpkm.trainer_id(),
            secret_id: ohpkm.secret_id(),
            exp: ohpkm.exp(),
            ability_index: ohpkm.ability_index().change_bound().unwrap_or(
                form_metadata
                    .get_ability(ohpkm.ability_num())
                    .change_bound()
                    .unwrap_or(
                        form_metadata
                            .get_ability(AbilityNumber::First)
                            .change_bound()
                            .expect("Pk8 max ability <= overall max ability"),
                    ),
            ),
            ability_num: ohpkm.ability_num(),
            can_gigantamax: ohpkm.can_gigantamax().unwrap_or(false),
            markings: ohpkm.markings(),
            personality_value: ohpkm.personality_value(),
            nature: ohpkm.nature(),
            mint_nature: ohpkm.mint_nature(),
            is_fateful_encounter: ohpkm.is_fateful_encounter(),
            gender: ohpkm.gender(),
            evs: ohpkm.evs(),
            contest: ohpkm.contest(),
            pokerus_byte: ohpkm.pokerus_byte(),
            ribbons: ohpkm.ribbons().get_modern().into_iter().collect(),
            sociability: ohpkm.sociability(),
            height_scalar: ohpkm.height_scalar(),
            weight_scalar: ohpkm.weight_scalar(),
            contest_memory_count: ohpkm.contest_memory_count(),
            battle_memory_count: ohpkm.battle_memory_count(),
            form_argument: ohpkm.form_argument(),
            affixed_ribbon: ohpkm.affixed_ribbon(),
            nickname: ohpkm.nickname(),
            moves: ohpkm
                .moves()
                .to_pp_adjusted(ohpkm::MOVE_METADATA_SOURCE, MetadataSource::SwordShield),
            relearn_moves: ohpkm.relearn_moves(),
            ivs: converter.ivs(ohpkm),
            is_egg: ohpkm.is_egg(),
            is_nicknamed: ohpkm.is_nicknamed(),
            dynamax_level: ohpkm.dynamax_level().unwrap_or(0),
            handler_name: ohpkm.handler_name(),
            handler_gender: ohpkm.handler_gender(),
            is_current_handler: ohpkm.is_current_handler(),
            handler_friendship: ohpkm.handler_friendship(),
            handler_memory: ohpkm.handler_memory(),
            handler_language: ohpkm.handler_language(),
            fullness: ohpkm.fullness(),
            enjoyment: ohpkm.enjoyment(),
            trainer_name: ohpkm.trainer_name(),
            trainer_friendship: ohpkm.trainer_friendship(),
            trainer_memory: ohpkm.trainer_memory(),
            egg_date: ohpkm.egg_date(),
            met_date: ohpkm.met_date(),
            egg_location_index: ohpkm.egg_location_index().unwrap_or(0),
            met_location_index: met_data.location_index,
            ball: if ohpkm.ball() <= Ball::Beast {
                ohpkm.ball()
            } else {
                Ball::Poke
            },
            met_level: ohpkm.met_level(),
            trainer_gender: ohpkm.trainer_gender(),
            tr_flags_swsh: ohpkm
                .tr_flags_swsh()
                .map(|v| FlagSet::from_bytes(v.try_into().unwrap()))
                .unwrap_or_default(),
            home_tracker: ohpkm.home_tracker(),
            hyper_training: ohpkm.hyper_training(),
            game_of_origin: met_data.origin,
            game_of_origin_battle: ohpkm.game_of_origin_battle(),
            language: ohpkm.language(),
            palma: ohpkm.palma().unwrap_or_default(),
            status_condition: 0,
            stat_level: 0,
            current_hp: 0,
            stats: Stats16Le::default(),
            ..Default::default()
        };

        mon.stat_level = mon.calculate_level();
        mon.stats = mon.calculate_stats();
        mon.current_hp = mon.stats.hp;

        mon.refresh_checksum();

        mon
    }

    fn bytes_to_stored(bytes: &[u8]) -> Result<StoredPkmBytes> {
        bytes
            .try_into()
            .map_err(|_| {
                Error::buffer_size_with_source(
                    "Pk8::OhpkmConvert::bytes_to_stored",
                    gen8_swsh::PKM_DATA_SIZE,
                    bytes.len(),
                )
            })
            .map(StoredPkmBytes::Pk8)
    }
}
