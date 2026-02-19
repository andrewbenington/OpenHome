use pkm_rs_types::FlagSet;
use serde::{Serialize, Serializer};
use std::fmt::Display;

use crate::ribbons::{ModernRibbon, ObsoleteRibbon, OpenHomeRibbon, OpenHomeRibbonSet};

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Default, Debug, Clone, Copy)]
pub struct Gen3RibbonSet(FlagSet<4>);

impl Gen3RibbonSet {
    pub const fn from_bytes(bytes: [u8; 4]) -> Self {
        Self(FlagSet::from_bytes(bytes))
    }

    pub fn get_ribbons(&self) -> Vec<Gen3Ribbon> {
        self.0
            .get_indices()
            .into_iter()
            .map(Gen3Ribbon::from_index)
            .collect()
    }

    pub const fn to_bytes(self) -> [u8; 4] {
        self.0.to_bytes()
    }

    pub const fn clear_ribbons(&mut self) {
        self.0.clear_all();
    }

    pub fn add_ribbon(&mut self, ribbon: Gen3Ribbon) {
        self.0.set_index(ribbon.get_index(), true);
    }

    pub fn add_ribbons(&mut self, ribbons: Vec<Gen3Ribbon>) {
        ribbons
            .into_iter()
            .for_each(|ribbon| self.add_ribbon(ribbon));
    }

    pub fn set_ribbons(&mut self, ribbons: Vec<Gen3Ribbon>) {
        self.clear_ribbons();
        self.add_ribbons(ribbons);
    }

