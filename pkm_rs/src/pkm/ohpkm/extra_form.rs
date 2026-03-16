use serde::Serialize;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize)]
pub enum ExtraForm {
    PikachuRockStar = 1,
    PikachuBelle = 2,
    PikachuPopStar = 3,
    PikachuPhD = 4,
    PikachuLibre = 5,
    PikachuCosplay = 6,

    CharizardGiga = 7,
    ButterfreeGiga = 8,
    PikachuGiga = 9,
    MeowthGiga = 10,
    MachampGiga = 11,
    GengarGiga = 12,
    KinglerGiga = 13,
    LaprasGiga = 14,
    EeveeGiga = 15,
    SnorlaxGiga = 16,
    GarbodorGiga = 17,
    MelmetalGiga = 18,
    CorviknightGiga = 19,
    OrbeetleGiga = 20,
    DrednawGiga = 21,
    CoalossalGiga = 22,
    FlappleGiga = 23,
    AppletunGiga = 24,
    SandacondaGiga = 25,
    ToxtricityGiga = 26,
    CentiskorchGiga = 27,
    HattereneGiga = 28,
    GrimmsnarlGiga = 29,
    AlcremieGiga = 30,
    CopperajahGiga = 31,
    DuraludonGiga = 32,

    VenusaurGiga = 33,
    BlastoiseGiga = 34,
    RillaboomGiga = 35,
    CinderaceGiga = 36,
    InteleonGiga = 37,
    UrsifuSingleGiga = 38,
    UrsifuRapidGiga = 39,

    PikachuSurfing = 40,
    PikachuFlying = 41,

    GengarStitched = 42,
    OnixCrystal = 43,

    VenusaurClone = 44,
    CharizardClone = 45,
    BlastoiseClone = 46,
    PikachuClone = 47,

    MewtwoMk1 = 48,
    MewtwoMk2 = 49,

    DoduoSevii = 50,
    DodrioSevii = 51,
    TeddiursaSevii = 52,
    UrsaringSevii = 53,
    MantykeSevii = 54,
    MantineSevii = 55,
    FeebasSevii = 56,
    MiloticSevii = 57,
    CarnivineSevii = 58,
    BlitzleSevii = 59,
    ZebstrikaSevii = 60,
    ClauncherSevii = 61,
    ClawitzerSevii = 62,
    NoibatSevii = 63,
    NoivernSevii = 64,
    WishiwashiSevii = 65,
    WishiwashiSeviiSchool = 66,
    DhelmiseSevii = 67,
    SizzlipedeSevii = 68,
    CentiskorchSevii = 69,
    CentiskorchSeviiGiga = 70,
    NymbleSevii = 71,
    LokixSevii = 72,

    DialgaPrimal,
    EternatusEternamax,
}

pub struct InvalidExtraFormIndex;

impl TryFrom<u64> for ExtraForm {
    type Error = InvalidExtraFormIndex;

    fn try_from(value: u64) -> Result<Self, Self::Error> {
        match value {
            1 => Ok(Self::PikachuRockStar),
            2 => Ok(Self::PikachuBelle),
            3 => Ok(Self::PikachuPopStar),
            4 => Ok(Self::PikachuPhD),
            5 => Ok(Self::PikachuLibre),
            6 => Ok(Self::PikachuCosplay),

            7 => Ok(Self::CharizardGiga),
            8 => Ok(Self::ButterfreeGiga),
            9 => Ok(Self::PikachuGiga),
            10 => Ok(Self::MeowthGiga),
            11 => Ok(Self::MachampGiga),
            12 => Ok(Self::GengarGiga),
            13 => Ok(Self::KinglerGiga),
            14 => Ok(Self::LaprasGiga),
            15 => Ok(Self::EeveeGiga),
            16 => Ok(Self::SnorlaxGiga),
            17 => Ok(Self::GarbodorGiga),
            18 => Ok(Self::MelmetalGiga),
            19 => Ok(Self::CorviknightGiga),
            20 => Ok(Self::OrbeetleGiga),
            21 => Ok(Self::DrednawGiga),
            22 => Ok(Self::CoalossalGiga),
            23 => Ok(Self::FlappleGiga),
            24 => Ok(Self::AppletunGiga),
            25 => Ok(Self::SandacondaGiga),
            26 => Ok(Self::ToxtricityGiga),
            27 => Ok(Self::CentiskorchGiga),
            28 => Ok(Self::HattereneGiga),
            29 => Ok(Self::GrimmsnarlGiga),
            30 => Ok(Self::AlcremieGiga),
            31 => Ok(Self::CopperajahGiga),
            32 => Ok(Self::DuraludonGiga),

            33 => Ok(Self::VenusaurGiga),
            34 => Ok(Self::BlastoiseGiga),
            35 => Ok(Self::RillaboomGiga),
            36 => Ok(Self::CinderaceGiga),
            37 => Ok(Self::InteleonGiga),
            38 => Ok(Self::UrsifuSingleGiga),
            39 => Ok(Self::UrsifuRapidGiga),
            40 => Ok(Self::PikachuSurfing),
            41 => Ok(Self::PikachuFlying),
            42 => Ok(Self::GengarStitched),
            43 => Ok(Self::OnixCrystal),
            44 => Ok(Self::VenusaurClone),
            45 => Ok(Self::CharizardClone),
            46 => Ok(Self::BlastoiseClone),
            47 => Ok(Self::PikachuClone),
            48 => Ok(Self::MewtwoMk1),
            49 => Ok(Self::MewtwoMk2),
            _ => Err(InvalidExtraFormIndex),
        }
    }
}

impl From<ExtraForm> for u64 {
    fn from(value: ExtraForm) -> Self {
        value as u64
    }
}

#[test]
fn try_from_u64() {
    let mut i = 1u64;
    while let Ok(form) = ExtraForm::try_from(i) {
        assert_eq!(i, form as u64);
        i += 1;
    }
}
