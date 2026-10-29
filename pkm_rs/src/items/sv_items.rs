//! Item storage for Generation 9 (Scarlet / Violet).
//!
//! Port of PKHeX's `PKHeX.Core/Items/ItemStorage9SV.cs`.

use crate::items::adapter::{Availability, ItemAdapter};
use crate::items::category::OpenhomeItemCategory;

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
pub enum SvItemPouch {
    Medicine = 0,
    #[strum(to_string = "Poké Balls")]
    Balls = 1,
    #[strum(to_string = "Battle Items")]
    Battle = 2,
    Berries = 3,
    Other = 4,
    #[strum(to_string = "TMs")]
    TechnicalMachines = 5,
    Treasure = 6,
    Picnic = 7,
    #[strum(to_string = "Key Items")]
    KeyItems = 8,
    Materials = 9,
}

impl From<SvItemPouch> for OpenhomeItemCategory {
    fn from(value: SvItemPouch) -> Self {
        match value {
            SvItemPouch::Medicine => Self::Medicine,
            SvItemPouch::Balls => Self::Balls,
            SvItemPouch::Battle => Self::BattleItems,
            SvItemPouch::Berries => Self::Berries,
            SvItemPouch::Other => Self::Items,
            SvItemPouch::TechnicalMachines => Self::TechnicalMachines,
            SvItemPouch::Treasure => Self::Treasure,
            SvItemPouch::Picnic => Self::Ingredients,
            SvItemPouch::KeyItems => Self::KeyItems,
            SvItemPouch::Materials => Self::SpeciesItems,
        }
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = svItemPouchToItemCategory)]
pub fn sv_item_pouch_to_category_wasm(pouch_index: u32) -> TsResult<OpenhomeItemCategory> {
    OpenhomeItemCategory::from(SvItemPouch::try_from(pouch_index).unwrap_or(SvItemPouch::Other))
        .try_into_ts()
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, Default)]
pub struct SvItemStorage;

impl SvItemStorage {
    // All lists below are sorted ascending (enforced at compile time at the
    // bottom of this file), which allows `binary_search` lookups.

