use pkm_rs_types::{PkmType, Stats8};

use crate::species::form_metadata::{sv::SV_PERSONAL_TABLE, za::ZA_PERSONAL_TABLE};

pub mod gen9;
pub mod sv;
pub mod za;

pub trait FormMetadata {
    type FormIndex;

    fn stats(&self) -> Stats8;
    fn types(&self) -> (PkmType, PkmType);
    fn form_stats_index(&self) -> Option<u16>;
    fn form_index(&self, national_dex: u16, form_index: u16) -> Self::FormIndex;
    fn has_form(&self, form_index: u16) -> bool;
    fn form_count(&self) -> u8;
}

pub trait FormMetadataTable {
    type FormIndex;
    type FormMetadataType: FormMetadata<FormIndex = Self::FormIndex>;

    fn get_form_metadata(&self, national_dex: u16) -> Option<&Self::FormMetadataType>;
    fn get_form_index(&self, national_dex: u16, forme_index: u16) -> Option<Self::FormIndex>;
    fn get_form_stats(&self, national_dex: u16, forme_index: u16) -> Option<Stats8>;
}

pub enum FormMetadataSource {
    ScarletViolet,
    LegendsZa,
}

impl FormMetadataSource {
    pub fn get_stats(&self, national_dex: u16, form_index: u16) -> Option<Stats8> {
        match self {
            FormMetadataSource::ScarletViolet => {
                SV_PERSONAL_TABLE.get_form_stats(national_dex, form_index)
            }
            FormMetadataSource::LegendsZa => {
                ZA_PERSONAL_TABLE.get_form_stats(national_dex, form_index)
            }
        }
    }
}
