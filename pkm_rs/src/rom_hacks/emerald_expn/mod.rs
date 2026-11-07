mod conversion;
#[cfg(feature = "wasm")]
mod pk3expn;
#[cfg(feature = "wasm")]
mod pk3expn_buffer;

pub(crate) const BOX_SIZE: usize = 80;
pub(crate) const PARTY_SIZE: usize = 100;
