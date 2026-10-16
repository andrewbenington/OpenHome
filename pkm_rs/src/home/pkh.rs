use super::core_data::HomeCoreData;
use super::game_data_pa8::HomePa8Data;
use super::game_data_pa9::HomePa9Data;
use super::game_data_pb7::HomePb7Data;
use super::game_data_pb8::HomePb8Data;
use super::game_data_pk8::HomePk8Data;
use super::game_data_pk9::HomePk9Data;
use crate::result::Result;
use crate::traits::IsShiny;
use crate::traits::ModernEvs;

use pkm_rs_types::{Stats8, read_u16_le, read_u32_le, read_u64_le};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "PkhWasm"))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct Pkh {
    // header
    pub data_version: u16,
    pub encryption_seed: u64,
    pub checksum: u32,
    pub encoded_data_size: u16,
    pub core_data_size: u16,
    pub game_data_size: u16,

    pub core_data: HomeCoreData,

    // game data
    pub pb7_data: Option<HomePb7Data>,
    pub pk8_data: Option<HomePk8Data>,
    pub pa8_data: Option<HomePa8Data>,
    pub pb8_data: Option<HomePb8Data>,
    pub pk9_data: Option<HomePk9Data>,
    //pub pc9_data: Option<HomePc9Data>,
    pub pa9_data: Option<HomePa9Data>,
}

impl Pkh {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let core_data_size = read_u16_le!(bytes, 0x10); // 0xC4
        let game_data_size_offset = 0x12 + core_data_size as usize; // 0xD6

        let mut mon = Pkh {
            data_version: read_u16_le!(bytes, 0x00),
            encryption_seed: read_u64_le!(bytes, 0x02),
            checksum: read_u32_le!(bytes, 0x0C),
            encoded_data_size: read_u16_le!(bytes, 0x0E),
            core_data_size,
            game_data_size: read_u16_le!(bytes, game_data_size_offset),
            core_data: HomeCoreData::try_from_bytes(&bytes[0x12..game_data_size_offset])?,
            // initialize game data fields
            pb7_data: None,
            pk8_data: None,
            pa8_data: None,
            pb8_data: None,
            pk9_data: None,
            pa9_data: None,
        };

        // read game data
        let mut byte_counter = game_data_size_offset + 2;

        loop {
            // Crude method of detecting padding that only works because every game data struct is larger than 9 bytes in size
            // This is unlikely to be a problem in the future, but a better method should still be used here...
            let eof_check = Some(bytes[byte_counter + 10]);
            if eof_check.is_none() {
                break;
            }

            // https://github.com/kwsch/PKHeX/blob/master/PKHeX.Core/PKM/HOME/HomeGameDataFormat.cs
            let game_data_type = bytes[byte_counter];
            match game_data_type {
                1 => {
                    mon.pb7_data = HomePb7Data::try_from_bytes(
                        &bytes[byte_counter..byte_counter + super::HOME_PB7_DATA_SIZE],
                    )
                    .ok();
                    byte_counter = byte_counter + super::HOME_PB7_DATA_SIZE + 1;
                }
                2 => {
                    mon.pk8_data = HomePk8Data::try_from_bytes(
                        &bytes[byte_counter..byte_counter + super::HOME_PK8_DATA_SIZE],
                    )
                    .ok();
                    byte_counter = byte_counter + super::HOME_PK8_DATA_SIZE + 1;
                }
                3 => {
                    mon.pa8_data = HomePa8Data::try_from_bytes(
                        &bytes[byte_counter..byte_counter + super::HOME_PA8_DATA_SIZE],
                    )
                    .ok();
                    byte_counter = byte_counter + super::HOME_PA8_DATA_SIZE + 1;
                }
                4 => {
                    mon.pb8_data = HomePb8Data::try_from_bytes(
                        &bytes[byte_counter..byte_counter + super::HOME_PB8_DATA_SIZE],
                    )
                    .ok();
                    byte_counter = byte_counter + super::HOME_PB8_DATA_SIZE + 1;
                }
                5 => {
                    mon.pk9_data = HomePk9Data::try_from_bytes(
                        &bytes[byte_counter..byte_counter + super::HOME_PK9_DATA_SIZE],
                    )
                    .ok();
                    byte_counter = byte_counter + super::HOME_PK9_DATA_SIZE + 1;
                }
                6 => {
                    mon.pa9_data = HomePa9Data::try_from_bytes(
                        &bytes[byte_counter..byte_counter + super::HOME_PA9_DATA_SIZE],
                    )
                    .ok();
                    byte_counter = byte_counter + super::HOME_PA9_DATA_SIZE + 1;
                }
                _ => break, // padding that wasn't found by the initial check
            }
        }

        Ok(mon)
    }

    //fn read_pb7_data(bytes: &[u8], offset: usize, mut counter: usize) -> Result<HomePb7Data> {
    //    counter = offset + super::HOME_PB7_DATA_SIZE + 1;
    //    HomePb7Data::try_from_bytes(&bytes[offset..offset + super::HOME_PB7_DATA_SIZE])
    //}

    //fn read_pk8_data(bytes: &[u8], offset: usize, mut counter: usize) -> Result<HomePk8Data> {
    //    counter = offset + super::HOME_PK8_DATA_SIZE + 1;
    //    HomePk8Data::try_from_bytes(&bytes[offset..offset + super::HOME_PK8_DATA_SIZE])
    //}

    //fn read_pa8_data(bytes: &[u8], offset: usize, mut counter: usize) -> Result<HomePa8Data> {
    //    counter = offset + super::HOME_PA8_DATA_SIZE + 1;
    //    HomePa8Data::try_from_bytes(&bytes[offset..offset + super::HOME_PA8_DATA_SIZE])
    //}

    //fn read_pb8_data(bytes: &[u8], offset: usize, mut counter: usize) -> Result<HomePb8Data> {
    //    counter = offset + super::HOME_PB8_DATA_SIZE + 1;
    //    HomePb8Data::try_from_bytes(&bytes[offset..offset + super::HOME_PB8_DATA_SIZE])
    //}

    //fn read_pk9_data(bytes: &[u8], offset: usize, mut counter: usize) -> Result<HomePk9Data> {
    //    counter = offset + super::HOME_PK9_DATA_SIZE + 1;
    //    HomePk9Data::try_from_bytes(&bytes[offset..offset + super::HOME_PK9_DATA_SIZE])
    //}

    //fn read_pa9_data(bytes: &[u8], offset: usize, mut counter: usize) -> Result<HomePa9Data> {
    //    counter = offset + super::HOME_PA9_DATA_SIZE + 1;
    //    HomePa9Data::try_from_bytes(&bytes[offset..offset + super::HOME_PA9_DATA_SIZE])
    //}
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_class = "PkhWasm")]
#[allow(clippy::missing_const_for_fn)]
impl Pkh {
    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Vec<u8>) -> core::result::Result<Pkh, JsValue> {
        Pkh::from_bytes(&bytes).map_err(JsValue::from)
    }
}

impl ModernEvs for Pkh {
    fn get_evs(&self) -> Stats8 {
        self.core_data.evs
    }
}

impl IsShiny for Pkh {
    fn is_shiny(&self) -> bool {
        self.core_data.is_shiny()
    }

    fn is_square_shiny(&self) -> bool {
        self.core_data.is_square_shiny()
    }
}
