#[cfg(feature = "wasm")]
use js_sys::Set;
use pkm_rs_types::FlagSet;
use serde::{Serialize, Serializer};
use std::fmt::Display;

#[cfg(feature = "wasm")]
use wasm_bindgen::convert::*;
#[cfg(feature = "wasm")]
use wasm_bindgen::describe::*;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Default, Debug, Clone, Copy)]
pub struct ModernRibbonSet<const N: usize>(FlagSet<N>);

impl<const N: usize> ModernRibbonSet<N> {
    pub const fn from_bytes(bytes: [u8; N]) -> Self {
        Self(FlagSet::from_bytes(bytes))
    }

    pub fn get_ribbons(&self) -> Vec<ModernRibbon> {
        self.0
            .get_indices()
            .into_iter()
            .filter_map(ModernRibbon::from_index)
            .collect()
    }

    pub const fn to_bytes(self) -> [u8; N] {
        self.0.to_bytes()
    }

    pub const fn clear_ribbons(&mut self) {
        self.0.clear_all();
    }

    pub fn add_ribbon(&mut self, ribbon: ModernRibbon) {
        self.0.set_index(ribbon.get_index() as u8, true);
    }

    pub fn add_ribbons(&mut self, ribbons: Vec<ModernRibbon>) {
        ribbons
            .into_iter()
            .for_each(|ribbon| self.add_ribbon(ribbon));
    }

    pub fn set_ribbons(&mut self, ribbons: Vec<ModernRibbon>) {
        self.clear_ribbons();
        ribbons
            .into_iter()
            .for_each(|ribbon| self.add_ribbon(ribbon));
    }

    pub fn from_ribbons(ribbons: Vec<ModernRibbon>) -> Self {
        let mut ribbon_set = Self(FlagSet::from_bytes([0u8; N]));
        ribbons
            .into_iter()
            .for_each(|ribbon| ribbon_set.add_ribbon(ribbon));

        ribbon_set
    }

    pub fn with_ribbons(mut self, ribbons: Vec<ModernRibbon>) -> Self {
        self.add_ribbons(ribbons);
        self
    }

    pub fn truncate_to<const M: usize>(self) -> ModernRibbonSet<M> {
        let mut truncated_bytes = [0u8; M];

        let min_size = N.min(M);

        truncated_bytes.copy_from_slice(&self.to_bytes()[0..min_size]);

        ModernRibbonSet::<M>::from_bytes(truncated_bytes)
    }
}

impl<const N: usize> Serialize for ModernRibbonSet<N> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.get_ribbons().serialize(serializer)
    }
}

impl<const N: usize> WasmDescribe for ModernRibbonSet<N> {
    fn describe() {
        js_sys::Set::describe()
    }
}

#[cfg(feature = "wasm")]
impl<const N: usize> IntoWasmAbi for ModernRibbonSet<N> {
    type Abi = <Set as IntoWasmAbi>::Abi;

    fn into_abi(self) -> Self::Abi {
        let set = Set::new(&JsValue::UNDEFINED);
        for ribbon in self.get_ribbons() {
            set.add(&JsValue::from(ribbon as u32));
        }
        set.into_abi()
    }
}

#[cfg(feature = "wasm")]
impl<const N: usize> FromWasmAbi for ModernRibbonSet<N> {
    type Abi = <Set as FromWasmAbi>::Abi;

    unsafe fn from_abi(js: Self::Abi) -> Self {
        let set = unsafe { Set::from_abi(js) };
        set.entries()
            .into_iter()
            .flatten()
            .filter_map(|v| JsValue::as_f64(&v).map(|v| v as usize))
            .filter_map(ModernRibbon::from_index)
            .collect()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Serialize, PartialEq, Eq, Clone, Copy)]
