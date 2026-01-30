mod pb7;
mod pk5;
mod pk6;
mod pk7;
mod pk8;
mod plugins;
mod result;
mod universal;

pub mod buffers;
pub mod ohpkm;
pub mod traits;

use pkm_rs_resources::species::{FormeMetadata, SpeciesMetadata};
use serde::Serialize;

pub use plugins::rr::pk3rr::Pk3rr;
pub use plugins::ub::pk3ub::Pk3ub;

pub use ohpkm::OhpkmV2;
pub use pb7::Pb7;
pub use pk5::Pk5;
pub use pk6::Pk6;
pub use pk7::Pk7;
pub use pk8::Pk8;
pub use pkm_rs_resources::{abilities::ABILITY_MAX, species::NATIONAL_DEX_MAX};
pub use result::*;
pub use universal::UniversalPkm;

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
