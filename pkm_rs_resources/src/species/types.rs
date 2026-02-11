use std::{fmt::Display, num::NonZeroU16};
use strum_macros::{Display, EnumString};

use crate::{Error, Result, abilities::AbilityIndex, species::ALL_SPECIES};
use pkm_rs_types::{GameSetting, Generation, PkmType, Stats16Le, TeraType};
use serde::{Serialize, Serializer};

#[cfg(feature = "wasm")]
use crate::stats::Stat;

#[cfg(feature = "wasm")]
use pkm_rs_types::Gender;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub const MAX_NATIONAL_DEX: usize = 1025;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct NatDexIndex(NonZeroU16);

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct InvalidNatDexIndex(u16);

impl InvalidNatDexIndex {
    pub const fn index(&self) -> u16 {
        self.0
    }
}

impl Display for InvalidNatDexIndex {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "invalid national dex index: {}", self.0)
    }
}

impl NatDexIndex {
    pub fn new(index: u16) -> core::result::Result<Self, InvalidNatDexIndex> {
        if (index as usize) > MAX_NATIONAL_DEX {
            return Err(InvalidNatDexIndex(index));
        }
        NonZeroU16::new(index)
            .map(NatDexIndex)
            .ok_or(InvalidNatDexIndex(index))
    }

    pub const fn get_species_metadata(&self) -> &'static SpeciesMetadata {
        &ALL_SPECIES[(self.get() - 1) as usize]
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

    pub fn from_le_bytes(bytes: [u8; 2]) -> core::result::Result<Self, InvalidNatDexIndex> {
        NatDexIndex::new(u16::from_le_bytes(bytes))
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.get().to_le_bytes()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl NatDexIndex {
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
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

impl GenderRatio {
    #[cfg(feature = "wasm")]
    const fn male_pid_last_byte_threshold(&self) -> u8 {
        match self {
            GenderRatio::M1ToF7 => 225,
            GenderRatio::M1ToF3 => 191,
            GenderRatio::Equal => 127,
            GenderRatio::M3ToF1 => 63,
            GenderRatio::M7ToF1 => 31,
            _ => 255, // special cases
        }
    }

    #[cfg(feature = "wasm")]
    const fn male_atk_dv_threshold(&self) -> u8 {
        match self {
            GenderRatio::AllMale => 0,
            GenderRatio::M7ToF1 => 2,
            GenderRatio::M3ToF1 => 4,
            GenderRatio::Equal => 8,
            GenderRatio::M1ToF3 => 12,
            GenderRatio::M1ToF7 => 14, // no species in gen 2 has this ratio
            _ => 255,                  // special cases
        }
    }

    #[cfg(feature = "wasm")]
    const fn gender_for_pid(&self, pid: u32) -> Gender {
        match self {
            Self::Genderless => Gender::Genderless,
            Self::AllMale => Gender::Male,
            Self::AllFemale => Gender::Female,
            ratio => {
                let last_byte = (pid & 0xff) as u8;
                if last_byte >= ratio.male_pid_last_byte_threshold() {
                    Gender::Male
                } else {
                    Gender::Female
                }
            }
        }
    }

    #[cfg(feature = "wasm")]
    const fn gender_for_atk_dv(&self, atk_dv: u8) -> Gender {
        match self {
            Self::Genderless => Gender::Genderless,
            Self::AllMale => Gender::Male,
            Self::AllFemale => Gender::Female,
            ratio => {
                if atk_dv >= ratio.male_atk_dv_threshold() {
                    Gender::Male
                } else {
                    Gender::Female
                }
            }
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, EnumString, Display, PartialEq, Eq, Clone, Copy)]
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
            .unwrap_or(99) as u8
            + 1
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
#[derive(Debug, Default, EnumString, Display, PartialEq, Eq, Clone, Copy)]
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
#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone)]
pub struct FormeMetadata {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub species_name: &'static str,

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = nationalDex))]
    pub national_dex: NatDexIndex,

    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub forme_name: &'static str,

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = formeIndex))]
    pub forme_index: u16,

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = isBaseForme))]
    pub is_base_forme: bool,

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = isMega))]
    pub is_mega: bool,

    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub mega_evolution_data: &'static [MegaEvolutionMetadata],

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = isGmax))]
    pub is_gmax: bool,

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = isBattleOnly))]
    pub is_battle_only: bool,

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = isCosmetic))]
    pub is_cosmetic: bool,

    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub types: (PkmType, Option<PkmType>),

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = genderRatio))]
    pub gender_ratio: GenderRatio,

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = baseStats))]
    pub base_stats: Stats16Le,

    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub abilities: (AbilityIndex, AbilityIndex),

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = hiddenAbility))]
    pub hidden_ability: Option<AbilityIndex>,

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = baseHeight))]
    pub base_height: u32,

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = baseWeight))]
    pub base_weight: u32,

    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub evolutions: &'static [SpeciesAndForme],

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = preEvolution))]
    pub pre_evolution: Option<SpeciesAndForme>,

    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub egg_groups: (EggGroup, Option<EggGroup>),

    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub introduced: Generation,

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = isRestrictedLegend))]
    pub is_restricted_legend: bool,

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = isSubLegend))]
    pub is_sub_legend: bool,

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = isMythical))]
    pub is_mythical: bool,

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = isUltraBeast))]
    pub is_ultra_beast: bool,

    #[cfg_attr(feature = "wasm", wasm_bindgen(readonly, js_name = isParadox))]
    pub is_paradox: bool,

    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub regional: Option<GameSetting>,

    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub sprite: &'static str,

    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub sprite_index: (u8, u8),
}

