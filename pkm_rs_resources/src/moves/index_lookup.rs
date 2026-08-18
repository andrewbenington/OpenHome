use crate::moves::MoveIndex;

pub(crate) const fn max_value(values: &[u16]) -> u16 {
    let mut max = 0u16;
    let mut i = 0;
    while i < values.len() {
        if values[i] > max {
            max = values[i];
        }
        i += 1;
    }
    max
}

const NOT_FOUND: u16 = u16::MAX;

pub(crate) const fn move_id_by_index(
    move_id_lookup_by_index: &[u16],
    index: usize,
) -> Option<MoveIndex> {
    if index >= move_id_lookup_by_index.len() {
        return None;
    };

    match move_id_lookup_by_index[index] {
        NOT_FOUND => None,
        move_id => Some(MoveIndex::from_u16(move_id)),
    }
}

#[cfg(feature = "wasm")]
pub(crate) fn move_id_by_index_wasm(move_id_lookup_by_index: &[u16], index: usize) -> Option<u16> {
    move_id_by_index(move_id_lookup_by_index, index)
        .as_ref()
        .and_then(MoveIndex::to_raw)
}

pub(crate) const fn index_by_move_id(index_by_move_id: &[u16], move_id: u16) -> Option<u16> {
    let move_id = move_id as usize;
    if move_id < index_by_move_id.len() {
        Some(index_by_move_id[move_id])
    } else {
        None
    }
}

pub(crate) const fn build_reverse<const N: usize, const M: usize>(
    move_id_by_index: [u16; N],
) -> [u16; M] {
    let mut table = [NOT_FOUND; M];
    let mut i = 0;
    while i < move_id_by_index.len() {
        let v = move_id_by_index[i] as usize;
        if table[v] != NOT_FOUND {
            panic!("duplicate value in move_id_by_index");
        }
        table[v] = i as u16;
        i += 1;
    }
    table
}
