use std::{fmt::Display, marker::PhantomData, ops::Add};

use arbitrary_int::u3;
use pkm_rs_types::{ContestStat, FlagSet};

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
use serde::{Deserialize, Deserializer, Serialize, Serializer, de::Error};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::{
    log,
    ribbons::{ModernRibbon, ObsoleteRibbon, OpenHomeRibbon},
};

#[derive(Debug, Default, Serialize, PartialEq, Eq, Clone, Copy)]
struct Cool;
impl ContestStatMarker for Cool {
    const _STAT: ContestStat = ContestStat::Cool;
}
#[derive(Debug, Default, Serialize, PartialEq, Eq, Clone, Copy)]
struct Beauty;
impl ContestStatMarker for Beauty {
    const _STAT: ContestStat = ContestStat::Beauty;
}
#[derive(Debug, Default, Serialize, PartialEq, Eq, Clone, Copy)]
struct Cute;
impl ContestStatMarker for Cute {
    const _STAT: ContestStat = ContestStat::Cute;
}
#[derive(Debug, Default, Serialize, PartialEq, Eq, Clone, Copy)]
struct Smart;
impl ContestStatMarker for Smart {
    const _STAT: ContestStat = ContestStat::Smart;
}
#[derive(Debug, Default, Serialize, PartialEq, Eq, Clone, Copy)]
struct Tough;
impl ContestStatMarker for Tough {
    const _STAT: ContestStat = ContestStat::Tough;
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[derive(Default, Debug, Clone, Copy)]
pub struct Gen3RibbonSet {
    cool: Gen3ContestRibbons<Cool>,
    beauty: Gen3ContestRibbons<Beauty>,
    cute: Gen3ContestRibbons<Cute>,
    smart: Gen3ContestRibbons<Smart>,
    tough: Gen3ContestRibbons<Tough>,
    non_contest: FlagSet<2>,
}

impl Gen3RibbonSet {
    pub const fn from_u32(value: u32) -> Self {
        Self {
            cool: Gen3ContestRibbons::from_u3(u3::extract_u32(value, 0)),
            beauty: Gen3ContestRibbons::from_u3(u3::extract_u32(value, 3)),
            cute: Gen3ContestRibbons::from_u3(u3::extract_u32(value, 6)),
            smart: Gen3ContestRibbons::from_u3(u3::extract_u32(value, 9)),
            tough: Gen3ContestRibbons::from_u3(u3::extract_u32(value, 12)),
            non_contest: FlagSet::from_u16_le((value >> 15) as u16 & 0xfff),
        }
    }

    pub const fn to_u32(self) -> u32 {
        let mut value = 0;
        value |= self.cool.max_level().to_u8() as u32;
        value |= (self.beauty.max_level().to_u8() as u32) << 3;
        value |= (self.cute.max_level().to_u8() as u32) << 6;
        value |= (self.smart.max_level().to_u8() as u32) << 9;
        value |= (self.tough.max_level().to_u8() as u32) << 12;

        let non_contest = (u16::from_le_bytes(self.non_contest.to_bytes()) & 0xfff) as u32;
        value |= non_contest << 15;
        value
    }

    pub fn get_ribbons(&self) -> Vec<Gen3Ribbon> {
        let mut all_ribbons = self.cool.get_ribbons();
        all_ribbons.extend(self.beauty.get_ribbons());
        all_ribbons.extend(self.cute.get_ribbons());
        all_ribbons.extend(self.smart.get_ribbons());
        all_ribbons.extend(self.tough.get_ribbons());
        let other_ribbons: Vec<_> = self
            .non_contest
            .get_flags()
            .into_iter()
            .map(|index| Gen3Ribbon::Champion + index)
            .collect();
        all_ribbons.extend(other_ribbons);

        all_ribbons
    }

    pub fn add_ribbon(&mut self, ribbon: Gen3Ribbon) {
        match ribbon.constest_stat() {
            Some(ContestStat::Cool) => self.cool.add_if_stat(ribbon),
            Some(ContestStat::Beauty) => self.beauty.add_if_stat(ribbon),
            Some(ContestStat::Cute) => self.cute.add_if_stat(ribbon),
            Some(ContestStat::Smart) => self.smart.add_if_stat(ribbon),
            Some(ContestStat::Tough) => self.tough.add_if_stat(ribbon),
            None => {
                if let Some(index) = ribbon.get_index().checked_sub(20) {
                    self.non_contest.set_flag(index, true);
                }
            }
        }
    }

