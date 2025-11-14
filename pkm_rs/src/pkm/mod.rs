mod result;

pub mod ohpkm;
pub mod traits;

use pkm_rs_resources::species::{FormeMetadata, SpeciesMetadata};
use serde::Serialize;

pub use pkm_rs_resources::{abilities::ABILITY_MAX, species::NATIONAL_DEX_MAX};
pub use result::*;

use crate::pkm::traits::IsShiny;

pub trait Pkm: Serialize + IsShiny {
    const BOX_SIZE: usize;
    const PARTY_SIZE: usize;

    fn box_size() -> usize;
    fn party_size() -> usize;

    fn from_bytes(bytes: &[u8]) -> Result<Box<Self>>;
    fn write_box_bytes(&self, bytes: &mut [u8]) -> Result<()>;
    fn write_party_bytes(&self, bytes: &mut [u8]) -> Result<()>;
    fn to_box_bytes(&self) -> Result<Vec<u8>>;
    fn to_party_bytes(&self) -> Result<Vec<u8>>;

    fn get_species_metadata(&self) -> &'static SpeciesMetadata;
    fn get_forme_metadata(&self) -> &'static FormeMetadata;

    fn calculate_level(&self) -> u8;
}
