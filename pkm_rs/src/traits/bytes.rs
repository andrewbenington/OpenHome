// find and replace
// MoveSlot::from_le_bytes\(bytes\[(\d+)\.\.\d+\]\.try_into\(\).unwrap\(\)\)
// read_move_slot!(bytes, $1)
#[macro_export]
macro_rules! read_move_index {
    ($bytes:expr, $start:expr) => {
        MoveIndex::from_le_bytes([$bytes[$start], $bytes[$start + 1]])
    };
}

pub trait AsBytes {
    fn as_bytes(&self) -> &[u8];
}

pub trait AsBytesMut {
    fn as_bytes_mut(&mut self) -> &mut [u8];
}
