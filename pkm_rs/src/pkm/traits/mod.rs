mod checksum;
mod identifiers;
mod pkm_base;
mod stats;

pub use checksum::Checksum;
pub use identifiers::*;
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
