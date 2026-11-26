//! Item storage for Pokémon Legends: Z-A.
//!
//! Port of PKHeX's `PKHeX.Core/Items/ItemStorage9ZA.cs`.

use crate::items::availability::Availability;
use crate::items::category::OpenhomeItemCategory;
use crate::items::merge_dedup::is_strictly_ascending;

use num_enum::{IntoPrimitive, TryFromPrimitive};
use pkm_rs_types::TryIntoTs;
use strum::{Display, EnumIter, IntoEnumIterator};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(
    feature = "wasm",
    derive(tsify::Tsify, serde::Serialize, serde::Deserialize)
)]
#[derive(
    Debug, Clone, Copy, PartialEq, Eq, Hash, TryFromPrimitive, IntoPrimitive, EnumIter, Display,
)]
#[repr(u32)]
pub enum LzaItemPouch {
    Medicine = 0,
    #[strum(to_string = "Poké Balls")]
    Balls = 1,
    Other = 2,
    Treasure = 3,
    #[strum(to_string = "Key Items")]
    KeyItems = 4,
    Berries = 5,
    #[strum(to_string = "TMs")]
    TechnicalMachines = 6,
    #[strum(to_string = "Mega Stones")]
    MegaStones = 7,
}

impl LzaItemPouch {
    pub const fn from_openhome(openhome_category: OpenhomeItemCategory) -> Option<Self> {
        match openhome_category {
            OpenhomeItemCategory::Medicine => Some(Self::Medicine),
            OpenhomeItemCategory::Balls => Some(Self::Balls),
            OpenhomeItemCategory::Berries => Some(Self::Berries),
            OpenhomeItemCategory::Items => Some(Self::Other),
            OpenhomeItemCategory::TechnicalMachines => Some(Self::TechnicalMachines),
            OpenhomeItemCategory::MegaStones => Some(Self::MegaStones),
            OpenhomeItemCategory::Treasure => Some(Self::Treasure),
            OpenhomeItemCategory::KeyItems => Some(Self::KeyItems),
            _ => None,
        }
    }
}

impl From<LzaItemPouch> for OpenhomeItemCategory {
    fn from(value: LzaItemPouch) -> Self {
        match value {
            LzaItemPouch::Medicine => Self::Medicine,
            LzaItemPouch::Balls => Self::Balls,
            LzaItemPouch::Berries => Self::Berries,
            LzaItemPouch::Other => Self::Items,
            LzaItemPouch::TechnicalMachines => Self::TechnicalMachines,
            LzaItemPouch::MegaStones => Self::MegaStones,
            LzaItemPouch::Treasure => Self::Treasure,
            LzaItemPouch::KeyItems => Self::KeyItems,
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, Default)]
pub struct LzaItemStorage;

impl LzaItemStorage {
    // All lists below are sorted ascending (enforced at compile time at the
    // bottom of this file), which allows `binary_search` lookups.

    pub const MEDICINE: &'static [u16] = &[
        17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 708, 2684,
    ];

