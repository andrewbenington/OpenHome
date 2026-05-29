use std::fmt::Debug;
use std::marker::PhantomData;
use std::num::NonZeroU16;

use rand::distr::{Alphanumeric, SampleString};
use rand::{Rng, RngExt};

pub trait Randomize {
    fn randomized<R: Rng>(rng: &mut R) -> Self;
}

// impl<T> Randomize for T
// where
//     StandardUniform: Distribution<T>,
// {
//     fn randomized<R: Rng>(rng: &mut R) -> Self {
//         rng.random()
//     }
// }

impl Randomize for bool {
    fn randomized<R: Rng>(rng: &mut R) -> Self {
        rng.random()
    }
}

impl Randomize for u8 {
    fn randomized<R: Rng>(rng: &mut R) -> Self {
        rng.random()
    }
}

impl Randomize for u16 {
    fn randomized<R: Rng>(rng: &mut R) -> Self {
        rng.random()
    }
}

impl Randomize for u32 {
    fn randomized<R: Rng>(rng: &mut R) -> Self {
        rng.random()
    }
}

impl<T, const N: usize> Randomize for [T; N]
where
    T: Randomize + Debug,
{
    fn randomized<R: Rng>(rng: &mut R) -> Self {
        let vector: Vec<_> = (0..N).map(|_| T::randomized(rng)).collect();
        vector
            .try_into()
            .expect("randomized array has incorrect length")
    }
}

impl<T> Randomize for Vec<T>
where
    T: Randomize + Debug,
{
    fn randomized<R: Rng>(rng: &mut R) -> Self {
        (0..10).map(|_| T::randomized(rng)).collect()
    }
}

impl<T> Randomize for Option<T>
where
    T: Randomize,
{
    fn randomized<R: Rng>(rng: &mut R) -> Self {
        match rng.random_range(0..=1) {
            0 => None,
            _ => Some(Randomize::randomized(rng)),
        }
    }
}

impl<T> Randomize for PhantomData<T> {
    fn randomized<R: Rng>(_: &mut R) -> Self {
        std::marker::PhantomData
    }
}

impl Randomize for NonZeroU16 {
    fn randomized<R: Rng>(rng: &mut R) -> Self {
        let val: u16 = rng.random_range(1..=u16::MAX);
        NonZeroU16::new(val).expect("range starts with 1; should never be 0")
    }
}

impl Randomize for String {
    fn randomized<R: Rng>(rng: &mut R) -> Self {
        Alphanumeric.sample_string(rng, 64)
    }
}

pub use pkm_rs_derive::Randomize;
