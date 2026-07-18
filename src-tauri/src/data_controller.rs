use crate::startup_config::StartupConfigState;
use openhome_core::data_controller::DataController;
use openhome_core::{Error, Result};
use std::path::PathBuf;
use tauri::AppHandle;

pub struct TauriDataController(tauri::AppHandle);
impl TauriDataController {
    pub fn new(handle: &tauri::AppHandle) -> Self {
        Self(handle.clone())
    }
}

impl DataController for &TauriDataController {
    fn get_data_folder(&self) -> Result<PathBuf> {
        use tauri::Manager;
        let data_folder = self
            .0
            .path()
            .app_data_dir()
            .map_err(|e| Error::other_with_source("Tauri error", e))?;
        let state = self.0.state::<StartupConfigState>();
        Ok(state.lock()?.get_data_dir_path().unwrap_or(data_folder))
    }

    fn get_config_folder(&self) -> Result<PathBuf> {
        use tauri::Manager;
        self.0
            .path()
            .app_config_dir()
            .map_err(|e| Error::other_with_source("Tauri error", e))
    }
}

impl DataController for TauriDataController {
    fn get_data_folder(&self) -> Result<PathBuf> {
        use tauri::Manager;
        let data_folder = self
            .0
            .path()
            .app_data_dir()
            .map_err(|e| Error::other_with_source("Tauri error", e))?;
        let state = self.0.state::<StartupConfigState>();
        Ok(state.lock()?.get_data_dir_path().unwrap_or(data_folder))
    }

    fn get_config_folder(&self) -> Result<PathBuf> {
        use tauri::Manager;
        self.0
            .path()
            .app_config_dir()
            .map_err(|e| Error::other_with_source("Tauri error", e))
    }
}

pub trait ToDataController {
    fn controller(&self) -> TauriDataController;
}

impl ToDataController for &AppHandle {
    fn controller(&self) -> TauriDataController {
        TauriDataController::new(self)
    }
}

impl ToDataController for AppHandle {
    fn controller(&self) -> TauriDataController {
        TauriDataController::new(self)
    }
}

#[cfg(test)]
pub mod test {
    use std::cell::RefCell;
    use std::collections::HashMap;
    use std::path::{Path, PathBuf};

    use openhome_core::data_controller::DataDir;

    use crate::data_controller::DataController;
    use crate::{Error, Result};

    type VirtualFiles = std::collections::HashMap<PathBuf, Vec<u8>>;

    #[derive(Default)]
    pub struct TestDataController(RefCell<VirtualFiles>);

    impl TestDataController {
        pub fn single_file(path: &Path, contents: &[u8]) -> Self {
            let mut map = HashMap::new();
            map.insert(path.to_path_buf(), contents.to_vec());
            Self(RefCell::new(map))
        }

        fn get<P>(&self, full_path: P) -> Option<Vec<u8>>
        where
            P: AsRef<Path>,
        {
            let full_path: PathBuf = full_path.as_ref().to_path_buf();
            self.0.borrow().get(&full_path).cloned()
        }

        fn insert<P>(&self, full_path: P, bytes: Vec<u8>) -> Option<Vec<u8>>
        where
            P: AsRef<Path>,
        {
            let full_path: PathBuf = full_path.as_ref().to_path_buf();
            self.0.borrow_mut().insert(full_path, bytes)
        }

        fn read_file_bytes<P>(&self, full_path: P) -> Result<Vec<u8>>
        where
            P: AsRef<Path>,
        {
            let full_path: PathBuf = full_path.as_ref().to_path_buf();
            self.get(&full_path)
                .ok_or(Error::FileMissing { path: full_path })
        }

        fn write_file_bytes<P>(&self, full_path: P, bytes: Vec<u8>) -> Result<()>
        where
            P: AsRef<Path>,
        {
            self.insert(full_path.as_ref(), bytes);
            Ok(())
        }

        fn file_exists<P>(&self, dir: DataDir, relative_path: P) -> bool
        where
            P: AsRef<Path>,
        {
            self.0.borrow().contains_key(
                &PathBuf::from(dir.get_relative_path().unwrap_or_default()).join(relative_path),
            )
        }
    }

    impl DataController for TestDataController {
        fn get_data_folder(&self) -> crate::Result<PathBuf> {
            Ok(PathBuf::new())
        }

        fn get_config_folder(&self) -> crate::Result<PathBuf> {
            Ok(PathBuf::new())
        }

        fn absolute_path<P>(&self, dir: DataDir, relative_path: P) -> crate::Result<PathBuf>
        where
            P: AsRef<std::path::Path>,
        {
            self.absolute_dir_path(dir).map(|p| p.join(relative_path))
        }

        fn absolute_dir_path(&self, dir: DataDir) -> crate::Result<PathBuf> {
            let data_folder = self.get_data_folder()?;
            if let Some(rel_path) = dir.get_relative_path() {
                Ok(data_folder.join(rel_path))
            } else {
                Ok(data_folder)
            }
        }

