#[cfg(feature = "wasm")]
mod pk3;
#[cfg(feature = "wasm")]
mod pk7;

use crate::result::Result;
use crate::{
    convert_strategy::ConvertStrategy, ohpkm::v2_sections::pkm_bytes::StoredPkmBytes, traits::Pkm,
};

use super::v2_sections::{Gen67Data, MainDataV2};

pub trait OhpkmConvert: Pkm {
    fn to_main_data(&self) -> MainDataV2;

    fn to_gen_67_data(&self) -> Option<Gen67Data> {
        None
    }

    fn from_ohpkm(ohpkm: &super::OhpkmV2, strategy: ConvertStrategy) -> Self;

    fn bytes_to_stored(bytes: &[u8]) -> Result<StoredPkmBytes>;
}
