use std::{fmt::Display, ops::Add};

use arbitrary_int::u3;
use pkm_rs_types::{ContestStat, FlagSet};

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
use serde::{Serialize, Serializer};

use crate::ribbons::{ModernRibbon, ObsoleteRibbon, OpenHomeRibbon};

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Default, Debug, Clone, Copy)]
pub struct Gen3RibbonSet {
    cool: Gen3ContestRibbons,
    beauty: Gen3ContestRibbons,
    cute: Gen3ContestRibbons,
    smart: Gen3ContestRibbons,
    tough: Gen3ContestRibbons,
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
        let mut all_ribbons = self.cool.get_ribbons(ContestStat::Cool);
        all_ribbons.extend(self.beauty.get_ribbons(ContestStat::Beauty));
        all_ribbons.extend(self.cute.get_ribbons(ContestStat::Cute));
        all_ribbons.extend(self.smart.get_ribbons(ContestStat::Smart));
        all_ribbons.extend(self.tough.get_ribbons(ContestStat::Tough));
        let other_ribbons: Vec<_> = self
            .non_contest
            .get_flags()
            .into_iter()
            .map(|index| Gen3Ribbon::Champion + index)
            .collect();
        all_ribbons.extend(other_ribbons);

        all_ribbons
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

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Default, Debug, Clone, Copy)]
struct Gen3ContestRibbons(Gen3ContestRibbonLevel);

impl Gen3ContestRibbons {
    pub const fn from_u3(value: u3) -> Self {
        Self(Gen3ContestRibbonLevel::from_u3(value))
    }

    pub const fn max_level(&self) -> Gen3ContestRibbonLevel {
        self.0
    }

    pub fn get_ribbons(&self, stat: ContestStat) -> Vec<Gen3Ribbon> {
        let base_ribbon = Gen3Ribbon::contest_stat_base(stat);
        let mut ribbons: Vec<Gen3Ribbon> = Vec::new();
        for i in 1..(self.0.to_u8()) {
            let base_ribbon_offset = i - 1;
            ribbons.push(base_ribbon + base_ribbon_offset);
        }

        ribbons
    }
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Clone, Copy)]
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

#[derive(Debug, Serialize, PartialEq, Eq, Clone, Copy)]
#[repr(u8)]
pub enum Gen3Ribbon {
    CoolHoenn,
    CoolSuperHoenn,
    CoolHyperHoenn,
    CoolMasterHoenn,
    BeautyHoenn,
    BeautySuperHoenn,
    BeautyHyperHoenn,
    BeautyMasterHoenn,
    CuteHoenn,
    CuteSuperHoenn,
    CuteHyperHoenn,
    CuteMasterHoenn,
    SmartHoenn,
    SmartSuperHoenn,
    SmartHyperHoenn,
    SmartMasterHoenn,
    ToughHoenn,
    ToughSuperHoenn,
    ToughHyperHoenn,
    ToughMasterHoenn,
    Champion,
    Winning,
    Victory,
    Artist,
    Effort,
    BattleChampion,
    RegionalChampion,
    NationalChampion,
    Country,
    National,
    Earth,
    World,
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

