use pkm_rs_types::{NationalDex, PkmType};
use serde::Serialize;
use strum::EnumIter;
use strum::IntoEnumIterator;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_resources::species::NatDexIndex;

#[cfg(feature = "randomize")]
use rand::seq::IteratorRandom;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, EnumIter)]
pub enum ExtraFormIndex {
    /* Cosplay Pikachu */
    PikachuRockStar = 1,
    PikachuBelle,
    PikachuPopStar,
    PikachuPhD,
    PikachuLibre,
    PikachuCosplay,

    /* Radical Red/Unbound */
    PikachuSurfing,
    PikachuFlying,

    /* Gigantamax forms are treated as extra forms in some ROM hacks */
    CharizardGiga,
    ButterfreeGiga,
    PikachuGiga,
    MeowthGiga,
    MachampGiga,
    GengarGiga,
    KinglerGiga,
    LaprasGiga,
    EeveeGiga,
    SnorlaxGiga,
    GarbodorGiga,
    MelmetalGiga,
    CorviknightGiga,
    OrbeetleGiga,
    DrednawGiga,
    CoalossalGiga,
    FlappleGiga,
    AppletunGiga,
    SandacondaGiga,
    ToxtricityGiga,
    ToxtricityLowKeyGiga,
    CentiskorchGiga,
    HattereneGiga,
    GrimmsnarlGiga,
    AlcremieGiga,
    CopperajahGiga,
    DuraludonGiga,

    VenusaurGiga,
    BlastoiseGiga,
    RillaboomGiga,
    CinderaceGiga,
    InteleonGiga,
    UrsifuSingleGiga,
    UrsifuRapidGiga,

    EternatusEternamax,

    /* Luminescent */
    VenusaurClone,
    CharizardClone,
    BlastoiseClone,
    PikachuClone,

    EeveeBandana,
    GengarStitched,
    OnixCrystal,

    MewtwoArmorMk1,
    MewtwoArmorMk2,

    /* Radical Red */
    DoduoSevii,
    DodrioSevii,
    TeddiursaSevii,
    UrsaringSevii,
    MantykeSevii,
    MantineSevii,
    FeebasSevii,
    MiloticSevii,
    CarnivineSevii,
    BlitzleSevii,
    ZebstrikaSevii,
    ClauncherSevii,
    ClawitzerSevii,
    NoibatSevii,
    NoivernSevii,
    WishiwashiSevii,
    WishiwashiSeviiSchool,
    DhelmiseSevii,
    SizzlipedeSevii,
    CentiskorchSevii,
    CentiskorchSeviiGiga,
    NymbleSevii,
    LokixSevii,

    DialgaPrimal,
}

impl ExtraFormIndex {
    const fn is_cosplay_pikachu_form(&self) -> bool {
        matches!(
            self,
            Self::PikachuRockStar
                | Self::PikachuBelle
                | Self::PikachuPopStar
                | Self::PikachuPhD
                | Self::PikachuLibre
                | Self::PikachuCosplay
        )
    }

    pub const fn in_oras(&self) -> bool {
        self.is_cosplay_pikachu_form()
    }

    const fn is_sevii_form(&self) -> bool {
        matches!(
            self,
            Self::DoduoSevii
                | Self::DodrioSevii
                | Self::TeddiursaSevii
                | Self::UrsaringSevii
                | Self::MantykeSevii
                | Self::MantineSevii
                | Self::FeebasSevii
                | Self::MiloticSevii
                | Self::CarnivineSevii
                | Self::BlitzleSevii
                | Self::ZebstrikaSevii
                | Self::ClauncherSevii
                | Self::ClawitzerSevii
                | Self::NoibatSevii
                | Self::NoivernSevii
                | Self::WishiwashiSevii
                | Self::WishiwashiSeviiSchool
                | Self::DhelmiseSevii
                | Self::SizzlipedeSevii
                | Self::CentiskorchSevii
                | Self::CentiskorchSeviiGiga
                | Self::NymbleSevii
                | Self::LokixSevii
        )
    }

