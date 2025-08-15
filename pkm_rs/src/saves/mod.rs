use std::path::Path;

use crate::{
    pkm::{Pkm, PkmResult},
    saves::{lets_go::LetsGoSave, sun_moon::SunMoonSave},
};

pub mod lets_go;

pub mod sun_moon;

pub trait SaveDataTrait: Sized + Send + Sync {
    type PkmType: Pkm;

    fn from_bytes(bytes: Vec<u8>) -> Result<Self, String>;
    fn get_mon_at(&self, box_num: usize, offset: usize) -> PkmResult<Self::PkmType>;
    fn get_mon_bytes_at(&self, box_num: usize, offset: usize) -> PkmResult<Vec<u8>>;

    fn box_rows() -> usize;
    fn box_cols() -> usize;
    fn box_slots() -> usize;
    fn calc_checksum(&self) -> u16;

    fn is_valid_save(bytes: &[u8]) -> bool;
}

pub enum SaveData {
    SM(SunMoonSave),
    LGPE(LetsGoSave),
}

impl SaveData {
    fn get_trainer_name(&self) -> String {
        match self {
            SaveData::SM(save) => save.trainer.trainer_name.to_string(),
            SaveData::LGPE(save) => save.trainer.trainer_name.to_string(),
        }
    }

    fn read_from_file(path: &Path) -> Result<Self, String> {
        let bytes = std::fs::read(path).map_err(|e| format!("Failed to read file: {}", e))?;

        if SunMoonSave::is_valid_save(&bytes) {
            SunMoonSave::from_bytes(bytes).map(SaveData::SM)
        } else if LetsGoSave::is_valid_save(&bytes) {
            LetsGoSave::from_bytes(bytes).map(SaveData::LGPE)
        } else {
            Err("Unrecognized or invalid save file format".to_string())
        }
    }
}
