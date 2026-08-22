use crate::moves::MoveIndex;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const MOVE_ID_BY_TUTOR_INDEX: [u16; 61] = [
    206, 424, 422, 423, 301, 249, 191, 523, 332, 446, 129, 161, 345, 466, 829, 116, 339, 347, 156,
    608, 7, 9, 8, 409, 398, 427, 428, 141, 404, 157, 421, 442, 231, 595, 352, 451, 412, 196, 188,
    414, 247, 555, 430, 605, 416, 401, 528, 667, 224, 444, 200, 583, 63, 53, 85, 58, 94, 399, 434,
    796, 344,
];

const MAX_VAL: usize = super::index_lookup::max_value(&MOVE_ID_BY_TUTOR_INDEX) as usize;

const TUTOR_INDEX_BY_MOVE_ID: [u16; MAX_VAL + 1] =
    super::index_lookup::build_reverse(MOVE_ID_BY_TUTOR_INDEX);

pub const fn move_id_by_tutor_index(index: usize) -> Option<MoveIndex> {
    super::index_lookup::move_id_by_index(&MOVE_ID_BY_TUTOR_INDEX, index)
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "moveIdByLaTutorIndex"))]
#[allow(clippy::missing_const_for_fn)]
pub fn move_id_by_tutor_index_wasm(index: usize) -> Option<u16> {
    super::index_lookup::move_id_by_index_wasm(&MOVE_ID_BY_TUTOR_INDEX, index)
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "laTutorIndexByMoveId"))]
#[allow(clippy::missing_const_for_fn)]
pub fn tutor_index_by_move_id(move_id: u16) -> Option<u16> {
    super::index_lookup::index_by_move_id(&TUTOR_INDEX_BY_MOVE_ID, move_id)
}
