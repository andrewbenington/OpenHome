mod checksum;
mod encryption;
mod rom_hacks;
mod strings;
mod util;

pub mod bytes;
pub mod convert_strategy;
pub mod format;
#[cfg(feature = "wasm")]
pub mod gen3;
#[cfg(feature = "wasm")]
pub mod gen7_alola;
// pub mod gen7_lgpe;
#[cfg(feature = "wasm")]
pub mod gen8_swsh;
pub mod gen9_sv;
pub mod location;
pub mod ohpkm;
pub mod result;
pub mod sectioned_data;
#[cfg(test)]
pub mod tests;
pub mod traits;

pub use rom_hacks::PluginIdentifier;

#[cfg(feature = "wasm")]
pub use strings::Gen3Strings;

extern crate static_assertions;
