pub use crate::ohpkm::OhpkmV2;
pub use pkm_rs_resources::abilities::ABILITY_MAX;
use pkm_rs_resources::species::{FormMetadata, SpeciesMetadata};
use pkm_rs_resources::{moves::MoveIndex, species::SpeciesForm};
use serde::Serialize;

use crate::result::Result;
use crate::traits::IsShiny;

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

pub trait HasSpeciesAndForm: Pkm {
    fn get_species_metadata(&self) -> &'static SpeciesMetadata;
    fn get_forme_metadata(&self) -> &'static FormMetadata;

    fn calculate_level(&self) -> u8;
}

pub trait MaybeHasSpeciesAndForm: Pkm {
    fn try_get_species_metadata(&self) -> Option<&'static SpeciesMetadata>;
    fn get_forme_metadata(&self) -> Option<&'static FormMetadata>;

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

    fn to_box_bytes(&self) -> Box<[u8]> {
        let mut bytes = vec![0u8; Self::BOX_SIZE];
        self.write_box_bytes(&mut bytes);
        bytes.into_boxed_slice()
    }
    fn to_party_bytes(&self) -> Box<[u8]> {
        let mut bytes = vec![0u8; Self::PARTY_SIZE];
        self.write_party_bytes(&mut bytes);
        bytes.into_boxed_slice()
    }
}

pub trait PkmBase {
    fn species_and_form(&self) -> Result<SpeciesForm>;
    fn get_move_slots(&self) -> [Result<MoveIndex>; 4];
    fn set_move_slots(&self, move_slots: [Result<MoveIndex>; 4]);
}