    pub const BALLS: &'static [u16] = &[
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 492, 493, 494, 495, 496, 497, 498,
        499, 576, 851,
    ];

    pub const BERRIES: &'static [u16] = &[
        149, 150, 151, 152, 153, 155, 156, 157, 158, 169, 170, 171, 172, 173, 174, 184, 185, 186,
        187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 686, 2651, 2652,
        2653, 2654, 2655, 2656, 2657, 2658, 2659, 2660, 2661, 2662, 2663, 2664, 2665, 2666, 2667,
        2668, 2669, 2670, 2671, 2672, 2673, 2674, 2675, 2676, 2677, 2678, 2679, 2680, 2681, 2682,
        2683,
    ];

    pub const MEGA_STONES: &'static [u16] = &[
        656, 657, 658, 659, 660, 661, 662, 663, 664, 665, 666, 667, 668, 669, 670, 671, 672, 673,
        674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 752, 753, 754, 755, 756, 757,
        758, 759, 760, 761, 762, 763, 764, 767, 768, 769, 770, 2559, 2560, 2561, 2562, 2563, 2564,
        2565, 2566, 2567, 2568, 2569, 2570, 2571, 2572, 2573, 2574, 2575, 2576, 2577, 2578, 2579,
        2580, 2581, 2582, 2583, 2584, 2585, 2586, 2587, 2635, 2636, 2637, 2638, 2639, 2640, 2641,
        2642, 2643, 2644, 2645, 2646, 2647, 2648, 2649, 2650,
    ];

    pub const OTHER: &'static [u16] = &[
        45, 46, 47, 48, 49, 50, 52, 80, 81, 82, 83, 84, 85, 103, 107, 108, 109, 116, 117, 118, 119,
        214, 217, 218, 221, 222, 230, 231, 232, 233, 234, 236, 237, 238, 239, 240, 241, 242, 243,
        244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 258, 259, 266, 267, 268, 270, 275, 289,
        290, 291, 292, 293, 294, 296, 324, 534, 535, 537, 538, 540, 564, 565, 566, 567, 568, 569,
        570, 639, 640, 646, 647, 710, 711, 795, 796, 849, 1124, 1125, 1126, 1127, 1128, 1231, 1232,
        1233, 1234, 1235, 1236, 1237, 1238, 1239, 1240, 1241, 1242, 1243, 1244, 1245, 1246, 1247,
        1248, 1249, 1250, 1251, 1582, 1592, 1691, 1861,
        2137, // Gimmighoul Coin cannot be held.
        2344, 2401, 2558, 2618, //
        2619, // Colorful Screw cannot be held.
    ];

    pub const MACHINE: &'static [u16] = &[
        328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345,
        346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363,
        364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381,
        382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399,
        400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417,
        418, 419, 618, 619, 620, 690, 691, 692, 693, 2160, 2162, 2163, 2164, 2165, 2166, 2167,
        2168, 2169, 2170, 2171, 2172, 2173, 2174, 2175, 2176, 2177, 2178, 2179, 2180, 2181, 2182,
        2183, 2184, 2185, 2186, 2187, 2188, 2189, 2190, 2191, 2192, 2193, 2194, 2195, 2196, 2197,
        2198, 2199, 2200, 2201, 2202, 2203, 2204, 2205, 2206, 2207, 2208, 2209, 2210, 2211, 2212,
        2213, 2214, 2215, 2216, 2217, 2218, 2219, 2220, 2221,
    ];

    pub const TREASURE: &'static [u16] = &[86, 88, 89, 92, 571, 581, 582];

    pub const KEY_ITEMS: &'static [u16] = &[
        632, 700, 765, 847, 1278, 2588, 2589, 2590, 2591, 2592, 2595, 2596, 2597, 2598, 2599, 2600,
        2601, 2602, 2603, 2604, 2605, 2606, 2607, 2608, 2609, 2610, 2611, 2612, 2613, 2620, 2621,
        2622, 2623, 2624, 2625, 2626, 2627, 2628, 2629, 2630, 2631, 2632, 2633, 2634,
    ];

    pub const MATERIAL: &'static [u16] = &[
        1956, 1957, 1958, 1959, 1960, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969, 1970,
        1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985,
        1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000,
        2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015,
        2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
        2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039, 2040, 2041, 2042, 2043, 2044, 2045,
        2046, 2047, 2048, 2049, 2050, 2051, 2052, 2053, 2054, 2055, 2056, 2057, 2058, 2059, 2060,
        2061, 2062, 2063, 2064, 2065, 2066, 2067, 2068, 2069, 2070, 2071, 2072, 2073, 2074, 2075,
        2076, 2077, 2078, 2079, 2080, 2081, 2082, 2083, 2084, 2085, 2086, 2087, 2088, 2089, 2090,
        2091, 2092, 2093, 2094, 2095, 2096, 2097, 2098, 2099, 2103, 2104, 2105, 2106, 2107, 2108,
        2109, 2110, 2111, 2112, 2113, 2114, 2115, 2116, 2117, 2118, 2119, 2120, 2121, 2122, 2123,
        2126, 2127, 2128, 2129, 2130, 2131, 2132, 2133, 2134, 2135, 2136, 2137, 2156, 2157, 2158,
        2159, 2438, 2439, 2440, 2441, 2442, 2443, 2444, 2445, 2446, 2447, 2448, 2449, 2450, 2451,
        2452, 2453, 2454, 2455, 2456, 2457, 2458, 2459, 2460, 2461, 2462, 2463, 2464, 2465, 2466,
        2467, 2468, 2469, 2470, 2471, 2472, 2473, 2474, 2475, 2476, 2477, 2478, 2484, 2485, 2486,
        2487, 2488, 2489, 2490, 2491, 2492, 2493, 2494, 2495, 2496, 2497, 2498, 2499, 2500, 2501,
        2502, 2503, 2504, 2505, 2506, 2507, 2508, 2509, 2510, 2511, 2512, 2513, 2514, 2515, 2516,
        2517, 2518, 2519, 2520, 2521,
    ];

    /// Items that exist in the data but cannot be legally obtained.
    pub const UNRELEASED: &'static [u16] = &[
        16, // Cherish Ball
    ];

    /// Legal item IDs for a pouch
    pub const fn items_by_pouch(pouch: LzaItemPouch) -> &'static [u16] {
        match pouch {
            LzaItemPouch::Other => Self::OTHER,
            LzaItemPouch::KeyItems => Self::KEY_ITEMS,
            LzaItemPouch::TechnicalMachines => Self::MACHINE,
            LzaItemPouch::Medicine => Self::MEDICINE,
            LzaItemPouch::Berries => Self::BERRIES,
            LzaItemPouch::Balls => Self::BALLS,
            LzaItemPouch::Treasure => Self::TREASURE,
            LzaItemPouch::MegaStones => Self::MEGA_STONES,
        }
    }

    pub fn pouch_for(item_index: u16) -> Option<LzaItemPouch> {
        LzaItemPouch::iter().find(|&ty| Self::items_by_pouch(ty).binary_search(&item_index).is_ok())
    }

    pub fn category_for(item_index: u16) -> Option<OpenhomeItemCategory> {
        Self::pouch_for(item_index).map(OpenhomeItemCategory::from)
    }

    pub const fn max_allowed_for_category(category: OpenhomeItemCategory) -> Option<u16> {
        match category {
            OpenhomeItemCategory::KeyItems
            | OpenhomeItemCategory::TechnicalMachines
            | OpenhomeItemCategory::MegaStones => Some(1),
            OpenhomeItemCategory::Items
            | OpenhomeItemCategory::Medicine
            | OpenhomeItemCategory::Berries
            | OpenhomeItemCategory::Balls
            | OpenhomeItemCategory::Treasure
            | OpenhomeItemCategory::Food => Some(999),
            _ => None,
        }
    }

    pub fn availability_of(item_index: u16) -> Availability {
        if Self::pouch_for(item_index).is_none() {
            Availability::Unsupported
        } else {
            Availability::Obtainable
        }
    }
}

