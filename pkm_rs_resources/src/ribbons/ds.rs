use pkm_rs_types::FlagSet;
use serde::{Serialize, Serializer};
use std::fmt::Display;

use crate::ribbons::{
    ModernRibbon, ObsoleteRibbon, OpenHomeRibbon, OpenHomeRibbonSet, gen3::Gen3Ribbon,
};

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Default, Debug, Clone, Copy)]
pub struct DsGen3RibbonSet(FlagSet<4>);

impl DsGen3RibbonSet {
    pub const fn from_bytes(bytes: [u8; 4]) -> Self {
        Self(FlagSet::from_bytes(bytes))
    }

    pub fn get_ribbons(&self) -> Vec<Gen3Ribbon> {
        self.0
            .get_flags()
            .into_iter()
            .map(Gen3Ribbon::from_index)
            .collect()
    }

    pub const fn to_bytes(self) -> [u8; 4] {
        self.0.to_bytes()
    }

    pub const fn clear_ribbons(&mut self) {
        self.0.clear();
    }

    pub fn add_ribbon(&mut self, ribbon: Gen3Ribbon) {
        self.0.set_flag(ribbon.get_index(), true);
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

impl Serialize for DsGen3RibbonSet {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.get_ribbons().serialize(serializer)
    }
}

impl FromIterator<Gen3Ribbon> for DsGen3RibbonSet {
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
            .get_flags()
            .into_iter()
            .map(Gen4StandardRibbon::from_index)
            .collect()
    }

    pub const fn to_bytes(self) -> [u8; 4] {
        self.0.to_bytes()
    }

    pub const fn clear_ribbons(&mut self) {
        self.0.clear();
    }

    pub fn add_ribbon(&mut self, ribbon: Gen4StandardRibbon) {
        self.0.add_flag(ribbon.get_index());
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
    pub const fn get_index(self) -> usize {
        self as usize
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
            .get_flags()
            .into_iter()
            .map(Gen4ContestRibbon::from_index)
            .collect()
    }

    pub const fn to_bytes(self) -> [u8; 4] {
        self.0.to_bytes()
    }

    pub const fn clear_ribbons(&mut self) {
        self.0.clear();
    }

    pub fn add_ribbon(&mut self, ribbon: Gen4ContestRibbon) {
        self.0.set_flag(ribbon.get_index(), true);
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
    pub const fn get_index(self) -> usize {
        self as usize
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
    gen3: DsGen3RibbonSet,
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
            gen3: DsGen3RibbonSet::from_bytes(gen3_bytes),
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
