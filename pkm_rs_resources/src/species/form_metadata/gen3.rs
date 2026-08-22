use crate::pkhex_bin::{EMERALD_LEVELUP_PKL, EMERALD_PERSONAL_FILE};
use crate::pkhex_bin::{FRLG_LEVELUP_PKL, FRLG_PERSONAL_FILE};
use crate::pkhex_bin::{RS_LEVELUP_PKL, RS_PERSONAL_FILE};
use crate::species::form_metadata::{BaseStats, GameMetadata, PersonalInfo};
use pkm_rs_types::{NationalDex, PkmType, Stats8, log::ExpectLog};

const GEN3_ENTRY_SIZE: usize = 0x1C;

type GameMetadataGen3 = GameMetadata<PersonalInfoGen3, GEN3_ENTRY_SIZE>;

pub static METADATA_TABLE_RS: GameMetadataGen3 =
    GameMetadataGen3::from_binary(RS_PERSONAL_FILE, RS_LEVELUP_PKL);

pub static METADATA_TABLE_FRLG: GameMetadataGen3 =
    GameMetadataGen3::from_binary(FRLG_PERSONAL_FILE, FRLG_LEVELUP_PKL);

pub static METADATA_TABLE_EMERALD: GameMetadataGen3 =
    GameMetadataGen3::from_binary(EMERALD_PERSONAL_FILE, EMERALD_LEVELUP_PKL);

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoGen3([u8; GEN3_ENTRY_SIZE]);

const UNOWN_QUESTION: u16 = 27;
const CASTFORM_SNOWY: u16 = 3;
const DEOXYS_SPEED: u16 = 3;

impl PersonalInfoGen3 {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(
            bytes
                .try_into()
                .expect_log("bad length for PersonalInfoGen3"),
        )
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(
            self.0[0..6]
                .try_into()
                .expect_log("bad length for PersonalInfoGen3::stats"),
        )
    }

    pub fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        if Self::supports_form(national_dex, form_index) {
            Some(national_dex)
        } else {
            None
        }
    }

    fn supports_form(national_dex: u16, form_index: u16) -> bool {
        let Ok(national_dex) = NationalDex::try_from(national_dex) else {
            return false;
        };
        match national_dex {
            NationalDex::Unown => form_index <= UNOWN_QUESTION,
            NationalDex::Castform => form_index <= CASTFORM_SNOWY,
            NationalDex::Deoxys => form_index <= DEOXYS_SPEED,
            _ => form_index == 0,
        }
    }
}

impl PersonalInfo for PersonalInfoGen3 {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Deoxys;

    fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self::from_pkl_bytes(bytes)
    }

    fn stats(&self) -> BaseStats {
        BaseStats::Modern(self.stats())
    }

    fn types_fallible(&self) -> (Option<PkmType>, Option<PkmType>) {
        (PkmType::from_byte(self.0[6]), PkmType::from_byte(self.0[7]))
    }

    fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        self.game_index_for_form(national_dex, form_index)
    }

    fn source_name(&self) -> &'static str {
        "Generation 3"
    }
}

#[cfg(test)]
mod tests {
    use pkm_rs_types::NationalDex;

    use super::*;

    #[test]
    fn unsupported_mon_doesnt_crash() {
        let metadata = &METADATA_TABLE_EMERALD;
        assert_eq!(
            metadata.get_game_index(NationalDex::Urshifu as u16, 0),
            None
        );
    }
}
