use pkm_rs_types::FlagSet;
use serde::{Serialize, Serializer};
use std::{error::Error, fmt::Display};

use crate::ribbons::{ModernRibbon, ModernRibbonSet};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[derive(Default, Debug, Clone, Copy)]
pub struct ObsoleteRibbonSet(FlagSet<6>);

impl ObsoleteRibbonSet {
    pub const fn from_bytes(bytes: [u8; 6]) -> Self {
        Self(FlagSet::from_bytes(bytes))
    }

    pub fn get_ribbons(&self) -> Vec<ObsoleteRibbon> {
        self.0
            .get_indices()
            .into_iter()
            .map(ObsoleteRibbon::from)
            .collect()
    }

    pub const fn to_bytes(self) -> [u8; 6] {
        self.0.to_bytes()
    }

    pub const fn clear_ribbons(&mut self) {
        self.0.clear_all();
    }

    pub fn add_ribbon(&mut self, ribbon: ObsoleteRibbon) {
        self.0.set_index(ribbon.get_index() as u8, true);
    }

    pub fn add_ribbons(&mut self, ribbons: Vec<ObsoleteRibbon>) {
        for ribbon in ribbons {
            self.add_ribbon(ribbon);
        }
    }

    pub fn with_ribbons(mut self, ribbons: Vec<ObsoleteRibbon>) -> Self {
        self.add_ribbons(ribbons);
        self
    }

    pub fn set_ribbons(&mut self, ribbons: Vec<ObsoleteRibbon>) {
        self.clear_ribbons();
        self.add_ribbons(ribbons);
    }
}

impl Serialize for ObsoleteRibbonSet {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.get_ribbons().serialize(serializer)
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Serialize, PartialEq, Eq, Clone, Copy)]
#[repr(u8)]
pub enum ObsoleteRibbon {
    Winning,
    Victory,
    Ability,
    GreatAbility,
    DoubleAbility,
    MultiAbility,
    PairAbility,
    WorldAbility,
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

impl FromIterator<ObsoleteRibbon> for ObsoleteRibbonSet {
    fn from_iter<T: IntoIterator<Item = ObsoleteRibbon>>(iter: T) -> Self {
        Self::default().with_ribbons(iter.into_iter().collect())
    }
}

impl IntoIterator for ObsoleteRibbonSet {
    type Item = ObsoleteRibbon;
    type IntoIter = std::iter::Map<std::vec::IntoIter<usize>, fn(usize) -> ObsoleteRibbon>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.get_indices().into_iter().map(ObsoleteRibbon::from)
    }
}

