use super::MOVE_FLAG_BYTE_LENGTH;
//use crate::bytes::{AsBytes, AsBytesMut};
use crate::bytes::AsBytes;
//use crate::gen8_swsh::Pk8AbilityIndex;
use crate::result::Result;
use crate::util;
use pkm_rs_resources::abilities::AbilityIndexWasm;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveSlot, MoveSlots};
use pkm_rs_types::{AbilityNumber, Pokerus, Stats8, read_u16_le};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Offset {
    IsAlpha = 0x00,
    IsNoble = 0x01,
    AlphaMove = 0x02,
    Scale = 0x04,
    Moves = 0x05,
    MovePp = 0x0D,
    RelearnMoves = 0x11,
    Gvs = 0x19,
    //HeightAbsolute = 0x1F,
    //WeightAbsolute = 0x23,
    Ball = 0x27,
    TutorMoves = 0x28,
    MasteredMoves = 0x30,
    EggLocation = 0x38,
    MetLocation = 0x3A,
    Pokerus = 0x3C,
    AbilityIndex = 0x3D,
    AbilityNumber = 0x3F,
}

impl From<Offset> for usize {
    fn from(offset: Offset) -> usize {
        offset as usize
    }
}

// ---------------------------------------------------------------------------
// PkhPa8Buffer<S> — generic over the byte storage so that a single impl block
// covers all getters, and a second (narrower) block covers setters.
//
//   PkhPa8BufferRef<'a>  = PkhPa8Buffer<&'a [u8]>       — read-only
//   PkhPa8BufferMut<'a>  = PkhPa8Buffer<&'a mut [u8]>   — read + write
// ---------------------------------------------------------------------------

//pub type PkhPa8BufferMut<'a> = PkhPa8Buffer<&'a mut [u8]>;

#[derive(Default, Clone, Copy)]
pub struct PkhPa8Buffer<S: AsRef<[u8]>>(S);

// ------------------------------------------------------------------
// Constructors — immutable
// ------------------------------------------------------------------

