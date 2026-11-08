use js_sys::Uint8Array;
use pkm_rs_derive::IsShiny8192;
use serde::Serialize;
use tsify::{Ts, Tsify};
use wasm_bindgen::JsValue;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::wasm_bindgen;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::metadata_source::MetadataSource;
use pkm_rs_resources::moves::{MoveSlot, MoveSlots};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::ModernRibbonSet;
use pkm_rs_resources::stats;
use pkm_rs_types::{AbilityNumber, BinaryGender, ContestStats, Gender, Geolocations, HyperTraining, Ivs, JsResult, Language, MarkingsSixShapesColors, OriginGame, PokeDate, Pokerus, Stats16Le, Stats8, TrainerMemory};
use crate::convert_strategy::ConvertStrategy;
#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
use pkm_rs_types::strings::SizedUtf16String;
use crate::gen2_polished_crystal::{Pk2PolishedCrystalAbilityIndex, Pk2PolishedCrystalSpeciesAndForm};
use crate::ohpkm::OhpkmV2;
use crate::result::Error;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = Pk2PolishedCrystalWasm))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny8192)]
pub struct Pk2PolishedCrystal {

  pub encryption_constant: u32,
  pub sanity: u16,
  pub checksum: u16,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub species_and_form: Pk2PolishedCrystalSpeciesAndForm,
  pub held_item_index: u16,
  pub trainer_id: u16,
  pub secret_id: u16,
  pub exp: u32,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub ability_index: Pk2PolishedCrystalAbilityIndex,
  pub ability_num: AbilityNumber,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]

  pub markings: MarkingsSixShapesColors,
  pub personality_value: u32,
  pub nature: NatureIndex,
  pub is_fateful_encounter: bool,
  pub gender: Gender,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub evs: Stats8,
  pub pokerus: Pokerus,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub ribbons: ModernRibbonSet<7, crate::gen2_polished_crystal::pk2::MAX_RIBBON_POLISHED_CRYSTAL>,
  pub form_argument: u32,
  pub nickname: SizedUtf16String<26>,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub moves: MoveSlots,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub relearn_moves: [MoveSlot; 4],
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub is_egg: bool,
  pub is_nicknamed: bool,
  pub handler_name: SizedUtf16String<26>,
  pub handler_gender: BinaryGender,
  pub is_current_handler: bool,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub geolocations: Geolocations,
  pub handler_friendship: u8,
  pub handler_affection: u8,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub trainer_name: SizedUtf16String<26>,
  pub trainer_friendship: u8,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub egg_date: Option<PokeDate>,
  pub met_date: PokeDate,
  pub egg_location_index: u16,
  pub met_location_index: u16,
  pub ball: Ball,
  pub met_level: u8,
  pub trainer_gender: BinaryGender,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub hyper_training: HyperTraining,
  pub game_of_origin: OriginGame,
  pub country: u8,
  pub region: u8,
  pub console_region: u8,
  pub language: Language,
  pub status_condition: u32,
  #[cfg_attr(feature = "randomize", randomize(skip))]
  pub stat_level: u8,

  
  #[cfg_attr(feature = "randomize", randomize(skip))]
  pub current_hp: u16,
  #[cfg_attr(feature = "randomize", randomize(skip))]
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub stats: Stats16Le,

}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_class = Pk2PolishedCrystalWasm)]
#[allow(clippy::missing_const_for_fn)]
impl Pk2PolishedCrystal {

  #[wasm_bindgen(js_name = fromOhpkmBytes)]
  pub fn from_ohpkm_bytes(bytes: Vec<u8>, strategy: Ts<ConvertStrategy>) -> JsResult<Self> {
    let ohpkm = OhpkmV2::from_bytes(&bytes)?;
    Ok(Self::from_ohpkm(&ohpkm, strategy.to_rust()?)?)
  }

  fn from_bytes(bytes: &[u8]) -> crate::result::Result<Self> {
    Self::try_from_bytes(bytes)
  }

  pub fn try_from_bytes(bytes: &[u8]) -> crate::result::Result<Self> {
    let size = bytes.len();
    match size {
      Self::BOX_SIZE => Self::from_buffer(&crate::gen7_alola::pk7_buffer::Pk7Buffer::box_span(bytes)),
      Self::PARTY_SIZE => Self::from_buffer(&crate::gen7_alola::pk7_buffer::Pk7Buffer::party_span(bytes)),
      _ => Err(Error::buffer_size(Self::BOX_SIZE, size)),
    }
  }

  pub fn from_encrypted_bytes(mut bytes: Box<[u8]>) -> crate::result::Result<Self> {
    Self::from_buffer(crate::gen7_alola::pk7_buffer::Pk7Buffer::box_or_party_span_mut(&mut bytes).decrypted())
  }

  pub fn to_box_bytes_encrypted(self) -> Box<[u8]> {
    let mut bytes = self.to_box_bytes();
    crate::gen7_alola::pk7_buffer::Pk7Buffer::box_span_mut(&mut bytes).encrypt();

    bytes
  }

  pub fn calculate_checksum(&self) -> u16 {
    let mut bytes = [0u8; Self::BOX_SIZE];
    self.write_box_bytes(&mut bytes);
    crate::gen7_alola::pk7_buffer::Pk7Buffer::box_span(&bytes).calculate_checksum()
  }

  pub fn refresh_checksum(&mut self) {
    self.checksum = self.calculate_checksum();
  }

  pub fn calculate_stats(&self) -> Stats16Le {
    stats::calculate_all_modern_for_source(
      MetadataSource::UltraSunUltraMoon,
      self.species_and_form.0,
      &self.ivs,
      &self.evs,
      self.calculate_level() as u16,
      self.nature.get_metadata(),
      Some(self.hyper_training),
    )
      .unwrap_or_else(|| {
        panic!(
          "pk7 has species/form present in ultra sun + moon: {:#?}",
          self.species_and_form.0
        )
      })
  }

  pub fn recalculate_stats(&mut self) {
    self.stats = self.calculate_stats();
  }

  pub fn empty_box_slot_bytes(trainer_name: &SizedUtf16String<26>) -> Box<[u8]> {
    let mut bytes = Box::new([0u8; Self::BOX_SIZE]);
    let mut buffer = crate::gen7_alola::pk7_buffer::Pk7BufferMut::box_span_mut(bytes.as_mut_slice());

    buffer.set_handler_name(trainer_name);
    buffer.set_is_current_handler(true);
    buffer.refresh_checksum();

    buffer.encrypt();

    bytes
  }

  pub fn is_empty_slot(bytes: &[u8]) -> bool {
    let mut owned = bytes.to_owned();
    let mut buffer = crate::gen7_alola::pk7_buffer::Pk7Buffer::box_span_mut(&mut owned);
    buffer.decrypt();

    buffer.species_ndex() == 0
  }


  #[wasm_bindgen(js_name = fromDecryptedBytes)]
  pub fn from_bytes_wasm(bytes: Box<[u8]>) -> core::result::Result<Self, JsValue> {
    Self::from_bytes(&bytes).map_err(JsValue::from)
  }

}