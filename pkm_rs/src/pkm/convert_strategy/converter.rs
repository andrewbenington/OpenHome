use crate::pkm::{
    PkmFormat,
    convert_strategy::{ConvertStrategy, location::Location},
    ohpkm::OhpkmV2,
};

pub struct Converter {
    dest_pkm_format: PkmFormat,
    strategy: ConvertStrategy,
}

impl Converter {
    pub const fn new(dest_pkm_format: PkmFormat, strategy: ConvertStrategy) -> Self {
        Self {
            dest_pkm_format,
            strategy,
        }
    }

    pub fn nickname(&self, ohpkm: OhpkmV2) -> String {
        if !ohpkm.nickname_matches_species_eng() {
            return ohpkm.nickname().to_owned();
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

    pub fn met_location_index(&self, ohpkm: OhpkmV2) -> u16 {
        let ohpkm_origin = ohpkm.game_of_origin();
        let ohpkm_met_location = ohpkm.met_location_index();

        if !self.strategy.met_location_use_region {
            // don't use region, just plop whatever met index is present into the new format
            return ohpkm_met_location;
        }

        if self.dest_pkm_format.matches_origin(ohpkm_origin) {
            // this format matches the origin game, so the met location index should be valid in the new format
            return ohpkm_met_location;
        }

        let best_match = Location::game_setting_best_match(ohpkm_origin);
        if let Some(game_setting) = self.dest_pkm_format.index_for(best_match) {
            return game_setting;
        }

        let most_compatible = Location::game_setting_most_compatible(ohpkm_origin);
        if let Some(game_setting) = self.dest_pkm_format.index_for(most_compatible) {
            return game_setting;
        }

        self.dest_pkm_format.link_trade_location_index()
    }
}