    pub const fn in_radical_red(&self) -> bool {
        self.is_sevii_form()
            || self.is_cosplay_pikachu_form()
            || matches!(
                self,
                Self::PikachuSurfing
                    | Self::PikachuFlying
                    | Self::ButterfreeGiga
                    | Self::MachampGiga
                    | Self::KinglerGiga
                    | Self::LaprasGiga
                    | Self::SnorlaxGiga
                    | Self::GarbodorGiga
                    | Self::OrbeetleGiga
                    | Self::DrednawGiga
                    | Self::CoalossalGiga
                    | Self::FlappleGiga
                    | Self::AppletunGiga
                    | Self::SandacondaGiga
                    | Self::ToxtricityGiga
                    | Self::CentiskorchGiga
                    | Self::AlcremieGiga
                    | Self::CopperajahGiga
                    | Self::DialgaPrimal
                    | Self::EternatusEternamax
            )
    }

    const fn is_clone(&self) -> bool {
        matches!(
            self,
            Self::VenusaurClone | Self::CharizardClone | Self::BlastoiseClone | Self::PikachuClone
        )
    }

    pub const fn in_unbound(&self) -> bool {
        self.is_cosplay_pikachu_form()
            || matches!(
                self,
                Self::PikachuSurfing
                    | Self::PikachuFlying
                    | Self::CharizardGiga
                    | Self::ButterfreeGiga
                    | Self::PikachuGiga
                    | Self::MeowthGiga
                    | Self::MachampGiga
                    | Self::GengarGiga
                    | Self::KinglerGiga
                    | Self::LaprasGiga
                    | Self::EeveeGiga
                    | Self::SnorlaxGiga
                    | Self::GarbodorGiga
                    | Self::MelmetalGiga
                    | Self::CorviknightGiga
                    | Self::OrbeetleGiga
                    | Self::DrednawGiga
                    | Self::CoalossalGiga
                    | Self::FlappleGiga
                    | Self::AppletunGiga
                    | Self::SandacondaGiga
                    | Self::ToxtricityGiga
                    | Self::CentiskorchGiga
                    | Self::HattereneGiga
                    | Self::GrimmsnarlGiga
                    | Self::AlcremieGiga
                    | Self::CopperajahGiga
                    | Self::DuraludonGiga
                    | Self::VenusaurGiga
                    | Self::BlastoiseGiga
                    | Self::RillaboomGiga
                    | Self::CinderaceGiga
                    | Self::InteleonGiga
                    | Self::UrsifuSingleGiga
                    | Self::UrsifuRapidGiga
                    | Self::EternatusEternamax
            )
    }

    pub const fn in_luminescent(&self) -> bool {
        self.is_clone()
            || matches!(
                self,
                Self::EeveeBandana | Self::GengarStitched | Self::OnixCrystal
            )
    }

