use std::num::NonZeroU32;

use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::metadata_source::MetadataSource;
use pkm_rs_resources::metadata_source::ribbons::OpenHomeRibbonSet;
use pkm_rs_resources::ribbons::{CobblemonRibbon, CobblemonRibbonSet, OpenHomeRibbonSet};
use pkm_rs_types::{HyperTraining, Pokerus, Stat, Stats, Stats8, TeraType};

use super::OhpkmConvert;
use crate::convert_strategy::{ConvertStrategy, PidModificationStrategy, PkmConverter};
use crate::ohpkm::ExtraFormMetadata;
use crate::ohpkm::OhpkmV2;
use crate::ohpkm::id::OpenHomeId;
use crate::ohpkm::v2_sections::pkm_bytes::StoredPkmBytes;
use crate::ohpkm::v2_sections::{
    CobblemonData, LegendsArceusData, ScarletVioletData, SwordShieldData,
};
use crate::result::{Error, Result};
use crate::rom_hacks::cobblemon::PkCblmn;
use crate::rom_hacks::cobblemon::conversion::ball::ball_map::CobblemonBall;
use crate::util::personality_value;
use crate::{ohpkm, util};

impl OhpkmConvert for PkCblmn {
    fn to_main_data(&self) -> ohpkm::v2_sections::MainDataV2 {
        ohpkm::v2_sections::MainDataV2 {
            // TODO: fill all this out
            openhome_id,
            //openhome_id: OpenHomeId::new(
            //    self.species_and_form.into_inner().get_ndex(),
            //    trainer_id,
            //    secret_id,
            //    personality_value,
            //),
            species_and_form,
            held_item_index: self.held_item_index,
            personality_value,   // generate PID if necessary
            encryption_constant, // use generated PID as encryption constant?
            exp: self.exp,
            ability_index,
            ability_num: self.ability_num,
            markings: self.markings,
            nature: self.nature,
            mint_nature: if self.mint_nature != self.nature {
                Some(self.mint_nature)
            } else {
                None
            },
            gender: self.gender,
            evs: self.evs,
            pokerus: Pokerus::default(),
            ribbons,
            moves: self
                .moves
                .to_pp_adjusted(MetadataSource::Cobblemon, ohpkm::MOVE_METADATA_SOURCE),
            nickname: self.nickname,
            ivs: self.ivs,
            fullness: 0,    // TODO
            affixed_ribbon, // TODO
            trainer_name,   // TODO
            trainer_friendship: self.trainer_friendship,
            ball: Ball::from(self.ball),
            hyper_training, // TODO
            scale: 128,     // TODO
            ..Default::default()
        }
    }

    fn to_cobblemon_data(&self) -> Option<CobblemonData> {
        Some(CobblemonData {
            is_tradeable: self.is_tradeable,
            held_item_visible: self.held_item_visible,
            trainer_is_player: self.trainer_is_player,
            trainer_uuid: self.trainer_uuid,
            cobblemon_ball: self.ball,
            cobblemon_hyper_training: self.hyper_training,
            ride_boosts: self.ride_boosts.to_vec(),
        })
    }

    fn to_swsh_data(&self) -> Option<SwordShieldData> {
        Some(SwordShieldData {
            can_gigantamax: self.can_gigantamax?,
            dynamax_level: self.dynamax_level?,
            ..Default::default()
        })
    }

    fn to_sv_data(&self) -> Option<ScarletVioletData> {
        // TODO: handle tera type conversion
        Some(ScarletVioletData {
            tera_type_original,
            tera_type_override,
            ..Default::default()
        })
    }

    fn from_ohpkm(ohpkm: &OhpkmV2, strategy: ConvertStrategy) -> Result<Self> {
        let hyper_training;
        ohpkm
            .hyper_training()
            .into_iter()
            .filter(|&(stat, trained)| trained == true)
            .for_each(|(stat, trained)| hyper_training.set(stat, 31));

        let tera_override = ohpkm.tera_type_override();
        let tera_type = if tera_override != None {
            tera_override
        } else {
            Some(ohpkm.tera_type_original())
        };

        let cobblemon_ball: Option<CobblemonBall> = ohpkm.cobblemon_ball();
        let ball: CobblemonBall = if cobblemon_ball != None {
            cobblemon_ball.expect("CobblemonBall exists")
        } else {
            CobblemonBall::from(ohpkm.ball())
        };

        let mut mon = Self {
            species_and_form: ohpkm.species_and_form().try_into()?,
            ability_num: ohpkm.ability_num(),
            ability_index,     // TODO from Cobblemon species index/map
            held_item_index,   // TODO from Cobblemon item index/map
            held_item_visible, // TODO from Cobblemon data
            exp: ohpkm.exp(),
            nature: ohpkm.nature(),
            mint_nature: ohpkm.mint_nature(),
            gender: ohpkm.gender(),
            evs: ohpkm.evs(),
            pokerus: ohpkm.pokerus(),
            ride_boosts, // TODO from Cobblemon data
            ribbons: CobblemonRibbonSet::from_ribbons(ohpkm.ribbons()),
            affixed_ribbon: CobblemonRibbon::from_openhome_if_present(
                ohpkm.affixed_ribbon().copied(),
            ),
            markings: ohpkm.markings(),
            nickname: ohpkm.nickname(),
            moves: ohpkm
                .moves()
                .to_pp_adjusted(ohpkm::MOVE_METADATA_SOURCE, MetadataSource::ScarletViolet),
            benched_moves: Some(ohpkm.get_learned_moves()),
            ivs: ohpkm.ivs(),
            hyper_training,
            fullness: ohpkm.fullness(),
            dynamax_level: ohpkm.dynamax_level(),
            can_gigantamax: ohpkm.can_gigantamax(),
            tera_type,
            is_shiny: ohpkm.is_shiny(),
            trainer_is_player, // TODO from Cobblemon data
            trainer_uuid,      // TODO from Cobblemon data
            trainer_name: ohpkm.trainer_name(),
            trainer_friendship: ohpkm.trainer_friendship(),
            ball,
            is_tradeable: ohpkm.cobblemon_is_tradeable(),
            stat_level: 0,
            current_hp: 0,
            status_condition: 0,
            fainted_timer: 0,
            healing_timer: 0,
        };

        // TODO: calculate stats

        Ok(mon)
    }

    fn bytes_to_stored(bytes: &[u8]) -> Result<StoredPkmBytes> {
        bytes
            .try_into()
            .map_err(|_| {
                Error::buffer_size_with_source(
                    "PkCblmn::OhpkmConvert::bytes_to_stored",
                    expected, // TODO: replace with pkm data size
                    bytes.len(),
                )
            })
            .map(StoredPkmBytes::PkCblmn)
    }
}
