#[macro_export]
macro_rules! read_u32_le {
    ($bytes:expr, $start:expr) => {
        u32::from_le_bytes([
            $bytes[$start],
            $bytes[$start + 1],
            $bytes[$start + 2],
            $bytes[$start + 3],
        ])
    };
}

// find and replace
// u16::from_le_bytes\(bytes\[(\d+)\.\.\d+\]\.try_into\(\).unwrap\(\)\)
// read_u16_le!(bytes, $1)
#[macro_export]
macro_rules! read_u16_le {
    ($bytes:expr, $start:expr) => {
        u16::from_le_bytes([$bytes[$start], $bytes[$start + 1]])
    };
}

// find and replace
// MoveSlot::from_le_bytes\(bytes\[(\d+)\.\.\d+\]\.try_into\(\).unwrap\(\)\)
// read_move_slot!(bytes, $1)
#[macro_export]
macro_rules! read_move_slot {
    ($bytes:expr, $start:expr) => {
        MoveSlot::from_le_bytes([$bytes[$start], $bytes[$start + 1]])
    };
}
