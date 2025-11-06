use pkm_rs_resources::{
    abilities::AbilityIndex, moves::MoveSlot, natures::NatureIndex, ribbons::ModernRibbonSet,
    species::SpeciesAndForme,
};
use pkm_rs_types::{ContestStats, MarkingsSixShapesColors, Stats8};

use crate::{
    encryption,
    pkm::{Error, Result, buffers::helpers::PkmBuffer},
    strings::SizedUtf16String,
    substructures::Gender,
    util,
};

pub struct Pk7BoxBuffer<'a> {
    buffer: PkmBuffer<'a, 232>,
}

impl<'a> Pk7BoxBuffer<'a> {
    fn get_encryption_constant(&self) -> u32 {
        self.buffer.read_u32_le(0)
    }

    fn set_encryption_constant(&mut self, value: u32) {
        self.buffer.write_u32_le(0, value);
    }

    fn get_sanity(&self) -> u16 {
        self.buffer.read_u16_le(4)
    }

    fn get_stored_checksum(&self) -> u32 {
        self.buffer.read_u32_le(6)
    }

    fn reset_checksum(&mut self) {
        self.buffer
            .write_u16_le(6, encryption::checksum_u16_le(&self.buffer[8..232]));
    }

    fn species_and_forme(&self) -> Result<SpeciesAndForme> {
        SpeciesAndForme::new(
            self.buffer.read_u16_le(8),
            util::read_uint5_from_bits(self.buffer[29], 3).into(),
        )
        .map_err(Error::from)
    }

    fn get_held_item_index(&self) -> u16 {
        self.buffer.read_u16_le(10)
    }

    fn get_trainer_id(&self) -> u16 {
        self.buffer.read_u16_le(12)
    }

    fn set_trainer_id(&mut self, value: u16) {
        self.buffer.write_u16_le(12, value);
    }

    fn get_secret_id(&self) -> u16 {
        self.buffer.read_u16_le(14)
    }

    fn set_secret_id(&mut self, value: u16) {
        self.buffer.write_u16_le(14, value);
    }

    fn get_experience(&self) -> u32 {
        self.buffer.read_u32_le(16)
    }

    fn get_ability_index(&self) -> Result<AbilityIndex> {
        AbilityIndex::try_from(self.buffer[20]).map_err(Error::from)
    }

    fn get_ability_num(&self) -> u8 {
        self.buffer[21]
    }

    fn get_markings(&self) -> MarkingsSixShapesColors {
        MarkingsSixShapesColors::from_bytes(self.buffer[22..24].try_into().unwrap())
    }

    fn get_pid(&self) -> u32 {
        self.buffer.read_u32_le(24)
    }

    fn set_pid(&mut self, value: u32) {
        self.buffer.write_u32_le(24, value);
    }

    fn get_nature_index(&self) -> Result<NatureIndex> {
        NatureIndex::try_from(self.buffer[28]).map_err(Error::from)
    }

    fn get_is_fateful_encounter(&self) -> bool {
        self.buffer.get_flag(29, 0)
    }

    fn get_gender(&self) -> Gender {
        Gender::from_bits_1_2(self.buffer[29])
    }

    fn get_evs(&self) -> Stats8 {
        Stats8::from_bytes(self.buffer[30..36].try_into().unwrap())
    }

    fn get_contest_stats(&self) -> ContestStats {
        ContestStats::from_bytes(self.buffer[36..42].try_into().unwrap())
    }

    fn get_resort_event_status(&self) -> u8 {
        self.buffer[42]
    }

    fn get_pokerus_byte(&self) -> u8 {
        self.buffer[43]
    }

    fn get_super_training_flags(&self) -> u32 {
        self.buffer.read_u32_le(44)
    }

    fn get_ribbons(&self) -> ModernRibbonSet<6> {
        ModernRibbonSet::from_bytes(self.buffer[48..54].try_into().unwrap())
    }

    fn get_contest_memory_count(&self) -> u8 {
        self.buffer[56]
    }

    fn get_battle_memory_count(&self) -> u8 {
        self.buffer[57]
    }

    fn get_super_training_dist_flags(&self) -> u8 {
        self.buffer[58]
    }

    fn get_form_argument(&self) -> u32 {
        self.buffer.read_u32_le(60)
    }

    fn get_nickname(&self) -> SizedUtf16String<26> {
        SizedUtf16String::<26>::from_bytes(self.buffer[64..90].try_into().unwrap())
    }

    fn get_move_slots(&self) -> [MoveSlot; 4] {
        [
            MoveSlot::from_u16(self.buffer.read_u16_le(90)),
            MoveSlot::from_u16(self.buffer.read_u16_le(92)),
            MoveSlot::from_u16(self.buffer.read_u16_le(94)),
            MoveSlot::from_u16(self.buffer.read_u16_le(96)),
        ]
    }

    fn get_move_pp(&self) -> [u8; 4] {
        [
            self.buffer[98],
            self.buffer[99],
            self.buffer[100],
            self.buffer[101],
        ]
    }
}
