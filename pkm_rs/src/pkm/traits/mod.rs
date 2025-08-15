pub mod stats;

pub use stats::*;

pub trait TrainerWithSecret {
    fn get_trainer_id(&self) -> u16;
    fn get_secret_id(&self) -> u16;
}

pub trait EncryptionConstant: TrainerWithSecret {
    fn get_encryption_constant(&self) -> u32;
}

pub trait IsShiny {
    fn is_shiny(&self) -> bool;
}

pub use pkm_rs_derive::IsShiny4096;
pub use pkm_rs_derive::IsShiny8192;
