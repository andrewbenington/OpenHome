use crate::gen9_sv;
use crate::ohpkm::issues::OhpkmIssue;
use crate::ohpkm::v2::OhpkmSectionTag;
use crate::ohpkm::v2_sections::bytes_are_empty;
use crate::result::{Error, Result};
use crate::sectioned_data::DataSection;

use pkm_rs_resources::moves::lza_plus;
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_types::{FlagSet, TeraType};
use serde::Serialize;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

// PK9 has space for up to 200 base game TMs, but only 171 are used.
// DLC TMs are stored separately.
pub const SV_BASE_TM_BYTES_EXCLUDE_UNUSED: usize = 22;

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct ScarletVioletData {
    pub tera_type_original: TeraType,
    pub tera_type_override: Option<TeraType>,
    pub tm_flags: FlagSet<SV_BASE_TM_BYTES_EXCLUDE_UNUSED>,
    pub tm_flags_dlc: FlagSet<{ gen9_sv::TM_FLAG_BYTE_LENGTH_DLC }>,
}

impl ScarletVioletData {
    pub fn from_v1(old: crate::ohpkm::v1::OhpkmV1) -> Option<Self> {
        let tera_type_original = TeraType::from_byte_original(old.tera_type_original).ok()?;
        let tera_type_override = TeraType::from_byte_override(old.tera_type_override).ok()?;

        if !old.game_of_origin.is_scarlet_violet()
            && tera_type_override.is_none()
            && bytes_are_empty(&old.tm_flags_sv)
            && bytes_are_empty(&old.tm_flags_sv_dlc)
        {
            None
        } else {
            Some(Self {
                tera_type_original,
                tera_type_override,
                tm_flags: FlagSet::from_bytes(old.tm_flags_sv),
                tm_flags_dlc: FlagSet::from_bytes(old.tm_flags_sv_dlc),
            })
        }
    }

    pub fn default_generated_tera_type(species_and_form: SpeciesForm) -> Self {
        Self {
            tera_type_original: species_and_form
                .get_forme_metadata()
                .transferred_tera_type(),
            ..Default::default()
        }
    }

    pub fn fix_errors(&mut self) -> Vec<OhpkmIssue> {
        let mut issues: Vec<OhpkmIssue> = vec![];
        // OpenHome incorrectly stored stellar tera pre-1.15.2
        if let TeraType::Standard(tera_type) = self.tera_type_original
            && tera_type as u8 == 18
        {
            self.tera_type_original = TeraType::Stellar;
            issues.push(OhpkmIssue::StellarTeraCorrupted);
        }

        // OpenHome incorrectly stored stellar tera pre-1.15.2
        if let Some(TeraType::Standard(tera_type)) = self.tera_type_override
            && tera_type as u8 == 18
        {
            self.tera_type_override = Some(TeraType::Stellar);
            issues.push(OhpkmIssue::StellarTeraCorrupted);
        }

        issues
    }
}

impl DataSection for ScarletVioletData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::ScarletViolet;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        // try_into() will always succeed thanks to the buffer size check
        let tera_type_original = TeraType::from_byte_original(bytes[0])?;

        Ok(Self {
            tera_type_original,
            tera_type_override: TeraType::from_byte_override(bytes[1])?,
            tm_flags: FlagSet::from_bytes(bytes[2..24].try_into().unwrap()),
            tm_flags_dlc: FlagSet::from_bytes(bytes[24..37].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 37];

        bytes[0] = self.tera_type_original.to_byte();
        bytes[1] = self
            .tera_type_override
            .map_or(TeraType::NO_OVERRIDE, TeraType::to_byte);
        bytes[2..24].copy_from_slice(&self.tm_flags.to_bytes());
        bytes[24..37].copy_from_slice(&self.tm_flags_dlc.to_bytes());

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        self.tera_type_override.is_none()
            && self.tm_flags.is_empty()
            && self.tm_flags_dlc.is_empty()
    }
}

pub const LZA_BASE_TM_BYTES: usize = 25;
pub const LZA_DLC_TM_BYTES: usize = 13;
pub const LZA_PLUS_MOVES_BLOCK_C_BYTES: usize = 33;
pub const LZA_PLUS_MOVES_BLOCK_D_BYTES: usize = 12;

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct LegendsZaData {
    pub tm_flags_base: FlagSet<LZA_BASE_TM_BYTES>,
    pub tm_flags_dlc: FlagSet<LZA_DLC_TM_BYTES>,
    pub plus_move_flags_c: FlagSet<LZA_PLUS_MOVES_BLOCK_C_BYTES>,
    pub plus_move_flags_d: FlagSet<LZA_PLUS_MOVES_BLOCK_D_BYTES>,
}

impl LegendsZaData {
    pub fn set_plus_move(&mut self, move_id: u16) {
        if let Some(block_c_index) = lza_plus::plus_move_index_by_move_id_block_c(move_id) {
            self.plus_move_flags_c.set_flag(block_c_index, true);
        } else if let Some(block_d_index) = lza_plus::plus_move_index_by_move_id_block_d(move_id) {
            self.plus_move_flags_d.set_flag(block_d_index, true);
        }
    }
}

impl DataSection for LegendsZaData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::LegendsZa;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        // try_into() will always succeed thanks to the buffer size check

        Ok(Self {
            tm_flags_base: FlagSet::from_bytes(bytes[0..25].try_into().unwrap()),
            tm_flags_dlc: FlagSet::from_bytes(bytes[25..38].try_into().unwrap()),
            plus_move_flags_c: FlagSet::from_bytes(bytes[38..71].try_into().unwrap()),
            plus_move_flags_d: FlagSet::from_bytes(bytes[71..83].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 83];

        bytes[0..25].copy_from_slice(&self.tm_flags_base.to_bytes());
        bytes[25..38].copy_from_slice(&self.tm_flags_dlc.to_bytes());
        bytes[38..71].copy_from_slice(&self.plus_move_flags_c.to_bytes());
        bytes[71..83].copy_from_slice(&self.plus_move_flags_d.to_bytes());

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        self.tm_flags_base.is_empty()
            && self.tm_flags_dlc.is_empty()
            && self.plus_move_flags_c.is_empty()
            && self.plus_move_flags_d.is_empty()
    }
}
