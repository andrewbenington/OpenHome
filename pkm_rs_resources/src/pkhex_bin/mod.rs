use pkm_rs_types::pkl_file::PklFileData;

use pkm_rs_types::include_pkl;

// binary files are from https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Resources/byte/personal

pub(crate) const RB_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_rb");
pub(crate) const RB_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_rb.pkl");

pub(crate) const YELLOW_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_y");
pub(crate) const YELLOW_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_y.pkl");

pub(crate) const GS_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_gs");
pub(crate) const GS_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_gs.pkl");

pub(crate) const CRYSTAL_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_c");
pub(crate) const CRYSTAL_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_c.pkl");

pub(crate) const RS_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_rs");
pub(crate) const RS_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_rs.pkl");

pub(crate) const FRLG_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_fr");
pub(crate) const FRLG_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_fr.pkl");

pub(crate) const EMERALD_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_e");
pub(crate) const EMERALD_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_e.pkl");

pub(crate) const DP_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_dp");
pub(crate) const DP_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_dp.pkl");

pub(crate) const PT_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_pt");
pub(crate) const PT_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_pt.pkl");

pub(crate) const HGSS_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_hgss");
pub(crate) const HGSS_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_hgss.pkl");

pub(crate) const BW_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_bw");
pub(crate) const BW_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_bw.pkl");

pub(crate) const B2W2_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_b2w2");
pub(crate) const B2W2_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_b2w2.pkl");

pub(crate) const XY_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_xy");
pub(crate) const XY_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_xy.pkl");

pub(crate) const ORAS_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_ao");
pub(crate) const ORAS_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_ao.pkl");

pub(crate) const SM_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_sm");
pub(crate) const SM_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_sm.pkl");

pub(crate) const USUM_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_uu");
pub(crate) const USUM_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_uu.pkl");

pub(crate) const LGPE_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_gg");
pub(crate) const LGPE_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_gg.pkl");

pub(crate) const SWSH_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_swsh");
pub(crate) const SWSH_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_swsh.pkl");

pub(crate) const BDSP_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_bdsp");
pub(crate) const BDSP_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_bdsp.pkl");

pub(crate) const LA_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_la");
pub(crate) const LA_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_la.pkl");
pub(crate) const LA_MASTERY_PKL: PklFileData = include_pkl!("levelup/mastery_la.pkl");

pub(crate) const SV_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_sv");
pub(crate) const SV_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_sv.pkl");

pub(crate) const LZA_PERSONAL_FILE: &[u8] = include_bytes!("personal/personal_za");
pub(crate) const LZA_LEVELUP_PKL: PklFileData = include_pkl!("levelup/lvlmove_za.pkl");