impl ObsoleteRibbon {
    const fn get_name(&self) -> &'static str {
        match self {
            ObsoleteRibbon::Winning => "Winning Ribbon",
            ObsoleteRibbon::Victory => "Victory Ribbon",
            ObsoleteRibbon::Ability => "Ability Ribbon",
            ObsoleteRibbon::GreatAbility => "Great Ability Ribbon",
            ObsoleteRibbon::DoubleAbility => "Double Ability Ribbon",
            ObsoleteRibbon::MultiAbility => "Multi Ability Ribbon",
            ObsoleteRibbon::PairAbility => "Pair Ability Ribbon",
            ObsoleteRibbon::WorldAbility => "World Ability Ribbon",
            ObsoleteRibbon::CoolHoenn => "Cool (Hoenn) Ribbon",
            ObsoleteRibbon::CoolSuperHoenn => "Cool Super (Hoenn) Ribbon",
            ObsoleteRibbon::CoolHyperHoenn => "Cool Hyper (Hoenn) Ribbon",
            ObsoleteRibbon::CoolMasterHoenn => "Cool Master (Hoenn) Ribbon",
            ObsoleteRibbon::BeautyHoenn => "Beauty (Hoenn) Ribbon",
            ObsoleteRibbon::BeautySuperHoenn => "Beauty Super (Hoenn) Ribbon",
            ObsoleteRibbon::BeautyHyperHoenn => "Beauty Hyper (Hoenn) Ribbon",
            ObsoleteRibbon::BeautyMasterHoenn => "Beauty Master (Hoenn) Ribbon",
            ObsoleteRibbon::CuteHoenn => "Cute (Hoenn) Ribbon",
            ObsoleteRibbon::CuteSuperHoenn => "Cute Super (Hoenn) Ribbon",
            ObsoleteRibbon::CuteHyperHoenn => "Cute Hyper (Hoenn) Ribbon",
            ObsoleteRibbon::CuteMasterHoenn => "Cute Master (Hoenn) Ribbon",
            ObsoleteRibbon::SmartHoenn => "Smart (Hoenn) Ribbon",
            ObsoleteRibbon::SmartSuperHoenn => "Smart Super (Hoenn) Ribbon",
            ObsoleteRibbon::SmartHyperHoenn => "Smart Hyper (Hoenn) Ribbon",
            ObsoleteRibbon::SmartMasterHoenn => "Smart Master (Hoenn) Ribbon",
            ObsoleteRibbon::ToughHoenn => "Tough (Hoenn) Ribbon",
            ObsoleteRibbon::ToughSuperHoenn => "Tough Super (Hoenn) Ribbon",
            ObsoleteRibbon::ToughHyperHoenn => "Tough Hyper (Hoenn) Ribbon",
            ObsoleteRibbon::ToughMasterHoenn => "Tough Master (Hoenn) Ribbon",
            ObsoleteRibbon::CoolSinnoh => "Cool (Sinnoh) Ribbon",
            ObsoleteRibbon::CoolGreatSinnoh => "Cool Great (Sinnoh) Ribbon",
            ObsoleteRibbon::CoolUltraSinnoh => "Cool Ultra (Sinnoh) Ribbon",
            ObsoleteRibbon::CoolMasterSinnoh => "Cool Master (Sinnoh) Ribbon",
            ObsoleteRibbon::BeautySinnoh => "Beauty (Sinnoh) Ribbon",
            ObsoleteRibbon::BeautyGreatSinnoh => "Beauty Great (Sinnoh) Ribbon",
            ObsoleteRibbon::BeautyUltraSinnoh => "Beauty Ultra (Sinnoh) Ribbon",
            ObsoleteRibbon::BeautyMasterSinnoh => "Beauty Master (Sinnoh) Ribbon",
            ObsoleteRibbon::CuteSinnoh => "Cute (Sinnoh) Ribbon",
            ObsoleteRibbon::CuteGreatSinnoh => "Cute Great (Sinnoh) Ribbon",
            ObsoleteRibbon::CuteUltraSinnoh => "Cute Ultra (Sinnoh) Ribbon",
            ObsoleteRibbon::CuteMasterSinnoh => "Cute Master (Sinnoh) Ribbon",
            ObsoleteRibbon::SmartSinnoh => "Smart (Sinnoh) Ribbon",
            ObsoleteRibbon::SmartGreatSinnoh => "Smart Great (Sinnoh) Ribbon",
            ObsoleteRibbon::SmartUltraSinnoh => "Smart Ultra (Sinnoh) Ribbon",
            ObsoleteRibbon::SmartMasterSinnoh => "Smart Master (Sinnoh) Ribbon",
            ObsoleteRibbon::ToughSinnoh => "Tough (Sinnoh) Ribbon",
            ObsoleteRibbon::ToughGreatSinnoh => "Tough Great (Sinnoh) Ribbon",
            ObsoleteRibbon::ToughUltraSinnoh => "Tough Ultra (Sinnoh) Ribbon",
            ObsoleteRibbon::ToughMasterSinnoh => "Tough Master (Sinnoh) Ribbon",
        }
    }

    pub fn from_name(name: &str) -> Option<Self> {
        let mut full_name = name.to_owned();
        if !full_name.ends_with("Ribbon") && !full_name.ends_with("Mark") {
            full_name = format!("{name} Ribbon");
        }
        match full_name.as_str() {
            "Winning Ribbon" => Some(Self::Winning),
            "Victory Ribbon" => Some(Self::Victory),
            "Ability Ribbon" => Some(Self::Ability),
            "Great Ability Ribbon" => Some(Self::GreatAbility),
            "Double Ability Ribbon" => Some(Self::DoubleAbility),
            "Multi Ability Ribbon" => Some(Self::MultiAbility),
            "Pair Ability Ribbon" => Some(Self::PairAbility),
            "World Ability Ribbon" => Some(Self::WorldAbility),
            "Cool (Hoenn) Ribbon" => Some(Self::CoolHoenn),
            "Cool Super (Hoenn) Ribbon" => Some(Self::CoolSuperHoenn),
            "Cool Hyper (Hoenn) Ribbon" => Some(Self::CoolHyperHoenn),
            "Cool Master (Hoenn) Ribbon" => Some(Self::CoolMasterHoenn),
            "Beauty (Hoenn) Ribbon" => Some(Self::BeautyHoenn),
            "Beauty Super (Hoenn) Ribbon" => Some(Self::BeautySuperHoenn),
            "Beauty Hyper (Hoenn) Ribbon" => Some(Self::BeautyHyperHoenn),
            "Beauty Master (Hoenn) Ribbon" => Some(Self::BeautyMasterHoenn),
            "Cute (Hoenn) Ribbon" => Some(Self::CuteHoenn),
            "Cute Super (Hoenn) Ribbon" => Some(Self::CuteSuperHoenn),
            "Cute Hyper (Hoenn) Ribbon" => Some(Self::CuteHyperHoenn),
            "Cute Master (Hoenn) Ribbon" => Some(Self::CuteMasterHoenn),
            "Smart (Hoenn) Ribbon" => Some(Self::SmartHoenn),
            "Smart Super (Hoenn) Ribbon" => Some(Self::SmartSuperHoenn),
            "Smart Hyper (Hoenn) Ribbon" => Some(Self::SmartHyperHoenn),
            "Smart Master (Hoenn) Ribbon" => Some(Self::SmartMasterHoenn),
            "Tough (Hoenn) Ribbon" => Some(Self::ToughHoenn),
            "Tough Super (Hoenn) Ribbon" => Some(Self::ToughSuperHoenn),
            "Tough Hyper (Hoenn) Ribbon" => Some(Self::ToughHyperHoenn),
            "Tough Master (Hoenn) Ribbon" => Some(Self::ToughMasterHoenn),
            "Cool (Sinnoh) Ribbon" => Some(Self::CoolSinnoh),
            "Cool Great (Sinnoh) Ribbon" => Some(Self::CoolGreatSinnoh),
            "Cool Ultra (Sinnoh) Ribbon" => Some(Self::CoolUltraSinnoh),
            "Cool Master (Sinnoh) Ribbon" => Some(Self::CoolMasterSinnoh),
            "Beauty (Sinnoh) Ribbon" => Some(Self::BeautySinnoh),
            "Beauty Great (Sinnoh) Ribbon" => Some(Self::BeautyGreatSinnoh),
            "Beauty Ultra (Sinnoh) Ribbon" => Some(Self::BeautyUltraSinnoh),
            "Beauty Master (Sinnoh) Ribbon" => Some(Self::BeautyMasterSinnoh),
            "Cute (Sinnoh) Ribbon" => Some(Self::CuteSinnoh),
            "Cute Great (Sinnoh) Ribbon" => Some(Self::CuteGreatSinnoh),
            "Cute Ultra (Sinnoh) Ribbon" => Some(Self::CuteUltraSinnoh),
            "Cute Master (Sinnoh) Ribbon" => Some(Self::CuteMasterSinnoh),
            "Smart (Sinnoh) Ribbon" => Some(Self::SmartSinnoh),
            "Smart Great (Sinnoh) Ribbon" => Some(Self::SmartGreatSinnoh),
            "Smart Ultra (Sinnoh) Ribbon" => Some(Self::SmartUltraSinnoh),
            "Smart Master (Sinnoh) Ribbon" => Some(Self::SmartMasterSinnoh),
            "Tough (Sinnoh) Ribbon" => Some(Self::ToughSinnoh),
            "Tough Great (Sinnoh) Ribbon" => Some(Self::ToughGreatSinnoh),
            "Tough Ultra (Sinnoh) Ribbon" => Some(Self::ToughUltraSinnoh),
            "Tough Master (Sinnoh) Ribbon" => Some(Self::ToughMasterSinnoh),
            _ => None,
        }
    }
    const fn get_index(self) -> usize {
        self as usize
    }
}