    pub fn with_ribbons(mut self, ribbons: Vec<Gen3Ribbon>) -> Self {
        ribbons
            .into_iter()
            .for_each(|ribbon| self.add_ribbon(ribbon));
        self
    }

    pub fn from_names(names: Vec<String>) -> Self {
        names
            .iter()
            .map(|s| s.strip_suffix("").unwrap_or(s))
            .filter_map(Gen3Ribbon::from_name)
            .collect()
    }

    const fn contest_ribbon_level(&self, stat: ContestStat) -> Gen3ContestRibbonLevel {
        match stat {
            ContestStat::Cool => self.cool.0,
            ContestStat::Beauty => self.beauty.0,
            ContestStat::Cute => self.cute.0,
            ContestStat::Smart => self.smart.0,
            ContestStat::Tough => self.tough.0,
        }
    }

    pub fn has_ribbon(&self, ribbon: Gen3Ribbon) -> bool {
        match ribbon.metadata() {
            Metadata::Contest { stat, level } => self.contest_ribbon_level(stat) >= level,
            Metadata::NonContest { index } => self.non_contest.get_flag(index),
        }
    }
}

impl FromIterator<Gen3Ribbon> for Gen3RibbonSet {
    fn from_iter<T: IntoIterator<Item = Gen3Ribbon>>(iter: T) -> Self {
        Self::default().with_ribbons(iter.into_iter().collect())
    }
}

impl Serialize for Gen3RibbonSet {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.get_ribbons().serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for Gen3RibbonSet {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Gen3RibbonSet, D::Error>
    where
        D: Deserializer<'de>,
    {
        let ribbons: Vec<Gen3Ribbon> = Vec::deserialize(deserializer)?;
        Ok(Self::default().with_ribbons(ribbons))
    }
}

trait ContestStatMarker {
    const _STAT: ContestStat;
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Default, Debug, Clone, Copy)]
struct Gen3ContestRibbons<Stat: ContestStatMarker>(Gen3ContestRibbonLevel, PhantomData<Stat>);

impl<Stat: ContestStatMarker> Gen3ContestRibbons<Stat> {
    pub const fn from_u3(value: u3) -> Self {
        Self(Gen3ContestRibbonLevel::from_u3(value), PhantomData)
    }

    pub const fn max_level(&self) -> Gen3ContestRibbonLevel {
        self.0
    }

    pub fn get_ribbons(&self) -> Vec<Gen3Ribbon> {
        let base_ribbon = Gen3Ribbon::contest_stat_base(Stat::_STAT);

        let mut ribbons: Vec<Gen3Ribbon> = Vec::new();
        for i in 1..=(self.0.to_u8()) {
            let base_ribbon_offset = i - 1;
            ribbons.push(base_ribbon + base_ribbon_offset);
        }

        ribbons
    }

    const fn raise_to(&mut self, new_level: Gen3ContestRibbonLevel) {
        if new_level.to_u8() > self.0.to_u8() {
            self.0 = new_level;
        }
    }

    pub fn add_if_stat(&mut self, ribbon: Gen3Ribbon) {
        if let Some(stat) = ribbon.constest_stat()
            && stat == Stat::_STAT
            && let Some(level) = ribbon.contest_level()
        {
            self.raise_to(level);
        }
    }
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum Gen3ContestRibbonLevel {
    #[default]
    None,
    Base,
    Super,
    Hyper,
    Master,
}

impl Gen3ContestRibbonLevel {
    const fn from_u3(value: u3) -> Self {
        Self::from_u8(value.value())
    }

    const fn from_u8(value: u8) -> Self {
        match value {
            0 => Self::None,
            1 => Self::Base,
            2 => Self::Super,
            3 => Self::Hyper,
            4.. => Self::Master,
        }
    }

