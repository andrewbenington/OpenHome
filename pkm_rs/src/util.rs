#[cfg(feature = "wasm")]
use crate::result::Error;

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

pub const fn unown_form_from_pid_gen3(pid: u32) -> u8 {
    let mut letter_value = (pid >> 24) & 0x3;

    letter_value = ((pid >> 16) & 0x3) | (letter_value << 2);
    letter_value = ((pid >> 8) & 0x3) | (letter_value << 2);
    letter_value = (pid & 0x3) | (letter_value << 2);

    (letter_value % 28) as u8
}

#[cfg(feature = "wasm")]
pub mod personality_value {
    // mirrors the strategy used by Poké Transporter to ensure non-shiny Pokémon do not become shiny in later generations
    pub const fn poke_transporter_shiny_adjust(pid: u32, trainer_id: u16, secret_id: u16) -> u32 {
        let xor_value = pkm_rs_types::shiny_xor_value(pid, trainer_id, secret_id);
        if xor_value >= 8 && xor_value < 16 {
            // if a mon would be shiny post-gen5 but not in gen3-5, flip the most significant bit
            flip_most_significant_bit(pid)
        } else {
            pid
        }
    }

    pub const fn flip_most_significant_bit(value: u32) -> u32 {
        value ^ (1 << (u32::BITS - 1))
    }
}

#[cfg(feature = "wasm")]
pub fn error_to_js(e: Error) -> wasm_bindgen::JsValue {
    wasm_bindgen::JsValue::from_str(&e.to_string())
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
