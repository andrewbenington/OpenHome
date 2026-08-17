#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const MOVE_ID_BY_TUTOR_INDEX: [u16; 61] = [
    206, 424, 422, 423, 301, 249, 191, 523, 332, 446, 129, 161, 345, 466, 829, 116, 339, 347, 156,
    608, 7, 9, 8, 409, 398, 427, 428, 141, 404, 157, 421, 442, 231, 595, 352, 451, 412, 196, 188,
    414, 247, 555, 430, 605, 416, 401, 528, 667, 224, 444, 200, 583, 63, 53, 85, 58, 94, 399, 434,
    796, 344,
];

const fn max_value() -> u16 {
    let mut max = 0u16;
    let mut i = 0;
    while i < MOVE_ID_BY_TUTOR_INDEX.len() {
        if MOVE_ID_BY_TUTOR_INDEX[i] > max {
            max = MOVE_ID_BY_TUTOR_INDEX[i];
        }
        i += 1;
    }
    max
}

const MAX_VAL: usize = max_value() as usize;
const NOT_FOUND: u16 = u16::MAX;

const TUTOR_INDEX_BY_MOVE_ID: [u16; MAX_VAL + 1] = build_reverse();

const fn build_reverse() -> [u16; MAX_VAL + 1] {
    let mut table = [NOT_FOUND; MAX_VAL + 1];
    let mut i = 0;
    while i < MOVE_ID_BY_TUTOR_INDEX.len() {
        let v = MOVE_ID_BY_TUTOR_INDEX[i] as usize;
        if table[v] != NOT_FOUND {
            panic!("duplicate value in TUTOR_INDEX_BY_MOVE_ID");
        }
        table[v] = i as u16;
        i += 1;
    }
    table
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "moveIdByLaTutorIndex"))]
#[allow(clippy::missing_const_for_fn)]
pub fn move_id_by_tutor_index(index: usize) -> Option<u16> {
    if index < MOVE_ID_BY_TUTOR_INDEX.len() {
        Some(MOVE_ID_BY_TUTOR_INDEX[index])
    } else {
        None
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "laTutorIndexByMoveId"))]
#[allow(clippy::missing_const_for_fn)]
pub fn tutor_index_by_move_id(move_id: u16) -> Option<u16> {
    let move_id = move_id as usize;
    if move_id < TUTOR_INDEX_BY_MOVE_ID.len() {
        Some(TUTOR_INDEX_BY_MOVE_ID[move_id])
    } else {
        None
    }
}
