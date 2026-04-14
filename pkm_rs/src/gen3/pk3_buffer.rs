use crate::checksum::{Checksum, ChecksumU16Le, RefreshChecksum};
use crate::result::Result;
use crate::traits::bytes::{AsBytes, AsBytesMut};
use crate::util;
use arbitrary_int::u4;
use arbitrary_int::u7;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::MoveSlots;
use pkm_rs_resources::ribbons::Gen3RibbonSet;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{
    BinaryGender, ContestStats, MarkingsFourShapes, OriginGame, SimpleAbilityNumber, Stats8,
};
use pkm_rs_types::{Language, Stats16Le};
use pkm_rs_types::{read_u16_le, read_u32_le};

const CHECKSUM_OFFSET: usize = 6;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum Offset {
    PersonalityValue = 0x0,
    TrainerId = 0x4,
    SecretId = 0x6,
    Nickname = 0x8,
    Language = 0x12,
    TrainerName = 0x14,
    Markings = 0x1b,
    Checksum = 0x1c,
    Sanity = 0x1e,
    NationalDex = 0x20,
    HeldItem = 0x22,
    Exp = 0x24,
    MovePpUps = 0x28,
    TrainerFriendship = 0x29,
    Moves = 0x2c,
    MovePp = 0x34,
    Evs = 0x38,
    Contest = 0x3e,
    Pokerus = 0x44,
    MetLocation = 0x45,
    MetData = 0x46,
    IvsEggAbility = 0x48,
    RibbonsFatefulEncounter = 0x4c,
    StatusCondition = 0x50,
    StatLevel = 0x54,
    HeldMailId = 0x55,
    CurrentHp = 0x56,
    Stats = 0x58,
}

impl From<Offset> for usize {
    fn from(offset: Offset) -> usize {
        offset as usize
    }
}

// ---------------------------------------------------------------------------
// Pk3Buffer<S> — generic over the byte storage so that a single impl block
// covers all getters, and a second (narrower) block covers setters.
//
//   Pk3BufferRef<'a>  = Pk3Buffer<&'a [u8]>       — read-only
//   Pk3BufferMut<'a>  = Pk3Buffer<&'a mut [u8]>   — read + write
// ---------------------------------------------------------------------------

pub type Pk3BufferRef<'a> = Pk3Buffer<&'a [u8]>;
pub type Pk3BufferMut<'a> = Pk3Buffer<&'a mut [u8]>;

#[derive(Default)]
pub struct Pk3Buffer<S: AsRef<[u8]>>(S);

// ------------------------------------------------------------------
// Constructors — immutable
// ------------------------------------------------------------------

impl<'a> Pk3Buffer<&'a [u8]> {
    pub fn box_span(span: &'a [u8]) -> Self {
        assert_eq!(span.len(), super::BOX_SIZE);
        Self(span)
    }

