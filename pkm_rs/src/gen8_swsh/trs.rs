#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const MOVE_ID_BY_TR_INDEX: [u16; 100] = [
    14, 34, 53, 56, 57, 58, 59, 67, 85, 87, 89, 94, 97, 116, 118, 126, 127, 133, 141, 161, 164,
    179, 188, 191, 200, 473, 203, 214, 224, 226, 227, 231, 242, 247, 248, 253, 257, 269, 271, 276,
    285, 299, 304, 315, 322, 330, 334, 337, 339, 347, 348, 349, 360, 370, 390, 394, 396, 398, 399,
    402, 404, 405, 406, 408, 411, 412, 413, 414, 417, 428, 430, 437, 438, 441, 442, 444, 446, 447,
    482, 484, 486, 492, 500, 502, 503, 526, 528, 529, 535, 542, 583, 599, 605, 663, 667, 675, 676,
    706, 710, 776,
];

const fn max_value() -> u16 {
    let mut max = 0u16;
    let mut i = 0;
    while i < MOVE_ID_BY_TR_INDEX.len() {
        if MOVE_ID_BY_TR_INDEX[i] > max {
            max = MOVE_ID_BY_TR_INDEX[i];
        }
        i += 1;
    }
    max
}

const MAX_VAL: usize = max_value() as usize;
const NOT_FOUND: u16 = u16::MAX;

const TR_INDEX_BY_MOVE_ID: [u16; MAX_VAL + 1] = build_reverse();

const fn build_reverse() -> [u16; MAX_VAL + 1] {
    let mut table = [NOT_FOUND; MAX_VAL + 1];
    let mut i = 0;
    while i < MOVE_ID_BY_TR_INDEX.len() {
        let v = MOVE_ID_BY_TR_INDEX[i] as usize;
        if table[v] != NOT_FOUND {
            panic!("duplicate value in MOVE_ID_BY_TR_INDEX array");
        }
        table[v] = i as u16;
        i += 1;
    }
    table
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "moveIdBySwshTrIndex")]
#[allow(clippy::missing_const_for_fn)]
pub fn move_id_by_swsh_tr_index(index: usize) -> Option<u16> {
    if index < MOVE_ID_BY_TR_INDEX.len() {
        Some(MOVE_ID_BY_TR_INDEX[index])
    } else {
        None
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_name = "swshTrIndexByMoveId")]
#[allow(clippy::missing_const_for_fn)]
pub fn swsh_tr_index_by_move_id(move_id: u16) -> Option<u16> {
    let move_id = move_id as usize;
    if move_id < TR_INDEX_BY_MOVE_ID.len() {
        Some(TR_INDEX_BY_MOVE_ID[move_id])
    } else {
        None
    }
}
