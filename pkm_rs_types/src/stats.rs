use crate::util::bit_is_set;
use pkm_rs_derive::Stats;
use serde::Serialize;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub trait Stats: Sized {
    fn get_hp(&self) -> u16;
    fn get_atk(&self) -> u16;
    fn get_def(&self) -> u16;
    fn get_spa(&self) -> u16;
    fn get_spd(&self) -> u16;
    fn get_spe(&self) -> u16;
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy, Stats)]
pub struct Stats8 {
    pub hp: u8,
    pub atk: u8,
    pub def: u8,
    pub spa: u8,
    pub spd: u8,
    pub spe: u8,
}

impl Stats8 {
    pub const fn from_bytes(bytes: [u8; 6]) -> Self {
        Stats8 {
            hp: bytes[0],
            atk: bytes[1],
            def: bytes[2],
            spe: bytes[3],
            spa: bytes[4],
            spd: bytes[5],
        }
    }

    pub const fn to_bytes(self) -> [u8; 6] {
        [self.hp, self.atk, self.def, self.spe, self.spa, self.spd]
    }

    pub fn from_30_bits(bytes: [u8; 4]) -> Self {
        let iv_bytes = u32::from_le_bytes(bytes);
        Stats8 {
            hp: (iv_bytes & 0x1f).try_into().unwrap(),
            atk: ((iv_bytes >> 5) & 0x1f).try_into().unwrap(),
            def: ((iv_bytes >> 10) & 0x1f).try_into().unwrap(),
            spe: ((iv_bytes >> 15) & 0x1f).try_into().unwrap(),
            spa: ((iv_bytes >> 20) & 0x1f).try_into().unwrap(),
            spd: ((iv_bytes >> 25) & 0x1f).try_into().unwrap(),
        }
    }

    pub fn write_30_bits(&self, bytes: &mut [u8], byte_offset: usize) {
        let current_val =
            u32::from_le_bytes(bytes[byte_offset..byte_offset + 4].try_into().unwrap());
        let mut numeric_val: u32 = self.spd as u32;
        numeric_val <<= 5;
        numeric_val |= self.spa as u32;
        numeric_val <<= 5;
        numeric_val |= self.spe as u32;
        numeric_val <<= 5;
        numeric_val |= self.def as u32;
        numeric_val <<= 5;
        numeric_val |= self.atk as u32;
        numeric_val <<= 5;
        numeric_val |= self.hp as u32;

        numeric_val |= current_val & (0b11 << 30);

        bytes[byte_offset..byte_offset + 4].copy_from_slice(&numeric_val.to_le_bytes());
    }

    const fn gv_from_iv(iv: u8) -> u8 {
        match iv {
            0..=19 => 0,
            20..=25 => 1,
            26..=30 => 2,
            31.. => 3,
        }
    }

    pub const fn gvs_from_ivs(&self) -> Stats8 {
        Stats8 {
            hp: Stats8::gv_from_iv(self.hp),
            atk: Stats8::gv_from_iv(self.atk),
            def: Stats8::gv_from_iv(self.def),
            spa: Stats8::gv_from_iv(self.spa),
            spd: Stats8::gv_from_iv(self.spd),
            spe: Stats8::gv_from_iv(self.spe),
        }
    }