    pub fn display_name(&self) -> String {
        match self {
            Self::PikachuRockStar => "Pikachu Rock Star",
            Self::PikachuBelle => "Pikachu Belle",
            Self::PikachuPopStar => "Pikachu Pop Star",
            Self::PikachuPhD => "Pikachu PhD",
            Self::PikachuLibre => "Pikachu Libre",
            Self::PikachuCosplay => "Pikachu Cosplay",

            Self::PikachuSurfing => "Surfing Pikachu",
            Self::PikachuFlying => "Flying Pikachu",

            Self::CharizardGiga => "Gigantamax Charizard",
            Self::ButterfreeGiga => "Gigantamax Butterfree",
            Self::PikachuGiga => "Gigantamax Pikachu",
            Self::MeowthGiga => "Gigantamax Meowth",
            Self::MachampGiga => "Gigantamax Machamp",
            Self::GengarGiga => "Gigantamax Gengar",
            Self::KinglerGiga => "Gigantamax Kingler",
            Self::LaprasGiga => "Gigantamax Lapras",
            Self::EeveeGiga => "Gigantamax Eevee",
            Self::SnorlaxGiga => "Gigantamax Snorlax",
            Self::GarbodorGiga => "Gigantamax Garbodor",
            Self::MelmetalGiga => "Gigantamax Melmetal",
            Self::CorviknightGiga => "Gigantamax Corviknight",
            Self::OrbeetleGiga => "Gigantamax Orbeetle",
            Self::DrednawGiga => "Gigantamax Drednaw",
            Self::CoalossalGiga => "Gigantamax Coalossal",
            Self::FlappleGiga => "Gigantamax Flapple",
            Self::AppletunGiga => "Gigantamax Appletun",
            Self::SandacondaGiga => "Gigantamax Sandaconda",
            Self::ToxtricityGiga => "Gigantamax Toxtricity",
            Self::ToxtricityLowKeyGiga => "Gigantamax Toxtricity (Low Key)",
            Self::CentiskorchGiga => "Gigantamax Centiskorch",
            Self::HattereneGiga => "Gigantamax Hatterene",
            Self::GrimmsnarlGiga => "Gigantamax Grimmsnarl",
            Self::AlcremieGiga => "Gigantamax Alcremie",
            Self::CopperajahGiga => "Gigantamax Copperajah",
            Self::DuraludonGiga => "Gigantamax Duraludon",

            Self::VenusaurGiga => "Gigantamax Venusaur",
            Self::BlastoiseGiga => "Gigantamax Blastoise",
            Self::RillaboomGiga => "Gigantamax Rillaboom",
            Self::CinderaceGiga => "Gigantamax Cinderace",
            Self::InteleonGiga => "Gigantamax Inteleon",
            Self::UrsifuSingleGiga => "Gigantamax Urshifu (Single Strike)",
            Self::UrsifuRapidGiga => "Gigantamax Urshifu (Rapid Strike)",

            Self::EternatusEternamax => "Eternatus Eternamax",

            Self::VenusaurClone => "Clone Venusaur",
            Self::CharizardClone => "Clone Charizard",
            Self::BlastoiseClone => "Clone Blastoise",
            Self::PikachuClone => "Clone Pikachu",

            Self::EeveeBandana => "Bandana Eevee",
            Self::GengarStitched => "Stitched Gengar",
            Self::OnixCrystal => "Crystal Onix",

            Self::MewtwoArmorMk1 => "Mk I Armored Mewtwo",
            Self::MewtwoArmorMk2 => "Mk II Armored Mewtwo",

            Self::DoduoSevii => "Seviian Doduo",
            Self::DodrioSevii => "Seviian Dodrio",
            Self::TeddiursaSevii => "Seviian Teddiursa",
            Self::UrsaringSevii => "Seviian Ursaring",
            Self::MantykeSevii => "Seviian Mantyke",
            Self::MantineSevii => "Seviian Mantine",
            Self::FeebasSevii => "Seviian Feebas",
            Self::MiloticSevii => "Seviian Milotic",
            Self::CarnivineSevii => "Seviian Carnivine",
            Self::BlitzleSevii => "Seviian Blitzle",
            Self::ZebstrikaSevii => "Seviian Zebstrika",
            Self::ClauncherSevii => "Seviian Clauncher",
            Self::ClawitzerSevii => "Seviian Clawitzer",
            Self::NoibatSevii => "Seviian Noibat",
            Self::NoivernSevii => "Seviian Noivern",
            Self::WishiwashiSevii => "Seviian Wishiwashi",
            Self::WishiwashiSeviiSchool => "Seviian Wishiwashi (School Form)",
            Self::DhelmiseSevii => "Seviian Dhelmise",
            Self::SizzlipedeSevii => "Seviian Sizzlipede",
            Self::CentiskorchSevii => "Seviian Centiskorch",
            Self::CentiskorchSeviiGiga => "Gigantamax Seviian Centiskorch",
            Self::NymbleSevii => "Seviian Nymble",
            Self::LokixSevii => "Seviian Lokix",

            Self::DialgaPrimal => "Primal Dialga",
        }
        .to_owned()
    }

