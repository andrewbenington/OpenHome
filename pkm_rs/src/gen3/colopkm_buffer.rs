use crate::bytes::{AsBytes, AsBytesMut};
use crate::encryption::BlockCrypto;
use crate::result::{Error, Result};
use crate::{gen3, util};

use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::MoveSlots;
use pkm_rs_resources::ribbons::{
    Beauty, Cool, Cute, Gen3ContestRibbons, Gen3RibbonSet, Smart, Tough,
};
use pkm_rs_types::strings::{BigEndian, SizedUtf16String};
use pkm_rs_types::{
    BinaryGender, ContestStats, FlagSet, Ivs, MarkingsFourShapes, OriginGame, Pokerus,
    SimpleAbilityNumber, Stats8, read_i32_be, read_u16_be, read_u32_be,
};
use pkm_rs_types::{Language, Stats16};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum Offset {
    SpeciesIndex = 0x0,
    PersonalityValue = 0x4,
    OriginGameGcn = 0x8,
    LanguageGcn = 0xb,
    MetLocation = 0xc,
    MetLevel = 0xe,
    Ball = 0xf,
    TrainerGender = 0x10,
    SecretId = 0x14,
    TrainerId = 0x16,
    TrainerName = 0x18,
    Nickname = 0x2e,
    Exp = 0x5c,
    StatLevel = 0x60,
    Moves = 0x78,
    HeldItem = 0x88,
    CurrentHp = 0x8a,
    Stats = 0x8c,
    Evs = 0x99,
    Ivs = 0xa4,
    TrainerFriendship = 0xb0,
    Contest = 0xb2,
    FatefulEncounterJpn = 0xc9,
    FatefulEncounterInt = 0xfb,
    PokerusStrain = 0xca,
    IsEgg = 0xcb,
    AbilityNumber = 0xcc,
    Markings = 0xcf,
    PokerusDays = 0xd0,
    ShadowId = 0xd8,
    ShadowGauge = 0xdc,
    RibbonsContest = 0xb7,
    RibbonsStandard = 0xbd,
}

impl From<Offset> for usize {
    fn from(offset: Offset) -> usize {
        offset as usize
    }
}

const MAX_POKERUS_STRAIN: u8 = 0x0f;
const NO_POKERUS_DAYS: u8 = 0xff;
const MAX_POKERUS_DAYS: u8 = 0x0f;

// ---------------------------------------------------------------------------
// ColopkmBuffer<S> — generic over the byte storage so that a single impl block
// covers all getters, and a second (narrower) block covers setters.
//
//   ColopkmBufferMut<'a>  = ColopkmBuffer<&'a mut [u8]>   — read + write
// ---------------------------------------------------------------------------

pub type ColopkmBufferMut<'a> = ColopkmBuffer<&'a mut [u8]>;

#[derive(Default, Clone, Copy)]
pub struct ColopkmBuffer<S: AsRef<[u8]>>(S);

// ------------------------------------------------------------------
// Constructors — immutable
// ------------------------------------------------------------------