pub enum ModernRibbon {
    KalosChampion,
    Gen3Champion,
    SinnohChampion,
    BestFriends,
    Training,
    SkillfulBattler,
    ExpertBattler,
    Effort,
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
    Artist,
    Footprint,
    Record,
    Legend,
    Country,
    National,
    Earth,
    World,
    Classic,
    Premier,
    Event,
    Birthday,
    Special,
    Souvenir,
    Wishing,
    BattleChampion,
    RegionalChampion,
    NationalChampion,
    WorldChampion,
    ContestMemory,
    BattleMemory,
    HoennChampion,
    ContestStar,
    CoolnessMaster,
    BeautyMaster,
    CutenessMaster,
    ClevernessMaster,
    ToughnessMaster,
    AlolaChampion,
    BattleRoyalChampion,
    BattleTreeGreat,
    BattleTreeMaster,
    GalarChampion,
    TowerMaster,
    MasterRank,
    LunchtimeMark,
    SleepyTimeMark,
    DuskMark,
    DawnMark,
    CloudyMark,
    RainyMark,
    StormyMark,
    SnowyMark,
    BlizzardMark,
    DryMark,
    SandstormMark,
    MistyMark,
    DestinyMark,
    FishingMark,
    CurryMark,
    UncommonMark,
    RareMark,
    RowdyMark,
    AbsentMindedMark,
    JitteryMark,
    ExcitedMark,
    CharismaticMark,
    CalmnessMark,
    IntenseMark,
    ZonedOutMark,
    JoyfulMark,
    AngryMark,
    SmileyMark,
    TearyMark,
    UpbeatMark,
    PeevedMark,
    IntellectualMark,
    FerociousMark,
    CraftyMark,
    ScowlingMark,
    KindlyMark,
    FlusteredMark,
    PumpedUpMark,
    ZeroEnergyMark,
    PridefulMark,
    UnsureMark,
    HumbleMark,
    ThornyMark,
    VigorMark,
    SlumpMark,
    Hisui,
    TwinklingStar,
    PaldeaChampion,
    JumboMark,
    MiniMark,
    ItemfinderMark,
    PartnerMark,
    GourmandMark,
    OnceInALifetime,
    AlphaMark,
    MightiestMark,
    TitanMark,
    Partner,
}

