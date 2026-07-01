use std::num::Wrapping;

#[cfg(feature = "wasm")]
use crate::traits::{AsBytes, AsBytesMut};

#[cfg(feature = "wasm")]
pub trait ChecksumAlgorithm {
    type Output: Sized + Copy;
    fn calc_over_bytes(bytes: &[u8]) -> Self::Output;
    fn write_to_bytes(bytes: &mut [u8], value: Self::Output);
}

#[cfg(feature = "wasm")]
pub trait Checksum: AsBytes {
    type A: ChecksumAlgorithm;
    const SPAN_START: usize;
    const SPAN_END: usize;

    fn calculate_checksum(&self) -> <<Self as Checksum>::A as ChecksumAlgorithm>::Output {
        Self::A::calc_over_bytes(&self.as_bytes()[Self::SPAN_START..Self::SPAN_END])
    }
}

#[cfg(feature = "wasm")]
pub trait RefreshChecksum: Checksum + AsBytesMut {
    const STORED_OFFSET: usize;

    fn refresh_checksum(&mut self) {
        let checksum = self.calculate_checksum();
        <Self as Checksum>::A::write_to_bytes(
            &mut self.as_bytes_mut()[Self::STORED_OFFSET..],
            checksum,
        );
    }
}

#[cfg(feature = "wasm")]
pub struct ChecksumU16Le;

#[cfg(feature = "wasm")]
impl ChecksumAlgorithm for ChecksumU16Le {
    type Output = u16;

    fn calc_over_bytes(bytes: &[u8]) -> u16 {
        checksum_u16_le(bytes)
    }

    fn write_to_bytes(bytes: &mut [u8], value: u16) {
        bytes[0..2].copy_from_slice(&value.to_le_bytes());
    }
}

#[cfg(feature = "wasm")]
pub fn checksum_u16_le(bytes: &[u8]) -> u16 {
    let wrapped_sum: Wrapping<u16> = bytes
        .chunks_exact(2)
        .map(|chunk| u16::from_le_bytes([chunk[0], chunk[1]]))
        .map(Wrapping)
        .sum();

    wrapped_sum.0
}

pub fn checksum_u64_le(bytes: &[u8]) -> u64 {
    let chunks = bytes.chunks_exact(8);
    let remainder = chunks.remainder();

    let mut wrapped_sum: Wrapping<u64> = chunks
        .map(|chunk| u64::from_le_bytes(chunk.try_into().unwrap()))
        .map(Wrapping)
        .sum();

    if !remainder.is_empty() {
        let mut buf = [0u8; 8];
        buf[..remainder.len()].copy_from_slice(remainder);
        wrapped_sum += Wrapping(u64::from_le_bytes(buf));
    }

    wrapped_sum.0
}
