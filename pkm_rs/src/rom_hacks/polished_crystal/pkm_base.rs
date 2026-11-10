use tsify::Ts;
use wasm_bindgen::prelude::wasm_bindgen;
use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::metadata_source::MetadataSource;
use pkm_rs_resources::moves::{MoveSlot, MoveSlots};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::OpenHomeRibbonSet;
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_resources::stats;
use pkm_rs_types::{AbilityNumber, BinaryGender, Gender, Geolocations, HyperTraining, JsResult, Language, MarkingsSixShapesColors, OriginGame, PokeDate, Pokerus, Stats16Le, Stats8};
use pkm_rs_types::strings::SizedUtf16String;
use crate::convert_strategy::{ConvertStrategy, PkmConverter};
use crate::format::PkmFormat;
use crate::gen7_alola::Pk7;
use crate::{gen7_alola, ohpkm};
use crate::ohpkm::OhpkmV2;
use crate::result::Error;
use crate::traits::HasSpeciesAndForm;

#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = PKMBaseWasm))]
pub struct PKMBase {

  pub encryption_constant: u32,
  pub sanity: u16,
  pub checksum: u16,
  pub species_and_form: SpeciesForm,
  pub held_item_index: u16,
  pub trainer_id: u16,
  pub secret_id: u16,
  pub exp: u32,

  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub ability_index: AbilityIndexBounded,
  pub ability_num: AbilityNumber,

  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub markings: MarkingsSixShapesColors,

  pub personality_value: u32,
  pub nature: NatureIndex,
  pub is_fateful_encounter: bool,
  pub gender: Gender,

  #[cfg(feature = "wasm")]
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub evs: Stats8,

  pub pokerus: Pokerus,
  pub form_argument: u32,
  pub nickname: SizedUtf16String<26>,

  #[cfg(feature = "wasm")]
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub moves: MoveSlots,

  #[cfg(feature = "wasm")]
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub relearn_moves: [MoveSlot; 4],

  #[cfg(feature = "wasm")]
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub is_egg: bool,

  pub is_nicknamed: bool,
  pub handler_name: SizedUtf16String<26>,
  pub handler_gender: BinaryGender,
  pub is_current_handler: bool,

  #[cfg(feature = "wasm")]
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub geolocations: Geolocations,
  pub handler_friendship: u8,
  pub handler_affection: u8,

  #[cfg(feature = "wasm")]
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub trainer_name: SizedUtf16String<26>,
  pub trainer_friendship: u8,

  #[cfg(feature = "wasm")]
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub egg_date: Option<PokeDate>,
  pub met_date: PokeDate,
  pub egg_location_index: u16,
  pub met_location_index: u16,
  pub ball: Ball,
  pub met_level: u8,
  pub trainer_gender: BinaryGender,

  #[cfg(feature = "wasm")]
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub hyper_training: HyperTraining,
  pub game_of_origin: OriginGame,
  pub country: u8,
  pub region: u8,
  pub console_region: u8,
  pub language: Language,
  pub status_condition: u32,


  #[cfg(feature = "wasm")]
  #[cfg_attr(feature = "randomize", randomize(skip))]
  pub stat_level: u8,


  #[cfg(feature = "wasm")]
  #[cfg_attr(feature = "randomize", randomize(skip))]
  pub current_hp: u16,

  #[cfg(feature = "wasm")]
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub stats: Stats16Le,

  pub box_size : usize,
  pub party_size : usize,

}




impl PKMBase {

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
        .expect("Pk7 max ability <= overall max ability"),
      ability_num: self.ability_num,
      markings: self.markings,
      nature: self.nature,
      is_fateful_encounter: self.is_fateful_encounter,
      gender: self.gender,
      evs: self.evs,
      contest: self.contest,
      pokerus: self.pokerus,
      contest_memory_count: self.contest_memory_count,
      battle_memory_count: self.battle_memory_count,
      ribbons: OpenHomeRibbonSet::from_modern(self.ribbons),
      moves: self.moves.to_pp_adjusted(
        MetadataSource::UltraSunUltraMoon,
        ohpkm::MOVE_METADATA_SOURCE,
      ),
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

