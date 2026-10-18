//use crate::bytes::{AsBytes, AsBytesMut};
use crate::bytes::AsBytes;
use crate::result::Result;
use pkm_rs_resources::abilities::AbilityIndexWasm;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveDataOffsets, MoveSlot, MoveSlots, PpUpStorage};
use pkm_rs_types::{AbilityNumber, Pokerus, read_u16_le};

const MOVE_DATA_OFFSETS: MoveDataOffsets = MoveDataOffsets {
    moves: 0x00,
    pp: 0x08,
    pp_ups: 0x0C,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Offset {
    RelearnMoves = 0x10,
    TmFlags = 0x18,
    Ball = 0x26,
    EggLocation = 0x27,
    MetLocation = 0x29,
    Pokerus = 0x2B,
    AbilityIndex = 0x2C,
    AbilityNumber = 0x2E,
}

impl From<Offset> for usize {
    fn from(offset: Offset) -> usize {
        offset as usize
    }
}

// ---------------------------------------------------------------------------
// PkhPb8Buffer<S> — generic over the byte storage so that a single impl block
// covers all getters, and a second (narrower) block covers setters.
//
//   PkhPb8BufferRef<'a>  = PkhPb8Buffer<&'a [u8]>       — read-only
//   PkhPb8BufferMut<'a>  = PkhPb8Buffer<&'a mut [u8]>   — read + write
// ---------------------------------------------------------------------------

//pub type PkhPb8BufferMut<'a> = PkhPb8Buffer<&'a mut [u8]>;

#[derive(Default, Clone, Copy)]
pub struct PkhPb8Buffer<S: AsRef<[u8]>>(S);

// ------------------------------------------------------------------
// Constructors — immutable
// ------------------------------------------------------------------

impl<'a> PkhPb8Buffer<&'a [u8]> {
    pub fn new(span: &'a [u8]) -> Self {
        assert_eq!(span.len(), super::HOME_PB8_DATA_SIZE);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Constructors — mutable
// ------------------------------------------------------------------

//impl<'a> PkhPb8Buffer<&'a mut [u8]> {
//    pub fn new_mut(span: &'a mut [u8]) -> Self {
//        assert_eq!(span.len(), super::HOME_PB8_DATA_SIZE);
//        Self(span)
//    }
//}

// ------------------------------------------------------------------
// Accessors
// ------------------------------------------------------------------

impl<S: AsRef<[u8]>> PkhPb8Buffer<S> {
    fn get_u8(&self, offset: Offset) -> u8 {
        let offset = offset as usize;
        self.bytes()[offset]
    }

    fn get_u16_le(&self, offset: Offset) -> u16 {
        let offset = offset as usize;
        read_u16_le!(self.bytes(), offset)
    }

    fn get_array<const N: usize>(&self, offset: Offset) -> [u8; N] {
        let offset = offset as usize;
        self.bytes()[offset..offset + N].try_into().unwrap()
    }
}

//impl<S: AsRef<[u8]> + AsMut<[u8]>> PkhPb8Buffer<S> {
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

impl<S: AsRef<[u8]>> PkhPb8Buffer<S> {
    fn bytes(&self) -> &[u8] {
        self.0.as_ref()
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

    pub fn tm_flags_bdsp_raw(&self) -> [u8; 14] {
        self.get_array(Offset::TmFlags)
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
// Setters  (available only on PkhPb8BufferMut)
// ==================================================================

//impl<S: AsRef<[u8]> + AsMut<[u8]>> PkhPb8Buffer<S> {
//    fn bytes_mut(&mut self) -> &mut [u8] {
//        self.0.as_mut()
//    }
//}

// ==================================================================
// Trait impls
// ==================================================================

impl<S: AsRef<[u8]>> AsBytes for PkhPb8Buffer<S> {
    fn as_bytes(&self) -> &[u8] {
        self.0.as_ref()
    }
}

//impl<S: AsRef<[u8]> + AsMut<[u8]>> AsBytesMut for PkhPb8Buffer<S> {
//    fn as_bytes_mut(&mut self) -> &mut [u8] {
//        self.0.as_mut()
//    }
//}