impl Display for ObsoleteRibbon {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.get_name())
    }
}

impl From<usize> for ObsoleteRibbon {
    fn from(value: usize) -> Self {
        match value {
            0 => ObsoleteRibbon::Winning,
            1 => ObsoleteRibbon::Victory,
            2 => ObsoleteRibbon::Ability,
            3 => ObsoleteRibbon::GreatAbility,
            4 => ObsoleteRibbon::DoubleAbility,
            5 => ObsoleteRibbon::MultiAbility,
            6 => ObsoleteRibbon::PairAbility,
            7 => ObsoleteRibbon::WorldAbility,
            8 => ObsoleteRibbon::CoolHoenn,
            9 => ObsoleteRibbon::CoolSuperHoenn,
            10 => ObsoleteRibbon::CoolHyperHoenn,
            11 => ObsoleteRibbon::CoolMasterHoenn,
            12 => ObsoleteRibbon::BeautyHoenn,
            13 => ObsoleteRibbon::BeautySuperHoenn,
            14 => ObsoleteRibbon::BeautyHyperHoenn,
            15 => ObsoleteRibbon::BeautyMasterHoenn,
            16 => ObsoleteRibbon::CuteHoenn,
            17 => ObsoleteRibbon::CuteSuperHoenn,
            18 => ObsoleteRibbon::CuteHyperHoenn,
            19 => ObsoleteRibbon::CuteMasterHoenn,
            20 => ObsoleteRibbon::SmartHoenn,
            21 => ObsoleteRibbon::SmartSuperHoenn,
            22 => ObsoleteRibbon::SmartHyperHoenn,
            23 => ObsoleteRibbon::SmartMasterHoenn,
            24 => ObsoleteRibbon::ToughHoenn,
            25 => ObsoleteRibbon::ToughSuperHoenn,
            26 => ObsoleteRibbon::ToughHyperHoenn,
            27 => ObsoleteRibbon::ToughMasterHoenn,
            28 => ObsoleteRibbon::CoolSinnoh,
            29 => ObsoleteRibbon::CoolGreatSinnoh,
            30 => ObsoleteRibbon::CoolUltraSinnoh,
            31 => ObsoleteRibbon::CoolMasterSinnoh,
            32 => ObsoleteRibbon::BeautySinnoh,
            33 => ObsoleteRibbon::BeautyGreatSinnoh,
            34 => ObsoleteRibbon::BeautyUltraSinnoh,
            35 => ObsoleteRibbon::BeautyMasterSinnoh,
            36 => ObsoleteRibbon::CuteSinnoh,
            37 => ObsoleteRibbon::CuteGreatSinnoh,
            38 => ObsoleteRibbon::CuteUltraSinnoh,
            39 => ObsoleteRibbon::CuteMasterSinnoh,
            40 => ObsoleteRibbon::SmartSinnoh,
            41 => ObsoleteRibbon::SmartGreatSinnoh,
            42 => ObsoleteRibbon::SmartUltraSinnoh,
            43 => ObsoleteRibbon::SmartMasterSinnoh,
            44 => ObsoleteRibbon::ToughSinnoh,
            45 => ObsoleteRibbon::ToughGreatSinnoh,
            46 => ObsoleteRibbon::ToughUltraSinnoh,
            47 => ObsoleteRibbon::ToughMasterSinnoh,
            _ => panic!("Invalid value for ObsoleteRibbon: {}", value),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize)]
pub enum OpenHomeRibbon {
    Mod(ModernRibbon),
    Obs(ObsoleteRibbon),
}

impl OpenHomeRibbon {
    pub fn get_name(&self) -> &'static str {
        match self {
            Self::Mod(modern_ribbon) => modern_ribbon.get_name(),
            Self::Obs(obsolete_ribbon) => obsolete_ribbon.get_name(),
        }
    }