impl ModernRibbon {
    pub const fn get_name(&self) -> &'static str {
        match self {
            ModernRibbon::KalosChampion => "Kalos Champion Ribbon",
            ModernRibbon::Gen3Champion => "Champion Ribbon",
            ModernRibbon::SinnohChampion => "Sinnoh Champion Ribbon",
            ModernRibbon::BestFriends => "Best Friends Ribbon",
            ModernRibbon::Training => "Training Ribbon",
            ModernRibbon::SkillfulBattler => "Skillful Battler Ribbon",
            ModernRibbon::ExpertBattler => "Expert Battler Ribbon",
            ModernRibbon::Effort => "Effort Ribbon",
            ModernRibbon::Alert => "Alert Ribbon",
            ModernRibbon::Shock => "Shock Ribbon",
            ModernRibbon::Downcast => "Downcast Ribbon",
            ModernRibbon::Careless => "Careless Ribbon",
            ModernRibbon::Relax => "Relax Ribbon",
            ModernRibbon::Snooze => "Snooze Ribbon",
            ModernRibbon::Smile => "Smile Ribbon",
            ModernRibbon::Gorgeous => "Gorgeous Ribbon",
            ModernRibbon::Royal => "Royal Ribbon",
            ModernRibbon::GorgeousRoyal => "Gorgeous Royal Ribbon",
            ModernRibbon::Artist => "Artist Ribbon",
            ModernRibbon::Footprint => "Footprint Ribbon",
            ModernRibbon::Record => "Record Ribbon",
            ModernRibbon::Legend => "Legend Ribbon",
            ModernRibbon::Country => "Country Ribbon",
            ModernRibbon::National => "National Ribbon",
            ModernRibbon::Earth => "Earth Ribbon",
            ModernRibbon::World => "World Ribbon",
            ModernRibbon::Classic => "Classic Ribbon",
            ModernRibbon::Premier => "Premier Ribbon",
            ModernRibbon::Event => "Event Ribbon",
            ModernRibbon::Birthday => "Birthday Ribbon",
            ModernRibbon::Special => "Special Ribbon",
            ModernRibbon::Souvenir => "Souvenir Ribbon",
            ModernRibbon::Wishing => "Wishing Ribbon",
            ModernRibbon::BattleChampion => "Battle Champion Ribbon",
            ModernRibbon::RegionalChampion => "Regional Champion Ribbon",
            ModernRibbon::NationalChampion => "National Champion Ribbon",
            ModernRibbon::WorldChampion => "World Champion Ribbon",
            ModernRibbon::ContestMemory => "Contest Memory Ribbon",
            ModernRibbon::BattleMemory => "Battle Memory Ribbon",
            ModernRibbon::HoennChampion => "Hoenn Champion Ribbon",
            ModernRibbon::ContestStar => "Contest Star Ribbon",
            ModernRibbon::CoolnessMaster => "Coolness Master Ribbon",
            ModernRibbon::BeautyMaster => "Beauty Master Ribbon",
            ModernRibbon::CutenessMaster => "Cuteness Master Ribbon",
            ModernRibbon::ClevernessMaster => "Cleverness Master Ribbon",
            ModernRibbon::ToughnessMaster => "Toughness Master Ribbon",
            ModernRibbon::AlolaChampion => "Alola Champion Ribbon",
            ModernRibbon::BattleRoyalChampion => "Battle Royal Champion Ribbon",
            ModernRibbon::BattleTreeGreat => "Battle Tree Great Ribbon",
            ModernRibbon::BattleTreeMaster => "Battle Tree Master Ribbon",
            ModernRibbon::GalarChampion => "Galar Champion Ribbon",
            ModernRibbon::TowerMaster => "Tower Master Ribbon",
            ModernRibbon::MasterRank => "Master Rank Ribbon",
            ModernRibbon::LunchtimeMark => "Lunchtime Mark",
            ModernRibbon::SleepyTimeMark => "Sleepy-Time Mark",
            ModernRibbon::DuskMark => "Dusk Mark",
            ModernRibbon::DawnMark => "Dawn Mark",
            ModernRibbon::CloudyMark => "Cloudy Mark",
            ModernRibbon::RainyMark => "Rainy Mark",
            ModernRibbon::StormyMark => "Stormy Mark",
            ModernRibbon::SnowyMark => "Snowy Mark",
            ModernRibbon::BlizzardMark => "Blizzard Mark",
            ModernRibbon::DryMark => "Dry Mark",
            ModernRibbon::SandstormMark => "Sandstorm Mark",
            ModernRibbon::MistyMark => "Misty Mark",
            ModernRibbon::DestinyMark => "Destiny Mark",
            ModernRibbon::FishingMark => "Fishing Mark",
            ModernRibbon::CurryMark => "Curry Mark",
            ModernRibbon::UncommonMark => "Uncommon Mark",
            ModernRibbon::RareMark => "Rare Mark",
            ModernRibbon::RowdyMark => "Rowdy Mark",
            ModernRibbon::AbsentMindedMark => "Absent-Minded Mark",
            ModernRibbon::JitteryMark => "Jittery Mark",
            ModernRibbon::ExcitedMark => "Excited Mark",
            ModernRibbon::CharismaticMark => "Charismatic Mark",
            ModernRibbon::CalmnessMark => "Calmness Mark",
            ModernRibbon::IntenseMark => "Intense Mark",
            ModernRibbon::ZonedOutMark => "Zoned-Out Mark",
            ModernRibbon::JoyfulMark => "Joyful Mark",
            ModernRibbon::AngryMark => "Angry Mark",
            ModernRibbon::SmileyMark => "Smiley Mark",
            ModernRibbon::TearyMark => "Teary Mark",
            ModernRibbon::UpbeatMark => "Upbeat Mark",
            ModernRibbon::PeevedMark => "Peeved Mark",
            ModernRibbon::IntellectualMark => "Intellectual Mark",
            ModernRibbon::FerociousMark => "Ferocious Mark",
            ModernRibbon::CraftyMark => "Crafty Mark",
            ModernRibbon::ScowlingMark => "Scowling Mark",
            ModernRibbon::KindlyMark => "Kindly Mark",
            ModernRibbon::FlusteredMark => "Flustered Mark",
            ModernRibbon::PumpedUpMark => "Pumped-Up Mark",
            ModernRibbon::ZeroEnergyMark => "Zero Energy Mark",
            ModernRibbon::PridefulMark => "Prideful Mark",
            ModernRibbon::UnsureMark => "Unsure Mark",
            ModernRibbon::HumbleMark => "Humble Mark",
            ModernRibbon::ThornyMark => "Thorny Mark",
            ModernRibbon::VigorMark => "Vigor Mark",
            ModernRibbon::SlumpMark => "Slump Mark",
            ModernRibbon::Hisui => "Hisui Ribbon",
            ModernRibbon::TwinklingStar => "Twinkling Star Ribbon",
            ModernRibbon::PaldeaChampion => "Paldea Champion Ribbon",
            ModernRibbon::JumboMark => "Jumbo Mark",
            ModernRibbon::MiniMark => "Mini Mark",
            ModernRibbon::ItemfinderMark => "Itemfinder Mark",
            ModernRibbon::PartnerMark => "Partner Mark",
            ModernRibbon::GourmandMark => "Gourmand Mark",
            ModernRibbon::OnceInALifetime => "Once-in-a-Lifetime Ribbon",
            ModernRibbon::AlphaMark => "Alpha Mark",
            ModernRibbon::MightiestMark => "Mightiest Mark",
            ModernRibbon::TitanMark => "Titan Mark",
            ModernRibbon::Partner => "Partner Ribbon",
        }
    }

    pub fn from_name(name: &str) -> Option<Self> {
        let mut full_name = name.to_owned();
        if !full_name.ends_with("Ribbon") && !full_name.ends_with("Mark") {
            full_name = format!("{name} Ribbon");
        }
        match full_name.as_str() {
            "Kalos Champion Ribbon" => Some(Self::KalosChampion),
            "Champion Ribbon" => Some(Self::Gen3Champion),
            "Sinnoh Champion Ribbon" => Some(Self::SinnohChampion),
            "Best Friends Ribbon" => Some(Self::BestFriends),
            "Training Ribbon" => Some(Self::Training),
            "Skillful Battler Ribbon" => Some(Self::SkillfulBattler),
            "Expert Battler Ribbon" => Some(Self::ExpertBattler),
            "Effort Ribbon" => Some(Self::Effort),
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
            "Artist Ribbon" => Some(Self::Artist),
            "Footprint Ribbon" => Some(Self::Footprint),
            "Record Ribbon" => Some(Self::Record),
            "Legend Ribbon" => Some(Self::Legend),
            "Country Ribbon" => Some(Self::Country),
            "National Ribbon" => Some(Self::National),
            "Earth Ribbon" => Some(Self::Earth),
            "World Ribbon" => Some(Self::World),
            "Classic Ribbon" => Some(Self::Classic),
            "Premier Ribbon" => Some(Self::Premier),
            "Event Ribbon" => Some(Self::Event),
            "Birthday Ribbon" => Some(Self::Birthday),
            "Special Ribbon" => Some(Self::Special),
            "Souvenir Ribbon" => Some(Self::Souvenir),
            "Wishing Ribbon" => Some(Self::Wishing),
            "Battle Champion Ribbon" => Some(Self::BattleChampion),
            "Regional Champion Ribbon" => Some(Self::RegionalChampion),
            "National Champion Ribbon" => Some(Self::NationalChampion),
            "World Champion Ribbon" => Some(Self::WorldChampion),
            "Contest Memory Ribbon" => Some(Self::ContestMemory),
            "Battle Memory Ribbon" => Some(Self::BattleMemory),
            "Hoenn Champion Ribbon" => Some(Self::HoennChampion),
            "Contest Star Ribbon" => Some(Self::ContestStar),
            "Coolness Master Ribbon" => Some(Self::CoolnessMaster),
            "Beauty Master Ribbon" => Some(Self::BeautyMaster),
            "Cuteness Master Ribbon" => Some(Self::CutenessMaster),
            "Cleverness Master Ribbon" => Some(Self::ClevernessMaster),
            "Toughness Master Ribbon" => Some(Self::ToughnessMaster),
            "Alola Champion Ribbon" => Some(Self::AlolaChampion),
            "Battle Royal Champion Ribbon" => Some(Self::BattleRoyalChampion),
            "Battle Tree Great Ribbon" => Some(Self::BattleTreeGreat),
            "Battle Tree Master Ribbon" => Some(Self::BattleTreeMaster),
            "Galar Champion Ribbon" => Some(Self::GalarChampion),
            "Tower Master Ribbon" => Some(Self::TowerMaster),
            "Master Rank Ribbon" => Some(Self::MasterRank),
            "Lunchtime Mark" => Some(Self::LunchtimeMark),
            "Sleepy-Time Mark" => Some(Self::SleepyTimeMark),
            "Dusk Mark" => Some(Self::DuskMark),
            "Dawn Mark" => Some(Self::DawnMark),
            "Cloudy Mark" => Some(Self::CloudyMark),
            "Rainy Mark" => Some(Self::RainyMark),
            "Stormy Mark" => Some(Self::StormyMark),
            "Snowy Mark" => Some(Self::SnowyMark),
            "Blizzard Mark" => Some(Self::BlizzardMark),
            "Dry Mark" => Some(Self::DryMark),
            "Sandstorm Mark" => Some(Self::SandstormMark),
            "Misty Mark" => Some(Self::MistyMark),
            "Destiny Mark" => Some(Self::DestinyMark),
            "Fishing Mark" => Some(Self::FishingMark),
            "Curry Mark" => Some(Self::CurryMark),
            "Uncommon Mark" => Some(Self::UncommonMark),
            "Rare Mark" => Some(Self::RareMark),
            "Rowdy Mark" => Some(Self::RowdyMark),
            "Absent-Minded Mark" => Some(Self::AbsentMindedMark),
            "Jittery Mark" => Some(Self::JitteryMark),
            "Excited Mark" => Some(Self::ExcitedMark),
            "Charismatic Mark" => Some(Self::CharismaticMark),
            "Calmness Mark" => Some(Self::CalmnessMark),
            "Intense Mark" => Some(Self::IntenseMark),
            "Zoned-Out Mark" => Some(Self::ZonedOutMark),
            "Joyful Mark" => Some(Self::JoyfulMark),
            "Angry Mark" => Some(Self::AngryMark),
            "Smiley Mark" => Some(Self::SmileyMark),
            "Teary Mark" => Some(Self::TearyMark),
            "Upbeat Mark" => Some(Self::UpbeatMark),
            "Peeved Mark" => Some(Self::PeevedMark),
            "Intellectual Mark" => Some(Self::IntellectualMark),
            "Ferocious Mark" => Some(Self::FerociousMark),
            "Crafty Mark" => Some(Self::CraftyMark),
            "Scowling Mark" => Some(Self::ScowlingMark),
            "Kindly Mark" => Some(Self::KindlyMark),
            "Flustered Mark" => Some(Self::FlusteredMark),
            "Pumped-Up Mark" => Some(Self::PumpedUpMark),
            "Zero Energy Mark" => Some(Self::ZeroEnergyMark),
            "Prideful Mark" => Some(Self::PridefulMark),
            "Unsure Mark" => Some(Self::UnsureMark),
            "Humble Mark" => Some(Self::HumbleMark),
            "Thorny Mark" => Some(Self::ThornyMark),
            "Vigor Mark" => Some(Self::VigorMark),
            "Slump Mark" => Some(Self::SlumpMark),
            "Hisui Ribbon" => Some(Self::Hisui),
            "Twinkling Star Ribbon" => Some(Self::TwinklingStar),
            "Paldea Champion Ribbon" => Some(Self::PaldeaChampion),
            "Jumbo Mark" => Some(Self::JumboMark),
            "Mini Mark" => Some(Self::MiniMark),
            "Itemfinder Mark" => Some(Self::ItemfinderMark),
            "Partner Mark" => Some(Self::PartnerMark),
            "Gourmand Mark" => Some(Self::GourmandMark),
            "Once-in-a-Lifetime Ribbon" => Some(Self::OnceInALifetime),
            "Alpha Mark" => Some(Self::AlphaMark),
            "Mightiest Mark" => Some(Self::MightiestMark),
            "Titan Mark" => Some(Self::TitanMark),
            "Partner Ribbon" => Some(Self::Partner),
            _ => None,
        }
    }

    pub const fn get_index(&self) -> usize {
        match self {
            ModernRibbon::KalosChampion => 0,
            ModernRibbon::Gen3Champion => 1,
            ModernRibbon::SinnohChampion => 2,
            ModernRibbon::BestFriends => 3,
            ModernRibbon::Training => 4,
            ModernRibbon::SkillfulBattler => 5,
            ModernRibbon::ExpertBattler => 6,
            ModernRibbon::Effort => 7,
            ModernRibbon::Alert => 8,
            ModernRibbon::Shock => 9,
            ModernRibbon::Downcast => 10,
            ModernRibbon::Careless => 11,
            ModernRibbon::Relax => 12,
            ModernRibbon::Snooze => 13,
            ModernRibbon::Smile => 14,
            ModernRibbon::Gorgeous => 15,
            ModernRibbon::Royal => 16,
            ModernRibbon::GorgeousRoyal => 17,
            ModernRibbon::Artist => 18,
            ModernRibbon::Footprint => 19,
            ModernRibbon::Record => 20,
            ModernRibbon::Legend => 21,
            ModernRibbon::Country => 22,
            ModernRibbon::National => 23,
            ModernRibbon::Earth => 24,
            ModernRibbon::World => 25,
            ModernRibbon::Classic => 26,
            ModernRibbon::Premier => 27,
            ModernRibbon::Event => 28,
            ModernRibbon::Birthday => 29,
            ModernRibbon::Special => 30,
            ModernRibbon::Souvenir => 31,
            ModernRibbon::Wishing => 32,
            ModernRibbon::BattleChampion => 33,
            ModernRibbon::RegionalChampion => 34,
            ModernRibbon::NationalChampion => 35,
            ModernRibbon::WorldChampion => 36,
            ModernRibbon::ContestMemory => 37,
            ModernRibbon::BattleMemory => 38,
            ModernRibbon::HoennChampion => 39,
            ModernRibbon::ContestStar => 40,
            ModernRibbon::CoolnessMaster => 41,
            ModernRibbon::BeautyMaster => 42,
            ModernRibbon::CutenessMaster => 43,
            ModernRibbon::ClevernessMaster => 44,
            ModernRibbon::ToughnessMaster => 45,
            ModernRibbon::AlolaChampion => 46,
            ModernRibbon::BattleRoyalChampion => 47,
            ModernRibbon::BattleTreeGreat => 48,
            ModernRibbon::BattleTreeMaster => 49,
            ModernRibbon::GalarChampion => 50,
            ModernRibbon::TowerMaster => 51,
            ModernRibbon::MasterRank => 52,
            ModernRibbon::LunchtimeMark => 53,
            ModernRibbon::SleepyTimeMark => 54,
            ModernRibbon::DuskMark => 55,
            ModernRibbon::DawnMark => 56,
            ModernRibbon::CloudyMark => 57,
            ModernRibbon::RainyMark => 58,
            ModernRibbon::StormyMark => 59,
            ModernRibbon::SnowyMark => 60,
            ModernRibbon::BlizzardMark => 61,
            ModernRibbon::DryMark => 62,
            ModernRibbon::SandstormMark => 63,
            ModernRibbon::MistyMark => 64,
            ModernRibbon::DestinyMark => 65,
            ModernRibbon::FishingMark => 66,
            ModernRibbon::CurryMark => 67,
            ModernRibbon::UncommonMark => 68,
            ModernRibbon::RareMark => 69,
            ModernRibbon::RowdyMark => 70,
            ModernRibbon::AbsentMindedMark => 71,
            ModernRibbon::JitteryMark => 72,
            ModernRibbon::ExcitedMark => 73,
            ModernRibbon::CharismaticMark => 74,
            ModernRibbon::CalmnessMark => 75,
            ModernRibbon::IntenseMark => 76,
            ModernRibbon::ZonedOutMark => 77,
            ModernRibbon::JoyfulMark => 78,
            ModernRibbon::AngryMark => 79,
            ModernRibbon::SmileyMark => 80,
            ModernRibbon::TearyMark => 81,
            ModernRibbon::UpbeatMark => 82,
            ModernRibbon::PeevedMark => 83,
            ModernRibbon::IntellectualMark => 84,
            ModernRibbon::FerociousMark => 85,
            ModernRibbon::CraftyMark => 86,
            ModernRibbon::ScowlingMark => 87,
            ModernRibbon::KindlyMark => 88,
            ModernRibbon::FlusteredMark => 89,
            ModernRibbon::PumpedUpMark => 90,
            ModernRibbon::ZeroEnergyMark => 91,
            ModernRibbon::PridefulMark => 92,
            ModernRibbon::UnsureMark => 93,
            ModernRibbon::HumbleMark => 94,
            ModernRibbon::ThornyMark => 95,
            ModernRibbon::VigorMark => 96,
            ModernRibbon::SlumpMark => 97,
            ModernRibbon::Hisui => 98,
            ModernRibbon::TwinklingStar => 99,
            ModernRibbon::PaldeaChampion => 100,
            ModernRibbon::JumboMark => 101,
            ModernRibbon::MiniMark => 102,
            ModernRibbon::ItemfinderMark => 103,
            ModernRibbon::PartnerMark => 104,
            ModernRibbon::GourmandMark => 105,
            ModernRibbon::OnceInALifetime => 106,
            ModernRibbon::AlphaMark => 107,
            ModernRibbon::MightiestMark => 108,
            ModernRibbon::TitanMark => 109,
            ModernRibbon::Partner => 110,
        }
    }

    pub fn from_affixed_byte(affixed_byte: u8) -> Option<ModernRibbon> {
        match affixed_byte {
            0xff => None,
            value => ModernRibbon::from_index(value),
        }
    }

    pub const fn to_affixed_byte(affixed: Option<ModernRibbon>) -> u8 {
        match affixed {
            None => 0xff,
            Some(ribbon) => ribbon.get_index() as u8,
        }
    }

    pub fn from_index(value: impl Into<usize>) -> Option<Self> {
        match value.into() {
            0 => Some(ModernRibbon::KalosChampion),
            1 => Some(ModernRibbon::Gen3Champion),
            2 => Some(ModernRibbon::SinnohChampion),
            3 => Some(ModernRibbon::BestFriends),
            4 => Some(ModernRibbon::Training),
            5 => Some(ModernRibbon::SkillfulBattler),
            6 => Some(ModernRibbon::ExpertBattler),
            7 => Some(ModernRibbon::Effort),
            8 => Some(ModernRibbon::Alert),
            9 => Some(ModernRibbon::Shock),
            10 => Some(ModernRibbon::Downcast),
            11 => Some(ModernRibbon::Careless),
            12 => Some(ModernRibbon::Relax),
            13 => Some(ModernRibbon::Snooze),
            14 => Some(ModernRibbon::Smile),
            15 => Some(ModernRibbon::Gorgeous),
            16 => Some(ModernRibbon::Royal),
            17 => Some(ModernRibbon::GorgeousRoyal),
            18 => Some(ModernRibbon::Artist),
            19 => Some(ModernRibbon::Footprint),
            20 => Some(ModernRibbon::Record),
            21 => Some(ModernRibbon::Legend),
            22 => Some(ModernRibbon::Country),
            23 => Some(ModernRibbon::National),
            24 => Some(ModernRibbon::Earth),
            25 => Some(ModernRibbon::World),
            26 => Some(ModernRibbon::Classic),
            27 => Some(ModernRibbon::Premier),
            28 => Some(ModernRibbon::Event),
            29 => Some(ModernRibbon::Birthday),
            30 => Some(ModernRibbon::Special),
            31 => Some(ModernRibbon::Souvenir),
            32 => Some(ModernRibbon::Wishing),
            33 => Some(ModernRibbon::BattleChampion),
            34 => Some(ModernRibbon::RegionalChampion),
            35 => Some(ModernRibbon::NationalChampion),
            36 => Some(ModernRibbon::WorldChampion),
            37 => Some(ModernRibbon::ContestMemory),
            38 => Some(ModernRibbon::BattleMemory),
            39 => Some(ModernRibbon::HoennChampion),
            40 => Some(ModernRibbon::ContestStar),
            41 => Some(ModernRibbon::CoolnessMaster),
            42 => Some(ModernRibbon::BeautyMaster),
            43 => Some(ModernRibbon::CutenessMaster),
            44 => Some(ModernRibbon::ClevernessMaster),
            45 => Some(ModernRibbon::ToughnessMaster),
            46 => Some(ModernRibbon::AlolaChampion),
            47 => Some(ModernRibbon::BattleRoyalChampion),
            48 => Some(ModernRibbon::BattleTreeGreat),
            49 => Some(ModernRibbon::BattleTreeMaster),
            50 => Some(ModernRibbon::GalarChampion),
            51 => Some(ModernRibbon::TowerMaster),
            52 => Some(ModernRibbon::MasterRank),
            53 => Some(ModernRibbon::LunchtimeMark),
            54 => Some(ModernRibbon::SleepyTimeMark),
            55 => Some(ModernRibbon::DuskMark),
            56 => Some(ModernRibbon::DawnMark),
            57 => Some(ModernRibbon::CloudyMark),
            58 => Some(ModernRibbon::RainyMark),
            59 => Some(ModernRibbon::StormyMark),
            60 => Some(ModernRibbon::SnowyMark),
            61 => Some(ModernRibbon::BlizzardMark),
            62 => Some(ModernRibbon::DryMark),
            63 => Some(ModernRibbon::SandstormMark),
            64 => Some(ModernRibbon::MistyMark),
            65 => Some(ModernRibbon::DestinyMark),
            66 => Some(ModernRibbon::FishingMark),
            67 => Some(ModernRibbon::CurryMark),
            68 => Some(ModernRibbon::UncommonMark),
            69 => Some(ModernRibbon::RareMark),
            70 => Some(ModernRibbon::RowdyMark),
            71 => Some(ModernRibbon::AbsentMindedMark),
            72 => Some(ModernRibbon::JitteryMark),
            73 => Some(ModernRibbon::ExcitedMark),
            74 => Some(ModernRibbon::CharismaticMark),
            75 => Some(ModernRibbon::CalmnessMark),
            76 => Some(ModernRibbon::IntenseMark),
            77 => Some(ModernRibbon::ZonedOutMark),
            78 => Some(ModernRibbon::JoyfulMark),
            79 => Some(ModernRibbon::AngryMark),
            80 => Some(ModernRibbon::SmileyMark),
            81 => Some(ModernRibbon::TearyMark),
            82 => Some(ModernRibbon::UpbeatMark),
            83 => Some(ModernRibbon::PeevedMark),
            84 => Some(ModernRibbon::IntellectualMark),
            85 => Some(ModernRibbon::FerociousMark),
            86 => Some(ModernRibbon::CraftyMark),
            87 => Some(ModernRibbon::ScowlingMark),
            88 => Some(ModernRibbon::KindlyMark),
            89 => Some(ModernRibbon::FlusteredMark),
            90 => Some(ModernRibbon::PumpedUpMark),
            91 => Some(ModernRibbon::ZeroEnergyMark),
            92 => Some(ModernRibbon::PridefulMark),
            93 => Some(ModernRibbon::UnsureMark),
            94 => Some(ModernRibbon::HumbleMark),
            95 => Some(ModernRibbon::ThornyMark),
            96 => Some(ModernRibbon::VigorMark),
            97 => Some(ModernRibbon::SlumpMark),
            98 => Some(ModernRibbon::Hisui),
            99 => Some(ModernRibbon::TwinklingStar),
            100 => Some(ModernRibbon::PaldeaChampion),
            101 => Some(ModernRibbon::JumboMark),
            102 => Some(ModernRibbon::MiniMark),
            103 => Some(ModernRibbon::ItemfinderMark),
            104 => Some(ModernRibbon::PartnerMark),
            105 => Some(ModernRibbon::GourmandMark),
            106 => Some(ModernRibbon::OnceInALifetime),
            107 => Some(ModernRibbon::AlphaMark),
            108 => Some(ModernRibbon::MightiestMark),
            109 => Some(ModernRibbon::TitanMark),
            110 => Some(ModernRibbon::Partner),
            _ => None,
        }
    }
}

impl Display for ModernRibbon {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.get_name())
    }
}

impl<const N: usize> FromIterator<ModernRibbon> for ModernRibbonSet<N> {
    fn from_iter<T: IntoIterator<Item = ModernRibbon>>(iter: T) -> Self {
        Self::default().with_ribbons(iter.into_iter().collect())
    }
}
