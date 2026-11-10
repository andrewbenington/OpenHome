use boilermates::boilermates;
use tsify::Ts;
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::wasm_bindgen;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::metadata_source::MetadataSource;
use pkm_rs_resources::moves::{MoveSlot, MoveSlots};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_resources::stats;
use pkm_rs_types::{AbilityNumber, BinaryGender, Gender, Geolocations, HyperTraining, JsResult, Language, MarkingsSixShapesColors, OriginGame, PokeDate, Pokerus, Stats16Le, Stats8};
use pkm_rs_types::strings::SizedUtf16String;
use crate::checksum::{Checksum, RefreshChecksum};
use crate::convert_strategy::ConvertStrategy;
use crate::gen7_alola::Pk7AbilityIndex;
use crate::ohpkm::OhpkmV2;
use crate::result::Error;

#[boilermates("PK2PolishedCrystal")]
#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = PKMBaseWasm))]
pub struct PKMBase {

  pub encryption_constant: u32,
  pub sanity: u16,
  pub checksum: u16,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub species_and_form: SpeciesForm,
  pub held_item_index: u16,
  pub trainer_id: u16,
  pub secret_id: u16,
  pub exp: u32,
  #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
  pub ability_index: Pk7AbilityIndex,
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

  pub box_size : usize,
  pub party_size : usize,

}
#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = PKMBaseWasm))]
impl PKMBase {
  #[wasm_bindgen(js_name = fromOhpkmBytes)]
  pub fn from_ohpkm_bytes(bytes: Vec<u8>, strategy: Ts<ConvertStrategy>) -> JsResult<Self> {
    let ohpkm = OhpkmV2::from_bytes(&bytes)?;
    Ok(Self::from_ohpkm(&ohpkm, strategy.to_rust()?)?)
  }



  fn from_bytes(bytes: &[u8]) -> crate::result::Result<Self> {
    Self::try_from_bytes(bytes)
  }

  fn get_box_size();

  pub fn try_from_bytes(bytes: &[u8]) -> crate::result::Result<Self> {
    let size = bytes.len();
    match size {
      box_size => Self::from_buffer(pkm_buffer.box_span(bytes)),
      party_size => Self::from_buffer(pkm_buffer.party_span(bytes)),
      _ => Err(Error::buffer_size(Self::get_box_size(), size)),
    }
  }

  pub fn from_encrypted_bytes(mut bytes: Box<[u8]>) -> crate::result::Result<Self> {
    Self::from_buffer(getBuffer().box_or_party_span_mut(&mut bytes).decrypted())
  }

  pub fn to_box_bytes_encrypted(self) -> Box<[u8]> {
    let mut bytes = self.to_box_bytes();
    crate::gen7_alola::pk7_buffer::Pk7Buffer::box_span_mut(&mut bytes).encrypt();

    bytes
  }

  pub fn calculate_checksum(&self) -> u16 {
    let mut bytes = [0u8; getBoxSize()];
    self.write_box_bytes(&mut bytes);
    getBuffer().box_span(&bytes).calculate_checksum()
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
    let mut bytes = Box::new([0u8; getBoxSize()]);
    let mut buffer = getBuffer().box_span_mut(bytes.as_mut_slice());

    buffer.set_handler_name(trainer_name);
    buffer.set_is_current_handler(true);
    buffer.refresh_checksum();

    buffer.encrypt();

    bytes
  }

  pub fn is_empty_slot(bytes: &[u8]) -> bool {
    let mut owned = bytes.to_owned();
    let mut buffer = getBuffer().box_span_mut(&mut owned);
    buffer.decrypt();

    buffer.species_ndex() == 0
  }


  #[wasm_bindgen(js_name = fromDecryptedBytes)]
  pub fn from_bytes_wasm(bytes: Box<[u8]>) -> Result<Self, JsValue> {
    Self::from_bytes(&bytes).map_err(JsValue::from)
  }
}