    pub fn from_name<S: AsRef<str>>(name: S) -> Option<Self> {
        ObsoleteRibbon::from_name(name.as_ref())
            .map(Self::Obs)
            .or(ModernRibbon::from_name(name.as_ref()).map(Self::Mod))
    }
}

impl Display for OpenHomeRibbon {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&match self {
            OpenHomeRibbon::Mod(ribbon) => ribbon.to_string(),
            OpenHomeRibbon::Obs(ribbon) => ribbon.to_string(),
        })
    }
}

const OBSOLETE_RIBBON_BYTES: usize = 6;

#[derive(Default, Debug, Clone, Copy)]
pub struct OpenHomeRibbonSet<const MODERN_BYTE_COUNT: usize> {
    obsolete: ObsoleteRibbonSet,
    modern: ModernRibbonSet<MODERN_BYTE_COUNT>,
}

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    // Multiple arguments too!
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}

impl<const MODERN_BYTE_COUNT: usize> OpenHomeRibbonSet<MODERN_BYTE_COUNT> {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, Box<dyn Error>> {
        let byte_len = bytes.len();
        if byte_len < OBSOLETE_RIBBON_BYTES + MODERN_BYTE_COUNT {
            return Err(format!(
                "OpenHome ribbon flag byte length must be at least {} (received {byte_len})",
                OBSOLETE_RIBBON_BYTES + MODERN_BYTE_COUNT
            )
            .into());
        }

