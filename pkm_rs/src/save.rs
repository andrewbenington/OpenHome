use serde::Serialize;

use crate::result::Result;
use crate::traits::SaveData;
use crate::{
    gen7_alola::{SunMoonSave, UltraSunMoonSave},
    gen7_lgpe::LetsGoSave,
};

#[derive(Serialize, Clone, Copy)]
pub enum SaveType {
    SunMoon,
    UltraSunMoon,
    LetsGoPikachuEevee,
}

impl SaveType {
    pub fn build(&self, bytes: &[u8]) -> Result<AnySave> {
        match self {
            Self::SunMoon => SunMoonSave::from_bytes(bytes).map(AnySave::SM),
            Self::UltraSunMoon => UltraSunMoonSave::from_bytes(bytes).map(AnySave::USUM),
            Self::LetsGoPikachuEevee => LetsGoSave::from_bytes(bytes).map(AnySave::LGPE),
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
pub enum AnySave {
    SM(SunMoonSave),
    USUM(UltraSunMoonSave),
    LGPE(LetsGoSave),
}

impl AnySave {
    pub const fn get_type(&self) -> SaveType {
        match self {
            AnySave::SM(_) => SaveType::SunMoon,
            AnySave::USUM(_) => SaveType::UltraSunMoon,
            AnySave::LGPE(_) => SaveType::LetsGoPikachuEevee,
        }
    }

    pub fn get_trainer_name(&self) -> String {
        match self {
            AnySave::SM(save) => save.trainer.trainer_name.to_string(),
            AnySave::USUM(save) => save.trainer.trainer_name.to_string(),
            AnySave::LGPE(save) => save.trainer.trainer_name.to_string(),
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

pub enum TrainerIdType {
    FiveDigit,
    SixDigit,
}

pub fn six_digit_trainer_display(trainer_id: u16, secret_id: u16) -> String {
    let full_id: u32 = (secret_id as u32) << 16 | (trainer_id as u32);

    format!("{:0>6}", full_id)
}