    const fn to_u8(self) -> u8 {
        match self {
            Self::None => 0,
            Self::Base => 1,
            Self::Super => 2,
            Self::Hyper => 3,
            Self::Master => 4,
        }
    }
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(u8)]
pub enum Gen3Ribbon {
    #[serde(rename = "Cool (Hoenn)")]
    CoolHoenn,
    #[serde(rename = "Cool Super (Hoenn)")]
    CoolSuperHoenn,
    #[serde(rename = "Cool Hyper (Hoenn)")]
    CoolHyperHoenn,
    #[serde(rename = "Cool Master (Hoenn)")]
    CoolMasterHoenn,
    #[serde(rename = "Beauty (Hoenn)")]
    BeautyHoenn,
    #[serde(rename = "Beauty Super (Hoenn)")]
    BeautySuperHoenn,
    #[serde(rename = "Beauty Hyper (Hoenn)")]
    BeautyHyperHoenn,
    #[serde(rename = "Beauty Master (Hoenn)")]
    BeautyMasterHoenn,
    #[serde(rename = "Cute (Hoenn)")]
    CuteHoenn,
    #[serde(rename = "Cute Super (Hoenn)")]
    CuteSuperHoenn,
    #[serde(rename = "Cute Hyper (Hoenn)")]
    CuteHyperHoenn,
    #[serde(rename = "Cute Master (Hoenn)")]
    CuteMasterHoenn,
    #[serde(rename = "Smart (Hoenn)")]
    SmartHoenn,
    #[serde(rename = "Smart Super (Hoenn)")]
    SmartSuperHoenn,
    #[serde(rename = "Smart Hyper (Hoenn)")]
    SmartHyperHoenn,
    #[serde(rename = "Smart Master (Hoenn)")]
    SmartMasterHoenn,
    #[serde(rename = "Tough (Hoenn)")]
    ToughHoenn,
    #[serde(rename = "Tough Super (Hoenn)")]
    ToughSuperHoenn,
    #[serde(rename = "Tough Hyper (Hoenn)")]
    ToughHyperHoenn,
    #[serde(rename = "Tough Master (Hoenn)")]
    ToughMasterHoenn,
    Champion,
    Winning,
    Victory,
    Artist,
    Effort,
    #[serde(rename = "Battle Champion")]
    BattleChampion,
    #[serde(rename = "Regional Champion")]
    RegionalChampion,
    #[serde(rename = "National Champion")]
    NationalChampion,
    Country,
    National,
    Earth,
    World,
}

enum Metadata {
    Contest {
        stat: ContestStat,
        level: Gen3ContestRibbonLevel,
    },
    NonContest {
        index: usize,
    },
}

impl Gen3Ribbon {
    pub const fn get_index(self) -> usize {
        self as usize
    }

    pub fn from_index(index: usize) -> Gen3Ribbon {
        if index > Gen3Ribbon::World as usize {
            panic!("Attempting to get Gen3Ribbon from index > 31")
        }

        unsafe { std::mem::transmute(index as u8) }
    }

    pub fn from_u8(index: u8) -> Gen3Ribbon {
        Self::from_index(index as usize)
    }

    const fn contest_stat_base(stat: ContestStat) -> Gen3Ribbon {
        match stat {
            ContestStat::Cool => Gen3Ribbon::CoolHoenn,
            ContestStat::Beauty => Gen3Ribbon::BeautyHoenn,
            ContestStat::Cute => Gen3Ribbon::CuteHoenn,
            ContestStat::Smart => Gen3Ribbon::SmartHoenn,
            ContestStat::Tough => Gen3Ribbon::ToughHoenn,
        }
    }

    const fn metadata(self) -> Metadata {
        match self.constest_data() {
            Some((stat, level)) => Metadata::Contest { stat, level },
            None => Metadata::NonContest {
                index: self as usize - 20,
            },
        }
    }

    const fn constest_data(self) -> Option<(ContestStat, Gen3ContestRibbonLevel)> {
        if let Some(stat) = self.constest_stat()
            && let Some(level) = self.contest_level()
        {
            Some((stat, level))
        } else {
            None
        }
    }