    pub fn sprite_name(&self) -> Option<String> {
        Some(
            match self {
                Self::PikachuRockStar => "pikachu-rock-star",
                Self::PikachuBelle => "pikachu-belle",
                Self::PikachuPopStar => "pikachu-pop-star",
                // Self::PikachuPhD => "pikachu-phd",
                Self::PikachuLibre => "pikachu-libre",
                Self::PikachuCosplay => "pikachu-cosplay",
                // Self::PikachuSurfing => "pikachu-surfing",
                Self::PikachuFlying => "pikachu-flying",
                // Self::CharizardGiga => "charizard-gigantamax",
                // Self::ButterfreeGiga => "butterfree-gigantamax",
                // Self::PikachuGiga => "pikachu-gigantamax",
                // Self::MeowthGiga => "meowth-gigantamax",
                // Self::MachampGiga => "machamp-gigantamax",
                // Self::GengarGiga => "gengar-gigantamax",
                // Self::KinglerGiga => "kingler-gigantamax",
                // Self::LaprasGiga => "lapras-gigantamax",
                // Self::EeveeGiga => "eevee-gigantamax",
                // Self::SnorlaxGiga => "snorlax-gigantamax",
                // Self::GarbodorGiga => "garbodor-gigantamax",
                // Self::MelmetalGiga => "melmetal-gigantamax",
                // Self::CorviknightGiga => "corviknight-gigantamax",
                // Self::OrbeetleGiga => "orbeetle-gigantamax",
                // Self::DrednawGiga => "drednaw-gigantamax",
                // Self::CoalossalGiga => "coalossal-gigantamax",
                // Self::FlappleGiga => "flapple-gigantamax",
                // Self::AppletunGiga => "appletun-gigantamax",
                // Self::SandacondaGiga => "sandaconda-gigantamax",
                // Self::ToxtricityGiga => "toxtricity-gigantamax",
                // Self::ToxtricityLowKeyGiga => "toxtricity-low-key-gigantamax",
                // Self::CentiskorchGiga => "centiskorch-gigantamax",
                // Self::HattereneGiga => "hatterene-gigantamax",
                // Self::GrimmsnarlGiga => "grimmsnarl-gigantamax",
                // Self::AlcremieGiga => "alcremie-gigantamax",
                // Self::CopperajahGiga => "copperajah-gigantamax",
                // Self::DuraludonGiga => "duraludon-gigantamax",
                // Self::VenusaurGiga => "venusaur-gigantamax",
                // Self::BlastoiseGiga => "blastoise-gigantamax",
                // Self::RillaboomGiga => "rillaboom-gigantamax",
                // Self::CinderaceGiga => "cinderace-gigantamax",
                // Self::InteleonGiga => "inteleon-gigantamax",
                // Self::UrsifuSingleGiga => "urshifu-single-strike-gigantamax",
                // Self::UrsifuRapidGiga => "urshifu-rapid-strike-gigantamax",
                // Self::EternatusEternamax => "eternatus-eternamax",
                Self::VenusaurClone => "venusaur-clone",
                Self::CharizardClone => "charizard-clone",
                Self::BlastoiseClone => "blastoise-clone",
                Self::PikachuClone => "pikachu-clone",
                Self::EeveeBandana => "eevee-bandana",
                Self::GengarStitched => "gengar-stitched",
                Self::OnixCrystal => "onix-crystal",
                Self::MewtwoArmorMk1 => "mewtwo-armor-mk1",
                Self::MewtwoArmorMk2 => "mewtwo-armor-mk2",

                Self::DoduoSevii => "doduo-sevii",
                Self::DodrioSevii => "dodrio-sevii",
                Self::TeddiursaSevii => "teddiursa-sevii",
                Self::UrsaringSevii => "ursaring-sevii",
                Self::MantykeSevii => "mantyke-sevii",
                Self::MantineSevii => "mantine-sevii",
                Self::FeebasSevii => "feebas-sevii",
                Self::MiloticSevii => "milotic-sevii",
                Self::CarnivineSevii => "carnivine-sevii",
                Self::BlitzleSevii => "blitzle-sevii",
                Self::ZebstrikaSevii => "zebstrika-sevii",
                Self::ClauncherSevii => "clauncher-sevii",
                Self::ClawitzerSevii => "clawitzer-sevii",
                Self::NoibatSevii => "noibat-sevii",
                Self::NoivernSevii => "noivern-sevii",
                Self::WishiwashiSevii => "wishiwashi-sevii",
                Self::WishiwashiSeviiSchool => "wishiwashi-sevii-school",
                Self::DhelmiseSevii => "dhelmise-sevii",
                Self::SizzlipedeSevii => "sizzlipede-sevii",
                Self::CentiskorchSevii => "centiskorch-sevii",
                Self::CentiskorchSeviiGiga => "centiskorch-sevii-gigantamax",
                Self::NymbleSevii => "nymble-sevii",
                Self::LokixSevii => "lokix-sevii",

                // Self::DialgaPrimal => "dialga-primal",
                _ => return None,
            }
            .to_owned(),
        )
    }

