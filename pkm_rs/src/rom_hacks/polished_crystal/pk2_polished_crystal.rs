use super::{PK2PolishedCrystalSpeciesAndForm};
use crate::convert_strategy::ConvertStrategy;
use crate::result::{Error, Result};
use crate::traits::{IsShiny, ModernEvs, Pkm};
use crate::traits::{HasSpeciesAndForm, PkmBytes};
#[cfg(feature = "wasm")]
use pkm_rs_types::JsResult;

use pkm_rs_derive::IsShiny4096;
use pkm_rs_resources::abilities::AbilityIndexBounded;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::metadata_source::MetadataSource;
use pkm_rs_resources::moves::{MoveSlot, MoveSlots};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::{ModernRibbon, ModernRibbonSet};
use pkm_rs_resources::species::{FormMetadata, SpeciesForm, SpeciesMetadata};
use pkm_rs_resources::stats;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{AbilityNumber, BinaryGender, ContestStats, HyperTraining, Language, MarkingsSixShapesColors, OriginGame, Pokerus, Stats8, Stats16Le, TryIntoTs, TsResult, Stats, Dvs};
use pkm_rs_types::{Gender, Geolocations, PokeDate, TrainerMemory};
use serde::Serialize;


use tsify::Ts;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use crate::ohpkm::{OhpkmConvert, OhpkmV2};
#[cfg(feature = "wasm")]
use pkm_rs_resources::abilities::AbilityIndexWasm;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg(feature = "wasm")]
use crate::checksum::{Checksum, RefreshChecksum};
use crate::rom_hacks::polished_crystal::abilities::PolishedCrystalAbility;
#[cfg(feature = "wasm")]
use crate::rom_hacks::polished_crystal::pkm_buffer::{PK2PolishedCrystalBuffer, PK2PolishedCrystalBufferMut};

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = PK2PolishedCrystalWasm))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny4096)]
pub struct PK2PolishedCrystal {
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub species_and_form: PK2PolishedCrystalSpeciesAndForm,
  pub held_item_index: u16,
  pub trainer_id: u16,
  pub exp: u32,
  pub ability: PolishedCrystalAbility,
  pub nature: NatureIndex,
  pub gender: Gender,
  pub evs: Stats8,
  pub pokerus: Pokerus,

  pub secret_id : u16,
  pub personality_value : u32,

  pub moves: MoveSlots,
  pub is_egg: bool,
  pub handler_friendship: u8,
  pub trainer_friendship: u8,
  pub egg_date: Option<PokeDate>,
  pub met_date: PokeDate,
  pub egg_location_index: u16,
  pub met_location_index: u16,
  pub level : u8,
  pub ball: Ball,
  pub met_level: u8,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub hyper_training: HyperTraining,
  pub game_of_origin: OriginGame,
  pub language: Language,
  pub status_condition: u32,
  #[cfg_attr(feature = "randomize", randomize(skip))]
  pub stat_level: u8,
  #[cfg_attr(feature = "randomize", randomize(skip))]
  pub current_hp: u16,
  #[cfg_attr(feature = "randomize", randomize(skip))]
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub stats: Stats16Le,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub dvs: Dvs,
  pub shininess : bool,

  pub nickname: SizedUtf16String<26>,
  pub ot_nickname: SizedUtf16String<26>
}

const MAX_RIBBON_ALOLA: usize = ModernRibbon::BattleTreeMaster as usize;

#[cfg(feature = "wasm")]
impl PK2PolishedCrystal {
  // ------------------------------------------------------------------
  // Deserialise from a PK2PolishedCrystalBuffer (the single source of all byte offsets)
  // ------------------------------------------------------------------

  pub fn from_buffer<S: AsRef<[u8]>>(buf: &PK2PolishedCrystalBuffer<S>) -> Result<Self> {
    let mut mon = PK2PolishedCrystal {

      // todo!() check if the offsets are accurate
      species_and_form: buf.species_and_form()?,
      held_item_index: buf.held_item_index(),
      trainer_id: buf.trainer_id(),
      moves: buf.move_slots(),
      exp: buf.exp(),
      evs: buf.evs(),
      dvs: buf.dvs(),
      shininess : buf.shininess(),
      ability: PolishedCrystalAbility::try_from(buf.ability_index_raw())?,
      nature: buf.nature()?,
      gender: buf.gender(),
      is_egg: buf.is_egg(),
      handler_friendship: buf.handler_friendship(),
      pokerus: buf.pokerus(),
      secret_id: 0,
      met_date: buf.met_date(),
      met_level: buf.met_level(),
      ball: buf.ball(),
      met_location_index: buf.met_location_index(),

      level: buf.level(),
      current_hp : buf.current_hp(),

      stats: buf.stats(),

      ot_nickname: buf.ot_nickname(),
      hyper_training: buf.hyper_training(),
      nickname: buf.nickname(),




      egg_date: buf.egg_date(),
      egg_location_index: buf.egg_location_index(),


      // Only available in this language
      language: Language::English,
      status_condition: buf.status_condition(),
      trainer_friendship: 0,
      game_of_origin: Default::default(),
      stat_level: 0,
      personality_value: 0,
    };

    mon.stat_level = mon.calculate_level();
    mon.stats = mon.calculate_stats();
    mon.current_hp = mon.stats.hp;

    if buf.is_party() {
      mon.status_condition = buf.status_condition();
    }

    Ok(mon)
  }