#[cfg(feature = "wasm")]
use pkm_rs_types::{JsResult, TsResult};

#[cfg(feature = "wasm")]
use tsify::Ts;

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl LzaItemStorage {
    #[wasm_bindgen(js_name = maxAllowed)]
    pub fn max_allowed(item_index: u16) -> Option<u16> {
        Self::category_for(item_index).and_then(Self::max_allowed_for_category)
    }

    #[wasm_bindgen(js_name = availabilityOf)]
    pub fn availability_of_wasm(item_index: u16) -> TsResult<Availability> {
        Self::availability_of(item_index).try_into_ts()
    }

    #[wasm_bindgen(js_name = pouchIndexes)]
    pub fn pouch_indexes() -> Vec<u32> {
        LzaItemPouch::iter().map(u32::from).collect()
    }

    #[wasm_bindgen(js_name = pouchName)]
    pub fn pouch_name(pouch_index: u32) -> Option<String> {
        Some(
            LzaItemPouch::try_from_primitive(pouch_index)
                .ok()?
                .to_string(),
        )
    }

    #[wasm_bindgen(js_name = pouchForItem)]
    pub fn pouch_for_item(item_index: u16) -> JsResult<Option<Ts<LzaItemPouch>>> {
        Self::pouch_for(item_index)
            .map(|pouch| pouch.try_into_ts())
            .transpose()
    }

    #[wasm_bindgen(js_name = pouchIndexForItem)]
    pub fn pouch_index_for_item(item_index: u16) -> Option<u32> {
        Self::pouch_for(item_index).map(u32::from)
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(js_name = pouchIndexToOpenHome)]
    pub fn pouch_index_to_openhome_category(pouch: u32) -> TsResult<OpenhomeItemCategory> {
        OpenhomeItemCategory::from(LzaItemPouch::try_from(pouch).unwrap_or(LzaItemPouch::Other))
            .try_into_ts()
    }

    #[cfg(feature = "wasm")]
    #[wasm_bindgen(js_name = pouchIndexFromOpenHome)]
    pub fn pouch_index_from_openhome_category(
        openhome_category: Ts<OpenhomeItemCategory>,
    ) -> JsResult<Option<u32>> {
        Ok(LzaItemPouch::from_openhome(openhome_category.to_rust()?).map(u32::from))
    }
}

const _: () = {
    assert!(is_strictly_ascending(LzaItemStorage::MEDICINE));
    assert!(is_strictly_ascending(LzaItemStorage::BALLS));
    assert!(is_strictly_ascending(LzaItemStorage::MEGA_STONES));
    assert!(is_strictly_ascending(LzaItemStorage::BERRIES));
    assert!(is_strictly_ascending(LzaItemStorage::OTHER));
    assert!(is_strictly_ascending(LzaItemStorage::MACHINE));
    assert!(is_strictly_ascending(LzaItemStorage::TREASURE));
    assert!(is_strictly_ascending(LzaItemStorage::KEY_ITEMS));
    assert!(is_strictly_ascending(LzaItemStorage::MATERIAL));
    assert!(is_strictly_ascending(LzaItemStorage::UNRELEASED));
};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pouch_lookup() {
        assert_eq!(LzaItemStorage::pouch_for(17), Some(LzaItemPouch::Medicine));
        assert_eq!(
            LzaItemStorage::pouch_for(328),
            Some(LzaItemPouch::TechnicalMachines)
        );
        assert_eq!(LzaItemStorage::pouch_for(2683), Some(LzaItemPouch::Berries));
        assert_eq!(LzaItemStorage::pouch_for(9999), None);
    }

    #[test]
    fn category_lookup() {
        assert_eq!(
            LzaItemStorage::category_for(17),
            Some(OpenhomeItemCategory::Medicine)
        );
        assert_eq!(
            LzaItemStorage::category_for(328),
            Some(OpenhomeItemCategory::TechnicalMachines)
        );
        assert_eq!(
            LzaItemStorage::category_for(2683),
            Some(OpenhomeItemCategory::Berries)
        );
        assert_eq!(LzaItemStorage::category_for(9999), None);
    }
}