    const fn get_name(&self) -> &'static str {
        match self {
            Gen3Ribbon::CoolHoenn => "Cool Ribbon",
            Gen3Ribbon::CoolSuperHoenn => "Cool Super Ribbon",
            Gen3Ribbon::CoolHyperHoenn => "Cool Hyper Ribbon",
            Gen3Ribbon::CoolMasterHoenn => "Cool Master Ribbon",
            Gen3Ribbon::BeautyHoenn => "Beauty Ribbon",
            Gen3Ribbon::BeautySuperHoenn => "Beauty Super Ribbon",
            Gen3Ribbon::BeautyHyperHoenn => "Beauty Hyper Ribbon",
            Gen3Ribbon::BeautyMasterHoenn => "Beauty Master Ribbon",
            Gen3Ribbon::CuteHoenn => "Cute Ribbon",
            Gen3Ribbon::CuteSuperHoenn => "Cute Super Ribbon",
            Gen3Ribbon::CuteHyperHoenn => "Cute Hyper Ribbon",
            Gen3Ribbon::CuteMasterHoenn => "Cute Master Ribbon",
            Gen3Ribbon::SmartHoenn => "Smart Ribbon",
            Gen3Ribbon::SmartSuperHoenn => "Smart Super Ribbon",
            Gen3Ribbon::SmartHyperHoenn => "Smart Hyper Ribbon",
            Gen3Ribbon::SmartMasterHoenn => "Smart Master Ribbon",
            Gen3Ribbon::ToughHoenn => "Tough Ribbon",
            Gen3Ribbon::ToughSuperHoenn => "Tough Super Ribbon",
            Gen3Ribbon::ToughHyperHoenn => "Tough Hyper Ribbon",
            Gen3Ribbon::ToughMasterHoenn => "Tough Master Ribbon",
            Gen3Ribbon::Champion => "Champion Ribbon",
            Gen3Ribbon::Winning => "Winning Ribbon",
            Gen3Ribbon::Victory => "Victory Ribbon",
            Gen3Ribbon::Artist => "Artist Ribbon",
            Gen3Ribbon::Effort => "Effort Ribbon",
            Gen3Ribbon::BattleChampion => "Battle Champion Ribbon",
            Gen3Ribbon::RegionalChampion => "Regional Champion Ribbon",
            Gen3Ribbon::NationalChampion => "National Champion Ribbon",
            Gen3Ribbon::Country => "Country Ribbon",
            Gen3Ribbon::National => "National Ribbon",
            Gen3Ribbon::Earth => "Earth Ribbon",
            Gen3Ribbon::World => "World Ribbon",
        }
    }

    pub fn from_name(name: &str) -> Option<Self> {
        match name {
            "Cool Ribbon" => Some(Gen3Ribbon::CoolHoenn),
            "Cool Super Ribbon" => Some(Gen3Ribbon::CoolSuperHoenn),
            "Cool Hyper Ribbon" => Some(Gen3Ribbon::CoolHyperHoenn),
            "Cool Master Ribbon" => Some(Gen3Ribbon::CoolMasterHoenn),
            "Beauty Ribbon" => Some(Gen3Ribbon::BeautyHoenn),
            "Beauty Super Ribbon" => Some(Gen3Ribbon::BeautySuperHoenn),
            "Beauty Hyper Ribbon" => Some(Gen3Ribbon::BeautyHyperHoenn),
            "Beauty Master Ribbon" => Some(Gen3Ribbon::BeautyMasterHoenn),
            "Cute Ribbon" => Some(Gen3Ribbon::CuteHoenn),
            "Cute Super Ribbon" => Some(Gen3Ribbon::CuteSuperHoenn),
            "Cute Hyper Ribbon" => Some(Gen3Ribbon::CuteHyperHoenn),
            "Cute Master Ribbon" => Some(Gen3Ribbon::CuteMasterHoenn),
            "Smart Ribbon" => Some(Gen3Ribbon::SmartHoenn),
            "Smart Super Ribbon" => Some(Gen3Ribbon::SmartSuperHoenn),
            "Smart Hyper Ribbon" => Some(Gen3Ribbon::SmartHyperHoenn),
            "Smart Master Ribbon" => Some(Gen3Ribbon::SmartMasterHoenn),
            "Tough Ribbon" => Some(Gen3Ribbon::ToughHoenn),
            "Tough Super Ribbon" => Some(Gen3Ribbon::ToughSuperHoenn),
            "Tough Hyper Ribbon" => Some(Gen3Ribbon::ToughHyperHoenn),
            "Tough Master Ribbon" => Some(Gen3Ribbon::ToughMasterHoenn),
            "Champion Ribbon" => Some(Gen3Ribbon::Champion),
            "Winning Ribbon" => Some(Gen3Ribbon::Winning),
            "Victory Ribbon" => Some(Gen3Ribbon::Victory),
            "Artist Ribbon" => Some(Gen3Ribbon::Artist),
            "Effort Ribbon" => Some(Gen3Ribbon::Effort),
            "Battle Champion Ribbon" => Some(Gen3Ribbon::BattleChampion),
            "Regional Champion Ribbon" => Some(Gen3Ribbon::RegionalChampion),
            "National Champion Ribbon" => Some(Gen3Ribbon::NationalChampion),
            "Country Ribbon" => Some(Gen3Ribbon::Country),
            "National Ribbon" => Some(Gen3Ribbon::National),
            "Earth Ribbon" => Some(Gen3Ribbon::Earth),
            "World Ribbon" => Some(Gen3Ribbon::World),
            _ => None,
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

impl Display for Gen3Ribbon {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.get_name())
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
