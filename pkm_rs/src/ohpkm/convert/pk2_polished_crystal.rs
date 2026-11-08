use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::metadata_source::MetadataSource;
use pkm_rs_types::{AbilityNumber, Stats16Le};
use crate::convert_strategy::{ConvertStrategy, PkmConverter};
use crate::format::PkmFormat;
use crate::ohpkm;
use crate::ohpkm::OhpkmV2;
use crate::result::Error;
use crate::rom_hacks::polished_crystal::pk2_polished_crystal::Pk2PolishedCrystal;
use crate::traits::HasSpeciesAndForm;

impl Pk2PolishedCrystal {
  pub(crate) fn from_ohpkm(ohpkm: &OhpkmV2, strategy: ConvertStrategy) -> crate::result::Result<Self> {
    let form_metadata = ohpkm.get_form_metadata();
    let converter = PkmConverter::new(PkmFormat::PK2PolishedCrystal, strategy);

    let mut mon = Self {
      encryption_constant: ohpkm.encryption_constant(),
      sanity: 0,
      checksum: 0,
      species_and_form: ohpkm.species_and_form().try_into()?,
      held_item_index: ohpkm.held_item_index(),
      trainer_id: ohpkm.trainer_id(),
      secret_id: ohpkm.secret_id(),
      exp: ohpkm.exp(),
      ability_index: ohpkm.ability_index().change_bound().unwrap_or(
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
      is_fateful_encounter: ohpkm.is_fateful_encounter(),
      gender: ohpkm.gender(),
      evs: ohpkm.evs(),
      pokerus: ohpkm.pokerus(),
      ribbons: ohpkm.ribbons().get_modern().into_iter().collect(),
      form_argument: ohpkm.form_argument(),
      nickname: ohpkm.nickname(),
      moves: ohpkm.moves().to_pp_adjusted(
        ohpkm::MOVE_METADATA_SOURCE,
        MetadataSource::UltraSunUltraMoon,
      ),
      relearn_moves: ohpkm.relearn_moves(),
      dvs: converter.dvs(ohpkm),
      is_egg: ohpkm.is_egg(),
      is_nicknamed: ohpkm.is_nicknamed(),
      handler_name: ohpkm.handler_name(),
      handler_gender: ohpkm.handler_gender(),
      is_current_handler: ohpkm.is_current_handler(),
      geolocations: ohpkm.geolocations().unwrap_or_default(),
      handler_friendship: ohpkm.handler_friendship(),
      handler_affection: ohpkm.handler_affection(),
      trainer_name: ohpkm.trainer_name(),
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
      trainer_gender: ohpkm.trainer_gender(),
      hyper_training: ohpkm.hyper_training(),
      game_of_origin: met_data.origin,
      country: ohpkm.country().unwrap_or_default(),
      region: ohpkm.region().unwrap_or_default(),
      console_region: ohpkm.console_region(),
      language: ohpkm.language(),
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
}