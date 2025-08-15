mod conversion;
mod encryption;
mod pkm;
mod resources;
mod saves;
mod strings;
mod substructures;
mod util;

use crate::pkm::traits::IsShiny;
use std::{fs::File, io::Read, path::PathBuf};

use serde::Serialize;

use crate::{
    pkm::{Pb7, Pkm},
    saves::{SaveDataTrait, lets_go::LetsGoSave, sun_moon::SunMoonSave},
};

extern crate static_assertions;

const SAVES_DIR: &str = "save_files";

fn main() {
    load_and_print_save::<LetsGoSave>("lgpe_yellow.bin");
    // load_and_print_save::<SunMoonSave>("moon");
}

fn load_and_print_save<SAVE: SaveDataTrait + Serialize>(filename: &str) {
    let mut file = File::open(PathBuf::from(SAVES_DIR).join(filename))
        .map_err(|e| e.to_string())
        .unwrap();

    let mut contents = Vec::new();
    file.read_to_end(&mut contents)
        .map_err(|e| e.to_string())
        .unwrap();

    let save_r = SAVE::from_bytes(contents);

    let Ok(save) = save_r else {
        println!("error building save: {}", save_r.err().unwrap());
        return;
    };

    println!("{}", toml::to_string(&save).unwrap());

    let mon = save.get_mon_at(0, 180).unwrap();
    println!("{}", toml::to_string(&mon).unwrap());
    println!("shiny: {}", mon.is_shiny());

    // let checksum = mon.get_checksum();
    // println!("actual checksum: {checksum} / {checksum:x}");

    // let mon_bytes = save.get_mon_bytes_at(0, 0).unwrap();
    // let path = PathBuf::from(SAVES_DIR).join("partner_pikachu.pb7");
    // println!("path: {}", path.to_string_lossy());
    // let file = File::create(path);
    // match file {
    //     Ok(mut file) => {
    //         if let Err(e) = file.write_all(&mon_bytes) {
    //             println!("error writing file: {e}");
    //         }
    //     }
    //     Err(e) => println!("error opening file: {e}"),
    // }

    // let calced_checksum = encryption::checksum_u16_le(&mon_bytes[0x08..232]);
    // println!("calced checksum: {calced_checksum} / {calced_checksum:x}");

    // println!("checksum: {:x}", save.calc_checksum());

    // print_jolteon();
}

fn print_jolteon() {
    let mut file = File::open(PathBuf::from(SAVES_DIR).join("jolteon.pb7"))
        .map_err(|e| e.to_string())
        .unwrap();

    let mut contents = Vec::new();
    file.read_to_end(&mut contents)
        .map_err(|e| e.to_string())
        .unwrap();

    let pb7 = Pb7::from_bytes(&contents);

    match pb7 {
        Ok(mon) => println!("{}", toml::to_string(&mon).unwrap()),
        Err(e) => println!("{e}"),
    }
}
