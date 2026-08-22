use crate::ExpectLog;
use crate::pkhex_bin::{CRYSTAL_LEVELUP_PKL, CRYSTAL_PERSONAL_FILE};
use crate::pkhex_bin::{GS_LEVELUP_PKL, GS_PERSONAL_FILE};
use crate::species::form_metadata::{BaseStats, GameMetadata, PersonalInfo};
use pkm_rs_types::{NationalDex, PkmType, Stats8};

const GEN2_ENTRY_SIZE: usize = 0x20;

type GameMetadataGen2 = GameMetadata<PersonalInfoGen2, GEN2_ENTRY_SIZE>;

pub static METADATA_TABLE_GS: GameMetadataGen2 =
    GameMetadataGen2::from_binary(GS_PERSONAL_FILE, GS_LEVELUP_PKL);

pub static METADATA_TABLE_CRYSTAL: GameMetadataGen2 =
    GameMetadataGen2::from_binary(CRYSTAL_PERSONAL_FILE, CRYSTAL_LEVELUP_PKL);

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoGen2(&'static [u8]);

impl PersonalInfoGen2 {
    pub const fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self(bytes)
    }

    pub fn base_stats(&self) -> Stats8 {
        Stats8::from_bytes(
            self.0[1..7].try_into().expect_log(
                "Bad slice length for Stats8::from_bytes in PersonalInfoGen2::base_stats",
            ),
        )
    }
}

const UNOWN_Z: u16 = 26;

impl PersonalInfo for PersonalInfoGen2 {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Celebi;

    fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self::from_pkl_bytes(bytes)
    }

    fn stats(&self) -> BaseStats {
        BaseStats::Modern(self.base_stats())
    }

    fn types_fallible(&self) -> (Option<PkmType>, Option<PkmType>) {
        (
            PkmType::from_byte_gen12(self.0[7]),
            PkmType::from_byte_gen12(self.0[8]),
        )
    }

    fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        if form_index == 0 {
            return Some(national_dex);
        }
        if national_dex == NationalDex::Unown && form_index <= UNOWN_Z {
            Some(0)
        } else {
            None
        }
    }

    fn source_name(&self) -> &'static str {
        "Gen 2"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pikachu_stats_match() -> Result<(), impl std::fmt::Debug> {
        let stats = METADATA_TABLE_GS
            .get_base_stats(NationalDex::Pikachu as u16, 0)
            .ok_or("Failed to get base stats for Pikachu")?;

        if stats
            != BaseStats::Modern(Stats8 {
                hp: 35,
                atk: 55,
                def: 30,
                spe: 90,
                spa: 50,
                spd: 40,
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
}
