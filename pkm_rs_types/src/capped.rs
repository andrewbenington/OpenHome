#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Capped<T: Into<usize> + Copy + Sized, const MAX: usize>(T);

impl<T: Into<usize> + Copy, const MAX: usize> Capped<T, MAX> {
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

pub trait IntoCapped<T: Into<usize> + Copy, const MAX: usize>: Into<usize> + Copy {
    fn into_capped(self) -> Option<Capped<Self, MAX>> {
        Capped::new_if_valid(self)
    }
}
