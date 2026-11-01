use crate::bytes::AsBytes;
use crate::result::Result;
use crate::util;
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::{ModernRibbon, ModernRibbonSet};
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{
    BinaryGender, ContestStats, Gender, HyperTraining, Ivs, Language, MarkingsSixShapesColors,
    OriginGame, PokeDate, SWITCH_HANDLER_MEMORY_SIZE, SWITCH_TRAINER_MEMORY_SIZE, Stats8,
    TrainerMemory,
};
use pkm_rs_types::{read_u16_le, read_u32_le, read_u64_le};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Offset {
    HomeTracker = 0x00,
    EncryptionConstant = 0x08,
    IsBadEgg = 0x0C,
    NationalDex = 0x0D,
    TrainerId = 0x0F,
    SecretId = 0x11,
    Exp = 0x13,
    IsFavorite = 0x17,
    Markings = 0x18,
    PersonalityValue = 0x1A,
    Nature = 0x1E,
    MintNature = 0x1F,
    IsFatefulEncounter = 0x20,
    Gender = 0x21,
    FormNum = 0x22,
    Evs = 0x24,
    Contest = 0x2A,
    RibbonsA = 0x30,
    RibbonsB = 0x3A,
    ContestMemoryCount = 0x38,
    BattleMemoryCount = 0x39,
    HeightScalar = 0x42,
    WeightScalar = 0x43,
    Nickname = 0x44,
    CurrentHp = 0x5E,
    Ivs = 0x60,
    IsEgg = 0x66,
    IsNicknamed = 0x67,
    StatusCondition = 0x68,
    HandlerName = 0x6C,
    HandlerGender = 0x86,
    HandlerLanguage = 0x87,
    IsCurrentHandler = 0x88,
    HandlerId = 0x89,
    HandlerFriendship = 0x8B,
    HandlerMemory = 0x8C,
    GameOfOrigin = 0x91,
    GameOfOriginBattle = 0x92,
    Language = 0x93,
    FormArgument = 0x94,
    AffixedRibbon = 0x98,
    TrainerName = 0x99,
    TrainerFriendship = 0xB3,
    TrainerMemory = 0xB4,
    EggDate = 0xB9,
    MetDate = 0xBC,
    MetLevel = 0xBF,
    TrainerGender = 0xC0,
    HyperTraining = 0xC1,
    HeldItem = 0xC2,
}

impl From<Offset> for usize {
    fn from(offset: Offset) -> usize {
        offset as usize
    }
}

// ---------------------------------------------------------------------------
// PkhCoreBuffer<S> — generic over the byte storage so that a single impl block
// covers all getters, and a second (narrower) block covers setters.
//
//   PkhCoreBufferRef<'a>  = PkhCoreBuffer<&'a [u8]>       — read-only
// ---------------------------------------------------------------------------

#[derive(Default, Clone, Copy)]
pub struct PkhCoreBuffer<S: AsRef<[u8]>>(S);

// ------------------------------------------------------------------
// Constructors — immutable
// ------------------------------------------------------------------