    pub fn party_span(span: &'a [u8]) -> Self {
        assert_eq!(span.len(), super::PARTY_SIZE);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Methods — mutable
// ------------------------------------------------------------------

impl<'a> Pk3Buffer<&'a mut [u8]> {
    pub fn box_span_mut(span: &'a mut [u8]) -> Self {
        assert_eq!(span.len(), super::BOX_SIZE);
        Self(span)
    }

    pub fn party_span_mut(span: &'a mut [u8]) -> Self {
        assert_eq!(span.len(), super::PARTY_SIZE);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Accessors
// ------------------------------------------------------------------

impl<S: AsRef<[u8]>> Pk3Buffer<S> {
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

impl<S: AsRef<[u8]> + AsMut<[u8]>> Pk3Buffer<S> {
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

impl<S: AsRef<[u8]>> Pk3Buffer<S> {
    fn bytes(&self) -> &[u8] {
        self.0.as_ref()
    }

    pub fn is_party(&self) -> bool {
        self.bytes().len() == super::PARTY_SIZE
    }

    pub fn sanity(&self) -> u16 {
        self.get_u16_le(Offset::Sanity)
    }

    pub fn checksum(&self) -> u16 {
        self.get_u16_le(Offset::Checksum)
    }

    pub fn species_ndex(&self) -> u16 {
        self.get_u16_le(Offset::NationalDex)
    }

    pub fn held_item_index(&self) -> u16 {
        self.get_u16_le(Offset::HeldItem)
    }

    pub fn trainer_id(&self) -> u16 {
        self.get_u16_le(Offset::TrainerId)
    }

    pub fn secret_id(&self) -> u16 {
        self.get_u16_le(Offset::SecretId)
    }

    pub fn exp(&self) -> u32 {
        self.get_u32_le(Offset::Exp)
    }

    fn ability_num_raw(&self) -> bool {
        self.get_flag(Offset::IvsEggAbility, 31)
    }

    pub fn ability_num(&self) -> SimpleAbilityNumber {
        self.ability_num_raw().into()
    }

    fn markings_raw(&self) -> u8 {
        self.get_u8(Offset::Markings)
    }

    pub fn markings(&self) -> MarkingsFourShapes {
        MarkingsFourShapes::from_byte(self.markings_raw())
    }

    pub fn personality_value(&self) -> u32 {
        self.get_u32_le(Offset::PersonalityValue)
    }

    pub fn is_fateful_encounter(&self) -> bool {
        self.get_flag(Offset::RibbonsFatefulEncounter, 31)
    }

    pub fn evs_raw(&self) -> [u8; 6] {
        self.get_array(Offset::Evs)
    }

    pub fn evs(&self) -> Stats8 {
        Stats8::from_bytes(self.evs_raw())
    }

    pub fn contest_raw(&self) -> [u8; 6] {
        self.get_array(Offset::Contest)
    }

    pub fn contest(&self) -> ContestStats {
        ContestStats::from_bytes(self.contest_raw())
    }

    pub fn pokerus_byte(&self) -> u8 {
        self.get_u8(Offset::Pokerus)
    }

    pub fn ribbons_fateful_encounter_raw(&self) -> [u8; 4] {
        self.get_array(Offset::RibbonsFatefulEncounter)
    }

    pub fn ribbons(&self) -> Gen3RibbonSet {
        Gen3RibbonSet::from_u32(self.get_u32_le(Offset::RibbonsFatefulEncounter))
    }

    pub fn nickname_raw(&self) -> [u8; 26] {
        self.get_array(Offset::Nickname)
    }

    pub fn nickname(&self) -> SizedUtf16String<26> {
        SizedUtf16String::<26>::from_bytes(self.nickname_raw())
    }

    pub fn move_slots(&self) -> MoveSlots {
        MoveSlots::from_bytes(self.bytes(), super::MOVE_DATA_OFFSETS)
    }

    fn ivs_egg_ability_raw(&self) -> [u8; 4] {
        self.get_array(Offset::IvsEggAbility)
    }

    pub fn ivs(&self) -> Stats8 {
        Stats8::from_30_bits(self.ivs_egg_ability_raw())
    }

    pub fn is_egg(&self) -> bool {
        self.get_flag(Offset::IvsEggAbility, 30)
    }

    fn trainer_name_raw(&self) -> [u8; 26] {
        self.get_array(Offset::TrainerName)
    }

    pub fn trainer_name(&self) -> SizedUtf16String<26> {
        SizedUtf16String::<26>::from_bytes(self.trainer_name_raw())
    }

    pub fn trainer_friendship(&self) -> u8 {
        self.get_u8(Offset::TrainerFriendship)
    }

    pub fn met_location_index(&self) -> u16 {
        self.get_u16_le(Offset::MetLocation)
    }

    fn met_data_raw(&self) -> u16 {
        self.get_u16_le(Offset::MetData)
    }

    fn ball_raw(&self) -> u8 {
        u4::extract_u16(self.met_data_raw(), 11).into()
    }

    pub fn ball(&self) -> Ball {
        Ball::from(self.ball_raw())
    }

    pub fn met_level(&self) -> u8 {
        u7::extract_u16(self.met_data_raw(), 0).into()
    }

    pub fn trainer_gender_raw(&self) -> bool {
        self.get_flag(Offset::MetData, 15)
    }

    pub fn trainer_gender(&self) -> BinaryGender {
        self.trainer_gender_raw().into()
    }

    fn game_of_origin_raw(&self) -> u8 {
        u4::extract_u16(self.met_data_raw(), 7).into()
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

    pub fn stat_level(&self) -> u8 {
        self.get_u8(Offset::StatLevel)
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
}

// ==================================================================
// Setters  (available only on Pk3BufferMut)
// ==================================================================

impl<S: AsRef<[u8]> + AsMut<[u8]>> Pk3Buffer<S> {
    fn bytes_mut(&mut self) -> &mut [u8] {
        self.0.as_mut()
    }

    pub fn reset_sanity(&mut self) {
        self.set_u16_le(Offset::Sanity, 0);
    }

    pub fn set_checksum(&mut self, v: u16) {
        self.set_u16_le(Offset::Checksum, v);
    }

    pub fn set_species_ndex(&mut self, v: u16) {
        self.set_u16_le(Offset::NationalDex, v);
    }

    pub fn set_held_item_index(&mut self, v: u16) {
        self.set_u16_le(Offset::HeldItem, v);
    }

    pub fn set_trainer_id(&mut self, v: u16) {
        self.set_u16_le(Offset::TrainerId, v);
    }

    pub fn set_secret_id(&mut self, v: u16) {
        self.set_u16_le(Offset::SecretId, v);
    }

    pub fn set_exp(&mut self, v: u32) {
        self.set_u32_le(Offset::Exp, v);
    }

    fn set_ability_num_raw(&mut self, v: bool) {
        self.set_flag(Offset::IvsEggAbility, 31, v);
    }

    pub fn set_ability_num(&mut self, v: SimpleAbilityNumber) {
        self.set_ability_num_raw(v.to_bool());
    }

    fn set_markings_raw(&mut self, v: u8) {
        self.set_u8(Offset::Markings, v);
    }

    pub fn set_markings(&mut self, v: MarkingsFourShapes) {
        self.set_markings_raw(v.to_byte());
    }

    pub fn set_personality_value(&mut self, v: u32) {
        self.set_u32_le(Offset::PersonalityValue, v);
    }

    pub fn set_is_fateful_encounter(&mut self, v: bool) {
        self.set_flag(Offset::RibbonsFatefulEncounter, 31, v);
    }

    fn set_evs_raw(&mut self, v: &[u8; 6]) {
        self.set_array(Offset::Evs, v);
    }

    pub fn set_evs(&mut self, v: Stats8) {
        self.set_evs_raw(&v.to_bytes());
    }

    fn set_contest_raw(&mut self, v: &[u8; 6]) {
        self.set_array(Offset::Contest, v);
    }

    pub fn set_contest(&mut self, v: ContestStats) {
        self.set_contest_raw(&v.to_bytes());
    }

    pub fn set_pokerus_byte(&mut self, v: u8) {
        self.set_u8(Offset::Pokerus, v);
    }

    fn set_ribbons_fateful_encounter_raw(&mut self, v: &[u8; 4]) {
        self.set_array(Offset::RibbonsFatefulEncounter, v);
    }

    pub fn set_ribbons(&mut self, v: Gen3RibbonSet) {
        let is_fateful_encounter = self.is_fateful_encounter();
        self.set_ribbons_fateful_encounter_raw(&v.to_u32().to_le_bytes());
        self.set_is_fateful_encounter(is_fateful_encounter);
    }

    fn set_nickname_raw(&mut self, v: &[u8; 26]) {
        self.set_array(Offset::Nickname, v);
    }

    pub fn set_nickname(&mut self, v: &SizedUtf16String<26>) {
        self.set_nickname_raw(&v.bytes());
    }

    pub fn set_move_slots(&mut self, v: &MoveSlots) {
        v.write_spans(self.bytes_mut(), super::MOVE_DATA_OFFSETS);
    }

    pub fn set_ivs(&mut self, v: &Stats8) {
        v.write_30_bits(self.bytes_mut(), Offset::IvsEggAbility as usize);
    }

    pub fn set_is_egg(&mut self, v: bool) {
        self.set_flag(Offset::IvsEggAbility, 30, v);
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

    pub fn set_met_location_index(&mut self, v: u16) {
        self.set_u16_le(Offset::MetLocation, v);
    }

    fn set_met_data_raw(&mut self, v: u16) {
        self.set_u16_le(Offset::MetData, v);
    }

    pub fn set_ball(&mut self, v: Ball) {
        let mut met_data = self.met_data_raw();
        met_data &= !(0b1111 << 11);
        met_data |= ((v as u16) & 0b1111) << 11;
        self.set_met_data_raw(met_data);
    }

    pub fn set_met_level(&mut self, v: u8) {
        let mut met_data = self.met_data_raw();
        met_data &= !(0b1111111);
        met_data |= (v as u16) & 0b1111111;
        self.set_met_data_raw(met_data);
    }

    fn set_trainer_gender_raw(&mut self, v: bool) {
        self.set_flag(Offset::MetData, 15, v);
    }

    pub fn set_trainer_gender(&mut self, v: BinaryGender) {
        self.set_trainer_gender_raw(v.into());
    }

    pub fn set_game_of_origin(&mut self, v: OriginGame) {
        let mut met_data = self.met_data_raw();
        met_data &= !(0b1111 << 7);
        met_data |= ((v as u16) & 0b1111) << 7;
        self.set_met_data_raw(met_data);
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

    pub fn set_stat_level(&mut self, v: u8) {
        self.set_u8(Offset::StatLevel, v);
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

impl<S: AsRef<[u8]>> AsBytes for Pk3Buffer<S> {
    fn as_bytes(&self) -> &[u8] {
        self.0.as_ref()
    }
}

impl<S: AsRef<[u8]> + AsMut<[u8]>> AsBytesMut for Pk3Buffer<S> {
    fn as_bytes_mut(&mut self) -> &mut [u8] {
        self.0.as_mut()
    }
}

impl<S: AsRef<[u8]>> Checksum for Pk3Buffer<S> {
    type A = ChecksumU16Le;
    const SPAN_START: usize = 8;
    const SPAN_END: usize = super::BOX_SIZE;
}

impl<S: AsRef<[u8]> + AsMut<[u8]>> RefreshChecksum for Pk3Buffer<S> {
    const STORED_OFFSET: usize = CHECKSUM_OFFSET;
}
