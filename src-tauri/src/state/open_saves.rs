use std::{
    collections::HashMap,
    ops::Deref,
    path::{Path, PathBuf},
    sync::Mutex,
};

use crate::error::Result;
use pkm_rs::saves::{SaveData, SaveType, gen7_alola::SunMoonSave, lets_go::LetsGoSave};
use serde::Serialize;

use crate::util;

#[derive(Default, Serialize)]
pub struct OpenSavesStateInner {
    // pub openhome: OhpkmBytesLookup,
    saves: HashMap<PathBuf, SaveData>,
}

impl OpenSavesStateInner {
    pub fn add_save(&mut self, path: PathBuf, save: SaveData) {
        self.saves.entry(path).or_insert(save);
    }
}

#[derive(Serialize)]
pub enum OpenSaveResponse {
    NotRecognized,
    OneMatch(SaveType),
    MultipleMatches(Vec<SaveType>),
}

impl OpenSavesStateInner {
    pub fn open_save(path: &Path) -> Result<OpenSaveResponse> {
        let bytes = util::read_file_bytes(path)?;
        let possible_save_types = SaveType::detect_from_bytes(&bytes);

        Ok(match possible_save_types.len() {
            0 => OpenSaveResponse::NotRecognized,
            1 => OpenSaveResponse::OneMatch(possible_save_types[0]),
            2.. => OpenSaveResponse::MultipleMatches(possible_save_types),
        })
    }
}

#[derive(Default, Serialize)]
pub struct OpenSavesState(pub Mutex<OpenSavesStateInner>);

impl Deref for OpenSavesState {
    type Target = Mutex<OpenSavesStateInner>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
