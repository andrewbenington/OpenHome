use std::num::NonZeroU16;

use pkm_rs_resources::species::NatDexIndex;
#[cfg(feature = "randomize")]
use pkm_rs_types::{NationalDex, randomize::Randomize};
#[cfg(feature = "randomize")]
use rand::RngExt;
use serde::Serialize;

use crate::result::{Error, NdexConvertSource};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const fn gen3_to_national_dex(key: u16) -> Option<u16> {
    match key {
        0 => None,
        1..=251 => Some(key),
        252..=276 => None,
        277 => Some(252),
        278 => Some(253),
        279 => Some(254),
        280 => Some(255),
        281 => Some(256),
        282 => Some(257),
        283 => Some(258),
        284 => Some(259),
        285 => Some(260),
        286 => Some(261),
        287 => Some(262),
        288 => Some(263),
        289 => Some(264),
        290 => Some(265),
        291 => Some(266),
        292 => Some(267),
        293 => Some(268),
        294 => Some(269),
        295 => Some(270),
        296 => Some(271),
        297 => Some(272),
        298 => Some(273),
        299 => Some(274),
        300 => Some(275),
        301 => Some(290),
        302 => Some(291),
        303 => Some(292),
        304 => Some(276),
        305 => Some(277),
        306 => Some(285),
        307 => Some(286),
        308 => Some(327),
        309 => Some(278),
        310 => Some(279),
        311 => Some(283),
        312 => Some(284),
        313 => Some(320),
        314 => Some(321),
        315 => Some(300),
        316 => Some(301),
        317 => Some(352),
        318 => Some(343),
        319 => Some(344),
        320 => Some(299),
        321 => Some(324),
        322 => Some(302),
        323 => Some(339),
        324 => Some(340),
        325 => Some(370),
        326 => Some(341),
        327 => Some(342),
        328 => Some(349),
        329 => Some(350),
        330 => Some(318),
        331 => Some(319),
        332 => Some(328),
        333 => Some(329),
        334 => Some(330),
        335 => Some(296),
        336 => Some(297),
        337 => Some(309),
        338 => Some(310),
        339 => Some(322),
        340 => Some(323),
        341 => Some(363),
        342 => Some(364),
        343 => Some(365),
        344 => Some(331),
        345 => Some(332),
        346 => Some(361),
        347 => Some(362),
        348 => Some(337),
        349 => Some(338),
        350 => Some(298),
        351 => Some(325),
        352 => Some(326),
        353 => Some(311),
        354 => Some(312),
        355 => Some(303),
        356 => Some(307),
        357 => Some(308),
        358 => Some(333),
        359 => Some(334),
        360 => Some(360),
        361 => Some(355),
        362 => Some(356),
        363 => Some(315),
        364 => Some(287),
        365 => Some(288),
        366 => Some(289),
        367 => Some(316),
        368 => Some(317),
        369 => Some(357),
        370 => Some(293),
        371 => Some(294),
        372 => Some(295),
        373 => Some(366),
        374 => Some(367),
        375 => Some(368),
        376 => Some(359),
        377 => Some(353),
        378 => Some(354),
        379 => Some(336),
        380 => Some(335),
        381 => Some(369),
        382 => Some(304),
        383 => Some(305),
        384 => Some(306),
        385 => Some(351),
        386 => Some(313),
        387 => Some(314),
        388 => Some(345),
        389 => Some(346),
        390 => Some(347),
        391 => Some(348),
        392 => Some(280),
        393 => Some(281),
        394 => Some(282),
        395 => Some(371),
        396 => Some(372),
        397 => Some(373),
        398 => Some(374),
        399 => Some(375),
        400 => Some(376),
        401 => Some(377),
        402 => Some(378),
        403 => Some(379),
        404 => Some(382),
        405 => Some(383),
        406 => Some(384),
        407 => Some(380),
        408 => Some(381),
        409 => Some(385),
        410 => Some(386),
        411 => Some(358),
        _ => None,
    }
}

