use crate::result::Result;
use crate::util;
use arbitrary_int::u3;
use arbitrary_int::u7;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::language::Language;
use pkm_rs_resources::moves::{MoveIndex, MoveSlots};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::ModernRibbonSet;
use pkm_rs_types::Stats16Le;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{
    AbilityNumber, BinaryGender, ContestStats, Gender, Geolocations, HyperTraining,
    MarkingsSixShapesColors, OriginGame, PokeDate, Stats8, TrainerMemory,
};
use pkm_rs_types::{read_u16_le, read_u32_le};

// ---------------------------------------------------------------------------
// Pk7Buffer — a thin wrapper around raw box/party bytes that exposes typed
// getters and setters.  All reads/writes go through this type so that the
// offset table lives in exactly one place.
// ---------------------------------------------------------------------------

pub struct Pk7Buffer {
    bytes: Vec<u8>,
}

impl Pk7Buffer {
    // ------------------------------------------------------------------
    // Construction
    // ------------------------------------------------------------------

    pub fn new_box() -> Self {
        Self {
            bytes: vec![0u8; super::BOX_SIZE],
        }
    }

    pub fn new_party() -> Self {
        Self {
            bytes: vec![0u8; super::PARTY_SIZE],
        }
    }

    pub fn from_bytes(bytes: Vec<u8>) -> Self {
        Self { bytes }
    }

    pub fn into_bytes(self) -> Vec<u8> {
        self.bytes
    }

    pub fn as_bytes(&self) -> &[u8] {
        &self.bytes
    }

    pub fn is_party(&self) -> bool {
        self.bytes.len() >= super::PARTY_SIZE
    }

    // ------------------------------------------------------------------
    // Block A  (offsets 0 – 63)
    // ------------------------------------------------------------------

    pub fn encryption_constant(&self) -> u32 {
        read_u32_le!(self.bytes, 0)
    }
    pub fn set_encryption_constant(&mut self, v: u32) {
        self.bytes[0..4].copy_from_slice(&v.to_le_bytes());
    }

    pub fn sanity(&self) -> u16 {
        read_u16_le!(self.bytes, 4)
    }
    pub fn set_sanity(&mut self, v: u16) {
        self.bytes[4..6].copy_from_slice(&v.to_le_bytes());
    }

    pub fn checksum(&self) -> u16 {
        read_u16_le!(self.bytes, 6)
    }
    pub fn set_checksum(&mut self, v: u16) {
        self.bytes[6..8].copy_from_slice(&v.to_le_bytes());
    }

    // species ndex lives in [8..10]; forme index is packed into bits [3..7] of byte 29.
    // The typed getter returns a fully-validated SpeciesAndForme; the typed setter writes
    // both fields atomically.  The _raw pair is kept for callers that only need one half.
    pub fn species_ndex(&self) -> u16 {
        read_u16_le!(self.bytes, 8)
    }
    pub fn set_species_ndex(&mut self, v: u16) {
        self.bytes[8..10].copy_from_slice(&v.to_le_bytes());
    }

    pub fn forme_index(&self) -> u8 {
        util::read_uint5_from_bits(self.bytes[29], 3)
    }
    pub fn set_forme_index(&mut self, v: u8) {
        util::write_uint5_to_bits(v, &mut self.bytes[29], 3);
    }

    pub fn held_item_index(&self) -> u16 {
        read_u16_le!(self.bytes, 10)
    }
    pub fn set_held_item_index(&mut self, v: u16) {
        self.bytes[10..12].copy_from_slice(&v.to_le_bytes());
    }

    pub fn trainer_id(&self) -> u16 {
        read_u16_le!(self.bytes, 12)
    }
    pub fn set_trainer_id(&mut self, v: u16) {
        self.bytes[12..14].copy_from_slice(&v.to_le_bytes());
    }