    pub const fn type_overrides(&self) -> Option<(PkmType, Option<PkmType>)> {
        match self {
            Self::MantykeSevii | Self::MantineSevii => {
                Some((PkmType::Electric, Some(PkmType::Poison)))
            }
            Self::NymbleSevii | Self::LokixSevii => Some((PkmType::Bug, Some(PkmType::Dragon))),
            _ => None,
        }
    }

    pub const fn national_dex(&self) -> NationalDex {
        match self {
            Self::VenusaurClone | Self::VenusaurGiga => NationalDex::Venusaur,
            Self::CharizardClone | Self::CharizardGiga => NationalDex::Charizard,
            Self::BlastoiseClone | Self::BlastoiseGiga => NationalDex::Blastoise,
            Self::PikachuRockStar
            | Self::PikachuBelle
            | Self::PikachuPopStar
            | Self::PikachuPhD
            | Self::PikachuLibre
            | Self::PikachuCosplay
            | Self::PikachuSurfing
            | Self::PikachuFlying
            | Self::PikachuGiga
            | Self::PikachuClone => NationalDex::Pikachu,
            Self::ButterfreeGiga => NationalDex::Butterfree,
            Self::MeowthGiga => NationalDex::Meowth,
            Self::MachampGiga => NationalDex::Machamp,
            Self::DoduoSevii => NationalDex::Doduo,
            Self::DodrioSevii => NationalDex::Dodrio,
            Self::GengarGiga | Self::GengarStitched => NationalDex::Gengar,
            Self::OnixCrystal => NationalDex::Onix,
            Self::KinglerGiga => NationalDex::Kingler,
            Self::LaprasGiga => NationalDex::Lapras,
            Self::EeveeGiga | Self::EeveeBandana => NationalDex::Eevee,
            Self::SnorlaxGiga => NationalDex::Snorlax,
            Self::MewtwoArmorMk1 | Self::MewtwoArmorMk2 => NationalDex::Mewtwo,
            Self::TeddiursaSevii => NationalDex::Teddiursa,
            Self::UrsaringSevii => NationalDex::Ursaring,
            Self::MantineSevii => NationalDex::Mantine,
            Self::FeebasSevii => NationalDex::Feebas,
            Self::MiloticSevii => NationalDex::Milotic,
            Self::CarnivineSevii => NationalDex::Carnivine,
            Self::MantykeSevii => NationalDex::Mantyke,
            Self::DialgaPrimal => NationalDex::Dialga,
            Self::BlitzleSevii => NationalDex::Blitzle,
            Self::ZebstrikaSevii => NationalDex::Zebstrika,
            Self::GarbodorGiga => NationalDex::Garbodor,
            Self::ClauncherSevii => NationalDex::Clauncher,
            Self::ClawitzerSevii => NationalDex::Clawitzer,
            Self::NoibatSevii => NationalDex::Noibat,
            Self::NoivernSevii => NationalDex::Noivern,
            Self::WishiwashiSevii | Self::WishiwashiSeviiSchool => NationalDex::Wishiwashi,
            Self::DhelmiseSevii => NationalDex::Dhelmise,
            Self::MelmetalGiga => NationalDex::Melmetal,
            Self::CorviknightGiga => NationalDex::Corviknight,
            Self::OrbeetleGiga => NationalDex::Orbeetle,
            Self::DrednawGiga => NationalDex::Drednaw,
            Self::CoalossalGiga => NationalDex::Coalossal,
            Self::FlappleGiga => NationalDex::Flapple,
            Self::AppletunGiga => NationalDex::Appletun,
            Self::SandacondaGiga => NationalDex::Sandaconda,
            Self::ToxtricityGiga | Self::ToxtricityLowKeyGiga => NationalDex::Toxtricity,
            Self::SizzlipedeSevii => NationalDex::Sizzlipede,
            Self::CentiskorchGiga | Self::CentiskorchSevii | Self::CentiskorchSeviiGiga => {
                NationalDex::Centiskorch
            }
            Self::HattereneGiga => NationalDex::Hatterene,
            Self::GrimmsnarlGiga => NationalDex::Grimmsnarl,
            Self::AlcremieGiga => NationalDex::Alcremie,
            Self::CopperajahGiga => NationalDex::Copperajah,
            Self::DuraludonGiga => NationalDex::Duraludon,
            Self::RillaboomGiga => NationalDex::Rillaboom,
            Self::CinderaceGiga => NationalDex::Cinderace,
            Self::InteleonGiga => NationalDex::Inteleon,
            Self::EternatusEternamax => NationalDex::Eternatus,
            Self::UrsifuSingleGiga | Self::UrsifuRapidGiga => NationalDex::Urshifu,
            Self::NymbleSevii => NationalDex::Nymble,
            Self::LokixSevii => NationalDex::Lokix,
        }
    }

