use pkm_rs_types::FlagSet;
use serde::{Deserialize, Deserializer, Serialize, Serializer, de::Error};
use std::fmt::Display;

use crate::ribbons::{ModernRibbon, ObsoleteRibbon, OpenHomeRibbon, OpenHomeRibbonSet};

#[cfg(feature = "wasm")]
use tsify::Tsify;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Default, Debug, Clone, Copy)]
pub struct DsGen3RibbonSet(FlagSet<4>);

impl DsGen3RibbonSet {
    pub const fn from_bytes(bytes: [u8; 4]) -> Self {
        Self(FlagSet::from_bytes(bytes))
    }

    pub fn get_ribbons(&self) -> Vec<DsGen3Ribbon> {
        self.0
            .get_flags()
            .into_iter()
            .map(DsGen3Ribbon::from_index)
            .collect()
    }

    pub const fn to_bytes(self) -> [u8; 4] {
        self.0.to_bytes()
    }

    pub const fn clear_ribbons(&mut self) {
        self.0.clear();
    }

    pub fn add_ribbon(&mut self, ribbon: DsGen3Ribbon) {
        self.0.set_flag(ribbon.get_index(), true);
    }

    pub fn add_ribbons(&mut self, ribbons: Vec<DsGen3Ribbon>) {
        ribbons
            .into_iter()
            .for_each(|ribbon| self.add_ribbon(ribbon));
    }

    pub fn set_ribbons(&mut self, ribbons: Vec<DsGen3Ribbon>) {
        self.clear_ribbons();
        self.add_ribbons(ribbons);
    }

