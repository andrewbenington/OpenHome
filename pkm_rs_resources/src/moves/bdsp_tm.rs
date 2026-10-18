use crate::moves::MoveIndex;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const MOVE_ID_BY_TM_INDEX: [u16; 100] = [
    264, 337, 352, 347, 46, 92, 258, 339, 331, 526, 241, 269, 58, 59, 63, 113, 182, 240, 202, 219,
    605, 76, 231, 85, 87, 89, 490, 91, 94, 247, 280, 104, 115, 351, 53, 188, 201, 126, 317, 332,
    259, 263, 521, 156, 213, 168, 211, 285, 503, 315, 355, 411, 412, 206, 362, 374, 451, 203, 406,
    409, 261, 405, 417, 153, 421, 371, 278, 416, 397, 148, 444, 419, 86, 360, 14, 446, 244, 555,
    399, 157, 404, 214, 523, 398, 138, 447, 207, 365, 369, 164, 430, 433, 15, 19, 57, 70, 432, 249,
    127, 431,
];

const MAX_VAL: usize = super::index_lookup::max_value(&MOVE_ID_BY_TM_INDEX) as usize;

const TM_INDEX_BY_MOVE_ID: [u16; MAX_VAL + 1] =
    super::index_lookup::build_reverse(MOVE_ID_BY_TM_INDEX);

pub const fn move_id_by_tm_index(index: usize) -> Option<MoveIndex> {
    super::index_lookup::move_id_by_index(&MOVE_ID_BY_TM_INDEX, index)
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "moveIdByBdspTmIndex"))]
#[allow(clippy::missing_const_for_fn)]
pub fn move_id_by_tm_index_wasm(index: usize) -> Option<u16> {
    super::index_lookup::move_id_by_index_wasm(&MOVE_ID_BY_TM_INDEX, index)
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "bdspTmIndexByMoveId"))]
#[allow(clippy::missing_const_for_fn)]
pub fn tm_index_by_move_id(move_id: u16) -> Option<u16> {
    super::index_lookup::index_by_move_id(&TM_INDEX_BY_MOVE_ID, move_id)
}
