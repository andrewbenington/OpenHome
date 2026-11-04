use crate::bytes::{AsBytes, AsBytesMut};
use crate::result::Result;
use pkm_rs_resources::abilities::AbilityIndexWasm;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveDataOffsets, MoveSlot, MoveSlots, PpUpStorage};
use pkm_rs_types::{AbilityNumber, Pokerus, Stats8, read_u16_le, read_u32_le};

const MOVE_DATA_OFFSETS: MoveDataOffsets = MoveDataOffsets {
    moves: 0x07,
    pp: 0x0F,
    pp_ups: 0x13,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Offset {
    Avs = 0x00,
    ResortEventState = 0x06,
    RelearnMoves = 0x17,
    Spirit = 0x27,
    Mood = 0x28,
    Fullness = 0x29,
    Rank = 0x2A,
    ReceivedYear = 0x2B,
    ReceivedMonth = 0x2C,
    ReceivedDay = 0x2D,
    ReceivedHour = 0x2E,
    ReceivedMinute = 0x2F,
    ReceivedSecond = 0x30,
    Enjoyment = 0x31,
    GeoPadding = 0x32,
    Ball = 0x36,
    EggLocation = 0x37,
    MetLocation = 0x39,
    Pokerus = 0x3B,
    AbilityIndex = 0x3C,
    AbilityNumber = 0x3E,
}

impl From<Offset> for usize {
    fn from(offset: Offset) -> usize {
        offset as usize
    }
}

// ---------------------------------------------------------------------------
// PkhPb7Buffer<S> — generic over the byte storage so that a single impl block
// covers all getters, and a second (narrower) block covers setters.
//
//   PkhPb7BufferRef<'a>  = PkhPb7Buffer<&'a [u8]>       — read-only
//   PkhPb7BufferMut<'a>  = PkhPb7Buffer<&'a mut [u8]>   — read + write
// ---------------------------------------------------------------------------

pub type PkhPb7BufferMut<'a> = PkhPb7Buffer<&'a mut [u8]>;

#[derive(Default, Clone, Copy)]
pub struct PkhPb7Buffer<S: AsRef<[u8]>>(S);

// ------------------------------------------------------------------
// Constructors — immutable
// ------------------------------------------------------------------

impl<'a> PkhPb7Buffer<&'a [u8]> {
    pub fn new(span: &'a [u8]) -> Self {
        assert_eq!(span.len(), super::HOME_PB7_DATA_SIZE);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Constructors — mutable
// ------------------------------------------------------------------

impl<'a> PkhPb7Buffer<&'a mut [u8]> {
    pub fn new_mut(span: &'a mut [u8]) -> Self {
        assert_eq!(span.len(), super::HOME_PB7_DATA_SIZE);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Accessors
// ------------------------------------------------------------------

impl<S: AsRef<[u8]>> PkhPb7Buffer<S> {
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

    fn get_array<const N: usize>(&self, offset: Offset) -> [u8; N] {
        let offset = offset as usize;
        self.bytes()[offset..offset + N].try_into().unwrap()
    }
}

impl<S: AsRef<[u8]> + AsMut<[u8]>> PkhPb7Buffer<S> {
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

    fn set_array<const N: usize>(&mut self, offset: Offset, v: &[u8; N]) {
        let offset = offset as usize;
        self.bytes_mut()[offset..offset + N].copy_from_slice(v);
    }
}

// ------------------------------------------------------------------
// Shared methods
// ------------------------------------------------------------------

impl<S: AsRef<[u8]>> PkhPb7Buffer<S> {
    fn bytes(&self) -> &[u8] {
        self.0.as_ref()
    }

    fn avs_raw(&self) -> [u8; 6] {
        self.get_array(Offset::Avs)
    }

    pub fn avs(&self) -> Stats8 {
        Stats8::from_bytes(self.avs_raw())
    }

    pub fn resort_event_state(&self) -> u8 {
        self.get_u8(Offset::ResortEventState)
    }

    pub fn move_slots(&self) -> MoveSlots {
        MoveSlots::from_bytes(self.bytes(), MOVE_DATA_OFFSETS, PpUpStorage::FourBytes)
    }

    pub fn relearn_move_raw(&self, idx: usize) -> [u8; 2] {
        let off = Offset::RelearnMoves as usize + idx * 2;
        self.bytes()[off..off + 2].try_into().unwrap()
    }

    pub fn relearn_move(&self, idx: usize) -> MoveSlot {
        MoveSlot::from_le_bytes(self.relearn_move_raw(idx))
    }

    // HeightAbsolute and WeightAbsolute are calculated from the mon's height/weight and species data.

    pub fn spirit(&self) -> u8 {
        self.get_u8(Offset::Spirit)
    }

    pub fn mood(&self) -> u8 {
        self.get_u8(Offset::Mood)
    }

    pub fn fullness(&self) -> u8 {
        self.get_u8(Offset::Fullness)
    }

    pub fn rank(&self) -> u8 {
        self.get_u8(Offset::Rank)
    }

    pub fn received_date_year(&self) -> u8 {
        self.get_u8(Offset::ReceivedYear)
    }

    pub fn received_date_month(&self) -> u8 {
        self.get_u8(Offset::ReceivedMonth)
    }

    pub fn received_date_day(&self) -> u8 {
        self.get_u8(Offset::ReceivedDay)
    }

    pub fn received_date_hour(&self) -> u8 {
        self.get_u8(Offset::ReceivedHour)
    }

    pub fn received_date_minute(&self) -> u8 {
        self.get_u8(Offset::ReceivedMinute)
    }

    pub fn received_date_second(&self) -> u8 {
        self.get_u8(Offset::ReceivedSecond)
    }

    pub fn enjoyment(&self) -> u8 {
        self.get_u8(Offset::Enjoyment)
    }

    pub fn geo_padding(&self) -> u32 {
        self.get_u32_le(Offset::GeoPadding)
    }

    fn ball_raw(&self) -> u8 {
        self.get_u8(Offset::Ball)
    }

    pub fn ball(&self) -> Ball {
        Ball::from(self.ball_raw())
    }

    pub fn egg_location_index(&self) -> u16 {
        self.get_u16_le(Offset::EggLocation)
    }

    pub fn met_location_index(&self) -> u16 {
        self.get_u16_le(Offset::MetLocation)
    }

    pub fn pokerus(&self) -> Pokerus {
        Pokerus::from_byte(self.get_u8(Offset::Pokerus))
    }

    fn ability_index_raw(&self) -> u16 {
        self.get_u16_le(Offset::AbilityIndex)
    }

    pub fn ability_index(&self) -> Result<AbilityIndexWasm> {
        Ok(AbilityIndexWasm::try_from(self.ability_index_raw())?)
    }

    pub fn ability_num(&self) -> Result<AbilityNumber> {
        Ok(AbilityNumber::from_u8_first_three_bits(
            self.get_u8(Offset::AbilityNumber),
        )?)
    }
}

// ==================================================================
// Setters  (available only on PkhPb7BufferMut)
// ==================================================================

impl<S: AsRef<[u8]> + AsMut<[u8]>> PkhPb7Buffer<S> {
    fn bytes_mut(&mut self) -> &mut [u8] {
        self.0.as_mut()
    }

    fn set_avs_raw(&mut self, v: &[u8; 6]) {
        self.set_array(Offset::Avs, v);
    }

    pub fn set_avs(&mut self, v: Stats8) {
        self.set_avs_raw(&v.to_bytes());
    }

    pub fn set_resort_event_status(&mut self, v: u8) {
        self.set_u8(Offset::ResortEventState, v);
    }

    pub fn set_move_slots(&mut self, v: &MoveSlots) {
        v.write_spans(self.bytes_mut(), MOVE_DATA_OFFSETS, PpUpStorage::FourBytes);
    }

    fn set_relearn_move_raw(&mut self, idx: usize, v: [u8; 2]) {
        let off = Offset::RelearnMoves as usize + idx * 2;
        self.bytes_mut()[off..off + 2].copy_from_slice(&v);
    }

    pub fn set_relearn_move(&mut self, idx: usize, v: MoveSlot) {
        self.set_relearn_move_raw(idx, v.to_le_bytes());
    }

    pub fn set_spirit(&mut self, v: u8) {
        self.set_u8(Offset::Spirit, v);
    }

    pub fn set_mood(&mut self, v: u8) {
        self.set_u8(Offset::Mood, v);
    }

    pub fn set_fullness(&mut self, v: u8) {
        self.set_u8(Offset::Fullness, v);
    }

    pub fn set_rank(&mut self, v: u8) {
        self.set_u8(Offset::Rank, v);
    }

    pub fn set_received_date_year(&mut self, v: u8) {
        self.set_u8(Offset::ReceivedYear, v);
    }

    pub fn set_received_date_month(&mut self, v: u8) {
        self.set_u8(Offset::ReceivedMonth, v);
    }

    pub fn set_received_date_day(&mut self, v: u8) {
        self.set_u8(Offset::ReceivedDay, v);
    }

    pub fn set_received_date_hour(&mut self, v: u8) {
        self.set_u8(Offset::ReceivedHour, v);
    }

    pub fn set_received_date_minute(&mut self, v: u8) {
        self.set_u8(Offset::ReceivedMinute, v);
    }

    pub fn set_received_date_second(&mut self, v: u8) {
        self.set_u8(Offset::ReceivedSecond, v);
    }

    pub fn set_enjoyment(&mut self, v: u8) {
        self.set_u8(Offset::Enjoyment, v);
    }

    pub fn set_geo_padding(&mut self, v: u32) {
        self.set_u32_le(Offset::GeoPadding, v);
    }

    fn set_ball_raw(&mut self, v: u8) {
        self.set_u8(Offset::Ball, v);
    }

    pub fn set_ball(&mut self, v: Ball) {
        self.set_ball_raw(v as u8);
    }

    pub fn set_egg_location_index(&mut self, v: u16) {
        self.set_u16_le(Offset::EggLocation, v);
    }

    pub fn set_met_location_index(&mut self, v: u16) {
        self.set_u16_le(Offset::MetLocation, v);
    }

    pub fn set_pokerus(&mut self, v: Pokerus) {
        self.set_u8(Offset::Pokerus, v.to_byte());
    }

    fn set_ability_index_raw(&mut self, v: u16) {
        self.set_u16_le(Offset::AbilityIndex, v);
    }

    pub fn set_ability_index(&mut self, v: AbilityIndexWasm) {
        self.set_ability_index_raw(u16::from(v));
    }

    pub fn set_ability_num(&mut self, v: AbilityNumber) {
        self.set_u8(Offset::AbilityNumber, v.to_byte());
    }
}

// ==================================================================
// Trait impls
// ==================================================================

impl<S: AsRef<[u8]>> AsBytes for PkhPb7Buffer<S> {
    fn as_bytes(&self) -> &[u8] {
        self.0.as_ref()
    }
}

impl<S: AsRef<[u8]> + AsMut<[u8]>> AsBytesMut for PkhPb7Buffer<S> {
    fn as_bytes_mut(&mut self) -> &mut [u8] {
        self.0.as_mut()
    }
}
