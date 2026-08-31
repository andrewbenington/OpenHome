#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

use crate::Empty;

pub const COLO_UNKNOWN_BLOCKS_SIZE: usize = 20;

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Default, Debug, Clone, Copy)]
pub struct ColoUnknownBlocks {
    pub unknown_data_0x02: [u8; 2],
    pub unknown_data_0x11: [u8; 3],
    pub unknown_data_0x61: [u8; 4],
    pub unknown_data_0xce: [u8; 1],
    pub unknown_data_0xd1: [u8; 4],
    pub unknown_data_0xda: [u8; 2],
    pub unknown_data_0xe4: [u8; 4],
}

impl Empty for ColoUnknownBlocks {
    fn is_empty(&self) -> bool {
        self.unknown_data_0x02.is_empty()
            && self.unknown_data_0x11.is_empty()
            && self.unknown_data_0x61.is_empty()
            && self.unknown_data_0xd1.is_empty()
            && self.unknown_data_0xda.is_empty()
            && self.unknown_data_0xe4.is_empty()
            && self.unknown_data_0xce.is_empty()
    }
}

pub const COLO_IN_GAME_PTRS_SIZE: usize = 60;

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Clone, Copy)]
pub struct ColoInGamePtrs(pub [u8; COLO_IN_GAME_PTRS_SIZE]);

impl Default for ColoInGamePtrs {
    fn default() -> Self {
        Self([0u8; COLO_IN_GAME_PTRS_SIZE])
    }
}

impl Empty for ColoInGamePtrs {
    fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}