    pub fn with_ribbons(mut self, ribbons: Vec<DsGen3Ribbon>) -> Self {
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

#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[derive(Debug, Serialize, PartialEq, Eq, Clone, Copy)]
#[repr(u8)]
pub enum DsGen3Ribbon {
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

impl DsGen3Ribbon {
    pub const fn get_index(self) -> usize {
        self as usize
    }

    pub fn from_index(index: usize) -> DsGen3Ribbon {
        if index > Self::World as usize {
            panic!("Attempting to get Self from index > 31")
        }

        unsafe { std::mem::transmute(index as u8) }
    }

    const fn get_name(&self) -> &'static str {
        match self {
            Self::CoolHoenn => "Cool (Hoenn)",
            Self::CoolSuperHoenn => "Cool Super (Hoenn)",
            Self::CoolHyperHoenn => "Cool Hyper (Hoenn)",
            Self::CoolMasterHoenn => "Cool Master (Hoenn)",
            Self::BeautyHoenn => "Beauty (Hoenn)",
            Self::BeautySuperHoenn => "Beauty Super (Hoenn)",
            Self::BeautyHyperHoenn => "Beauty Hyper (Hoenn)",
            Self::BeautyMasterHoenn => "Beauty Master (Hoenn)",
            Self::CuteHoenn => "Cute (Hoenn)",
            Self::CuteSuperHoenn => "Cute Super (Hoenn)",
            Self::CuteHyperHoenn => "Cute Hyper (Hoenn)",
            Self::CuteMasterHoenn => "Cute Master (Hoenn)",
            Self::SmartHoenn => "Smart (Hoenn)",
            Self::SmartSuperHoenn => "Smart Super (Hoenn)",
            Self::SmartHyperHoenn => "Smart Hyper (Hoenn)",
            Self::SmartMasterHoenn => "Smart Master (Hoenn)",
            Self::ToughHoenn => "Tough (Hoenn)",
            Self::ToughSuperHoenn => "Tough Super",
            Self::ToughHyperHoenn => "Tough Hyper (Hoenn)",
            Self::ToughMasterHoenn => "Tough Master (Hoenn)",
            Self::Champion => "Champion",
            Self::Winning => "Winning",
            Self::Victory => "Victory",
            Self::Artist => "Artist",
            Self::Effort => "Effort",
            Self::BattleChampion => "Battle Champion",
            Self::RegionalChampion => "Regional Champion",
            Self::NationalChampion => "National Champion",
            Self::Country => "Country",
            Self::National => "National",
            Self::Earth => "Earth",
            Self::World => "World",
        }
    }
    pub fn from_name(name: &str) -> Option<Self> {
        let name = name.strip_suffix(" Ribbon").unwrap_or(name);
        let name = name.strip_suffix(" (Hoenn)").unwrap_or(name);
        let name = name.strip_suffix(" Ribbon").unwrap_or(name);
        match name {
            "Cool" => Some(Self::CoolHoenn),
            "Cool Super" => Some(Self::CoolSuperHoenn),
            "Cool Hyper" => Some(Self::CoolHyperHoenn),
            "Cool Master" => Some(Self::CoolMasterHoenn),
            "Beauty" => Some(Self::BeautyHoenn),
            "Beauty Super" => Some(Self::BeautySuperHoenn),
            "Beauty Hyper" => Some(Self::BeautyHyperHoenn),
            "Beauty Master" => Some(Self::BeautyMasterHoenn),
            "Cute" => Some(Self::CuteHoenn),
            "Cute Super" => Some(Self::CuteSuperHoenn),
            "Cute Hyper" => Some(Self::CuteHyperHoenn),
            "Cute Master" => Some(Self::CuteMasterHoenn),
            "Smart" => Some(Self::SmartHoenn),
            "Smart Super" => Some(Self::SmartSuperHoenn),
            "Smart Hyper" => Some(Self::SmartHyperHoenn),
            "Smart Master" => Some(Self::SmartMasterHoenn),
            "Tough" => Some(Self::ToughHoenn),
            "Tough Super" => Some(Self::ToughSuperHoenn),
            "Tough Hyper" => Some(Self::ToughHyperHoenn),
            "Tough Master" => Some(Self::ToughMasterHoenn),
            "Champion" => Some(Self::Champion),
            "Winning" => Some(Self::Winning),
            "Victory" => Some(Self::Victory),
            "Artist" => Some(Self::Artist),
            "Effort" => Some(Self::Effort),
            "Battle Champion" => Some(Self::BattleChampion),
            "Regional Champion" => Some(Self::RegionalChampion),
            "National Champion" => Some(Self::NationalChampion),
            "Country" => Some(Self::Country),
            "National" => Some(Self::National),
            "Earth" => Some(Self::Earth),
            "World" => Some(Self::World),
            _ => None,
        }
    }

    const fn from_obsolete_if_present(obsolete: ObsoleteRibbon) -> Option<DsGen3Ribbon> {
        match obsolete {
            ObsoleteRibbon::CoolHoenn => Some(Self::CoolHoenn),
            ObsoleteRibbon::CoolSuperHoenn => Some(Self::CoolSuperHoenn),
            ObsoleteRibbon::CoolHyperHoenn => Some(Self::CoolHyperHoenn),
            ObsoleteRibbon::CoolMasterHoenn => Some(Self::CoolMasterHoenn),
            ObsoleteRibbon::BeautyHoenn => Some(Self::BeautyHoenn),
            ObsoleteRibbon::BeautySuperHoenn => Some(Self::BeautySuperHoenn),
            ObsoleteRibbon::BeautyHyperHoenn => Some(Self::BeautyHyperHoenn),
            ObsoleteRibbon::BeautyMasterHoenn => Some(Self::BeautyMasterHoenn),
            ObsoleteRibbon::CuteHoenn => Some(Self::CuteHoenn),
            ObsoleteRibbon::CuteSuperHoenn => Some(Self::CuteSuperHoenn),
            ObsoleteRibbon::CuteHyperHoenn => Some(Self::CuteHyperHoenn),
            ObsoleteRibbon::CuteMasterHoenn => Some(Self::CuteMasterHoenn),
            ObsoleteRibbon::SmartHoenn => Some(Self::SmartHoenn),
            ObsoleteRibbon::SmartSuperHoenn => Some(Self::SmartSuperHoenn),
            ObsoleteRibbon::SmartHyperHoenn => Some(Self::SmartHyperHoenn),
            ObsoleteRibbon::SmartMasterHoenn => Some(Self::SmartMasterHoenn),
            ObsoleteRibbon::ToughHoenn => Some(Self::ToughHoenn),
            ObsoleteRibbon::ToughSuperHoenn => Some(Self::ToughSuperHoenn),
            ObsoleteRibbon::ToughHyperHoenn => Some(Self::ToughHyperHoenn),
            ObsoleteRibbon::ToughMasterHoenn => Some(Self::ToughMasterHoenn),
            ObsoleteRibbon::Winning => Some(Self::Winning),
            ObsoleteRibbon::Victory => Some(Self::Victory),
            _ => None,
        }
    }

    const fn from_modern_if_present(modern: ModernRibbon) -> Option<DsGen3Ribbon> {
        match modern {
            ModernRibbon::Gen3Champion => Some(Self::Champion),
            ModernRibbon::Effort => Some(Self::Effort),
            ModernRibbon::Artist => Some(Self::Artist),
            ModernRibbon::Country => Some(Self::Country),
            ModernRibbon::National => Some(Self::National),
            ModernRibbon::Earth => Some(Self::Earth),
            ModernRibbon::World => Some(Self::World),
            ModernRibbon::BattleChampion => Some(Self::BattleChampion),
            ModernRibbon::RegionalChampion => Some(Self::RegionalChampion),
            ModernRibbon::NationalChampion => Some(Self::NationalChampion),
            _ => None,
        }
    }

    pub const fn to_openhome(self) -> OpenHomeRibbon {
        match self {
            Self::Champion => OpenHomeRibbon::Mod(ModernRibbon::Gen3Champion),
            Self::Effort => OpenHomeRibbon::Mod(ModernRibbon::Effort),
            Self::Artist => OpenHomeRibbon::Mod(ModernRibbon::Artist),
            Self::Country => OpenHomeRibbon::Mod(ModernRibbon::Country),
            Self::National => OpenHomeRibbon::Mod(ModernRibbon::National),
            Self::Earth => OpenHomeRibbon::Mod(ModernRibbon::Earth),
            Self::World => OpenHomeRibbon::Mod(ModernRibbon::World),
            Self::BattleChampion => OpenHomeRibbon::Mod(ModernRibbon::BattleChampion),
            Self::RegionalChampion => OpenHomeRibbon::Mod(ModernRibbon::RegionalChampion),
            Self::NationalChampion => OpenHomeRibbon::Mod(ModernRibbon::NationalChampion),
            Self::CoolHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CoolHoenn),
            Self::CoolSuperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CoolSuperHoenn),
            Self::CoolHyperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CoolHyperHoenn),
            Self::CoolMasterHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CoolMasterHoenn),
            Self::BeautyHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyHoenn),
            Self::BeautySuperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::BeautySuperHoenn),
            Self::BeautyHyperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyHyperHoenn),
            Self::BeautyMasterHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::BeautyMasterHoenn),
            Self::CuteHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CuteHoenn),
            Self::CuteSuperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CuteSuperHoenn),
            Self::CuteHyperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CuteHyperHoenn),
            Self::CuteMasterHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::CuteMasterHoenn),
            Self::SmartHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::SmartHoenn),
            Self::SmartSuperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::SmartSuperHoenn),
            Self::SmartHyperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::SmartHyperHoenn),
            Self::SmartMasterHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::SmartMasterHoenn),
            Self::ToughHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::ToughHoenn),
            Self::ToughSuperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::ToughSuperHoenn),
            Self::ToughHyperHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::ToughHyperHoenn),
            Self::ToughMasterHoenn => OpenHomeRibbon::Obs(ObsoleteRibbon::ToughMasterHoenn),
            Self::Winning => OpenHomeRibbon::Obs(ObsoleteRibbon::Winning),
            Self::Victory => OpenHomeRibbon::Obs(ObsoleteRibbon::Victory),
        }
    }
}

