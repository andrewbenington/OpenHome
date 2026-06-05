use pkm_rs_resources::metadata_source::MetadataSource;
use pkm_rs_resources::ribbons::Gen3Ribbon;
use pkm_rs_resources::{items::ItemGen3, lookup};
use pkm_rs_types::{AbilityNumber, Generation, Stats16Le};

use super::OhpkmConvert;
use crate::convert_strategy::{ConvertStrategy, PidModificationStrategy, PkmConverter};
use crate::gen3::{Gen3PokemonIndex, PK3_MAX_ABILITY, Pk3};
use crate::ohpkm::OhpkmV2;
use crate::ohpkm::v2_sections::pkm_bytes::StoredPkmBytes;
use crate::result::{Error, Result};
use crate::strings::{Gen3Encoding, Gen3NicknameString, Gen3TrainerString};
use crate::{format::PkmFormat, traits::HasSpeciesAndForm};
use crate::{gen3, ohpkm, util::personality_value};

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

        let adjusted_pid = personality_value::poke_transporter_shiny_adjust(
            self.personality_value,
            self.trainer_id,
            self.secret_id,
        );

        let species_name =
            lookup::species_name(self.pokemon_index.to_national_dex(), self.language);

        let is_nicknamed = !species_name.eq_ignore_ascii_case(&self.nickname.to_string());

        // If the pokémon is not nicknamed, use species name to avoid ALL CAPS NAME
        let adjusted_nickname: String = if is_nicknamed {
            self.nickname.convert_to_string()
        } else {
            species_name.to_owned()
        };

        ohpkm::v2_sections::MainDataV2 {
            personality_value: adjusted_pid,
            pid_bit_flipped_for_shiny: self.personality_value != adjusted_pid,
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
            moves: self
                .moves
                .to_pp_adjusted(MetadataSource::Emerald, ohpkm::MOVE_METADATA_SOURCE),
            nickname: adjusted_nickname.into(),
            ivs: self.ivs,
            is_egg: self.is_egg,
            is_nicknamed,
            game_of_origin: self.game_of_origin,
            language: self.language,
            trainer_name: self.trainer_name.to_string().into(),
            trainer_friendship: self.trainer_friendship,
            ball: self.ball,
            met_location_index: self.met_location_index as u16,
            met_level: self.met_level,
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
        let str_encoding = Gen3Encoding::from_language(ohpkm.language());

        let mut nickname_gen3 =
            Gen3NicknameString::from_stringlike(converter.nickname(ohpkm), str_encoding);

        // if the nickname has been otherwise unchanged, use a copy of the original data's nickname
        // to preserve trash bytes
        if let Some(StoredPkmBytes::Pk3(original_bytes)) = ohpkm.original_data_bytes()
            && let Ok(original_pk3) = Pk3::try_from_bytes(&original_bytes)
            && original_pk3
                .nickname
                .identical_until_terminator(&nickname_gen3)
        {
            nickname_gen3 = original_pk3.nickname;
        }

        let personality_value = if ohpkm.game_of_origin().generation() != Generation::G3 {
            PidModificationStrategy::default().get_modified_pid(ohpkm)
        } else if ohpkm.pid_bit_flipped_for_shiny() {
            personality_value::flip_most_significant_bit(ohpkm.personality_value())
        } else {
            ohpkm.personality_value()
        };

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
            has_species_data: true,
            is_bad_egg: false,
            ability_num: ohpkm.ability_num().into(),
            markings: ohpkm.markings().into(),
            personality_value,
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
            nickname: nickname_gen3,
            moves: ohpkm
                .moves()
                .to_pp_adjusted(ohpkm::MOVE_METADATA_SOURCE, MetadataSource::Emerald),
            ivs: converter.ivs(ohpkm),
            is_egg: ohpkm.is_egg(),
            trainer_name: Gen3TrainerString::from_stringlike(&ohpkm.trainer_name(), str_encoding),
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

    fn bytes_to_stored(bytes: &[u8]) -> Result<StoredPkmBytes> {
        if bytes.len() == gen3::BOX_SIZE {
            let mut extended = bytes.to_vec();
            extended.resize(gen3::PARTY_SIZE, 0);
            return extended
                .try_into()
                .map_err(|_| {
                    Error::buffer_size_with_source(
                        "Pk3::OhpkmConvert::bytes_to_stored",
                        gen3::PARTY_SIZE,
                        bytes.len(),
                    )
                })
                .map(StoredPkmBytes::Pk3);
        }
        bytes
            .try_into()
            .map_err(|_| {
                Error::buffer_size_with_source(
                    "Pk3::OhpkmConvert::bytes_to_stored",
                    gen3::PARTY_SIZE,
                    bytes.len(),
                )
            })
            .map(StoredPkmBytes::Pk3)
    }
}

#[cfg(test)]
mod test {
    use crate::{gen3::Pk3, tests, traits::IsShiny};
    use std::path::PathBuf;

    #[test]
    fn xor_gt_8_lt_16_doesnt_make_shiny() -> tests::TestResult<()> {
        let path = PathBuf::from("pk3").join("z006 - Salamence.pkm");
        let pk3 = tests::pkm_from_file::<Pk3>(&path)?.0;

        let ohpkm = pk3.to_ohpkm()?;

        assert_eq!(pk3.is_shiny(), ohpkm.is_shiny());

        Ok(())
    }
}
