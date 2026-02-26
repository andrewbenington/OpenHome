use pkm_rs_resources::species::SpeciesAndForme;
use serde::Serialize;

use crate::pkm::plugins::cfru::pk3cfru::Pk3Cfru;
use crate::pkm::plugins::rr::conversion::{NATIONAL_DEX_TO_RR_MAP, RR_TO_NATIONAL_DEX_MAP};
use crate::pkm::{Error, NdexConvertSource};
use crate::pkm::{Result, plugins::cfru::pk3cfru::CfruSpeciesIndex};

const FAKEMON_INDEXES: [u16; 22] = [
    1186, 1200, 1274, 1275, 1276, 1277, 1278, 1279, 1282, 1283, 1284, 1285, 1286, 1287, 1288, 1289,
    1290, 1291, 1292, 1293, 1294, 1375,
];

#[derive(Clone, Copy, Serialize)]
pub struct RadicalRedSpeciesIndex(u16);

impl CfruSpeciesIndex for RadicalRedSpeciesIndex {
    fn try_to_species_and_forme(self) -> Result<SpeciesAndForme> {
        RR_TO_NATIONAL_DEX_MAP
            .get(&self.0)
            .ok_or(Error::GameDex {
                value: self.0,
                game: NdexConvertSource::Gen3RR,
            })
            .copied()
    }

    fn try_from_species_and_forme(saf: &SpeciesAndForme) -> Result<Self> {
        NATIONAL_DEX_TO_RR_MAP
            .get(&saf.to_tuple())
            .ok_or(Error::GenDex {
                saf: *saf,
                generation: NdexConvertSource::Gen3RR,
            })
            .copied()
            .map(RadicalRedSpeciesIndex)
    }

    fn is_fakemon(&self) -> bool {
        FAKEMON_INDEXES.contains(&self.0)
    }

    fn plugin_identifier() -> &'static str {
        "radical_red"
    }
}

impl From<u16> for RadicalRedSpeciesIndex {
    fn from(value: u16) -> Self {
        Self(value)
    }
}

impl From<RadicalRedSpeciesIndex> for u16 {
    fn from(value: RadicalRedSpeciesIndex) -> Self {
        value.0
    }
}

pub type Pk3rr = Pk3Cfru<RadicalRedSpeciesIndex>;
