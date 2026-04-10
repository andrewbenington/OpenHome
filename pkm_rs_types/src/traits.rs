use arbitrary_int::traits::{BuiltinInteger, UnsignedInteger};

pub trait ArbitraryIntWriter<T: UnsignedInteger + BuiltinInteger, const BITS: usize> {
    fn write_to_u8_at_offset(&self, bytes: &mut [u8], bit_offset: u8);
}