    pub fn with_ribbons(mut self, ribbons: Vec<Gen3Ribbon>) -> Self {
        self.add_ribbons(ribbons);
        self
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
    pub const fn get_index(self) -> u8 {
        self as u8
    }

    pub fn from_index(index: usize) -> Gen3Ribbon {
        if index > Gen3Ribbon::World as usize {
            panic!("Attempting to get Gen3Ribbon from index > 31")
        }

        unsafe { std::mem::transmute(index as u8) }
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

    const fn from_obsolete_if_present(obsolete: ObsoleteRibbon) -> Option<Gen3Ribbon> {
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

    const fn from_modern_if_present(modern: ModernRibbon) -> Option<Gen3Ribbon> {
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

impl FromIterator<Gen3Ribbon> for Gen3RibbonSet {
    fn from_iter<T: IntoIterator<Item = Gen3Ribbon>>(iter: T) -> Self {
        Self::default().with_ribbons(iter.into_iter().collect())
    }
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Default, Debug, Clone, Copy)]
pub struct Gen4StandardRibbonSet(FlagSet<4>);

impl Gen4StandardRibbonSet {
    pub const fn from_bytes(bytes: [u8; 4]) -> Self {
        Self(FlagSet::from_bytes(bytes))
    }

    pub fn get_ribbons(&self) -> Vec<Gen4StandardRibbon> {
        self.0
            .get_indices()
            .into_iter()
            .map(Gen4StandardRibbon::from_index)
            .collect()
    }

    pub const fn to_bytes(self) -> [u8; 4] {
        self.0.to_bytes()
    }

    pub const fn clear_ribbons(&mut self) {
        self.0.clear_all();
    }

    pub fn add_ribbon(&mut self, ribbon: Gen4StandardRibbon) {
        self.0.add_index(ribbon.get_index());
    }

    pub fn add_ribbons(&mut self, ribbons: Vec<Gen4StandardRibbon>) {
        ribbons
            .into_iter()
            .for_each(|ribbon| self.add_ribbon(ribbon));
    }

    pub fn set_ribbons(&mut self, ribbons: Vec<Gen4StandardRibbon>) {
        self.clear_ribbons();
        self.add_ribbons(ribbons);
    }

    pub fn with_ribbons(mut self, ribbons: Vec<Gen4StandardRibbon>) -> Self {
        self.add_ribbons(ribbons);
        self
    }
}

impl Serialize for Gen4StandardRibbonSet {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.get_ribbons().serialize(serializer)
    }
}

impl FromIterator<Gen4StandardRibbon> for Gen4StandardRibbonSet {
    fn from_iter<T: IntoIterator<Item = Gen4StandardRibbon>>(iter: T) -> Self {
        Self::default().with_ribbons(iter.into_iter().collect())
    }
}

#[derive(Debug, Serialize, PartialEq, Eq, Clone, Copy)]
#[repr(u8)]
pub enum Gen4StandardRibbon {
    SinnohChampion,
    Ability,
    GreatAbility,
    DoubleAbility,
    MultiAbility,
    PairAbility,
    WorldAbility,
    Alert,
    Shock,
    Downcast,
    Careless,
    Relax,
    Snooze,
    Smile,
    Gorgeous,
    Royal,
    GorgeousRoyal,
    Footprint,
    Record,
    Event,
    Legend,
    WorldChampion,
    Birthday,
    Special,
    Souvenir,
    Wishing,
    Classic,
    Premier,
}

impl Gen4StandardRibbon {
    pub const fn get_index(self) -> u8 {
        self as u8
    }

    pub fn from_index(index: usize) -> Gen4StandardRibbon {
        if index > Gen4StandardRibbon::Premier as usize {
            panic!("Attempting to get Gen4Ribbon from index > 27")
        }

        unsafe { std::mem::transmute(index as u8) }
    }

    const fn get_name(&self) -> &'static str {
        match self {
            Self::SinnohChampion => "Sinnoh Champion Ribbon",
            Self::Ability => "Ability Ribbon",
            Self::GreatAbility => "Great Ability Ribbon",
            Self::DoubleAbility => "Double Ability Ribbon",
            Self::MultiAbility => "Multi Ability Ribbon",
            Self::PairAbility => "Pair Ability Ribbon",
            Self::WorldAbility => "World Ability Ribbon",
            Self::Alert => "Alert Ribbon",
            Self::Shock => "Shock Ribbon",
            Self::Downcast => "Downcast Ribbon",
            Self::Careless => "Careless Ribbon",
            Self::Relax => "Relax Ribbon",
            Self::Snooze => "Snooze Ribbon",
            Self::Smile => "Smile Ribbon",
            Self::Gorgeous => "Gorgeous Ribbon",
            Self::Royal => "Royal Ribbon",
            Self::GorgeousRoyal => "Gorgeous Royal Ribbon",
            Self::Footprint => "Footprint Ribbon",
            Self::Record => "Record Ribbon",
            Self::Event => "Event Ribbon",
            Self::Legend => "Legend Ribbon",
            Self::WorldChampion => "World Champion Ribbon",
            Self::Birthday => "Birthday Ribbon",
            Self::Special => "Special Ribbon",
            Self::Souvenir => "Souvenir Ribbon",
            Self::Wishing => "Wishing Ribbon",
            Self::Classic => "Classic Ribbon",
            Self::Premier => "Premier Ribbon",
        }
    }

    pub fn from_name(name: &str) -> Option<Self> {
        match name {
            "Sinnoh Champion Ribbon" => Some(Self::SinnohChampion),
            "Ability Ribbon" => Some(Self::Ability),
            "Great Ability Ribbon" => Some(Self::GreatAbility),
            "Double Ability Ribbon" => Some(Self::DoubleAbility),
            "Multi Ability Ribbon" => Some(Self::MultiAbility),
            "Pair Ability Ribbon" => Some(Self::PairAbility),
            "World Ability Ribbon" => Some(Self::WorldAbility),
            "Alert Ribbon" => Some(Self::Alert),
            "Shock Ribbon" => Some(Self::Shock),
            "Downcast Ribbon" => Some(Self::Downcast),
            "Careless Ribbon" => Some(Self::Careless),
            "Relax Ribbon" => Some(Self::Relax),
            "Snooze Ribbon" => Some(Self::Snooze),
            "Smile Ribbon" => Some(Self::Smile),
            "Gorgeous Ribbon" => Some(Self::Gorgeous),
            "Royal Ribbon" => Some(Self::Royal),
            "Gorgeous Royal Ribbon" => Some(Self::GorgeousRoyal),
            "Footprint Ribbon" => Some(Self::Footprint),
            "Record Ribbon" => Some(Self::Record),
            "Event Ribbon" => Some(Self::Event),
            "Legend Ribbon" => Some(Self::Legend),
            "World Champion Ribbon" => Some(Self::WorldChampion),
            "Birthday Ribbon" => Some(Self::Birthday),
            "Special Ribbon" => Some(Self::Special),
            "Souvenir Ribbon" => Some(Self::Souvenir),
            "Wishing Ribbon" => Some(Self::Wishing),
            "Classic Ribbon" => Some(Self::Classic),
            "Premier Ribbon" => Some(Self::Premier),
            _ => None,
        }
    }

    const fn from_obsolete_if_present(obsolete: ObsoleteRibbon) -> Option<Gen4StandardRibbon> {
        match obsolete {
            ObsoleteRibbon::Ability => Some(Self::Ability),
            ObsoleteRibbon::GreatAbility => Some(Self::GreatAbility),
            ObsoleteRibbon::DoubleAbility => Some(Self::DoubleAbility),
            ObsoleteRibbon::MultiAbility => Some(Self::MultiAbility),
            ObsoleteRibbon::PairAbility => Some(Self::PairAbility),
            ObsoleteRibbon::WorldAbility => Some(Self::WorldAbility),
            _ => None,
        }
    }

    const fn from_modern_if_present(modern: ModernRibbon) -> Option<Gen4StandardRibbon> {
        match modern {
            ModernRibbon::SinnohChampion => Some(Self::SinnohChampion),
            ModernRibbon::Alert => Some(Self::Alert),
            ModernRibbon::Shock => Some(Self::Shock),
            ModernRibbon::Downcast => Some(Self::Downcast),
            ModernRibbon::Careless => Some(Self::Careless),
            ModernRibbon::Relax => Some(Self::Relax),
            ModernRibbon::Snooze => Some(Self::Snooze),
            ModernRibbon::Smile => Some(Self::Smile),
            ModernRibbon::Gorgeous => Some(Self::Gorgeous),
            ModernRibbon::Royal => Some(Self::Royal),
            ModernRibbon::GorgeousRoyal => Some(Self::GorgeousRoyal),
            ModernRibbon::Footprint => Some(Self::Footprint),
            ModernRibbon::Record => Some(Self::Record),
            ModernRibbon::Event => Some(Self::Event),
            ModernRibbon::Legend => Some(Self::Legend),
            ModernRibbon::WorldChampion => Some(Self::WorldChampion),
            ModernRibbon::Birthday => Some(Self::Birthday),
            ModernRibbon::Special => Some(Self::Special),
            ModernRibbon::Souvenir => Some(Self::Souvenir),
            ModernRibbon::Wishing => Some(Self::Wishing),
            ModernRibbon::Classic => Some(Self::Classic),
            ModernRibbon::Premier => Some(Self::Premier),
            _ => None,
        }
    }

    const fn to_openhome(self) -> OpenHomeRibbon {
        match self {
            Self::SinnohChampion => OpenHomeRibbon::Mod(ModernRibbon::SinnohChampion),
            Self::Alert => OpenHomeRibbon::Mod(ModernRibbon::Alert),
            Self::Shock => OpenHomeRibbon::Mod(ModernRibbon::Shock),
            Self::Downcast => OpenHomeRibbon::Mod(ModernRibbon::Downcast),
            Self::Careless => OpenHomeRibbon::Mod(ModernRibbon::Careless),
            Self::Relax => OpenHomeRibbon::Mod(ModernRibbon::Relax),
            Self::Snooze => OpenHomeRibbon::Mod(ModernRibbon::Snooze),
            Self::Smile => OpenHomeRibbon::Mod(ModernRibbon::Smile),
            Self::Gorgeous => OpenHomeRibbon::Mod(ModernRibbon::Gorgeous),
            Self::Royal => OpenHomeRibbon::Mod(ModernRibbon::Royal),
            Self::GorgeousRoyal => OpenHomeRibbon::Mod(ModernRibbon::GorgeousRoyal),
            Self::Footprint => OpenHomeRibbon::Mod(ModernRibbon::Footprint),
            Self::Record => OpenHomeRibbon::Mod(ModernRibbon::Record),
            Self::Event => OpenHomeRibbon::Mod(ModernRibbon::Event),
            Self::Legend => OpenHomeRibbon::Mod(ModernRibbon::Legend),
            Self::WorldChampion => OpenHomeRibbon::Mod(ModernRibbon::WorldChampion),
            Self::Birthday => OpenHomeRibbon::Mod(ModernRibbon::Birthday),
            Self::Special => OpenHomeRibbon::Mod(ModernRibbon::Special),
            Self::Souvenir => OpenHomeRibbon::Mod(ModernRibbon::Souvenir),
            Self::Wishing => OpenHomeRibbon::Mod(ModernRibbon::Wishing),
            Self::Classic => OpenHomeRibbon::Mod(ModernRibbon::Classic),
            Self::Premier => OpenHomeRibbon::Mod(ModernRibbon::Premier),
            Self::Ability => OpenHomeRibbon::Obs(ObsoleteRibbon::Ability),
            Self::GreatAbility => OpenHomeRibbon::Obs(ObsoleteRibbon::GreatAbility),
            Self::DoubleAbility => OpenHomeRibbon::Obs(ObsoleteRibbon::DoubleAbility),
            Self::MultiAbility => OpenHomeRibbon::Obs(ObsoleteRibbon::MultiAbility),
            Self::PairAbility => OpenHomeRibbon::Obs(ObsoleteRibbon::PairAbility),
            Self::WorldAbility => OpenHomeRibbon::Obs(ObsoleteRibbon::WorldAbility),
        }
    }
}

impl Display for Gen4StandardRibbon {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.get_name())
    }
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Default, Debug, Clone, Copy)]
pub struct Gen4ContestRibbonSet(FlagSet<4>);

