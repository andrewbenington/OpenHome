use serde::Serialize;
use std::num::NonZeroU8;

use pkm_rs_types::NationalDex;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
#[cfg(feature = "randomize")]
use rand::RngExt;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify, serde::Serialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi))]
#[derive(Debug, Clone, Copy, Default)]
pub enum Purification {
    #[default]
    Purified,
    ShadowGauge(i32),
}

const MAX_PURIFICATION_VALUE: i32 = 20000; // Colosseum Metagross

impl Purification {
    const PURIFIED_VALUE: i32 = -100;

    pub const fn from_i32(v: i32) -> Result<Self, BadShadowData> {
        match v {
            Self::PURIFIED_VALUE => Ok(Self::Purified),
            0..=MAX_PURIFICATION_VALUE => Ok(Self::ShadowGauge(v)),
            other => Err(BadShadowData::Purification(other)),
        }
    }

    pub const fn to_i32(&self) -> i32 {
        match self {
            Self::Purified => Self::PURIFIED_VALUE,
            Self::ShadowGauge(gauge) => *gauge,
        }
    }
}

#[derive(thiserror::Error, Debug, Clone, Copy)]
pub enum BadShadowData {
    #[error("invalid purification value {0} (expected -100, or [0, {MAX_PURIFICATION_VALUE}])")]
    Purification(i32),
    #[error("value {0} is not a valid Pokémon Colosseum shadow id")]
    ColosseumShadowId(u16),
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, Serialize)]
pub struct ShadowIdColosseum(NonZeroU8);

impl ShadowIdColosseum {
    pub fn by_ndex(national_dex: NationalDex) -> Option<Self> {
        Self::ndex_to_raw(national_dex)
            .and_then(NonZeroU8::new)
            .map(Self)
    }

    pub const fn from_u16(v: u16) -> Result<Option<Self>, BadShadowData> {
        let Some(inner) = NonZeroU8::new(v as u8) else {
            return Ok(None);
        };

        if Self::raw_to_ndex(v).is_none() {
            Err(BadShadowData::ColosseumShadowId(v))
        } else {
            Ok(Some(Self(inner)))
        }
    }

    pub const fn to_u16(&self) -> u16 {
        self.0.get() as u16
    }

    const fn ndex_to_raw(national_dex: NationalDex) -> Option<u8> {
        match national_dex {
            NationalDex::Makuhita => Some(1),
            NationalDex::Bayleef => Some(2),
            NationalDex::Quilava => Some(3),
            NationalDex::Croconaw => Some(4),
            NationalDex::Noctowl => Some(5),
            NationalDex::Flaaffy => Some(6),
            NationalDex::Skiploom => Some(7),
            NationalDex::Quagsire => Some(8),
            NationalDex::Misdreavus => Some(9),
            NationalDex::Yanma => Some(10),
            NationalDex::Furret => Some(11),
            NationalDex::Slugma => Some(12),
            NationalDex::Remoraid => Some(13),
            NationalDex::Mantine => Some(14),
            NationalDex::Qwilfish => Some(15),
            NationalDex::Meditite => Some(16),
            NationalDex::Dunsparce => Some(17),
            NationalDex::Swablu => Some(18),
            NationalDex::Sudowoodo => Some(19),
            NationalDex::Hitmontop => Some(20),
            NationalDex::Entei => Some(21),
            NationalDex::Ledian => Some(22),
            NationalDex::Suicune => Some(23),
            NationalDex::Gligar => Some(24),
            NationalDex::Stantler => Some(25),
            NationalDex::Piloswine => Some(26),
            NationalDex::Sneasel => Some(27),
            NationalDex::Aipom => Some(28),
            NationalDex::Murkrow => Some(29),
            NationalDex::Forretress => Some(30),
            NationalDex::Granbull => Some(31),
            NationalDex::Vibrava => Some(32),
            NationalDex::Ariados => Some(33),
            NationalDex::Raikou => Some(34),
            NationalDex::Sunflora => Some(35),
            NationalDex::Delibird => Some(36),
            NationalDex::Heracross => Some(37),
            NationalDex::Skarmory => Some(38),
            NationalDex::Miltank => Some(39),
            NationalDex::Absol => Some(40),
            NationalDex::Houndoom => Some(41),
            NationalDex::Tropius => Some(42),
            NationalDex::Metagross => Some(43),
            NationalDex::Tyranitar => Some(44),
            NationalDex::Smeargle => Some(55),
            NationalDex::Ursaring => Some(56),
            NationalDex::Shuckle => Some(57),
            NationalDex::Togetic => Some(67),
            _ => None,
        }
    }

