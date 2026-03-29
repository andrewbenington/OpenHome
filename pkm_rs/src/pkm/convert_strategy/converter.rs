use super::{ConvertStrategy, MetDataStrategy};
use crate::pkm::format::PkmFormat;
use crate::pkm::location::{Location, MetData};
use crate::pkm::ohpkm::OhpkmV2;

use pkm_rs_types::{OriginGame, Stats8};
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct PkmConverter {
    dest_pkm_format: PkmFormat,
    strategy: ConvertStrategy,
}

impl PkmConverter {
    pub const fn new(dest_pkm_format: PkmFormat, strategy: ConvertStrategy) -> Self {
        Self {
            dest_pkm_format,
            strategy,
        }
    }

    pub fn nickname(&self, ohpkm: &OhpkmV2) -> String {
        if !ohpkm.nickname_matches_species_eng() {
            return ohpkm.get_nickname().to_owned();
        }

        match self.strategy.nickname_capitalization {
            super::NicknameCapitalization::Modern => ohpkm.species_metadata().name.to_owned(),
            super::NicknameCapitalization::GameDefault => {
                if self.dest_pkm_format.species_nickname_all_caps() {
                    ohpkm.species_metadata().name.to_uppercase()
                } else {
                    ohpkm.species_metadata().name.to_owned()
                }
            }
        }
    }

    pub fn met_data(&self, ohpkm: &OhpkmV2) -> MetData {
        match self.strategy.met_data_origin_location {
            MetDataStrategy::MaximizeLegality => {
                self.dest_pkm_format.met_data_maximizing_legality(ohpkm)
            }
            MetDataStrategy::UseLocationNameMatch => MetData::new(
                self.dest_pkm_format.default_origin(),
                self.met_location_index(ohpkm),
            ),
        }
    }

    pub fn met_location_index_diamond_pearl(&self, ohpkm: &OhpkmV2) -> u16 {
        let location_index = self.met_data(ohpkm).location_index;

        if !valid_dp_location_index(location_index) {
            DP_FARAWAY_PLACE
        } else {
            location_index
        }
    }

    pub fn met_location_index_platinum_hgss(&self, ohpkm: &OhpkmV2) -> u16 {
        let met_data = self.met_data(ohpkm);

        let pt_or_hgss_origin = matches!(
            met_data.origin,
            OriginGame::Platinum | OriginGame::HeartGold | OriginGame::SoulSilver
        );
        let location_not_in_dp = !valid_dp_location_index(met_data.location_index);

        if pt_or_hgss_origin || location_not_in_dp {
            met_data.location_index
        } else {
            0
        }
    }

    fn met_location_index(&self, ohpkm: &OhpkmV2) -> u16 {
        let ohpkm_origin = ohpkm.get_game_of_origin();
        let ohpkm_met_location = ohpkm.get_met_location_index();

        if self.dest_pkm_format.matches_origin(ohpkm_origin) {
            // this format matches the origin game, so the met location index should be valid in the new format
            return ohpkm_met_location;
        }

        let best_match = Location::game_setting_best_match(ohpkm_origin);
        if let Some(game_setting) = self.dest_pkm_format.location_index_of(best_match) {
            return game_setting;
        }

        let most_compatible = Location::game_setting_most_compatible(ohpkm_origin);
        if let Some(game_setting) = self.dest_pkm_format.location_index_of(most_compatible) {
            return game_setting;
        }

        self.dest_pkm_format.fallback_location_index()
    }

    pub fn ivs(&self, ohpkm: &OhpkmV2) -> Stats8 {
        if !self.dest_pkm_format.supports_hyper_training() && self.strategy.max_iv_if_hyper_trained
        {
            let mut ivs = ohpkm.get_ivs();
            for (stat, is_hyper_trained) in ohpkm.get_hyper_training() {
                if is_hyper_trained {
                    ivs.set(stat, 31);
                }
            }
            ivs
        } else {
            ohpkm.get_ivs()
        }
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl PkmConverter {
    #[wasm_bindgen(constructor)]
    pub fn new_wasm(dest_pkm_format: PkmFormat, strategy: ConvertStrategy) -> Self {
        Self::new(dest_pkm_format, strategy)
    }

    #[wasm_bindgen(js_name = "nickname")]
    pub fn nickname_js(&self, ohpkm: &OhpkmV2) -> String {
        self.nickname(ohpkm)
    }

    #[wasm_bindgen(js_name = "metData")]
    pub fn met_data_js(&self, ohpkm: &OhpkmV2) -> MetData {
        self.met_data(ohpkm)
    }

    #[wasm_bindgen(js_name = "metLocationIndexDiamondPearl")]
    pub fn met_location_index_diamond_pearl_js(&self, ohpkm: &OhpkmV2) -> u16 {
        self.met_location_index_diamond_pearl(ohpkm)
    }

    #[wasm_bindgen(js_name = "metLocationIndexPlatinumHgss")]
    pub fn met_location_index_platinum_hgss_js(&self, ohpkm: &OhpkmV2) -> u16 {
        self.met_location_index_platinum_hgss(ohpkm)
    }

    #[wasm_bindgen(js_name = "ivs")]
    pub fn ivs_js(&self, ohpkm: &OhpkmV2) -> Stats8 {
        self.ivs(ohpkm)
    }
}

const DP_FARAWAY_PLACE: u16 = 0xbba;

const fn valid_dp_location_index(location_index: u16) -> bool {
    location_index >= 0x70 && location_index < 2000
}
