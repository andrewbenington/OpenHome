use tauri::Manager;

use crate::commands::CommandResult;
use crate::data_controller::{DataController, DataDir};
use crate::util;
use crate::{Error, Result};
use core::fmt;
use std::collections::HashMap;
use std::ffi::OsStr;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

const RECENT_SAVES_FILENAME: &str = "recent_saves.json";

#[derive(serde::Serialize, serde::Deserialize, Debug, specta::Type)]
pub struct PossibleSaves {
    pub citra: Vec<util::PathData>,
    pub desmume: Vec<util::PathData>,
    pub open_emu: Vec<util::PathData>,
}
impl PossibleSaves {
    pub fn add_all(&mut self, other: Self) {
        self.citra.extend(other.citra);
        util::dedupe_paths(&mut self.citra);

        self.desmume.extend(other.desmume);
        util::dedupe_paths(&mut self.desmume);

        self.open_emu.extend(other.open_emu);
        util::dedupe_paths(&mut self.open_emu)
    }
}

pub trait SaveFileSearch: Default + fmt::Debug {
    fn should_search_in_dir(dir_path: &Path) -> bool;
    fn file_is_possible_match(dir_path: &Path) -> bool;

    fn recursively_find_saves(path: &PathBuf) -> Result<Vec<util::PathData>> {
        let mut found_saves = Vec::<util::PathData>::new();

        for entry in fs::read_dir(path)
            .map_err(|e| Error::file_access(path, e))?
            .flatten()
        {
            let entry_path = &entry.path();
            if Self::should_search_in_dir(entry_path) {
                // tracing::debug!("{:#?}: searching in {entry_path:?}", Self::default());
                found_saves.extend(Self::recursively_find_saves(entry_path)?)
            } else if Self::file_is_possible_match(entry_path) {
                // tracing::info!("{:#?}: MATCH - {entry_path:?}", Self::default());
                found_saves.push(util::parse_path_data(entry_path));
            } else {
                // tracing::debug!("{:#?}: not a match - {entry_path:?}", Self::default());
            }
        }

        Ok(found_saves)
    }
}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct Gambatte;

impl SaveFileSearch for Gambatte {
    fn should_search_in_dir(dir_path: &Path) -> bool {
        dir_path.is_dir()
            && dir_path.file_name().is_some_and(|dir_name| {
                is_one_of(dir_name, ["Battery", "Battery Saves", "Gambatte"])
            })
    }

    fn file_is_possible_match(dir_path: &Path) -> bool {
        dir_path.is_file()
            && dir_path
                .extension()
                .is_some_and(|ext| ext.eq_ignore_ascii_case("sav"))
    }
}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct Desmume;

impl SaveFileSearch for Desmume {
    fn should_search_in_dir(dir_path: &Path) -> bool {
        dir_path.is_dir()
            && dir_path.file_name().is_some_and(|dir_name| {
                is_one_of(dir_name, ["Battery", "Battery Saves", "DeSmuME"])
            })
    }

    fn file_is_possible_match(dir_path: &Path) -> bool {
        dir_path.is_file()
            && dir_path
                .extension()
                .is_some_and(|ext| ext.eq_ignore_ascii_case("dsv"))
    }
}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct Mgba;

impl SaveFileSearch for Mgba {
    fn should_search_in_dir(dir_path: &Path) -> bool {
        dir_path.is_dir()
            && dir_path
                .file_name()
                .is_some_and(|dir_name| is_one_of(dir_name, ["Battery", "Battery Saves", "mGBA"]))
    }

    fn file_is_possible_match(dir_path: &Path) -> bool {
        dir_path.is_file()
            && dir_path
                .extension()
                .is_some_and(|ext| ext.eq_ignore_ascii_case("sav"))
    }
}

// const RE_8_DIGIT_HEX: Regex = Regex::new("^[A-Fa-f0-9]{8}$").expect("RE_8_DIGIT_HEX is valid");
fn is_8_digit_hex(os_str: &OsStr) -> bool {
    os_str.is_ascii()
        && os_str.to_str().is_some_and(|s| {
            s.is_ascii() && s.len() == 8 && s.chars().all(|c| c.is_ascii_hexdigit())
        })
}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct Citra;

impl SaveFileSearch for Citra {
    fn should_search_in_dir(dir_path: &Path) -> bool {
        dir_path.is_dir()
            && dir_path.file_name().is_some_and(|dir_name| {
                is_one_of(
                    dir_name,
                    [
                        "citra-emu",
                        "citra",
                        "sdmc",
                        "Nintendo 3DS",
                        "00000000000000000000000000000000",
                        "title",
                        "data",
                    ],
                ) || is_8_digit_hex(dir_name)
            })
    }

    fn file_is_possible_match(dir_path: &Path) -> bool {
        dir_path.is_file()
            && dir_path
                .file_name()
                .is_some_and(|n| n.eq_ignore_ascii_case("main"))
    }
}