    const fn raw_to_ndex(id: u16) -> Option<NationalDex> {
        match id {
            1 => Some(NationalDex::Makuhita),
            2 => Some(NationalDex::Bayleef),
            3 => Some(NationalDex::Quilava),
            4 => Some(NationalDex::Croconaw),
            5 => Some(NationalDex::Noctowl),
            6 => Some(NationalDex::Flaaffy),
            7 => Some(NationalDex::Skiploom),
            8 => Some(NationalDex::Quagsire),
            9 => Some(NationalDex::Misdreavus),
            10 => Some(NationalDex::Yanma),
            11 => Some(NationalDex::Furret),
            12 => Some(NationalDex::Slugma),
            13 => Some(NationalDex::Remoraid),
            14 => Some(NationalDex::Mantine),
            15 => Some(NationalDex::Qwilfish),
            16 => Some(NationalDex::Meditite),
            17 => Some(NationalDex::Dunsparce),
            18 => Some(NationalDex::Swablu),
            19 => Some(NationalDex::Sudowoodo),
            20 => Some(NationalDex::Hitmontop),
            21 => Some(NationalDex::Entei),
            22 => Some(NationalDex::Ledian),
            23 => Some(NationalDex::Suicune),
            24 => Some(NationalDex::Gligar),
            25 => Some(NationalDex::Stantler),
            26 => Some(NationalDex::Piloswine),
            27 => Some(NationalDex::Sneasel),
            28 => Some(NationalDex::Aipom),
            29 => Some(NationalDex::Murkrow),
            30 => Some(NationalDex::Forretress),
            31 => Some(NationalDex::Granbull),
            32 => Some(NationalDex::Vibrava),
            33 => Some(NationalDex::Ariados),
            34 => Some(NationalDex::Raikou),
            35 => Some(NationalDex::Sunflora),
            36 => Some(NationalDex::Delibird),
            37 => Some(NationalDex::Heracross),
            38 => Some(NationalDex::Skarmory),
            39 => Some(NationalDex::Miltank),
            40 => Some(NationalDex::Absol),
            41 => Some(NationalDex::Houndoom),
            42 => Some(NationalDex::Tropius),
            43 => Some(NationalDex::Metagross),
            44 => Some(NationalDex::Tyranitar),
            55 => Some(NationalDex::Smeargle),
            56 => Some(NationalDex::Ursaring),
            57 => Some(NationalDex::Shuckle),
            67 => Some(NationalDex::Togetic),
            _ => None,
        }
    }

    pub fn get_national_dex(&self) -> NationalDex {
        Self::raw_to_ndex(self.0.get() as u16).unwrap_or_else(|| {
            panic!(
                "ShadowIdColosseum was constructed with a disallowed value: {}",
                self.0
            )
        })
    }

    pub fn initial_shadow_gauge(&self) -> i32 {
        colosseum_initial_shadow_gauge_by_shadow_id(self)
    }
}

