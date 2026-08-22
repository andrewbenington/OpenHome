use crate::ExpectLog;
use crate::pkhex_bin::{RB_LEVELUP_PKL, RB_PERSONAL_FILE};
use crate::pkhex_bin::{YELLOW_LEVELUP_PKL, YELLOW_PERSONAL_FILE};
use crate::species::form_metadata::{BaseStats, GameMetadata, PersonalInfo};
use pkm_rs_types::{NationalDex, PkmType, StatsPreSplit};

const GEN1_ENTRY_SIZE: usize = 0x1c;

type GameMetadataGen1 = GameMetadata<PersonalInfoGen1, GEN1_ENTRY_SIZE>;

pub static METADATA_TABLE_RB: GameMetadataGen1 =
    GameMetadataGen1::from_binary(RB_PERSONAL_FILE, RB_LEVELUP_PKL);

pub static METADATA_TABLE_YELLOW: GameMetadataGen1 =
    GameMetadataGen1::from_binary(YELLOW_PERSONAL_FILE, YELLOW_LEVELUP_PKL);

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoGen1(&'static [u8]);

impl PersonalInfoGen1 {
    pub const fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self(bytes)
    }

    pub fn stats(&self) -> StatsPreSplit {
        StatsPreSplit::from_bytes_u8(
            self.0[1..6]
                .try_into()
                .expect_log("Red/Blue personal entry too short for stats"),
        )
    }
}

impl PersonalInfo for PersonalInfoGen1 {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Mew;

    fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self::from_pkl_bytes(bytes)
    }

    fn stats(&self) -> BaseStats {
        BaseStats::PreSplit(self.stats())
    }

    fn types_fallible(&self) -> (Option<PkmType>, Option<PkmType>) {
        (
            PkmType::from_byte_gen12(self.0[6]),
            PkmType::from_byte_gen12(self.0[7]),
        )
    }

    fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        if form_index == 0 {
            Some(national_dex)
        } else {
            None
        }
    }

    fn source_name(&self) -> &'static str {
        "Red/Blue"
    }
}

#[cfg(test)]
mod tests {
    use pkm_rs_types::NationalDex;

    use super::*;

    #[test]
    fn type_check_red_blue() {
        assert_eq!(
            METADATA_TABLE_RB.get_types(1, 0),
            Some((PkmType::Grass, Some(PkmType::Poison)))
        );
    }

    #[test]
    fn pikachu_stats_match() -> Result<(), impl std::fmt::Debug> {
        let stats = METADATA_TABLE_RB
            .get_base_stats(NationalDex::Pikachu as u16, 0)
            .ok_or("Failed to get base stats for Pikachu")?;

        if stats
            != BaseStats::PreSplit(StatsPreSplit {
                hp: 35,
                atk: 55,
                def: 30,
                spe: 90,
                spc: 50,
            })
        {
            Err(format!(
                "Pikachu's stats do not match expected values. Got: {:?}",
                stats
            ))
        } else {
            Ok(())
        }
    }

    #[test]
    fn magnemite_is_just_electric_gen1() -> Result<(), impl std::fmt::Debug> {
        let types = METADATA_TABLE_RB
            .get_types(NationalDex::Magnemite as u16, 0)
            .ok_or("Failed to get types for Magnemite")?;

        if types != (PkmType::Electric, None) {
            Err(format!(
                "Expected Magnemite to be just Electric in Gen 1, but got types: {:?}",
                types
            ))
        } else {
            Ok(())
        }
    }
}