    pub fn secret_id(&self) -> u16 {
        read_u16_le!(self.bytes, 14)
    }
    pub fn set_secret_id(&mut self, v: u16) {
        self.bytes[14..16].copy_from_slice(&v.to_le_bytes());
    }

    pub fn exp(&self) -> u32 {
        read_u32_le!(self.bytes, 16)
    }
    pub fn set_exp(&mut self, v: u32) {
        self.bytes[16..20].copy_from_slice(&v.to_le_bytes());
    }

    pub fn ability_index_raw(&self) -> u8 {
        self.bytes[20]
    }
    pub fn set_ability_index_raw(&mut self, v: u8) {
        self.bytes[20] = v;
    }

    pub fn ability_num_raw(&self) -> u8 {
        u3::extract_u8(self.bytes[21], 0).into()
    }
    pub fn set_ability_num_raw(&mut self, v: u8) {
        self.bytes[21] |= v;
    }

    pub fn ability_num(&self) -> Result<AbilityNumber> {
        Ok(u3::extract_u8(self.bytes[21], 0).try_into()?)
    }
    pub fn set_ability_num(&mut self, v: AbilityNumber) {
        self.set_ability_num_raw(v.to_byte());
    }

    pub fn markings_raw(&self) -> [u8; 2] {
        self.bytes[22..24].try_into().unwrap()
    }
    pub fn set_markings_raw(&mut self, v: [u8; 2]) {
        self.bytes[22..24].copy_from_slice(&v);
    }

    pub fn markings(&self) -> MarkingsSixShapesColors {
        MarkingsSixShapesColors::from_bytes(self.markings_raw())
    }
    pub fn set_markings(&mut self, v: MarkingsSixShapesColors) {
        self.set_markings_raw(v.to_bytes());
    }

    pub fn personality_value(&self) -> u32 {
        read_u32_le!(self.bytes, 24)
    }
    pub fn set_personality_value(&mut self, v: u32) {
        self.bytes[24..28].copy_from_slice(&v.to_le_bytes());
    }

    pub fn nature_raw(&self) -> u8 {
        self.bytes[28]
    }
    pub fn set_nature_raw(&mut self, v: u8) {
        self.bytes[28] = v;
    }

    pub fn nature(&self) -> Result<NatureIndex> {
        Ok(NatureIndex::try_from(self.nature_raw())?)
    }
    pub fn set_nature(&mut self, v: NatureIndex) {
        self.set_nature_raw(v.to_byte());
    }

    // byte 29 holds: bit 0 = fateful encounter, bits 1-2 = gender, bits 3-7 = forme
    pub fn is_fateful_encounter(&self) -> bool {
        util::get_flag(&self.bytes, 29, 0)
    }
    pub fn set_is_fateful_encounter(&mut self, v: bool) {
        util::set_flag(&mut self.bytes, 29, 0, v);
    }

    pub fn gender(&self) -> Gender {
        Gender::from_bits_1_2(self.bytes[29])
    }
    pub fn set_gender(&mut self, v: Gender) {
        v.set_bits_1_2(&mut self.bytes[29]);
    }

    pub fn evs_raw(&self) -> &[u8; 6] {
        self.bytes[30..36].try_into().unwrap()
    }
    pub fn set_evs_raw(&mut self, v: [u8; 6]) {
        self.bytes[30..36].copy_from_slice(&v);
    }

    pub fn evs(&self) -> Stats8 {
        Stats8::from_bytes(*self.evs_raw())
    }
    pub fn set_evs(&mut self, v: Stats8) {
        self.set_evs_raw(v.to_bytes());
    }

    pub fn contest_raw(&self) -> &[u8; 6] {
        self.bytes[36..42].try_into().unwrap()
    }
    pub fn set_contest_raw(&mut self, v: [u8; 6]) {
        self.bytes[36..42].copy_from_slice(&v);
    }

