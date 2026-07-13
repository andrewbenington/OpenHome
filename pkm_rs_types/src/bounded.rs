#[derive(Debug)]
pub struct BoundViolated;

impl std::error::Error for BoundViolated {}

impl std::fmt::Display for BoundViolated {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("value exceeds maximum valid")
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Bounded<T: Into<usize> + Copy + Sized, const MAX: usize>(T);

impl<T: Into<usize> + Copy, const MAX: usize> Bounded<T, MAX> {
    pub fn new_if_valid(value: T) -> Option<Self> {
        let value_usize = value.into();
        if value_usize > MAX {
            None
        } else {
            Some(Self(value))
        }
    }

    pub const fn get(&self) -> T {
        self.0
    }
}

pub trait CheckBound<T: Into<usize> + Copy, const MAX: usize>: Into<usize> + Copy {
    fn check(self) -> Option<Bounded<Self, MAX>> {
        Bounded::new_if_valid(self)
    }
}

impl<T: Into<usize> + Copy, const MAX: usize> std::ops::Mul<usize> for Bounded<T, MAX> {
    type Output = usize;

    fn mul(self, rhs: usize) -> Self::Output {
        self.0.into() * rhs
    }
}

impl<T: Into<usize> + Copy + std::fmt::Display, const MAX: usize> std::fmt::Display
    for Bounded<T, MAX>
{
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(f)
    }
}