fn colosseum_initial_shadow_gauge_by_shadow_id(shadow_id: &ShadowIdColosseum) -> i32 {
    match shadow_id.get_national_dex() {
        NationalDex::Makuhita => 3000,
        NationalDex::Bayleef => 3000,
        NationalDex::Quilava => 3000,
        NationalDex::Croconaw => 3000,
        NationalDex::Noctowl => 3000,
        NationalDex::Flaaffy => 3000,
        NationalDex::Skiploom => 3000,
        NationalDex::Quagsire => 4000,
        NationalDex::Misdreavus => 4000,
        NationalDex::Yanma => 5000,
        NationalDex::Furret => 5000,
        NationalDex::Slugma => 4000,
        NationalDex::Remoraid => 4000,
        NationalDex::Mantine => 5000,
        NationalDex::Qwilfish => 5000,
        NationalDex::Meditite => 5000,
        NationalDex::Dunsparce => 5000,
        NationalDex::Swablu => 5000,
        NationalDex::Sudowoodo => 10000,
        NationalDex::Hitmontop => 6000,
        NationalDex::Entei => 13000,
        NationalDex::Ledian => 6000,
        NationalDex::Suicune => 13000,
        NationalDex::Gligar => 6000,
        NationalDex::Stantler => 6000,
        NationalDex::Piloswine => 6000,
        NationalDex::Sneasel => 6000,
        NationalDex::Aipom => 6000,
        NationalDex::Murkrow => 6000,
        NationalDex::Forretress => 6000,
        NationalDex::Granbull => 6000,
        NationalDex::Vibrava => 6000,
        NationalDex::Ariados => 6000,
        NationalDex::Raikou => 13000,
        NationalDex::Sunflora => 7000,
        NationalDex::Delibird => 7000,
        NationalDex::Heracross => 7000,
        NationalDex::Skarmory => 13000,
        NationalDex::Miltank => 7000,
        NationalDex::Absol => 7000,
        NationalDex::Houndoom => 7000,
        NationalDex::Tropius => 7000,
        NationalDex::Metagross => 15000,
        NationalDex::Tyranitar => 20000,
        NationalDex::Smeargle => 7000,
        NationalDex::Ursaring => 7000,
        NationalDex::Shuckle => 7000,
        NationalDex::Togetic => 5000,
        other => panic!(
            "colosseum_initial_shadow_gauge_by_shadow_id returned an unexpected value: {} (shadow id {})",
            other, shadow_id.0
        ),
    }
}

fn xd_initial_shadow_gauge_by_shadow_id(shadow_id: &ShadowIdXd) -> i32 {
    match shadow_id.get_national_dex() {
        NationalDex::Teddiursa => 3000,
        NationalDex::Vulpix => 2000,
        NationalDex::Spheal => 1500,
        NationalDex::Baltoy => 1500,
        NationalDex::Mareep => 1500,
        NationalDex::Gulpin => 1500,
        NationalDex::Seedot => 1500,
        NationalDex::Spinarak => 1500,
        NationalDex::Numel => 1500,
        NationalDex::Carvanha => 1700,
        NationalDex::Roselia => 3000,
        NationalDex::Delcatty => 2500,
        NationalDex::Nosepass => 4000,
        NationalDex::Houndour => 1500,
        NationalDex::Makuhita => 2000,
        NationalDex::Duskull => 2200,
        NationalDex::Ralts => 2200,
        NationalDex::Mawile => 2500,
        NationalDex::Snorunt => 2500,
        NationalDex::Pineco => 2500,
        NationalDex::Swinub => 2500,
        NationalDex::Natu => 2500,
        NationalDex::Shroomish => 1800,
        NationalDex::Meowth => 3500,
        NationalDex::Spearow => 4500,
        NationalDex::Grimer => 3000,
        NationalDex::Seel => 3500,
        NationalDex::Lunatone => 5000,
        NationalDex::Voltorb => 2500,
        NationalDex::Zangoose => 5000,
        NationalDex::Growlithe => 4000,
        NationalDex::Paras => 4000,
        NationalDex::Shellder => 4000,
        NationalDex::Beedrill => 4500,
        NationalDex::Pidgeotto => 4000,
        NationalDex::Butterfree => 4000,
        NationalDex::Tangela => 4000,
        NationalDex::Raticate => 6000,
        NationalDex::Venomoth => 4000,
        NationalDex::Weepinbell => 4000,
        NationalDex::Arbok => 5000,
        NationalDex::Primeape => 6000,
        NationalDex::Hypno => 5500,
        NationalDex::Golduck => 6500,
        NationalDex::Sableye => 7000,
        NationalDex::Magneton => 4500,
        NationalDex::Dodrio => 8000,
        NationalDex::Farfetchd => 5500,
        NationalDex::Altaria => 6500,
        NationalDex::Kangaskhan => 6000,
        NationalDex::Banette => 7000,
        NationalDex::Magmar => 7000,
        NationalDex::Pinsir => 7000,
        NationalDex::Magcargo => 5500,
        NationalDex::Rapidash => 6000,
        NationalDex::Hitmonchan => 6000,
        NationalDex::Hitmonlee => 7000,
        NationalDex::Lickitung => 5000,
        NationalDex::Scyther => 8000,
        NationalDex::Chansey => 4000,
        NationalDex::Solrock => 7500,
        NationalDex::Starmie => 7500,
        NationalDex::Electabuzz => 7000,
        NationalDex::Swellow => 7000,
        NationalDex::Snorlax => 9000,
        NationalDex::Poliwrath => 7500,
        NationalDex::MrMime => 6500,
        NationalDex::Dugtrio => 5000,
        NationalDex::Manectric => 7000,
        NationalDex::Salamence => 9000,
        NationalDex::Marowak => 6500,
        NationalDex::Lapras => 6000,
        NationalDex::Lugia => 1200,
        NationalDex::Zapdos => 1000,
        NationalDex::Moltres => 1000,
        NationalDex::Articuno => 1000,
        NationalDex::Tauros => 9000,
        NationalDex::Rhydon => 7000,
        NationalDex::Exeggutor => 9000,
        NationalDex::Dragonite => 9000,
        NationalDex::Togepi => 4500,
        NationalDex::Poochyena => 2500,
        NationalDex::Ledyba => 2500,
        other => panic!(
            "ShadowIdXd::get_national_dex returned an unexpected value: {} (shadow id {})",
            other, shadow_id.0
        ),
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, Serialize)]
pub struct ShadowIdXd(NonZeroU8);