impl<'a> PkhCoreBuffer<&'a [u8]> {
    pub fn new(span: &'a [u8]) -> Self {
        assert_eq!(span.len(), super::HOME_CORE_DATA_SIZE);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Accessors
// ------------------------------------------------------------------

impl<S: AsRef<[u8]>> PkhCoreBuffer<S> {
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

    fn get_u64_le(&self, offset: Offset) -> u64 {
        let offset = offset as usize;
        read_u64_le!(self.bytes(), offset)
    }

    fn get_flag(&self, offset: Offset, bit_index: usize) -> bool {
        util::get_flag(self.bytes(), offset as usize, bit_index)
    }

    fn get_array<const N: usize>(&self, offset: Offset) -> [u8; N] {
        let offset = offset as usize;
        self.bytes()[offset..offset + N].try_into().unwrap()
    }
}

// ------------------------------------------------------------------
// Shared methods
// ------------------------------------------------------------------

impl<S: AsRef<[u8]>> PkhCoreBuffer<S> {
    fn bytes(&self) -> &[u8] {
        self.0.as_ref()
    }

    pub fn home_tracker(&self) -> u64 {
        self.get_u64_le(Offset::HomeTracker)
    }

    pub fn encryption_constant(&self) -> u32 {
        self.get_u32_le(Offset::EncryptionConstant)
    }

    pub fn is_bad_egg(&self) -> bool {
        self.get_flag(Offset::IsBadEgg, 0)
    }

    pub fn species_ndex(&self) -> u16 {
        self.get_u16_le(Offset::NationalDex)
    }

    pub fn form_num(&self) -> u16 {
        self.get_u16_le(Offset::FormNum)
    }

    pub fn species_and_form(&self) -> Result<SpeciesForm> {
        Ok(SpeciesForm::new(self.species_ndex(), self.form_num())?)
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

    pub fn is_favorite(&self) -> bool {
        self.get_flag(Offset::IsFavorite, 0)
    }

    fn markings_raw(&self) -> [u8; 2] {
        self.get_array(Offset::Markings)
    }

    pub fn markings(&self) -> MarkingsSixShapesColors {
        MarkingsSixShapesColors::from_bytes(self.markings_raw())
    }

    pub fn personality_value(&self) -> u32 {
        self.get_u32_le(Offset::PersonalityValue)
    }

    pub fn nature_raw(&self) -> u8 {
        self.get_u8(Offset::Nature)
    }

    pub fn nature(&self) -> Result<NatureIndex> {
        Ok(NatureIndex::try_from(self.nature_raw())?)
    }

    pub fn mint_nature_raw(&self) -> u8 {
        self.get_u8(Offset::MintNature)
    }

    pub fn mint_nature(&self) -> Result<NatureIndex> {
        Ok(NatureIndex::try_from(self.mint_nature_raw())?)
    }

    pub fn is_fateful_encounter(&self) -> bool {
        self.get_flag(Offset::IsFatefulEncounter, 0)
    }

    pub fn gender(&self) -> Gender {
        Gender::from_u8(self.get_u8(Offset::Gender))
    }

    fn evs_raw(&self) -> [u8; 6] {
        self.get_array(Offset::Evs)
    }

    pub fn evs(&self) -> Stats8 {
        Stats8::from_bytes(self.evs_raw())
    }

    fn contest_raw(&self) -> [u8; 6] {
        self.get_array(Offset::Contest)
    }

    pub fn contest(&self) -> ContestStats {
        ContestStats::from_bytes(self.contest_raw())
    }

    fn ribbons_a_raw(&self) -> [u8; 8] {
        self.get_array(Offset::RibbonsA)
    }

    fn ribbons_b_raw(&self) -> [u8; 8] {
        self.get_array(Offset::RibbonsB)
    }

    pub fn ribbons(&self) -> ModernRibbonSet<16, { super::MAX_RIBBON_HOME }> {
        // HOME has two additional bytes for ribbons in RibbonsB that are currently unused, likely reserved for future games.
        // We parse all bytes for future proofing.
        let mut combined = [0u8; 16];
        combined[..8].copy_from_slice(&self.ribbons_a_raw());
        combined[8..16].copy_from_slice(&self.ribbons_b_raw());
        ModernRibbonSet::from_bytes(combined)
    }

    pub fn contest_memory_count(&self) -> u8 {
        self.get_u8(Offset::ContestMemoryCount)
    }

    pub fn battle_memory_count(&self) -> u8 {
        self.get_u8(Offset::BattleMemoryCount)
    }

    pub fn height_scalar(&self) -> u8 {
        self.get_u8(Offset::HeightScalar)
    }

    pub fn weight_scalar(&self) -> u8 {
        self.get_u8(Offset::WeightScalar)
    }

    pub fn nickname_raw(&self) -> [u8; 26] {
        self.get_array(Offset::Nickname)
    }

    pub fn nickname(&self) -> SizedUtf16String<26> {
        SizedUtf16String::<26>::from_bytes(self.nickname_raw())
    }

    pub fn current_hp(&self) -> u16 {
        self.get_u16_le(Offset::CurrentHp)
    }

    fn ivs_raw(&self) -> [u8; 6] {
        self.get_array(Offset::Ivs)
    }

    pub fn ivs(&self) -> Ivs {
        Stats8::from_bytes(self.ivs_raw()).to_ivs_capped()
    }

    pub fn is_egg(&self) -> bool {
        self.get_flag(Offset::IsEgg, 0)
    }

    pub fn is_nicknamed(&self) -> bool {
        self.get_flag(Offset::IsNicknamed, 0)
    }

    pub fn status_condition(&self) -> u32 {
        self.get_u32_le(Offset::StatusCondition)
    }

    fn handler_name_raw(&self) -> [u8; 26] {
        self.get_array(Offset::HandlerName)
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

    fn handler_language_raw(&self) -> u8 {
        self.get_u8(Offset::HandlerLanguage)
    }

    pub fn handler_language(&self) -> Result<Language> {
        Ok(Language::try_from(self.handler_language_raw())?)
    }

    pub fn is_current_handler(&self) -> bool {
        self.get_flag(Offset::IsCurrentHandler, 0)
    }

    pub fn handler_id(&self) -> u16 {
        self.get_u16_le(Offset::HandlerId)
    }

    pub fn handler_friendship(&self) -> u8 {
        self.get_u8(Offset::HandlerFriendship)
    }

    pub fn handler_memory_intensity(&self) -> u8 {
        let off = Offset::HandlerMemory as usize;
        self.bytes()[off]
    }

    pub fn handler_memory_memory(&self) -> u8 {
        let off = Offset::HandlerMemory as usize + 1;
        self.bytes()[off]
    }

    pub fn handler_memory_feeling(&self) -> u8 {
        let off = Offset::HandlerMemory as usize + 2;
        self.bytes()[off]
    }

    pub fn handler_memory_text_variable(&self) -> u16 {
        let off = Offset::HandlerMemory as usize + 3;
        read_u16_le!(self.bytes(), off)
    }

    pub fn handler_memory(&self) -> TrainerMemory {
        let start = Offset::HandlerMemory as usize;
        let end = start + SWITCH_HANDLER_MEMORY_SIZE;

        TrainerMemory::from_bytes_switch_handler(
            self.bytes()[start..end]
                .try_into()
                .expect("start..end in handler_memory() should be a slice of length 5"),
        )
    }

    fn game_of_origin_raw(&self) -> u8 {
        self.get_u8(Offset::GameOfOrigin)
    }

    pub fn game_of_origin(&self) -> OriginGame {
        OriginGame::from(self.game_of_origin_raw())
    }

    fn game_of_origin_battle_raw(&self) -> u8 {
        self.get_u8(Offset::GameOfOriginBattle)
    }

    pub fn game_of_origin_battle(&self) -> Option<OriginGame> {
        OriginGame::try_from_u8(self.game_of_origin_battle_raw())
    }

    fn language_raw(&self) -> u8 {
        self.get_u8(Offset::Language)
    }

    pub fn language(&self) -> Result<Language> {
        Ok(Language::try_from(self.language_raw())?)
    }

    pub fn form_argument(&self) -> u32 {
        self.get_u32_le(Offset::FormArgument)
    }

    pub fn affixed_ribbon(&self) -> Option<ModernRibbon> {
        ModernRibbon::from_affixed_byte(self.get_u8(Offset::AffixedRibbon))
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

    pub fn trainer_memory(&self) -> TrainerMemory {
        let start = Offset::TrainerMemory as usize;
        let end = start + SWITCH_TRAINER_MEMORY_SIZE;
        TrainerMemory::from_bytes_switch_trainer(
            self.bytes()[start..end]
                .try_into()
                .expect("start..end in trainer_memory() should be a slice of length 6"),
        )
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

    pub fn met_level(&self) -> u8 {
        self.get_u8(Offset::MetLevel)
    }

    pub fn trainer_gender_raw(&self) -> bool {
        self.get_flag(Offset::TrainerGender, 0)
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

    pub fn held_item_index(&self) -> u16 {
        self.get_u16_le(Offset::HeldItem)
    }
}

// ==================================================================
// Trait impls
// ==================================================================

impl<S: AsRef<[u8]>> AsBytes for PkhCoreBuffer<S> {
    fn as_bytes(&self) -> &[u8] {
        self.0.as_ref()
    }
}