const fn national_dex_to_gen3(value: u16) -> Option<NonZeroU16> {
    unsafe {
        match value {
            0 => None,
            1..=251 => Some(NonZeroU16::new_unchecked(value)),
            252 => Some(NonZeroU16::new_unchecked(277)),
            253 => Some(NonZeroU16::new_unchecked(278)),
            254 => Some(NonZeroU16::new_unchecked(279)),
            255 => Some(NonZeroU16::new_unchecked(280)),
            256 => Some(NonZeroU16::new_unchecked(281)),
            257 => Some(NonZeroU16::new_unchecked(282)),
            258 => Some(NonZeroU16::new_unchecked(283)),
            259 => Some(NonZeroU16::new_unchecked(284)),
            260 => Some(NonZeroU16::new_unchecked(285)),
            261 => Some(NonZeroU16::new_unchecked(286)),
            262 => Some(NonZeroU16::new_unchecked(287)),
            263 => Some(NonZeroU16::new_unchecked(288)),
            264 => Some(NonZeroU16::new_unchecked(289)),
            265 => Some(NonZeroU16::new_unchecked(290)),
            266 => Some(NonZeroU16::new_unchecked(291)),
            267 => Some(NonZeroU16::new_unchecked(292)),
            268 => Some(NonZeroU16::new_unchecked(293)),
            269 => Some(NonZeroU16::new_unchecked(294)),
            270 => Some(NonZeroU16::new_unchecked(295)),
            271 => Some(NonZeroU16::new_unchecked(296)),
            272 => Some(NonZeroU16::new_unchecked(297)),
            273 => Some(NonZeroU16::new_unchecked(298)),
            274 => Some(NonZeroU16::new_unchecked(299)),
            275 => Some(NonZeroU16::new_unchecked(300)),
            290 => Some(NonZeroU16::new_unchecked(301)),
            291 => Some(NonZeroU16::new_unchecked(302)),
            292 => Some(NonZeroU16::new_unchecked(303)),
            276 => Some(NonZeroU16::new_unchecked(304)),
            277 => Some(NonZeroU16::new_unchecked(305)),
            285 => Some(NonZeroU16::new_unchecked(306)),
            286 => Some(NonZeroU16::new_unchecked(307)),
            327 => Some(NonZeroU16::new_unchecked(308)),
            278 => Some(NonZeroU16::new_unchecked(309)),
            279 => Some(NonZeroU16::new_unchecked(310)),
            283 => Some(NonZeroU16::new_unchecked(311)),
            284 => Some(NonZeroU16::new_unchecked(312)),
            320 => Some(NonZeroU16::new_unchecked(313)),
            321 => Some(NonZeroU16::new_unchecked(314)),
            300 => Some(NonZeroU16::new_unchecked(315)),
            301 => Some(NonZeroU16::new_unchecked(316)),
            352 => Some(NonZeroU16::new_unchecked(317)),
            343 => Some(NonZeroU16::new_unchecked(318)),
            344 => Some(NonZeroU16::new_unchecked(319)),
            299 => Some(NonZeroU16::new_unchecked(320)),
            324 => Some(NonZeroU16::new_unchecked(321)),
            302 => Some(NonZeroU16::new_unchecked(322)),
            339 => Some(NonZeroU16::new_unchecked(323)),
            340 => Some(NonZeroU16::new_unchecked(324)),
            370 => Some(NonZeroU16::new_unchecked(325)),
            341 => Some(NonZeroU16::new_unchecked(326)),
            342 => Some(NonZeroU16::new_unchecked(327)),
            349 => Some(NonZeroU16::new_unchecked(328)),
            350 => Some(NonZeroU16::new_unchecked(329)),
            318 => Some(NonZeroU16::new_unchecked(330)),
            319 => Some(NonZeroU16::new_unchecked(331)),
            328 => Some(NonZeroU16::new_unchecked(332)),
            329 => Some(NonZeroU16::new_unchecked(333)),
            330 => Some(NonZeroU16::new_unchecked(334)),
            296 => Some(NonZeroU16::new_unchecked(335)),
            297 => Some(NonZeroU16::new_unchecked(336)),
            309 => Some(NonZeroU16::new_unchecked(337)),
            310 => Some(NonZeroU16::new_unchecked(338)),
            322 => Some(NonZeroU16::new_unchecked(339)),
            323 => Some(NonZeroU16::new_unchecked(340)),
            363 => Some(NonZeroU16::new_unchecked(341)),
            364 => Some(NonZeroU16::new_unchecked(342)),
            365 => Some(NonZeroU16::new_unchecked(343)),
            331 => Some(NonZeroU16::new_unchecked(344)),
            332 => Some(NonZeroU16::new_unchecked(345)),
            361 => Some(NonZeroU16::new_unchecked(346)),
            362 => Some(NonZeroU16::new_unchecked(347)),
            337 => Some(NonZeroU16::new_unchecked(348)),
            338 => Some(NonZeroU16::new_unchecked(349)),
            298 => Some(NonZeroU16::new_unchecked(350)),
            325 => Some(NonZeroU16::new_unchecked(351)),
            326 => Some(NonZeroU16::new_unchecked(352)),
            311 => Some(NonZeroU16::new_unchecked(353)),
            312 => Some(NonZeroU16::new_unchecked(354)),
            303 => Some(NonZeroU16::new_unchecked(355)),
            307 => Some(NonZeroU16::new_unchecked(356)),
            308 => Some(NonZeroU16::new_unchecked(357)),
            333 => Some(NonZeroU16::new_unchecked(358)),
            334 => Some(NonZeroU16::new_unchecked(359)),
            360 => Some(NonZeroU16::new_unchecked(360)),
            355 => Some(NonZeroU16::new_unchecked(361)),
            356 => Some(NonZeroU16::new_unchecked(362)),
            315 => Some(NonZeroU16::new_unchecked(363)),
            287 => Some(NonZeroU16::new_unchecked(364)),
            288 => Some(NonZeroU16::new_unchecked(365)),
            289 => Some(NonZeroU16::new_unchecked(366)),
            316 => Some(NonZeroU16::new_unchecked(367)),
            317 => Some(NonZeroU16::new_unchecked(368)),
            357 => Some(NonZeroU16::new_unchecked(369)),
            293 => Some(NonZeroU16::new_unchecked(370)),
            294 => Some(NonZeroU16::new_unchecked(371)),
            295 => Some(NonZeroU16::new_unchecked(372)),
            366 => Some(NonZeroU16::new_unchecked(373)),
            367 => Some(NonZeroU16::new_unchecked(374)),
            368 => Some(NonZeroU16::new_unchecked(375)),
            359 => Some(NonZeroU16::new_unchecked(376)),
            353 => Some(NonZeroU16::new_unchecked(377)),
            354 => Some(NonZeroU16::new_unchecked(378)),
            336 => Some(NonZeroU16::new_unchecked(379)),
            335 => Some(NonZeroU16::new_unchecked(380)),
            369 => Some(NonZeroU16::new_unchecked(381)),
            304 => Some(NonZeroU16::new_unchecked(382)),
            305 => Some(NonZeroU16::new_unchecked(383)),
            306 => Some(NonZeroU16::new_unchecked(384)),
            351 => Some(NonZeroU16::new_unchecked(385)),
            313 => Some(NonZeroU16::new_unchecked(386)),
            314 => Some(NonZeroU16::new_unchecked(387)),
            345 => Some(NonZeroU16::new_unchecked(388)),
            346 => Some(NonZeroU16::new_unchecked(389)),
            347 => Some(NonZeroU16::new_unchecked(390)),
            348 => Some(NonZeroU16::new_unchecked(391)),
            280 => Some(NonZeroU16::new_unchecked(392)),
            281 => Some(NonZeroU16::new_unchecked(393)),
            282 => Some(NonZeroU16::new_unchecked(394)),
            371 => Some(NonZeroU16::new_unchecked(395)),
            372 => Some(NonZeroU16::new_unchecked(396)),
            373 => Some(NonZeroU16::new_unchecked(397)),
            374 => Some(NonZeroU16::new_unchecked(398)),
            375 => Some(NonZeroU16::new_unchecked(399)),
            376 => Some(NonZeroU16::new_unchecked(400)),
            377 => Some(NonZeroU16::new_unchecked(401)),
            378 => Some(NonZeroU16::new_unchecked(402)),
            379 => Some(NonZeroU16::new_unchecked(403)),
            382 => Some(NonZeroU16::new_unchecked(404)),
            383 => Some(NonZeroU16::new_unchecked(405)),
            384 => Some(NonZeroU16::new_unchecked(406)),
            380 => Some(NonZeroU16::new_unchecked(407)),
            381 => Some(NonZeroU16::new_unchecked(408)),
            385 => Some(NonZeroU16::new_unchecked(409)),
            386 => Some(NonZeroU16::new_unchecked(410)),
            358 => Some(NonZeroU16::new_unchecked(411)),
            _ => None,
        }
    }
}
#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct Gen3PokemonIndex(NonZeroU16);