    pub const MEDICINE: &'static [u16] = &[
        17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
        40, 41, 708, 709,
    ];

    pub const BALLS: &'static [u16] = &[
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 492, 493, 494, 495, 496, 497, 498,
        499, 500, 576, 851, 1785,
    ];

    pub const BATTLE: &'static [u16] = &[55, 56, 57, 58, 59, 60, 61, 62, 63];

    pub const BERRY: &'static [u16] = &[
        149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 169, 170, 171,
        172, 173, 174, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198,
        199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 686, 687, 688,
    ];

    pub const OTHER: &'static [u16] = &[
        45, 46, 47, 48, 49, 50, 51, 52, 53, 80, 81, 82, 83, 84, 85, 107, 108, 109, 110, 111, 112,
        135, 136, 213, 214, 217, 218, 219, 220, 221, 222, 223, 224, 225, 228, 229, 230, 231, 232,
        233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250,
        251, 252, 253, 265, 266, 267, 268, 269, 270, 271, 272, 273, 275, 276, 277, 278, 279, 280,
        281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298,
        299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 321, 322, 323,
        324, 325, 326, 327, 485, 486, 487, 488, 489, 490, 491, 537, 538, 539, 540, 541, 542, 543,
        544, 545, 546, 547, 564, 565, 566, 567, 568, 569, 570, 639, 640, 644, 645, 648, 649, 650,
        795, 796, 846, 849, 853, 854, 855, 856, 879, 880, 881, 882, 883, 884, 1103, 1104, 1109,
        1110, 1111, 1112, 1113, 1114, 1115, 1116, 1117, 1118, 1119, 1120, 1121, 1122, 1123, 1124,
        1125, 1126, 1127, 1128, 1231, 1232, 1233, 1234, 1235, 1236, 1237, 1238, 1239, 1240, 1241,
        1242, 1243, 1244, 1245, 1246, 1247, 1248, 1249, 1250, 1251, 1253, 1254, 1581, 1582, 1592,
        1606, 1777, 1778, 1779, 1861, 1862, 1863, 1864, 1865, 1866, 1867, 1868, 1869, 1870, 1871,
        1872, 1873, 1874, 1875, 1876, 1877, 1878, 1879, 1880, 1881, 1882, 1883, 1884, 1885, 1886,
        2344, 2345, 2401, 2402, 2403, 2404, 2406, 2407, 2408, 2411, 2412, 2413, 2414, 2415, 2416,
        2479, 2482, 2549,
    ];

    pub const MACHINE: &'static [u16] = &[
        328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345,
        346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363,
        364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381,
        382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399,
        400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417,
        418, 419, 618, 619, 620, 690, 691, 692, 693, 1230, 2160, 2161, 2162, 2163, 2164, 2165,
        2166, 2167, 2168, 2169, 2170, 2171, 2172, 2173, 2174, 2175, 2176, 2177, 2178, 2179, 2180,
        2181, 2182, 2183, 2184, 2185, 2186, 2187, 2188, 2189, 2190, 2191, 2192, 2193, 2194, 2195,
        2196, 2197, 2198, 2199, 2200, 2201, 2202, 2203, 2204, 2205, 2206, 2207, 2208, 2209, 2210,
        2211, 2212, 2213, 2214, 2215, 2216, 2217, 2218, 2219, 2220, 2221, 2222, 2223, 2224, 2225,
        2226, 2227, 2228, 2229, 2230, 2231, 2232, 2233, 2234, 2235, 2236, 2237, 2238, 2239, 2240,
        2241, 2242, 2243, 2244, 2245, 2246, 2247, 2248, 2249, 2250, 2251, 2252, 2253, 2254, 2255,
        2256, 2257, 2258, 2259, 2260, 2261, 2262, 2263, 2264, 2265, 2266, 2267, 2268, 2269, 2270,
        2271, 2272, 2273, 2274, 2275, 2276, 2277, 2278, 2279, 2280, 2281, 2282, 2283, 2284, 2285,
        2286, 2287, 2288, 2289,
    ];

    pub const TREASURE: &'static [u16] = &[
        86, 87, 88, 89, 90, 91, 92, 94, 106, 571, 580, 581, 582, 583, 1842, 1843,
    ];

    pub const PICNIC: &'static [u16] = &[
        1888, 1889, 1890, 1891, 1892, 1893, 1894, 1895, 1896, 1897, 1898, 1899, 1900, 1901, 1902,
        1903, 1904, 1905, 1906, 1907, 1908, 1909, 1910, 1911, 1912, 1913, 1914, 1915, 1916, 1917,
        1918, 1919, 1920, 1921, 1922, 1923, 1924, 1925, 1926, 1927, 1928, 1929, 1930, 1931, 1932,
        1933, 1934, 1935, 1936, 1937, 1938, 1939, 1940, 1941, 1942, 1943, 1944, 1945, 1946, 2311,
        2313, 2314, 2315, 2316, 2317, 2318, 2319, 2320, 2321, 2322, 2323, 2324, 2325, 2326, 2327,
        2329, 2330, 2331, 2332, 2333, 2334, 2335, 2336, 2337, 2338, 2339, 2340, 2341, 2342, 2348,
        2349, 2350, 2351, 2352, 2353, 2354, 2355, 2356, 2357, 2358, 2359, 2360, 2361, 2362, 2363,
        2364, 2365, 2366, 2367, 2368, 2369, 2370, 2371, 2372, 2373, 2374, 2375, 2376, 2377, 2378,
        2379, 2380, 2381, 2382, 2383, 2384, 2385, 2386, 2387, 2388, 2389, 2390, 2391, 2392, 2393,
        2394, 2395, 2396, 2397, 2398, 2399, 2400, 2417, 2418, 2419, 2420, 2421, 2422, 2423, 2424,
        2425, 2426, 2427, 2428, 2429, 2430, 2431, 2432, 2433, 2434, 2435, 2436, 2437, 2548, 2551,
        2552,
    ];

    pub const EVENT: &'static [u16] = &[
        78, 466, 628, 629, 631, 632, 638, 703, 765, 943, 944, 945, 946, 1267, 1278, 1587, 1589,
        1590, 1591, 1829, 1830, 1831, 1832, 1833, 1834, 1835, 1836, 1857, 1858, 2405, 2409, 2410,
        2480, 2481, 2483, 2522, 2523, 2524, 2525, 2526, 2527, 2528, 2529, 2530, 2531, 2532, 2533,
        2534, 2535, 2536, 2537, 2538, 2539, 2540, 2541, 2542, 2543, 2544, 2545, 2546, 2547, 2550,
        2553, 2554, 2555, 2556, 2557,
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

    /// Items that exist in the data but cannot be legally btained.
    pub const UNRELEASED: &'static [u16] = &[
        16,   // Cherish Ball
        111,  // Odd Keystone
        485,  // Red Apricorn
        486,  // Blue Apricorn
        487,  // Yellow Apricorn
        488,  // Green Apricorn
        489,  // Pink Apricorn
        490,  // White Apricorn
        491,  // Black Apricorn
        500,  // Park Ball
        708,  // Lumiose Galette
        709,  // Shalour Sable
        1230, // TM00 - Mega Punch (Nothing learns, not obtainable even though it is assigned a move.)
        1785, // Strange Ball
    ];

    const UNRELEASED_INGREDIENTS: &'static [u16] = &[
        2395, // Blue Dish
        // 2396, // Green Dish (Mesagoza Treasure Hunt)
        2397, // Orange Dish
        2398, // Red Dish
        2399, // White Dish
        2400, // Yellow Dish
    ];

    /// Legal item IDs for a pouch, or `None` if Gen 9 has no such pouch.
    pub const fn items_by_pouch(pouch: SvItemPouch) -> Option<&'static [u16]> {
        Some(match pouch {
            SvItemPouch::Other => Self::OTHER,
            SvItemPouch::KeyItems => Self::EVENT,
            SvItemPouch::TechnicalMachines => Self::MACHINE,
            SvItemPouch::Medicine => Self::MEDICINE,
            SvItemPouch::Berries => Self::BERRY,
            SvItemPouch::Balls => Self::BALLS,
            SvItemPouch::Battle => Self::BATTLE,
            SvItemPouch::Treasure => Self::TREASURE,
            SvItemPouch::Picnic => Self::PICNIC,
            SvItemPouch::Materials => Self::MATERIAL,
        })
    }

    pub fn pouch_for(item_index: u16) -> Option<SvItemPouch> {
        SvItemPouch::iter().find(|&ty| {
            Self::items_by_pouch(ty).is_some_and(|items| items.binary_search(&item_index).is_ok())
        })
    }

    pub fn category_for(item_index: u16) -> Option<OpenhomeItemCategory> {
        Self::pouch_for(item_index).map(OpenhomeItemCategory::from)
    }

    pub const fn is_ingredient(item_index: u16) -> bool {
        matches!(item_index, 1888..=1946)
    }

    /// Fiery Pick and the other picnic "pick" accessories.
    pub const fn is_pick(item_index: u16) -> bool {
        matches!(item_index, 2334..=2342 | 2385..=2394 | 2548)
    }

    #[cfg(feature = "wasm")]
    /// Tablecloths, chairs, cups, etc.
    pub const fn is_accessory(item_index: u16) -> bool {
        matches!(item_index, 2311..=2400 | 2417..=2437) && !Self::is_pick(item_index)
    }

    pub const fn max_allowed_for_category(category: OpenhomeItemCategory) -> Option<u16> {
        match category {
            OpenhomeItemCategory::KeyItems => Some(1),
            OpenhomeItemCategory::Items
            | OpenhomeItemCategory::TechnicalMachines
            | OpenhomeItemCategory::Medicine
            | OpenhomeItemCategory::Berries
            | OpenhomeItemCategory::Balls
            | OpenhomeItemCategory::BattleItems
            | OpenhomeItemCategory::Treasure
            | OpenhomeItemCategory::Ingredients // 999 (depends on item)
            | OpenhomeItemCategory::SpeciesItems => Some(999),
            _ => None,
        }
    }

    #[cfg(test)]
    const fn capacity(ty: OpenhomeItemCategory) -> Option<u16> {
        match ty {
            OpenhomeItemCategory::KeyItems => Some(1),
            OpenhomeItemCategory::Items
            | OpenhomeItemCategory::TechnicalMachines
            | OpenhomeItemCategory::Medicine
            | OpenhomeItemCategory::Berries
            | OpenhomeItemCategory::Balls
            | OpenhomeItemCategory::BattleItems
            | OpenhomeItemCategory::Treasure
            | OpenhomeItemCategory::Ingredients // 999 (depends on item)
            | OpenhomeItemCategory::SpeciesItems => Some(999),
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
impl SvItemStorage {
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
        SvItemPouch::iter().map(u32::from).collect()
    }

    #[wasm_bindgen(js_name = pouchName)]
    pub fn pouch_name(pouch_index: u32) -> Option<String> {
        Some(
            SvItemPouch::try_from_primitive(pouch_index)
                .ok()?
                .to_string(),
        )
    }

    #[wasm_bindgen(js_name = pouchForItem)]
    pub fn pouch_for_item(item_index: u16) -> JsResult<Option<Ts<SvItemPouch>>> {
        Self::pouch_for(item_index)
            .map(|pouch| pouch.try_into_ts())
            .transpose()
    }
}

const fn is_strictly_ascending(s: &[u16]) -> bool {
    let mut i = 1;
    while i < s.len() {
        if s[i - 1] >= s[i] {
            return false;
        }
        i += 1;
    }
    true
}

const _: () = {
    assert!(is_strictly_ascending(SvItemStorage::MEDICINE));
    assert!(is_strictly_ascending(SvItemStorage::BALLS));
    assert!(is_strictly_ascending(SvItemStorage::BATTLE));
    assert!(is_strictly_ascending(SvItemStorage::BERRY));
    assert!(is_strictly_ascending(SvItemStorage::OTHER));
    assert!(is_strictly_ascending(SvItemStorage::MACHINE));
    assert!(is_strictly_ascending(SvItemStorage::TREASURE));
    assert!(is_strictly_ascending(SvItemStorage::PICNIC));
    assert!(is_strictly_ascending(SvItemStorage::EVENT));
    assert!(is_strictly_ascending(SvItemStorage::MATERIAL));
    assert!(is_strictly_ascending(SvItemStorage::UNRELEASED));
    assert!(is_strictly_ascending(SvItemStorage::UNRELEASED_INGREDIENTS));
};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pouch_lookup() {
        assert_eq!(SvItemStorage::pouch_for(17), Some(SvItemPouch::Medicine));
        assert_eq!(
            SvItemStorage::pouch_for(328),
            Some(SvItemPouch::TechnicalMachines)
        );
        assert_eq!(SvItemStorage::pouch_for(2000), Some(SvItemPouch::Materials));
        assert_eq!(SvItemStorage::pouch_for(9999), None);
    }

    #[test]
    fn category_lookup() {
        assert_eq!(
            SvItemStorage::category_for(17),
            Some(OpenhomeItemCategory::Medicine)
        );
        assert_eq!(
            SvItemStorage::category_for(328),
            Some(OpenhomeItemCategory::TechnicalMachines)
        );
        assert_eq!(
            SvItemStorage::category_for(2000),
            Some(OpenhomeItemCategory::SpeciesItems)
        );
        assert_eq!(SvItemStorage::category_for(9999), None);
    }

    #[test]
    fn max_counts() {
        assert_eq!(
            SvItemStorage::capacity(OpenhomeItemCategory::KeyItems),
            Some(1)
        );
        assert_eq!(
            SvItemStorage::capacity(OpenhomeItemCategory::Berries),
            Some(999)
        );
        assert_eq!(SvItemStorage::capacity(OpenhomeItemCategory::None), None);
    }
}
