use crate::ohpkm::OhpkmV2;
use crate::traits::HasSpeciesAndForm;
use crate::util::unown_form_from_pid_gen3;
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_resources::natures::WithNature;
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_types::Gender;
use pkm_rs_types::NationalDex;

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default, Serialize, Deserialize, specta::Type)]
pub enum NatureStrategy {
    KeepOriginalNature,
    #[default]
    KeepMintNature,
}

impl NatureStrategy {
    fn relevant_nature(&self, fields: &impl WithNature) -> NatureIndex {
        match self {
            NatureStrategy::KeepOriginalNature => fields.nature(),
            NatureStrategy::KeepMintNature => fields.mint_nature().unwrap_or(fields.nature()),
        }
    }

    fn is_satisfied(&self, pid: u32, fields: &impl WithNature) -> bool {
        NatureIndex::new_from_modulo(pid) == self.relevant_nature(fields)
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default, Serialize, Deserialize)]
pub enum ShinyOdds {
    #[default]
    Odds8192,
    Odds4096,
}

impl ShinyOdds {
    const fn xor_threshold(self) -> u16 {
        match self {
            ShinyOdds::Odds8192 => 8,
            ShinyOdds::Odds4096 => 16,
        }
    }

    const fn is_satisfied(&self, pid: u32, fields: &PidGenerationParameters) -> bool {
        let xor_value = pkm_rs_types::shiny_xor_value(pid, fields.trainer_id, fields.secret_id);
        let pid_is_shiny = xor_value < self.xor_threshold();

        pid_is_shiny == fields.is_shiny
    }
}

#[derive(Debug, Clone, Copy)]
#[cfg_attr(feature = "wasm", derive(Tsify, Serialize, Deserialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct PidModificationStrategy {
    pub nature: Option<NatureStrategy>,
    pub keep_gender: bool,
    pub shiny: Option<ShinyOdds>,
    pub keep_unown_letter: bool,
}

use rand::Rng;
use rand::SeedableRng;
use rand::rngs::StdRng;

impl PidModificationStrategy {
    fn find_mon_inconsistencies(&self, pid: u32, mon: &OhpkmV2) -> Vec<DerivedField> {
        let mut inconsistencies = Vec::<DerivedField>::new();
        if self.keep_gender && mon.get_form_metadata().gender_from_pid(pid) != mon.gender() {
            inconsistencies.push(DerivedField::Gender);
        }

        if let Some(nature_strategy) = self.nature
            && !nature_strategy.is_satisfied(pid, mon)
        {
            inconsistencies.push(DerivedField::Nature);
        }

        if let Some(shiny_strategy) = self.shiny
            && !shiny_strategy.is_satisfied(pid, &mon.into())
        {
            inconsistencies.push(DerivedField::Shiny);
        }

        if self.keep_unown_letter
            && mon.species_and_form().get_ndex() == NationalDex::Unown
            && unown_form_from_pid_gen3(pid) as u16 != mon.species_and_form().get_form_index()
        {
            inconsistencies.push(DerivedField::UnownLetter);
        }

        inconsistencies
    }

    pub fn modify_pid_to_match_fields(&self, mon: &OhpkmV2) -> u32 {
        let trainer_id = mon.trainer_id();
        let secret_id = mon.secret_id();

        let mut new_pid = mon.personality_value();

        for i in 0..u16::MAX {
            let inconsistencies = self.find_mon_inconsistencies(new_pid, mon);
            if inconsistencies.is_empty() {
                return new_pid;
            }

            let (mut pid_upper, mut pid_lower) = pkm_rs_types::pid_upper_lower(new_pid);
            pid_lower ^= i;

            if mon.is_shiny() {
                pid_upper = trainer_id ^ secret_id ^ pid_lower
            }

            new_pid = ((pid_upper as u32) << 16) | (pid_lower as u32);
        }

        mon.personality_value()
    }

    fn find_field_inconsistencies(
        &self,
        pid: u32,
        fields: &PidGenerationParameters,
    ) -> Vec<DerivedField> {
        let mut inconsistencies = Vec::<DerivedField>::new();
        if self.keep_gender
            && fields.gender.is_some_and(|gender| {
                gender != fields.species_form.get_form_metadata().gender_from_pid(pid)
            })
        {
            inconsistencies.push(DerivedField::Gender);
        }

        if let Some(nature_strategy) = self.nature
            && let Some(nature) = fields.nature
            && !nature_strategy.is_satisfied(pid, &nature)
        {
            inconsistencies.push(DerivedField::Nature);
        }

        if let Some(shiny_strategy) = self.shiny
            && !shiny_strategy.is_satisfied(pid, fields)
        {
            inconsistencies.push(DerivedField::Shiny);
        }
        let (national_dex, form_index) = fields.species_form.split();

        if self.keep_unown_letter
            && national_dex == NationalDex::Unown
            && unown_form_from_pid_gen3(pid) as u16 != form_index
        {
            inconsistencies.push(DerivedField::UnownLetter);
        }

        inconsistencies
    }