    pub fn contest(&self) -> ContestStats {
        ContestStats::from_bytes(*self.contest_raw())
    }
    pub fn set_contest(&mut self, v: ContestStats) {
        self.set_contest_raw(v.to_bytes());
    }

    pub fn resort_event_status(&self) -> u8 {
        self.bytes[42]
    }
    pub fn set_resort_event_status(&mut self, v: u8) {
        self.bytes[42] = v;
    }

    pub fn pokerus_byte(&self) -> u8 {
        self.bytes[43]
    }
    pub fn set_pokerus_byte(&mut self, v: u8) {
        self.bytes[43] = v;
    }

    pub fn super_training_flags(&self) -> u32 {
        read_u32_le!(self.bytes, 44)
    }
    pub fn set_super_training_flags(&mut self, v: u32) {
        self.bytes[44..48].copy_from_slice(&v.to_le_bytes());
    }

    pub fn ribbons_raw(&self) -> &[u8; 7] {
        self.bytes[48..55].try_into().unwrap()
    }
    pub fn set_ribbons_raw(&mut self, v: [u8; 7]) {
        self.bytes[48..55].copy_from_slice(&v);
    }

    pub fn ribbons(&self) -> ModernRibbonSet<7, { super::MAX_RIBBON_ALOLA }> {
        ModernRibbonSet::from_bytes(*self.ribbons_raw())
    }
    pub fn set_ribbons(&mut self, v: ModernRibbonSet<7, { super::MAX_RIBBON_ALOLA }>) {
        self.set_ribbons_raw(v.to_bytes());
    }

    // byte 55 unused

    pub fn contest_memory_count(&self) -> u8 {
        self.bytes[56]
    }
    pub fn set_contest_memory_count(&mut self, v: u8) {
        self.bytes[56] = v;
    }

    pub fn battle_memory_count(&self) -> u8 {
        self.bytes[57]
    }
    pub fn set_battle_memory_count(&mut self, v: u8) {
        self.bytes[57] = v;
    }

    pub fn super_training_dist_flags(&self) -> u8 {
        self.bytes[58]
    }
    pub fn set_super_training_dist_flags(&mut self, v: u8) {
        self.bytes[58] = v;
    }

    // byte 59 unused

    pub fn form_argument(&self) -> u32 {
        read_u32_le!(self.bytes, 60)
    }
    pub fn set_form_argument(&mut self, v: u32) {
        self.bytes[60..64].copy_from_slice(&v.to_le_bytes());
    }

    // ------------------------------------------------------------------
    // Block B  (offsets 64 – 127)
    // ------------------------------------------------------------------

    pub fn nickname_raw(&self) -> &[u8; 26] {
        self.bytes[64..90].try_into().unwrap()
    }
    pub fn set_nickname_raw(&mut self, v: &[u8; 26]) {
        self.bytes[64..90].copy_from_slice(v);
    }

    pub fn nickname(&self) -> SizedUtf16String<26> {
        SizedUtf16String::<26>::from_bytes(*self.nickname_raw())
    }
    pub fn set_nickname(&mut self, v: &SizedUtf16String<26>) {
        self.set_nickname_raw(&v.bytes());
    }

    // moves [90..106], pp [98..102], pp_ups [102..106] — accessed via MoveSlots
    pub fn move_slots_bytes(&self) -> &[u8] {
        &self.bytes
    }
    pub fn move_slots(&self) -> MoveSlots {
        MoveSlots::from_bytes(&self.bytes, super::MOVE_DATA_OFFSETS)
    }
    pub fn set_move_slots(&mut self, v: &MoveSlots) {
        v.write_spans(&mut self.bytes, super::MOVE_DATA_OFFSETS);
    }

    pub fn relearn_move_raw(&self, idx: usize) -> &[u8; 2] {
        let off = 106 + idx * 2;
        self.bytes[off..off + 2].try_into().unwrap()
    }
    pub fn set_relearn_move_raw(&mut self, idx: usize, v: [u8; 2]) {
        let off = 106 + idx * 2;
        self.bytes[off..off + 2].copy_from_slice(&v);
    }

