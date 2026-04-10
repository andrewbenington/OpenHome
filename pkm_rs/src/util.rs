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

pub fn set_flag(bytes: &mut [u8], byte_offset: usize, bit_index: usize, value: impl Into<bool>) {
    let byte_index = byte_offset + (bit_index / 8);
    if byte_index >= bytes.len() {
        panic!(
            "attempting to read flag out of range (byte {} of {})",
            byte_index,
            bytes.len()
        );
    }
    let bit_index: u8 = (bit_index % 8).try_into().unwrap();
    bytes[byte_index].set_bit(bit_index, value.into());
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

#[cfg(feature = "wasm")]
pub fn six_digit_trainer_display(trainer_id: u16, secret_id: u16) -> String {
    let full_id: u32 = (secret_id as u32) << 16 | (trainer_id as u32);

    format!("{:0>6}", full_id % 1_000_000)
}

mod test {
    #[cfg(feature = "wasm")]
    #[test]
    fn six_digit_trainer_display_formats_correctly() {
        let trainer_id = 0x7114;
        let secret_id = 0xb815;
        assert_eq!(
            crate::util::six_digit_trainer_display(trainer_id, secret_id),
            "412948"
        );
    }
}
