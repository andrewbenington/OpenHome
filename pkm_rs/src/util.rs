use num::{self};

pub fn int_from_buffer_bits_le<T>(
    bytes: &[u8],
    byte_offset: usize,
    bit_offset: u32,
    bit_count: u32,
) -> Result<T, Box<dyn std::error::Error>>
where
    T: num::PrimInt + std::convert::TryFrom<u64>,
    <T as TryFrom<u64>>::Error: std::error::Error,
    <T as TryFrom<u64>>::Error: 'static,
{
    let chunk_byte_count = (bit_offset + bit_count).div_ceil(8);
    if chunk_byte_count == 1 {
        let _c: u64 = (*bytes.get(byte_offset).ok_or("byte_offset out of bounds")?).into();
    }

    let chunk_value: u64 = match chunk_byte_count {
        1 => bytes[byte_offset..byte_offset + 1]
            .try_into()
            .map(u8::from_le_bytes)?
            .into(),
        2 => bytes[byte_offset..byte_offset + 2]
            .try_into()
            .map(u16::from_le_bytes)?
            .into(),
        3..4 => bytes[byte_offset..byte_offset + 4]
            .try_into()
            .map(u32::from_le_bytes)?
            .into(),
        _ => Err("bit_count must be <= 32")?,
    };

    let bit_mask = 2_u64.pow(bit_count - 1);
    let masked: u64 = (chunk_value >> bit_offset) & bit_mask;
    let masked: T = masked.try_into()?;
    Ok(masked)
}

// pub fn int_from_buffer_bits_be<T>(
//     bytes: &[u8],
//     byte_offset: usize,
//     bit_offset: u32,
//     bit_count: u32,
// ) -> Result<T, Box<dyn std::error::Error>>
// where
//     T: num::PrimInt + std::convert::TryFrom<u64>,
//     <T as TryFrom<u64>>::Error: std::error::Error,
//     <T as TryFrom<u64>>::Error: 'static,
// {
//     let chunk_byte_count = (bit_offset + bit_count).div_ceil(8);
//     if chunk_byte_count == 1 {
//         let _c: u64 = (*bytes.get(byte_offset).ok_or("byte_offset out of bounds")?).into();
//     }

//     let chunk_value: u64 = match chunk_byte_count {
//         1 => bytes[byte_offset..byte_offset + 1]
//             .try_into()
//             .map(u8::from_be_bytes)?
//             .into(),
//         2 => bytes[byte_offset..byte_offset + 2]
//             .try_into()
//             .map(u16::from_be_bytes)?
//             .into(),
//         3..4 => bytes[byte_offset..byte_offset + 4]
//             .try_into()
//             .map(u32::from_be_bytes)?
//             .into(),
//         _ => Err("bit_count must be <= 32")?,
//     };

//     let bit_mask = 2_u64.pow(bit_count - 1);
//     let masked: u64 = (chunk_value >> bit_offset) & bit_mask;
//     let masked: T = masked.try_into()?;
//     Ok(masked)
// }

// pub fn u8_from_buffer_bits<T>(
//     bytes: Vec<u8>,
//     byte_offset: usize,
//     bit_offset: usize,
//     bit_count: usize,
//     little_endian: bool,
// ) where
//     T: num::PrimInt,
// {
//     let byte_count = std::mem::size_of::<T>();
//     let value_bytes: Vec<T> = vec![T::zero(); byte_count];
//     for byte_idx in 0..byte_count {
//         for bit_idx in 0..(u8::BITS as usize) {

//         }
//     }
// }

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

pub trait BitSet {
    fn set_bit(&mut self, bit_index: u8, value: bool);
}

impl BitSet for u8 {
    fn set_bit(&mut self, bit_index: u8, value: bool) {
        if value {
            *self |= 1 << bit_index;
        } else {
            *self &= !(1 << bit_index);
        }
    }
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
