use crate::pkm::result::Result;
use crate::resources::{MoveSlot, SpeciesAndForme};

pub trait PkmBase {
    fn species_and_forme(&self) -> Result<SpeciesAndForme>;
    fn get_move_slots(&self) -> [Result<MoveSlot>; 4];
    fn set_move_slots(&self, move_slots: [Result<MoveSlot>; 4]);
}