    pub fn relearn_move(&self, idx: usize) -> MoveIndex {
        MoveIndex::from_le_bytes(*self.relearn_move_raw(idx))
    }
    pub fn set_relearn_move(&mut self, idx: usize, v: MoveIndex) {
        self.set_relearn_move_raw(idx, v.to_le_bytes());
    }

    pub fn secret_super_training_unlocked(&self) -> bool {
        util::get_flag(&self.bytes, 114, 0)
    }
    pub fn set_secret_super_training_unlocked(&mut self, v: bool) {
        util::set_flag(&mut self.bytes, 114, 0, v);
    }

    pub fn secret_super_training_complete(&self) -> bool {
        util::get_flag(&self.bytes, 114, 1)
    }
    pub fn set_secret_super_training_complete(&mut self, v: bool) {
        util::set_flag(&mut self.bytes, 114, 1, v);
    }

    // IVs are packed into 30 bits at offset 116; bits 30/31 carry egg/nicknamed flags.
    pub fn ivs_raw(&self) -> &[u8; 4] {
        self.bytes[116..120].try_into().unwrap()
    }

    pub fn ivs(&self) -> Stats8 {
        Stats8::from_30_bits(*self.ivs_raw())
    }
    pub fn set_ivs(&mut self, v: &Stats8) {
        v.write_30_bits(&mut self.bytes, 116);
    }

    pub fn is_egg(&self) -> bool {
        util::get_flag(&self.bytes, 116, 30)
    }
    pub fn set_is_egg(&mut self, v: bool) {
        util::set_flag(&mut self.bytes, 116, 30, v);
    }

    pub fn is_nicknamed(&self) -> bool {
        util::get_flag(&self.bytes, 116, 31)
    }
    pub fn set_is_nicknamed(&mut self, v: bool) {
        util::set_flag(&mut self.bytes, 116, 31, v);
    }

    // ------------------------------------------------------------------
    // Block C  (offsets 120 – 175)
    // ------------------------------------------------------------------

    pub fn handler_name_raw(&self) -> &[u8; 26] {
        self.bytes[120..146].try_into().unwrap()
    }
    pub fn set_handler_name_raw(&mut self, v: &[u8; 26]) {
        self.bytes[120..146].copy_from_slice(v);
    }

    pub fn handler_name(&self) -> SizedUtf16String<26> {
        SizedUtf16String::<26>::from_bytes(*self.handler_name_raw())
    }
    pub fn set_handler_name(&mut self, v: &SizedUtf16String<26>) {
        self.set_handler_name_raw(&v.bytes());
    }

    pub fn handler_gender_raw(&self) -> bool {
        util::get_flag(&self.bytes, 146, 0)
    }
    pub fn set_handler_gender_raw(&mut self, v: bool) {
        util::set_flag(&mut self.bytes, 146, 0, v);
    }

    pub fn handler_gender(&self) -> BinaryGender {
        self.handler_gender_raw().into()
    }
    pub fn set_handler_gender(&mut self, v: BinaryGender) {
        self.set_handler_gender_raw(v.into());
    }

    pub fn is_current_handler(&self) -> bool {
        util::get_flag(&self.bytes, 147, 0)
    }
    pub fn set_is_current_handler(&mut self, v: bool) {
        util::set_flag(&mut self.bytes, 147, 0, v);
    }

    pub fn geolocations_raw(&self) -> &[u8; 10] {
        self.bytes[148..158].try_into().unwrap()
    }
    pub fn set_geolocations_raw(&mut self, v: [u8; 10]) {
        self.bytes[148..158].copy_from_slice(&v);
    }

    pub fn geolocations(&self) -> Geolocations {
        Geolocations::from_bytes(*self.geolocations_raw())
    }
    pub fn set_geolocations(&mut self, v: Geolocations) {
        self.set_geolocations_raw(v.to_bytes());
    }

