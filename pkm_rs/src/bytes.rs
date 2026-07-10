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

pub struct Writer<'a> {
    bytes: &'a mut [u8],
    current_offset: usize,
}

impl<'a> Writer<'a> {
    pub const fn new(bytes: &'a mut [u8], offset: usize) -> Self {
        Self {
            bytes,
            current_offset: offset,
        }
    }

    pub fn write_u8(&mut self, value: u8) {
        self.bytes[self.current_offset] = value;
        self.current_offset += 1;
    }

    pub fn write_u32(&mut self, value: u32) {
        self.bytes[self.current_offset..self.current_offset + 4]
            .copy_from_slice(&value.to_le_bytes());
        self.current_offset += 4;
    }

    pub const fn current_offset(&self) -> usize {
        self.current_offset
    }
}