impl Gen4ContestRibbonSet {
    pub const fn from_bytes(bytes: [u8; 4]) -> Self {
        Self(FlagSet::from_bytes(bytes))
    }

    pub fn get_ribbons(&self) -> Vec<Gen4ContestRibbon> {
        self.0
            .get_indices()
            .into_iter()
            .map(Gen4ContestRibbon::from_index)
            .collect()
    }

    pub const fn to_bytes(self) -> [u8; 4] {
        self.0.to_bytes()
    }

    pub const fn clear_ribbons(&mut self) {
        self.0.clear_all();
    }

    pub fn add_ribbon(&mut self, ribbon: Gen4ContestRibbon) {
        self.0.set_index(ribbon.get_index(), true);
    }

    pub fn add_ribbons(&mut self, ribbons: Vec<Gen4ContestRibbon>) {
        ribbons
            .into_iter()
            .for_each(|ribbon| self.add_ribbon(ribbon));
    }

    pub fn set_ribbons(&mut self, ribbons: Vec<Gen4ContestRibbon>) {
        self.clear_ribbons();
        ribbons
            .into_iter()
            .for_each(|ribbon| self.add_ribbon(ribbon));
    }

    pub fn with_ribbons(mut self, ribbons: Vec<Gen4ContestRibbon>) -> Self {
        self.add_ribbons(ribbons);
        self
    }
}