    // 158..161 unused

    pub fn handler_friendship(&self) -> u8 {
        self.bytes[162]
    }
    pub fn set_handler_friendship(&mut self, v: u8) {
        self.bytes[162] = v;
    }

    pub fn handler_affection(&self) -> u8 {
        self.bytes[163]
    }
    pub fn set_handler_affection(&mut self, v: u8) {
        self.bytes[163] = v;
    }

    pub fn handler_memory_intensity(&self) -> u8 {
        self.bytes[164]
    }
    pub fn set_handler_memory_intensity(&mut self, v: u8) {
        self.bytes[164] = v;
    }

    pub fn handler_memory_memory(&self) -> u8 {
        self.bytes[165]
    }
    pub fn set_handler_memory_memory(&mut self, v: u8) {
        self.bytes[165] = v;
    }

    pub fn handler_memory_feeling(&self) -> u8 {
        self.bytes[166]
    }
    pub fn set_handler_memory_feeling(&mut self, v: u8) {
        self.bytes[166] = v;
    }

    pub fn handler_memory_text_variable(&self) -> u16 {
        read_u16_le!(self.bytes, 168)
    }
    pub fn set_handler_memory_text_variable(&mut self, v: u16) {
        self.bytes[168..170].copy_from_slice(&v.to_le_bytes());
    }

    pub fn handler_memory(&self) -> TrainerMemory {
        TrainerMemory {
            intensity: self.handler_memory_intensity(),
            memory: self.handler_memory_memory(),
            feeling: self.handler_memory_feeling(),
            text_variable: self.handler_memory_text_variable(),
        }
    }
    pub fn set_handler_memory(&mut self, v: TrainerMemory) {
        self.set_handler_memory_intensity(v.intensity);
        self.set_handler_memory_memory(v.memory);
        self.set_handler_memory_feeling(v.feeling);
        self.set_handler_memory_text_variable(v.text_variable);
    }

    // 170..173 unused

    pub fn fullness(&self) -> u8 {
        self.bytes[174]
    }
    pub fn set_fullness(&mut self, v: u8) {
        self.bytes[174] = v;
    }

    pub fn enjoyment(&self) -> u8 {
        self.bytes[175]
    }
    pub fn set_enjoyment(&mut self, v: u8) {
        self.bytes[175] = v;
    }

    // ------------------------------------------------------------------
    // Block D  (offsets 176 – 231)
    // ------------------------------------------------------------------

    pub fn trainer_name_raw(&self) -> &[u8; 26] {
        self.bytes[176..202].try_into().unwrap()
    }
    pub fn set_trainer_name_raw(&mut self, v: &[u8; 26]) {
        self.bytes[176..202].copy_from_slice(v);
    }

    pub fn trainer_name(&self) -> SizedUtf16String<26> {
        SizedUtf16String::<26>::from_bytes(*self.trainer_name_raw())
    }
    pub fn set_trainer_name(&mut self, v: &SizedUtf16String<26>) {
        self.set_trainer_name_raw(&v.bytes());
    }

    pub fn trainer_friendship(&self) -> u8 {
        self.bytes[202]
    }
    pub fn set_trainer_friendship(&mut self, v: u8) {
        self.bytes[202] = v;
    }

    pub fn trainer_affection(&self) -> u8 {
        self.bytes[203]
    }
    pub fn set_trainer_affection(&mut self, v: u8) {
        self.bytes[203] = v;
    }

    pub fn trainer_memory_intensity(&self) -> u8 {
        self.bytes[204]
    }
    pub fn set_trainer_memory_intensity(&mut self, v: u8) {
        self.bytes[204] = v;
    }

    pub fn trainer_memory_memory(&self) -> u8 {
        self.bytes[205]
    }
    pub fn set_trainer_memory_memory(&mut self, v: u8) {
        self.bytes[205] = v;
    }

