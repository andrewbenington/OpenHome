use pkm_rs::{pkm::Ohpkm, saves::SaveData};

use std::{
    error::Error,
    fs::{File, remove_file, rename},
    io::Write,
    path::{Path, PathBuf},
    sync::Mutex,
};

use serde::Serialize;

fn add_tmp(path: &Path) -> PathBuf {
    if let Some(stem) = path.file_name() {
        return path.with_file_name(format!("{}.tmp", stem.to_string_lossy().into_owned()));
    }
    path.to_path_buf()
}

fn remove_tmp(mut path: PathBuf) -> PathBuf {
    if let Some(stem) = path.clone().file_name().and_then(|name| name.to_str()) {
        let new_name_o = stem.strip_suffix(".tmp");
        if let Some(new_name) = new_name_o {
            path.set_file_name(new_name);
        }
    }
    path
}

pub struct SaveCoords {
    pub box_index: u8,
    pub box_position: u8,
}

enum PokemonMove {
    Removal,
    Import { pokemon: Ohpkm },
}

pub struct UnsavedChange {
    coords: SaveCoords,
    event: PokemonMove,
}

pub struct OpenSave {
    pub save: SaveData,
    pub unsaved_changes: Vec<UnsavedChange>,
}

#[derive(Default, Serialize)]
pub struct AppStateInner {
    pub open_transaction: bool,
    pub temp_files: Vec<PathBuf>,
    #[serde(skip)]
    pub open_saves: Vec<OpenSave>,
}

// A snapshot of the state for serialization
#[derive(Serialize)]
pub struct AppStateSnapshot {
    pub open_transaction: bool,
    pub temp_files: Vec<PathBuf>,
    pub is_dev: bool,
}

impl AppStateInner {
    pub fn start_transaction(&mut self) -> Result<(), Box<dyn Error + '_>> {
        if self.open_transaction {
            Err("Previous transaction is still open".into())
        } else {
            self.open_transaction = true;
            Ok(())
        }
    }

    pub fn rollback_transaction(&mut self) -> Result<(), Box<dyn Error + '_>> {
        if !self.open_transaction {
            return Ok(());
        }

        for temp_file in self.temp_files.iter_mut() {
            remove_file(&temp_file).unwrap_or_else(|e| {
                eprintln!("delete temp file {}: {}", temp_file.to_string_lossy(), e)
            });
        }

        self.open_transaction = false;
        self.temp_files.clear();
        Ok(())
    }

    pub fn commit_transaction(&mut self) -> Result<(), Box<dyn Error + '_>> {
        if !self.open_transaction {
            return Ok(());
        }

        // overwrite original files with the .tmp versions, deleting the temps
        for temp_file in self.temp_files.iter_mut() {
            let temp_file_path = temp_file.clone();
            let temp_file_name = temp_file_path.to_string_lossy().into_owned();

            println!("un-temping {temp_file_name}");
            rename(temp_file, remove_tmp(temp_file_path))
                .map_err(|e| format!("Un-Temp file {temp_file_name}: {e}"))?;
        }

        self.open_transaction = false;
        self.temp_files.clear();
        Ok(())
    }

    pub fn write_file_bytes(&mut self, absolute_path: &Path, bytes: Vec<u8>) -> Result<(), String> {
        let mut path = absolute_path.to_path_buf();
        if self.open_transaction {
            path = add_tmp(&path);
            self.temp_files.push(path.clone());
        }

        let mut file = File::create(&path)
            .map_err(|e| format!("Create/open file {}: {}", path.to_string_lossy(), e))?;

        file.write_all(&bytes)
            .map_err(|e| format!("Write file {}: {}", path.to_string_lossy(), e))
    }
}

pub struct AppState(pub Mutex<AppStateInner>);

impl Default for AppState {
    fn default() -> Self {
        AppState(Mutex::new(AppStateInner::default()))
    }
}
