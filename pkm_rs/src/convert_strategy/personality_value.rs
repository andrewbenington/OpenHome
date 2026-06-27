use crate::{ohpkm::OhpkmV2, traits::HasSpeciesAndForm, util::unown_form_from_pid_gen3};
use pkm_rs_resources::natures::NatureIndex;
use pkm_rs_types::NationalDex;

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default, Serialize, Deserialize)]
pub enum NatureStrategy {
    KeepOriginalNature,
    #[default]
    KeepMintNature,
}

impl NatureStrategy {
    fn relevant_nature(&self, mon: &OhpkmV2) -> NatureIndex {
        match self {
            NatureStrategy::KeepOriginalNature => mon.nature(),
            NatureStrategy::KeepMintNature => mon.mint_nature(),
        }
    }

    fn is_satisfied(&self, pid: u32, mon: &OhpkmV2) -> bool {
        NatureIndex::new_from_modulo(pid) == self.relevant_nature(mon)
    }
}

#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default, Serialize, Deserialize)]
pub enum ShinyStrategy {
    #[default]
    KeepShiny8192,
    KeepShiny4096,
}

impl ShinyStrategy {
    const fn xor_threshold(self) -> u16 {
        match self {
            ShinyStrategy::KeepShiny8192 => 8,
            ShinyStrategy::KeepShiny4096 => 16,
        }
    }

    fn is_satisfied(&self, pid: u32, mon: &OhpkmV2) -> bool {
        let xor_value = pkm_rs_types::shiny_xor_value(pid, mon.trainer_id(), mon.secret_id());
        let pid_is_shiny = xor_value < self.xor_threshold();

        pid_is_shiny == mon.is_shiny()
    }
}

#[derive(Debug, Clone, Copy)]
pub struct PidModificationStrategy {
    pub nature: Option<NatureStrategy>,
    pub keep_gender: bool,
    pub shiny: Option<ShinyStrategy>,
    pub keep_unown_letter: bool,
}

impl PidModificationStrategy {
    fn find_inconsistencies(&self, pid: u32, mon: &OhpkmV2) -> Vec<DerivedField> {
        let mut inconsistencies = Vec::<DerivedField>::new();
        if self.keep_gender && mon.get_forme_metadata().gender_from_pid(pid) != mon.gender() {
            inconsistencies.push(DerivedField::Gender);
        }

        if let Some(nature_strategy) = self.nature
            && !nature_strategy.is_satisfied(pid, mon)
        {
            inconsistencies.push(DerivedField::Nature);
        }

        if let Some(shiny_strategy) = self.shiny
            && !shiny_strategy.is_satisfied(pid, mon)
        {
            println!("shiny not satisfied");
            inconsistencies.push(DerivedField::Shiny);
        }

        if self.keep_unown_letter
            && mon.species_and_form().get_ndex() == NationalDex::Unown.into()
            && unown_form_from_pid_gen3(pid) as u16 != mon.species_and_form().get_forme_index()
        {
            inconsistencies.push(DerivedField::UnownLetter);
        }

        println!("find_inconsistencies: {inconsistencies:?}");

        inconsistencies
    }

    pub fn get_modified_pid(&self, mon: &OhpkmV2) -> u32 {
        let trainer_id = mon.trainer_id();
        let secret_id = mon.secret_id();

        let mut new_pid = mon.personality_value();

        for i in 0..u16::MAX {
            println!("pokemon: {}", mon.nickname());
            println!("\tis_shiny: {}", mon.is_shiny());
            let inconsistencies = self.find_inconsistencies(new_pid, mon);
            if inconsistencies.is_empty() {
                return new_pid;
            }
            println!("inconsistencies: {inconsistencies:?}");

            let (mut pid_upper, mut pid_lower) = pkm_rs_types::pid_upper_lower(new_pid);
            pid_lower ^= i;

            if mon.is_shiny() {
                pid_upper = trainer_id ^ secret_id ^ pid_lower
            }

            new_pid = ((pid_upper as u32) << 16) | (pid_lower as u32);
        }

        mon.personality_value()
    }
}

impl Default for PidModificationStrategy {
    fn default() -> Self {
        Self {
            nature: Some(NatureStrategy::default()),
            keep_gender: true,
            shiny: Some(ShinyStrategy::default()),
            keep_unown_letter: true,
        }
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = generatePk3CompatiblePid)]
pub fn generate_pk3_compatible_pid(mon: &OhpkmV2) -> u32 {
    PidModificationStrategy::default().get_modified_pid(mon)
}

#[derive(Debug, Clone, Copy)]
enum DerivedField {
    Nature,
    Gender,
    Shiny,
    UnownLetter,
}

#[cfg(test)]
mod test {
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
            shiny: Some(ShinyStrategy::KeepShiny8192),
            ..Default::default()
        };

        let new_pid = strategy.get_modified_pid(&mon);

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
            shiny: Some(ShinyStrategy::KeepShiny4096),
            nature: None, // Gen 5 doesn't use the PID for nature generation, so this won't match
            ..Default::default()
        };

        let new_pid = strategy.get_modified_pid(&mon);

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

        let new_pid = strategy.get_modified_pid(&mon);

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

        let new_pid = strategy.get_modified_pid(&mon);

        let mild = NatureIndex::new_js(16);
        assert_eq!(NatureIndex::new_from_modulo(new_pid), mild);

        Ok(())
    }

    #[test]
    fn all_fields_preserved() -> tests::TestResult<()> {
        let path = PathBuf::from("ohpkm").join("scolipede-shiny.ohpkm");
        let mon = tests::pkm_from_file::<OhpkmV2>(&path)?.0;

        let strategy = PidModificationStrategy {
            shiny: Some(ShinyStrategy::KeepShiny8192),
            nature: Some(NatureStrategy::KeepMintNature),
            keep_gender: true,
            ..Default::default()
        };

        let new_pid = strategy.get_modified_pid(&mon);

        assert!(pkm_rs_types::shiny_xor_value(new_pid, mon.trainer_id(), mon.secret_id()) < 8);
        assert_eq!(NatureIndex::new_from_modulo(new_pid), mon.nature());
        assert_eq!(
            mon.get_forme_metadata().gender_from_pid(new_pid),
            mon.gender()
        );

        Ok(())
    }

    #[test]
    fn nature_preserved() -> tests::TestResult<()> {
        let path = PathBuf::from("ohpkm").join("ditto-bold.ohpkm");
        let mon = tests::pkm_from_file::<OhpkmV2>(&path)?.0;

        let strategy = PidModificationStrategy {
            shiny: Some(ShinyStrategy::KeepShiny8192),
            nature: Some(NatureStrategy::KeepMintNature),
            keep_gender: true,
            ..Default::default()
        };

        let new_pid = strategy.get_modified_pid(&mon);

        assert!(pkm_rs_types::shiny_xor_value(new_pid, mon.trainer_id(), mon.secret_id()) >= 8);
        assert_eq!(NatureIndex::new_from_modulo(new_pid), mon.nature());
        assert_eq!(
            mon.get_forme_metadata().gender_from_pid(new_pid),
            mon.gender()
        );

        Ok(())
    }
}
