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

const fn max_value() -> u16 {
    let mut max = 0u16;
    let mut i = 0;
    while i < MOVE_ID_BY_TM_INDEX.len() {
        if MOVE_ID_BY_TM_INDEX[i] > max {
            max = MOVE_ID_BY_TM_INDEX[i];
        }
        i += 1;
    }
    max
}

const MAX_VAL: usize = max_value() as usize;
const NOT_FOUND: u16 = u16::MAX;

const TM_INDEX_BY_MOVE_ID: [u16; MAX_VAL + 1] = build_reverse();

const fn build_reverse() -> [u16; MAX_VAL + 1] {
    let mut table = [NOT_FOUND; MAX_VAL + 1];
    let mut i = 0;
    while i < MOVE_ID_BY_TM_INDEX.len() {
        let v = MOVE_ID_BY_TM_INDEX[i] as usize;
        if table[v] != NOT_FOUND {
            panic!("duplicate value in MOVE_ID_BY_TM_INDEX");
        }
        table[v] = i as u16;
        i += 1;
    }
    table
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "moveIdByBdspTmIndex"))]
#[allow(clippy::missing_const_for_fn)]
pub fn move_id_by_tm_index(index: usize) -> Option<MoveIndex> {
    if index < MOVE_ID_BY_TM_INDEX.len() {
        Some(MoveIndex::from_u16(MOVE_ID_BY_TM_INDEX[index]))
    } else {
        None
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "bdspTmIndexByMoveId"))]
#[allow(clippy::missing_const_for_fn)]
pub fn tm_index_by_move_id(move_id: u16) -> Option<u16> {
    let move_id = move_id as usize;
    if move_id < TM_INDEX_BY_MOVE_ID.len() {
        Some(TM_INDEX_BY_MOVE_ID[move_id])
    } else {
        None
    }
}
