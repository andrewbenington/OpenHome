use crate::Result;
use crate::data_controller;
use crate::util;
use serde::Deserialize;
use serde::Serialize;
use std::ops::Deref;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Serialize)]
pub struct StartupConfigState(pub Mutex<StartupConfig>);

impl StartupConfigState {
    pub fn load_or_create() -> Result<Self> {
        let startup_config = StartupConfig::load_or_create()?;
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
    fn get_file_path() -> Result<PathBuf> {
        Ok(data_controller::get_openhome_config_dir()?.join(STARTUP_CONFIG_FILENAME))
    }

    pub fn load_or_create() -> Result<Self> {
        let file_path = Self::get_file_path()?;
        if !file_path.exists() {
            println!("doesn't exist: {file_path:?}");
            let config_path = data_controller::get_openhome_config_dir()?;
            if !config_path.exists() {
                util::create_directory(config_path)?;
            }
            let default = Self::default();
            default.write_to_storage()?;
            Ok(default)
        } else {
            println!("exist: {file_path:?}");
            data_controller::read_file_json(file_path)
        }
    }

    pub fn update_data_dir(&mut self, new_dir: &Path) {
        self.data_dir_path = Some(new_dir.into())
    }

    pub fn write_to_storage(&self) -> Result<()> {
        data_controller::write_file_json(Self::get_file_path()?, self)
    }

    pub fn get_data_dir_path(&self) -> Option<PathBuf> {
        self.data_dir_path.clone()
    }
}
