use crate::bytes::{AsBytes, AsBytesMut};
use crate::checksum::{Checksum, ChecksumU16Le, RefreshChecksum};
use crate::encryption::BlockCrypto;
use crate::result::Result;
use crate::strings::{Gen3Encoding, Gen3NicknameString, Gen3TrainerString};
use crate::util;

use arbitrary_int::{u2, u11};
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveSlots, PpUpStorage};
use pkm_rs_resources::ribbons::Gen3RibbonSet;
use pkm_rs_types::{
    BinaryGender, ContestStats, Ivs, MarkingsFourShapes, OriginGame, Pokerus, AbilityNumber,
    Stats8,
};
use pkm_rs_types::{Language, Stats16Le};
use pkm_rs_types::{read_u16_le, read_u32_le};

mod emerald_expansion;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum Offset {
    PersonalityValue = 0x0,
    TrainerId = 0x4,
    SecretId = 0x6,
    NicknameFirstTen = 0x8,
    Flags0x12 = 0x12,
    Flags0x13 = 0x13,
    TrainerName = 0x14,
    Markings = 0x1B,
    Checksum = 0x1C,
    Substruct0 = 0x20,
    //Substruct1 = 0x80,
    Move1 = 0x80,
    Move2 = 0x82,
    Move3 = 0x84,
    Move4 = 0x86,
    //Substruct2 = 0xE0,
    Evs = 0xE0,
    Contest = 0xE6,
    Pokerus = 0xEB,
    MetLocation = 0xEC,
    MetData = 0xED,  // also offset for Dynamax level, OT gender
    IvsEggGmax = 0xEF,
    RibbonsShadow = 0xF3,
    AbilityFateful = 0xF4,
}  // these are probably wrong. test!

impl From<Offset> for usize {
    fn from(offset: Offset) -> usize {
        offset as usize
    }
}

// ---------------------------------------------------------------------------
// Pk3ExpnBuffer<S> — generic over the byte storage so that a single impl block
// covers all getters, and a second (narrower) block covers setters.
//
//   Pk3ExpnBufferRef<'a>  = Pk3ExpnBuffer<&'a [u8]>       — read-only
//   Pk3ExpnBufferMut<'a>  = Pk3ExpnBuffer<&'a mut [u8]>   — read + write
// ---------------------------------------------------------------------------

pub type Pk3ExpnBufferRef<'a> = Pk3ExpnBuffer<&'a [u8]>;
pub type Pk3ExpnBufferMut<'a> = Pk3ExpnBuffer<&'a mut [u8]>;

#[derive(Default, Clone, Copy)]
pub struct Pk3ExpnBuffer<S: AsRef<[u8]>>(S);

// ------------------------------------------------------------------
// Constructors — immutable
// ------------------------------------------------------------------

impl<'a> Pk3ExpnBuffer<&'a [u8]> {
    pub fn box_span(span: &'a [u8]) -> Self {
        assert_eq!(span.len(), super::BOX_SIZE);
        Self(span)
    }

    pub fn party_span(span: &'a [u8]) -> Self {
        assert_eq!(span.len(), super::PARTY_SIZE);
        Self(span)
    }

