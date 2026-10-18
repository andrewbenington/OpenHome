use super::core_data::HomeCoreData;
use super::game_data_pa8::HomePa8Data;
use super::game_data_pa9::HomePa9Data;
use super::game_data_pb7::HomePb7Data;
use super::game_data_pb8::HomePb8Data;
use super::game_data_pk8::HomePk8Data;
use super::game_data_pk9::HomePk9Data;
use crate::result::Result;
use crate::traits::{HasSpeciesAndForm, IsShiny, ModernEvs, PkmBytes};

use pkm_rs_resources::abilities::AbilityIndexWasm;
use pkm_rs_resources::metadata_source::MetadataSource;
use pkm_rs_resources::species::{FormMetadata, SpeciesMetadata};
use pkm_rs_resources::stats;
use pkm_rs_types::{OriginGame, Stats8, Stats16Le};
use pkm_rs_types::{read_u16_le, read_u32_le, read_u64_le};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use crate::convert_strategy::ConvertStrategy;
#[cfg(feature = "wasm")]
use crate::ohpkm::{OhpkmConvert, OhpkmV2};
#[cfg(feature = "wasm")]
use pkm_rs_types::TeraType;
#[cfg(feature = "wasm")]
use pkm_rs_types::{JsResult, TryIntoTs, TsResult};
#[cfg(feature = "wasm")]
use tsify::Ts;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

pub enum GameData {
    Pb7(Option<HomePb7Data>),
    Pk8(Option<HomePk8Data>),
    Pa8(Option<HomePa8Data>),
    Pb8(Option<HomePb8Data>),
    Pk9(Option<HomePk9Data>),
    Pa9(Option<HomePa9Data>),
}

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
            checksum: read_u32_le!(bytes, 0x0A),
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
            // Crude method of detecting padding that only works because end of file padding is no larger than 6 bytes in size
            // This is unlikely to be a problem in the future, but a better method should still be used here...
            let eof_check = Some(bytes[byte_counter + 6]);
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

    pub fn get_origin_game_data(&self) -> GameData {
        if self.pb7_data.is_some()
            && (self.core_data.game_of_origin.is_lets_go()
                || self.core_data.game_of_origin == OriginGame::Go)
        {
            GameData::Pb7(self.pb7_data)
        } else if self.pk8_data.is_some()
            && (self.core_data.game_of_origin.is_swsh()
                || self.core_data.game_of_origin <= OriginGame::Crystal // Bank
                || self.core_data.game_of_origin == OriginGame::Go // GO via GO Transporter
                || self.core_data.game_of_origin.is_frlg_switch())
        {
            GameData::Pk8(self.pk8_data)
        } else if self.pa8_data.is_some()
            && self.core_data.game_of_origin == OriginGame::LegendsArceus
        {
            GameData::Pa8(self.pa8_data)
        } else if self.pb8_data.is_some() && self.core_data.game_of_origin.is_bdsp() {
            GameData::Pb8(self.pb8_data)
        } else if self.pk9_data.is_some() && self.core_data.game_of_origin.is_scarlet_violet() {
            GameData::Pk9(self.pk9_data)
        } else if self.pa9_data.is_some() && self.core_data.game_of_origin == OriginGame::LegendsZa
        {
            GameData::Pa9(self.pa9_data)
        } else {
            // Pokemon must have at least one game's data. Fall back to PK8.
            GameData::Pk8(self.pk8_data)
        }
    }

    pub fn calculate_stats(&self) -> Stats16Le {
        stats::calculate_all_modern_for_source(
            MetadataSource::ScarletViolet,
            self.core_data.species_and_form,
            &self.core_data.ivs,
            &self.core_data.evs,
            self.calculate_level() as u16,
            self.core_data.mint_nature.get_metadata(),
            Some(self.core_data.hyper_training),
        )
        .expect("All species are valid in HOME")
    }
}

impl PkmBytes for Pkh {
    const BOX_SIZE: usize = super::PH4_PKM_MAX_SIZE;
    const PARTY_SIZE: usize = todo!();

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::from_bytes(bytes)
    }

    fn write_box_bytes(&self, bytes: &mut [u8]) {
        bytes[0..2].copy_from_slice(&self.data_version.to_le_bytes());
        bytes[2..10].copy_from_slice(&self.encryption_seed.to_le_bytes());
        bytes[10..14].copy_from_slice(&self.checksum.to_le_bytes());
        bytes[14..16].copy_from_slice(&self.encoded_data_size.to_le_bytes());
        bytes[16..18].copy_from_slice(&self.core_data_size.to_le_bytes());
    }

    fn to_box_bytes(&self) -> Box<[u8]> {
        let mut bytes = Box::new([0u8; Self::BOX_SIZE]);
        self.write_box_bytes(bytes.as_mut_slice());

        bytes
    }
}