  pub fn write_to_box_buffer(&self, buf: &mut PK2PolishedCrystalBufferMut) {
    buf.set_species_and_form(self.species_and_form.0);
    buf.set_held_item_index(self.held_item_index);
    buf.set_trainer_id(self.trainer_id);
    buf.set_exp(self.exp);
    buf.set_ability_index(self.ability);
    buf.set_nature(self.nature);
    buf.set_gender(self.gender);
    buf.set_evs(self.evs);
    buf.set_pokerus(self.pokerus);
    buf.set_nickname(&self.nickname);
    buf.set_move_slots(&self.moves);
    buf.set_dvs(&self.dvs);
    buf.set_is_egg(self.is_egg);
    buf.set_handler_friendship(self.handler_friendship);
    buf.set_trainer_friendship(self.trainer_friendship);
    buf.set_egg_date(self.egg_date);
    buf.set_met_date(self.met_date);
    buf.set_egg_location_index(self.egg_location_index);
    buf.set_met_location_index(self.met_location_index);
    buf.set_ball(self.ball);
    buf.set_met_level(self.met_level);
    buf.set_hyper_training(self.hyper_training);
    buf.set_game_of_origin(self.game_of_origin);
    buf.set_language(self.language);
    buf.refresh_checksum();
  }

  pub fn write_to_party_buffer(&self, buf: &mut PK2PolishedCrystalBufferMut) {
    self.write_to_box_buffer(buf);
    buf.set_status_condition(self.status_condition);
    buf.set_current_hp(self.current_hp);
    buf.set_stats(self.stats);
  }

  pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
    let size = bytes.len();
    match size {
      Self::BOX_MON_SIZE => Self::from_buffer(&PK2PolishedCrystalBuffer::box_span(bytes)),
      Self::PARTY_MON_SIZE => Self::from_buffer(&PK2PolishedCrystalBuffer::party_span(bytes)),
      _ => Err(Error::buffer_size(Self::BOX_MON_SIZE, size)),
    }
  }

  pub fn from_encrypted_bytes(mut bytes: Box<[u8]>) -> Result<Self> {
    Self::from_buffer(PK2PolishedCrystalBuffer::box_or_party_span_mut(&mut bytes).decrypted())
  }

  pub fn to_box_bytes_encrypted(self) -> Box<[u8]> {
    let mut bytes = self.to_box_bytes();
    PK2PolishedCrystalBuffer::box_span_mut(&mut bytes).encrypt();

    bytes
  }

  pub fn calculate_checksum(&self) -> u16 {
    let mut bytes = [0u8; Self::BOX_MON_SIZE];
    self.write_box_bytes(&mut bytes);
    PK2PolishedCrystalBuffer::box_span(&bytes).calculate_checksum()
  }


  pub fn calculate_stats(&self) -> Stats16Le {
    stats::calculate_polished_crystal_stats(
      MetadataSource::Crystal,
      self.species_and_form.0,
      &self.dvs,
      &self.evs,
      self.calculate_level() as u16,
      self.nature.get_metadata(),
      Some(self.hyper_training),
    )
      .unwrap_or_else(|| {
        panic!(
          "pk2 does not have the species/form present in Polished Crystal: {:#?}",
          self.species_and_form.0
        )
      })
  }

  pub fn recalculate_stats(&mut self) {
    self.stats = self.calculate_stats();
  }

  pub fn empty_box_slot_bytes(trainer_name: &SizedUtf16String<26>) -> Box<[u8]> {
    let mut bytes = Box::new([0u8; Self::BOX_MON_SIZE]);
    let mut buffer = PK2PolishedCrystalBufferMut::box_span_mut(bytes.as_mut_slice());

    buffer.set_handler_name(trainer_name);
    buffer.set_is_current_handler(true);
    buffer.refresh_checksum();

    buffer.encrypt();

    bytes
  }

  pub fn is_empty_slot(bytes: &[u8]) -> bool {
    let mut owned = bytes.to_owned();
    let mut buffer = PK2PolishedCrystalBuffer::box_span_mut(&mut owned);
    buffer.species_ndex() == 0


  }
}

