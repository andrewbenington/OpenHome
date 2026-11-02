use zerocopy::{FromBytes, Unaligned};

use crate::result::StdResult;

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
pub fn six_digit_trainer_id_from_parts(trainer_id: u16, secret_id: u16) -> String {
    let full_id: u32 = (secret_id as u32) << 16 | (trainer_id as u32);
    six_digit_trainer_id_from_full(full_id)
}

#[cfg(feature = "wasm")]
pub fn six_digit_trainer_id_from_full(tid_sid: u32) -> String {
    format!("{:0>6}", tid_sid % 1_000_000)
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

mod tests {
    #[cfg(feature = "wasm")]
    #[test]
    fn six_digit_trainer_display_formats_correctly() {
        let trainer_id = 0x7114;
        let secret_id = 0xb815;
        assert_eq!(
            crate::util::six_digit_trainer_id_from_parts(trainer_id, secret_id),
            "412948"
        );
    }
}

/// Reinterprets an owned byte buffer as a `Box<T>` without copying.
/// Returns the original Vec if the length doesn't match exactly.
pub fn vec_into_box<T>(v: Vec<u8>) -> StdResult<Box<T>, Vec<u8>>
where
    T: FromBytes + Unaligned,
{
    if v.len() != size_of::<T>() {
        return Err(v);
    }

    // Shrinks capacity to len. This is a no-op (no realloc) if cap == len already.
    let boxed: Box<[u8]> = v.into_boxed_slice();
    let ptr: *mut T = Box::into_raw(boxed).cast::<T>();

    // SAFETY:
    // - The allocation has layout (size = len = size_of::<T>(), align = 1),
    //   which is exactly Layout::new::<T>() because T: Unaligned.
    // - T: FromBytes means every initialized byte pattern is a valid T.
    // - Ownership is transferred; the Box<[u8]> was consumed by into_raw.
    Ok(unsafe { Box::from_raw(ptr) })
}
