//use crate::bytes::{AsBytes, AsBytesMut};
use crate::bytes::AsBytes;
use crate::result::Result;
use crate::util;
use pkm_rs_resources::abilities::AbilityIndexWasm;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveDataOffsets, MoveSlot, MoveSlots, PpUpStorage};
use pkm_rs_types::{AbilityNumber, Pokerus, read_u16_le, read_u32_le};

const MOVE_DATA_OFFSETS: MoveDataOffsets = MoveDataOffsets {
    moves: 0x05,
    pp: 0x0D,
    pp_ups: 0x11,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Offset {
    CanGigantamax = 0x00,
    Sociability = 0x01,
    RelearnMoves = 0x15,
    DynamaxLevel = 0x1D,
    //PokeJob
    Fullness = 0x2C,
    TrFlagsSwSh = 0x2D,
    Palma = 0x3B,
    Ball = 0x3F,
    EggLocation = 0x40,
    MetLocation = 0x42,
    Pokerus = 0x44,
    AbilityIndex = 0x45,
    AbilityNumber = 0x47,
}

impl From<Offset> for usize {
    fn from(offset: Offset) -> usize {
        offset as usize
    }
}

// ---------------------------------------------------------------------------
// PkhPk8Buffer<S> — generic over the byte storage so that a single impl block
// covers all getters, and a second (narrower) block covers setters.
//
//   PkhPk8BufferRef<'a>  = PkhPk8Buffer<&'a [u8]>       — read-only
//   PkhPk8BufferMut<'a>  = PkhPk8Buffer<&'a mut [u8]>   — read + write
// ---------------------------------------------------------------------------

//pub type PkhPk8BufferMut<'a> = PkhPk8Buffer<&'a mut [u8]>;

#[derive(Default, Clone, Copy)]
pub struct PkhPk8Buffer<S: AsRef<[u8]>>(S);

// ------------------------------------------------------------------
// Constructors — immutable
// ------------------------------------------------------------------

impl<'a> PkhPk8Buffer<&'a [u8]> {
    pub fn new(span: &'a [u8]) -> Self {
        assert_eq!(span.len(), super::HOME_PK8_DATA_SIZE);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Constructors — mutable
// ------------------------------------------------------------------

//impl<'a> PkhPk8Buffer<&'a mut [u8]> {
//    pub fn new_mut(span: &'a mut [u8]) -> Self {
//        assert_eq!(span.len(), super::HOME_PK8_DATA_SIZE);
//        Self(span)
//    }
//}

// ------------------------------------------------------------------
// Accessors
// ------------------------------------------------------------------

impl<S: AsRef<[u8]>> PkhPk8Buffer<S> {
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

//impl<S: AsRef<[u8]> + AsMut<[u8]>> PkhPk8Buffer<S> {
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

impl<S: AsRef<[u8]>> PkhPk8Buffer<S> {
    fn bytes(&self) -> &[u8] {
        self.0.as_ref()
    }

    pub fn can_gigantamax(&self) -> bool {
        self.get_flag(Offset::CanGigantamax, 0)
    }

    pub fn sociability(&self) -> u8 {
        self.get_u8(Offset::Sociability)
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

    pub fn dynamax_level(&self) -> u8 {
        self.get_u8(Offset::DynamaxLevel)
    }

    // TODO (maybe): PokeJob

    pub fn fullness(&self) -> u8 {
        self.get_u8(Offset::Fullness)
    }

    pub fn tr_flags_swsh_raw(&self) -> [u8; 14] {
        self.get_array(Offset::TrFlagsSwSh)
    }

    pub fn palma(&self) -> u32 {
        self.get_u32_le(Offset::Palma)
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
// Setters  (available only on PkhPk8BufferMut)
// ==================================================================

//impl<S: AsRef<[u8]> + AsMut<[u8]>> PkhPk8Buffer<S> {
//    fn bytes_mut(&mut self) -> &mut [u8] {
//        self.0.as_mut()
//    }
//}

// ==================================================================
// Trait impls
// ==================================================================

impl<S: AsRef<[u8]>> AsBytes for PkhPk8Buffer<S> {
    fn as_bytes(&self) -> &[u8] {
        self.0.as_ref()
    }
}

//impl<S: AsRef<[u8]> + AsMut<[u8]>> AsBytesMut for PkhPk8Buffer<S> {
//    fn as_bytes_mut(&mut self) -> &mut [u8] {
//        self.0.as_mut()
//    }
//}