        fn read_file_json<P, T>(&self, dir: DataDir, relative_path: P) -> crate::Result<T>
        where
            P: AsRef<std::path::Path>,
            T: serde::de::DeserializeOwned,
        {
            let full_path = self.absolute_dir_path(dir)?.join(&relative_path);

            if !self.file_exists(dir, &relative_path) {
                return Err(Error::file_missing(full_path.as_ref()));
            }

            let json_str = self.read_file_text(dir, &relative_path)?;
            serde_json::from_str(&json_str).map_err(|e| Error::file_malformed(&full_path, e))
        }

        fn write_file_json<P, V>(
            &self,
            dir: DataDir,
            relative_path: P,
            value: V,
        ) -> crate::Result<()>
        where
            P: AsRef<std::path::Path>,
            V: serde::ser::Serialize,
        {
            let full_path = self.absolute_dir_path(dir)?.join(&relative_path);
            let text = serde_json::to_string(&value)
                .map_err(|err| Error::file_malformed(&full_path, err))?;
            self.write_file_text(dir, relative_path, &text)
        }

        fn read_file_text<P>(&self, dir: DataDir, relative_path: P) -> crate::Result<String>
        where
            P: AsRef<std::path::Path>,
        {
            let full_path = self.absolute_dir_path(dir)?.join(relative_path);
            let bytes = self.read_file_bytes(&full_path)?;

            String::from_utf8(bytes.to_vec()).map_err(|e| Error::file_malformed(&full_path, e))
        }

        fn read_file_text_if_exists<P>(
            &self,
            dir: DataDir,
            relative_path: P,
        ) -> Option<crate::Result<String>>
        where
            P: AsRef<std::path::Path>,
        {
            if self.file_exists(dir, &relative_path) {
                Some(self.read_file_text(dir, &relative_path))
            } else {
                None
            }
        }

        fn write_file_text<P>(
            &self,
            dir: DataDir,
            relative_path: P,
            value: &str,
        ) -> crate::Result<()>
        where
            P: AsRef<std::path::Path>,
        {
            let full_path = self.absolute_dir_path(dir)?.join(&relative_path);
            self.write_file_bytes(&full_path, value.as_bytes().to_vec())
        }

        fn delete_file<P>(&self, dir: DataDir, relative_path: P) -> crate::Result<()>
        where
            P: AsRef<std::path::Path>,
        {
            let full_path = self.absolute_dir_path(dir)?.join(relative_path);
            match self.0.borrow_mut().remove(&full_path) {
                Some(_) => Ok(()),
                None => Err(Error::file_missing(&full_path)),
            }
        }

        fn truncate_file<P>(&self, dir: DataDir, relative_path: P) -> crate::Result<()>
        where
            P: AsRef<std::path::Path>,
        {
            let full_path = self.absolute_dir_path(dir)?.join(&relative_path);
            if self.file_exists(dir, &relative_path) {
                self.write_file_bytes(full_path, Vec::new())
            } else {
                Err(Error::file_missing(&full_path))
            }
        }

        fn read_file_json_if_exists<P, T>(
            &self,
            dir: DataDir,
            relative_path: P,
        ) -> Option<crate::Result<T>>
        where
            P: AsRef<std::path::Path>,
            T: serde::de::DeserializeOwned,
        {
            let full_path = match self.absolute_path(dir, &relative_path) {
                Ok(path) => path,
                Err(err) => return Some(Err(err)),
            };

            match self.read_file_text(dir, &relative_path) {
                Ok(json_str) => Some(
                    serde_json::from_str(&json_str)
                        .map_err(|e| Error::file_malformed(&full_path, e)),
                ),
                Err(Error::FileMissing { .. }) => None,
                Err(e) => Some(Err(e)),
            }
        }

        fn create_default_json_file_if_not_exists<P, T>(
            &self,
            dir: DataDir,
            relative_path: &P,
        ) -> crate::Result<bool>
        where
            P: AsRef<std::path::Path>,
            T: serde::de::DeserializeOwned + serde::ser::Serialize + Default,
        {
            if !self.file_exists(dir, relative_path) {
                self.write_file_json(dir, relative_path, T::default())?;
                Ok(true)
            } else {
                Ok(false)
            }
        }

        fn read_or_create_default_json_file<P, T>(
            &self,
            dir: DataDir,
            relative_path: P,
        ) -> crate::Result<T>
        where
            P: AsRef<std::path::Path>,
            T: serde::de::DeserializeOwned + serde::ser::Serialize + Default,
        {
            let default_file_created =
                self.create_default_json_file_if_not_exists::<P, T>(dir, &relative_path)?;

            if default_file_created {
                Ok(T::default())
            } else {
                DataController::read_file_json(self, dir, &relative_path)
            }
        }
    }
}
