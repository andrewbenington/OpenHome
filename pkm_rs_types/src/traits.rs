use arbitrary_int::traits::{BuiltinInteger, UnsignedInteger};
use num::Zero;

pub trait ArbitraryIntWriter<T: UnsignedInteger + BuiltinInteger, const BITS: usize> {
    fn write_to_u8_at_offset(&self, bytes: &mut [u8], bit_offset: u8);
}

pub trait Empty {
    fn is_empty(&self) -> bool;
}

impl<T> Empty for T
where
    T: Zero,
{
    fn is_empty(&self) -> bool {
        self.is_zero()
    }
}
