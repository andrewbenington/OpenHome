use crate::util::{parse_path_data, PathData};
use serde;
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

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

pub fn dedupe_paths(paths: Vec<PathData>) -> Vec<PathData> {
    let mut seen = HashSet::new();
    paths
        .into_iter()
        .filter(|path| seen.insert(path.raw.clone()))
        .collect()
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

            // println!(
            //     "entry_path citra: {}",
            //     entry_path.to_str().unwrap_or("(no path)")
            // );

            if entry_path.is_dir() {
                found_saves.extend(recursively_find_citra_saves(&entry_path, depth + 1)?);
            } else if entry_path.ends_with("main") {
                found_saves.push(parse_path_data(&entry_path));
            }
        }
    }

    Ok(found_saves)
}