    const fn constest_stat(self) -> Option<ContestStat> {
        match self {
            Gen3Ribbon::CoolHoenn
            | Gen3Ribbon::CoolSuperHoenn
            | Gen3Ribbon::CoolHyperHoenn
            | Gen3Ribbon::CoolMasterHoenn => Some(ContestStat::Cool),
            Gen3Ribbon::BeautyHoenn
            | Gen3Ribbon::BeautySuperHoenn
            | Gen3Ribbon::BeautyHyperHoenn
            | Gen3Ribbon::BeautyMasterHoenn => Some(ContestStat::Beauty),
            Gen3Ribbon::CuteHoenn
            | Gen3Ribbon::CuteSuperHoenn
            | Gen3Ribbon::CuteHyperHoenn
            | Gen3Ribbon::CuteMasterHoenn => Some(ContestStat::Cute),
            Gen3Ribbon::SmartHoenn
            | Gen3Ribbon::SmartSuperHoenn
            | Gen3Ribbon::SmartHyperHoenn
            | Gen3Ribbon::SmartMasterHoenn => Some(ContestStat::Smart),
            Gen3Ribbon::ToughHoenn
            | Gen3Ribbon::ToughSuperHoenn
            | Gen3Ribbon::ToughHyperHoenn
            | Gen3Ribbon::ToughMasterHoenn => Some(ContestStat::Tough),
            _ => None,
        }
    }

    const fn contest_level(self) -> Option<Gen3ContestRibbonLevel> {
        match self {
            Gen3Ribbon::CoolHoenn
            | Gen3Ribbon::BeautyHoenn
            | Gen3Ribbon::CuteHoenn
            | Gen3Ribbon::SmartHoenn
            | Gen3Ribbon::ToughHoenn => Some(Gen3ContestRibbonLevel::Base),
            Gen3Ribbon::CoolSuperHoenn
            | Gen3Ribbon::BeautySuperHoenn
            | Gen3Ribbon::CuteSuperHoenn
            | Gen3Ribbon::SmartSuperHoenn
            | Gen3Ribbon::ToughSuperHoenn => Some(Gen3ContestRibbonLevel::Super),
            Gen3Ribbon::CoolHyperHoenn
            | Gen3Ribbon::BeautyHyperHoenn
            | Gen3Ribbon::CuteHyperHoenn
            | Gen3Ribbon::SmartHyperHoenn
            | Gen3Ribbon::ToughHyperHoenn => Some(Gen3ContestRibbonLevel::Hyper),
            Gen3Ribbon::CoolMasterHoenn
            | Gen3Ribbon::BeautyMasterHoenn
            | Gen3Ribbon::CuteMasterHoenn
            | Gen3Ribbon::SmartMasterHoenn
            | Gen3Ribbon::ToughMasterHoenn => Some(Gen3ContestRibbonLevel::Master),
            _ => None,
        }
    }

    const fn get_name(&self) -> &'static str {
        match self {
            Gen3Ribbon::CoolHoenn => "Cool (Hoenn)",
            Gen3Ribbon::CoolSuperHoenn => "Cool Super (Hoenn)",
            Gen3Ribbon::CoolHyperHoenn => "Cool Hyper (Hoenn)",
            Gen3Ribbon::CoolMasterHoenn => "Cool Master (Hoenn)",
            Gen3Ribbon::BeautyHoenn => "Beauty (Hoenn)",
            Gen3Ribbon::BeautySuperHoenn => "Beauty Super (Hoenn)",
            Gen3Ribbon::BeautyHyperHoenn => "Beauty Hyper (Hoenn)",
            Gen3Ribbon::BeautyMasterHoenn => "Beauty Master (Hoenn)",
            Gen3Ribbon::CuteHoenn => "Cute (Hoenn)",
            Gen3Ribbon::CuteSuperHoenn => "Cute Super (Hoenn)",
            Gen3Ribbon::CuteHyperHoenn => "Cute Hyper (Hoenn)",
            Gen3Ribbon::CuteMasterHoenn => "Cute Master (Hoenn)",
            Gen3Ribbon::SmartHoenn => "Smart (Hoenn)",
            Gen3Ribbon::SmartSuperHoenn => "Smart Super (Hoenn)",
            Gen3Ribbon::SmartHyperHoenn => "Smart Hyper (Hoenn)",
            Gen3Ribbon::SmartMasterHoenn => "Smart Master (Hoenn)",
            Gen3Ribbon::ToughHoenn => "Tough (Hoenn)",
            Gen3Ribbon::ToughSuperHoenn => "Tough Super",
            Gen3Ribbon::ToughHyperHoenn => "Tough Hyper (Hoenn)",
            Gen3Ribbon::ToughMasterHoenn => "Tough Master (Hoenn)",
            Gen3Ribbon::Champion => "Champion",
            Gen3Ribbon::Winning => "Winning",
            Gen3Ribbon::Victory => "Victory",
            Gen3Ribbon::Artist => "Artist",
            Gen3Ribbon::Effort => "Effort",
            Gen3Ribbon::BattleChampion => "Battle Champion",
            Gen3Ribbon::RegionalChampion => "Regional Champion",
            Gen3Ribbon::NationalChampion => "National Champion",
            Gen3Ribbon::Country => "Country",
            Gen3Ribbon::National => "National",
            Gen3Ribbon::Earth => "Earth",
            Gen3Ribbon::World => "World",
        }
    }

