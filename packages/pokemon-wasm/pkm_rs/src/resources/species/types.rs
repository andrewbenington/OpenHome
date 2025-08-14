use std::num::NonZeroU16;

use serde::{Serialize, Serializer};
use wasm_bindgen::prelude::*;

use crate::pkm::{PkmError, PkmResult};
use crate::resources::{ALL_SPECIES, AbilityIndex, MAX_NATIONAL_DEX};
use crate::resources::{games::Generation, pkm_types::PkmType};
use crate::substructures::Stats16Le;

extern crate static_assertions;

#[wasm_bindgen]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct NatDexIndex(NonZeroU16);

impl NatDexIndex {
    pub fn new(index: u16) -> PkmResult<NatDexIndex> {
        if (index as usize) > MAX_NATIONAL_DEX {
            return Err(PkmError::NationalDex {
                national_dex: index,
            });
        }
        NonZeroU16::new(index)
            .map(NatDexIndex)
            .ok_or(PkmError::NationalDex {
                national_dex: index,
            })
    }

    /// # Safety
    ///
    /// - `national_dex` must be greater than zero and at most the maximum National Dex number supported by this version of the library.
    /// - `forme_index` must be less than the total number of formes for the Pokémon with the given `national_dex` number
    pub const unsafe fn new_unchecked(index: u16) -> NatDexIndex {
        unsafe { NatDexIndex(NonZeroU16::new_unchecked(index)) }
    }

    pub const fn get(&self) -> u16 {
        self.0.get()
    }

    pub const fn get_species_metadata(&self) -> &'static SpeciesMetadata {
        &ALL_SPECIES[(self.get() - 1) as usize]
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.get().to_le_bytes()
    }
}

impl Serialize for NatDexIndex {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let message = format!("{} ({})", self.get(), self.get_species_metadata().name);
        serializer.serialize_str(&message)
    }
}

impl Default for NatDexIndex {
    fn default() -> Self {
        Self(unsafe { NonZeroU16::new_unchecked(1) })
    }
}

#[wasm_bindgen]
#[derive(Debug, Default, PartialEq, Eq, Clone, Copy)]
pub struct FormeReference {
    national_dex: NatDexIndex,
    forme_index: u16,
}

impl FormeReference {
    pub fn new(national_dex: u16, forme_index: u16) -> PkmResult<FormeReference> {
        let valid_ndex = NatDexIndex::new(national_dex)?;

        if valid_ndex.get_species_metadata().formes.len() <= forme_index as usize {
            return Err(PkmError::FormeIndex {
                national_dex: valid_ndex,
                forme_index,
            });
        }

        Ok(FormeReference {
            national_dex: valid_ndex,
            forme_index,
        })
    }

    pub fn new_ndex_verified(
        national_dex: NatDexIndex,
        forme_index: u16,
    ) -> PkmResult<FormeReference> {
        if national_dex.get_species_metadata().formes.len() <= forme_index as usize {
            return Err(PkmError::FormeIndex {
                national_dex,
                forme_index,
            });
        }

        Ok(FormeReference {
            national_dex,
            forme_index,
        })
    }

    /// # Safety
    ///
    /// - `national_dex` must be greater than zero and at most the maximum National Dex number supported by this version of the library.
    /// - `forme_index` must be less than the total number of formes for the Pokémon with the given `national_dex` number
    pub const unsafe fn new_unchecked(national_dex: u16, forme_index: u16) -> FormeReference {
        FormeReference {
            national_dex: unsafe { NatDexIndex::new_unchecked(national_dex) },
            forme_index,
        }
    }

    pub fn get_base_evolution(&self) -> FormeReference {
        match self.get_forme_metadata().pre_evolution {
            None => *self,
            Some(forme_ref) => forme_ref.get_base_evolution(),
        }
    }
}

impl FormeReference {
    pub const fn get_species_metadata(&self) -> &SpeciesMetadata {
        self.national_dex.get_species_metadata()
    }

    pub const fn get_forme_metadata(&self) -> &'static FormeMetadata {
        &self.get_species_metadata().formes[self.forme_index as usize]
    }
}

#[wasm_bindgen]
#[derive(Debug, Default, PartialEq, Eq, Clone, Copy)]
pub enum GenderRatio {
    #[default]
    Genderless,
    AllMale,
    AllFemale,
    Equal,
    M1ToF7,
    M1ToF3,
    M3ToF1,
    M7ToF1,
}

#[wasm_bindgen]
#[derive(Debug, Default, PartialEq, Eq, Clone, Copy)]
pub enum LevelUpType {
    #[default]
    MediumFast,
    Erratic,
    Fluctuating,
    MediumSlow,
    Fast,
    Slow,
}

#[wasm_bindgen]
#[derive(Debug, Default, PartialEq, Eq, Clone, Copy)]
pub enum EggGroup {
    Monster,
    Fairy,
    HumanLike,
    Field,
    Flying,
    Dragon,
    Bug,
    Water1,
    Water2,
    Water3,
    Grass,
    Amorphous,
    Mineral,
    Ditto,
    #[default]
    NoEggsDiscovered,
}

pub struct FormeMetadata {
    pub species_name: &'static str,
    pub national_dex: NatDexIndex,
    pub forme_name: &'static str,
    pub forme_index: u16,
    pub is_base_forme: bool,
    pub is_mega: bool,
    pub is_gmax: bool,
    pub is_battle_only: bool,
    pub is_cosmetic: bool,
    pub types: (PkmType, Option<PkmType>),
    pub gender_ratio: GenderRatio,
    pub base_stats: Stats16Le,
    pub abilities: (AbilityIndex, AbilityIndex),
    pub hidden_ability: Option<AbilityIndex>,
    pub base_height: f32,
    pub base_weight: f32,
    pub evolutions: &'static [FormeReference],
    pub pre_evolution: Option<FormeReference>,
    pub egg_groups: (EggGroup, Option<EggGroup>),
    pub introduced: Generation,
    pub is_restricted_legend: bool,
    pub is_sub_legend: bool,
    pub is_mythical: bool,
    pub is_ultra_beast: bool,
    pub is_paradox: bool,
    pub sprite: &'static str,
    pub sprite_index: (u8, u8),
}

impl FormeMetadata {
    pub const fn forme_ref(&self) -> FormeReference {
        FormeReference {
            national_dex: self.national_dex,
            forme_index: self.forme_index,
        }
    }

    pub fn get_ability(&self, ability_num: u8) -> AbilityIndex {
        match ability_num {
            1 => self.abilities.0,
            _ => self.abilities.1,
        }
    }

    pub fn get_base_evolution(&self) -> FormeReference {
        match self.pre_evolution {
            None => self.forme_ref(),
            Some(forme_ref) => forme_ref.get_base_evolution(),
        }
    }
}

pub struct SpeciesMetadata {
    pub name: &'static str,
    pub national_dex: NatDexIndex,
    pub level_up_type: LevelUpType,
    pub formes: &'static [FormeMetadata],
}

impl SpeciesMetadata {
    pub const fn get_forme(&self, forme_index: usize) -> Option<&'static FormeMetadata> {
        if forme_index >= self.formes.len() {
            return None;
        }

        Some(&self.formes[forme_index])
    }
}
