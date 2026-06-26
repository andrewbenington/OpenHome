#[cfg(feature = "wasm")]
mod checksum;
#[cfg(feature = "wasm")]
mod encryption;
mod strings;
mod util;

pub mod convert_strategy;
pub mod format;
#[cfg(feature = "wasm")]
pub mod gen3;
#[cfg(feature = "wasm")]
pub mod gen7_alola;
// pub mod gen7_lgpe;
#[cfg(feature = "wasm")]
pub mod gen8_swsh;
pub mod location;
pub mod ohpkm;
pub mod result;
// pub mod rom_hacks;
pub mod sectioned_data;
#[cfg(test)]
pub mod tests;
pub mod traits;

#[cfg(feature = "wasm")]
pub use strings::Gen3Strings;

extern crate static_assertions;
