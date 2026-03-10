use glob::glob;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EmulatorConfig {
    pub name: String,
    pub paths: HashMap<String, Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
/// Wrapper
pub struct EmulatorConfigList {
    pub extensions: Vec<String>,
    pub emulators: Vec<EmulatorConfig>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DetectedSave {
    pub emulator: String,
    pub path: PathBuf,
    pub matched_pattern: String,
}

/// Helper function to expand system variables and directory shortcuts.
fn expand_path(path_str: &str) -> String {
    let mut expanded = path_str.to_string();

    if expanded.starts_with('~') && let Some(home_dir) = dirs::home_dir() {
        expanded = expanded.replacen('~', &home_dir.to_string_lossy(), 1);
    }

    if cfg!(windows) {
        if expanded.contains("%APPDATA%") && let Some(app_data) = dirs::config_dir() {
            expanded = expanded.replacen("%APPDATA%", &app_data.to_string_lossy(), 1);
        }
        if expanded.contains("%USERPROFILE%") && let Some(user_profile) = dirs::home_dir() {
            expanded = expanded.replacen("%USERPROFILE%", &user_profile.to_string_lossy(), 1);
        }
        if expanded.contains("%LOCALAPPDATA%") && let Some(local_app_data) = dirs::data_local_dir() {
            expanded = expanded.replacen("%LOCALAPPDATA%", &local_app_data.to_string_lossy(), 1);
        }
    }

    expanded
}

/// Identifies the current operating system
pub fn get_os_key() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else {
        "linux"
    }
}

/// Compiles the `emulator_paths.json` into the binary directly using `include_str!` and parses it.
pub fn load_emulator_config() -> Result<EmulatorConfigList, String> {
    let config_str = include_str!("../emulator_paths.json");
    serde_json::from_str(config_str).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn scan_emulators() -> Result<Vec<DetectedSave>, String> {
    // Load config from memory and get our host's platform
    let config = load_emulator_config()?;
    let os_key = get_os_key();

    let mut results: Vec<DetectedSave> = Vec::new();
    let mut seen: HashSet<PathBuf> = HashSet::new(); // Used to ensure we don't present identical save files multiple times

    for emulator in config.emulators {
        if let Some(paths) = emulator.paths.get(os_key) {
            for path_pattern in paths {
                // Expand to full path
                let expanded_pattern = expand_path(path_pattern);

                // Initialize globbing based on the configured paths.
                match glob(&expanded_pattern) {
                    Ok(entries) => {
                        for entry in entries {
                            match entry {
                                Ok(path) => {
                                    if path.exists() && path.is_file() && seen.insert(path.clone()) {
                                        // Verify extension safety
                                        let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                                        let ext_str = path.extension().and_then(|n| n.to_str()).unwrap_or("");
                                        let is_valid = config.extensions.iter().any(|ext| {
                                            if ext.starts_with('.') {
                                                ext.trim_start_matches('.') == ext_str
                                            } else {
                                                file_name == ext // e.g. "main"
                                            }
                                        });

                                        if is_valid {
                                            results.push(DetectedSave {
                                                emulator: emulator.name.clone(),
                                                path,
                                                matched_pattern: path_pattern.clone(),
                                            });
                                        }
                                    }
                                }
                                Err(e) => {
                                    eprintln!("Glob iteration error: {}", e);
                                }
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Invalid glob pattern '{}': {}", expanded_pattern, e);
                    }
                }
            }
        }
    }

    Ok(results)
}
