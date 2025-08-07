mod ohpkm;
mod pb7;
mod pk7;
mod pk8;

use serde::Serialize;

pub use ohpkm::Ohpkm;
pub use pb7::Pb7;
pub use pk7::Pk7;
pub use pk8::Pk8;

pub trait Pkm: Sized + Serialize {
    const BOX_SIZE: usize;
    const PARTY_SIZE: usize;

    fn box_size() -> usize;
    fn party_size() -> usize;

    fn from_bytes(bytes: &[u8]) -> Result<Self, String>;
    fn write_bytes(&self, bytes: &mut [u8]);
    fn to_box_bytes(&self) -> Vec<u8>;
    fn to_party_bytes(&self) -> Vec<u8>;
}
