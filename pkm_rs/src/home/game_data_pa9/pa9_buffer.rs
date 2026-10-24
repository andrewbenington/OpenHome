//use crate::bytes::{AsBytes, AsBytesMut};
use crate::bytes::AsBytes;
use crate::result::Result;
use crate::util;
use pkm_rs_resources::abilities::AbilityIndexWasm;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::MoveSlot;
use pkm_rs_types::{AbilityNumber, read_u16_le};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Offset {
    Scale = 0x00,
    Moves = 0x01,
    IsAlpha = 0x09,
    PlusMovesB = 0x0A,
    PlusMovesC = 0x16,
    Ball = 0x37,
    EggLocation = 0x38,
    MetLocation = 0x3A,
    ObedienceLevel = 0x3C,
    AbilityIndex = 0x3D,
    AbilityNumber = 0x3F,
}

impl From<Offset> for usize {
    fn from(offset: Offset) -> usize {
        offset as usize
    }
}

// ---------------------------------------------------------------------------
// PkhPa9Buffer<S> — generic over the byte storage so that a single impl block
// covers all getters, and a second (narrower) block covers setters.
//
//   PkhPa9BufferRef<'a>  = PkhPa9Buffer<&'a [u8]>       — read-only
//   PkhPa9BufferMut<'a>  = PkhPa9Buffer<&'a mut [u8]>   — read + write
// ---------------------------------------------------------------------------

//pub type PkhPa9BufferMut<'a> = PkhPa9Buffer<&'a mut [u8]>;

#[derive(Default, Clone, Copy)]
pub struct PkhPa9Buffer<S: AsRef<[u8]>>(S);

// ------------------------------------------------------------------
// Constructors — immutable
// ------------------------------------------------------------------

impl<'a> PkhPa9Buffer<&'a [u8]> {
    pub fn new(span: &'a [u8]) -> Self {
        assert_eq!(span.len(), super::HOME_PA9_DATA_SIZE);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Constructors — mutable
// ------------------------------------------------------------------

impl<'a> PkhPa9Buffer<&'a mut [u8]> {
    pub fn new_mut(span: &'a mut [u8]) -> Self {
        assert_eq!(span.len(), super::HOME_PA9_DATA_SIZE);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Accessors
// ------------------------------------------------------------------

impl<S: AsRef<[u8]>> PkhPa9Buffer<S> {
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

//impl<S: AsRef<[u8]> + AsMut<[u8]>> PkhPa9Buffer<S> {
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
//    fn set_u32_le(&mut self, offset: Offset, v: u32) {
//        let offset = offset as usize;
//        self.bytes_mut()[offset..offset + 4].copy_from_slice(&v.to_le_bytes());
//    }
//
//    fn set_u64_le(&mut self, offset: Offset, v: u64) {
//        let offset = offset as usize;
//        self.bytes_mut()[offset..offset + 8].copy_from_slice(&v.to_le_bytes());
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

impl<S: AsRef<[u8]>> PkhPa9Buffer<S> {
    fn bytes(&self) -> &[u8] {
        self.0.as_ref()
    }

    pub fn scale(&self) -> u8 {
        self.get_u8(Offset::Scale)
    }

    pub fn moves_raw(&self) -> [MoveSlot; 4] {
        let mut combined = [MoveSlot::empty(); 4];
        combined[0] = MoveSlot::from_u16(self.get_u16_le(Offset::Moves));
        combined[1] = MoveSlot::from_u16(read_u16_le!(self.bytes(), Offset::Moves as usize + 2));
        combined[2] = MoveSlot::from_u16(read_u16_le!(self.bytes(), Offset::Moves as usize + 4));
        combined[3] = MoveSlot::from_u16(read_u16_le!(self.bytes(), Offset::Moves as usize + 6));
        combined
    }

    pub fn is_alpha(&self) -> bool {
        self.get_flag(Offset::IsAlpha, 0)
    }

    pub fn plus_flags_za_b_raw(&self) -> [u8; 12] {
        self.get_array(Offset::PlusMovesB)
    }

    pub fn plus_flags_za_c_raw(&self) -> [u8; 33] {
        self.get_array(Offset::PlusMovesC)
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

    pub fn obedience_level(&self) -> u8 {
        self.get_u8(Offset::ObedienceLevel)
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
// Setters  (available only on PkhPa9BufferMut)
// ==================================================================

//impl<S: AsRef<[u8]> + AsMut<[u8]>> PkhPa9Buffer<S> {
//    fn bytes_mut(&mut self) -> &mut [u8] {
//        self.0.as_mut()
//    }
//}

// ==================================================================
// Trait impls
// ==================================================================

impl<S: AsRef<[u8]>> AsBytes for PkhPa9Buffer<S> {
    fn as_bytes(&self) -> &[u8] {
        self.0.as_ref()
    }
}

//impl<S: AsRef<[u8]> + AsMut<[u8]>> AsBytesMut for PkhPa9Buffer<S> {
//    fn as_bytes_mut(&mut self) -> &mut [u8] {
//        self.0.as_mut()
//    }
//}