    pub fn trainer_memory_text_variable(&self) -> u16 {
        read_u16_le!(self.bytes, 206)
    }
    pub fn set_trainer_memory_text_variable(&mut self, v: u16) {
        self.bytes[206..208].copy_from_slice(&v.to_le_bytes());
    }

    pub fn trainer_memory_feeling(&self) -> u8 {
        self.bytes[208]
    }
    pub fn set_trainer_memory_feeling(&mut self, v: u8) {
        self.bytes[208] = v;
    }

    pub fn trainer_memory(&self) -> TrainerMemory {
        TrainerMemory {
            intensity: self.trainer_memory_intensity(),
            memory: self.trainer_memory_memory(),
            text_variable: self.trainer_memory_text_variable(),
            feeling: self.trainer_memory_feeling(),
        }
    }
    pub fn set_trainer_memory(&mut self, v: TrainerMemory) {
        self.set_trainer_memory_intensity(v.intensity);
        self.set_trainer_memory_memory(v.memory);
        self.set_trainer_memory_text_variable(v.text_variable);
        self.set_trainer_memory_feeling(v.feeling);
    }

    pub fn egg_date_raw(&self) -> &[u8; 3] {
        self.bytes[209..212].try_into().unwrap()
    }
    pub fn set_egg_date_raw(&mut self, v: [u8; 3]) {
        self.bytes[209..212].copy_from_slice(&v);
    }

    pub fn egg_date(&self) -> Option<PokeDate> {
        PokeDate::from_bytes_optional(*self.egg_date_raw())
    }
    pub fn set_egg_date(&mut self, v: Option<PokeDate>) {
        self.set_egg_date_raw(PokeDate::to_bytes_optional(v));
    }

    pub fn met_date_raw(&self) -> &[u8; 3] {
        self.bytes[212..215].try_into().unwrap()
    }
    pub fn set_met_date_raw(&mut self, v: [u8; 3]) {
        self.bytes[212..215].copy_from_slice(&v);
    }

    pub fn met_date(&self) -> PokeDate {
        PokeDate::from_bytes(*self.met_date_raw())
    }
    pub fn set_met_date(&mut self, v: PokeDate) {
        self.set_met_date_raw(v.to_bytes());
    }

    pub fn egg_location_index(&self) -> u16 {
        read_u16_le!(self.bytes, 216)
    }
    pub fn set_egg_location_index(&mut self, v: u16) {
        self.bytes[216..218].copy_from_slice(&v.to_le_bytes());
    }

    pub fn met_location_index(&self) -> u16 {
        read_u16_le!(self.bytes, 218)
    }
    pub fn set_met_location_index(&mut self, v: u16) {
        self.bytes[218..220].copy_from_slice(&v.to_le_bytes());
    }

    pub fn ball_raw(&self) -> u8 {
        self.bytes[220]
    }
    pub fn set_ball_raw(&mut self, v: u8) {
        self.bytes[220] = v;
    }

    pub fn ball(&self) -> Ball {
        Ball::from(self.ball_raw())
    }
    pub fn set_ball(&mut self, v: Ball) {
        self.set_ball_raw(v as u8);
    }

    // byte 221: bits 0-6 = met level, bit 7 = trainer gender
    pub fn met_level_raw(&self) -> u8 {
        u7::extract_u8(self.bytes[221], 0).into()
    }
    pub fn set_met_level_raw(&mut self, v: u8) {
        self.bytes[221] |= v & 0x7F;
    }

    pub fn met_level(&self) -> u8 {
        self.met_level_raw()
    }
    pub fn set_met_level(&mut self, v: u8) {
        self.set_met_level_raw(v);
    }

    pub fn trainer_gender_raw(&self) -> bool {
        util::get_flag(&self.bytes, 221, 7)
    }
    pub fn set_trainer_gender_raw(&mut self, v: bool) {
        util::set_flag(&mut self.bytes, 221, 7, v);
    }

