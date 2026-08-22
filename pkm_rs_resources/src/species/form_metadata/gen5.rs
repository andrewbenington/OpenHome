use pkm_rs_types::{NationalDex, PkmType, Stats8, log::ExpectLog};

use crate::pkhex_bin::{B2W2_LEVELUP_PKL, B2W2_PERSONAL_FILE, BW_LEVELUP_PKL, BW_PERSONAL_FILE};
use crate::species::form_metadata::{BaseStats, GameMetadata, PersonalInfo};

const BW_ENTRY_SIZE: usize = 0x3C;
const B2W2_ENTRY_SIZE: usize = 0x4C;

type GameMetadataBw = GameMetadata<PersonalInfoBw, BW_ENTRY_SIZE>;

pub static METADATA_TABLE_BW: GameMetadataBw =
    GameMetadataBw::from_binary(BW_PERSONAL_FILE, BW_LEVELUP_PKL);

type GameMetadataB2w2 = GameMetadata<PersonalInfoB2w2, B2W2_ENTRY_SIZE>;

pub static METADATA_TABLE_B2W2: GameMetadataB2w2 =
    GameMetadataB2w2::from_binary(B2W2_PERSONAL_FILE, B2W2_LEVELUP_PKL);

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoBw([u8; BW_ENTRY_SIZE]);

impl PersonalInfoBw {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(bytes.try_into().expect_log("bad length for PersonalInfoBw"))
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(
            self.0[0..6]
                .try_into()
                .expect_log("bad length for PersonalInfoBw::stats"),
        )
    }

    pub fn forms_offset(&self) -> Option<u16> {
        let stored_index = i16::from_le_bytes(
            self.0[0x1c..0x1e]
                .try_into()
                .expect_log("bad length for i16 in PersonalInfoBw::forms_offset"),
        );
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

impl PersonalInfo for PersonalInfoBw {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Genesect;

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
        "Black/White"
    }
}

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoB2w2([u8; B2W2_ENTRY_SIZE]);

impl PersonalInfoB2w2 {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(
            bytes
                .try_into()
                .expect_log("bad length for PersonalInfoB2W2"),
        )
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(
            self.0[0..6]
                .try_into()
                .expect_log("bad length for PersonalInfoB2W2::stats"),
        )
    }

    pub fn forms_offset(&self) -> Option<u16> {
        let stored_index = i16::from_le_bytes(
            self.0[0x1c..0x1e]
                .try_into()
                .expect_log("bad length for i16 in PersonalInfoB2W2::forms_offset"),
        );
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

impl PersonalInfo for PersonalInfoB2w2 {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Genesect;

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
        "Black 2/White 2"
    }
}

#[cfg(test)]
mod tests {
    use pkm_rs_types::NationalDex;

    use super::*;

    #[test]
    fn unsupported_mon_doesnt_crash() {
        let metadata = &METADATA_TABLE_B2W2;
        assert_eq!(
            metadata.get_game_index(NationalDex::Urshifu as u16, 0),
            None
        );
    }
}
