use crate::BitSet;

pub fn get_flag(bytes: &[u8], byte_offset: usize, bit_index: usize) -> bool {
    let byte_index = byte_offset + (bit_index / 8);
    if byte_index >= bytes.len() {
        panic!(
            "attempting to read flag out of range (byte {} of {})",
            byte_index,
            bytes.len()
        );
    }
    let bit_index: u8 = (bit_index % 8).try_into().unwrap();
    bit_is_set(bytes[byte_index], bit_index)
}

pub fn set_flag(bytes: &mut [u8], byte_offset: usize, bit_index: usize, value: bool) {
    let byte_index = byte_offset + (bit_index / 8);
    if byte_index >= bytes.len() {
        panic!(
            "attempting to read flag out of range (byte {} of {})",
            byte_index,
            bytes.len()
        );
    }
    let bit_index: u8 = (bit_index % 8).try_into().unwrap();
    bytes[byte_index].set_bit(bit_index, value);
}

pub const fn bit_is_set(byte: u8, bit_index: u8) -> bool {
    ((byte >> bit_index) & 1) == 1
}

pub fn write_uint3_to_bits(value: u8, byte: &mut u8, bit_offset: u8) {
    if bit_offset > 3 {
        panic!("bit_offset but be <= 5 for a 3 bit integer")
    }
    let bit_mask: u8 = 0b111 << bit_offset;
    let bit_mask_inverted = !bit_mask;

    *byte &= bit_mask_inverted;
    *byte |= (value << bit_offset) & bit_mask;
}

pub fn read_uint3_from_bits(byte: u8, bit_offset: u8) -> u8 {
    if bit_offset > 3 {
        panic!("bit_offset but be <= 5 for a 3 bit integer")
    }
    let bit_mask: u8 = 0b111 << bit_offset;
    (byte & bit_mask) >> bit_offset
}

pub fn write_uint5_to_bits(value: u8, byte: &mut u8, bit_offset: u8) {
    if bit_offset > 3 {
        panic!("bit_offset but be <= 3 for a 5 bit integer")
    }
    let bit_mask: u8 = 0b11111 << bit_offset;
    let bit_mask_inverted = !bit_mask;

    *byte &= bit_mask_inverted;
    *byte |= (value << bit_offset) & bit_mask;
}

pub fn read_uint5_from_bits(byte: u8, bit_offset: u8) -> u8 {
    if bit_offset > 3 {
        panic!("bit_offset but be <= 3 for a 5 bit integer")
    }
    let bit_mask: u8 = 0b11111 << bit_offset;
    (byte & bit_mask) >> bit_offset
}

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

mod test {

    #[test]
    fn uint3_write() {
        let mut byte = 0b00000000;
        crate::util::write_uint3_to_bits(1, &mut byte, 3);
        assert_eq!(byte, 0b00001000);
    }

    #[test]
    fn uint3_write_overrides_existing() {
        let mut byte = 0b11111111;
        crate::util::write_uint3_to_bits(0, &mut byte, 1);
        assert_eq!(byte, 0b11110001);
    }

    #[test]
    fn uint5_write() {
        let mut byte = 0b00000000;
        crate::util::write_uint5_to_bits(1, &mut byte, 3);
        assert_eq!(byte, 0b00001000);
    }

    #[test]
    fn uint5_write_overrides_existing() {
        let mut byte = 0b11111111;
        crate::util::write_uint5_to_bits(0, &mut byte, 1);
        assert_eq!(byte, 0b11000001);
    }
}