impl ShadowIdXd {
    pub fn by_ndex(national_dex: NationalDex) -> Option<Self> {
        Self::raw_by_ndex(national_dex)
            .and_then(NonZeroU8::new)
            .map(Self)
    }

    const fn raw_by_ndex(national_dex: NationalDex) -> Option<u8> {
        match national_dex {
            NationalDex::Teddiursa => Some(1),
            NationalDex::Vulpix => Some(2),
            NationalDex::Spheal => Some(3),
            NationalDex::Baltoy => Some(4),
            NationalDex::Mareep => Some(5),
            NationalDex::Gulpin => Some(6),
            NationalDex::Seedot => Some(7),
            NationalDex::Spinarak => Some(8),
            NationalDex::Numel => Some(9),
            NationalDex::Carvanha => Some(10),
            NationalDex::Roselia => Some(11),
            NationalDex::Delcatty => Some(12),
            NationalDex::Nosepass => Some(13),
            NationalDex::Houndour => Some(14),
            NationalDex::Makuhita => Some(15),
            NationalDex::Duskull => Some(16),
            NationalDex::Ralts => Some(17),
            NationalDex::Mawile => Some(18),
            NationalDex::Snorunt => Some(19),
            NationalDex::Pineco => Some(20),
            NationalDex::Swinub => Some(21),
            NationalDex::Natu => Some(22),
            NationalDex::Shroomish => Some(23),
            NationalDex::Meowth => Some(24),
            NationalDex::Spearow => Some(25),
            NationalDex::Grimer => Some(26),
            NationalDex::Seel => Some(27),
            NationalDex::Lunatone => Some(28),
            NationalDex::Voltorb => Some(29),
            NationalDex::Zangoose => Some(30),
            NationalDex::Growlithe => Some(31),
            NationalDex::Paras => Some(32),
            NationalDex::Shellder => Some(33),
            NationalDex::Beedrill => Some(34),
            NationalDex::Pidgeotto => Some(35),
            NationalDex::Butterfree => Some(36),
            NationalDex::Tangela => Some(37),
            NationalDex::Raticate => Some(38),
            NationalDex::Venomoth => Some(39),
            NationalDex::Weepinbell => Some(40),
            NationalDex::Arbok => Some(41),
            NationalDex::Primeape => Some(42),
            NationalDex::Hypno => Some(43),
            NationalDex::Golduck => Some(44),
            NationalDex::Sableye => Some(45),
            NationalDex::Dodrio => Some(47),
            NationalDex::Farfetchd => Some(48),
            NationalDex::Altaria => Some(49),
            NationalDex::Kangaskhan => Some(50),
            NationalDex::Banette => Some(51),
            NationalDex::Magmar => Some(52),
            NationalDex::Pinsir => Some(53),
            NationalDex::Magcargo => Some(54),
            NationalDex::Rapidash => Some(55),
            NationalDex::Hitmonchan => Some(56),
            NationalDex::Hitmonlee => Some(57),
            NationalDex::Lickitung => Some(58),
            NationalDex::Scyther => Some(59),
            NationalDex::Chansey => Some(60),
            NationalDex::Solrock => Some(61),
            NationalDex::Starmie => Some(62),
            NationalDex::Electabuzz => Some(63),
            NationalDex::Swellow => Some(64),
            NationalDex::Snorlax => Some(65),
            NationalDex::Poliwrath => Some(66),
            NationalDex::MrMime => Some(67),
            NationalDex::Dugtrio => Some(68),
            NationalDex::Manectric => Some(69),
            NationalDex::Salamence => Some(70),
            NationalDex::Marowak => Some(71),
            NationalDex::Lapras => Some(72),
            NationalDex::Lugia => Some(73),
            NationalDex::Zapdos => Some(74),
            NationalDex::Moltres => Some(75),
            NationalDex::Articuno => Some(76),
            NationalDex::Tauros => Some(77),
            NationalDex::Rhydon => Some(78),
            NationalDex::Exeggutor => Some(79),
            NationalDex::Dragonite => Some(80),
            NationalDex::Togepi => Some(81),
            NationalDex::Poochyena => Some(82),
            NationalDex::Ledyba => Some(83),
            _ => None,
        }
    }