impl Serialize for Gen4ContestRibbonSet {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.get_ribbons().serialize(serializer)
    }
}

impl FromIterator<Gen4ContestRibbon> for Gen4ContestRibbonSet {
    fn from_iter<T: IntoIterator<Item = Gen4ContestRibbon>>(iter: T) -> Self {
        Self::default().with_ribbons(iter.into_iter().collect())
    }
}

#[derive(Debug, Serialize, PartialEq, Eq, Clone, Copy)]
#[repr(u8)]
pub enum Gen4ContestRibbon {
    CoolSinnoh,
    CoolGreatSinnoh,
    CoolUltraSinnoh,
    CoolMasterSinnoh,
    BeautySinnoh,
    BeautyGreatSinnoh,
    BeautyUltraSinnoh,
    BeautyMasterSinnoh,
    CuteSinnoh,
    CuteGreatSinnoh,
    CuteUltraSinnoh,
    CuteMasterSinnoh,
    SmartSinnoh,
    SmartGreatSinnoh,
    SmartUltraSinnoh,
    SmartMasterSinnoh,
    ToughSinnoh,
    ToughGreatSinnoh,
    ToughUltraSinnoh,
    ToughMasterSinnoh,
}

impl Gen4ContestRibbon {
    pub const fn get_index(self) -> u8 {
        self as u8
    }