    pub fn generate_pid_matching_fields(&self, fields: impl Into<PidGenerationParameters>) -> u32 {
        let parameters: PidGenerationParameters = fields.into();
        let PidGenerationParameters {
            trainer_id,
            secret_id,
            is_shiny,
            ..
        } = &parameters;

        let tid_sid_seed: u32 = (*trainer_id as u32) << 16 | *secret_id as u32;
        let tid_sid_seed: u64 = (tid_sid_seed as u64) << 32 | (tid_sid_seed as u64);
        let rng = &mut StdRng::seed_from_u64(tid_sid_seed);

        let mut personality_value = rng.next_u32();

        for i in 0..u16::MAX {
            let inconsistencies = self.find_field_inconsistencies(personality_value, &parameters);
            if inconsistencies.is_empty() {
                return personality_value;
            }

            let (mut pid_upper, mut pid_lower) = pkm_rs_types::pid_upper_lower(personality_value);
            pid_lower ^= i;

            if *is_shiny {
                pid_upper = trainer_id ^ secret_id ^ pid_lower
            }

            personality_value = ((pid_upper as u32) << 16) | (pid_lower as u32);
        }

        personality_value
    }
}

impl Default for PidModificationStrategy {
    fn default() -> Self {
        Self {
            nature: Some(NatureStrategy::default()),
            keep_gender: true,
            shiny: Some(ShinyOdds::default()),
            keep_unown_letter: true,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct PidGenerationParameters {
    pub species_form: SpeciesForm,
    pub nature: Option<NatureIndex>,
    pub gender: Option<Gender>,
    pub is_shiny: bool,
    pub unown_letter: Option<u8>,
    pub trainer_id: u16,
    pub secret_id: u16,
}

pub fn generate_pk3_compatible_pid(
    parameters: &PidGenerationParameters,
    strategy: &PidModificationStrategy,
) -> u32 {
    strategy.generate_pid_matching_fields(*parameters)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[derive(Debug, Clone, Copy)]
pub struct PidGenerationParametersJs {
    pub national_dex: u16,
    pub form_index: u16,
    pub nature: Option<NatureIndex>,
    pub gender: Option<Gender>,
    pub is_shiny: bool,
    pub unown_letter: Option<u8>,
    pub trainer_id: u16,
    pub secret_id: u16,
}
#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn, clippy::too_many_arguments)]
impl PidGenerationParametersJs {
    pub fn new(
        national_dex: u16,
        form_index: u16,
        nature: Option<NatureIndex>,
        gender: Option<Gender>,
        is_shiny: bool,
        unown_letter: Option<u8>,
        trainer_id: u16,
        secret_id: u16,
    ) -> Self {
        Self {
            national_dex,
            form_index,
            nature,
            gender,
            is_shiny,
            unown_letter,
            trainer_id,
            secret_id,
        }
    }
}

#[cfg(feature = "wasm")]
impl TryFrom<PidGenerationParametersJs> for PidGenerationParameters {
    type Error = crate::result::Error;

    fn try_from(value: PidGenerationParametersJs) -> Result<Self, Self::Error> {
        Ok(Self {
            species_form: SpeciesForm::new(value.national_dex, value.form_index)?,
            nature: value.nature,
            gender: value.gender,
            is_shiny: value.is_shiny,
            unown_letter: value.unown_letter,
            trainer_id: value.trainer_id,
            secret_id: value.secret_id,
        })
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = generatePk3CompatiblePid)]
pub fn generate_pk3_compatible_pid_wasm(
    parameters: PidGenerationParametersJs,
    strategy: PidModificationStrategy,
) -> Result<u32, crate::result::Error> {
    Ok(strategy.generate_pid_matching_fields(PidGenerationParameters::try_from(parameters)?))
}

#[derive(Debug, Clone, Copy)]
enum DerivedField {
    Nature,
    Gender,
    Shiny,
    UnownLetter,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    use crate::{
        convert_strategy::personality_value::PidModificationStrategy, ohpkm::OhpkmV2, tests,
    };

    #[test]
    fn shiny_preserved_8192_pid_updated() -> tests::TestResult<()> {
        // if a shiny Pokémon would not have been shiny pre-gen 6 and the pid shiny strategy
        // is ShinyStrategy::KeepShiny8192, the pid should be updated so the shininess is preserved

        let path = PathBuf::from("ohpkm").join("scolipede-shiny.ohpkm");
        let mon = tests::pkm_from_file::<OhpkmV2>(&path)?.0;

        let strategy = PidModificationStrategy {
            shiny: Some(ShinyOdds::Odds8192),
            ..Default::default()
        };

        let new_pid = strategy.modify_pid_to_match_fields(&mon);

        assert!(pkm_rs_types::shiny_xor_value(new_pid, mon.trainer_id(), mon.secret_id()) < 8);

        Ok(())
    }

    #[test]
    fn shiny_preserved_4096_pid_unaltered() -> tests::TestResult<()> {
        // if a shiny Pokémon would not have been shiny pre-gen 6 and the pid shiny strategy
        // is ShinyStrategy::KeepShiny4096, the pid should not be updated because it is already shiny

        let path = PathBuf::from("ohpkm").join("scolipede-shiny.ohpkm");
        let mon = tests::pkm_from_file::<OhpkmV2>(&path)?.0;

        let strategy = PidModificationStrategy {
            shiny: Some(ShinyOdds::Odds4096),
            nature: None, // Gen 5 doesn't use the PID for nature generation, so this won't match
            ..Default::default()
        };

        let new_pid = strategy.modify_pid_to_match_fields(&mon);

        assert_eq!(mon.personality_value(), new_pid);

        Ok(())
    }

    #[test]
    fn mint_nature_preserved() -> tests::TestResult<()> {
        // update pid to ensure the mint nature is preserved in earlier generations

        let path = PathBuf::from("ohpkm").join("shiftry-mint.ohpkm");
        let mon = tests::pkm_from_file::<OhpkmV2>(&path)?.0;

        let strategy = PidModificationStrategy {
            nature: Some(NatureStrategy::KeepMintNature),
            ..Default::default()
        };

        let new_pid = strategy.modify_pid_to_match_fields(&mon);

        let modest = NatureIndex::new_js(15);
        assert_eq!(NatureIndex::new_from_modulo(new_pid), modest);

        Ok(())
    }

    #[test]
    fn original_nature_preserved() -> tests::TestResult<()> {
        // update pid to ensure the original nature is preserved in earlier generations

        let path = PathBuf::from("ohpkm").join("shiftry-mint.ohpkm");
        let mon = tests::pkm_from_file::<OhpkmV2>(&path)?.0;

        let strategy = PidModificationStrategy {
            nature: Some(NatureStrategy::KeepOriginalNature),
            ..Default::default()
        };

        let new_pid = strategy.modify_pid_to_match_fields(&mon);

        let mild = NatureIndex::new_js(16);
        assert_eq!(NatureIndex::new_from_modulo(new_pid), mild);

        Ok(())
    }

    #[test]
    fn all_fields_preserved() -> tests::TestResult<()> {
        let path = PathBuf::from("ohpkm").join("scolipede-shiny.ohpkm");
        let mon = tests::pkm_from_file::<OhpkmV2>(&path)?.0;

        let strategy = PidModificationStrategy {
            shiny: Some(ShinyOdds::Odds8192),
            nature: Some(NatureStrategy::KeepMintNature),
            keep_gender: true,
            ..Default::default()
        };

        let new_pid = strategy.modify_pid_to_match_fields(&mon);

        assert!(pkm_rs_types::shiny_xor_value(new_pid, mon.trainer_id(), mon.secret_id()) < 8);
        assert_eq!(NatureIndex::new_from_modulo(new_pid), mon.nature());
        assert_eq!(
            mon.get_form_metadata().gender_from_pid(new_pid),
            mon.gender()
        );

        Ok(())
    }

    #[test]
    fn nature_preserved() -> tests::TestResult<()> {
        let path = PathBuf::from("ohpkm").join("ditto-bold.ohpkm");
        let mon = tests::pkm_from_file::<OhpkmV2>(&path)?.0;

        let strategy = PidModificationStrategy {
            shiny: Some(ShinyOdds::Odds8192),
            nature: Some(NatureStrategy::KeepMintNature),
            keep_gender: true,
            ..Default::default()
        };

        let new_pid = strategy.modify_pid_to_match_fields(&mon);

        assert!(pkm_rs_types::shiny_xor_value(new_pid, mon.trainer_id(), mon.secret_id()) >= 8);
        assert_eq!(NatureIndex::new_from_modulo(new_pid), mon.nature());
        assert_eq!(
            mon.get_form_metadata().gender_from_pid(new_pid),
            mon.gender()
        );

        Ok(())
    }
}