impl<'de> Deserialize<'de> for DsGen3Ribbon {
    fn deserialize<D>(deserializer: D) -> std::result::Result<DsGen3Ribbon, D::Error>
    where
        D: Deserializer<'de>,
    {
        let string_value = String::deserialize(deserializer)?;

        Self::from_name(&string_value).ok_or(D::Error::custom(format!(
            "invalid DsGen3Ribbon: {string_value}"
        )))
    }
}

impl Display for DsGen3Ribbon {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.get_name())
    }
}

impl FromIterator<DsGen3Ribbon> for DsGen3RibbonSet {
    fn from_iter<T: IntoIterator<Item = DsGen3Ribbon>>(iter: T) -> Self {
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

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
#[repr(u8)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
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
            Self::SinnohChampion => "Sinnoh Champion",
            Self::Ability => "Ability",
            Self::GreatAbility => "Great Ability",
            Self::DoubleAbility => "Double Ability",
            Self::MultiAbility => "Multi Ability",
            Self::PairAbility => "Pair Ability",
            Self::WorldAbility => "World Ability",
            Self::Alert => "Alert",
            Self::Shock => "Shock",
            Self::Downcast => "Downcast",
            Self::Careless => "Careless",
            Self::Relax => "Relax",
            Self::Snooze => "Snooze",
            Self::Smile => "Smile",
            Self::Gorgeous => "Gorgeous",
            Self::Royal => "Royal",
            Self::GorgeousRoyal => "Gorgeous Royal",
            Self::Footprint => "Footprint",
            Self::Record => "Record",
            Self::Event => "Event",
            Self::Legend => "Legend",
            Self::WorldChampion => "World Champion",
            Self::Birthday => "Birthday",
            Self::Special => "Special",
            Self::Souvenir => "Souvenir",
            Self::Wishing => "Wishing",
            Self::Classic => "Classic",
            Self::Premier => "Premier",
        }
    }

    pub fn from_name(name: &str) -> Option<Self> {
        match name {
            "Sinnoh Champion" => Some(Self::SinnohChampion),
            "Ability" => Some(Self::Ability),
            "Great Ability" => Some(Self::GreatAbility),
            "Double Ability" => Some(Self::DoubleAbility),
            "Multi Ability" => Some(Self::MultiAbility),
            "Pair Ability" => Some(Self::PairAbility),
            "World Ability" => Some(Self::WorldAbility),
            "Alert" => Some(Self::Alert),
            "Shock" => Some(Self::Shock),
            "Downcast" => Some(Self::Downcast),
            "Careless" => Some(Self::Careless),
            "Relax" => Some(Self::Relax),
            "Snooze" => Some(Self::Snooze),
            "Smile" => Some(Self::Smile),
            "Gorgeous" => Some(Self::Gorgeous),
            "Royal" => Some(Self::Royal),
            "Gorgeous Royal" => Some(Self::GorgeousRoyal),
            "Footprint" => Some(Self::Footprint),
            "Record" => Some(Self::Record),
            "Event" => Some(Self::Event),
            "Legend" => Some(Self::Legend),
            "World Champion" => Some(Self::WorldChampion),
            "Birthday" => Some(Self::Birthday),
            "Special" => Some(Self::Special),
            "Souvenir" => Some(Self::Souvenir),
            "Wishing" => Some(Self::Wishing),
            "Classic" => Some(Self::Classic),
            "Premier" => Some(Self::Premier),
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

impl Serialize for Gen4StandardRibbon {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.get_name().serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for Gen4StandardRibbon {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Gen4StandardRibbon, D::Error>
    where
        D: Deserializer<'de>,
    {
        let string_value = String::deserialize(deserializer)?;

        Self::from_name(&string_value).ok_or(D::Error::custom(format!(
            "invalid Gen4StandardRibbon: {string_value}"
        )))
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

impl FromIterator<Gen4ContestRibbon> for Gen4ContestRibbonSet {
    fn from_iter<T: IntoIterator<Item = Gen4ContestRibbon>>(iter: T) -> Self {
        Self::default().with_ribbons(iter.into_iter().collect())
    }
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(u8)]
pub enum Gen4ContestRibbon {
    #[serde(rename = "Cool (Sinnoh)")]
    CoolSinnoh,
    #[serde(rename = "Cool Great (Sinnoh)")]
    CoolGreatSinnoh,
    #[serde(rename = "Cool Ultra (Sinnoh)")]
    CoolUltraSinnoh,
    #[serde(rename = "Cool Master (Sinnoh)")]
    CoolMasterSinnoh,
    #[serde(rename = "Beauty (Sinnoh)")]
    BeautySinnoh,
    #[serde(rename = "Beauty Great (Sinnoh)")]
    BeautyGreatSinnoh,
    #[serde(rename = "Beauty Ultra (Sinnoh)")]
    BeautyUltraSinnoh,
    #[serde(rename = "Beauty Master (Sinnoh)")]
    BeautyMasterSinnoh,
    #[serde(rename = "Cute (Sinnoh)")]
    CuteSinnoh,
    #[serde(rename = "Cute Great (Sinnoh)")]
    CuteGreatSinnoh,
    #[serde(rename = "Cute Ultra (Sinnoh)")]
    CuteUltraSinnoh,
    #[serde(rename = "Cute Master (Sinnoh)")]
    CuteMasterSinnoh,
    #[serde(rename = "Smart (Sinnoh)")]
    SmartSinnoh,
    #[serde(rename = "Smart Great (Sinnoh)")]
    SmartGreatSinnoh,
    #[serde(rename = "Smart Ultra (Sinnoh)")]
    SmartUltraSinnoh,
    #[serde(rename = "Smart Master (Sinnoh)")]
    SmartMasterSinnoh,
    #[serde(rename = "Tough (Sinnoh)")]
    ToughSinnoh,
    #[serde(rename = "Tough Great (Sinnoh)")]
    ToughGreatSinnoh,
    #[serde(rename = "Tough Ultra (Sinnoh)")]
    ToughUltraSinnoh,
    #[serde(rename = "Tough Master (Sinnoh)")]
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
            Self::CoolSinnoh => "Cool (Sinnoh)",
            Self::CoolGreatSinnoh => "Cool Great (Sinnoh)",
            Self::CoolUltraSinnoh => "Cool Ultra (Sinnoh)",
            Self::CoolMasterSinnoh => "Cool Master (Sinnoh)",
            Self::BeautySinnoh => "Beauty (Sinnoh)",
            Self::BeautyGreatSinnoh => "Beauty Great (Sinnoh)",
            Self::BeautyUltraSinnoh => "Beauty Ultra (Sinnoh)",
            Self::BeautyMasterSinnoh => "Beauty Master (Sinnoh)",
            Self::CuteSinnoh => "Cute (Sinnoh)",
            Self::CuteGreatSinnoh => "Cute Great (Sinnoh)",
            Self::CuteUltraSinnoh => "Cute Ultra (Sinnoh)",
            Self::CuteMasterSinnoh => "Cute Master (Sinnoh)",
            Self::SmartSinnoh => "Smart (Sinnoh)",
            Self::SmartGreatSinnoh => "Smart Great (Sinnoh)",
            Self::SmartUltraSinnoh => "Smart Ultra (Sinnoh)",
            Self::SmartMasterSinnoh => "Smart Master (Sinnoh)",
            Self::ToughSinnoh => "Tough (Sinnoh)",
            Self::ToughGreatSinnoh => "Tough Great (Sinnoh)",
            Self::ToughUltraSinnoh => "Tough Ultra (Sinnoh)",
            Self::ToughMasterSinnoh => "Tough Master (Sinnoh)",
        }
    }

    fn from_name(v: &str) -> Option<Self> {
        match v {
            "Cool (Sinnoh)" => Some(Self::CoolSinnoh),
            "Cool Great (Sinnoh)" => Some(Self::CoolGreatSinnoh),
            "Cool Ultra (Sinnoh)" => Some(Self::CoolUltraSinnoh),
            "Cool Master (Sinnoh)" => Some(Self::CoolMasterSinnoh),
            "Beauty (Sinnoh)" => Some(Self::BeautySinnoh),
            "Beauty Great (Sinnoh)" => Some(Self::BeautyGreatSinnoh),
            "Beauty Ultra (Sinnoh)" => Some(Self::BeautyUltraSinnoh),
            "Beauty Master (Sinnoh)" => Some(Self::BeautyMasterSinnoh),
            "Cute (Sinnoh)" => Some(Self::CuteSinnoh),
            "Cute Great (Sinnoh)" => Some(Self::CuteGreatSinnoh),
            "Cute Ultra (Sinnoh)" => Some(Self::CuteUltraSinnoh),
            "Cute Master (Sinnoh)" => Some(Self::CuteMasterSinnoh),
            "Smart (Sinnoh)" => Some(Self::SmartSinnoh),
            "Smart Great (Sinnoh)" => Some(Self::SmartGreatSinnoh),
            "Smart Ultra (Sinnoh)" => Some(Self::SmartUltraSinnoh),
            "Smart Master (Sinnoh)" => Some(Self::SmartMasterSinnoh),
            "Tough (Sinnoh)" => Some(Self::ToughSinnoh),
            "Tough Great (Sinnoh)" => Some(Self::ToughGreatSinnoh),
            "Tough Ultra (Sinnoh)" => Some(Self::ToughUltraSinnoh),
            "Tough Master (Sinnoh)" => Some(Self::ToughMasterSinnoh),
            _ => None,
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

impl Serialize for Gen4ContestRibbon {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.get_name().serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for Gen4ContestRibbon {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Gen4ContestRibbon, D::Error>
    where
        D: Deserializer<'de>,
    {
        let string_value = String::deserialize(deserializer)?;

        Self::from_name(&string_value).ok_or(D::Error::custom(format!(
            "invalid Gen4ContestRibbon: {string_value}"
        )))
    }
}

#[derive(Debug, Clone, Copy, Serialize)]
pub enum DsRibbon {
    Gen3(DsGen3Ribbon),
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

impl<'de> Deserialize<'de> for DsRibbon {
    fn deserialize<D>(deserializer: D) -> std::result::Result<DsRibbon, D::Error>
    where
        D: Deserializer<'de>,
    {
        let string_value = String::deserialize(deserializer)?;

        if let Some(gen4_standard) = Gen4StandardRibbon::from_name(&string_value) {
            return Ok(Self::Gen4S(gen4_standard));
        } else if let Some(gen4_contest) = Gen4ContestRibbon::from_name(&string_value) {
            return Ok(Self::Gen4C(gen4_contest));
        } else if let Some(gen3_ribbon) = DsGen3Ribbon::from_name(&string_value) {
            return Ok(Self::Gen3(gen3_ribbon));
        }

        Err(D::Error::custom(format!(
            "invalid DsRibbon: {string_value}"
        )))
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
                    OpenHomeRibbon::Mod(ribbon) => DsGen3Ribbon::from_modern_if_present(ribbon),
                    OpenHomeRibbon::Obs(ribbon) => DsGen3Ribbon::from_obsolete_if_present(ribbon),
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

    pub fn with_ribbons(mut self, ribbons: Vec<DsRibbon>) -> Self {
        ribbons
            .into_iter()
            .for_each(|ribbon| self.add_ribbon(ribbon));
        self
    }

    pub fn set_gen3_ribbons(&mut self, ribbons: Vec<DsGen3Ribbon>) {
        self.gen3.set_ribbons(ribbons);
    }

    pub fn set_gen4_standard_ribbons(&mut self, ribbons: Vec<Gen4StandardRibbon>) {
        self.gen4_standard.set_ribbons(ribbons);
    }

    pub fn set_gen4_contest_ribbons(&mut self, ribbons: Vec<Gen4ContestRibbon>) {
        self.gen4_contest.set_ribbons(ribbons);
    }

    pub fn get_gen3(&self) -> Vec<DsGen3Ribbon> {
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

impl<'de> Deserialize<'de> for DsRibbonSet {
    fn deserialize<D>(deserializer: D) -> std::result::Result<DsRibbonSet, D::Error>
    where
        D: Deserializer<'de>,
    {
        let ribbons: Vec<DsRibbon> = Vec::deserialize(deserializer)?;
        Ok(Self::default().with_ribbons(ribbons))
    }
}