    pub fn from_index(index: usize) -> Gen4ContestRibbon {
        if index > Gen4ContestRibbon::ToughMasterSinnoh as usize {
            panic!("Attempting to get Gen4Ribbon from index > 19")
        }

        unsafe { std::mem::transmute(index as u8) }
    }

    const fn get_name(&self) -> &'static str {
        match self {
            Self::CoolSinnoh => "Cool (Sinnoh) Ribbon",
            Self::CoolGreatSinnoh => "Cool Great (Sinnoh) Ribbon",
            Self::CoolUltraSinnoh => "Cool Ultra (Sinnoh) Ribbon",
            Self::CoolMasterSinnoh => "Cool Master (Sinnoh) Ribbon",
            Self::BeautySinnoh => "Beauty (Sinnoh) Ribbon",
            Self::BeautyGreatSinnoh => "Beauty Great (Sinnoh) Ribbon",
            Self::BeautyUltraSinnoh => "Beauty Ultra (Sinnoh) Ribbon",
            Self::BeautyMasterSinnoh => "Beauty Master (Sinnoh) Ribbon",
            Self::CuteSinnoh => "Cute (Sinnoh) Ribbon",
            Self::CuteGreatSinnoh => "Cute Great (Sinnoh) Ribbon",
            Self::CuteUltraSinnoh => "Cute Ultra (Sinnoh) Ribbon",
            Self::CuteMasterSinnoh => "Cute Master (Sinnoh) Ribbon",
            Self::SmartSinnoh => "Smart (Sinnoh) Ribbon",
            Self::SmartGreatSinnoh => "Smart Great (Sinnoh) Ribbon",
            Self::SmartUltraSinnoh => "Smart Ultra (Sinnoh) Ribbon",
            Self::SmartMasterSinnoh => "Smart Master (Sinnoh) Ribbon",
            Self::ToughSinnoh => "Tough (Sinnoh) Ribbon",
            Self::ToughGreatSinnoh => "Tough Great (Sinnoh) Ribbon",
            Self::ToughUltraSinnoh => "Tough Ultra (Sinnoh) Ribbon",
            Self::ToughMasterSinnoh => "Tough Master (Sinnoh) Ribbon",
        }
    }

    const fn from_obsolete_if_present(obsolete: ObsoleteRibbon) -> Option<Gen4ContestRibbon> {
        match obsolete {
            ObsoleteRibbon::CoolSinnoh => Some(Self::CoolSinnoh),
            ObsoleteRibbon::CoolGreatSinnoh => Some(Self::CoolGreatSinnoh),
            ObsoleteRibbon::CoolUltraSinnoh => Some(Self::CoolUltraSinnoh),
            ObsoleteRibbon::CoolMasterSinnoh => Some(Self::CoolMasterSinnoh),
            ObsoleteRibbon::BeautySinnoh => Some(Self::BeautySinnoh),
            ObsoleteRibbon::BeautyGreatSinnoh => Some(Self::BeautyGreatSinnoh),
            ObsoleteRibbon::BeautyUltraSinnoh => Some(Self::BeautyUltraSinnoh),
            ObsoleteRibbon::BeautyMasterSinnoh => Some(Self::BeautyMasterSinnoh),
            ObsoleteRibbon::CuteSinnoh => Some(Self::CuteSinnoh),
            ObsoleteRibbon::CuteGreatSinnoh => Some(Self::CuteGreatSinnoh),
            ObsoleteRibbon::CuteUltraSinnoh => Some(Self::CuteUltraSinnoh),
            ObsoleteRibbon::CuteMasterSinnoh => Some(Self::CuteMasterSinnoh),
            ObsoleteRibbon::SmartSinnoh => Some(Self::SmartSinnoh),
            ObsoleteRibbon::SmartGreatSinnoh => Some(Self::SmartGreatSinnoh),
            ObsoleteRibbon::SmartUltraSinnoh => Some(Self::SmartUltraSinnoh),
            ObsoleteRibbon::SmartMasterSinnoh => Some(Self::SmartMasterSinnoh),
            ObsoleteRibbon::ToughSinnoh => Some(Self::ToughSinnoh),
            ObsoleteRibbon::ToughGreatSinnoh => Some(Self::ToughGreatSinnoh),
            ObsoleteRibbon::ToughUltraSinnoh => Some(Self::ToughUltraSinnoh),
            ObsoleteRibbon::ToughMasterSinnoh => Some(Self::ToughMasterSinnoh),
            _ => None,
        }
    }

    const fn to_openhome(self) -> OpenHomeRibbon {
        match self {
            Self::CoolSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::CoolSinnoh),
            Self::CoolGreatSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::CoolGreatSinnoh),
            Self::CoolUltraSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::CoolUltraSinnoh),
            Self::CoolMasterSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::CoolMasterSinnoh),
            Self::BeautySinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::BeautySinnoh),
            Self::BeautyGreatSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyGreatSinnoh),
            Self::BeautyUltraSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyUltraSinnoh),
            Self::BeautyMasterSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyMasterSinnoh),
            Self::CuteSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::CuteSinnoh),
            Self::CuteGreatSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::CuteGreatSinnoh),
            Self::CuteUltraSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::CuteUltraSinnoh),
            Self::CuteMasterSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::CuteMasterSinnoh),
            Self::SmartSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::SmartSinnoh),
            Self::SmartGreatSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::SmartGreatSinnoh),
            Self::SmartUltraSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::SmartUltraSinnoh),
            Self::SmartMasterSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::SmartMasterSinnoh),
            Self::ToughSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::ToughSinnoh),
            Self::ToughGreatSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::ToughGreatSinnoh),
            Self::ToughUltraSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::ToughUltraSinnoh),
            Self::ToughMasterSinnoh => OpenHomeRibbon::Obs(ObsoleteRibbon::ToughMasterSinnoh),
        }
    }
}

