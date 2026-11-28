#![allow(unused_variables)]

use super::PK2PolishedCrystalSpeciesAndForm;
use crate::bytes::{AsBytes, AsBytesMut};

#[cfg(feature = "wasm")]
use crate::checksum::{Checksum, ChecksumU16Le, RefreshChecksum};
use crate::result::{Error, Result};
use crate::rom_hacks::polished_crystal::abilities::PolishedCrystalAbility;
use crate::util;
use arbitrary_int::u7;
use pkm_rs_resources::abilities::AbilityIndexWasm;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveDataOffsets, MoveSlots, PpUpStorage};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{
  AbilityNumber, BinaryGender, Dvs, Gender, HyperTraining, OriginGame, PokeDate, Pokerus, Stats8,
};
use pkm_rs_types::{Language, Stats16Le};
use pkm_rs_types::{read_u16_le, read_u32_le};

const CHECKSUM_OFFSET: usize = 6;
const MOVE_DATA_OFFSETS: MoveDataOffsets = MoveDataOffsets {
  moves: 2,
  pp: 22,
  pp_ups: 22,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Offset {
  SpeciesForm = 0,
  HeldItem = 1,
  Move1 = 2,
  Move2 = 3,
  Move3 = 4,
  Move4 = 5,
  TrainerId = 6,
  Exp = 8,
  Evs = 0x0B,
  Dvs = 0x11,
  PpUpData = 0x16,
  FriendshipOrEggCycles = 0x17,
  Pokerus = 0x18,
  TrainerInfo = 0x19,
  LevelCaught = 0x1A,
  LocationCaught = 0x1B,
  Level = 0x1C,
  HyperTraining = 0x1D,
  Nickname = 0x29,
  TrainerName = 0x2A,
  Checksum = 0x20,
  HandlerFriendship,
  HandlerName,
  TrainerFriendship,

  ShininessAbilityNature = 20,
  IsCurrentHandler = 9996,
  HandlerGender = 9995,
  GameOfOrigin = 9994,
  MetLevelTrainerGender = 9993,
  CurrentHp = 9992,
  Stats = 9991,
  Language = 9990,
  StatusCondition = 9989,
  EggDate = 9988,
  MetDate = 9987,
  EggLocation = 9986,
  MetLocation = 9985,
  Ball = 9984,
  IsEgg = 21,
}

impl From<Offset> for usize {
  fn from(offset: Offset) -> usize {
    offset as usize
  }
}

// ---------------------------------------------------------------------------
// PK2PolishedCrystalBuffer<S> — generic over the byte storage so that a single impl block
// covers all getters, and a second (narrower) block covers setters.
//
//   PK2PolishedCrystalBufferRef<'a>  = PK2PolishedCrystalBuffer<&'a [u8]>       — read-only
//   PK2PolishedCrystalBufferMut<'a>  = PK2PolishedCrystalBuffer<&'a mut [u8]>   — read + write
// ---------------------------------------------------------------------------

#[cfg(feature = "wasm")]
pub type PK2PolishedCrystalBufferMut<'a> = PK2PolishedCrystalBuffer<&'a mut [u8]>;

#[cfg(feature = "wasm")]
#[derive(Default, Clone, Copy)]
pub struct PK2PolishedCrystalBuffer<S: AsRef<[u8]>>(S);

impl<S: AsRef<[u8]>> PK2PolishedCrystalBuffer<S> {
  // todo!() Fix this
  pub(crate) fn shininess(&self) -> bool {
    self.get_u8(Offset::ShininessAbilityNature) == 1
  }
}

// ------------------------------------------------------------------
// Constructors — immutable
// ------------------------------------------------------------------
#[cfg(feature = "wasm")]

impl<'a> PK2PolishedCrystalBuffer<&'a [u8]> {
  pub fn box_span(span: &'a [u8]) -> Self {
    debug_assert_eq!(span.len(), super::BOX_SIZE);
    Self(span)
  }

  pub fn party_span(span: &'a [u8]) -> Self {
    debug_assert_eq!(span.len(), super::PARTY_SIZE);
    Self(span)
  }

  pub fn box_or_party_span(span: &'a [u8]) -> Self {
    debug_assert!(span.len() == super::PARTY_SIZE || span.len() == super::BOX_SIZE);
    Self(span)
  }
}

// ------------------------------------------------------------------
// Constructors — mutable
// ------------------------------------------------------------------
#[cfg(feature = "wasm")]
impl<'a> PK2PolishedCrystalBuffer<&'a mut [u8]> {
  pub fn box_span_mut(span: &'a mut [u8]) -> Self {
    assert_eq!(span.len(), super::BOX_SIZE);
    Self(span)
  }

  pub fn party_span_mut(span: &'a mut [u8]) -> Self {
    assert_eq!(span.len(), super::PARTY_SIZE);
    Self(span)
  }

  pub fn box_or_party_span_mut(span: &'a mut [u8]) -> Self {
    debug_assert!(span.len() == super::PARTY_SIZE || span.len() == super::BOX_SIZE);
    Self(span)
  }
}

// ------------------------------------------------------------------
// Accessors
// ------------------------------------------------------------------

#[cfg(feature = "wasm")]
impl<S: AsRef<[u8]>> PK2PolishedCrystalBuffer<S> {
  fn get_u8(&self, offset: Offset) -> u8 {
    let offset = offset as usize;
    self.bytes()[offset]
  }

  fn get_u16_le(&self, offset: Offset) -> u16 {
    let offset = offset as usize;
    read_u16_le!(self.bytes(), offset)
  }

  fn get_u32_le(&self, offset: Offset) -> u32 {
    let offset = offset as usize;
    read_u32_le!(self.bytes(), offset)
  }

  fn get_flag(&self, offset: Offset, bit_index: usize) -> bool {
    util::get_flag(self.bytes(), offset as usize, bit_index)
  }

  fn get_array<const N: usize>(&self, offset: Offset) -> [u8; N] {
    let offset = offset as usize;
    self.bytes()[offset..offset + N].try_into().unwrap()
  }
}

#[cfg(feature = "wasm")]
impl<S: AsRef<[u8]> + AsMut<[u8]>> PK2PolishedCrystalBuffer<S> {
  fn set_u8(&mut self, offset: Offset, v: u8) {
    let offset = offset as usize;
    self.bytes_mut()[offset] = v;
  }

  fn set_u16_le(&mut self, offset: Offset, v: u16) {
    let offset = offset as usize;
    self.bytes_mut()[offset..offset + 2].copy_from_slice(&v.to_le_bytes());
  }

  fn set_u32_le(&mut self, offset: Offset, v: u32) {
    let offset = offset as usize;
    self.bytes_mut()[offset..offset + 4].copy_from_slice(&v.to_le_bytes());
  }

  fn set_flag(&mut self, offset: Offset, bit_index: usize, v: bool) {
    let offset = offset as usize;
    util::set_flag(self.bytes_mut(), offset, bit_index, v);
  }

  fn set_array<const N: usize>(&mut self, offset: Offset, v: &[u8; N]) {
    let offset = offset as usize;
    self.bytes_mut()[offset..offset + N].copy_from_slice(v);
  }
}

// ------------------------------------------------------------------
// Shared methods
// ------------------------------------------------------------------

#[cfg(feature = "wasm")]
impl<S: AsRef<[u8]>> PK2PolishedCrystalBuffer<S> {
  fn bytes(&self) -> &[u8] {
    self.0.as_ref()
  }

  pub fn is_party(&self) -> bool {
    self.bytes().len() == super::PARTY_SIZE
  }

  pub fn checksum(&self) -> u16 {
    self.get_u16_le(Offset::Checksum)
  }

  pub fn species_ndex(&self) -> u8 {
    self.get_u8(Offset::SpeciesForm)
  }

  pub fn form_index(&self) -> u16 {
    self.get_u16_le(Offset::SpeciesForm)
  }

  pub fn encrypt(&self) {}

  pub fn decrypt(&self) {}

  pub fn decrypted(&mut self) -> &mut Self {
    self
  }

  pub fn species_and_form(&self) -> Result<PK2PolishedCrystalSpeciesAndForm> {
    let species = self.species_ndex();
    let form = (self.get_u8(Offset::IsEgg) & 0x1f) - 1;

    let species_and_form = SpeciesForm::new(species as u16, form as u16)?;

    PK2PolishedCrystalSpeciesAndForm::try_new(species_and_form)
      .ok_or(Error::form_index(species_and_form))
  }

  pub fn held_item_index(&self) -> u16 {
    self.get_u16_le(Offset::HeldItem)
  }

  pub fn trainer_id(&self) -> u16 {
    self.get_u16_le(Offset::TrainerId)
  }

  pub fn secret_id(&self) -> u16 {
    // A placeholder value, due to the lack of secret ID's in Pokémon Polished Crystal.
    0u16
  }

  pub fn exp(&self) -> u32 {
    self.get_u32_le(Offset::Exp)
  }

  pub fn ability_index_raw(&self) -> u8 {
    self.get_u8(Offset::ShininessAbilityNature)
  }

  pub fn ability_index(&self) -> Result<AbilityIndexWasm> {
    Ok(AbilityIndexWasm::try_from(self.ability_index_raw())?)
  }

  pub fn nature_raw(&self) -> u8 {
    // !todo() Peform the bit math to get the nature
    self.get_u8(Offset::ShininessAbilityNature)
  }

  pub fn nature(&self) -> Result<NatureIndex> {
    // !todo() Peform the bit math to get the nature
    Ok(NatureIndex::try_from(self.nature_raw())?)
  }

  pub fn gender(&self) -> Gender {
    todo!()
  }

  pub fn evs_raw(&self) -> [u8; 6] {
    self.get_array(Offset::Evs)
  }

  pub fn evs(&self) -> Stats8 {
    Stats8::from_bytes(self.evs_raw())
  }

  pub fn pokerus(&self) -> Pokerus {
    Pokerus::from_byte(self.get_u8(Offset::Pokerus))
  }

  pub fn nickname_raw(&self) -> [u8; 26] {
    self.get_array(Offset::Nickname)
  }

  pub fn nickname(&self) -> SizedUtf16String<26> {
    SizedUtf16String::<26>::from_bytes(self.nickname_raw())
  }

  pub fn move_slots(&self) -> MoveSlots {
    MoveSlots::from_bytes(self.bytes(), MOVE_DATA_OFFSETS, PpUpStorage::FourBytes)
  }

  fn dvs_egg_nicknamed_raw(&self) -> [u8; 4] {
    todo!()
  }

  pub fn dvs(&self) -> Dvs {
    Dvs::from_bytes(&self.get_array::<2>(Offset::Dvs))
  }

  pub fn is_egg(&self) -> bool {
    todo!()
  }

  pub fn is_nicknamed(&self) -> bool {
    todo!()
  }

  fn handler_name_raw(&self) -> [u8; 26] {
    todo!()
  }

  pub fn handler_name(&self) -> SizedUtf16String<26> {
    SizedUtf16String::<26>::from_bytes(self.handler_name_raw())
  }

  fn handler_gender_raw(&self) -> bool {
    self.get_flag(Offset::HandlerGender, 0)
  }

  pub fn handler_gender(&self) -> BinaryGender {
    self.handler_gender_raw().into()
  }

  pub fn is_current_handler(&self) -> bool {
    self.get_flag(Offset::IsCurrentHandler, 0)
  }

  pub fn handler_friendship(&self) -> u8 {
    todo!()
  }

  fn trainer_name_raw(&self) -> [u8; 26] {
    self.get_array(Offset::TrainerName)
  }

  pub fn trainer_name(&self) -> SizedUtf16String<26> {
    SizedUtf16String::<26>::from_bytes(self.trainer_name_raw())
  }

  pub fn trainer_friendship(&self) -> u8 {
    todo!()
  }

  pub fn trainer_affection(&self) -> u8 {
    todo!()
  }

  fn egg_date_raw(&self) -> [u8; 3] {
    self.get_array(Offset::EggDate)
  }

  pub fn egg_date(&self) -> Option<PokeDate> {
    PokeDate::from_bytes_optional(self.egg_date_raw())
  }

  fn met_date_raw(&self) -> [u8; 3] {
    self.get_array(Offset::MetDate)
  }

  pub fn met_date(&self) -> PokeDate {
    PokeDate::from_bytes(self.met_date_raw())
  }

  pub fn egg_location_index(&self) -> u16 {
    self.get_u16_le(Offset::EggLocation)
  }

  pub fn met_location_index(&self) -> u16 {
    self.get_u16_le(Offset::MetLocation)
  }

  fn ball_raw(&self) -> u8 {
    self.get_u8(Offset::Ball)
  }

  pub fn ball(&self) -> Ball {
    Ball::from(self.ball_raw())
  }

  fn met_level_raw(&self) -> u8 {
    u7::extract_u8(self.get_u8(Offset::MetLevelTrainerGender), 0).into()
  }

  pub fn met_level(&self) -> u8 {
    self.met_level_raw()
  }

  pub fn trainer_gender_raw(&self) -> bool {
    self.get_flag(Offset::MetLevelTrainerGender, 7)
  }

  pub fn trainer_gender(&self) -> BinaryGender {
    self.trainer_gender_raw().into()
  }

  fn hyper_training_raw(&self) -> u8 {
    self.get_u8(Offset::HyperTraining)
  }

  pub fn hyper_training(&self) -> HyperTraining {
    HyperTraining::from_byte(self.hyper_training_raw())
  }

  fn game_of_origin_raw(&self) -> u8 {
    self.get_u8(Offset::GameOfOrigin)
  }

  pub fn game_of_origin(&self) -> OriginGame {
    OriginGame::from(self.game_of_origin_raw())
  }

  fn language_raw(&self) -> u8 {
    self.get_u8(Offset::Language)
  }

  pub fn language(&self) -> Result<Language> {
    Ok(Language::try_from(self.language_raw())?)
  }

  // ------------------------------------------------------------------
  // Party-only fields  (offsets 232 – 259)
  // ------------------------------------------------------------------

  pub fn status_condition(&self) -> u32 {
    self.get_u32_le(Offset::StatusCondition)
  }

  pub fn current_hp(&self) -> u16 {
    self.get_u16_le(Offset::CurrentHp)
  }

  pub fn stats_raw(&self) -> [u8; 12] {
    self.get_array(Offset::Stats)
  }

  pub fn stats(&self) -> Stats16Le {
    Stats16Le::from_bytes(self.stats_raw())
  }

  // ------------------------------------------------------------------
  // Encryption
  // ------------------------------------------------------------------
}

// ==================================================================
// Setters  (available only on PK2PolishedCrystalBufferMut)
// ==================================================================

#[cfg(feature = "wasm")]
impl<S: AsRef<[u8]> + AsMut<[u8]>> PK2PolishedCrystalBuffer<S> {
  fn bytes_mut(&mut self) -> &mut [u8] {
    self.0.as_mut()
  }

  pub fn set_checksum(&mut self, v: u16) {
    self.set_u16_le(Offset::Checksum, v);
  }

  pub fn set_species_ndex(&mut self, v: u16) {
    self.set_u16_le(Offset::SpeciesForm, v);
  }

  pub fn set_form_index(&mut self, v: u8) {
    todo!()
  }

  pub fn set_species_and_form(&mut self, v: SpeciesForm) {
    self.set_species_ndex(v.get_ndex() as u16);
    self.set_form_index(v.get_form_index() as u8);
  }

  pub fn set_held_item_index(&mut self, v: u16) {
    self.set_u16_le(Offset::HeldItem, v);
  }

  pub fn set_trainer_id(&mut self, v: u16) {
    self.set_u16_le(Offset::TrainerId, v);
  }

  pub fn set_secret_id(&mut self, v: u16) {
    return;
  }

  pub fn set_exp(&mut self, v: u32) {
    self.set_u32_le(Offset::Exp, v);
  }

  fn set_ability_index_raw(&mut self, v: u8) {
    self.set_u8(Offset::ShininessAbilityNature, v);
  }

  pub fn set_ability_index(&mut self, v: PolishedCrystalAbility) {
    self.set_ability_index_raw(u8::from(v));
  }

  pub fn set_ability_num(&mut self, v: AbilityNumber) {
    self.set_ability_num_raw(v.to_byte());
  }

  fn set_nature_raw(&mut self, v: u8) {
    self.set_u8(Offset::ShininessAbilityNature, v);
  }

  pub fn set_nature(&mut self, v: NatureIndex) {
    self.set_nature_raw(v.to_byte());
  }

  pub fn set_is_fateful_encounter(&mut self, v: bool) {
    todo!()
  }

  pub fn set_gender(&mut self, v: Gender) {
    todo!()
  }

  fn set_evs_raw(&mut self, v: &[u8; 6]) {
    self.set_array(Offset::Evs, v);
  }

  pub fn set_evs(&mut self, v: Stats8) {
    self.set_evs_raw(&v.to_bytes());
  }

  pub fn set_pokerus(&mut self, v: Pokerus) {
    self.set_u8(Offset::Pokerus, v.to_byte());
  }

  fn set_nickname_raw(&mut self, v: &[u8; 26]) {
    self.set_array(Offset::Nickname, v);
  }

  pub fn set_nickname(&mut self, v: &SizedUtf16String<26>) {
    self.set_nickname_raw(&v.bytes());
  }

  pub fn set_move_slots(&mut self, v: &MoveSlots) {
    v.write_spans(self.bytes_mut(), MOVE_DATA_OFFSETS, PpUpStorage::FourBytes);
  }

  pub fn set_dvs(&mut self, v: &Dvs) {
    todo!()
  }

  pub fn set_is_egg(&mut self, v: bool) {
    todo!()
  }

  pub fn set_is_nicknamed(&mut self, v: bool) {
    todo!()
  }

  fn set_handler_name_raw(&mut self, v: &[u8; 26]) {
    self.set_array(Offset::HandlerName, v);
  }

  pub fn set_handler_name(&mut self, v: &SizedUtf16String<26>) {
    self.set_handler_name_raw(&v.bytes());
  }

  pub fn set_handler_gender_raw(&mut self, v: bool) {
    self.set_flag(Offset::HandlerGender, 0, v);
  }

  pub fn set_handler_gender(&mut self, v: BinaryGender) {
    self.set_handler_gender_raw(v.into());
  }

  pub fn set_is_current_handler(&mut self, v: bool) {
    self.set_flag(Offset::IsCurrentHandler, 0, v);
  }

  pub fn set_handler_friendship(&mut self, v: u8) {
    self.set_u8(Offset::HandlerFriendship, v);
  }

  fn set_trainer_name_raw(&mut self, v: &[u8; 26]) {
    self.set_array(Offset::TrainerName, v);
  }

  pub fn set_trainer_name(&mut self, v: &SizedUtf16String<26>) {
    self.set_trainer_name_raw(&v.bytes());
  }

  pub fn set_trainer_friendship(&mut self, v: u8) {
    self.set_u8(Offset::TrainerFriendship, v);
  }

  fn set_egg_date_raw(&mut self, v: [u8; 3]) {
    self.set_array(Offset::EggDate, &v);
  }

  pub fn set_egg_date(&mut self, v: Option<PokeDate>) {
    self.set_egg_date_raw(PokeDate::to_bytes_optional(v));
  }

  fn set_met_date_raw(&mut self, v: [u8; 3]) {
    self.set_array(Offset::MetDate, &v);
  }

  pub fn set_met_date(&mut self, v: PokeDate) {
    self.set_met_date_raw(v.to_bytes());
  }

  pub fn set_egg_location_index(&mut self, v: u16) {
    self.set_u16_le(Offset::EggLocation, v);
  }

  pub fn set_met_location_index(&mut self, v: u16) {
    self.set_u16_le(Offset::MetLocation, v);
  }

  fn set_ball_raw(&mut self, v: u8) {
    self.set_u8(Offset::Ball, v);
  }

  pub fn set_ball(&mut self, v: Ball) {
    self.set_ball_raw(v as u8);
  }

  fn set_met_level_raw(&mut self, v: u8) {
    self.bytes_mut()[Offset::MetLevelTrainerGender as usize] |= v & 0x7F;
  }

  pub fn set_met_level(&mut self, v: u8) {
    self.set_met_level_raw(v);
  }

  fn set_trainer_gender_raw(&mut self, v: bool) {
    let bytes = self.bytes_mut();
    util::set_flag(bytes, Offset::MetLevelTrainerGender as usize, 7, v);
  }

  pub fn set_trainer_gender(&mut self, v: BinaryGender) {
    self.set_trainer_gender_raw(v.into());
  }

  fn set_hyper_training_raw(&mut self, v: u8) {
    self.set_u8(Offset::HyperTraining, v);
  }

  pub fn set_hyper_training(&mut self, v: HyperTraining) {
    self.set_hyper_training_raw(v.to_byte());
  }

  fn set_game_of_origin_raw(&mut self, v: u8) {
    self.set_u8(Offset::GameOfOrigin, v);
  }

  pub fn set_game_of_origin(&mut self, v: OriginGame) {
    self.set_game_of_origin_raw(v as u8);
  }

  fn set_language_raw(&mut self, v: u8) {
    self.set_u8(Offset::Language, v);
  }

  pub fn set_language(&mut self, v: Language) {
    self.set_language_raw(v as u8);
  }

  // ------------------------------------------------------------------
  // Party-only fields  (offsets 232 – 259)
  // ------------------------------------------------------------------

  pub fn set_status_condition(&mut self, v: u32) {
    self.set_u32_le(Offset::StatusCondition, v);
  }

  pub fn set_current_hp(&mut self, v: u16) {
    self.set_u16_le(Offset::CurrentHp, v);
  }

  fn set_stats_raw(&mut self, v: [u8; 12]) {
    self.set_array(Offset::Stats, &v);
  }

  pub fn set_stats(&mut self, v: Stats16Le) {
    self.set_stats_raw(v.to_bytes());
  }
}

// ==================================================================
// Trait impls
// ==================================================================

#[cfg(feature = "wasm")]
impl<S: AsRef<[u8]>> AsBytes for PK2PolishedCrystalBuffer<S> {
  fn as_bytes(&self) -> &[u8] {
    self.0.as_ref()
  }
}

#[cfg(feature = "wasm")]
impl<S: AsRef<[u8]> + AsMut<[u8]>> AsBytesMut for PK2PolishedCrystalBuffer<S> {
  fn as_bytes_mut(&mut self) -> &mut [u8] {
    self.0.as_mut()
  }
}

#[cfg(feature = "wasm")]
impl<S: AsRef<[u8]>> Checksum for PK2PolishedCrystalBuffer<S> {
  type A = ChecksumU16Le;
  const SPAN_START: usize = 8;
  const SPAN_END: usize = super::BOX_SIZE;
}

#[cfg(feature = "wasm")]
impl<S: AsRef<[u8]> + AsMut<[u8]>> RefreshChecksum for PK2PolishedCrystalBuffer<S> {
  const STORED_OFFSET: usize = CHECKSUM_OFFSET;
}
