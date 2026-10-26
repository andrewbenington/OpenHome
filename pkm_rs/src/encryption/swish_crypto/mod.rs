mod block;
mod blockset;
mod hash;
mod swish_error;

const HASH_SIZE: usize = 0x20;

pub use block::*;
pub use blockset::*;
use core::mem::size_of;
pub use swish_error::*;
use zerocopy::{FromBytes, Unaligned};