fn is_one_of(os_str: &OsStr, possibilities: impl IntoIterator<Item = &'static str>) -> bool {
    possibilities
        .into_iter()
        .any(|s| os_str.eq_ignore_ascii_case(s))
}

#[derive(serde::Serialize, serde::Deserialize, Debug, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SaveRef {
    pub file_path: util::PathData,
    pub game: u32,
    pub trainer_name: String,
    #[serde(rename = "trainerID")]
    pub trainer_id: String,
    pub last_opened: Option<f64>,
    pub last_modified: Option<f64>,
    pub valid: bool,
    pub plugin_identifier: Option<pkm_rs::PluginIdentifier>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
#[serde(untagged)]
pub enum StringOrU32 {
    String(String),
    U32(u32),
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StoredSaveRef {
    pub file_path: util::PathData,
    pub game: Option<StringOrU32>,
    pub trainer_name: Option<String>,
    #[serde(rename = "trainerID")]
    pub trainer_id: Option<String>,
    pub last_opened: Option<f64>,
    pub plugin_identifier: Option<pkm_rs::PluginIdentifier>,
}

type RawSavePath = String;

pub fn get_recent_saves(
    data_controller: &impl DataController,
) -> core::result::Result<Vec<(RawSavePath, SaveRef)>, String> {
    let recent_saves: HashMap<String, StoredSaveRef> = data_controller
        .read_or_create_default_json_file(DataDir::Storage, RECENT_SAVES_FILENAME)
        .map_err(|e| format!("Error getting settings: {}", e))?;

    let paths_and_saves = recent_saves.into_iter().map(|(raw, save)| {
        let path = Path::new(&raw);
        let game_u32 = match save.game {
            None => 0,
            Some(val) => match val {
                StringOrU32::String(str) => str.parse().unwrap_or(0),
                StringOrU32::U32(num) => num,
            },
        };
        (
            raw.to_owned(),
            SaveRef {
                file_path: save.file_path,
                game: game_u32,
                trainer_name: save.trainer_name.unwrap_or_default(),
                trainer_id: save.trainer_id.unwrap_or_default(),
                last_opened: save.last_opened,
                last_modified: get_modified_time_ms(path),
                valid: path.exists(),
                plugin_identifier: save.plugin_identifier,
            },
        )
    });

    Ok(paths_and_saves.collect())
}

fn get_modified_time_ms(path: &Path) -> Option<f64> {
    path.metadata()
        .ok()
        .as_ref()
        .and_then(|metadata| metadata.modified().ok())
        .and_then(|st| st.duration_since(UNIX_EPOCH).ok())
        .map(|dur| dur.as_millis() as f64)
}

#[tauri::command]
#[specta::specta]
pub async fn find_suggested_saves(
    app_handle: tauri::AppHandle,
    save_folders: Vec<&str>,
) -> CommandResult<PossibleSaves> {
    let mut possible_saves = PossibleSaves {
        citra: Vec::new(),
        desmume: Vec::new(),
        open_emu: Vec::new(),
    };

    let citra_dir_r = app_handle
        .path()
        .home_dir()
        .map(|home| home.join(".local/share/citra-emu/sdmc/Nintendo 3DS"));

    if let Ok(citra_dir) = citra_dir_r
        && citra_dir.exists()
    {
        possible_saves
            .citra
            .extend(Citra::recursively_find_saves(&citra_dir)?);
    }

    // Iterate over user-provided save folders
    for folder_str in save_folders {
        let folder_path = PathBuf::from(folder_str);
        if folder_path.exists() {
            tracing::info!("checking saves in folder {folder_str}");
            let result = tokio::task::spawn_blocking(move || {
                get_possible_saves(&folder_path).map_err(|e| e.to_string())
            })
            .await
            .map_err(|e| {
                Error::other_with_source("tokio task failed in find_suggested_saves", e)
            })?;
            tracing::info!("finished checking");

            match result {
                Ok(newly_found) => possible_saves.add_all(newly_found),
                Err(e) => {
                    tracing::error!("failed to check saves in folder {folder_str}: {e}");
                    continue;
                }
            };
        } else {
            return Err(Error::file_missing(&folder_path).into());
        }
    }

    Ok(possible_saves)
}

fn get_possible_saves(folder: &PathBuf) -> Result<PossibleSaves> {
    let mut possible_saves = PossibleSaves {
        citra: Vec::new(),
        desmume: Vec::new(),
        open_emu: Vec::new(),
    };

    let citra_saves = Citra::recursively_find_saves(folder)?;
    possible_saves.citra.extend(citra_saves);

    let mgba_saves = Mgba::recursively_find_saves(folder)?;
    let gambatte_saves = Gambatte::recursively_find_saves(folder)?;

    possible_saves.open_emu.extend(mgba_saves);
    possible_saves.open_emu.extend(gambatte_saves);

    let desmume_saves = Desmume::recursively_find_saves(folder)?;
    possible_saves.desmume.extend(desmume_saves);

    Ok(possible_saves)
}
