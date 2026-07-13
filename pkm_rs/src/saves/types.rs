#[derive(Debug)]
pub struct BoundViolated;

impl std::error::Error for BoundViolated {}

impl std::fmt::Display for BoundViolated {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("value exceeds maximum valid")
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
struct BoundedU8<const MAX: u8>(u8);

impl<const MAX: u8> BoundedU8<MAX> {
    pub const fn new(raw: u8) -> Result<Self, BoundViolated> {
        match raw {
            ..=MAX => Ok(Self(raw)),
            _ => Err(BoundViolated),
        }
    }

    #[cfg(test)]
    pub fn all() -> impl IntoIterator<Item = Self> {
        (0..MAX).map(Self)
    }
}

impl<const MAX: u8> std::ops::Mul<BoundedU8<MAX>> for u8 {
    type Output = u8;

    fn mul(self, rhs: BoundedU8<MAX>) -> Self::Output {
        rhs.0 * self
    }
}

impl<const MAX: u8> TryFrom<u8> for BoundedU8<MAX> {
    type Error = BoundViolated;

    fn try_from(value: u8) -> std::result::Result<Self, Self::Error> {
        Self::new(value)
    }
}

impl Display for BoxIndex {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(f)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
struct BoxSlot(u8);

impl BoxSlot {
    pub const fn new(raw: u8) -> Result<Self> {
        match raw {
            ..=BOX_SLOTS => Ok(Self(raw)),
            _ => Err(Error::BoxIndex(raw)),
        }
    }

    #[cfg(test)]
    pub fn all() -> impl IntoIterator<Item = Self> {
        (0..BOX_SLOTS).map(Self)
    }
}

impl std::ops::Mul<BoxSlot> for usize {
    type Output = usize;

    fn mul(self, rhs: BoxSlot) -> Self::Output {
        rhs.0 as usize * self
    }
}

impl TryFrom<u8> for BoxSlot {
    type Error = Error;

    fn try_from(value: u8) -> std::result::Result<Self, Self::Error> {
        Self::new(value)
    }
}

impl Display for BoxSlot {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(f)
    }
}