impl<'a> ColopkmBuffer<&'a [u8]> {
    pub fn new(span: &'a [u8]) -> Self {
        assert_eq!(span.len(), gen3::PKM_DATA_SIZE_GCN);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Methods — mutable
// ------------------------------------------------------------------

impl<'a> ColopkmBuffer<&'a mut [u8]> {
    pub fn new_mut(span: &'a mut [u8]) -> Self {
        assert_eq!(span.len(), gen3::PKM_DATA_SIZE_GCN);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Accessors
// ------------------------------------------------------------------

impl<S: AsRef<[u8]>> ColopkmBuffer<S> {
    fn get_u8(&self, offset: Offset) -> u8 {
        let offset = offset as usize;
        self.bytes()[offset]
    }

    fn get_u16_be(&self, offset: Offset) -> u16 {
        let offset = offset as usize;
        read_u16_be!(self.bytes(), offset)
    }

    fn get_u32_be(&self, offset: Offset) -> u32 {
        let offset = offset as usize;
        read_u32_be!(self.bytes(), offset)
    }

    fn get_i32_be(&self, offset: Offset) -> i32 {
        let offset = offset as usize;
        read_i32_be!(self.bytes(), offset)
    }

    fn get_flag(&self, offset: Offset, bit_index: usize) -> bool {
        util::get_flag(self.bytes(), offset as usize, bit_index)
    }

    fn get_array<const N: usize>(&self, offset: Offset) -> [u8; N] {
        let offset = offset as usize;
        self.bytes()[offset..offset + N].try_into().unwrap()
    }
}

impl<S: AsRef<[u8]> + AsMut<[u8]>> ColopkmBuffer<S> {
    fn set_u8(&mut self, offset: Offset, v: u8) {
        let offset = offset as usize;
        self.bytes_mut()[offset] = v;
    }

    fn set_u16_be(&mut self, offset: Offset, v: u16) {
        let offset = offset as usize;
        self.bytes_mut()[offset..offset + 2].copy_from_slice(&v.to_be_bytes());
    }

    fn set_u32_be(&mut self, offset: Offset, v: u32) {
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

impl<S: AsRef<[u8]>> ColopkmBuffer<S> {
    fn bytes(&self) -> &[u8] {
        self.0.as_ref()
    }

    pub fn gen3_species_index(&self) -> u16 {
        self.get_u16_be(Offset::SpeciesIndex)
    }

    pub fn held_item_index(&self) -> u16 {
        self.get_u16_be(Offset::HeldItem)
    }

    pub fn trainer_id(&self) -> u16 {
        self.get_u16_be(Offset::TrainerId)
    }

    pub fn secret_id(&self) -> u16 {
        self.get_u16_be(Offset::SecretId)
    }

    pub fn trainer_and_secret_id(&self) -> u32 {
        self.get_u32_be(Offset::TrainerId)
    }

    pub fn exp(&self) -> u32 {
        self.get_u32_be(Offset::Exp)
    }

    fn markings_raw(&self) -> u8 {
        self.get_u8(Offset::Markings)
    }

    pub fn markings(&self) -> MarkingsFourShapes {
        MarkingsFourShapes::from_byte(self.markings_raw())
    }

    pub fn personality_value(&self) -> u32 {
        self.get_u32_be(Offset::PersonalityValue)
    }

    pub fn is_fateful_encounter_jpn(&self) -> bool {
        self.get_flag(Offset::FatefulEncounterJpn, 4)
    }

    pub fn is_fateful_encounter_int(&self) -> bool {
        self.get_flag(Offset::FatefulEncounterInt, 0)
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

    fn pokerus_strain(&self) -> u8 {
        self.get_u8(Offset::PokerusStrain)
    }

    fn pokerus_days(&self) -> u8 {
        match self.get_u8(Offset::PokerusDays) {
            NO_POKERUS_DAYS => 0,
            valid_days @ 1..=MAX_POKERUS_DAYS => valid_days,
            _ => 0,
        }
    }

    pub fn pokerus(&self) -> Pokerus {
        Pokerus::from_components(self.pokerus_strain(), self.pokerus_days())
    }

    pub fn is_egg(&self) -> bool {
        self.get_flag(Offset::IsEgg, 0)
    }

    pub fn ability_num(&self) -> SimpleAbilityNumber {
        self.get_flag(Offset::AbilityNumber, 0).into()
    }

    pub fn ribbons_contest_raw(&self) -> [u8; 5] {
        self.get_array(Offset::RibbonsContest)
    }

    pub fn ribbons_standard(&self) -> FlagSet<2> {
        self.get_array::<11>(Offset::RibbonsStandard)
            .iter()
            .enumerate()
            .filter_map(|(index, value)| if *value == 0 { None } else { Some(index) })
            .collect()
    }

    pub fn ribbons(&self) -> Gen3RibbonSet {
        let contest_levels = self.ribbons_contest_raw();
        let cool = Gen3ContestRibbons::<Cool>::from_u8(contest_levels[0]);
        let beauty = Gen3ContestRibbons::<Beauty>::from_u8(contest_levels[1]);
        let cute = Gen3ContestRibbons::<Cute>::from_u8(contest_levels[2]);
        let smart = Gen3ContestRibbons::<Smart>::from_u8(contest_levels[3]);
        let tough = Gen3ContestRibbons::<Tough>::from_u8(contest_levels[4]);

        Gen3RibbonSet::new(self.ribbons_standard(), cool, beauty, cute, smart, tough)
    }

    pub fn nickname_raw(&self) -> [u8; 22] {
        self.get_array(Offset::Nickname)
    }

    pub fn nickname(&self) -> SizedUtf16String<22, BigEndian> {
        SizedUtf16String::from_be_bytes(self.nickname_raw())
    }

    pub fn move_slots(&self) -> MoveSlots {
        MoveSlots::from_bytes_gcn(self.bytes(), Offset::Moves)
    }

    pub fn ivs(&self) -> Ivs {
        Ivs::from_gcn_bytes(self.get_array(Offset::Ivs))
    }

    fn trainer_name_raw(&self) -> [u8; 22] {
        self.get_array(Offset::TrainerName)
    }

    pub fn trainer_name(&self) -> SizedUtf16String<22, BigEndian> {
        SizedUtf16String::from_be_bytes(self.trainer_name_raw())
    }

    pub fn trainer_friendship(&self) -> u8 {
        self.get_u8(Offset::TrainerFriendship)
    }

    pub fn shadow_id(&self) -> u16 {
        self.get_u16_be(Offset::ShadowId)
    }

    pub fn shadow_gauge(&self) -> i32 {
        self.get_i32_be(Offset::ShadowGauge)
    }

    pub fn met_location_index(&self) -> u16 {
        self.get_u16_be(Offset::MetLocation)
    }

    pub fn ball(&self) -> Ball {
        Ball::from(self.get_u8(Offset::Ball))
    }

    pub fn met_level(&self) -> u8 {
        self.get_u8(Offset::MetLevel)
    }

    pub fn trainer_gender_raw(&self) -> u8 {
        self.get_u8(Offset::TrainerGender)
    }

    pub fn trainer_gender(&self) -> BinaryGender {
        self.trainer_gender_raw().into()
    }

    pub fn game_of_origin(&self) -> Result<OriginGame> {
        let origin_game_raw = self.get_u8(Offset::OriginGameGcn);
        OriginGame::try_from_gamecube_u8(origin_game_raw).ok_or(Error::other(&format!(
            "bad gamecube origin game: {origin_game_raw}"
        )))
    }

    pub fn language(&self) -> Result<Language> {
        Ok(Language::try_from_gcn(self.get_u8(Offset::LanguageGcn))?)
    }

    pub fn stat_level(&self) -> u8 {
        self.get_u8(Offset::StatLevel)
    }

    pub fn current_hp(&self) -> u16 {
        self.get_u16_be(Offset::CurrentHp)
    }

    pub fn stats_raw(&self) -> [u8; 12] {
        self.get_array(Offset::Stats)
    }

    pub fn stats(&self) -> Stats16 {
        Stats16::from_bytes_be(self.stats_raw())
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

// ==================================================================
// Setters  (available only on ColopkmBufferMut)
// ==================================================================

impl<S: AsRef<[u8]> + AsMut<[u8]>> ColopkmBuffer<S> {
    fn bytes_mut(&mut self) -> &mut [u8] {
        self.0.as_mut()
    }

    pub fn set_gen3_species_index(&mut self, v: u16) {
        self.set_u16_be(Offset::SpeciesIndex, v);
    }

    pub fn set_held_item_index(&mut self, v: u16) {
        self.set_u16_be(Offset::HeldItem, v);
    }

    pub fn set_trainer_id(&mut self, v: u16) {
        self.set_u16_be(Offset::TrainerId, v);
    }

    pub fn set_secret_id(&mut self, v: u16) {
        self.set_u16_be(Offset::SecretId, v);
    }

    pub fn set_exp(&mut self, v: u32) {
        self.set_u32_be(Offset::Exp, v);
    }

    pub fn set_is_egg(&mut self, v: bool) {
        self.set_flag(Offset::IsEgg, 0, v);
    }

    fn set_markings_raw(&mut self, v: u8) {
        self.set_u8(Offset::Markings, v);
    }

    pub fn set_markings(&mut self, v: MarkingsFourShapes) {
        self.set_markings_raw(v.to_byte());
    }

    pub fn set_personality_value(&mut self, v: u32) {
        self.set_u32_be(Offset::PersonalityValue, v);
    }

    pub fn set_is_fateful_encounter_jpn(&mut self, v: bool) {
        self.set_flag(Offset::FatefulEncounterJpn, 4, v);
    }

    pub fn set_is_fateful_encounter_int(&mut self, v: bool) {
        self.set_flag(Offset::FatefulEncounterInt, 0, v);
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

    fn set_pokerus_strain(&mut self, v: u8) {
        self.set_u8(Offset::PokerusStrain, v);
    }

    fn set_pokerus_days(&mut self, v: u8) {
        self.set_u8(Offset::PokerusDays, v);
    }

    pub fn set_pokerus(&mut self, v: Pokerus) {
        self.set_pokerus_strain(v.strain().value().min(MAX_POKERUS_STRAIN));
        let days_byte = match v.days_remaining().value() {
            NO_POKERUS_DAYS => NO_POKERUS_DAYS,
            other => other.min(MAX_POKERUS_DAYS),
        };
        self.set_pokerus_days(days_byte);
    }

    pub fn set_ability_num(&mut self, v: SimpleAbilityNumber) {
        self.set_flag(Offset::AbilityNumber, 0, v.into());
    }

    pub fn set_ribbons_contest_raw(&mut self, v: &[u8; 5]) {
        self.set_array(Offset::RibbonsContest, v);
    }

    pub fn set_ribbons_standard_raw(&mut self, v: FlagSet<2>) {
        let mut ribbon_bytes = [0u8; 11];
        for index in v.into_iter() {
            ribbon_bytes[index] = 1;
        }
        self.set_array(Offset::RibbonsStandard, &ribbon_bytes);
    }

    pub fn set_ribbons(&mut self, v: Gen3RibbonSet) {
        let Gen3RibbonSet {
            cool,
            beauty,
            cute,
            smart,
            tough,
            non_contest,
        } = v;
        self.set_ribbons_standard_raw(non_contest);

        let contest_bytes = [
            cool.to_u8(),
            beauty.to_u8(),
            cute.to_u8(),
            smart.to_u8(),
            tough.to_u8(),
        ];
        self.set_ribbons_contest_raw(&contest_bytes);
    }

    fn set_nickname_raw(&mut self, v: &[u8; 22]) {
        self.set_array(Offset::Nickname, v);
    }

    pub fn set_nickname(&mut self, v: &SizedUtf16String<22, BigEndian>) {
        self.set_nickname_raw(&v.bytes());
    }

    pub fn set_move_slots(&mut self, v: &MoveSlots) {
        v.write_bytes_gcn(self.bytes_mut(), Offset::Moves);
    }

    pub fn set_ivs(&mut self, v: &Ivs) {
        v.write_gcn_bytes(self.bytes_mut(), Offset::Ivs.into());
    }

    fn set_trainer_name_raw(&mut self, v: &[u8; 22]) {
        self.set_array(Offset::TrainerName, v);
    }

    pub fn set_trainer_name(&mut self, v: &SizedUtf16String<22, BigEndian>) {
        self.set_trainer_name_raw(&v.bytes());
    }

    pub fn set_trainer_friendship(&mut self, v: u8) {
        self.set_u8(Offset::TrainerFriendship, v);
    }

    pub fn set_shadow_id(&mut self, v: u16) {
        self.set_u16_be(Offset::ShadowId, v);
    }

    pub fn set_shadow_gauge(&mut self, v: u32) {
        self.set_u32_be(Offset::ShadowGauge, v);
    }

    pub fn set_met_location_index(&mut self, v: u16) {
        self.set_u16_be(Offset::MetLocation, v);
    }

    pub fn set_ball(&mut self, v: Ball) {
        self.set_u8(Offset::Ball, v as u8);
    }

    pub fn set_met_level(&mut self, v: u8) {
        self.set_u8(Offset::MetLevel, v);
    }

    fn set_trainer_gender_raw(&mut self, v: u8) {
        self.set_u8(Offset::TrainerGender, v);
    }

    pub fn set_trainer_gender(&mut self, v: BinaryGender) {
        self.set_trainer_gender_raw(v.into());
    }

    pub fn set_game_of_origin(&mut self, v: OriginGame) {
        self.set_u8(
            Offset::OriginGameGcn,
            v.gamecube_index().unwrap_or_default(),
        );
    }

    fn set_language_raw(&mut self, v: u8) {
        self.set_u8(Offset::LanguageGcn, v);
    }

    pub fn set_language(&mut self, v: Language) {
        self.set_language_raw(v.to_gcn());
    }

    pub fn set_stat_level(&mut self, v: u8) {
        self.set_u8(Offset::StatLevel, v);
    }

    pub fn set_current_hp(&mut self, v: u16) {
        self.set_u16_be(Offset::CurrentHp, v);
    }

    fn set_stats_raw(&mut self, v: [u8; 12]) {
        self.set_array(Offset::Stats, &v);
    }

    pub fn set_stats(&mut self, v: Stats16) {
        self.set_stats_raw(v.to_bytes_be());
    }

    // ------------------------------------------------------------------
    // Encryption
    // ------------------------------------------------------------------

    pub fn encrypt(&mut self) {
        self.block_crypto().encrypt(self.0.as_mut());
    }

    pub fn decrypt(&mut self) {
        self.block_crypto().decrypt(self.0.as_mut());
    }

    pub fn encrypted(&mut self) -> &mut Self {
        self.block_crypto().encrypt(self.0.as_mut());

        self
    }

    pub fn decrypted(&mut self) -> &mut Self {
        self.block_crypto().decrypt(self.0.as_mut());

        self
    }
}

// ==================================================================
// Trait impls
// ==================================================================

impl<S: AsRef<[u8]>> AsBytes for ColopkmBuffer<S> {
    fn as_bytes(&self) -> &[u8] {
        self.0.as_ref()
    }
}

impl<S: AsRef<[u8]> + AsMut<[u8]>> AsBytesMut for ColopkmBuffer<S> {
    fn as_bytes_mut(&mut self) -> &mut [u8] {
        self.0.as_mut()
    }
}