impl HasSpeciesAndForm for Pkh {
    fn get_species_metadata(&self) -> &'static SpeciesMetadata {
        self.core_data.species_and_form.get_species_metadata()
    }

    fn get_form_metadata(&self) -> &'static FormMetadata {
        self.core_data.species_and_form.get_form_metadata()
    }

    fn calculate_level(&self) -> u8 {
        self.get_species_metadata()
            .experience_growth
            .calculate_level(self.core_data.exp)
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_class = "PkhWasm")]
#[allow(clippy::missing_const_for_fn)]
impl Pkh {
    #[wasm_bindgen(js_name = fromOhpkmBytes)]
    pub fn from_ohpkm_bytes(
        bytes: Vec<u8>,
        strategy: tsify::Ts<ConvertStrategy>,
    ) -> JsResult<Self> {
        Ok(Pkh::from_ohpkm(
            &OhpkmV2::from_bytes(&bytes)?,
            strategy.to_rust()?,
        )?)
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_byte_vector(bytes: Vec<u8>) -> core::result::Result<Pkh, JsValue> {
        Pkh::from_bytes(&bytes).map_err(JsValue::from)
    }

    #[wasm_bindgen(js_name = toBytes)]
    pub fn to_bytes_wasm(&self) -> Box<[u8]> {
        self.to_box_bytes()
    }

    #[wasm_bindgen(js_name = calculateStats)]
    pub fn calculate_stats_wasm(&self) -> TsResult<Stats16Le> {
        self.calculate_stats().try_into_ts()
    }

    // Core data

    #[wasm_bindgen(getter = abilityIndex)]
    pub fn ability_index_wasm(&self) -> Option<AbilityIndexWasm> {
        let ability_index_u16 = match self.get_origin_game_data() {
            GameData::Pb7(Some(home_pb7_data)) => return Some(home_pb7_data.ability_index),
            GameData::Pk8(Some(home_pk8_data)) => home_pk8_data.ability_index.to_u16(),
            GameData::Pa8(Some(home_pa8_data)) => home_pa8_data.ability_index.to_u16(),
            GameData::Pb8(Some(home_pb8_data)) => home_pb8_data.ability_index.to_u16(),
            GameData::Pk9(Some(home_pk9_data)) => home_pk9_data.ability_index.to_u16(),
            GameData::Pa9(Some(home_pa9_data)) => home_pa9_data.ability_index.to_u16(),
            GameData::Pb7(None)
            | GameData::Pk8(None)
            | GameData::Pa8(None)
            | GameData::Pb8(None)
            | GameData::Pk9(None)
            | GameData::Pa9(None) => 0,
        };

        AbilityIndexWasm::new(ability_index_u16)
    }

    // Legends Arceus

    #[wasm_bindgen(getter = gvs)]
    pub fn gvs_wasm(&self) -> JsResult<Option<Ts<Stats16Le>>> {
        self.pa8_data
            .map(|data| Stats16Le::from(data.gvs).try_into_ts())
            .transpose()
    }

    #[wasm_bindgen(getter = alphaMove)]
    pub fn alpha_move_wasm(&self) -> Option<u16> {
        self.pa8_data?.alpha_move?.to_raw()
    }

    #[wasm_bindgen(getter = movesLa)]
    pub fn move_flags_la_wasm(&self) -> Option<Vec<u16>> {
        Some(self.pa8_data?.moves.indices())
    }

    #[wasm_bindgen(getter = movePpLa)]
    pub fn move_pp_wasm(&self) -> Option<Vec<u8>> {
        Some(self.pa8_data?.moves.pp())
    }

    #[wasm_bindgen(getter = tutorFlagsLa)]
    pub fn tutor_flags_la_wasm(&self) -> Option<Vec<u8>> {
        Some(self.pa8_data?.tutor_flags_la.bytes().copied().collect())
    }

    #[wasm_bindgen(getter = masterFlagsLa)]
    pub fn master_flags_la_wasm(&self) -> Option<Vec<u8>> {
        Some(self.pa8_data?.master_flags_la.bytes().copied().collect())
    }

    #[wasm_bindgen(getter = isNoble)]
    pub fn is_noble_wasm(&self) -> Option<bool> {
        Some(self.pa8_data?.is_noble)
    }

    #[wasm_bindgen(getter = isAlpha)]
    pub fn is_alpha_wasm(&self) -> Option<bool> {
        Some(self.pa8_data?.is_alpha)
    }

    // Scarlet/Violet

    #[wasm_bindgen(getter = teraTypeOriginal)]
    pub fn tera_type_original_wasm(&self) -> JsResult<Option<Ts<TeraType>>> {
        self.pk9_data
            .map(|d| d.tera_type_original.try_into_ts())
            .transpose()
    }

    #[wasm_bindgen(getter = teraTypeOverride)]
    pub fn tera_type_override_wasm(&self) -> JsResult<Option<Ts<TeraType>>> {
        self.pk9_data
            .and_then(|d| d.tera_type_override)
            .map(|t| t.try_into_ts())
            .transpose()
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
