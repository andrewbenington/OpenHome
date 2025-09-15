use serde::Serialize;

use crate::{
    pkm::Pkm,
    saves::{
        gen7_alola::{SunMoonSave, UltraSunMoonSave},
        lets_go::LetsGoSave,
    },
};

pub mod lets_go;

pub mod gen7_alola;

pub trait SaveDataTrait: Send + Sync {
    type PkmType: Pkm;

    // fn from_bytes(bytes: Vec<u8>) -> Result<Box<Self>, String>;
    fn get_mon_at(&self, box_num: usize, offset: usize) -> Result<Self::PkmType, String>;
    fn get_mon_bytes_at(&self, box_num: usize, offset: usize) -> Result<Vec<u8>, String>;

    fn box_rows() -> usize;
    fn box_cols() -> usize;
    fn box_slots() -> usize;
    fn calc_checksum(&self) -> u16;

    fn is_valid_save(bytes: &[u8]) -> bool;
}

#[derive(Serialize, Clone, Copy)]
pub enum SaveType {
    SunMoon,
    UltraSunMoon,
    LetsGoPikachuEevee,
}

impl SaveType {
    pub fn build(&self, bytes: &[u8]) -> Result<SaveData, String> {
        match self {
            Self::SunMoon => SunMoonSave::from_bytes(bytes.to_vec()).map(SaveData::SM),
            Self::UltraSunMoon => UltraSunMoonSave::from_bytes(bytes.to_vec()).map(SaveData::USUM),
            Self::LetsGoPikachuEevee => LetsGoSave::from_bytes(bytes.to_vec()).map(SaveData::LGPE),
        }
    }

    pub fn detect_from_bytes(bytes: &[u8]) -> Vec<Self> {
        let mut possible_saves = Vec::<Self>::new();
        if SunMoonSave::is_valid_save(bytes) {
            possible_saves.push(Self::SunMoon);
        }
        if LetsGoSave::is_valid_save(bytes) {
            possible_saves.push(Self::LetsGoPikachuEevee);
        }
        possible_saves.push(Self::UltraSunMoon);

        possible_saves
    }
}

#[derive(Serialize)]
pub enum SaveData {
    SM(SunMoonSave),
    USUM(UltraSunMoonSave),
    LGPE(LetsGoSave),
}

impl SaveData {
    pub const fn get_type(&self) -> SaveType {
        match self {
            SaveData::SM(_) => SaveType::SunMoon,
            SaveData::USUM(_) => SaveType::UltraSunMoon,
            SaveData::LGPE(_) => SaveType::LetsGoPikachuEevee,
        }
    }

    fn get_trainer_name(&self) -> String {
        match self {
            SaveData::SM(save) => save.trainer.trainer_name.to_string(),
            SaveData::USUM(save) => save.trainer.trainer_name.to_string(),
            SaveData::LGPE(save) => save.trainer.trainer_name.to_string(),
        }
    }

    // fn read_from_file(path: &Path) -> Result<Self, String> {
    //     let bytes = std::fs::read(path).map_err(|e| format!("Failed to read file: {}", e))?;

    //     if SunMoonSave::is_valid_save(&bytes) {
    //         SunMoonSave::from_bytes(bytes).map(SaveData::SM)
    //     } else if LetsGoSave::is_valid_save(&bytes) {
    //         LetsGoSave::from_bytes(bytes).map(SaveData::LGPE)
    //     } else {
    //         Err("Unrecognized or invalid save file format".to_string())
    //     }
    // }

    // pub fn build_from_bytes(bytes: Vec<u8>) -> Result<Self, String> {
    //     if SunMoonSave::is_valid_save(&bytes) {
    //         SunMoonSave::from_bytes(bytes).map(SaveData::SM)
    //     } else if LetsGoSave::is_valid_save(&bytes) {
    //         LetsGoSave::from_bytes(bytes).map(SaveData::LGPE)
    //     } else {
    //         Err("Unrecognized or invalid save file format".to_string())
    //     }
    // }
}