    pub const fn dvs_from_ivs(self, is_shiny: bool) -> StatsPreSplit {
        if is_shiny {
            let mut atk_dv = (self.atk - 1).div_ceil(2);

            if (atk_dv & 0b11) == 0b01 {
                atk_dv += 1
            } else if atk_dv % 4 == 0 {
                atk_dv += 2
            }
            let hp_dv = (atk_dv & 1) << 3;

            StatsPreSplit {
                hp: hp_dv as u16,
                atk: atk_dv as u16,
                def: 10,
                spc: 10,
                spe: 10,
            }
        } else {
            StatsPreSplit {
                hp: (self.hp - 1).div_ceil(2) as u16,
                atk: (self.atk - 1).div_ceil(2) as u16,
                def: (self.def - 1).div_ceil(2) as u16,
                spc: (self.spa.midpoint(self.spd) - 1).div_ceil(2) as u16,
                spe: (self.spe - 1).div_ceil(2) as u16,
            }
        }
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl Stats8 {
    #[wasm_bindgen(constructor)]
    #[allow(clippy::missing_const_for_fn)]
    pub fn new(hp: u8, atk: u8, def: u8, spa: u8, spd: u8, spe: u8) -> Self {
        Stats8 {
            hp,
            atk,
            def,
            spa,
            spd,
            spe,
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy, Stats)]
pub struct Stats16Le {
    pub hp: u16,
    pub atk: u16,
    pub def: u16,
    pub spa: u16,
    pub spd: u16,
    pub spe: u16,
}

fn u16_le_slice_to_u8<const N: usize>(slice: [u16; N]) -> Vec<u8> {
    slice.into_iter().flat_map(u16::to_le_bytes).collect()
}

impl Stats16Le {
    pub const fn new(hp: u16, atk: u16, def: u16, spa: u16, spd: u16, spe: u16) -> Self {
        Stats16Le {
            hp,
            atk,
            def,
            spa,
            spd,
            spe,
        }
    }

    pub fn from_bytes(bytes: [u8; 12]) -> Self {
        Stats16Le {
            hp: u16::from_le_bytes(bytes[0..2].try_into().unwrap()),
            atk: u16::from_le_bytes(bytes[2..4].try_into().unwrap()),
            def: u16::from_le_bytes(bytes[4..6].try_into().unwrap()),
            spe: u16::from_le_bytes(bytes[6..8].try_into().unwrap()),
            spa: u16::from_le_bytes(bytes[8..10].try_into().unwrap()),
            spd: u16::from_le_bytes(bytes[10..12].try_into().unwrap()),
        }
    }

    pub fn to_bytes(self) -> [u8; 12] {
        u16_le_slice_to_u8([self.hp, self.atk, self.def, self.spe, self.spa, self.spd])
            .try_into()
            .unwrap()
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl Stats16Le {
    #[wasm_bindgen(constructor)]
    #[allow(clippy::missing_const_for_fn)]
    pub fn new_from_js(hp: u16, atk: u16, def: u16, spa: u16, spd: u16, spe: u16) -> Self {
        Stats16Le {
            hp,
            atk,
            def,
            spa,
            spd,
            spe,
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct HyperTraining {
    pub hp: bool,
    pub atk: bool,
    pub def: bool,
    pub spa: bool,
    pub spd: bool,
    pub spe: bool,
}

impl HyperTraining {
    pub const fn from_byte(byte: u8) -> Self {
        HyperTraining {
            hp: bit_is_set(byte, 0),
            atk: bit_is_set(byte, 1),
            def: bit_is_set(byte, 2),
            spa: bit_is_set(byte, 3),
            spd: bit_is_set(byte, 4),
            spe: bit_is_set(byte, 5),
        }
    }

    pub const fn to_byte(self) -> u8 {
        (self.hp as u8)
            | ((self.atk as u8) << 1)
            | ((self.def as u8) << 2)
            | ((self.spa as u8) << 3)
            | ((self.spd as u8) << 4)
            | ((self.spe as u8) << 5)
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl HyperTraining {
    #[wasm_bindgen(constructor)]
    #[allow(clippy::missing_const_for_fn)]
    pub fn new(hp: bool, atk: bool, def: bool, spa: bool, spd: bool, spe: bool) -> Self {
        HyperTraining {
            hp,
            atk,
            def,
            spa,
            spd,
            spe,
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct StatsPreSplit {
    pub hp: u16,
    pub atk: u16,
    pub def: u16,
    pub spc: u16,
    pub spe: u16,
}

impl StatsPreSplit {
    // pub fn from_bytes_be(bytes: [u8; 10]) -> Self {
    //     StatsPreSplit {
    //         hp: u16::from_be_bytes(bytes[0..2].try_into().unwrap()),
    //         atk: u16::from_be_bytes(bytes[2..4].try_into().unwrap()),
    //         def: u16::from_be_bytes(bytes[4..6].try_into().unwrap()),
    //         spe: u16::from_be_bytes(bytes[6..8].try_into().unwrap()),
    //         spc: u16::from_be_bytes(bytes[8..10].try_into().unwrap()),
    //     }
    // }

    pub const fn from_dv_bytes(bytes: &[u8; 2]) -> Self {
        let dv_bytes = u16::from_be_bytes([bytes[0], bytes[1]]);
        StatsPreSplit {
            spc: dv_bytes & 0x0f,
            spe: (dv_bytes >> 4) & 0x0f,
            def: (dv_bytes >> 8) & 0x0f,
            atk: (dv_bytes >> 12) & 0x0f,
            hp: (((dv_bytes >> 12) & 1) << 3)
                | (((dv_bytes >> 8) & 1) << 2)
                | (((dv_bytes >> 4) & 1) << 1)
                | (dv_bytes & 1),
        }
    }

    pub const fn to_dv_bytes(self) -> [u8; 2] {
        let dv_val_u16: u16 = self.atk & 0x0f;
        let dv_val_u16 = (dv_val_u16 << 4) | (self.def & 0x0f);
        let dv_val_u16 = (dv_val_u16 << 4) | (self.spe & 0x0f);
        let dv_val_u16 = (dv_val_u16 << 4) | (self.spc & 0x0f);

        dv_val_u16.to_be_bytes()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct ContestStats {
    pub cool: u8,
    pub beauty: u8,
    pub cute: u8,
    pub smart: u8,
    pub tough: u8,
    pub sheen: u8,
}

impl ContestStats {
    pub const fn from_bytes(bytes: [u8; 6]) -> Self {
        ContestStats {
            cool: bytes[0],
            beauty: bytes[1],
            cute: bytes[2],
            smart: bytes[3],
            tough: bytes[4],
            sheen: bytes[5],
        }
    }

    pub const fn to_bytes(self) -> [u8; 6] {
        [
            self.cool,
            self.beauty,
            self.cute,
            self.smart,
            self.tough,
            self.sheen,
        ]
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl ContestStats {
    #[wasm_bindgen(constructor)]
    pub fn new(cool: u8, beauty: u8, cute: u8, smart: u8, tough: u8, sheen: u8) -> Self {
        ContestStats {
            cool,
            beauty,
            cute,
            smart,
            tough,
            sheen,
        }
    }
}