impl FormeMetadata {
    pub const fn forme_ref(&self) -> SpeciesAndForme {
        unsafe { SpeciesAndForme::new_unchecked(self.national_dex.get(), self.forme_index) }
    }

    pub const fn species_metadata(&self) -> &SpeciesMetadata {
        self.forme_ref().get_species_metadata()
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

    pub fn is_evolution_of(&self, other: &FormeMetadata) -> bool {
        other.evolutions.iter().any(|other_evo| {
            *other_evo == self.forme_ref() || self.is_evolution_of(other_evo.get_forme_metadata())
        })
    }

    #[cfg(feature = "wasm")]
    fn is_mega_forme_of(&self, other: &FormeMetadata) -> bool {
        other
            .mega_evolution_data
            .iter()
            .any(|mega| mega.mega_forme.forme_index == self.forme_index)
    }

    /// Tera Type assigned by Pokémon HOME for the species when not originally
    /// from Scarlet/Violet
    pub const fn transferred_tera_type(&self) -> TeraType {
        TeraType::Standard(match self.types {
            (PkmType::Normal, Some(type2)) => type2,
            (type1, _) => type1,
        })
    }
}

#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
#[cfg(feature = "wasm")]
impl FormeMetadata {
    #[wasm_bindgen(getter = megaEvolutions)]
    pub fn mega_evolutions(&self) -> Vec<MegaEvolutionMetadata> {
        self.mega_evolution_data.to_vec()
    }

    #[wasm_bindgen(getter = type1)]
    pub fn type_1(&self) -> String {
        self.types.0.to_string()
    }

    #[wasm_bindgen(getter = type1Index)]
    pub fn type_1_index(&self) -> u8 {
        self.types.0 as u8
    }

    #[wasm_bindgen(getter = type2)]
    pub fn type_2(&self) -> Option<String> {
        self.types.1.map(|t| t.to_string())
    }

    #[wasm_bindgen(getter = type2Index)]
    pub fn type_2_index(&self) -> Option<u8> {
        self.types.1.map(|t| t as u8)
    }

    #[wasm_bindgen(getter)]
    pub fn abilities(&self) -> Vec<AbilityIndex> {
        vec![self.abilities.0, self.abilities.1]
    }

    #[wasm_bindgen(js_name = abilityByNum)]
    pub fn ability_by_num(&self, num: u8) -> AbilityIndex {
        match num {
            4 => self.hidden_ability.unwrap_or(self.abilities.0),
            2 => self.abilities.1,
            _ => self.abilities.0,
        }
    }

    #[wasm_bindgen(js_name = abilityByNumGen3)]
    pub fn ability_by_num_gen_3(&self, num: u8) -> AbilityIndex {
        if num == 2 && self.abilities.1.get() <= 77 {
            self.abilities.1
        } else {
            self.abilities.0
        }
    }

