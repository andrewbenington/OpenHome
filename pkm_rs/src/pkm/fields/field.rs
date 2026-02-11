use crate::pkm::fields::byte_serializable::{ByteSerializable, ByteSerializableAlways};

pub trait ValidatedField {
    type Err;
    type Repr: ByteSerializable<Self::Err>;

    fn try_from_bytes(bytes: &[u8], offset: usize) -> Result<Self::Repr, Self::Err> {
        Self::Repr::try_from_bytes_at(bytes, offset)
    }

    fn name() -> &'static str;
}

pub trait InfallibleField {
    type Repr: ByteSerializableAlways;

    fn from_bytes(bytes: &[u8], offset: usize) -> Self::Repr {
        Self::Repr::from_bytes_at(bytes, offset)
    }

    fn name() -> &'static str;
}

pub trait ByteReaderWriter {
    fn get_bytes(&self) -> &[u8];
    fn get_bytes_mut(&mut self) -> &mut [u8];
}

pub trait Has<F: ValidatedField>: ByteReaderWriter {
    const OFFSET: usize;

    fn read(&self) -> Result<F::Repr, F::Err> {
        F::try_from_bytes(self.get_bytes(), Self::OFFSET)
    }
}

pub trait HasInfallible<F: InfallibleField>: ByteReaderWriter {
    const OFFSET: usize;

    fn read(&self) -> F::Repr {
        F::from_bytes(self.get_bytes(), Self::OFFSET)
    }
}

#[macro_export]
macro_rules! validated_field_offsets {
    ($buffer_type:ident, { $($field:ty => $offset:expr),+ $(,)? }) => {
        $(
            impl<'a> Has<$field> for $buffer_type<'a> {
                const OFFSET: usize = $offset;
            }
        )+
    };
}

#[macro_export]
macro_rules! infallible_field_offsets {
    ($buffer_type:ident, { $($field:ty => $offset:expr),+ $(,)? }) => {
        $(
            impl<'a> HasInfallible<$field> for $buffer_type<'a> {
                const OFFSET: usize = $offset;
            }
        )+
    };
}
