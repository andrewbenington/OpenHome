// https://github.com/rh-hideout/pokeemerald-expansion/blob/master/include/pokemon.h

use crate::bytes::{AsBytes, AsBytesMut};
use crate::result::Result;
use crate::strings::{Gen3Encoding, Gen3TrainerString};
use crate::util;

use arbitrary_int::{u2, u3, u4, u5, u6, u7, u10, u11, u14, u21};
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveSlot, MoveSlots};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::Gen3RibbonSet;
use pkm_rs_types::{
    AbilityNumber, BinaryGender, ContestStats, Ivs, Language, MarkingsFourShapes, OriginGame,
    Pokerus, Stats8, read_u16_le, read_u32_le,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Offset {
    // BoxPokemon
    PersonalityValue = 0x0,
    TrainerId = 0x4,
    SecretId = 0x6,
    NicknameFirstTen = 0x8,
    Data0x12 = 0x12,
    Data0x13 = 0x13,
    TrainerName = 0x14,
    MarkingsStatus = 0x1B,
    Checksum = 0x1C,
    Data0x1E = 0x1E,
    // PokemonSubstruct0
    SpeciesTeraType = 0x20,
    HeldItem = 0x22,
    ExpNickname11 = 0x24,
    PpUps = 0x28,
    Friendship = 0x29,
    Data0x2A = 0x2A,
    // PokemonSubstruct1
    Move1 = 0x2C,
    Move2 = 0x2E,
    Move3 = 0x30,
    Move4 = 0x32,
    Pp1 = 0x34,
    Pp2 = 0x35,
    Pp3 = 0x36,
    Pp4 = 0x37,
    // PokemonSubstruct2
    Evs = 0x38,
    Contest = 0x3E,
    // PokemonSubstruct3
    Pokerus = 0x44,
    MetLocation = 0x45,
    Data0x46 = 0x46,
    IvsEggGmax = 0x48,
    Data0x4C = 0x4C,
}

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

//pub type Pk3ExpnBufferMut<'a> = Pk3ExpnBuffer<&'a mut [u8]>;

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

//impl<S: AsRef<[u8]> + AsMut<[u8]>> Pk3ExpnBuffer<S> {
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

impl<S: AsRef<[u8]>> Pk3ExpnBuffer<S> {
    fn bytes(&self) -> &[u8] {
        self.0.as_ref()
    }

    pub fn personality_value(&self) -> u32 {
        self.get_u32_le(Offset::PersonalityValue)
    }

    pub fn trainer_id(&self) -> u16 {
        self.get_u16_le(Offset::TrainerId)
    }

    pub fn secret_id(&self) -> u16 {
        self.get_u16_le(Offset::SecretId)
    }

    pub fn trainer_and_secret_id(&self) -> u32 {
        self.get_u32_le(Offset::TrainerId)
    }

    //fn nickname_first_ten_raw(&self) -> [u8; 10] {
    //    self.get_array(Offset::NicknameFirstTen)
    //}

    // TODO: extract 11th nickname char from data_0x24
    // https://github.com/rh-hideout/pokeemerald-expansion/blob/master/include/pokemon.h#L139
    // and 12th from data_0x2a
    // https://github.com/rh-hideout/pokeemerald-expansion/blob/master/include/pokemon.h#L144
    // then stitch the nickname together

    pub fn language_raw(&self) -> u3 {
        u3::extract_u8(self.get_u8(Offset::Data0x12), 0)
    }

    pub fn language(&self) -> Result<Language> {
        Ok(Language::try_from(u8::from(self.language_raw()))?)
    }

    pub fn mint_nature_raw(&self) -> u8 {
        u5::extract_u8(self.get_u8(Offset::Data0x12), 3).into()
    }

    pub fn mint_nature(&self) -> Result<NatureIndex> {
        Ok(NatureIndex::try_from(self.mint_nature_raw())?)
    }

    pub fn is_bad_egg(&self) -> bool {
        self.get_flag(Offset::Data0x13, 0)
    }

    pub fn has_species(&self) -> bool {
        self.get_flag(Offset::Data0x13, 1)
    }

    pub fn block_box_rs(&self) -> bool {
        self.get_flag(Offset::Data0x13, 2)
    }

    pub fn form_argument_raw(&self) -> u3 {
        u3::extract_u8(self.get_u8(Offset::Data0x13), 3)
    }

    fn trainer_name_raw(&self) -> [u8; 7] {
        self.get_array(Offset::TrainerName)
    }

    pub fn trainer_name(&self, encoding: Gen3Encoding) -> Gen3TrainerString<7> {
        Gen3TrainerString::<7>::from_raw(self.trainer_name_raw(), encoding)
    }

    fn markings_raw(&self) -> u4 {
        u4::extract_u8(self.get_u8(Offset::MarkingsStatus), 0)
    }

    pub fn markings(&self) -> MarkingsFourShapes {
        MarkingsFourShapes::from_byte(u8::from(self.markings_raw()))
    }

    //fn status_condition_raw(&self) -> u4 {
    //    u4::extract_u8(self.get_u8(Offset::MarkingsStatus), 4)
    //}

    // TODO: uncompress status condition
    // https://github.com/rh-hideout/pokeemerald-expansion/blob/master/src/pokemon.c#L783
    // https://github.com/kwsch/PKHeX/blob/master/PKHeX.Core/PKM/Enums/StatusCondition.cs#L12

    pub fn checksum(&self) -> u16 {
        self.get_u16_le(Offset::Checksum)
    }

    pub fn hp_lost_raw(&self) -> u14 {
        u14::extract_u16(self.get_u16_le(Offset::Data0x1E), 0)
    }

    pub fn shiny_modifier(&self) -> bool {
        self.get_flag(Offset::Data0x1E, 14)
    }

    fn data_0x20(&self) -> u16 {
        self.get_u16_le(Offset::SpeciesTeraType)
    }

    pub fn species_index(&self) -> u16 {
        u11::extract_u16(self.data_0x20(), 0).into()
    }

    pub fn tera_type(&self) -> u8 {
        u5::extract_u16(self.data_0x20(), 11).into()
    }

    pub fn held_item_index(&self) -> u16 {
        u10::extract_u16(self.get_u16_le(Offset::HeldItem), 0).into()
    }

    fn data_0x24(&self) -> u32 {
        self.get_u32_le(Offset::ExpNickname11)
    }

    pub fn exp(&self) -> u32 {
        u21::extract_u32(self.data_0x24(), 0).into()
    }

    pub fn friendship(&self) -> u8 {
        self.get_u8(Offset::Friendship)
    }

    fn data_0x2a(&self) -> u16 {
        self.get_u16_le(Offset::Data0x2A)
    }

    fn ball_raw(&self) -> u8 {
        u6::extract_u16(self.data_0x2a(), 0).into()
    }

    pub fn ball(&self) -> Ball {
        Ball::from(self.ball_raw())
    }

    fn move_indices(&self) -> [MoveSlot; 4] {
        let mut combined = [MoveSlot::empty(); 4];

        combined[0] =
            MoveSlot::from_u16(u11::extract_u16(self.get_u16_le(Offset::Move1), 0).into());
        combined[1] =
            MoveSlot::from_u16(u11::extract_u16(self.get_u16_le(Offset::Move2), 0).into());
        combined[2] =
            MoveSlot::from_u16(u11::extract_u16(self.get_u16_le(Offset::Move3), 0).into());
        combined[3] =
            MoveSlot::from_u16(u11::extract_u16(self.get_u16_le(Offset::Move4), 0).into());

        combined
    }

    fn move_pp(&self) -> [u8; 4] {
        let mut combined = [0u8; 4];

        combined[0] = u7::extract_u8(self.get_u8(Offset::Pp1), 0).into();
        combined[1] = u7::extract_u8(self.get_u8(Offset::Pp2), 0).into();
        combined[2] = u7::extract_u8(self.get_u8(Offset::Pp3), 0).into();
        combined[3] = u7::extract_u8(self.get_u8(Offset::Pp4), 0).into();

        combined
    }

    fn move_pp_ups(&self) -> [u8; 4] {
        let raw = self.get_u8(Offset::PpUps);
        let mut combined = [0u8; 4];

        combined[0] = raw & 3;
        combined[1] = (raw >> 2) & 3;
        combined[2] = (raw >> 4) & 3;
        combined[3] = (raw >> 6) & 3;

        combined
    }

    pub fn move_slots(&self) -> MoveSlots {
        MoveSlots::from_arrays(self.move_indices(), self.move_pp(), self.move_pp_ups())
    }

    // TODO: evolution trackers, hyper training

    fn evs_raw(&self) -> [u8; 6] {
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

    pub fn met_location_index(&self) -> u8 {
        self.get_u8(Offset::MetLocation)
    }

    fn data_0x46(&self) -> u16 {
        self.get_u16_le(Offset::Data0x46)
    }

    pub fn met_level(&self) -> u8 {
        u7::extract_u16(self.data_0x46(), 0).into()
    }

    fn game_of_origin_raw(&self) -> u8 {
        u4::extract_u16(self.data_0x46(), 7).into()
    }

    pub fn game_of_origin(&self) -> OriginGame {
        OriginGame::from(self.game_of_origin_raw())
    }

    pub fn dynamax_level(&self) -> u8 {
        u4::extract_u16(self.data_0x46(), 11).into()
    }

    pub fn trainer_gender(&self) -> BinaryGender {
        BinaryGender::from(self.get_flag(Offset::Data0x46, 15))
    }

    fn ivs_egg_gmax_raw(&self) -> [u8; 4] {
        self.get_array(Offset::IvsEggGmax)
    }

    pub fn ivs(&self) -> Ivs {
        Ivs::from_30_bits(self.ivs_egg_gmax_raw())
    }

    pub fn is_egg(&self) -> bool {
        self.get_flag(Offset::IvsEggGmax, 30)
    }

    pub fn can_gigantamax(&self) -> bool {
        self.get_flag(Offset::IvsEggGmax, 31)
    }

    fn data_0x4c(&self) -> u32 {
        self.get_u32_le(Offset::Data0x4C)
    }

    pub fn ribbons(&self) -> Gen3RibbonSet {
        Gen3RibbonSet::from_u32(self.get_u32_le(Offset::Data0x4C))
    }

    pub fn is_shadow(&self) -> bool {
        self.get_flag(Offset::Data0x4C, 29)
    }

    pub fn ability_num(&self) -> Result<AbilityNumber> {
        Ok(u2::extract_u32(self.data_0x4c(), 29).try_into()?)
    }

    pub fn is_fateful_encounter(&self) -> bool {
        self.get_flag(Offset::Data0x4C, 31)
    }
}

// ==================================================================
// Setters  (available only on Pk3BufferMut)
// ==================================================================

//impl<S: AsRef<[u8]> + AsMut<[u8]>> Pk3ExpnBuffer<S> {
//    fn bytes_mut(&mut self) -> &mut [u8] {
//        self.0.as_mut()
//    }
//}

// ==================================================================
// Trait impls
// ==================================================================

impl<S: AsRef<[u8]>> AsBytes for Pk3ExpnBuffer<S> {
    fn as_bytes(&self) -> &[u8] {
        self.0.as_ref()
    }
}

impl<S: AsRef<[u8]> + AsMut<[u8]>> AsBytesMut for Pk3ExpnBuffer<S> {
    fn as_bytes_mut(&mut self) -> &mut [u8] {
        self.0.as_mut()
    }
}