const INVALID_INDEX_MESSAGE: &str =
    "Gen3PokemonIndex should always be valid for conversion to NatDexIndex";

impl Gen3PokemonIndex {
    pub const fn new(gen3_index: u16) -> Result<Self, InvalidGen3PokemonIndex> {
        if let Some(non_zero) = NonZeroU16::new(gen3_index)
            && gen3_to_national_dex(gen3_index).is_some()
        {
            Ok(Self(non_zero))
        } else {
            Err(InvalidGen3PokemonIndex(gen3_index))
        }
    }

    pub const fn from_national_dex(national_dex: u16) -> Result<Self, InvalidGen3PokemonIndex> {
        if let Some(gen3_index) = national_dex_to_gen3(national_dex) {
            Ok(Self(gen3_index))
        } else {
            Err(InvalidGen3PokemonIndex(national_dex))
        }
    }

    pub fn to_national_dex(self) -> NatDexIndex {
        gen3_to_national_dex(self.0.get())
            .map(NatDexIndex::new)
            .expect(INVALID_INDEX_MESSAGE)
            .expect(INVALID_INDEX_MESSAGE)
    }

    pub const fn to_le_bytes(self) -> [u8; 2] {
        self.0.get().to_le_bytes()
    }
}

impl Default for Gen3PokemonIndex {
    fn default() -> Self {
        Self(unsafe { NonZeroU16::new_unchecked(1) })
    }
}