#[cfg(feature = "wasm")]
impl PkmBytes for PK2PolishedCrystal {
  const BOX_MON_SIZE: usize = 49;
  const PARTY_MON_SIZE: usize = 260;

  fn from_bytes(bytes: &[u8]) -> Result<Self> {
    Self::try_from_bytes(bytes)
  }

  fn write_box_bytes(&self, bytes: &mut [u8]) {
    self.write_to_box_buffer(&mut PK2PolishedCrystalBufferMut::box_span_mut(bytes))
  }

  fn write_party_bytes(&self, bytes: &mut [u8]) {
    let mut buffer = PK2PolishedCrystalBufferMut::party_span_mut(bytes);
    self.write_to_box_buffer(&mut buffer);
    self.write_to_party_buffer(&mut buffer);
  }

  fn to_box_bytes(&self) -> Box<[u8]> {
    let mut bytes = Box::new([0u8; Self::BOX_MON_SIZE]);
    self.write_box_bytes(bytes.as_mut_slice());

    bytes
  }

  fn to_party_bytes(&self) -> Box<[u8]> {
    let mut bytes = Box::new([0u8; Self::PARTY_MON_SIZE]);
    self.write_party_bytes(bytes.as_mut_slice());

    bytes
  }
}


impl IsShiny for PK2PolishedCrystal {
  fn is_shiny(&self) -> bool {
    todo!()
  }

  fn is_square_shiny(&self) -> bool {
    todo!()
  }
}

impl Pkm for PK2PolishedCrystal {}

#[cfg(feature = "wasm")]
impl HasSpeciesAndForm for PK2PolishedCrystal {
  fn get_species_metadata(&self) -> &'static SpeciesMetadata {
    self.species_and_form.0.get_species_metadata()
  }

  fn get_form_metadata(&self) -> &'static FormMetadata {
    self.species_and_form.0.get_form_metadata()
  }

  fn calculate_level(&self) -> u8 {
    self.get_species_metadata()
      .experience_growth
      .calculate_level(self.exp)
  }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_class = PK2PolishedCrystalWasm)]
#[allow(clippy::missing_const_for_fn)]
impl PK2PolishedCrystal {
  #[wasm_bindgen(js_name = fromOhpkmBytes)]
  pub fn from_ohpkm_bytes(bytes: Vec<u8>, strategy: Ts<ConvertStrategy>) -> JsResult<Self> {
    let ohpkm = OhpkmV2::from_bytes(&bytes)?;
    Ok(Self::from_ohpkm(&ohpkm, strategy.to_rust()?)?)
  }

  #[wasm_bindgen(js_name = fromDecryptedBytes)]
  pub fn from_bytes_wasm(bytes: Box<[u8]>) -> core::result::Result<Self, JsValue> {
    Self::from_bytes(&bytes).map_err(JsValue::from)
  }

  #[wasm_bindgen(js_name = fromEncryptedBytes)]
  pub fn take_from_encrypted_bytes(bytes: Box<[u8]>) -> core::result::Result<Self, JsValue> {
    Self::from_encrypted_bytes(bytes).map_err(JsValue::from)
  }

  #[wasm_bindgen(js_name = toBytes)]
  pub fn get_bytes_wasm(&self) -> Box<[u8]> {
    self.to_box_bytes()
  }

  #[wasm_bindgen(getter = abilityIndex)]
  pub fn ability_index(&self) -> AbilityIndexWasm {
    AbilityIndexWasm::try_from(self.ability as u8)
      .expect("AbilityIndexWasm should accept any valid ability index")
  }

  #[wasm_bindgen(setter = abilityIndex)]
  pub fn set_ability_index(&mut self, value: AbilityIndexWasm) -> Result<()> {
    self.ability = PolishedCrystalAbility::try_from(value.to_u16())?;
    Ok(())
  }

  #[wasm_bindgen(getter)]
  pub fn move_indices(&self) -> Vec<u16> {
    self.moves.indices()
  }

  #[wasm_bindgen(setter)]
  pub fn set_move_indices(&mut self, value: &[u16]) {
    self.moves.set_indices(value);
  }

  #[wasm_bindgen(getter)]
  pub fn move_pp(&self) -> Vec<u8> {
    self.moves.pp()
  }