impl<'a> PkhPa8Buffer<&'a [u8]> {
    pub fn new(span: &'a [u8]) -> Self {
        assert_eq!(span.len(), super::HOME_PA8_DATA_SIZE);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Constructors — mutable
// ------------------------------------------------------------------

//impl<'a> PkhPa8Buffer<&'a mut [u8]> {
//    pub fn new_mut(span: &'a mut [u8]) -> Self {
//        assert_eq!(span.len(), super::HOME_PA8_DATA_SIZE);
//        Self(span)
//    }
//}

// ------------------------------------------------------------------
// Accessors
// ------------------------------------------------------------------

impl<S: AsRef<[u8]>> PkhPa8Buffer<S> {
    fn get_u8(&self, offset: Offset) -> u8 {
        let offset = offset as usize;
        self.bytes()[offset]
    }

    fn get_u16_le(&self, offset: Offset) -> u16 {
        let offset = offset as usize;
        read_u16_le!(self.bytes(), offset)
    }

    fn get_flag(&self, offset: Offset, bit_index: usize) -> bool {
        util::get_flag(self.bytes(), offset as usize, bit_index)
    }

    fn get_array<const N: usize>(&self, offset: Offset) -> [u8; N] {
        let offset = offset as usize;
        self.bytes()[offset..offset + N].try_into().unwrap()
    }
}

//impl<S: AsRef<[u8]> + AsMut<[u8]>> PkhPa8Buffer<S> {
//    fn set_u8(&mut self, offset: Offset, v: u8) {
//        let offset = offset as usize;
//        self.bytes_mut()[offset] = v;
//    }
//
//    fn set_u16_le(&mut self, offset: Offset, v: u16) {
//        let offset = offset as usize;
//        self.bytes_mut()[offset..offset + 2].copy_from_slice(&v.to_le_bytes());
//    }
//
//    fn set_flag(&mut self, offset: Offset, bit_index: usize, v: bool) {
//        let offset = offset as usize;
//        util::set_flag(self.bytes_mut(), offset, bit_index, v);
//    }
//
//    fn set_array<const N: usize>(&mut self, offset: Offset, v: &[u8; N]) {
//        let offset = offset as usize;
//        self.bytes_mut()[offset..offset + N].copy_from_slice(v);
//    }
//}

// ------------------------------------------------------------------
// Shared methods
// ------------------------------------------------------------------

impl<S: AsRef<[u8]>> PkhPa8Buffer<S> {
    fn bytes(&self) -> &[u8] {
        self.0.as_ref()
    }

    pub fn is_alpha(&self) -> bool {
        self.get_flag(Offset::IsAlpha, 0)
    }

    pub fn is_noble(&self) -> bool {
        self.get_flag(Offset::IsNoble, 0)
    }

    pub fn alpha_move(&self) -> MoveSlot {
        MoveSlot::from_u16(self.get_u16_le(Offset::AlphaMove))
    }

    pub fn scale(&self) -> u8 {
        self.get_u8(Offset::Scale)
    }

    fn moves_raw(&self) -> [MoveSlot; 4] {
        let mut combined = [MoveSlot::empty(); 4];
        combined[0] = MoveSlot::from_u16(self.get_u16_le(Offset::Moves));
        combined[1] = MoveSlot::from_u16(read_u16_le!(self.bytes(), Offset::Moves as usize + 2));
        combined[2] = MoveSlot::from_u16(read_u16_le!(self.bytes(), Offset::Moves as usize + 4));
        combined[3] = MoveSlot::from_u16(read_u16_le!(self.bytes(), Offset::Moves as usize + 6));
        combined
    }

    fn moves_pp_raw(&self) -> [u8; 4] {
        self.get_array(Offset::MovePp)
    }

    pub fn move_slots(&self) -> MoveSlots {
        // HOME doesn't store PP Ups for PLA, so just set 0.
        MoveSlots::from_arrays(self.moves_raw(), self.moves_pp_raw(), [0; 4])
    }

    pub fn relearn_move_raw(&self, idx: usize) -> [u8; 2] {
        let off = Offset::RelearnMoves as usize + idx * 2;
        self.bytes()[off..off + 2].try_into().unwrap()
    }

    pub fn relearn_move(&self, idx: usize) -> MoveSlot {
        MoveSlot::from_le_bytes(self.relearn_move_raw(idx))
    }

    fn gvs_raw(&self) -> [u8; 6] {
        self.get_array(Offset::Gvs)
    }

    pub fn gvs(&self) -> Stats8 {
        Stats8::from_bytes(self.gvs_raw())
    }

    // HeightAbsolute and WeightAbsolute are calculated from the mon's height/weight and species data.

    fn ball_raw(&self) -> u8 {
        self.get_u8(Offset::Ball)
    }

    pub fn ball(&self) -> Ball {
        Ball::from(self.ball_raw())
    }

    pub fn tutor_flags_la_raw(&self) -> [u8; MOVE_FLAG_BYTE_LENGTH] {
        self.get_array(Offset::TutorMoves)
    }

    pub fn mastered_flags_la_raw(&self) -> [u8; MOVE_FLAG_BYTE_LENGTH] {
        self.get_array(Offset::MasteredMoves)
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

    pub fn ability_index_raw(&self) -> u16 {
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
// Setters  (available only on PkhPa8BufferMut)
// ==================================================================

//impl<S: AsRef<[u8]> + AsMut<[u8]>> PkhPa8Buffer<S> {
//    fn bytes_mut(&mut self) -> &mut [u8] {
//        self.0.as_mut()
//    }
//
//    pub fn set_is_alpha(&mut self, v: bool) {
//        self.set_flag(Offset::IsAlpha, 0, v);
//    }
//
//    pub fn set_is_noble(&mut self, v: bool) {
//        self.set_flag(Offset::IsNoble, 0, v);
//    }
//
//    fn set_alpha_move_raw(&mut self, v: [u8; 2]) {
//        let off = Offset::AlphaMove as usize;
//        self.bytes_mut()[off..off + 2].copy_from_slice(&v);
//    }
//
//    pub fn set_alpha_move(&mut self, v: MoveSlot) {
//        self.set_alpha_move_raw(v.to_le_bytes());
//    }
//
//    pub fn set_scale(&mut self, v: u8) {
//        self.set_u8(Offset::Scale, v);
//    }
//
//    // TODO: moves, pp
//
//    fn set_gvs_raw(&mut self, v: &[u8; 6]) {
//        self.set_array(Offset::Gvs, v);
//    }
//
//    pub fn set_gvs(&mut self, v: Stats8) {
//        self.set_gvs_raw(&v.to_bytes());
//    }
//
//    // TODO: HeightAbsolute, WeightAbsolute
//
//    fn set_ball_raw(&mut self, v: u8) {
//        self.set_u8(Offset::Ball, v);
//    }
//
//    pub fn set_ball(&mut self, v: Ball) {
//        self.set_ball_raw(v as u8);
//    }
//
//    pub fn set_tutor_flags_la(&mut self, v: &[u8; MOVE_FLAG_BYTE_LENGTH]) {
//        self.set_array(Offset::TutorMoves, v);
//    }
//
//    pub fn set_mastered_flags_la(&mut self, v: &[u8; MOVE_FLAG_BYTE_LENGTH]) {
//        self.set_array(Offset::MasteredMoves, v);
//    }
//
//    pub fn set_egg_location_index(&mut self, v: u16) {
//        self.set_u16_le(Offset::EggLocation, v);
//    }
//
//    pub fn set_met_location_index(&mut self, v: u16) {
//        self.set_u16_le(Offset::MetLocation, v);
//    }
//
//    pub fn set_pokerus(&mut self, v: Pokerus) {
//        self.set_u8(Offset::Pokerus, v.to_byte());
//    }
//
//    fn set_ability_index_raw(&mut self, v: u16) {
//        self.set_u16_le(Offset::AbilityIndex, v);
//    }
//
//    pub fn set_ability_index(&mut self, v: Pk8AbilityIndex) {
//        self.set_ability_index_raw(u16::from(v));
//    }
//
//    pub fn set_ability_num(&mut self, v: AbilityNumber) {
//        self.set_u8(Offset::AbilityNumber, v.to_byte());
//    }
//}

// ==================================================================
// Trait impls
// ==================================================================

impl<S: AsRef<[u8]>> AsBytes for PkhPa8Buffer<S> {
    fn as_bytes(&self) -> &[u8] {
        self.0.as_ref()
    }
}

//impl<S: AsRef<[u8]> + AsMut<[u8]>> AsBytesMut for PkhPa8Buffer<S> {
//    fn as_bytes_mut(&mut self) -> &mut [u8] {
//        self.0.as_mut()
//    }
//}
