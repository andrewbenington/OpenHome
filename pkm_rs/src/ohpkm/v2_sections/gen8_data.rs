use super::bytes_are_empty;
use crate::ohpkm::v2::OhpkmSectionTag;
use crate::result::{Error, Result};
use crate::sectioned_data::DataSection;
use crate::util;

use pkm_rs_types::FlagSet;
use pkm_rs_types::OriginGame;
use pkm_rs_types::Stats8;
use serde::Serialize;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct SwordShieldData {
    pub can_gigantamax: bool,
    pub dynamax_level: u8,
    pub palma: u32,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tr_flags: [u8; 14],
}

impl SwordShieldData {
    pub fn from_v1(old: crate::ohpkm::v1::OhpkmV1) -> Option<Self> {
        if !old.game_of_origin.is_swsh()
            && !old.can_gigantamax
            && old.palma == 0
            && old.dynamax_level == 0
            && bytes_are_empty(&old.tr_flags_swsh)
        {
            None
        } else {
            Some(Self {
                can_gigantamax: old.can_gigantamax,
                palma: old.palma,
                dynamax_level: old.dynamax_level,
                tr_flags: old.tr_flags_swsh,
            })
        }
    }
}

impl DataSection for SwordShieldData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::SwordShield;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        // try_into() will always succeed thanks to the buffer size check
        Ok(Self {
            can_gigantamax: util::get_flag(bytes, 0, 0),
            dynamax_level: bytes[1],
            palma: u32::from_le_bytes(bytes[2..6].try_into().unwrap()),
            tr_flags: bytes[6..20].try_into().unwrap(),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 20];

        util::set_flag(&mut bytes, 0, 0, self.can_gigantamax);
        bytes[1] = self.dynamax_level;
        bytes[2..6].copy_from_slice(&self.palma.to_le_bytes());
        bytes[6..20].copy_from_slice(&self.tr_flags);

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        !self.can_gigantamax
            && self.palma == 0
            && self.dynamax_level == 0
            && bytes_are_empty(&self.tr_flags)
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct BdspData {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tm_flags: FlagSet<14>,
}

impl BdspData {
    pub fn from_v1(old: crate::ohpkm::v1::OhpkmV1) -> Option<Self> {
        if !old.game_of_origin.is_bdsp() && bytes_are_empty(&old.tm_flags_bdsp) {
            None
        } else {
            Some(Self {
                tm_flags: FlagSet::from_bytes(old.tm_flags_bdsp),
            })
        }
    }
}

impl DataSection for BdspData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::BdspTmFlags;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        // try_into() will always succeed thanks to the buffer size check
        Ok(Self {
            tm_flags: FlagSet::from_bytes(bytes[0..14].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 14];

        bytes.copy_from_slice(&self.tm_flags.to_bytes());

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        self.tm_flags.is_empty()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct LegendsArceusData {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub gvs: Stats8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub move_flags: FlagSet<14>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tutor_flags: FlagSet<8>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub master_flags: FlagSet<8>,
    pub is_alpha: bool,
    pub is_noble: bool,
    pub alpha_move: u16,
    pub flag2: bool,
    pub unknown_a0: u32,
    pub unknown_f3: u8,
}

impl LegendsArceusData {
    pub fn from_v1(old: crate::ohpkm::v1::OhpkmV1) -> Option<Self> {
        if old.game_of_origin != OriginGame::LegendsArceus
            && !old.is_alpha
            && !old.is_noble
            && bytes_are_empty(&old.move_flags_la)
            && bytes_are_empty(&old.tutor_flags_la)
            && bytes_are_empty(&old.master_flags_la)
        {
            None
        } else {
            Some(Self {
                gvs: old.gvs,
                alpha_move: old.alpha_move,
                move_flags: FlagSet::from_bytes(old.move_flags_la),
                tutor_flags: FlagSet::from_bytes(old.tutor_flags_la),
                master_flags: FlagSet::from_bytes(old.master_flags_la),
                is_alpha: old.is_alpha,
                is_noble: old.is_noble,
                flag2: old.flag2_la,
                unknown_f3: old.unknown_f3,
                unknown_a0: old.unknown_a0,
            })
        }
    }
}

impl DataSection for LegendsArceusData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::LegendsArceus;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        // try_into() will always succeed thanks to the buffer size check
        Ok(Self {
            gvs: Stats8::from_bytes(bytes[0..6].try_into().unwrap()),
            alpha_move: u16::from_le_bytes(bytes[6..8].try_into().unwrap()),
            move_flags: FlagSet::from_bytes(bytes[8..22].try_into().unwrap()),
            tutor_flags: FlagSet::from_bytes(bytes[22..30].try_into().unwrap()),
            master_flags: FlagSet::from_bytes(bytes[30..38].try_into().unwrap()),
            is_alpha: util::get_flag(bytes, 38, 0),
            is_noble: util::get_flag(bytes, 38, 1),
            flag2: util::get_flag(bytes, 38, 2),
            unknown_f3: bytes[39],
            unknown_a0: u32::from_le_bytes(bytes[40..44].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 44];

        bytes[0..6].copy_from_slice(&self.gvs.to_bytes());
        bytes[6..8].copy_from_slice(&self.alpha_move.to_le_bytes());
        bytes[8..22].copy_from_slice(&self.move_flags.to_bytes());
        bytes[22..30].copy_from_slice(&self.tutor_flags.to_bytes());
        bytes[30..38].copy_from_slice(&self.master_flags.to_bytes());
        util::set_flag(&mut bytes, 38, 0, self.is_alpha);
        util::set_flag(&mut bytes, 38, 1, self.is_noble);
        util::set_flag(&mut bytes, 38, 2, self.flag2);
        bytes[39] = self.unknown_f3;
        bytes[40..44].copy_from_slice(&self.unknown_a0.to_le_bytes());

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        !self.is_alpha
            && !self.is_noble
            && self.move_flags.is_empty()
            && self.master_flags.is_empty()
            && self.tutor_flags.is_empty()
    }
}