  #[wasm_bindgen(setter)]
  pub fn set_move_pp(&mut self, value: &[u8]) {
    self.moves.set_pp(value);
  }

  #[wasm_bindgen(getter)]
  pub fn move_pp_ups(&self) -> Vec<u8> {
    self.moves.pp_ups()
  }

  #[wasm_bindgen(setter)]
  pub fn set_move_pp_ups(&mut self, value: &[u8]) {
    self.moves.set_pp_ups(value);
  }









  #[wasm_bindgen]
  pub fn set_species_and_form(
    &mut self,
    national_dex: u16,
    form_index: u16,
  ) -> core::result::Result<(), JsValue> {
    match SpeciesForm::new(national_dex, form_index) {
      Ok(species_and_form) => {
        self.species_and_form = species_and_form.try_into()?;
        Ok(())
      }
      Err(e) => Err(JsValue::from_str(&e.to_string())),
    }
  }

  #[wasm_bindgen(getter = nationalDex)]
  pub fn national_dex_wasm(&self) -> u16 {
    self.species_and_form.0.get_ndex() as u16
  }

  #[wasm_bindgen(getter = formIndex)]
  pub fn form_index_wasm(&self) -> u16 {
    self.species_and_form.0.get_form_index()
  }

  #[wasm_bindgen(getter = evs)]
  pub fn evs_wasm(&self) -> TsResult<Stats16Le> {
    Stats16Le::from(self.evs).try_into_ts()
  }

  #[wasm_bindgen(getter = ivs)]
  pub fn dvs_wasm(&self) -> TsResult<Stats16Le> {
    Stats16Le::from(self.dvs).try_into_ts()
  }

  #[wasm_bindgen(js_name = toOhpkm)]
  pub fn to_ohpkm(&self) -> Result<OhpkmV2> {
    OhpkmV2::convert_with_backup(self, &self.to_party_bytes())
  }

  #[wasm_bindgen(js_name = isEmptySlot)]
  pub fn is_empty_slot_wasm(bytes: Vec<u8>) -> bool {
    Self::is_empty_slot(&bytes)
  }

  #[wasm_bindgen(js_name = calculateChecksum)]
  pub fn calculate_checksum_wasm(&self) -> u16 {
    self.calculate_checksum()
  }

  #[wasm_bindgen(js_name = calculateLevel)]
  pub fn calculate_level_wasm(&self) -> u8 {
    self.calculate_level()
  }

  #[wasm_bindgen(js_name = calculateStats)]
  pub fn calculate_stats_wasm(&self) -> TsResult<Stats16Le> {
    self.calculate_stats().try_into_ts()
  }

  #[wasm_bindgen(js_name = recalculateStats)]
  pub fn recalculate_stats_wasm(&mut self) {
    self.recalculate_stats()
  }

  #[wasm_bindgen(getter = hyperTraining)]
  pub fn hyper_training_wasm(&self) -> TsResult<HyperTraining> {
    self.hyper_training.try_into_ts()
  }
}

impl ModernEvs for PK2PolishedCrystal {
  fn get_evs(&self) -> Stats8 {
    self.evs
  }
}

// #[cfg(test)]
// impl crate::tests::PkhexJson for PK2PolishedCrystal {
//   fn to_pkhex_json_value(&self) -> std::result::Result<serde_json::Value, serde_json::Error> {
//     let mut value = serde_json::to_value(self)?;
//     value["nickname_trash"] = serde_json::json!(
//             self.nickname
//                 .bytes()
//                 .iter()
//                 .map(|b| format!("{:02X}", b))
//                 .collect::<String>()
//         );
//     value["level"] = serde_json::json!(self.calculate_level());
//
//     Ok(value)
//   }
// }