    pub fn get_national_dex(&self) -> NationalDex {
        match self.0.get() {
            1 => NationalDex::Teddiursa,
            2 => NationalDex::Vulpix,
            3 => NationalDex::Spheal,
            4 => NationalDex::Baltoy,
            5 => NationalDex::Mareep,
            6 => NationalDex::Gulpin,
            7 => NationalDex::Seedot,
            8 => NationalDex::Spinarak,
            9 => NationalDex::Numel,
            10 => NationalDex::Carvanha,
            11 => NationalDex::Roselia,
            12 => NationalDex::Delcatty,
            13 => NationalDex::Nosepass,
            14 => NationalDex::Houndour,
            15 => NationalDex::Makuhita,
            16 => NationalDex::Duskull,
            17 => NationalDex::Ralts,
            18 => NationalDex::Mawile,
            19 => NationalDex::Snorunt,
            20 => NationalDex::Pineco,
            21 => NationalDex::Swinub,
            22 => NationalDex::Natu,
            23 => NationalDex::Shroomish,
            24 => NationalDex::Meowth,
            25 => NationalDex::Spearow,
            26 => NationalDex::Grimer,
            27 => NationalDex::Seel,
            28 => NationalDex::Lunatone,
            29 => NationalDex::Voltorb,
            30 => NationalDex::Zangoose,
            31 => NationalDex::Growlithe,
            32 => NationalDex::Paras,
            33 => NationalDex::Shellder,
            34 => NationalDex::Beedrill,
            35 => NationalDex::Pidgeotto,
            36 => NationalDex::Butterfree,
            37 => NationalDex::Tangela,
            38 => NationalDex::Raticate,
            39 => NationalDex::Venomoth,
            40 => NationalDex::Weepinbell,
            41 => NationalDex::Arbok,
            42 => NationalDex::Primeape,
            43 => NationalDex::Hypno,
            44 => NationalDex::Golduck,
            45 => NationalDex::Sableye,
            47 => NationalDex::Dodrio,
            48 => NationalDex::Farfetchd,
            49 => NationalDex::Altaria,
            50 => NationalDex::Kangaskhan,
            51 => NationalDex::Banette,
            52 => NationalDex::Magmar,
            53 => NationalDex::Pinsir,
            54 => NationalDex::Magcargo,
            55 => NationalDex::Rapidash,
            56 => NationalDex::Hitmonchan,
            57 => NationalDex::Hitmonlee,
            58 => NationalDex::Lickitung,
            59 => NationalDex::Scyther,
            60 => NationalDex::Chansey,
            61 => NationalDex::Solrock,
            62 => NationalDex::Starmie,
            63 => NationalDex::Electabuzz,
            64 => NationalDex::Swellow,
            65 => NationalDex::Snorlax,
            66 => NationalDex::Poliwrath,
            67 => NationalDex::MrMime,
            68 => NationalDex::Dugtrio,
            69 => NationalDex::Manectric,
            70 => NationalDex::Salamence,
            71 => NationalDex::Marowak,
            72 => NationalDex::Lapras,
            73 => NationalDex::Lugia,
            74 => NationalDex::Zapdos,
            75 => NationalDex::Moltres,
            76 => NationalDex::Articuno,
            77 => NationalDex::Tauros,
            78 => NationalDex::Rhydon,
            79 => NationalDex::Exeggutor,
            80 => NationalDex::Dragonite,
            81 => NationalDex::Togepi,
            82 => NationalDex::Poochyena,
            83 => NationalDex::Ledyba,
            other => panic!("ShadowIdXd was constructed with a disallowed value: {other}"),
        }
    }

