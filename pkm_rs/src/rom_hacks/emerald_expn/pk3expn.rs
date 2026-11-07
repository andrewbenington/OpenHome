use crate::ohpkm::extra_form::ExtraFormIndex;
use crate::strings::{Gen3NicknameString, Gen3TrainerString};
use crate::{result::Result, strings::Gen3Encoding};

use super::conversion::species::pokemon_index::EmeraldExpnPokemonIndex;
use super::pk3expn_buffer::Pk3ExpnBuffer;

use pkm_rs_derive::IsShiny8192;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::lookup;
use pkm_rs_resources::moves::MoveSlots;
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::ribbons::Gen3RibbonSet;
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_types::{
    AbilityNumber, BinaryGender, ContestStats, Gender, HyperTraining, Ivs, Language,
    MarkingsFourShapes, NationalDex, OriginGame, Pokerus, Stats8, Stats16Le, TeraType,
};

use serde::Serialize;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = Pk3ExpnWasm))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny8192)]
pub struct Pk3Expn {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub pokemon_index: EmeraldExpnPokemonIndex,
    pub checksum: u16,
    //#[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    //pub held_item_index: Option<EmeraldExpnItem>,
    pub trainer_id: u16,
    pub secret_id: u16,
    pub exp: u32,
    pub has_species_data: bool,
    pub is_bad_egg: bool,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ability_num: AbilityNumber,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub markings: MarkingsFourShapes,
    pub personality_value: u32,
    pub is_fateful_encounter: bool,
    pub gender: Gender,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub evs: Stats8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub contest: ContestStats,
    pub pokerus: Pokerus,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ribbons: Gen3RibbonSet,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub nickname: Gen3NicknameString<12>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub moves: MoveSlots,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub ivs: Ivs,
    pub is_egg: bool,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub trainer_name: Gen3TrainerString<7>,
    pub trainer_friendship: u8,
    pub met_location_index: u8,
    pub ball: Ball,
    pub met_level: u8,
    pub trainer_gender: BinaryGender,
    pub game_of_origin: OriginGame,
    pub language: Language,
    pub shiny_modifier: bool,
    pub is_shadow: bool,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub hyper_training: HyperTraining,
    pub dynamax_level: u8,
    pub can_gigantamax: bool,
    pub mint_nature: NatureIndex,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tera_type: TeraType,
    pub status_condition: u32,
    pub stat_level: u8,
    pub current_hp: u16,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub stats: Stats16Le,
}

impl Pk3Expn {
    // ------------------------------------------------------------------
    // Deserialise from a Pk3ExpnBuffer (byte slice wrapper with field accessors)
    // ------------------------------------------------------------------

    pub fn from_buffer<S: AsRef<[u8]>>(buf: &Pk3ExpnBuffer<S>) -> Result<Self> {
        let pokemon_index = EmeraldExpnPokemonIndex::new(buf.species_index())?;
        let language = buf.language()?;
        let str_encoding = Gen3Encoding::from_language(language);

        let mon = Pk3Expn {
            pokemon_index,
            checksum: buf.checksum(),
            //held_item_index: EmeraldExpnItem::new(buf.held_item_index()),
            trainer_id: buf.trainer_id(),
            secret_id: buf.secret_id(),
            exp: buf.exp(),
            has_species_data: buf.has_species(),
            is_bad_egg: buf.is_bad_egg(),
            ability_num: buf.ability_num()?,
            markings: buf.markings(),
            personality_value: buf.personality_value(),
            is_fateful_encounter: buf.is_fateful_encounter(),
            //gender,
            evs: buf.evs(),
            contest: buf.contest(),
            pokerus: buf.pokerus(),
            ribbons: buf.ribbons(),
            moves: buf.move_slots(),
            ivs: buf.ivs(),
            is_egg: buf.is_egg(),
            trainer_name: buf.trainer_name(str_encoding),
            trainer_friendship: buf.friendship(),
            met_location_index: buf.met_location_index(),
            ball: buf.ball(),
            met_level: buf.met_level(),
            trainer_gender: buf.trainer_gender(),
            game_of_origin: buf.game_of_origin(),
            language,
            shiny_modifier: buf.shiny_modifier(),
            is_shadow: buf.is_shadow(),
            //hyper_training: buf.hyper_training(),
            dynamax_level: buf.dynamax_level(),
            can_gigantamax: buf.can_gigantamax(),
            mint_nature: buf.mint_nature()?,
            //tera_type,
            ..Default::default()
        };

        Ok(mon)
    }

    pub fn get_national_dex(&self) -> NationalDex {
        self.pokemon_index.to_national_dex()
    }

    pub fn species_and_form(&self) -> SpeciesForm {
        SpeciesForm::new_valid_ndex(self.get_national_dex(), self.pokemon_index.to_form_index())
            .expect("Emerald Expn. form is valid")
    }

    pub fn extra_form_index(&self) -> Option<ExtraFormIndex> {
        self.pokemon_index.to_extra_form_index()
    }

    pub fn is_nicknamed(&self) -> bool {
        self.nickname.to_string()
            != lookup::species_name(self.get_national_dex(), self.language).to_uppercase()
    }

    pub fn nature(&self) -> NatureIndex {
        NatureIndex::new_from_modulo(self.personality_value)
    }
}
