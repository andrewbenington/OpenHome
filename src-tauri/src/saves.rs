use crate::util::{self, parse_path_data, PathData};
use serde;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct PossibleSaves {
    pub citra: Vec<PathData>,
    pub desamume: Vec<PathData>,
    pub open_emu: Vec<PathData>,
}

const MAX_SEARCH_DEPTH: usize = 2;

pub fn recursively_find_desamume_saves(
    current_path: &Path,
    depth: usize,
) -> Result<Vec<PathData>, String> {
    if depth >= MAX_SEARCH_DEPTH {
        return Ok(vec![]);
    }

    let mut found_saves = Vec::new();

    let entries = fs::read_dir(current_path).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let entry_path = entry.path();

        if entry_path.is_dir() {
            if entry_path.ends_with("Battery Saves") || entry_path.ends_with("Battery") {
                let inner_files = fs::read_dir(&entry_path).map_err(|e| e.to_string())?;
                for inner_file in inner_files {
                    let inner_file = inner_file.map_err(|e| e.to_string())?;
                    let file_path = inner_file.path();

                    if let Some(ext) = file_path.extension() {
                        if ext == "dsv" {
                            found_saves.push(parse_path_data(&file_path));
                        }
                    }
                }
            } else {
                found_saves.extend(recursively_find_desamume_saves(&entry_path, depth + 1)?);
            }
        }
    }

    Ok(found_saves)
}

pub fn recursively_find_gambatte_saves(
    current_path: &Path,
    depth: usize,
) -> Result<Vec<PathData>, String> {
    if depth >= MAX_SEARCH_DEPTH {
        return Ok(vec![]);
    }

    let mut found_saves = Vec::new();

    let entries = fs::read_dir(current_path).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let entry_path = entry.path();

        if entry_path.is_dir() {
            if entry_path.ends_with("Battery Saves") {
                let inner_files = fs::read_dir(&entry_path).map_err(|e| e.to_string())?;
                for inner_file in inner_files {
                    let inner_file = inner_file.map_err(|e| e.to_string())?;
                    let file_path = inner_file.path();

                    if let Some(ext) = file_path.extension() {
                        if ext == "sav" || ext == "rtc" {
                            found_saves.push(parse_path_data(&file_path));
                        }
                    }
                }
            } else {
                found_saves.extend(recursively_find_gambatte_saves(&entry_path, depth + 1)?);
            }
        }
    }

    Ok(found_saves)
}

pub fn recursively_find_mgba_saves(
    current_path: &Path,
    depth: usize,
) -> Result<Vec<PathData>, String> {
    if depth >= MAX_SEARCH_DEPTH {
        return Ok(vec![]);
    }

    let mut found_saves = Vec::new();

    let entries = fs::read_dir(current_path).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let entry_path = entry.path();

        if entry_path.is_dir() {
            if entry_path.ends_with("Battery Saves") {
                let inner_files = fs::read_dir(&entry_path).map_err(|e| e.to_string())?; // CHANGED
                for inner_file in inner_files {
                    let inner_file = inner_file.map_err(|e| e.to_string())?; // CHANGED
                    let file_path = inner_file.path();

                    println!(
                        "file_path mGBA: {}",
                        file_path.to_str().unwrap_or("(no path)")
                    );

                    if let Some(ext) = file_path.extension() {
                        if ext == "sav" {
                            found_saves.push(parse_path_data(&file_path));
                        }
                    }
                }
            } else {
                found_saves.extend(recursively_find_mgba_saves(&entry_path, depth + 1)?);
            }
        }
    }

    Ok(found_saves)
}

pub fn recursively_find_citra_saves(path: &PathBuf, depth: usize) -> Result<Vec<PathData>, String> {
    if depth >= MAX_SEARCH_DEPTH {
        return Ok(vec![]);
    }

    let mut found_saves = Vec::new();
    if path.is_dir() {
        let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let entry_path = entry.path();

            if entry_path.is_dir() {
                found_saves.extend(recursively_find_citra_saves(&entry_path, depth + 1)?);
            } else if entry_path.ends_with("main") {
                found_saves.push(parse_path_data(&entry_path));
            }
        }
    }

    Ok(found_saves)
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SaveRef {
    pub file_path: PathData,
    pub game: u32,
    pub trainer_name: String,
    #[serde(rename = "trainerID")]
    pub trainer_id: String,
    pub last_opened: Option<f64>,
    pub last_modified: Option<f64>,
    pub valid: bool,
    pub plugin_identifier: Option<String>,
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
    pub file_path: PathData,
    pub game: Option<StringOrU32>,
    pub trainer_name: Option<String>,
    #[serde(rename = "trainerID")]
    pub trainer_id: Option<String>,
    pub last_opened: Option<f64>,
    pub plugin_identifier: Option<String>,
}

pub fn get_recent_saves(app_handle: tauri::AppHandle) -> Result<HashMap<String, SaveRef>, String> {
    let file_path: PathBuf = "recent_saves.json".to_string().into();
    let recent_saves: HashMap<String, StoredSaveRef> =
        util::get_storage_file_json(&app_handle, &file_path)
            .map_err(|e| format!("Error getting settings: {}", e))?;

    let mut validated_recents: HashMap<String, SaveRef> = HashMap::new();
    for (raw, save) in recent_saves {
        let path = Path::new(&raw);
        let game_u32 = match save.game {
            None => 0,
            Some(val) => match val {
                StringOrU32::String(str) => str.parse().unwrap_or(0),
                StringOrU32::U32(num) => num,
            },
        };

        validated_recents.insert(
            raw.to_owned(),
            SaveRef {
                file_path: save.file_path,
                game: game_u32,
                trainer_name: save.trainer_name.unwrap_or_default(),
                trainer_id: save.trainer_id.unwrap_or_default(),
                last_opened: save.last_opened,
                last_modified: get_modified_time_ms(path).ok(),
                valid: path.exists(),
                plugin_identifier: save.plugin_identifier,
            },
        );
    }

    return Ok(validated_recents);
}

fn get_modified_time_ms(path: &Path) -> Result<f64, String> {
    return path
        .metadata()
        .map_err(|e| format!("Error getting metadata: {}", e))
        .and_then(|m| {
            m.modified()
                .map_err(|e| format!("Error getting modified time: {}", e))
        })
        .and_then(|st| {
            st.duration_since(UNIX_EPOCH)
                .map_err(|e| format!("Invalid modified time: {}", e))
        })
        .map(|dur| dur.as_millis() as f64);
}