// #[cfg(test)]
// mod tests {
//   use std::path::PathBuf;
//
//   use crate::convert_strategy::ConvertStrategy;
//   use crate::ohpkm::{OhpkmConvert, OhpkmV2};
//
//   use crate::result::Error;
//   #[cfg(feature = "randomize")]
//   use crate::tests::TestErrorWithSeed;
//   use crate::tests::{self, TestResult};
//   use crate::traits::IsShiny;
//
//   #[cfg(feature = "randomize")]
//   use pkm_rs_types::randomize::Randomize;
//   #[cfg(feature = "randomize")]
//   use rand::{SeedableRng, rngs::StdRng};
//   use crate::rom_hacks::polished_crystal::pk2_polished_crystal_buffer::PK2PolishedCrystalBuffer;
//   use crate::rom_hacks::polished_crystal::PK2PolishedCrystal;
//
//   #[test]
//   fn to_from_bytes() -> TestResult<()> {
//     tests::to_from_bytes_all_in_dir::<PK2PolishedCrystal>(
//       &PathBuf::from("test-files").join("pkm-files").join("pk2"),
//     )
//   }
//
//   #[cfg(feature = "randomize")]
//   #[test]
//   fn to_from_bytes_random() -> Result<(), TestErrorWithSeed> {
//     for seed in 0..=1000 {
//       let mon = PK2PolishedCrystal::randomized(&mut StdRng::seed_from_u64(seed));
//       tests::find_inconsistencies_to_from_bytes(mon)
//         .map_err(|error| TestErrorWithSeed { seed, error })?;
//     }
//
//     Ok(())
//   }
//
//   #[test]
//   fn is_shiny() -> TestResult<()> {
//     let path = PathBuf::from("pk2").join("slowpoke-shiny.pk2");
//     let mon = tests::pkm_from_file::<PK2PolishedCrystal>(&path)?.0;
//     assert!(mon.is_shiny());
//
//     Ok(())
//   }
//
//   #[test]
//   fn compare_pkhex_json() -> TestResult<()> {
//     tests::compare_pkhex_json_all_in_dir::<PK2PolishedCrystal>(&PathBuf::from("pk2"))
//   }
//
//   #[test]
//   fn nickname_garbage_preserved() -> TestResult<()> {
//     let (mon, bytes) =
//       tests::pkm_from_file::<PK2PolishedCrystal>(&PathBuf::from("pk2").join("pelipper-garbage-bytes.pk2"))?;
//
//     // 'r' at position 14 should be leftover from 'Pelipper'
//     assert_eq!(mon.nickname.bytes()[14], b'r');
//
//     let mon_recreated = PK2PolishedCrystal::from_ohpkm(
//       &OhpkmV2::convert_with_backup(&mon, &bytes)?,
//       ConvertStrategy::default(),
//     )?;
//
//     // leftover 'r' should be preserved after conversion to/from OHPKM
//     assert_eq!(mon_recreated.nickname.bytes()[14], b'r');
//
//     Ok(())
//   }
//
//   #[test]
//   fn checksum() -> TestResult<()> {
//     let mon =
//       tests::pkm_from_file::<PK2PolishedCrystal>(&PathBuf::from("pk2").join("primarina-garbage-bytes.pk2"))?
//         .0;
//     assert_eq!(mon.checksum, mon.calculate_checksum());
//
//     Ok(())
//   }
//
//   #[test]
//   fn from_ohpkm() -> TestResult<()> {
//     let mon = tests::pkm_from_file::<OhpkmV2>(&PathBuf::from("ohpkm").join("Machamp.ohpkm"))?.0;
//
//     let _ = PK2PolishedCrystal::from_ohpkm(&mon, ConvertStrategy::default());
//
//     Ok(())
//   }
//
//   const STEADFAST: u16 = 80;
//   const SHARPNESS: u16 = 292;
//
//   // #[test]
//   // fn from_ohpkm_ability_change() -> TestResult<()> {
//   //   let mon = tests::pkm_from_file::<OhpkmV2>(
//   //     &PathBuf::from("ohpkm").join("gallade-sharpness-alpha.ohpkm"),
//   //   )?
//   //     .0;
//   //
//   //   assert_eq!(mon.ability_index().to_u16(), SHARPNESS);
//   //
//   //   let converted_pk2 = PK2PolishedCrystal::from_ohpkm(&mon, ConvertStrategy::default())?;
//   //
//   //   // Gallade's Sharpness should be converted to Steadfast when converting to PK2PolishedCrystal, since Sharpness is Gen 8+ and PK2PolishedCrystal can only represent Gen 7 abilities
//   //   assert_eq!(converted_pk2.ability_index.to_u16(), STEADFAST);
//   //
//   //   Ok(())
//   // }
//
//   #[test]
//   fn to_from_ohpkm() -> TestResult<()> {
//     tests::to_from_ohpkm_all_in_dir::<PK2PolishedCrystal>(
//       &PathBuf::from("test-files").join("pkm-files").join("pk2"),
//     )
//   }
//
//   #[test]
//   fn empty_slot_checksum() -> TestResult<()> {
//     let empty_slot = PK2PolishedCrystal::empty_box_slot_bytes(&"RoC".into());
//     if PK2PolishedCrystalBuffer::box_span(&empty_slot).checksum() != 0x0204 {
//       return Err(Error::other(&format!(
//         "Empty slot checksum should be 0x0204; received {:#06x}",
//         PK2PolishedCrystalBuffer::box_span(&empty_slot).checksum()
//       ))
//         .into());
//     }
//     Ok(())
//   }
//
//
// }
