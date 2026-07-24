use std::path::PathBuf;

use openhome_core::data_controller::DataController;
use openhome_core::startup_config::StartupConfig;
use openhome_core::{Error, Result};

pub struct CliDataController(StartupConfig);

impl CliDataController {
    pub fn load() -> Result<Self> {
        StartupConfig::load_or_create().map(Self)
    }
}

#[cfg(target_os = "macos")]
pub fn get_default_data_dir() -> Result<PathBuf> {
    let home_dir = std::env::var("HOME")
        .map_err(|e| Error::other_with_source("HOME environment variable is not present", e))?;
    let application_support = PathBuf::from(home_dir)
        .join("Library")
        .join("Application Support");
    Ok(application_support)
}

#[cfg(target_os = "macos")]
pub fn get_config_dir() -> Result<PathBuf> {
    get_default_data_dir()
}

#[cfg(target_os = "linux")]
pub fn get_default_data_dir() -> Result<PathBuf> {
    Ok(std::env::var_os("XDG_DATA_HOME")
        .map(PathBuf::from)
        .unwrap_or(PathBuf::from(".local").join("share")))
}

#[cfg(target_os = "linux")]
pub fn get_config_dir() -> Result<PathBuf> {
    Ok(std::env::var_os("XDG_CONFIG_HOME")
        .map(PathBuf::from)
        .unwrap_or(PathBuf::from(".config")))
}

#[cfg(target_os = "windows")]
pub fn get_default_data_dir() -> Result<PathBuf> {
    std::env::var("APPDATA")
        .map(PathBuf::from)
        .map_err(|e| Error::other_with_source("APPDATA environment variable is not present", e))
}

#[cfg(target_os = "windows")]
pub fn get_config_dir() -> Result<PathBuf> {
    get_default_data_dir()
}

impl DataController for CliDataController {
    fn get_data_folder(&self) -> Result<PathBuf> {
        Ok(self
            .0
            .get_data_dir_path()
            .unwrap_or(get_default_data_dir()?)
            .join("OpenHome"))
    }

    fn get_config_folder(&self) -> Result<PathBuf> {
        get_config_dir().map(|dir| dir.join("OpenHome"))
    }
}
