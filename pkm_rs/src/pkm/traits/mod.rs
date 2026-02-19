mod checksum;
mod identifiers;
mod ohpkm_byte;
mod pkm_base;
mod stats;

pub mod bytes;

pub use checksum::Checksum;
pub use identifiers::*;
pub use ohpkm_byte::*;
pub use pkm_base::*;
pub use stats::*;

pub trait TrainerWithSecret {
    fn get_trainer_id(&self) -> u16;
    fn get_secret_id(&self) -> u16;
}

pub trait IsShiny {
    fn is_shiny(&self) -> bool;
    fn is_square_shiny(&self) -> bool;
}

pub use pkm_rs_derive::IsShiny4096;
pub use pkm_rs_derive::IsShiny8192;