  fn from_ohpkm(ohpkm: &OhpkmV2, strategy: ConvertStrategy) -> crate::result::Result<Self> {
    let form_metadata = ohpkm.get_form_metadata();
    let converter = PkmConverter::new(PkmFormat::PK7, strategy);
    let met_data = converter.met_data(ohpkm);

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
      contest: ohpkm.contest(),
      resort_event_status: ohpkm.resort_event_status().unwrap_or_default(),
      pokerus: ohpkm.pokerus(),
      super_training_flags: ohpkm.super_training_flags().unwrap_or_default(),
      ribbons: ohpkm.ribbons().get_modern().into_iter().collect(),
      contest_memory_count: ohpkm.contest_memory_count(),
      battle_memory_count: ohpkm.battle_memory_count(),
      super_training_dist_flags: ohpkm.super_training_dist_flags().unwrap_or_default(),
      form_argument: ohpkm.form_argument(),
      nickname: ohpkm.nickname(),
      moves: ohpkm.moves().to_pp_adjusted(
        ohpkm::MOVE_METADATA_SOURCE,
        MetadataSource::UltraSunUltraMoon,
      ),
      relearn_moves: ohpkm.relearn_moves(),
      secret_super_training_unlocked: ohpkm
        .secret_super_training_unlocked()
        .unwrap_or_default(),
      secret_super_training_complete: ohpkm
        .secret_super_training_complete()
        .unwrap_or_default(),
      ivs: converter.ivs(ohpkm),
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
      form_argument_remain: 0,
      form_argument_elapsed: 0,
      current_hp: 0,
      stats: Stats16Le::default(),
    };

    mon.stat_level = mon.calculate_level();
    mon.stats = mon.calculate_stats();
    mon.current_hp = mon.stats.hp;

    mon.refresh_checksum();