    pub fn to_u8(&self) -> u8 {
        self.get_national_dex() as u8
    }

    pub fn initial_shadow_gauge(&self) -> i32 {
        xd_initial_shadow_gauge_by_shadow_id(self)
    }
}

#[cfg(feature = "randomize")]
const VALID_SHADOW_ID_COUNT_COLOSSEUM: usize = 48;
#[cfg(feature = "randomize")]
const VALID_SHADOW_ID_NDEX_COLOSSEUM: [NationalDex; VALID_SHADOW_ID_COUNT_COLOSSEUM] = [
    NationalDex::Makuhita,
    NationalDex::Bayleef,
    NationalDex::Quilava,
    NationalDex::Croconaw,
    NationalDex::Noctowl,
    NationalDex::Flaaffy,
    NationalDex::Skiploom,
    NationalDex::Quagsire,
    NationalDex::Misdreavus,
    NationalDex::Yanma,
    NationalDex::Furret,
    NationalDex::Slugma,
    NationalDex::Remoraid,
    NationalDex::Mantine,
    NationalDex::Qwilfish,
    NationalDex::Meditite,
    NationalDex::Dunsparce,
    NationalDex::Swablu,
    NationalDex::Sudowoodo,
    NationalDex::Hitmontop,
    NationalDex::Entei,
    NationalDex::Ledian,
    NationalDex::Suicune,
    NationalDex::Gligar,
    NationalDex::Stantler,
    NationalDex::Piloswine,
    NationalDex::Sneasel,
    NationalDex::Aipom,
    NationalDex::Murkrow,
    NationalDex::Forretress,
    NationalDex::Granbull,
    NationalDex::Vibrava,
    NationalDex::Ariados,
    NationalDex::Raikou,
    NationalDex::Sunflora,
    NationalDex::Delibird,
    NationalDex::Heracross,
    NationalDex::Skarmory,
    NationalDex::Miltank,
    NationalDex::Absol,
    NationalDex::Houndoom,
    NationalDex::Tropius,
    NationalDex::Metagross,
    NationalDex::Tyranitar,
    NationalDex::Smeargle,
    NationalDex::Ursaring,
    NationalDex::Shuckle,
    NationalDex::Togetic,
];

