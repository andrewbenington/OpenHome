use pkm_rs_resources::{moves::MoveSlot, species::SpeciesAndForme};

use crate::pkm::result::Result;

pub trait PkmBase {
    fn species_and_forme(&self) -> Result<SpeciesAndForme>;
    fn get_move_slots(&self) -> [Result<MoveSlot>; 4];
    fn set_move_slots(&self, move_slots: [Result<MoveSlot>; 4]);
}
