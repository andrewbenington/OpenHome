use crate::moves::MoveIndex;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

const MOVE_ID_BY_PLUS_MOVE_INDEX_BLOCK_C: [u16; 247] = [
    7, 8, 9, 14, 16, 17, 18, 19, 22, 29, 33, 34, 36, 38, 39, 40, 42, 43, 44, 45, 46, 48, 52, 53,
    54, 55, 56, 57, 58, 59, 60, 61, 63, 64, 71, 73, 74, 75, 76, 77, 78, 79, 81, 83, 84, 85, 86, 87,
    88, 89, 91, 92, 93, 94, 95, 98, 100, 103, 104, 105, 106, 108, 109, 113, 114, 115, 116, 118,
    120, 122, 126, 127, 129, 133, 137, 141, 150, 151, 153, 157, 162, 163, 164, 172, 174, 182, 183,
    188, 191, 192, 195, 196, 197, 200, 202, 203, 204, 205, 209, 211, 219, 223, 224, 225, 231, 232,
    234, 235, 236, 239, 242, 245, 247, 248, 249, 250, 257, 261, 268, 269, 273, 280, 282, 297, 304,
    313, 315, 317, 319, 328, 331, 332, 334, 337, 339, 340, 341, 344, 345, 347, 348, 350, 352, 369,
    370, 377, 390, 392, 394, 396, 398, 399, 400, 403, 404, 405, 406, 407, 408, 411, 412, 413, 414,
    416, 417, 418, 420, 421, 422, 423, 424, 425, 427, 428, 430, 434, 435, 436, 437, 438, 441, 442,
    444, 446, 452, 453, 457, 473, 482, 484, 521, 523, 526, 527, 528, 529, 532, 535, 538, 540, 542,
    555, 556, 560, 564, 566, 567, 570, 571, 573, 574, 575, 576, 577, 583, 584, 585, 586, 588, 591,
    592, 593, 594, 595, 596, 598, 601, 605, 609, 611, 612, 613, 614, 615, 616, 617, 621, 670, 679,
    687, 693, 710, 748, 784, 812, 920, 97,
];

const MAX_VAL_BLOCK_C: usize =
    super::index_lookup::max_value(&MOVE_ID_BY_PLUS_MOVE_INDEX_BLOCK_C) as usize;

const PLUS_MOVE_INDEX_BY_MOVE_ID_BLOCK_C: [u16; MAX_VAL_BLOCK_C + 1] =
    super::index_lookup::build_reverse(MOVE_ID_BY_PLUS_MOVE_INDEX_BLOCK_C);

pub const fn move_id_by_lza_plus_move_index_block_c(index: usize) -> Option<MoveIndex> {
    super::index_lookup::move_id_by_index(&MOVE_ID_BY_PLUS_MOVE_INDEX_BLOCK_C, index)
}

#[cfg_attr(
    feature = "wasm",
    wasm_bindgen(js_name = "moveIdByLzaPlusMoveIndexBlockC")
)]
#[allow(clippy::missing_const_for_fn)]
pub fn move_id_by_plus_move_index_block_c_wasm(index: usize) -> Option<u16> {
    super::index_lookup::move_id_by_index_wasm(&MOVE_ID_BY_PLUS_MOVE_INDEX_BLOCK_C, index)
}

#[cfg_attr(
    feature = "wasm",
    wasm_bindgen(js_name = "lzaPlusMoveIndexByMoveIdBlockC")
)]
#[allow(clippy::missing_const_for_fn)]
pub fn plus_move_index_by_move_id_block_c(move_id: u16) -> Option<usize> {
    super::index_lookup::index_by_move_id(&PLUS_MOVE_INDEX_BY_MOVE_ID_BLOCK_C, move_id)
        .map(|idx| idx as usize)
}

const MOVE_ID_BY_PLUS_MOVE_INDEX_BLOCK_B: [u16; 93] = [
    4, 6, 13, 47, 80, 90, 102, 130, 138, 143, 147, 155, 160, 161, 176, 206, 207, 246, 252, 259,
    263, 295, 296, 299, 305, 307, 308, 318, 325, 329, 330, 333, 338, 402, 409, 410, 443, 451, 458,
    463, 464, 466, 480, 488, 490, 491, 503, 509, 524, 530, 533, 546, 547, 548, 618, 619, 620, 659,
    660, 665, 669, 705, 706, 708, 712, 721, 742, 753, 783, 786, 794, 796, 799, 800, 813, 814, 815,
    830, 839, 854, 856, 858, 862, 864, 866, 874, 880, 885, 886, 889, 890, 891, 893,
];

const MAX_VAL_BLOCK_B: usize =
    super::index_lookup::max_value(&MOVE_ID_BY_PLUS_MOVE_INDEX_BLOCK_B) as usize;

const PLUS_MOVE_INDEX_BY_MOVE_ID_BLOCK_B: [u16; MAX_VAL_BLOCK_B + 1] =
    super::index_lookup::build_reverse(MOVE_ID_BY_PLUS_MOVE_INDEX_BLOCK_B);

pub const fn move_id_by_plus_move_index_block_b(index: usize) -> Option<MoveIndex> {
    super::index_lookup::move_id_by_index(&MOVE_ID_BY_PLUS_MOVE_INDEX_BLOCK_B, index)
}

#[cfg_attr(
    feature = "wasm",
    wasm_bindgen(js_name = "moveIdByLzaPlusMoveIndexBlockB")
)]
#[allow(clippy::missing_const_for_fn)]
pub fn move_id_by_plus_move_index_block_b_wasm(index: usize) -> Option<u16> {
    super::index_lookup::move_id_by_index_wasm(&MOVE_ID_BY_PLUS_MOVE_INDEX_BLOCK_B, index)
}

#[cfg_attr(
    feature = "wasm",
    wasm_bindgen(js_name = "lzaPlusMoveIndexByMoveIdBlockB")
)]
#[allow(clippy::missing_const_for_fn)]
pub fn plus_move_index_by_move_id_block_b(move_id: u16) -> Option<usize> {
    super::index_lookup::index_by_move_id(&PLUS_MOVE_INDEX_BY_MOVE_ID_BLOCK_B, move_id)
        .map(|idx| idx as usize)
}
