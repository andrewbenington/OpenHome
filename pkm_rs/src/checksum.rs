use std::num::Wrapping;

use crate::bytes::{AsBytes, AsBytesMut};

pub trait ChecksumAlgorithm {
    type Output: Sized + Copy;
    fn calc_over_bytes(bytes: &[u8]) -> Self::Output;
    fn write_to_bytes(bytes: &mut [u8], value: Self::Output);
}

pub trait Checksum: AsBytes {
    type A: ChecksumAlgorithm;
    const SPAN_START: usize;
    const SPAN_END: usize;

    fn calculate_checksum(&self) -> <<Self as Checksum>::A as ChecksumAlgorithm>::Output {
        Self::A::calc_over_bytes(&self.as_bytes()[Self::SPAN_START..Self::SPAN_END])
    }
}

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

pub struct ChecksumU16Le;

impl ChecksumAlgorithm for ChecksumU16Le {
    type Output = u16;

    fn calc_over_bytes(bytes: &[u8]) -> u16 {
        checksum_u16_le(bytes)
    }

    fn write_to_bytes(bytes: &mut [u8], value: u16) {
        bytes[0..2].copy_from_slice(&value.to_le_bytes());
    }
}

pub fn checksum_u16_le(bytes: &[u8]) -> u16 {
    let chunks = bytes.as_chunks::<2>().0.iter().copied();
    let wrapped_sum: Wrapping<u16> = chunks.map(u16::from_le_bytes).map(Wrapping).sum();

    wrapped_sum.0
}

pub fn checksum_u64_le(bytes: &[u8]) -> u64 {
    let (chunks, remainder) = bytes.as_chunks::<8>();

    let mut wrapped_sum: Wrapping<u64> = chunks
        .iter()
        .copied()
        .map(u64::from_le_bytes)
        .map(Wrapping)
        .sum();

    if !remainder.is_empty() {
        let mut buf = [0u8; 8];
        buf[..remainder.len()].copy_from_slice(remainder);
        wrapped_sum += Wrapping(u64::from_le_bytes(buf));
    }

    wrapped_sum.0
}