    #[wasm_bindgen(getter = eggGroups)]
    pub fn egg_groups(&self) -> Vec<String> {
        match self.egg_groups.1 {
            Some(egg_group_1) => vec![self.egg_groups.0.to_string(), egg_group_1.to_string()],
            None => vec![self.egg_groups.0.to_string()],
        }
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn evolutions(&self) -> Vec<SpeciesAndForme> {
        self.evolutions.to_vec()
    }

    #[wasm_bindgen(getter = speciesName)]
    pub fn species_name(&self) -> String {
        self.species_name.to_owned()
    }

    #[wasm_bindgen(getter = formeName)]
    pub fn forme_name(&self) -> String {
        self.forme_name.to_owned()
    }

    #[wasm_bindgen(getter = introducedGen)]
    pub fn introduced_gen(&self) -> Generation {
        self.introduced
    }

    #[wasm_bindgen(getter)]
    pub fn regional(&self) -> Option<String> {
        self.regional.as_ref().map(GameSetting::to_string)
    }

    #[wasm_bindgen(getter)]
    pub fn sprite(&self) -> String {
        self.sprite.to_owned()
    }

    #[wasm_bindgen(getter = spriteCoords)]
    pub fn sprite_coords(&self) -> Vec<u8> {
        vec![self.sprite_index.0, self.sprite_index.1]
    }

    #[wasm_bindgen(js_name = genderFromAtkDv)]
    pub fn gender_from_atk_dv(&self, atk_dv: u8) -> Gender {
        self.gender_ratio.gender_for_atk_dv(atk_dv)
    }

    #[wasm_bindgen(js_name = genderFromPid)]
    pub fn gender_from_pid(&self, pid: u32) -> Gender {
        self.gender_ratio.gender_for_pid(pid)
    }

    #[wasm_bindgen(js_name = isEvolutionOf)]
    pub fn is_evolution_of_js(&self, other: &FormeMetadata) -> bool {
        self.is_evolution_of(other)
    }

    #[wasm_bindgen(js_name = getBaseStat)]
    pub fn get_base_stat(&self, stat: Stat) -> u16 {
        match stat {
            Stat::HP => self.base_stats.hp,
            Stat::Attack => self.base_stats.atk,
            Stat::Defense => self.base_stats.def,
            Stat::SpecialAttack => self.base_stats.spa,
            Stat::SpecialDefense => self.base_stats.spd,
            Stat::Speed => self.base_stats.spe,
        }
    }

    #[wasm_bindgen(js_name = getMegaBaseForme)]
    pub fn get_mega_base_forme(&self) -> Option<FormeMetadata> {
        if !self.is_mega {
            return None;
        }

        self.species_metadata()
            .formes
            .iter()
            .find(|other| self.is_mega_forme_of(other))
            .cloned()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy)]
pub struct MegaEvolutionMetadata {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = megaForme))]
    pub mega_forme: SpeciesAndForme,
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = requiredItemId))]
    pub required_item_id: Option<u16>,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone)]
pub struct SpeciesMetadata {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub name: &'static str,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub national_dex: NatDexIndex,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub level_up_type: LevelUpType,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub formes: &'static [FormeMetadata],
}

impl SpeciesMetadata {
    pub const fn get_forme(&self, forme_index: usize) -> Option<&'static FormeMetadata> {
        if forme_index < self.formes.len() {
            Some(&self.formes[forme_index])
        } else {
            None
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl SpeciesMetadata {
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn name(&self) -> String {
        self.name.to_owned()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn formes(&self) -> Vec<FormeMetadata> {
        Vec::from(self.formes)
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter = nationalDex))]
    pub fn national_dex(&self) -> u16 {
        self.national_dex.index()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = calculateLevel))]
    pub fn calculate_level(&self, exp: u32) -> u8 {
        self.level_up_type.calculate_level(exp)
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter = levelUpType))]
    pub fn level_up_type(&self) -> String {
        self.level_up_type.to_string()
    }
}

pub enum InvalidSpeciesForme {
    NatDex(InvalidNatDexIndex),
    FormeIndex(NatDexIndex, u16),
}

impl Display for InvalidSpeciesForme {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NatDex(err) => err.fmt(f),
            Self::FormeIndex(nat_dex, invalid_forme_idx) => {
                write!(
                    f,
                    "forme index {invalid_forme_idx} invalid for national dex index {}",
                    nat_dex.0
                )
            }
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, PartialEq, Eq, Clone, Copy, Serialize)]
pub struct SpeciesAndForme {
    national_dex: NatDexIndex,
    forme_index: u16,
}

impl SpeciesAndForme {
    pub fn new(
        national_dex: u16,
        forme_index: u16,
    ) -> core::result::Result<Self, InvalidSpeciesForme> {
        let valid_ndex = NatDexIndex::new(national_dex).map_err(InvalidSpeciesForme::NatDex)?;

        if valid_ndex.get_species_metadata().formes.len() <= forme_index as usize {
            return Err(InvalidSpeciesForme::FormeIndex(valid_ndex, forme_index));
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

    pub const fn to_tuple(self) -> (u16, u16) {
        (self.national_dex.get(), self.forme_index)
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

#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
#[cfg(feature = "wasm")]
impl SpeciesAndForme {
    #[wasm_bindgen(constructor)]
    pub fn new_js(national_dex: u16, forme_index: u16) -> core::result::Result<Self, JsValue> {
        Self::new(national_dex, forme_index).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter = nationalDex))]
    pub fn get_ndex_js(&self) -> u16 {
        self.national_dex.get()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter = formeIndex))]
    pub fn get_forme_index_js(&self) -> u16 {
        self.forme_index
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = getSpeciesMetadata))]
    pub fn get_species_metadata_js(&self) -> SpeciesMetadata {
        self.get_species_metadata().clone()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = getMetadata))]
    pub fn get_forme_metadata_js(&self) -> FormeMetadata {
        self.get_forme_metadata().clone()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = tryNew))]
    pub fn try_new(national_dex: u16, forme_index: u16) -> Option<Self> {
        Self::new(national_dex, forme_index).ok()
    }
}
