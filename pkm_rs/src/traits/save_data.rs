use pkm_rs_types::OriginGame;

use crate::result::Result;
use crate::traits::PkmBytes;

pub trait SaveData: Send + Sync + Sized {
    type PkmType: PkmBytes;

    fn from_bytes(bytes: &[u8]) -> Result<Self>;
    fn get_mon_at(&self, box_num: usize, offset: usize) -> Option<Self::PkmType>;
    fn set_mon_at(&mut self, box_num: usize, offset: usize, mon: Option<Self::PkmType>);
    fn get_decrypted_mon_bytes(&self, box_num: usize, offset: usize) -> Vec<u8>;

    fn box_rows() -> usize;
    fn box_cols() -> usize;
    fn box_slots() -> usize;
    fn box_count() -> usize;
    fn current_pc_box_idx(&self) -> usize;

    fn is_valid_save(bytes: &[u8]) -> bool;

    fn display_tid(&self) -> String;

    fn game_of_origin(&self) -> Option<OriginGame>;
}
