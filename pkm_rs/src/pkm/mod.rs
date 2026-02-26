mod pb7;
mod pk3;
mod pk5;
mod pk6;
mod pk7;
mod pk8;
mod plugins;
mod result;

pub mod ohpkm;
pub mod traits;

#[cfg(test)]
mod tests;

use pkm_rs_resources::species::{FormeMetadata, SpeciesMetadata};
use serde::Serialize;

pub use plugins::rr::pk3rr::Pk3rr;
pub use plugins::ub::pk3ub::Pk3ub;

pub use ohpkm::OhpkmV2;
pub use pb7::Pb7;
pub use pk3::Pk3;
pub use pk5::Pk5;
pub use pk6::Pk6;
pub use pk7::Pk7;
pub use pk8::Pk8;
pub use pkm_rs_resources::{abilities::ABILITY_MAX, species::NATIONAL_DEX_MAX};
pub use result::*;

use crate::pkm::traits::IsShiny;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg(not(feature = "randomize"))]
pub trait Pkm: PkmBytes + Serialize + IsShiny + Sized {}
#[cfg(feature = "randomize")]
pub trait Pkm: PkmBytes + Serialize + IsShiny + Sized + Randomize {}

#[cfg(not(feature = "randomize"))]
impl<T: PkmBytes + Serialize + IsShiny + Sized> Pkm for T {}
#[cfg(feature = "randomize")]
impl<T: PkmBytes + Serialize + IsShiny + Sized + Randomize> Pkm for T {}

pub trait HasSpeciesAndForme: Pkm {
    fn get_species_metadata(&self) -> &'static SpeciesMetadata;
    fn get_forme_metadata(&self) -> &'static FormeMetadata;

    fn calculate_level(&self) -> u8;
}

pub trait MaybeHasSpeciesAndForme: Pkm {
    fn try_get_species_metadata(&self) -> Option<&'static SpeciesMetadata>;
    fn get_forme_metadata(&self) -> Option<&'static FormeMetadata>;

    fn calculate_level(&self) -> Option<u8>;
}

pub trait PkmBytes: Sized {
    const BOX_SIZE: usize;
    // if not specified, assume box/party representation is the same (as is the case for gen 8+)
    const PARTY_SIZE: usize = Self::BOX_SIZE;

    fn from_bytes(bytes: &[u8]) -> Result<Self>;
    fn write_box_bytes(&self, bytes: &mut [u8]);

    // if not specified, assume box/party representation is the same (as is the case for gen 8+)
    fn write_party_bytes(&self, bytes: &mut [u8]) {
        self.write_box_bytes(bytes);
    }

    fn to_box_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::with_capacity(Self::BOX_SIZE);
        self.write_box_bytes(&mut bytes);
        bytes
    }
    fn to_party_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::with_capacity(Self::PARTY_SIZE);
        self.write_party_bytes(&mut bytes);
        bytes
    }
}
