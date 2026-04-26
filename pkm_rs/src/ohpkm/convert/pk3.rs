use pkm_rs_resources::ribbons::Gen3Ribbon;
use pkm_rs_resources::{items::ItemGen3, lookup};
use pkm_rs_types::{AbilityNumber, Stats16Le};

use crate::{
    conversion::gen3_pokemon_index::Gen3PokemonIndex,
    convert_strategy::{ConvertStrategy, PkmConverter},
    format::PkmFormat,
    gen3::{PK3_MAX_ABILITY, Pk3},
    ohpkm::OhpkmV2,
    traits::HasSpeciesAndForm,
};

use super::OhpkmConvert;
use crate::ohpkm;

impl OhpkmConvert for Pk3 {
    fn to_main_data(&self) -> ohpkm::v2_sections::MainDataV2 {
        let form_metadata = self.get_forme_metadata();
        let ability_index_unchecked = form_metadata.get_ability(self.ability_num.into());
        let ability_index = if ability_index_unchecked.to_u16() > PK3_MAX_ABILITY {
            form_metadata.get_ability(AbilityNumber::First)
        } else {
            ability_index_unchecked
        };
        let ability_num = if ability_index != ability_index_unchecked {
            AbilityNumber::First
        } else {
            self.ability_num.into()
        };

        ohpkm::v2_sections::MainDataV2 {
            personality_value: self.personality_value,
            encryption_constant: self.personality_value, // Mirror Poké Transporter's behavior of using the personality value as the encryption constant
            species_and_form: self.species_and_form(),
            held_item_index: self
                .held_item_index
                .and_then(|item_g3| item_g3.to_modern())
                .map(|item| item.get())
                .unwrap_or(0),
            trainer_id: self.trainer_id,
            secret_id: self.secret_id,
            exp: self.exp,
            ability_index,
            ability_num,
            markings: self.markings.into(),
            nature: self.nature(),
            is_fateful_encounter: self.is_fateful_encounter,
            gender: self.gender,
            evs: self.evs,
            contest: self.contest,
            pokerus_byte: self.pokerus_byte,
            ribbons: self
                .ribbons
                .get_ribbons()
                .into_iter()
                .map(Gen3Ribbon::to_openhome)
                .collect(),
            moves: self.moves,
            nickname: self.nickname.to_string().into(),
            ivs: self.ivs,
            is_egg: self.is_egg,
            is_nicknamed: !lookup::species_name(
                self.pokemon_index.to_national_dex(),
                self.language,
            )
            .eq_ignore_ascii_case(&self.nickname.to_string()),
            // handler_name: self.handler_name,
            // is_current_handler: self.is_current_handler,
            // handler_friendship: self.handler_friendship,
            // handler_memory: self.handler_memory,
            // handler_affection: self.handler_affection,
            // handler_gender: self.handler_gender,
            // fullness: self.fullness,
            // enjoyment: self.enjoyment,
            game_of_origin: self.game_of_origin,
            // console_region: self.console_region,
            language: self.language,
            // form_argument: self.form_argument,
            trainer_name: self.trainer_name.to_string().into(),
            trainer_friendship: self.trainer_friendship,
            // trainer_memory: self.trainer_memory,
            // trainer_affection: self.trainer_affection,
            // egg_date: self.egg_date,
            // met_date: self.met_date,
            ball: self.ball,
            // egg_location_index: if self.egg_location_index == 0 {
            //     None
            // } else {
            //     Some(self.egg_location_index)
            // },
            met_location_index: self.met_location_index as u16,
            met_level: self.met_level,
            // hyper_training: self.hyper_training,
            trainer_gender: self.trainer_gender,
            ..Default::default()
        }
    }

    fn to_gen_67_data(&self) -> Option<ohpkm::v2_sections::Gen67Data> {
        None
    }

    fn from_ohpkm(ohpkm: &OhpkmV2, strategy: ConvertStrategy) -> Self {
        let converter = PkmConverter::new(PkmFormat::PK3, strategy);
        let met_data = converter.met_data(ohpkm);

        let mut mon = Self {
            sanity: 0,
            checksum: 0,
            pokemon_index: Gen3PokemonIndex::from_national_dex(
                ohpkm.species_and_form().get_ndex().index(),
            )
            .expect("invalid national dex for pk3"),
            held_item_index: ItemGen3::from_modern_index(ohpkm.held_item_index()),
            trainer_id: ohpkm.trainer_id(),
            secret_id: ohpkm.secret_id(),
            exp: ohpkm.exp(),
            ability_num: ohpkm.ability_num().into(),
            markings: ohpkm.markings().into(),
            personality_value: ohpkm.personality_value(),
            is_fateful_encounter: ohpkm.is_fateful_encounter(),
            gender: ohpkm.gender(),
            evs: ohpkm.evs(),
            contest: ohpkm.contest(),
            pokerus_byte: ohpkm.pokerus_byte(),
            ribbons: ohpkm
                .ribbons()
                .into_iter()
                .filter_map(Gen3Ribbon::from_openhome_if_present)
                .collect(),
            nickname: ohpkm.nickname().to_string().into(),
            moves: ohpkm.moves(),
            ivs: converter.ivs(ohpkm),
            is_egg: ohpkm.is_egg(),
            trainer_name: ohpkm.trainer_name().to_string().into(),
            trainer_friendship: ohpkm.trainer_friendship(),
            met_location_index: met_data.location_index as u8,
            ball: ohpkm.ball(),
            met_level: ohpkm.met_level(),
            trainer_gender: ohpkm.trainer_gender(),
            game_of_origin: met_data.origin,
            language: ohpkm.language(),
            status_condition: 0,
            stat_level: 0,
            current_hp: 0,
            stats: Stats16Le::default(),
        };

        mon.stat_level = mon.calculate_level();
        mon.stats = mon.calculate_stats();
        mon.current_hp = mon.stats.hp;

        mon.refresh_checksum();

        mon
    }
}