    pub fn box_or_party_span(span: &'a [u8]) -> Self {
        debug_assert!(span.len() == super::PARTY_SIZE || span.len() == super::BOX_SIZE);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Methods — mutable
// ------------------------------------------------------------------

impl<'a> Pk3ExpnBuffer<&'a mut [u8]> {
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

impl<S: AsRef<[u8]>> Pk3ExpnBuffer<S> {
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

impl<S: AsRef<[u8]> + AsMut<[u8]>> Pk3ExpnBuffer<S> {
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

impl<S: AsRef<[u8]>> Pk3ExpnBuffer<S> {
    fn bytes(&self) -> &[u8] {
        self.0.as_ref()
    }

    pub fn is_party(&self) -> bool {
        self.bytes().len() == super::PARTY_SIZE
    }

    pub fn checksum(&self) -> u16 {
        self.get_u16_le(Offset::Checksum)
    }

    //pub fn emerald_ex_species_index(&self) -> u16 {
    //    self.get_u16_le(Offset::Substruct0, 0)
    //}

    //pub fn held_item_index(&self) -> u16 {
    //    self.get_u16_le(Offset::Substruct0, 16)
    //}

    pub fn trainer_id(&self) -> u16 {
        self.get_u16_le(Offset::TrainerId)
    }

    pub fn secret_id(&self) -> u16 {
        self.get_u16_le(Offset::SecretId)
    }

    pub fn trainer_and_secret_id(&self) -> u32 {
        self.get_u32_le(Offset::TrainerId)
    }

    pub fn is_bad_egg(&self) -> bool {
        self.get_flag(Offset::Flags0x13, 0)
    }

    pub fn has_species(&self) -> bool {
        self.get_flag(Offset::Flags0x13, 1)
    }

    pub fn is_egg_flag_1(&self) -> bool {
        self.get_flag(Offset::Flags0x13, 2)
    }

    pub fn is_egg_flag_2(&self) -> bool {
        self.get_flag(Offset::IvsEggGmax, 30)
    }

    pub fn exp(&self) -> u32 {
        self.get_u32_le(Offset::Exp)
    }

    pub fn ability_num_raw(&self) -> u8 {
        u2::extract_u8(self.get_u8(Offset::AbilityFateful), 1).into()
    }

    pub fn ability_num(&self) -> AbilityNumber {
        Ok(u2::extract_u8(self.get_u8(Offset::AbilityFateful), 1).try_into()?)
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
        self.get_flag(Offset::AbilityFateful, 3)
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

    pub fn pokerus(&self) -> Pokerus {
        Pokerus::from_byte(self.get_u8(Offset::Pokerus))
    }

    pub fn ribbons_shadow_raw(&self) -> [u8; 4] {
        self.get_array(Offset::RibbonsShadow)
    }

    pub fn ribbons(&self) -> Gen3RibbonSet {
        Gen3RibbonSet::from_u32(self.get_u32_le(Offset::RibbonsShadow))
    }

    pub fn nickname_first_ten_raw(&self) -> [u8; 10] {
        self.get_array(Offset::NicknameFirstTen)
    }

    //pub fn nickname_11_raw(&self) -> u8 {
    //    self.get_u8()
    //}

    //pub fn nickname_12_raw(&self) -> u8 {
    //    self.get_u8()
    //}

    pub fn nickname(&self, encoding: Gen3Encoding) -> Gen3NicknameString<12> {
        Gen3NicknameString::<12>::from_raw(
            self.nickname_first_ten_raw().extend([nickname_11_raw(), nickname_12_raw()]),
            encoding
        )
    }

    //pub fn move_slot_1_raw(&self) -> u16 {}

    //pub fn move_slot_2_raw(&self) -> u16 {}

    //pub fn move_slot_3_raw(&self) -> u16 {}

    //pub fn move_slot_4_raw(&self) -> u16 {}

    //pub fn move_slots(&self) -> MoveSlots {}

    fn ivs_egg_gmax_raw(&self) -> [u8; 4] {
        self.get_array(Offset::IvsEggGmax)
    }

    pub fn ivs(&self) -> Ivs {
        Ivs::from_30_bits(self.ivs_egg_ability_raw())
    }

    fn trainer_name_raw(&self) -> [u8; 7] {
        self.get_array(Offset::TrainerName)
    }

    pub fn trainer_name(&self, encoding: Gen3Encoding) -> Gen3TrainerString<7> {
        Gen3TrainerString::<7>::from_raw(self.trainer_name_raw(), encoding)
    }

    //pub fn trainer_friendship(&self) -> u8 {}

    pub fn met_location_index(&self) -> u8 {
        self.get_u8(Offset::MetLocation)
    }

    //fn ball_raw(&self) -> u8 {}

    //pub fn ball(&self) -> Ball {
    //    Ball::from(self.ball_raw())
    //}

    fn met_data_raw(&self) -> u16 {
        self.get_u16_le(Offset::MetData)
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

    fn dynamax_level_raw(&self) -> u8 {
        u4::extract_u16(self.met_data_raw(), 11).into()
    }

    // ------------------------------------------------------------------
    // Encryption
    // ------------------------------------------------------------------

    fn block_crypto(&self) -> BlockCrypto {
        BlockCrypto::gen3(self.personality_value(), self.trainer_and_secret_id())
    }

    pub fn encrypted_copy(&self) -> Box<[u8]> {
        self.block_crypto().to_encrypted_bytes(self.0.as_ref())
    }

    pub fn decrypted_copy(&self) -> Box<[u8]> {
        self.block_crypto().to_decrypted_bytes(self.0.as_ref())
    }
}
