use crate::gen9_sv::Pk9;
use crate::result::Result;
use crate::traits::PkmBytes;
use crate::traits::{IsShiny, ModernEvs};

use pkm_rs_types::Stats8;
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::RandomizeAndFix;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "CompassPk9Wasm"))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct CompassPk9(pub(super) Pk9);

impl CompassPk9 {
    pub const fn into_pk9(self) -> Pk9 {
        self.0
    }

    pub const fn from_pk9(v: Pk9) -> Self {
        Self(v)
    }
}

impl IsShiny for CompassPk9 {
    fn is_shiny(&self) -> bool {
        self.0.is_shiny()
    }

    fn is_square_shiny(&self) -> bool {
        self.0.is_square_shiny()
    }
}

impl PkmBytes for CompassPk9 {
    const BOX_SIZE: usize = Pk9::BOX_SIZE;
    const PARTY_SIZE: usize = Pk9::BOX_SIZE;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Pk9::from_bytes(bytes).map(Self)
    }

    fn write_box_bytes(&self, bytes: &mut [u8]) {
        self.0.write_box_bytes(bytes);
    }

    fn write_party_bytes(&self, bytes: &mut [u8]) {
        self.write_box_bytes(bytes);
    }

    fn to_box_bytes(&self) -> Box<[u8]> {
        self.0.to_box_bytes()
    }

    fn to_party_bytes(&self) -> Box<[u8]> {
        self.0.to_party_bytes()
    }
}

impl ModernEvs for CompassPk9 {
    fn get_evs(&self) -> Stats8 {
        self.0.evs
    }
}

#[cfg(feature = "randomize")]
impl RandomizeAndFix for CompassPk9 {
    fn fix<R: rand::prelude::Rng>(&mut self, rng: &mut R) {
        self.0.fix(rng);
    }
}

#[cfg(test)]
impl crate::tests::PkhexJson for CompassPk9 {
    fn to_pkhex_json_value(&self) -> std::result::Result<serde_json::Value, serde_json::Error> {
        self.0.to_pkhex_json_value()
    }
}

#[cfg(test)]
mod tests {
    use super::Pk9;
    use crate::checksum::Checksum;
    use crate::convert_strategy::ConvertStrategy;
    use crate::gen9_sv::pk9_buffer::Pk9Buffer;
    use crate::ohpkm::{OhpkmConvert, OhpkmV2};
    use crate::tests::{self, TestResult};
    use crate::traits::IsShiny;

    #[cfg(feature = "randomize")]
    use pkm_rs_types::randomize::RandomizeAndFix;
    #[cfg(feature = "randomize")]
    use rand::{SeedableRng, rngs::StdRng};
    use std::path::PathBuf;

    #[test]
    fn to_from_bytes() -> TestResult<()> {
        tests::to_from_bytes_all_in_dir::<Pk9>(
            &PathBuf::from("test-files").join("pkm-files").join("pk9"),
        )
    }

    #[cfg(feature = "randomize")]
    #[test]
    fn to_from_bytes_random() -> std::result::Result<(), tests::TestErrorWithSeed> {
        for seed in 0..=1000 {
            let mon = Pk9::randomize_and_fix(&mut StdRng::seed_from_u64(seed));
            tests::find_inconsistencies_to_from_bytes(mon)
                .map_err(|error| tests::TestErrorWithSeed { seed, error })?;
        }

        Ok(())
    }

    #[test]
    fn is_shiny() -> TestResult<()> {
        let path = PathBuf::from("pk9").join("0446 ★ - Munchlax - AF1E69687576.pk9");
        let mon = tests::pkm_from_file::<Pk9>(&path)?.0;
        assert!(mon.is_shiny());

        Ok(())
    }

    #[test]
    fn compare_pkhex_wasm() -> TestResult<()> {
        tests::compare_pkhex_json_all_in_dir::<Pk9>(&PathBuf::from("pk9"))
    }

    #[test]
    fn compare_pkhex_encryption() -> TestResult<()> {
        tests::compare_pkhex_encryption_all_in_dir(
            &PathBuf::from("pk9"),
            Pk9::to_box_bytes_encrypted,
        )
    }

    #[test]
    fn nickname_garbage_preserved() -> TestResult<()> {
        let (mon, bytes) =
            tests::pkm_from_file::<Pk9>(&PathBuf::from("pk9").join("koraidon-garbage-bytes.pk9"))?;

        let mon_recreated = Pk9::from_ohpkm(
            &OhpkmV2::convert_with_backup(&mon, &bytes)?,
            ConvertStrategy::default(),
        )?;

        assert_eq!(mon.nickname.bytes()[..], mon_recreated.nickname.bytes()[..]);

        Ok(())
    }

    #[test]
    fn checksum() -> TestResult<()> {
        for result in tests::all_pkm_and_bytes_in_dir::<Pk9>(&PathBuf::from("pk9"))? {
            let tests::PkmDirEntry::<Pk9> { path, mon, bytes } = result?;
            let buffer = Pk9Buffer::new(&bytes);

            assert_eq!(
                buffer.checksum(),
                buffer.calculate_checksum(),
                "{path:?}: Pk9Buffer checksum calculation is correct"
            );

            assert_eq!(
                mon.checksum,
                mon.calculate_checksum(),
                "{path:?}: Checksum calculation remains correct after deserializing/reserializing"
            );
        }

        Ok(())
    }

    #[test]
    fn from_ohpkm() -> TestResult<()> {
        let mon = tests::pkm_from_file::<OhpkmV2>(&PathBuf::from("ohpkm").join("Machamp.ohpkm"))?.0;

        let _ = Pk9::from_ohpkm(&mon, ConvertStrategy::default());

        Ok(())
    }

    #[test]
    fn ohpkm_preserves_moves() -> TestResult<()> {
        let mon = tests::pkm_from_file::<Pk9>(
            &PathBuf::from("pk9").join("0128-01 - Tauros - 3ACEA55CFD17.pk9"),
        )?
        .0;

        let ohpkm = mon.to_ohpkm()?;

        for (index, (pk9_move, ohpkm_move)) in mon.moves.into_iter().zip(ohpkm.moves()).enumerate()
        {
            assert_eq!(
                pk9_move.move_index, ohpkm_move.move_index,
                "Move in slot {index} is preserved"
            );
        }

        Ok(())
    }

    #[test]
    fn to_from_ohpkm() -> TestResult<()> {
        tests::to_from_ohpkm_all_in_dir::<Pk9>(
            &PathBuf::from("test-files").join("pkm-files").join("pk9"),
        )
    }
}