    pub fn from_name(name: &str) -> Option<Self> {
        let name = name.strip_suffix(" Ribbon").unwrap_or(name);
        let name = name.strip_suffix(" (Hoenn)").unwrap_or(name);
        let name = name.strip_suffix(" Ribbon").unwrap_or(name);
        match name {
            "Cool" => Some(Gen3Ribbon::CoolHoenn),
            "Cool Super" => Some(Gen3Ribbon::CoolSuperHoenn),
            "Cool Hyper" => Some(Gen3Ribbon::CoolHyperHoenn),
            "Cool Master" => Some(Gen3Ribbon::CoolMasterHoenn),
            "Beauty" => Some(Gen3Ribbon::BeautyHoenn),
            "Beauty Super" => Some(Gen3Ribbon::BeautySuperHoenn),
            "Beauty Hyper" => Some(Gen3Ribbon::BeautyHyperHoenn),
            "Beauty Master" => Some(Gen3Ribbon::BeautyMasterHoenn),
            "Cute" => Some(Gen3Ribbon::CuteHoenn),
            "Cute Super" => Some(Gen3Ribbon::CuteSuperHoenn),
            "Cute Hyper" => Some(Gen3Ribbon::CuteHyperHoenn),
            "Cute Master" => Some(Gen3Ribbon::CuteMasterHoenn),
            "Smart" => Some(Gen3Ribbon::SmartHoenn),
            "Smart Super" => Some(Gen3Ribbon::SmartSuperHoenn),
            "Smart Hyper" => Some(Gen3Ribbon::SmartHyperHoenn),
            "Smart Master" => Some(Gen3Ribbon::SmartMasterHoenn),
            "Tough" => Some(Gen3Ribbon::ToughHoenn),
            "Tough Super" => Some(Gen3Ribbon::ToughSuperHoenn),
            "Tough Hyper" => Some(Gen3Ribbon::ToughHyperHoenn),
            "Tough Master" => Some(Gen3Ribbon::ToughMasterHoenn),
            "Champion" => Some(Gen3Ribbon::Champion),
            "Winning" => Some(Gen3Ribbon::Winning),
            "Victory" => Some(Gen3Ribbon::Victory),
            "Artist" => Some(Gen3Ribbon::Artist),
            "Effort" => Some(Gen3Ribbon::Effort),
            "Battle Champion" => Some(Gen3Ribbon::BattleChampion),
            "Regional Champion" => Some(Gen3Ribbon::RegionalChampion),
            "National Champion" => Some(Gen3Ribbon::NationalChampion),
            "Country" => Some(Gen3Ribbon::Country),
            "National" => Some(Gen3Ribbon::National),
            "Earth" => Some(Gen3Ribbon::Earth),
            "World" => Some(Gen3Ribbon::World),
            _ => {
                log!("no ribbon found for {name}");
                None
            }
        }
    }

