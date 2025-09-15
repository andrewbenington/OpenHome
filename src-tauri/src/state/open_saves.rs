use std::{
    collections::HashMap,
    ops::Deref,
    path::{Path, PathBuf},
    sync::Mutex,
};

use crate::error::OpenHomeResult;
use pkm_rs::saves::{SaveData, SaveType, gen7_alola::SunMoonSave, lets_go::LetsGoSave};
use serde::Serialize;

use crate::util;

#[derive(Default, Serialize)]
pub struct OpenSavesStateInner {
    // pub openhome: OhpkmBytesLookup,
    saves: HashMap<PathBuf, SaveData>,
}

#[derive(Serialize)]
pub enum OpenSaveResponse {
    NotRecognized,
    OneMatch(SaveType),
    MultipleMatches(Vec<SaveType>),
}

impl OpenSavesStateInner {
    pub fn open_save(path: &Path) -> OpenHomeResult<OpenSaveResponse> {
        let bytes = util::read_file_bytes(path)?;
        let possible_save_types = SaveType::detect_from_bytes(&bytes);

        match possible_save_types.len() {
            0 => Ok(OpenSaveResponse::NotRecognized),
            1 => possible_save_types[0]
                .build(&bytes)
                .map(OpenSaveResponse::OneMatch),
        }
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

pub struct DisambiguationPrompt {
    id: u8,
    save_data_results: Vec<OpenHomeResult<SaveData>>,
    bytes: Box<[u8]>,
}
