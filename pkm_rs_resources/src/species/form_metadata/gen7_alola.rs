use pkm_rs_types::{NationalDex, PkmType, Stats8};

use crate::pkhex_bin::{SM_LEVELUP_PKL, SM_PERSONAL_FILE, USUM_LEVELUP_PKL, USUM_PERSONAL_FILE};
use crate::species::form_metadata::{BaseStats, GameMetadata, PersonalInfo};

const GEN7_ALOLA_ENTRY_SIZE: usize = 0x54;

type GameMetadataGen7Alola = GameMetadata<PersonalInfoGen7Alola, GEN7_ALOLA_ENTRY_SIZE>;

pub static METADATA_TABLE_SM: GameMetadataGen7Alola =
    GameMetadataGen7Alola::from_binary(SM_PERSONAL_FILE, SM_LEVELUP_PKL);

pub static METADATA_TABLE_USUM: GameMetadataGen7Alola =
    GameMetadataGen7Alola::from_binary(USUM_PERSONAL_FILE, USUM_LEVELUP_PKL);

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoGen7Alola([u8; GEN7_ALOLA_ENTRY_SIZE]);

impl PersonalInfoGen7Alola {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(bytes.try_into().unwrap())
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(self.0[0..6].try_into().unwrap())
    }

    pub fn forms_offset(&self) -> Option<u16> {
        let stored_index = i16::from_le_bytes(self.0[0x1c..0x1e].try_into().unwrap());
        if stored_index == -1 {
            None
        } else {
            Some(stored_index as u16)
        }
    }

    pub fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        if form_index == 0 {
            return Some(national_dex);
        }
        if let Some(forms_offset) = self.forms_offset()
            && form_index < self.form_count() as u16
        {
            Some(forms_offset + form_index - 1)
        } else {
            None
        }
    }

    pub const fn form_count(&self) -> u8 {
        self.0[0x20]
    }
}

impl PersonalInfo for PersonalInfoGen7Alola {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Zeraora;

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
        "Gen 7 (Alola)"
    }
}

#[cfg(test)]
mod tests {
    use pkm_rs_types::NationalDex;

    use super::*;

    #[test]
    fn unsupported_mon_doesnt_crash() {
        let metadata = &METADATA_TABLE_SM;
        assert_eq!(
            metadata.get_game_index(NationalDex::Urshifu as u16, 0),
            None
        );
    }
}