    pub(crate) const fn from_obsolete_if_present(obsolete: ObsoleteRibbon) -> Option<Gen3Ribbon> {
        match obsolete {
            ObsoleteRibbon::CoolHoenn => Some(Gen3Ribbon::CoolHoenn),
            ObsoleteRibbon::CoolSuperHoenn => Some(Gen3Ribbon::CoolSuperHoenn),
            ObsoleteRibbon::CoolHyperHoenn => Some(Gen3Ribbon::CoolHyperHoenn),
            ObsoleteRibbon::CoolMasterHoenn => Some(Gen3Ribbon::CoolMasterHoenn),
            ObsoleteRibbon::BeautyHoenn => Some(Gen3Ribbon::BeautyHoenn),
            ObsoleteRibbon::BeautySuperHoenn => Some(Gen3Ribbon::BeautySuperHoenn),
            ObsoleteRibbon::BeautyHyperHoenn => Some(Gen3Ribbon::BeautyHyperHoenn),
            ObsoleteRibbon::BeautyMasterHoenn => Some(Gen3Ribbon::BeautyMasterHoenn),
            ObsoleteRibbon::CuteHoenn => Some(Gen3Ribbon::CuteHoenn),
            ObsoleteRibbon::CuteSuperHoenn => Some(Gen3Ribbon::CuteSuperHoenn),
            ObsoleteRibbon::CuteHyperHoenn => Some(Gen3Ribbon::CuteHyperHoenn),
            ObsoleteRibbon::CuteMasterHoenn => Some(Gen3Ribbon::CuteMasterHoenn),
            ObsoleteRibbon::SmartHoenn => Some(Gen3Ribbon::SmartHoenn),
            ObsoleteRibbon::SmartSuperHoenn => Some(Gen3Ribbon::SmartSuperHoenn),
            ObsoleteRibbon::SmartHyperHoenn => Some(Gen3Ribbon::SmartHyperHoenn),
            ObsoleteRibbon::SmartMasterHoenn => Some(Gen3Ribbon::SmartMasterHoenn),
            ObsoleteRibbon::ToughHoenn => Some(Gen3Ribbon::ToughHoenn),
            ObsoleteRibbon::ToughSuperHoenn => Some(Gen3Ribbon::ToughSuperHoenn),
            ObsoleteRibbon::ToughHyperHoenn => Some(Gen3Ribbon::ToughHyperHoenn),
            ObsoleteRibbon::ToughMasterHoenn => Some(Gen3Ribbon::ToughMasterHoenn),
            ObsoleteRibbon::Winning => Some(Gen3Ribbon::Winning),
            ObsoleteRibbon::Victory => Some(Gen3Ribbon::Victory),
            _ => None,
        }
    }

    pub(crate) const fn from_modern_if_present(modern: ModernRibbon) -> Option<Gen3Ribbon> {
        match modern {
            ModernRibbon::Gen3Champion => Some(Gen3Ribbon::Champion),
            ModernRibbon::Effort => Some(Gen3Ribbon::Effort),
            ModernRibbon::Artist => Some(Gen3Ribbon::Artist),
            ModernRibbon::Country => Some(Gen3Ribbon::Country),
            ModernRibbon::National => Some(Gen3Ribbon::National),
            ModernRibbon::Earth => Some(Gen3Ribbon::Earth),
            ModernRibbon::World => Some(Gen3Ribbon::World),
            ModernRibbon::BattleChampion => Some(Gen3Ribbon::BattleChampion),
            ModernRibbon::RegionalChampion => Some(Gen3Ribbon::RegionalChampion),
            ModernRibbon::NationalChampion => Some(Gen3Ribbon::NationalChampion),
            _ => None,
        }
    }

    pub const fn from_openhome_if_present(openhome: OpenHomeRibbon) -> Option<Self> {
        match openhome {
            OpenHomeRibbon::Mod(modern) => Self::from_modern_if_present(modern),
            OpenHomeRibbon::Obs(obsolete) => Self::from_obsolete_if_present(obsolete),
        }
    }

