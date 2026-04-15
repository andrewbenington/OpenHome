use serde::Deserialize;
use serde::Serialize;
use std::ops::Deref;
use std::path::PathBuf;
use std::sync::Mutex;

use crate::data_controller::DataController;
use crate::data_controller::read_file_json;
use crate::error::Result;

#[derive(Serialize)]
pub struct StartupConfigState(pub Mutex<StartupConfig>);

impl StartupConfigState {
    pub fn load_from_storage(app_handle: &tauri::AppHandle) -> Result<Self> {
        let startup_config = StartupConfig::load_from_storage(app_handle)?;
        Ok(Self(Mutex::new(startup_config)))
    }
}

impl Deref for StartupConfigState {
    type Target = Mutex<StartupConfig>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct StartupConfig {
    data_dir_path: Option<PathBuf>,
}

const STARTUP_CONFIG_FILENAME: &str = "startup-config.json";

impl StartupConfig {
    fn load_from_storage(app_handle: &tauri::AppHandle) -> Result<Self> {
        let full_path = app_handle
            .get_config_folder()?
            .join(STARTUP_CONFIG_FILENAME);

        read_file_json(&full_path)
    }

    pub fn get_data_dir_path(&self) -> Option<PathBuf> {
        self.data_dir_path.clone()
    }
}
