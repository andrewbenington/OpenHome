use crate::ohpkm::v2::OhpkmSectionTag;
use crate::result::{Error, Result};
use crate::sectioned_data::DataSection;

use arrayref::{array_ref, array_refs, mut_array_refs};
use pkm_rs_types::shadow::{ColoShadowId, ShadowData, ShadowId, XdShadowId};
use pkm_rs_types::{
    COLO_IN_GAME_PTRS_SIZE, COLO_UNKNOWN_BLOCKS_SIZE, ColoInGamePtrs, ColoUnknownBlocks, Empty,
    GcnRegion, NationalDex, read_i32_le, read_u32_le,
};
use serde::Serialize;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Default, Debug, Serialize, Clone, Copy)]
pub struct OrreData {
    pub shadow_data: Option<ShadowData>,
    pub current_region: GcnRegion,
    pub original_region: GcnRegion,
}

impl OrreData {
    // Because the shadow gauge was not tracked in v1, give any Pokémon marked as shadow the
    // initial gauge. Pokémon that
    pub fn from_v1(old: crate::ohpkm::v1::OhpkmV1) -> Option<Self> {
        if !old.is_shadow {
            return None;
        }

        let national_dex = old.species_and_form.get_ndex();

        let shadow_id = if national_dex == NationalDex::Makuhita {
            makuhita_id(old.is_fateful_encounter)
        } else if let Some(shadow_id) = ColoShadowId::by_ndex(national_dex) {
            ShadowId::Colo(shadow_id)
        } else {
            let shadow_id = XdShadowId::by_ndex(national_dex)?;
            ShadowId::Xd(shadow_id)
        };

        Some(Self {
            shadow_data: Some(ShadowData::full_shadow_gauge(shadow_id)),
            current_region: GcnRegion::None,
            original_region: GcnRegion::None,
        })
    }
}

fn makuhita_id(fateful_encounter: bool) -> ShadowId {
    if fateful_encounter {
        ShadowId::makuhita_xd()
    } else {
        ShadowId::makuhita_colo()
    }
}

impl From<pkm_rs_types::shadow::BadShadowData> for Error {
    fn from(value: pkm_rs_types::shadow::BadShadowData) -> Self {
        Self::PkmRsTypes(pkm_rs_types::Error::from(value))
    }
}

impl DataSection for OrreData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::OrreData;

    type ErrorType = Error;
    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        let id = ShadowId::from_bytes(bytes[0..1].try_into().unwrap())
            .map_err(pkm_rs_types::Error::from)
            .ok();

        let purification = read_i32_le!(bytes, 2);
        let exp = read_u32_le!(bytes, 6);

        let shadow_data = if let Some(id) = id {
            Some(ShadowData::try_new(id, purification, exp)?)
        } else {
            None
        };

        Ok(Self {
            shadow_data,
            current_region: GcnRegion::from_byte(bytes[11]),
            original_region: GcnRegion::from_byte(bytes[12]),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 12];

        if let Some(shadow_data) = self.shadow_data {
            bytes[0..2].copy_from_slice(&shadow_data.id().to_raw_u16().to_le_bytes());
            bytes[2..6].copy_from_slice(&shadow_data.purification().to_i32().to_le_bytes());
            bytes[6..10].copy_from_slice(&shadow_data.exp().to_le_bytes());
        }

        bytes[10] = self.current_region as u8;
        bytes[11] = self.original_region as u8;

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        false
    }
}

