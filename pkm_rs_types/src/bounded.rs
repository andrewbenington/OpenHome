use std::fmt::Display;
use std::ops::Mul;

use pastey::paste;

#[derive(Debug)]
pub struct BoundViolated;

impl std::error::Error for BoundViolated {}

impl Display for BoundViolated {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("value exceeds maximum valid")
    }
}
macro_rules! bounded_impl {
    ($ty:ty) => {
        paste! {
        #[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
        pub struct [<Bounded$ty:camel>]<const MAX: $ty>($ty);

        impl<const MAX: $ty> [<Bounded$ty:camel>]<MAX> {
            pub const fn check_bound(value: $ty) -> Result<Self, BoundViolated> {
                if value > MAX { Err(BoundViolated) } else { Ok(Self(value)) }
            }

            pub const fn get(&self) -> $ty {
                self.0
            }

            pub fn all() -> impl Iterator<Item = Self> {
                (0..=MAX).map(Self)
            }
        }

        impl<const MAX: $ty> Mul<usize> for [<Bounded$ty:camel>]<MAX> {
            type Output = usize;

            fn mul(self, rhs: usize) -> Self::Output {
                self.0 as usize * rhs
            }
        }

        impl<const MAX: $ty> Display for [<Bounded$ty:camel>]<MAX> {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                self.0.fmt(f)
            }
        }

        impl<const MAX: $ty> From<[<Bounded$ty:camel>]<MAX>> for $ty {
            fn from(value: [<Bounded$ty:camel>]<MAX>) -> Self {
                value.0
            }
        }

        impl<const MAX: $ty> TryFrom<$ty> for [<Bounded$ty:camel>]<MAX> {
            type Error = BoundViolated;

            fn try_from(value: $ty) -> Result<Self, Self::Error> {
                Self::check_bound(value)
            }
        }

        pub trait [<CheckBound $ty:camel>]<const MAX: $ty>: Copy
            where
                $ty: From<Self>,
            {
                fn check_bound(value: $ty) -> std::result::Result<[<Bounded $ty:camel>]<MAX>, BoundViolated> {
                    [<Bounded $ty:camel>]::check_bound(value)
                }
            }
        }
    };
}

bounded_impl!(u8);
bounded_impl!(u16);
bounded_impl!(u32);
bounded_impl!(usize);