#[cfg(feature = "randomize")]
impl Randomize for ShadowIdColosseum {
    fn randomized<R: rand::prelude::Rng>(rng: &mut R) -> Self {
        let national_dex =
            VALID_SHADOW_ID_NDEX_COLOSSEUM[rng.random_range(0..VALID_SHADOW_ID_COUNT_COLOSSEUM)];
        Self::by_ndex(national_dex).expect(
            "national dex was selected from VALID_SHADOW_ID_NDEX_COLOSSEUM, which should be valid",
        )
    }
}

#[cfg(feature = "randomize")]
const VALID_SHADOW_ID_COUNT_XD: usize = 82;
#[cfg(feature = "randomize")]
const VALID_SHADOW_ID_NDEX_XD: [NationalDex; VALID_SHADOW_ID_COUNT_XD] = [
    NationalDex::Teddiursa,
    NationalDex::Vulpix,
    NationalDex::Spheal,
    NationalDex::Baltoy,
    NationalDex::Mareep,
    NationalDex::Gulpin,
    NationalDex::Seedot,
    NationalDex::Spinarak,
    NationalDex::Numel,
    NationalDex::Carvanha,
    NationalDex::Roselia,
    NationalDex::Delcatty,
    NationalDex::Nosepass,
    NationalDex::Houndour,
    NationalDex::Makuhita,
    NationalDex::Duskull,
    NationalDex::Ralts,
    NationalDex::Mawile,
    NationalDex::Snorunt,
    NationalDex::Pineco,
    NationalDex::Swinub,
    NationalDex::Natu,
    NationalDex::Shroomish,
    NationalDex::Meowth,
    NationalDex::Spearow,
    NationalDex::Grimer,
    NationalDex::Seel,
    NationalDex::Lunatone,
    NationalDex::Voltorb,
    NationalDex::Zangoose,
    NationalDex::Growlithe,
    NationalDex::Paras,
    NationalDex::Shellder,
    NationalDex::Beedrill,
    NationalDex::Pidgeotto,
    NationalDex::Butterfree,
    NationalDex::Tangela,
    NationalDex::Raticate,
    NationalDex::Venomoth,
    NationalDex::Weepinbell,
    NationalDex::Arbok,
    NationalDex::Primeape,
    NationalDex::Hypno,
    NationalDex::Golduck,
    NationalDex::Sableye,
    NationalDex::Dodrio,
    NationalDex::Farfetchd,
    NationalDex::Altaria,
    NationalDex::Kangaskhan,
    NationalDex::Banette,
    NationalDex::Magmar,
    NationalDex::Pinsir,
    NationalDex::Magcargo,
    NationalDex::Rapidash,
    NationalDex::Hitmonchan,
    NationalDex::Hitmonlee,
    NationalDex::Lickitung,
    NationalDex::Scyther,
    NationalDex::Chansey,
    NationalDex::Solrock,
    NationalDex::Starmie,
    NationalDex::Electabuzz,
    NationalDex::Swellow,
    NationalDex::Snorlax,
    NationalDex::Poliwrath,
    NationalDex::MrMime,
    NationalDex::Dugtrio,
    NationalDex::Manectric,
    NationalDex::Salamence,
    NationalDex::Marowak,
    NationalDex::Lapras,
    NationalDex::Lugia,
    NationalDex::Zapdos,
    NationalDex::Moltres,
    NationalDex::Articuno,
    NationalDex::Tauros,
    NationalDex::Rhydon,
    NationalDex::Exeggutor,
    NationalDex::Dragonite,
    NationalDex::Togepi,
    NationalDex::Poochyena,
    NationalDex::Ledyba,
];

#[cfg(feature = "randomize")]
impl Randomize for ShadowIdXd {
    fn randomized<R: rand::prelude::Rng>(rng: &mut R) -> Self {
        let national_dex = VALID_SHADOW_ID_NDEX_XD[rng.random_range(0..VALID_SHADOW_ID_COUNT_XD)];
        Self::by_ndex(national_dex)
            .expect("national dex was selected from VALID_SHADOW_ID_NDEX_XD, which should be valid")
    }
}
