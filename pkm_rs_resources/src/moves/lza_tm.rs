use crate::moves::MoveIndex;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const MOVE_ID_BY_BASE_GAME_TM_INDEX: [u16; 107] = [
    29, 337, 473, 249, 46, 347, 92, 86, 812, 280, 339, 157, 58, 424, 423, 113, 182, 612, 408, 583,
    422, 332, 9, 8, 242, 412, 129, 91, 7, 14, 115, 104, 34, 400, 203, 317, 446, 126, 435, 331, 352,
    202, 19, 63, 282, 341, 97, 120, 196, 315, 219, 414, 188, 434, 416, 38, 261, 442, 428, 248, 421,
    53, 94, 76, 444, 521, 85, 257, 89, 250, 304, 83, 57, 247, 406, 710, 398, 523, 542, 334, 404,
    369, 417, 430, 164, 528, 231, 191, 390, 399, 174, 605, 200, 18, 269, 56, 377, 127, 118, 441,
    527, 411, 526, 394, 59, 87, 370,
];

const MAX_VAL_BASE_GAME: usize =
    super::index_lookup::max_value(&MOVE_ID_BY_BASE_GAME_TM_INDEX) as usize;

const BASE_GAME_TM_INDEX_BY_MOVE_ID: [u16; MAX_VAL_BASE_GAME + 1] =
    super::index_lookup::build_reverse(MOVE_ID_BY_BASE_GAME_TM_INDEX);

pub const fn move_id_by_base_game_tm_index(index: usize) -> Option<MoveIndex> {
    super::index_lookup::move_id_by_index(&MOVE_ID_BY_BASE_GAME_TM_INDEX, index)
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "moveIdByLzaBaseTmIndex"))]
#[allow(clippy::missing_const_for_fn)]
pub fn move_id_by_base_game_tm_index_wasm(index: usize) -> Option<u16> {
    super::index_lookup::move_id_by_index_wasm(&MOVE_ID_BY_BASE_GAME_TM_INDEX, index)
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "lzaBaseTmIndexByMoveId"))]
#[allow(clippy::missing_const_for_fn)]
pub fn base_game_tm_index_by_move_id(move_id: u16) -> Option<u16> {
    super::index_lookup::index_by_move_id(&BASE_GAME_TM_INDEX_BY_MOVE_ID, move_id)
}

const MOVE_ID_BY_DLC_TM_INDEX: [u16; 53] = [
    4, 263, 886, 47, 491, 490, 488, 885, 6, 318, 325, 466, 246, 259, 206, 305, 706, 102, 443, 138,
    402, 509, 451, 409, 458, 299, 814, 530, 815, 480, 524, 207, 330, 252, 660, 799, 813, 13, 130,
    161, 503, 333, 410, 80, 669, 143, 90, 329, 800, 796, 307, 308, 338,
];

const MAX_VAL_DLC: usize = super::index_lookup::max_value(&MOVE_ID_BY_DLC_TM_INDEX) as usize;

const DLC_TM_INDEX_BY_MOVE_ID: [u16; MAX_VAL_DLC + 1] =
    super::index_lookup::build_reverse(MOVE_ID_BY_DLC_TM_INDEX);

pub const fn move_id_by_dlc_tm_index(index: usize) -> Option<MoveIndex> {
    super::index_lookup::move_id_by_index(&MOVE_ID_BY_DLC_TM_INDEX, index)
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "moveIdByLzaDlcTmIndex"))]
#[allow(clippy::missing_const_for_fn)]
pub fn move_id_by_dlc_tm_index_wasm(index: usize) -> Option<u16> {
    super::index_lookup::move_id_by_index_wasm(&MOVE_ID_BY_DLC_TM_INDEX, index)
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "lzaDlcTmIndexByMoveId"))]
#[allow(clippy::missing_const_for_fn)]
pub fn dlc_tm_index_by_move_id(move_id: u16) -> Option<u16> {
    super::index_lookup::index_by_move_id(&DLC_TM_INDEX_BY_MOVE_ID, move_id)
}