        Ok(Self {
            obsolete: ObsoleteRibbonSet::from_bytes(
                bytes[0..OBSOLETE_RIBBON_BYTES].try_into().unwrap(),
            ),
            modern: ModernRibbonSet::from_bytes(
                bytes[OBSOLETE_RIBBON_BYTES..OBSOLETE_RIBBON_BYTES + MODERN_BYTE_COUNT]
                    .try_into()
                    .unwrap(),
            ),
        })
    }

    pub fn from_names(names: Vec<String>) -> Self {
        names
            .iter()
            .map(|s| s.strip_suffix(" Ribbon").unwrap_or(s))
            .filter_map(OpenHomeRibbon::from_name)
            .collect()
    }

    pub fn from_obsolete(obsolete: ObsoleteRibbonSet) -> Self {
        Self {
            modern: ModernRibbonSet::<MODERN_BYTE_COUNT>::default(),
            obsolete,
        }
    }

    pub fn from_modern<const M: usize>(modern: ModernRibbonSet<M>) -> Self {
        Self {
            modern: modern.truncate_to::<MODERN_BYTE_COUNT>(),
            obsolete: ObsoleteRibbonSet::default(),
        }
    }

    pub fn to_vec(&self) -> Vec<OpenHomeRibbon> {
        self.get_obsolete()
            .into_iter()
            .map(OpenHomeRibbon::Obs)
            .chain(self.get_modern().into_iter().map(OpenHomeRibbon::Mod))
            .collect()
    }

    pub fn to_bytes(self) -> Vec<u8> {
        let mut bytes: Vec<u8> = vec![0; OBSOLETE_RIBBON_BYTES + MODERN_BYTE_COUNT];
        bytes[0..OBSOLETE_RIBBON_BYTES].copy_from_slice(&self.obsolete.to_bytes());
        bytes[OBSOLETE_RIBBON_BYTES..OBSOLETE_RIBBON_BYTES + MODERN_BYTE_COUNT]
            .copy_from_slice(&self.modern.to_bytes());

        bytes
    }

    pub const fn clear_ribbons(&mut self) {
        self.obsolete.clear_ribbons();
        self.modern.clear_ribbons();
    }

    pub fn add_ribbon(&mut self, ribbon: OpenHomeRibbon) {
        match ribbon {
            OpenHomeRibbon::Mod(ribbon) => self.modern.add_ribbon(ribbon),
            OpenHomeRibbon::Obs(ribbon) => self.obsolete.add_ribbon(ribbon),
        }
    }

    pub fn add_ribbons(&mut self, ribbons: Vec<OpenHomeRibbon>) {
        ribbons
            .into_iter()
            .for_each(|ribbon| self.add_ribbon(ribbon));
    }

    pub fn with_ribbons(mut self, ribbons: Vec<OpenHomeRibbon>) -> Self {
        self.add_ribbons(ribbons);
        self
    }

    pub fn set_modern_ribbons(&mut self, ribbons: Vec<ModernRibbon>) {
        self.modern.set_ribbons(ribbons);
    }

    pub fn get_modern(&self) -> Vec<ModernRibbon> {
        self.modern.get_ribbons()
    }

    pub fn get_modern_not_past(&self, max_ribbon: ModernRibbon) -> Vec<ModernRibbon> {
        self.modern
            .get_ribbons()
            .into_iter()
            .take_while(|ribbon| ribbon.get_index() <= max_ribbon.get_index())
            .collect()
    }

    pub fn get_obsolete(&self) -> Vec<ObsoleteRibbon> {
        self.obsolete.get_ribbons()
    }
}

impl<const N: usize> Serialize for OpenHomeRibbonSet<N> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.to_vec().serialize(serializer)
    }
}

impl<const N: usize> FromIterator<OpenHomeRibbon> for OpenHomeRibbonSet<N> {
    fn from_iter<T: IntoIterator<Item = OpenHomeRibbon>>(iter: T) -> Self {
        Self::default().with_ribbons(iter.into_iter().collect())
    }
}

impl<const N: usize> IntoIterator for OpenHomeRibbonSet<N> {
    type Item = OpenHomeRibbon;
    type IntoIter = std::vec::IntoIter<Self::Item>;

    fn into_iter(self) -> Self::IntoIter {
        self.to_vec().into_iter()
    }
}
