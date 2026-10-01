#[cfg(feature = "wasm")]
mod pk3;
#[cfg(feature = "wasm")]
mod pk7;
#[cfg(feature = "wasm")]
mod pk8;
#[cfg(feature = "wasm")]
mod pk9;
#[cfg(feature = "wasm")]
mod pkcblmn;

use crate::convert_strategy::ConvertStrategy;
use crate::ohpkm::v2_sections::pkm_bytes::StoredPkmBytes;
use crate::result::Result;
use crate::traits::Pkm;

use super::v2_sections::{
    CobblemonData, Gen67Data, LegendsArceusData, MainDataV2, ScarletVioletData, SwordShieldData,
};

pub trait OhpkmConvert: Pkm {
    fn to_main_data(&self) -> MainDataV2;

    fn to_gen_67_data(&self) -> Option<Gen67Data> {
        None
    }

    fn to_swsh_data(&self) -> Option<SwordShieldData> {
        None
    }

    fn to_la_data(&self) -> Option<LegendsArceusData> {
        None
    }

    fn to_sv_data(&self) -> Option<ScarletVioletData> {
        None
    }

    fn to_cobblemon_data(&self) -> Option<CobblemonData> {
        None
    }

    // when implementing future functions, also update OhpkmV2::convert_without_backup

    fn from_ohpkm(ohpkm: &super::OhpkmV2, strategy: ConvertStrategy) -> Result<Self>;

    fn bytes_to_stored(bytes: &[u8]) -> Result<StoredPkmBytes>;
}
