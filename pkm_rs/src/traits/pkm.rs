pub use crate::ohpkm::OhpkmV2;
use pkm_rs_resources::species::{FormeMetadata, SpeciesMetadata};
pub use pkm_rs_resources::{abilities::ABILITY_MAX, species::NATIONAL_DEX_MAX};
use pkm_rs_resources::{moves::MoveIndex, species::SpeciesAndForm};
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
    fn get_forme_metadata(&self) -> &'static FormeMetadata;

    fn calculate_level(&self) -> u8;
}

pub trait MaybeHasSpeciesAndForm: Pkm {
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

pub trait PkmBase {
    fn species_and_form(&self) -> Result<SpeciesAndForm>;
    fn get_move_slots(&self) -> [Result<MoveIndex>; 4];
    fn set_move_slots(&self, move_slots: [Result<MoveIndex>; 4]);
}