    pub fn trainer_gender(&self) -> BinaryGender {
        self.trainer_gender_raw().into()
    }
    pub fn set_trainer_gender(&mut self, v: BinaryGender) {
        self.set_trainer_gender_raw(v.into());
    }

    pub fn hyper_training_raw(&self) -> u8 {
        self.bytes[222]
    }
    pub fn set_hyper_training_raw(&mut self, v: u8) {
        self.bytes[222] = v;
    }

    pub fn hyper_training(&self) -> HyperTraining {
        HyperTraining::from_byte(self.hyper_training_raw())
    }
    pub fn set_hyper_training(&mut self, v: HyperTraining) {
        self.set_hyper_training_raw(v.to_byte());
    }

    pub fn game_of_origin_raw(&self) -> u8 {
        self.bytes[223]
    }
    pub fn set_game_of_origin_raw(&mut self, v: u8) {
        self.bytes[223] = v;
    }

    pub fn game_of_origin(&self) -> OriginGame {
        OriginGame::from(self.game_of_origin_raw())
    }
    pub fn set_game_of_origin(&mut self, v: OriginGame) {
        self.set_game_of_origin_raw(v as u8);
    }

    pub fn country(&self) -> u8 {
        self.bytes[224]
    }
    pub fn set_country(&mut self, v: u8) {
        self.bytes[224] = v;
    }

    pub fn region(&self) -> u8 {
        self.bytes[225]
    }
    pub fn set_region(&mut self, v: u8) {
        self.bytes[225] = v;
    }

    pub fn console_region(&self) -> u8 {
        self.bytes[226]
    }
    pub fn set_console_region(&mut self, v: u8) {
        self.bytes[226] = v;
    }

    pub fn language_raw(&self) -> u8 {
        self.bytes[227]
    }
    pub fn set_language_raw(&mut self, v: u8) {
        self.bytes[227] = v;
    }

    pub fn language(&self) -> Result<Language> {
        Ok(Language::try_from(self.language_raw())?)
    }
    pub fn set_language(&mut self, v: Language) {
        self.set_language_raw(v as u8);
    }

    // ------------------------------------------------------------------
    // Party-only fields  (offsets 232 – 259)
    // ------------------------------------------------------------------

    pub fn status_condition(&self) -> u32 {
        read_u32_le!(self.bytes, 232)
    }
    pub fn set_status_condition(&mut self, v: u32) {
        self.bytes[232..236].copy_from_slice(&v.to_le_bytes());
    }

    pub fn stat_level(&self) -> u8 {
        self.bytes[237]
    }
    pub fn set_stat_level(&mut self, v: u8) {
        self.bytes[237] = v;
    }

    pub fn form_argument_remain(&self) -> u8 {
        self.bytes[238]
    }
    pub fn set_form_argument_remain(&mut self, v: u8) {
        self.bytes[238] = v;
    }

    pub fn form_argument_elapsed(&self) -> u8 {
        self.bytes[239]
    }
    pub fn set_form_argument_elapsed(&mut self, v: u8) {
        self.bytes[239] = v;
    }

    pub fn current_hp(&self) -> u16 {
        read_u16_le!(self.bytes, 240)
    }
    pub fn set_current_hp(&mut self, v: u16) {
        self.bytes[240..242].copy_from_slice(&v.to_le_bytes());
    }

    pub fn stats_raw(&self) -> &[u8; 12] {
        self.bytes[242..254].try_into().unwrap()
    }
    pub fn set_stats_raw(&mut self, v: [u8; 12]) {
        self.bytes[242..254].copy_from_slice(&v);
    }

    pub fn stats(&self) -> Stats16Le {
        Stats16Le::from_bytes(*self.stats_raw())
    }
    pub fn set_stats(&mut self, v: Stats16Le) {
        self.set_stats_raw(v.to_bytes());
    }
}