impl Display for Gen4ContestRibbon {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.get_name())
    }
}

#[derive(Debug, Clone, Copy, Serialize)]
pub enum DsRibbon {
    Gen3(Gen3Ribbon),
    Gen4S(Gen4StandardRibbon),
    Gen4C(Gen4ContestRibbon),
}

impl Display for DsRibbon {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&match self {
            DsRibbon::Gen3(ribbon) => ribbon.to_string(),
            DsRibbon::Gen4S(ribbon) => ribbon.to_string(),
            DsRibbon::Gen4C(ribbon) => ribbon.to_string(),
        })
    }
}

impl DsRibbon {
    const fn to_openhome(self) -> OpenHomeRibbon {
        match self {
            DsRibbon::Gen3(ribbon) => ribbon.to_openhome(),
            DsRibbon::Gen4S(ribbon) => ribbon.to_openhome(),
            DsRibbon::Gen4C(ribbon) => ribbon.to_openhome(),
        }
    }
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Default, Debug, Clone, Copy)]
pub struct DsRibbonSet {
    gen3: Gen3RibbonSet,
    gen4_standard: Gen4StandardRibbonSet,
    gen4_contest: Gen4ContestRibbonSet,
}

impl DsRibbonSet {
    pub const fn from_bytes(
        gen3_bytes: [u8; 4],
        gen4_standard_bytes: [u8; 4],
        gen4_contest_bytes: [u8; 4],
    ) -> Self {
        Self {
            gen3: Gen3RibbonSet::from_bytes(gen3_bytes),
            gen4_standard: Gen4StandardRibbonSet::from_bytes(gen4_standard_bytes),
            gen4_contest: Gen4ContestRibbonSet::from_bytes(gen4_contest_bytes),
        }
    }