#[cfg(feature = "randomize")]
impl Randomize for Gen3PokemonIndex {
    fn randomized<R: rand::prelude::Rng>(rng: &mut R) -> Self {
        Self::from_national_dex(rng.random_range(1..=NationalDex::Deoxys as u16))
            .expect("all pokémon through Deoxys have a gen 3 index")
    }
}

impl From<Gen3PokemonIndex> for u16 {
    fn from(gen3_index: Gen3PokemonIndex) -> Self {
        gen3_index.0.get()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct InvalidGen3PokemonIndex(u16);

impl From<InvalidGen3PokemonIndex> for Error {
    fn from(error: InvalidGen3PokemonIndex) -> Self {
        Error::NationalDex {
            value: error.0,
            source: NdexConvertSource::Gen3,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn encode_decode_round_trip(value: u16) {
        if let Some(encoded) = gen3_to_national_dex(value) {
            assert_eq!(
                national_dex_to_gen3(encoded).map(NonZeroU16::get),
                Some(value)
            );
        }
    }

    fn decode_encode_round_trip(value: u16) {
        if let Some(decoded) = national_dex_to_gen3(value) {
            assert_eq!(gen3_to_national_dex(decoded.get()), Some(value));
        }
    }

    #[test]
    fn test_encode_decode_round_trip() {
        for value in 0..=u16::MAX {
            encode_decode_round_trip(value);
        }
    }

    #[test]
    fn test_decode_encode_round_trip() {
        for value in 0..=u16::MAX {
            decode_encode_round_trip(value);
        }
    }
}
