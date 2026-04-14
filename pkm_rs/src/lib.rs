mod conversion;
mod strings;
mod util;

#[cfg(feature = "wasm")]
mod checksum;

#[cfg(feature = "wasm")]
mod encryption;

pub mod convert_strategy;
pub mod format;

#[cfg(feature = "wasm")]
pub mod gen3;
#[cfg(feature = "wasm")]
pub mod gen7_alola;
// pub mod gen7_lgpe;
pub mod location;
pub mod ohpkm;
pub mod result;
// pub mod rom_hacks;
pub mod traits;

#[cfg(test)]
pub mod tests;

extern crate static_assertions;
