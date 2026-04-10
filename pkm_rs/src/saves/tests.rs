use super::SaveDataTrait;
use crate::result::{Error, Result};
use std::fs::File;

#[cfg(test)]
fn save_from_file<SAVE: SaveDataTrait>(filename: &str) -> Result<(SAVE, Vec<u8>)> {
    use std::io::Read;

    let mut file = File::open(filename).map_err(|e| Error::other(&e.to_string()))?;

    let mut contents = Vec::new();
    file.read_to_end(&mut contents)
        .map_err(|e| e.to_string())
        .unwrap();

    let save_file = SAVE::from_bytes(&contents)?;

    // match toml::to_string(&pkm) {
    //     Ok(text) => println!("{text}"),
    //     Err(e) => println!("{e}"),
    // }
    Ok((save_file, contents))
}

#[cfg(test)]
pub mod gen7_sun_moon {
    use std::path::PathBuf;

    use super::save_from_file;
    use crate::{gen7_alola::SunMoonSave, result::Result};
    use pkm_rs_types::OriginGame;

    #[test]
    fn read_save() -> Result<()> {
        let save_file = save_from_file::<SunMoonSave>(
            &PathBuf::from("save_files")
                .join("gen7_alola")
                .join("moon")
                .to_string_lossy(),
        )
        .unwrap()
        .0;

        assert_eq!(save_file.trainer.game_code, OriginGame::Moon as u8);

        Ok(())
    }

    #[test]
    fn calculate_checksum() -> Result<()> {
        let save_file = save_from_file::<SunMoonSave>(
            &PathBuf::from("save_files")
                .join("gen7_alola")
                .join("moon")
                .to_string_lossy(),
        )
        .unwrap()
        .0;

        assert_eq!(save_file.calc_checksum(), 0xb28d);

        Ok(())
    }
}

#[cfg(test)]
pub mod gen7_ultra_sun_moon {
    use crate::encryption::Crc16CcittInvertChecksum;
    use std::path::PathBuf;

    use super::save_from_file;
    use crate::{gen7_alola::UltraSunMoonSave, result::Result};
    use pkm_rs_types::OriginGame;

    #[test]
    fn read_save() -> Result<()> {
        let save_file = save_from_file::<UltraSunMoonSave>(
            &PathBuf::from("save_files")
                .join("gen7_alola")
                .join("ultrasun")
                .to_string_lossy(),
        )
        .unwrap()
        .0;

        assert_eq!(save_file.trainer.game_code, OriginGame::UltraSun as u8);

        Ok(())
    }

    #[test]
    fn calculate_checksum() -> Result<()> {
        let save_file = save_from_file::<UltraSunMoonSave>(
            &PathBuf::from("save_files")
                .join("gen7_alola")
                .join("ultrasun")
                .to_string_lossy(),
        )
        .unwrap()
        .0;

        assert_eq!(save_file.calc_checksum(), 0x4D97);

        Ok(())
    }
}