    pub fn all_by_national_dex(national_dex: NationalDex) -> Vec<Self> {
        Self::iter()
            .filter(|form: &ExtraFormIndex| form.national_dex() == national_dex)
            .collect()
    }
}

#[cfg(feature = "randomize")]
impl ExtraFormIndex {
    pub fn randomized_for_national_dex<R: rand::Rng>(
        national_dex: NatDexIndex,
        rng: &mut R,
    ) -> Option<Self> {
        Self::all_by_national_dex(national_dex.into())
            .into_iter()
            .choose(rng)
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "orasFormIndexIfSupported")]
#[allow(clippy::missing_const_for_fn)]
pub fn oras_form_index_if_supported(form: ExtraFormIndex) -> Option<u16> {
    match form {
        ExtraFormIndex::PikachuRockStar => Some(1),
        ExtraFormIndex::PikachuBelle => Some(2),
        ExtraFormIndex::PikachuPopStar => Some(3),
        ExtraFormIndex::PikachuPhD => Some(4),
        ExtraFormIndex::PikachuLibre => Some(5),
        ExtraFormIndex::PikachuCosplay => Some(6),
        _ => None,
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "extraFormIndexFromOrasPikachu")]
#[allow(clippy::missing_const_for_fn)]
pub fn extra_form_index_from_oras_pikachu(oras_index: u16) -> Option<ExtraFormIndex> {
    match oras_index {
        1 => Some(ExtraFormIndex::PikachuRockStar),
        2 => Some(ExtraFormIndex::PikachuBelle),
        3 => Some(ExtraFormIndex::PikachuPopStar),
        4 => Some(ExtraFormIndex::PikachuPhD),
        5 => Some(ExtraFormIndex::PikachuLibre),
        6 => Some(ExtraFormIndex::PikachuCosplay),
        _ => None,
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "radicalRedSupportsExtraForm")]
#[allow(clippy::missing_const_for_fn)]
pub fn radical_red_supports_extra_form(form: ExtraFormIndex) -> bool {
    form.in_radical_red()
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "isSeviiForm")]
#[allow(clippy::missing_const_for_fn)]
pub fn is_sevii_form(form: ExtraFormIndex) -> bool {
    form.is_sevii_form()
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "unboundSupportsExtraForm")]
#[allow(clippy::missing_const_for_fn)]
pub fn unbound_supports_extra_form(form: ExtraFormIndex) -> bool {
    form.in_unbound()
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "luminescentSupportsExtraForm")]
#[allow(clippy::missing_const_for_fn)]
pub fn luminescent_supports_extra_form(form: ExtraFormIndex) -> bool {
    form.in_luminescent()
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "extraFormDisplayName")]
pub fn extra_form_display_name(form: ExtraFormIndex) -> String {
    form.display_name()
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "extraFormSpriteName")]
pub fn extra_form_sprite_name(form: ExtraFormIndex) -> Option<String> {
    form.sprite_name()
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "extraFormTypeOverride")]
pub fn extra_form_type_override(form: ExtraFormIndex) -> Option<Vec<PkmType>> {
    match form.type_overrides() {
        Some((t1, Some(t2))) => Some(vec![t1, t2]),
        Some((t1, None)) => Some(vec![t1]),
        None => None,
    }
}

pub struct InvalidExtraFormIndex;

impl TryFrom<u64> for ExtraFormIndex {
    type Error = InvalidExtraFormIndex;

