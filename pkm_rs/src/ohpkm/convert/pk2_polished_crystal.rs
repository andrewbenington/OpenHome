

use crate::rom_hacks::polished_crystal::{BOX_SIZE, PARTY_SIZE};
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::{metadata_source::MetadataSource, ribbons::OpenHomeRibbonSet};
use pkm_rs_resources::ribbons::Gen3Ribbon::Country;
use pkm_rs_types::{AbilityNumber, Geolocations, Stats16Le};

use crate::convert_strategy::ConvertStrategy;
use crate::convert_strategy::PkmConverter;
use crate::format::PkmFormat;
use crate::ohpkm::v2_sections::pkm_bytes::StoredPkmBytes;
use crate::result::{Error, Result};
use crate::{
  ohpkm::OhpkmV2,
  traits::HasSpeciesAndForm,
};

use super::OhpkmConvert;
use crate::ohpkm;
use crate::rom_hacks::polished_crystal::PK2PolishedCrystal;
use crate::traits::{IsShiny, Pkm};

impl Pkm for PK2PolishedCrystal {}



#[cfg(feature = "wasm")]
impl OhpkmConvert for PK2PolishedCrystal {

    fn to_main_data(&self) -> ohpkm::v2_sections::MainDataV2 {
        ohpkm::v2_sections::MainDataV2 {
            personality_value: 0,
            encryption_constant: 0,
            species_and_form: self.species_and_form.into_inner(),
            held_item_index: self.held_item_index,
            trainer_id: self.trainer_id,
            secret_id: self.secret_id,
            exp: self.exp,
            ability_index: self
                .ability
                .change_bound()
                .expect("PK2PolishedCrystal max ability <= overall max ability"),
            nature: self.nature,
            gender: self.gender,
            evs: self.evs,
            pokerus: self.pokerus,
            moves: self.moves.to_pp_adjusted(
                MetadataSource::UltraSunUltraMoon,
                ohpkm::MOVE_METADATA_SOURCE,
            ),
            nickname: self.nickname,
            is_egg: self.is_egg,
            handler_friendship: self.handler_friendship,
            game_of_origin: self.game_of_origin,
            language: self.language,
            trainer_friendship: self.trainer_friendship,
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
            country: 0u8,
            region: 0u8,
            geolocations: Geolocations {
                0: Default::default(),
                1: Default::default(),
                2: Default::default(),
                3: Default::default(),
                4: Default::default(),
            },
            resort_event_status: 0u8,
            super_training_flags: 0u32 as u32,
            super_training_dist_flags: 0u8,
            secret_super_training_unlocked: false,
            secret_super_training_complete: false,
            ..Default::default()
        })
    }

    fn from_ohpkm(ohpkm: &OhpkmV2, strategy: ConvertStrategy) -> Result<Self> {
        let form_metadata = ohpkm.get_form_metadata();
        let converter = PkmConverter::new(PkmFormat::PK2PolishedCrystal, strategy);
        let met_data = converter.met_data(ohpkm);

        let mut mon = Self {
            encryption_constant: 0,
            sanity: 0,
            checksum: 0,
            species_and_form: ohpkm.species_and_form().try_into()?,
            held_item_index: ohpkm.held_item_index(),
            trainer_id: ohpkm.trainer_id(),
            secret_id: ohpkm.secret_id(),
            exp: ohpkm.exp(),
            ability: ohpkm.ability_index().change_bound().unwrap_or(
                form_metadata
                    .ability_bounded(ohpkm.ability_num())
                    .unwrap_or(form_metadata.ability_bounded(AbilityNumber::First).ok_or(
                        Error::AbilityIndex(
                            form_metadata.get_ability(AbilityNumber::First).to_u16(),
                        ),
                    )?),
            ),
            ability_num: ohpkm.ability_num(),
            markings: ohpkm.markings(),
            personality_value: ohpkm.personality_value(),
            nature: ohpkm.nature(),
            gender: ohpkm.gender(),
            evs: ohpkm.evs(),
            pokerus: ohpkm.pokerus(),
            nickname: ohpkm.nickname(),
            moves: ohpkm.moves().to_pp_adjusted(
                ohpkm::MOVE_METADATA_SOURCE,
                MetadataSource::Crystal,
            ),
            is_egg: ohpkm.is_egg(),
            handler_friendship: ohpkm.handler_friendship(),
            trainer_friendship: ohpkm.trainer_friendship(),
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
            hyper_training: ohpkm.hyper_training(),
            game_of_origin: met_data.origin,
            language: ohpkm.language(),
            status_condition: 0,
            stat_level: 0,
            current_hp: 0,
            stats: Stats16Le::default(),
            dvs: ohpkm.dvs(),
        };

        mon.stat_level = mon.calculate_level();
        mon.stats = mon.calculate_stats();
        mon.current_hp = mon.stats.hp;


        Ok(mon)
    }

    fn bytes_to_stored(bytes: &[u8]) -> Result<StoredPkmBytes> {
        if bytes.len() == BOX_SIZE {
            let mut extended = bytes.to_vec();
            extended.resize(PARTY_SIZE, 0);
            let extended_len = extended.len();

            return extended
                .try_into()
                .map_err(|_| {
                    Error::buffer_size_with_source(
                        "PK2PolishedCrystal::OhpkmConvert::bytes_to_stored",
                        PARTY_SIZE,
                        extended_len,
                    )
                })
                .map(StoredPkmBytes::PK2PolishedCrystal);
        }
        bytes
            .as_array()
            .ok_or(Error::buffer_size_with_source(
                "PK2PolishedCrystal::OhpkmConvert::bytes_to_stored",
                PARTY_SIZE,
                bytes.len(),
            ))
            .copied()
            .map(Box::new)
            .map(StoredPkmBytes::PK2PolishedCrystal)
    }
}