const fn colo_unknown_blocks_from_bytes(
    bytes: &[u8; COLO_UNKNOWN_BLOCKS_SIZE],
) -> ColoUnknownBlocks {
    let (
        unknown_data_0x02,
        unknown_data_0x11,
        unknown_data_0x61,
        unknown_data_0xce,
        unknown_data_0xd1,
        unknown_data_0xda,
        unknown_data_0xe4,
    ) = array_refs![bytes, 2, 3, 4, 1, 4, 2, 4];

    ColoUnknownBlocks {
        unknown_data_0x02: *unknown_data_0x02,
        unknown_data_0x11: *unknown_data_0x11,
        unknown_data_0x61: *unknown_data_0x61,
        unknown_data_0xce: *unknown_data_0xce,
        unknown_data_0xd1: *unknown_data_0xd1,
        unknown_data_0xda: *unknown_data_0xda,
        unknown_data_0xe4: *unknown_data_0xe4,
    }
}

fn colo_unknown_blocks_to_bytes(
    unknown_blocks: &ColoUnknownBlocks,
) -> [u8; COLO_UNKNOWN_BLOCKS_SIZE] {
    let mut bytes = [0u8; COLO_UNKNOWN_BLOCKS_SIZE];

    let (
        unknown_data_0x02,
        unknown_data_0x11,
        unknown_data_0x61,
        unknown_data_0xce,
        unknown_data_0xd1,
        unknown_data_0xda,
        unknown_data_0xe4,
    ) = mut_array_refs![&mut bytes, 2, 3, 4, 1, 4, 2, 4];

    *unknown_data_0x02 = unknown_blocks.unknown_data_0x02;
    *unknown_data_0x11 = unknown_blocks.unknown_data_0x11;
    *unknown_data_0x61 = unknown_blocks.unknown_data_0x61;
    *unknown_data_0xce = unknown_blocks.unknown_data_0xce;
    *unknown_data_0xd1 = unknown_blocks.unknown_data_0xd1;
    *unknown_data_0xda = unknown_blocks.unknown_data_0xda;
    *unknown_data_0xe4 = unknown_blocks.unknown_data_0xe4;

    bytes
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Default, Debug, Clone, Copy)]
pub struct ColoUnusedData {
    pub party_index: u8,
    pub unknown_blocks: ColoUnknownBlocks,
    pub in_game_ptrs: ColoInGamePtrs,
}

impl Empty for ColoUnusedData {
    fn is_empty(&self) -> bool {
        self.party_index.is_empty()
            && self.unknown_blocks.is_empty()
            && self.in_game_ptrs.is_empty()
    }
}

pub const COLO_UNUSED_DATA_SIZE: usize =
    size_of::<u8>() + COLO_UNKNOWN_BLOCKS_SIZE + COLO_IN_GAME_PTRS_SIZE;

impl DataSection for ColoUnusedData {
    type ErrorType = Error;

    type TagType = OhpkmSectionTag;

    const TAG: Self::TagType = OhpkmSectionTag::ColosseumUnusedData;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let sized: &[u8; COLO_UNUSED_DATA_SIZE] = array_ref![bytes, 0, COLO_UNUSED_DATA_SIZE];

        let (party_index_bytes, unknown_block_bytes, in_game_ptr_bytes) = array_refs![
            sized,
            size_of::<u8>(),
            COLO_UNKNOWN_BLOCKS_SIZE,
            COLO_IN_GAME_PTRS_SIZE
        ];

        Ok(Self {
            party_index: party_index_bytes[0],
            unknown_blocks: colo_unknown_blocks_from_bytes(unknown_block_bytes),
            in_game_ptrs: ColoInGamePtrs(*in_game_ptr_bytes),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; COLO_UNUSED_DATA_SIZE];

        let (party_index_bytes, unknown_block_bytes, in_game_ptr_bytes) = mut_array_refs![
            &mut bytes,
            size_of::<u8>(),
            COLO_UNKNOWN_BLOCKS_SIZE,
            COLO_IN_GAME_PTRS_SIZE
        ];

        *party_index_bytes = [self.party_index];
        *unknown_block_bytes = colo_unknown_blocks_to_bytes(&self.unknown_blocks);
        *in_game_ptr_bytes = self.in_game_ptrs.0;

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        Empty::is_empty(self)
    }
}
