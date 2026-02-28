use pkm_rs_resources::{moves::MoveIndex, species::SpeciesAndForme};

use crate::pkm::result::Result;

pub trait PkmBase {
    fn species_and_forme(&self) -> Result<SpeciesAndForme>;
    fn get_move_slots(&self) -> [Result<MoveIndex>; 4];
    fn set_move_slots(&self, move_slots: [Result<MoveIndex>; 4]);
}
