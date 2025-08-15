use crate::{
    resources::{ModernRibbon, ModernRibbonSet},
    substructures::FlagSet,
};
use serde::{Serialize, Serializer};
use std::{error::Error, fmt::Display};

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

    pub fn clear_ribbons(&mut self) {
        self.0.clear_all();
    }

    pub fn add_ribbon(&mut self, ribbon: ObsoleteRibbon) {
        self.0.set_index(ribbon.get_index(), true);
    }

    pub fn set_ribbons(&mut self, ribbons: Vec<ObsoleteRibbon>) {
        self.clear_ribbons();
        ribbons
            .into_iter()
            .for_each(|ribbon| self.add_ribbon(ribbon));
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

#[derive(Debug, Serialize, PartialEq, Eq, Clone, Copy)]
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

impl ObsoleteRibbon {
    fn get_name(&self) -> &'static str {
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

    fn get_index(&self) -> usize {
        match self {
            ObsoleteRibbon::Winning => 0,
            ObsoleteRibbon::Victory => 1,
            ObsoleteRibbon::Ability => 2,
            ObsoleteRibbon::GreatAbility => 3,
            ObsoleteRibbon::DoubleAbility => 4,
            ObsoleteRibbon::MultiAbility => 5,
            ObsoleteRibbon::PairAbility => 6,
            ObsoleteRibbon::WorldAbility => 7,
            ObsoleteRibbon::CoolHoenn => 8,
            ObsoleteRibbon::CoolSuperHoenn => 9,
            ObsoleteRibbon::CoolHyperHoenn => 10,
            ObsoleteRibbon::CoolMasterHoenn => 11,
            ObsoleteRibbon::BeautyHoenn => 12,
            ObsoleteRibbon::BeautySuperHoenn => 13,
            ObsoleteRibbon::BeautyHyperHoenn => 14,
            ObsoleteRibbon::BeautyMasterHoenn => 15,
            ObsoleteRibbon::CuteHoenn => 16,
            ObsoleteRibbon::CuteSuperHoenn => 17,
            ObsoleteRibbon::CuteHyperHoenn => 18,
            ObsoleteRibbon::CuteMasterHoenn => 19,
            ObsoleteRibbon::SmartHoenn => 20,
            ObsoleteRibbon::SmartSuperHoenn => 21,
            ObsoleteRibbon::SmartHyperHoenn => 22,
            ObsoleteRibbon::SmartMasterHoenn => 23,
            ObsoleteRibbon::ToughHoenn => 24,
            ObsoleteRibbon::ToughSuperHoenn => 25,
            ObsoleteRibbon::ToughHyperHoenn => 26,
            ObsoleteRibbon::ToughMasterHoenn => 27,
            ObsoleteRibbon::CoolSinnoh => 28,
            ObsoleteRibbon::CoolGreatSinnoh => 29,
            ObsoleteRibbon::CoolUltraSinnoh => 30,
            ObsoleteRibbon::CoolMasterSinnoh => 31,
            ObsoleteRibbon::BeautySinnoh => 32,
            ObsoleteRibbon::BeautyGreatSinnoh => 33,
            ObsoleteRibbon::BeautyUltraSinnoh => 34,
            ObsoleteRibbon::BeautyMasterSinnoh => 35,
            ObsoleteRibbon::CuteSinnoh => 36,
            ObsoleteRibbon::CuteGreatSinnoh => 37,
            ObsoleteRibbon::CuteUltraSinnoh => 38,
            ObsoleteRibbon::CuteMasterSinnoh => 39,
            ObsoleteRibbon::SmartSinnoh => 40,
            ObsoleteRibbon::SmartGreatSinnoh => 41,
            ObsoleteRibbon::SmartUltraSinnoh => 42,
            ObsoleteRibbon::SmartMasterSinnoh => 43,
            ObsoleteRibbon::ToughSinnoh => 44,
            ObsoleteRibbon::ToughGreatSinnoh => 45,
            ObsoleteRibbon::ToughUltraSinnoh => 46,
            ObsoleteRibbon::ToughMasterSinnoh => 47,
        }
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
    Modern(ModernRibbon),
    Obsolete(ObsoleteRibbon),
}

impl Display for OpenHomeRibbon {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&match self {
            OpenHomeRibbon::Modern(ribbon) => ribbon.to_string(),
            OpenHomeRibbon::Obsolete(ribbon) => ribbon.to_string(),
        })
    }
}

const OBSOLETE_RIBBON_BYTES: usize = 6;

#[derive(Default, Debug, Clone, Copy)]
pub struct OpenHomeRibbonSet<const MODERN_BYTE_COUNT: usize> {
    obsolete: ObsoleteRibbonSet,
    modern: ModernRibbonSet<MODERN_BYTE_COUNT>,
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

    pub fn from_modern<const M: usize>(modern: ModernRibbonSet<M>) -> Self {
        Self {
            modern: modern.truncate_to::<MODERN_BYTE_COUNT>(),
            obsolete: ObsoleteRibbonSet::default(),
        }
    }

    pub fn get_ribbons(&self) -> Vec<OpenHomeRibbon> {
        self.get_obsolete()
            .into_iter()
            .map(OpenHomeRibbon::Obsolete)
            .chain(self.get_modern().into_iter().map(OpenHomeRibbon::Modern))
            .collect()
    }

    pub fn to_bytes(self) -> Vec<u8> {
        let mut bytes: Vec<u8> = vec![0; OBSOLETE_RIBBON_BYTES + MODERN_BYTE_COUNT];
        bytes[0..OBSOLETE_RIBBON_BYTES].copy_from_slice(&self.obsolete.to_bytes());
        bytes[OBSOLETE_RIBBON_BYTES..OBSOLETE_RIBBON_BYTES + MODERN_BYTE_COUNT]
            .copy_from_slice(&self.modern.to_bytes());

        bytes
    }

    pub fn clear_ribbons(&mut self) {
        self.obsolete.clear_ribbons();
        self.modern.clear_ribbons();
    }

    pub fn add_ribbon(&mut self, ribbon: OpenHomeRibbon) {
        match ribbon {
            OpenHomeRibbon::Modern(ribbon) => self.modern.add_ribbon(ribbon),
            OpenHomeRibbon::Obsolete(ribbon) => self.obsolete.add_ribbon(ribbon),
        }
    }

    pub fn set_modern_ribbons(&mut self, ribbons: Vec<ModernRibbon>) {
        self.modern.set_ribbons(ribbons);
    }

    pub fn get_modern(&self) -> Vec<ModernRibbon> {
        self.modern.get_ribbons()
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
        self.get_ribbons().serialize(serializer)
    }
}
