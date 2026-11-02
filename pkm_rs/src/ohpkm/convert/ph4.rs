use pkm_rs_resources::moves::MoveSlots;
use pkm_rs_resources::ribbons::OpenHomeRibbonSet;

use crate::convert_strategy::ConvertStrategy;
use crate::home::{self, GameData, Ph4};
use crate::ohpkm::v2_sections::pkm_bytes::StoredPkmBytes;
use crate::ohpkm::v2_sections::{
    Gen67Data, LearnedMoves, LegendsArceusData, LegendsZaData, MainDataV2, ScarletVioletData,
    SwordShieldData,
};
use crate::ohpkm::{OhpkmConvert, OhpkmV2};
use crate::result::{Error, Result};

impl OhpkmConvert for Ph4 {
    fn to_main_data(&self) -> MainDataV2 {
        let mut data = MainDataV2 {
            personality_value: self.core_data.personality_value,
            encryption_constant: self.core_data.encryption_constant,
            species_and_form: self.core_data.species_and_form,
            held_item_index: self.core_data.held_item_index,
            trainer_id: self.core_data.trainer_id,
            secret_id: self.core_data.secret_id,
            exp: self.core_data.exp,
            favorite: self.core_data.is_favorite,
            markings: self.core_data.markings,
            nature: self.core_data.nature,
            mint_nature: Some(self.core_data.mint_nature),
            is_fateful_encounter: self.core_data.is_fateful_encounter,
            gender: self.core_data.gender,
            evs: self.core_data.evs,
            contest: self.core_data.contest,
            contest_memory_count: self.core_data.contest_memory_count,
            battle_memory_count: self.core_data.battle_memory_count,
            ribbons: OpenHomeRibbonSet::from_modern(self.core_data.ribbons),
            height_scalar: self.core_data.height_scalar,
            weight_scalar: self.core_data.weight_scalar,
            nickname: self.core_data.nickname,
            ivs: self.core_data.ivs,
            is_egg: self.core_data.is_egg,
            is_nicknamed: self.core_data.is_nicknamed,
            handler_name: self.core_data.handler_name,
            handler_language: self.core_data.handler_language,
            is_current_handler: self.core_data.is_current_handler,
            handler_id: self.core_data.handler_id,
            handler_friendship: self.core_data.handler_friendship,
            handler_memory: self.core_data.handler_memory,
            handler_gender: self.core_data.handler_gender,
            game_of_origin: self.core_data.game_of_origin,
            game_of_origin_battle: self.core_data.game_of_origin_battle,
            language: self.core_data.language,
            form_argument: self.core_data.form_argument,
            affixed_ribbon: self.core_data.affixed_ribbon,
            trainer_name: self.core_data.trainer_name,
            trainer_friendship: self.core_data.trainer_friendship,
            trainer_memory: self.core_data.trainer_memory,
            egg_date: self.core_data.egg_date,
            met_date: self.core_data.met_date,
            met_level: self.core_data.met_level,
            hyper_training: self.core_data.hyper_training,
            trainer_gender: self.core_data.trainer_gender,
            home_tracker: Some(self.core_data.home_tracker),
            ..Default::default()
        };

        match self.get_origin_game_data() {
            GameData::Pb7(game_data) => {
                let unwrap = game_data.unwrap_or_default();
                data.moves = unwrap.moves;
                data.relearn_moves = unwrap.relearn_moves;
                data.ball = unwrap.ball;
                data.pokerus = unwrap.pokerus;
                // TODO: ability index
                data.ability_num = unwrap.ability_num;
                data.fullness = unwrap.fullness;
                data.egg_location_index = Some(unwrap.egg_location_index);
                data.met_location_index = unwrap.met_location_index;
            }
            GameData::Pk8(game_data) => {
                let unwrap = game_data.unwrap_or_default();
                data.moves = unwrap.moves;
                data.relearn_moves = unwrap.relearn_moves;
                data.ball = unwrap.ball;
                data.pokerus = unwrap.pokerus;
                data.ability_index = unwrap
                    .ability_index
                    .change_bound()
                    .expect("PKH PK8 max ability <= overall max ability");
                data.ability_num = unwrap.ability_num;
                data.fullness = unwrap.fullness;
                data.egg_location_index = Some(unwrap.egg_location_index);
                data.met_location_index = unwrap.met_location_index;
            }
            GameData::Pa8(game_data) => {
                let unwrap = game_data.unwrap_or_default();
                data.moves = unwrap.moves;
                data.ball = unwrap.ball;
                data.pokerus = unwrap.pokerus;
                data.ability_index = unwrap
                    .ability_index
                    .change_bound()
                    .expect("PKH PA8 max ability <= overall max ability");
                data.ability_num = unwrap.ability_num;
                data.egg_location_index = Some(unwrap.egg_location_index);
                data.met_location_index = unwrap.met_location_index;
            }
            GameData::Pb8(game_data) => {
                let unwrap = game_data.unwrap_or_default();
                data.moves = unwrap.moves;
                data.relearn_moves = unwrap.relearn_moves;
                data.ball = unwrap.ball;
                data.pokerus = unwrap.pokerus;
                data.ability_index = unwrap
                    .ability_index
                    .change_bound()
                    .expect("PKH PB8 max ability <= overall max ability");
                data.ability_num = unwrap.ability_num;
                data.egg_location_index = Some(unwrap.egg_location_index);
                data.met_location_index = unwrap.met_location_index;
            }
            GameData::Pk9(game_data) => {
                let unwrap = game_data.unwrap_or_default();
                data.moves = unwrap.moves;
                data.relearn_moves = unwrap.relearn_moves;
                data.ball = unwrap.ball;
                data.obedience_level = unwrap.obedience_level;
                data.ability_index = unwrap
                    .ability_index
                    .change_bound()
                    .expect("PKH PK9 max ability <= overall max ability");
                data.ability_num = unwrap.ability_num;
                data.egg_location_index = Some(unwrap.egg_location_index);
                data.met_location_index = unwrap.met_location_index;
            }
            GameData::Pa9(game_data) => {
                let unwrap = game_data.unwrap_or_default();
                data.moves = MoveSlots::from_arrays(unwrap.moves, [0; 4], [0; 4]); // TODO: figure out a better way to set PP
                data.ball = unwrap.ball;
                data.obedience_level = unwrap.obedience_level;
                data.ability_index = unwrap
                    .ability_index
                    .change_bound()
                    .expect("PKH PA9 max ability <= overall max ability");
                data.ability_num = unwrap.ability_num;
                data.egg_location_index = Some(unwrap.egg_location_index);
                data.met_location_index = unwrap.met_location_index;
            }
        }

        data.enjoyment = self.pb7_data.unwrap_or_default().enjoyment;
        data.sociability = self.pk8_data.unwrap_or_default().sociability as u32;

        if self.pa8_data.is_some() {
            data.scale = self.pa8_data.unwrap_or_default().scale;
        } else if self.pk9_data.is_some() {
            data.scale = self.pk9_data.unwrap_or_default().scale;
        } else if self.pa9_data.is_some() {
            data.scale = self.pa9_data.unwrap_or_default().scale;
        }

        data
    }