    pub const fn to_openhome(self) -> OpenHomeRibbon {
        match self {
            Gen3Ribbon::Champion => OpenHomeRibbon::Mod(ModernRibbon::Gen3Champion),
            Gen3Ribbon::Effort => OpenHomeRibbon::Mod(ModernRibbon::Effort),
            Gen3Ribbon::Artist => OpenHomeRibbon::Mod(ModernRibbon::Artist),
            Gen3Ribbon::Country => OpenHomeRibbon::Mod(ModernRibbon::Country),
            Gen3Ribbon::National => OpenHomeRibbon::Mod(ModernRibbon::National),
            Gen3Ribbon::Earth => OpenHomeRibbon::Mod(ModernRibbon::Earth),
            Gen3Ribbon::World => OpenHomeRibbon::Mod(ModernRibbon::World),
            Gen3Ribbon::BattleChampion => OpenHomeRibbon::Mod(ModernRibbon::BattleChampion),
            Gen3Ribbon::RegionalChampion => OpenHomeRibbon::Mod(ModernRibbon::RegionalChampion),
            Gen3Ribbon::NationalChampion => OpenHomeRibbon::Mod(ModernRibbon::NationalChampion),
            Gen3Ribbon::CoolHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CoolHoenn),
            Gen3Ribbon::CoolSuperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CoolSuperHoenn),
            Gen3Ribbon::CoolHyperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CoolHyperHoenn),
            Gen3Ribbon::CoolMasterHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CoolMasterHoenn),
            Gen3Ribbon::BeautyHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyHoenn),
            Gen3Ribbon::BeautySuperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::BeautySuperHoenn),
            Gen3Ribbon::BeautyHyperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyHyperHoenn),
            Gen3Ribbon::BeautyMasterHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyMasterHoenn),
            Gen3Ribbon::CuteHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CuteHoenn),
            Gen3Ribbon::CuteSuperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CuteSuperHoenn),
            Gen3Ribbon::CuteHyperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CuteHyperHoenn),
            Gen3Ribbon::CuteMasterHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CuteMasterHoenn),
            Gen3Ribbon::SmartHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::SmartHoenn),
            Gen3Ribbon::SmartSuperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::SmartSuperHoenn),
            Gen3Ribbon::SmartHyperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::SmartHyperHoenn),
            Gen3Ribbon::SmartMasterHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::SmartMasterHoenn),
            Gen3Ribbon::ToughHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::ToughHoenn),
            Gen3Ribbon::ToughSuperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::ToughSuperHoenn),
            Gen3Ribbon::ToughHyperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::ToughHyperHoenn),
            Gen3Ribbon::ToughMasterHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::ToughMasterHoenn),
            Gen3Ribbon::Winning => OpenHomeRibbon::Obs(ObsoleteRibbon::Winning),
            Gen3Ribbon::Victory => OpenHomeRibbon::Obs(ObsoleteRibbon::Victory),
        }
    }
}

impl TryFrom<OpenHomeRibbon> for Gen3Ribbon {
    type Error = ();

    fn try_from(value: OpenHomeRibbon) -> Result<Self, Self::Error> {
        match value {
            OpenHomeRibbon::Mod(modern) => Self::from_modern_if_present(modern).ok_or(()),
            OpenHomeRibbon::Obs(obsolete) => Self::from_obsolete_if_present(obsolete).ok_or(()),
        }
    }
}

impl TryFrom<ModernRibbon> for Gen3Ribbon {
    type Error = ();

    fn try_from(value: ModernRibbon) -> Result<Self, Self::Error> {
        Self::from_modern_if_present(value).ok_or(())
    }
}

impl Display for Gen3Ribbon {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.get_name())
    }
}

impl Serialize for Gen3Ribbon {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.get_name().serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for Gen3Ribbon {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Gen3Ribbon, D::Error>
    where
        D: Deserializer<'de>,
    {
        let string_value = String::deserialize(deserializer)?;

        Self::from_name(&string_value).ok_or(D::Error::custom(format!(
            "invalid Gen3Ribbon: {string_value}"
        )))
    }
}

impl Add<u8> for Gen3Ribbon {
    type Output = Self;

    fn add(self, rhs: u8) -> Self::Output {
        if self as u8 + rhs > Self::World as u8 {
            panic!("attempting to add too large a value to Gen3Ribbon")
        }
        Self::from_u8(self as u8 + rhs)
    }
}

impl Add<usize> for Gen3Ribbon {
    type Output = Self;

    fn add(self, rhs: usize) -> Self::Output {
        if self as usize + rhs > Self::World as usize {
            panic!("attempting to add too large a value to Gen3Ribbon")
        }
        Self::from_index(self as usize + rhs)
    }
}
