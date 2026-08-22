use crate::pkhex_bin::{DP_LEVELUP_PKL, DP_PERSONAL_FILE};
use crate::pkhex_bin::{HGSS_LEVELUP_PKL, HGSS_PERSONAL_FILE};
use crate::pkhex_bin::{PT_LEVELUP_PKL, PT_PERSONAL_FILE};
use crate::species::form;
use crate::species::form_metadata::{BaseStats, GameMetadata, PersonalInfo};
use pkm_rs_types::{NationalDex, PkmType, Stats8, log::ExpectLog};

const GEN4_ENTRY_SIZE: usize = 0x2C;

type GameMetadataGen4 = GameMetadata<PersonalInfoGen4, GEN4_ENTRY_SIZE>;

pub static METADATA_TABLE_DP: GameMetadataGen4 =
    GameMetadataGen4::from_binary(DP_PERSONAL_FILE, DP_LEVELUP_PKL);

pub static METADATA_TABLE_PT: GameMetadataGen4 =
    GameMetadataGen4::from_binary(PT_PERSONAL_FILE, PT_LEVELUP_PKL);

pub static METADATA_TABLE_HGSS: GameMetadataGen4 =
    GameMetadataGen4::from_binary(HGSS_PERSONAL_FILE, HGSS_LEVELUP_PKL);

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoGen4([u8; GEN4_ENTRY_SIZE]);

impl PersonalInfoGen4 {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(
            bytes
                .try_into()
                .expect_log("bad length for PersonalInfoGen4"),
        )
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(
            self.0[0..6]
                .try_into()
                .expect_log("bad length for PersonalInfoGen4::stats"),
        )
    }

    pub fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        if form_index == 0 {
            return Some(national_dex);
        }

        // Spiky Eared Pichu's metadata is zeroed out, so if this is HGSS return Pichu's data.
        if Self::supports_form(national_dex, form_index)
            && national_dex == NationalDex::Pichu as u16
        {
            Some(NationalDex::Pichu as u16)
        } else if Self::supports_form(national_dex, form_index)
            && let Some(forms_offset) = self.forms_offset()
            && form_index < self.form_count() as u16
        {
            Some(forms_offset + form_index - 1)
        } else {
            None
        }
    }

    pub fn forms_offset(&self) -> Option<u16> {
        let stored_index = i16::from_le_bytes(
            self.0[0x2a..0x2c]
                .try_into()
                .expect_log("bad length for i16 in PersonalInfoGen4::forms_offset"),
        );
        if stored_index == -1 {
            None
        } else {
            Some(stored_index as u16)
        }
    }

    fn supports_form(national_dex: u16, form_index: u16) -> bool {
        let Ok(national_dex) = NationalDex::try_from(national_dex) else {
            return false;
        };
        match national_dex {
            NationalDex::Pichu => form_index <= form::PICHU_SPIKY_EARED,
            NationalDex::Unown => form_index <= form::UNOWN_QUESTION,
            NationalDex::Castform => form_index <= form::CASTFORM_SNOWY,
            NationalDex::Deoxys => form_index <= form::DEOXYS_SPEED,
            NationalDex::Burmy => form_index <= form::BURMY_TRASH,
            NationalDex::Wormadam => form_index <= form::WORMADAM_TRASH,
            NationalDex::Mothim => form_index <= form::MOTHIM_TRASH,
            NationalDex::Cherrim => form_index <= form::CHERRIM_SUNSHINE,
            NationalDex::Shellos => form_index <= form::SHELLOS_EAST_SEA,
            NationalDex::Gastrodon => form_index <= form::GASTRODON_EAST_SEA,
            NationalDex::Rotom => form_index <= form::ROTOM_MOW,
            NationalDex::Arceus => {
                form_index != form::ARCEUS_CURSE_GEN4 && form_index <= form::ARCEUS_DARK_GEN4
            }
            _ => form_index == 0,
        }
    }

    pub const fn form_count(&self) -> u8 {
        self.0[0x29]
    }
}

impl PersonalInfo for PersonalInfoGen4 {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Arceus;

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
        "Gen 4"
    }
}

#[cfg(test)]
mod tests {
    use pkm_rs_types::NationalDex;

    use super::*;

    #[test]
    fn unsupported_mon_doesnt_crash() {
        let metadata = &METADATA_TABLE_DP;
        assert_eq!(
            metadata.get_game_index(NationalDex::Urshifu as u16, 0),
            None
        );
    }
}
