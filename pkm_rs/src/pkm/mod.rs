mod result;

pub mod convert_strategy;
pub mod ohpkm;
pub mod traits;

use pkm_rs_resources::species::{FormeMetadata, SpeciesMetadata};
#[cfg(feature = "wasm")]
use pkm_rs_types::{Generation, OriginGame};
use serde::{Deserialize, Serialize};

pub use pkm_rs_resources::{abilities::ABILITY_MAX, species::NATIONAL_DEX_MAX};
pub use result::*;
use tsify::Tsify;

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

#[cfg(feature = "wasm")]
#[cfg_attr(feature = "wasm", derive(Tsify, Serialize, Deserialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PkmFormat {
    PK1,
    PK2,
    PK3,
    COLOPKM,
    XDPKM,
    PK4,
    PK5,
    PK6,
    PK7,
    PB7,
    PK8,
    PA8,
    PB8,
    PK9,
    PA9,

    PK3RR,
    PK3UB,
    PB8LUMI,
}

#[cfg(feature = "wasm")]
impl PkmFormat {
    pub const fn species_nickname_all_caps(&self) -> bool {
        matches!(
            self,
            Self::PK1 | Self::PK2 | Self::PK3 | Self::COLOPKM | Self::XDPKM | Self::PK4
        )
    }

    pub fn matches_origin(&self, origin: OriginGame) -> bool {
        match self {
            Self::PK1 => origin.generation() == Generation::G1,
            Self::PK2 => origin.generation() == Generation::G2,
            Self::PK3 => origin.is_gba(),
            Self::COLOPKM | Self::XDPKM => origin == OriginGame::ColosseumXd,
            Self::PK4 => origin.generation() == Generation::G4,
            Self::PK5 => origin.generation() == Generation::G5,
            Self::PK6 => origin.generation() == Generation::G6,
            Self::PK7 => origin.is_sm_usum(),
            Self::PB7 => origin.is_lets_go(),
            Self::PK8 => origin.is_swsh(),
            Self::PA8 => origin == OriginGame::LegendsArceus,
            Self::PB8 => origin.is_bdsp(),
            Self::PK9 => origin.is_scarlet_violet(),
            Self::PA9 => origin == OriginGame::LegendsZa,
            Self::PK3RR | Self::PK3UB | Self::PB8LUMI => false,
        }
    }
}