    fn try_from(value: u64) -> Result<Self, Self::Error> {
        match value {
            1 => Ok(Self::PikachuRockStar),
            2 => Ok(Self::PikachuBelle),
            3 => Ok(Self::PikachuPopStar),
            4 => Ok(Self::PikachuPhD),
            5 => Ok(Self::PikachuLibre),
            6 => Ok(Self::PikachuCosplay),
            7 => Ok(Self::PikachuSurfing),
            8 => Ok(Self::PikachuFlying),
            9 => Ok(Self::CharizardGiga),
            10 => Ok(Self::ButterfreeGiga),
            11 => Ok(Self::PikachuGiga),
            12 => Ok(Self::MeowthGiga),
            13 => Ok(Self::MachampGiga),
            14 => Ok(Self::GengarGiga),
            15 => Ok(Self::KinglerGiga),
            16 => Ok(Self::LaprasGiga),
            17 => Ok(Self::EeveeGiga),
            18 => Ok(Self::SnorlaxGiga),
            19 => Ok(Self::GarbodorGiga),
            20 => Ok(Self::MelmetalGiga),
            21 => Ok(Self::CorviknightGiga),
            22 => Ok(Self::OrbeetleGiga),
            23 => Ok(Self::DrednawGiga),
            24 => Ok(Self::CoalossalGiga),
            25 => Ok(Self::FlappleGiga),
            26 => Ok(Self::AppletunGiga),
            27 => Ok(Self::SandacondaGiga),
            28 => Ok(Self::ToxtricityGiga),
            29 => Ok(Self::ToxtricityLowKeyGiga),
            30 => Ok(Self::CentiskorchGiga),
            31 => Ok(Self::HattereneGiga),
            32 => Ok(Self::GrimmsnarlGiga),
            33 => Ok(Self::AlcremieGiga),
            34 => Ok(Self::CopperajahGiga),
            35 => Ok(Self::DuraludonGiga),

            36 => Ok(Self::VenusaurGiga),
            37 => Ok(Self::BlastoiseGiga),
            38 => Ok(Self::RillaboomGiga),
            39 => Ok(Self::CinderaceGiga),
            40 => Ok(Self::InteleonGiga),
            41 => Ok(Self::UrsifuSingleGiga),
            42 => Ok(Self::UrsifuRapidGiga),
            43 => Ok(Self::EternatusEternamax),

            44 => Ok(Self::VenusaurClone),
            45 => Ok(Self::CharizardClone),
            46 => Ok(Self::BlastoiseClone),
            47 => Ok(Self::PikachuClone),

            48 => Ok(Self::EeveeBandana),
            49 => Ok(Self::GengarStitched),
            50 => Ok(Self::OnixCrystal),

            51 => Ok(Self::MewtwoArmorMk1),
            52 => Ok(Self::MewtwoArmorMk2),

            53 => Ok(Self::DoduoSevii),
            54 => Ok(Self::DodrioSevii),
            55 => Ok(Self::TeddiursaSevii),
            56 => Ok(Self::UrsaringSevii),
            57 => Ok(Self::MantykeSevii),
            58 => Ok(Self::MantineSevii),
            59 => Ok(Self::FeebasSevii),
            60 => Ok(Self::MiloticSevii),
            61 => Ok(Self::CarnivineSevii),
            62 => Ok(Self::BlitzleSevii),
            63 => Ok(Self::ZebstrikaSevii),
            64 => Ok(Self::ClauncherSevii),
            65 => Ok(Self::ClawitzerSevii),
            66 => Ok(Self::NoibatSevii),
            67 => Ok(Self::NoivernSevii),
            68 => Ok(Self::WishiwashiSevii),
            69 => Ok(Self::WishiwashiSeviiSchool),
            70 => Ok(Self::DhelmiseSevii),
            71 => Ok(Self::SizzlipedeSevii),
            72 => Ok(Self::CentiskorchSevii),
            73 => Ok(Self::CentiskorchSeviiGiga),
            74 => Ok(Self::NymbleSevii),
            75 => Ok(Self::LokixSevii),

            76 => Ok(Self::DialgaPrimal),

            _ => Err(InvalidExtraFormIndex),
        }
    }
}

impl From<ExtraFormIndex> for u64 {
    fn from(value: ExtraFormIndex) -> Self {
        value as u64
    }
}

#[test]
fn try_from_u64() {
    let mut i = 1u64;
    while let Ok(form) = ExtraFormIndex::try_from(i) {
        assert_eq!(i, form as u64);
        i += 1;
    }
}