    fn to_gen_67_data(&self) -> Option<Gen67Data> {
        Some(Gen67Data {
            resort_event_status: self.pb7_data?.resort_event_status,
            avs: self.pb7_data?.avs.into(),
            ..Default::default()
        })
    }

    fn to_swsh_data(&self) -> Option<SwordShieldData> {
        Some(SwordShieldData {
            can_gigantamax: self.pk8_data?.can_gigantamax,
            dynamax_level: self.pk8_data?.dynamax_level,
            palma: self.pk8_data?.palma,
            tr_flags: self.pk8_data?.tr_flags_swsh.to_bytes(),
        })
    }

    fn to_la_data(&self) -> Option<LegendsArceusData> {
        Some(LegendsArceusData {
            gvs: self.gvs()?,
            tutor_flags: self.pa8_data?.tutor_flags_la,
            master_flags: self.pa8_data?.master_flags_la,
            is_noble: self.pa8_data?.is_noble,
            alpha_move: self.pa8_data?.alpha_move?.to_raw()?,
            ..Default::default()
        })
    }

    fn to_sv_data(&self) -> Option<ScarletVioletData> {
        Some(ScarletVioletData {
            tera_type_original: self.pk9_data?.tera_type_original,
            tera_type_override: self.pk9_data?.tera_type_override,
            tm_flags: self.pk9_data?.tm_flags_base_game.resized(),
            tm_flags_dlc: self.pk9_data?.tm_flags_dlc,
        })
    }

    fn to_lza_data(&self) -> Option<LegendsZaData> {
        Some(LegendsZaData {
            plus_moves: self.pa9_data?.plus_flags_za(),
            ..Default::default()
        })
    }

    fn to_learned_moves(&self) -> Option<LearnedMoves> {
        let mut learned_moves = LearnedMoves::new();

        if let Some(data) = self.pb7_data {
            learned_moves.add_from_slots(data.moves.into_iter().map(|slot| slot.move_index));
        }

        if let Some(data) = self.pk8_data {
            learned_moves.add_from_slots(data.moves.into_iter().map(|slot| slot.move_index));
        }

        if let Some(data) = self.pa8_data {
            learned_moves.add_from_slots(data.moves.into_iter().map(|slot| slot.move_index));
        }

        if let Some(data) = self.pb8_data {
            learned_moves.add_from_slots(data.moves.into_iter().map(|slot| slot.move_index));
        }

        if let Some(data) = self.pk9_data {
            learned_moves.add_from_slots(data.moves.into_iter().map(|slot| slot.move_index));
        }

        if let Some(data) = self.pa9_data {
            learned_moves.add_from_slots(data.moves);
        }

        if learned_moves.count() > 0 {
            Some(learned_moves)
        } else {
            None
        }
    }

    fn from_ohpkm(_ohpkm: &OhpkmV2, _strategy: ConvertStrategy) -> Result<Self> {
        // Unused. Remove when this is no longer required.
        Err(Error::Other(
            "PKH should not be used to create OHPKM".to_owned(),
        ))
    }

    fn bytes_to_stored(bytes: &[u8]) -> Result<StoredPkmBytes> {
        Box::new(bytes.as_array().ok_or(Error::buffer_size_with_source(
            "Pkh::OhpkmConvert::bytes_to_stored",
            home::PH4_PKM_MAX_SIZE,
            bytes.len(),
        )))
        .copied()
        .map(Box::new)
        .map(StoredPkmBytes::Ph4)
    }
}
