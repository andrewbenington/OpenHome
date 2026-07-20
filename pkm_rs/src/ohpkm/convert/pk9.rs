use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::{metadata_source::MetadataSource, ribbons::OpenHomeRibbonSet};
use pkm_rs_types::FlagSet;
use pkm_rs_types::{AbilityNumber, Stats16Le};

use super::OhpkmConvert;
use crate::convert_strategy::ConvertStrategy;
use crate::convert_strategy::PkmConverter;
use crate::format::PkmFormat;
use crate::gen8_swsh;
use crate::gen9_sv::Pk9;
use crate::ohpkm;
use crate::ohpkm::OhpkmV2;
use crate::ohpkm::v2_sections::ScarletVioletData;
use crate::ohpkm::v2_sections::pkm_bytes::StoredPkmBytes;
use crate::result::{Error, Result};
use crate::traits::HasSpeciesAndForm;

impl OhpkmConvert for Pk9 {
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
                .expect("Pk9 max ability <= overall max ability"),
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
            pokerus_byte: Default::default(),
            contest_memory_count: self.contest_memory_count,
            battle_memory_count: self.battle_memory_count,
            sociability: Default::default(),
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
            fullness: Default::default(),
            enjoyment: Default::default(),
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
            favorite: Default::default(),
            is_shadow: Default::default(),
            scale: self.scale,
            handler_id: Default::default(),
            handler_affection: Default::default(),
            console_region: Default::default(),
            extra_form: Default::default(),
            trainer_affection: Default::default(),
            obedience_level: self.obedience_level,
            display_color_rgb: Default::default(),
            started_tracking_seconds: Default::default(),
            pid_bit_flipped_for_shiny: Default::default(),
        }
    }

    fn to_sv_data(&self) -> Option<ScarletVioletData> {
        Some(ScarletVioletData {
            tera_type_original: self.tera_type_original,
            tera_type_override: self.tera_type_override,
            tm_flags: self.tm_flags_base_game,
            tm_flags_dlc: self.tm_flags_dlc,
        })
    }

    fn from_ohpkm(ohpkm: &OhpkmV2, strategy: ConvertStrategy) -> Result<Self> {
        let form_metadata = ohpkm.get_forme_metadata();
        let converter = PkmConverter::new(PkmFormat::PK9, strategy);
        let met_data = converter.met_data(ohpkm);

        let ability_index = if let Some(current_ability) = ohpkm.ability_index().change_bound() {
            current_ability
        } else if let Some(ability_from_num) = form_metadata
            .get_ability(ohpkm.ability_num())
            .change_bound()
        {
            ability_from_num
        } else if let Some(first_ability) = form_metadata
            .get_ability(AbilityNumber::First)
            .change_bound()
        {
            first_ability
        } else {
            return Err(Error::AbilityIndex {
                ability_index: form_metadata.get_ability(AbilityNumber::First).to_u16(),
            });
        };

        let mut mon =
            Self {
                encryption_constant: ohpkm.encryption_constant(),
                sanity: 0,
                checksum: 0,
                species_and_form: ohpkm.species_and_form().try_into()?,
                held_item_index: ohpkm.held_item_index(),
                trainer_id: ohpkm.trainer_id(),
                secret_id: ohpkm.secret_id(),
                exp: ohpkm.exp(),
                ability_index,
                ability_num: ohpkm.ability_num(),
                markings: ohpkm.markings(),
                personality_value: ohpkm.personality_value(),
                nature: ohpkm.nature(),
                mint_nature: ohpkm.mint_nature(),
                is_fateful_encounter: ohpkm.is_fateful_encounter(),
                gender: ohpkm.gender(),
                evs: ohpkm.evs(),
                contest: ohpkm.contest(),
                ribbons: ohpkm.ribbons().get_modern().into_iter().collect(),
                height_scalar: ohpkm.height_scalar(),
                weight_scalar: ohpkm.weight_scalar(),
                scale: ohpkm.scale(),
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
                handler_name: ohpkm.handler_name(),
                handler_gender: ohpkm.handler_gender(),
                is_current_handler: ohpkm.is_current_handler(),
                handler_friendship: ohpkm.handler_friendship(),
                handler_memory: ohpkm.handler_memory(),
                handler_language: ohpkm.handler_language(),
                handler_id: ohpkm.handler_id(),
                trainer_name: ohpkm.trainer_name(),
                trainer_friendship: ohpkm.trainer_friendship(),
                trainer_memory: ohpkm.trainer_memory(),
                egg_date: ohpkm.egg_date(),
                met_date: ohpkm.met_date(),
                obedience_level: ohpkm.obedience_level(),
                egg_location_index: ohpkm.egg_location_index().unwrap_or(0),
                met_location_index: met_data.location_index,
                ball: if ohpkm.ball() <= Ball::Beast {
                    ohpkm.ball()
                } else {
                    Ball::Poke
                },
                met_level: ohpkm.met_level(),
                trainer_gender: ohpkm.trainer_gender(),
                tm_flags_base_game: ohpkm
                    .tm_flags_sv()
                    .map(|v| {
                        FlagSet::from_bytes(v.try_into().expect(
                        "Scarlet/Violet base game TM flags are the expected bytelength in OHPKM",
                    ))
                    })
                    .unwrap_or_default(),
                tm_flags_dlc: ohpkm
                    .tm_flags_sv_dlc()
                    .map(|v| {
                        FlagSet::from_bytes(v.try_into().expect(
                            "Scarlet/Violet DLC TM flags are the expected bytelength in OHPKM",
                        ))
                    })
                    .unwrap_or_default(),
                home_tracker: ohpkm.home_tracker(),
                hyper_training: ohpkm.hyper_training(),
                game_of_origin: met_data.origin,
                game_of_origin_battle: ohpkm.game_of_origin_battle(),
                language: ohpkm.language(),
                tera_type_original: ohpkm.tera_type_original(),
                tera_type_override: ohpkm.tera_type_override(),
                status_condition: 0,
                stat_level: 0,
                current_hp: 0,
                stats: Stats16Le::default(),
            };

        mon.stat_level = mon.calculate_level();
        mon.stats = mon.calculate_stats();
        mon.current_hp = mon.stats.hp;

        mon.refresh_checksum();

        Ok(mon)
    }

    fn bytes_to_stored(bytes: &[u8]) -> Result<StoredPkmBytes> {
        bytes
            .try_into()
            .map_err(|_| {
                Error::buffer_size_with_source(
                    "Pk9::OhpkmConvert::bytes_to_stored",
                    gen8_swsh::PKM_DATA_SIZE,
                    bytes.len(),
                )
            })
            .map(StoredPkmBytes::Pk9)
    }
}