    Ok(mon)
  }

  fn bytes_to_stored(bytes: &[u8]) -> crate::result::Result<crate::ohpkm::v2_sections::pkm_bytes::StoredPkmBytes> {
    if bytes.len() == gen7_alola::BOX_SIZE {
      let mut extended = bytes.to_vec();
      extended.resize(gen7_alola::PARTY_SIZE, 0);
      let extended_len = extended.len();

      return extended
        .try_into()
        .map_err(|_| {
          Error::buffer_size_with_source(
            "Pk7::OhpkmConvert::bytes_to_stored",
            gen7_alola::PARTY_SIZE,
            extended_len,
          )
        })
        .map(crate::ohpkm::v2_sections::pkm_bytes::StoredPkmBytes::Pk7);
    }
    bytes
      .try_into()
      .map_err(|_| {
        Error::buffer_size_with_source(
          "Pk7::OhpkmConvert::bytes_to_stored",
          gen7_alola::PARTY_SIZE,
          bytes.len(),
        )
      })
      .map(crate::ohpkm::v2_sections::pkm_bytes::StoredPkmBytes::Pk7)
  }

  pub fn from_buffer<S: AsRef<[u8]>>(buf: Pk2PolishedCrystalBuffer<S>) -> crate::result::Result<Self> {
    let mut mon = Pk7 {
      encryption_constant: buf.encryption_constant(),
      sanity: buf.sanity(),
      checksum: buf.checksum(),
      species_and_form: buf.species_and_form()?,
      held_item_index: buf.held_item_index(),
      trainer_id: buf.trainer_id(),
      secret_id: buf.secret_id(),
      exp: buf.exp(),
      ability_index: AbilityIndexBounded::try_from(buf.ability_index_raw())?,
      ability_num: buf.ability_num()?,
      markings: buf.markings(),
      personality_value: buf.personality_value(),
      nature: buf.nature()?,
      is_fateful_encounter: buf.is_fateful_encounter(),
      gender: buf.gender(),
      evs: buf.evs(),
      contest: buf.contest(),
      resort_event_status: buf.resort_event_status(),
      pokerus: buf.pokerus(),
      super_training_flags: buf.super_training_flags(),
      ribbons: buf.ribbons(),
      contest_memory_count: buf.contest_memory_count(),
      battle_memory_count: buf.battle_memory_count(),
      super_training_dist_flags: buf.super_training_dist_flags(),
      form_argument: buf.form_argument(),
      nickname: buf.nickname(),
      moves: buf.move_slots(),
      relearn_moves: [
        buf.relearn_move(0),
        buf.relearn_move(1),
        buf.relearn_move(2),
        buf.relearn_move(3),
      ],
      secret_super_training_unlocked: buf.secret_super_training_unlocked(),
      secret_super_training_complete: buf.secret_super_training_complete(),
      ivs: buf.ivs(),
      is_egg: buf.is_egg(),
      is_nicknamed: buf.is_nicknamed(),
      handler_name: buf.handler_name(),
      handler_gender: buf.handler_gender(),
      is_current_handler: buf.is_current_handler(),
      geolocations: buf.geolocations(),
      handler_friendship: buf.handler_friendship(),
      handler_affection: buf.handler_affection(),
      handler_memory: buf.handler_memory(),
      fullness: buf.fullness(),
      enjoyment: buf.enjoyment(),
      trainer_name: buf.trainer_name(),
      trainer_friendship: buf.trainer_friendship(),
      trainer_affection: buf.trainer_affection(),
      trainer_memory: buf.trainer_memory(),
      egg_date: buf.egg_date(),
      met_date: buf.met_date(),
      egg_location_index: buf.egg_location_index(),
      met_location_index: buf.met_location_index(),
      ball: buf.ball(),
      met_level: buf.met_level(),
      trainer_gender: buf.trainer_gender(),
      hyper_training: buf.hyper_training(),
      game_of_origin: buf.game_of_origin(),
      country: buf.country(),
      region: buf.region(),
      console_region: buf.console_region(),
      language: buf.language()?,
      ..Default::default()
    };

    mon.stat_level = mon.calculate_level();
    mon.stats = mon.calculate_stats();
    mon.current_hp = mon.stats.hp;

    if buf.is_party() {
      mon.status_condition = buf.status_condition();
      mon.form_argument_remain = buf.form_argument_remain();
      mon.form_argument_elapsed = buf.form_argument_elapsed();
    }

    Ok(mon)
  }

  pub fn write_to_box_buffer(&self, buf: &mut crate::gen7_alola::pk7_buffer::Pk7BufferMut) {
    buf.set_encryption_constant(self.encryption_constant);
    buf.reset_sanity();
    buf.set_species_and_form(self.species_and_form.0);
    buf.set_held_item_index(self.held_item_index);
    buf.set_trainer_id(self.trainer_id);
    buf.set_secret_id(self.secret_id);
    buf.set_exp(self.exp);
    buf.set_ability_index(self.ability_index);
    buf.set_ability_num(self.ability_num);
    buf.set_markings(self.markings);
    buf.set_personality_value(self.personality_value);
    buf.set_nature(self.nature);
    buf.set_gender(self.gender);
    buf.set_is_fateful_encounter(self.is_fateful_encounter);
    buf.set_evs(self.evs);
    buf.set_contest(self.contest);
    buf.set_resort_event_status(self.resort_event_status);
    buf.set_pokerus(self.pokerus);
    buf.set_super_training_flags(self.super_training_flags);
    buf.set_ribbons(self.ribbons);
    buf.set_contest_memory_count(self.contest_memory_count);
    buf.set_battle_memory_count(self.battle_memory_count);
    buf.set_super_training_dist_flags(self.super_training_dist_flags);
    buf.set_form_argument(self.form_argument);
    buf.set_nickname(&self.nickname);
    buf.set_move_slots(&self.moves);
    buf.set_relearn_move(0, self.relearn_moves[0]);
    buf.set_relearn_move(1, self.relearn_moves[1]);
    buf.set_relearn_move(2, self.relearn_moves[2]);
    buf.set_relearn_move(3, self.relearn_moves[3]);
    buf.set_secret_super_training_unlocked(self.secret_super_training_unlocked);
    buf.set_secret_super_training_complete(self.secret_super_training_complete);
    buf.set_ivs(&self.ivs);
    buf.set_is_egg(self.is_egg);
    buf.set_is_nicknamed(self.is_nicknamed);
    buf.set_handler_name(&self.handler_name);
    buf.set_handler_gender(self.handler_gender);
    buf.set_is_current_handler(self.is_current_handler);
    buf.set_geolocations(self.geolocations);
    buf.set_handler_friendship(self.handler_friendship);
    buf.set_handler_affection(self.handler_affection);
    buf.set_handler_memory(self.handler_memory);
    buf.set_fullness(self.fullness);
    buf.set_enjoyment(self.enjoyment);
    buf.set_trainer_name(&self.trainer_name);
    buf.set_trainer_friendship(self.trainer_friendship);
    buf.set_trainer_affection(self.trainer_affection);
    buf.set_trainer_memory(self.trainer_memory);
    buf.set_egg_date(self.egg_date);
    buf.set_met_date(self.met_date);
    buf.set_egg_location_index(self.egg_location_index);
    buf.set_met_location_index(self.met_location_index);
    buf.set_ball(self.ball);
    buf.set_met_level(self.met_level);
    buf.set_trainer_gender(self.trainer_gender);
    buf.set_hyper_training(self.hyper_training);
    buf.set_game_of_origin(self.game_of_origin);
    buf.set_country(self.country);
    buf.set_region(self.region);
    buf.set_console_region(self.console_region);
    buf.set_language(self.language);

    buf.refresh_checksum();
  }

  pub fn write_to_party_buffer(&self, buf: &mut crate::gen7_alola::pk7_buffer::Pk7BufferMut) {
    self.write_to_box_buffer(buf);
    buf.set_status_condition(self.status_condition);
    buf.set_stat_level(self.stat_level);
    buf.set_form_argument_remain(self.form_argument_remain);
    buf.set_form_argument_elapsed(self.form_argument_elapsed);
    buf.set_current_hp(self.current_hp);
    buf.set_stats(self.stats);
  }

  pub fn try_from_bytes(bytes: &[u8]) -> crate::result::Result<Self> {
    let size = bytes.len();
    match size {
      Self::BOX_SIZE => Self::from_buffer(&crate::gen7_alola::pk7_buffer::Pk7Buffer::box_span(bytes)),
      Self::PARTY_SIZE => Self::from_buffer(&crate::gen7_alola::pk7_buffer::Pk7Buffer::party_span(bytes)),
      _ => Err(Error::buffer_size(Self::BOX_SIZE, size)),
    }
}