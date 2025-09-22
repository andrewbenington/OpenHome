use std::fmt::Display;
use std::num::NonZeroU16;

use serde::{Serialize, Serializer};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::pkm::{Error, NdexConvertSource, Result};
use crate::resources::{ALL_SPECIES, AbilityIndex, MAX_NATIONAL_DEX};
use crate::resources::{games::Generation, pkm_types::PkmType};
use crate::substructures::Stats16Le;

extern crate static_assertions;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct NatDexIndex(NonZeroU16);

impl NatDexIndex {
    pub fn new(index: u16) -> Result<NatDexIndex> {
        if (index as usize) > MAX_NATIONAL_DEX {
            return Err(Error::NationalDex {
                value: index,
                source: NdexConvertSource::Other,
            });
        }
        NonZeroU16::new(index)
            .map(NatDexIndex)
            .ok_or(Error::NationalDex {
                value: index,
                source: NdexConvertSource::Other,
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

    pub fn from_le_bytes(bytes: [u8; 2]) -> Result<NatDexIndex> {
        NatDexIndex::new(u16::from_le_bytes(bytes))
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.get().to_le_bytes()
    }

    pub const fn to_u16(self) -> u16 {
        self.0.get()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl NatDexIndex {
    #[cfg(feature = "wasm")]
    #[wasm_bindgen(getter)]
    pub fn index(&self) -> u16 {
        self.get()
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(constructor)]
    pub fn new_js(val: u16) -> core::result::Result<NatDexIndex, JsValue> {
        NatDexIndex::new(val).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

impl Serialize for NatDexIndex {
    fn serialize<S>(&self, serializer: S) -> core::result::Result<S::Ok, S::Error>
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

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, PartialEq, Eq, Clone, Copy, Serialize)]
pub struct SpeciesAndForme {
    national_dex: NatDexIndex,
    forme_index: u16,
}

impl SpeciesAndForme {
    pub fn new(national_dex: u16, forme_index: u16) -> Result<SpeciesAndForme> {
        let valid_ndex = NatDexIndex::new(national_dex)?;

        if valid_ndex.get_species_metadata().formes.len() <= forme_index as usize {
            return Err(Error::FormeIndex {
                national_dex: valid_ndex,
                forme_index,
            });
        }

        Ok(SpeciesAndForme {
            national_dex: valid_ndex,
            forme_index,
        })
    }

    pub const fn new_valid_ndex(
        national_dex: NatDexIndex,
        forme_index: u16,
    ) -> Result<SpeciesAndForme> {
        if national_dex.get_species_metadata().formes.len() <= forme_index as usize {
            return Err(Error::FormeIndex {
                national_dex,
                forme_index,
            });
        }

        Ok(SpeciesAndForme {
            national_dex,
            forme_index,
        })
    }

    /// # Safety
    ///
    /// - `national_dex` must be greater than zero and at most the maximum National Dex number supported by this version of the library.
    /// - `forme_index` must be less than the total number of formes for the Pokémon with the given `national_dex` number
    pub const unsafe fn new_unchecked(national_dex: u16, forme_index: u16) -> SpeciesAndForme {
        SpeciesAndForme {
            national_dex: unsafe { NatDexIndex::new_unchecked(national_dex) },
            forme_index,
        }
    }

    pub fn get_base_evolution(&self) -> SpeciesAndForme {
        match self.get_forme_metadata().pre_evolution {
            None => *self,
            Some(forme_ref) => forme_ref.get_base_evolution(),
        }
    }

    pub const fn get_ndex(&self) -> NatDexIndex {
        self.national_dex
    }

    pub const fn get_forme_index(&self) -> u16 {
        self.forme_index
    }

    pub const fn to_tuple(&self) -> (u16, u16) {
        (self.national_dex.to_u16(), self.forme_index)
    }
}

impl SpeciesAndForme {
    pub const fn get_species_metadata(&self) -> &'static SpeciesMetadata {
        self.national_dex.get_species_metadata()
    }

    pub const fn get_forme_metadata(&self) -> &'static FormeMetadata {
        &self.get_species_metadata().formes[self.forme_index as usize]
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl SpeciesAndForme {
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter = national_dex))]
    pub fn get_ndex_js(&self) -> u16 {
        self.national_dex.get()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter = forme_index))]
    pub fn get_forme_index_js(&self) -> u16 {
        self.forme_index
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
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

#[cfg_attr(feature = "wasm", wasm_bindgen)]
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

impl LevelUpType {
    pub fn calculate_level(&self, exp: u32) -> u8 {
        self.get_thresholds()
            .iter()
            .position(|threshold| *threshold >= exp)
            .unwrap_or(100) as u8
    }

    pub fn get_min_exp_for_level(&self, level: u8) -> u32 {
        if level > 100 {
            panic!("level too high: {level}")
        }
        self.get_thresholds()[level as usize]
    }

    const fn get_thresholds(&self) -> [u32; 100] {
        match self {
            LevelUpType::MediumFast => [
                0, 8, 27, 64, 125, 216, 343, 512, 729, 1000, 1331, 1728, 2197, 2744, 3375, 4096,
                4913, 5832, 6859, 8000, 9261, 10648, 12167, 13824, 15625, 17576, 19683, 21952,
                24389, 27000, 29791, 32768, 35937, 39304, 42875, 46656, 50653, 54872, 59319, 64000,
                68921, 74088, 79507, 85184, 91125, 97336, 103823, 110592, 117649, 125000, 132651,
                140608, 148877, 157464, 166375, 175616, 185193, 195112, 205379, 216000, 226981,
                238328, 250047, 262144, 274625, 287496, 300763, 314432, 328509, 343000, 357911,
                373248, 389017, 405224, 421875, 438976, 456533, 474552, 493039, 512000, 531441,
                551368, 571787, 592704, 614125, 636056, 658503, 681472, 704969, 729000, 753571,
                778688, 804357, 830584, 857375, 884736, 912673, 941192, 970299, 1000000,
            ],
            LevelUpType::Erratic => [
                0, 15, 52, 122, 237, 406, 637, 942, 1326, 1800, 2369, 3041, 3822, 4719, 5737, 6881,
                8155, 9564, 11111, 12800, 14632, 16610, 18737, 21012, 23437, 26012, 28737, 31610,
                34632, 37800, 41111, 44564, 48155, 51881, 55737, 59719, 63822, 68041, 72369, 76800,
                81326, 85942, 90637, 95406, 100237, 105122, 110052, 115015, 120001, 125000, 131324,
                137795, 144410, 151165, 158056, 165079, 172229, 179503, 186894, 194400, 202013,
                209728, 217540, 225443, 233431, 241496, 249633, 257834, 267406, 276458, 286328,
                296358, 305767, 316074, 326531, 336255, 346965, 357812, 367807, 378880, 390077,
                400293, 411686, 423190, 433572, 445239, 457001, 467489, 479378, 491346, 501878,
                513934, 526049, 536557, 548720, 560922, 571333, 583539, 591882, 600000,
            ],
            LevelUpType::Fluctuating => [
                0, 4, 13, 32, 65, 112, 178, 276, 393, 540, 745, 967, 1230, 1591, 1957, 2457, 3046,
                3732, 4526, 5440, 6482, 7666, 9003, 10506, 12187, 14060, 16140, 18439, 20974,
                23760, 26811, 30146, 33780, 37731, 42017, 46656, 50653, 55969, 60505, 66560, 71677,
                78533, 84277, 91998, 98415, 107069, 114205, 123863, 131766, 142500, 151222, 163105,
                172697, 185807, 196322, 210739, 222231, 238036, 250562, 267840, 281456, 300293,
                315059, 335544, 351520, 373744, 390991, 415050, 433631, 459620, 479600, 507617,
                529063, 559209, 582187, 614566, 639146, 673863, 700115, 737280, 765275, 804997,
                834809, 877201, 908905, 954084, 987754, 1035837, 1071552, 1122660, 1160499,
                1214753, 1254796, 1312322, 1354652, 1415577, 1460276, 1524731, 1571884, 1640000,
            ],
            LevelUpType::MediumSlow => [
                0, 9, 57, 96, 135, 179, 236, 314, 419, 560, 742, 973, 1261, 1612, 2035, 2535, 3120,
                3798, 4575, 5460, 6458, 7577, 8825, 10208, 11735, 13411, 15244, 17242, 19411,
                21760, 24294, 27021, 29949, 33084, 36435, 40007, 43808, 47846, 52127, 56660, 61450,
                66505, 71833, 77440, 83335, 89523, 96012, 102810, 109923, 117360, 125126, 133229,
                141677, 150476, 159635, 169159, 179056, 189334, 199999, 211060, 222522, 234393,
                246681, 259392, 272535, 286115, 300140, 314618, 329555, 344960, 360838, 377197,
                394045, 411388, 429235, 447591, 466464, 485862, 505791, 526260, 547274, 568841,
                590969, 613664, 636935, 660787, 685228, 710266, 735907, 762160, 789030, 816525,
                844653, 873420, 902835, 932903, 963632, 995030, 1027103, 1059860,
            ],
            LevelUpType::Fast => [
                0, 6, 21, 51, 100, 172, 274, 409, 583, 800, 1064, 1382, 1757, 2195, 2700, 3276,
                3930, 4665, 5487, 6400, 7408, 8518, 9733, 11059, 12500, 14060, 15746, 17561, 19511,
                21600, 23832, 26214, 28749, 31443, 34300, 37324, 40522, 43897, 47455, 51200, 55136,
                59270, 63605, 68147, 72900, 77868, 83058, 88473, 94119, 100000, 106120, 112486,
                119101, 125971, 133100, 140492, 148154, 156089, 164303, 172800, 181584, 190662,
                200037, 209715, 219700, 229996, 240610, 251545, 262807, 274400, 286328, 298598,
                311213, 324179, 337500, 351180, 365226, 379641, 394431, 409600, 425152, 441094,
                457429, 474163, 491300, 508844, 526802, 545177, 563975, 583200, 602856, 622950,
                643485, 664467, 685900, 707788, 730138, 752953, 776239, 800000,
            ],
            LevelUpType::Slow => [
                0, 10, 33, 80, 156, 270, 428, 640, 911, 1250, 1663, 2160, 2746, 3430, 4218, 5120,
                6141, 7290, 8573, 10000, 11576, 13310, 15208, 17280, 19531, 21970, 24603, 27440,
                30486, 33750, 37238, 40960, 44921, 49130, 53593, 58320, 63316, 68590, 74148, 80000,
                86151, 92610, 99383, 106480, 113906, 121670, 129778, 138240, 147061, 156250,
                165813, 175760, 186096, 196830, 207968, 219520, 231491, 243890, 256723, 270000,
                283726, 297910, 312558, 327680, 343281, 359370, 375953, 393040, 410636, 428750,
                447388, 466560, 486271, 506530, 527343, 548720, 570666, 593190, 616298, 640000,
                664301, 689210, 714733, 740880, 767656, 795070, 823128, 851840, 881211, 911250,
                941963, 973360, 1005446, 1038230, 1071718, 1105920, 1140841, 1176490, 1212873,
                1250000,
            ],
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
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
    pub evolutions: &'static [SpeciesAndForme],
    pub pre_evolution: Option<SpeciesAndForme>,
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
    pub const fn forme_ref(&self) -> SpeciesAndForme {
        SpeciesAndForme {
            national_dex: self.national_dex,
            forme_index: self.forme_index,
        }
    }

    pub const fn get_ability(&self, ability_num: u8) -> AbilityIndex {
        match ability_num {
            1 => self.abilities.0,
            _ => self.abilities.1,
        }
    }

    pub fn get_base_evolution(&self) -> SpeciesAndForme {
        match self.pre_evolution {
            None => self.forme_ref(),
            Some(forme_ref) => forme_ref.get_base_evolution(),
        }
    }
}

impl Display for FormeMetadata {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.forme_name)
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