    pub fn from_openhome<const M: usize>(openhome_set: OpenHomeRibbonSet<M>) -> Self {
        Self {
            gen3: openhome_set
                .into_iter()
                .filter_map(|ribbon| match ribbon {
                    OpenHomeRibbon::Mod(ribbon) => Gen3Ribbon::from_modern_if_present(ribbon),
                    OpenHomeRibbon::Obs(ribbon) => Gen3Ribbon::from_obsolete_if_present(ribbon),
                })
                .collect(),
            gen4_standard: openhome_set
                .into_iter()
                .filter_map(|ribbon| match ribbon {
                    OpenHomeRibbon::Mod(ribbon) => {
                        Gen4StandardRibbon::from_modern_if_present(ribbon)
                    }
                    OpenHomeRibbon::Obs(ribbon) => {
                        Gen4StandardRibbon::from_obsolete_if_present(ribbon)
                    }
                })
                .collect(),
            gen4_contest: openhome_set
                .into_iter()
                .filter_map(|ribbon| match ribbon {
                    OpenHomeRibbon::Mod(_) => None,
                    OpenHomeRibbon::Obs(ribbon) => {
                        Gen4ContestRibbon::from_obsolete_if_present(ribbon)
                    }
                })
                .collect(),
        }
    }

    pub fn to_openhome<const M: usize>(self) -> OpenHomeRibbonSet<M> {
        self.get_ribbons()
            .into_iter()
            .map(DsRibbon::to_openhome)
            .collect()
    }

    pub fn get_ribbons(&self) -> Vec<DsRibbon> {
        self.get_gen3()
            .into_iter()
            .map(DsRibbon::Gen3)
            .chain(self.get_gen4_standard().into_iter().map(DsRibbon::Gen4S))
            .chain(self.get_gen4_contest().into_iter().map(DsRibbon::Gen4C))
            .collect()
    }

    pub fn to_bytes(self) -> Vec<u8> {
        let mut bytes: Vec<u8> = vec![0; 8];
        bytes[0..4].copy_from_slice(&self.gen3.to_bytes());
        bytes[4..8].copy_from_slice(&self.gen3.to_bytes());

        bytes
    }

    pub const fn clear_ribbons(&mut self) {
        self.gen3.clear_ribbons();
        self.gen4_standard.clear_ribbons();
        self.gen4_contest.clear_ribbons();
    }

    pub fn add_ribbon(&mut self, ribbon: DsRibbon) {
        match ribbon {
            DsRibbon::Gen3(ribbon) => self.gen3.add_ribbon(ribbon),
            DsRibbon::Gen4S(ribbon) => self.gen4_standard.add_ribbon(ribbon),
            DsRibbon::Gen4C(ribbon) => self.gen4_contest.add_ribbon(ribbon),
        }
    }

    pub fn set_gen3_ribbons(&mut self, ribbons: Vec<Gen3Ribbon>) {
        self.gen3.set_ribbons(ribbons);
    }

    pub fn set_gen4_standard_ribbons(&mut self, ribbons: Vec<Gen4StandardRibbon>) {
        self.gen4_standard.set_ribbons(ribbons);
    }

    pub fn set_gen4_contest_ribbons(&mut self, ribbons: Vec<Gen4ContestRibbon>) {
        self.gen4_contest.set_ribbons(ribbons);
    }

    pub fn get_gen3(&self) -> Vec<Gen3Ribbon> {
        self.gen3.get_ribbons()
    }

    pub fn get_gen4_standard(&self) -> Vec<Gen4StandardRibbon> {
        self.gen4_standard.get_ribbons()
    }

    pub fn get_gen4_contest(&self) -> Vec<Gen4ContestRibbon> {
        self.gen4_contest.get_ribbons()
    }
}

impl Serialize for DsRibbonSet {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.get_ribbons().serialize(serializer)
    }
}
