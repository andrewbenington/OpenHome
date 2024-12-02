use std::path::PathBuf;

#[derive(Default)]
pub struct AppState {
    pub open_transaction: std::sync::Mutex<bool>,
    pub temp_files: std::sync::Mutex<Vec<PathBuf>>,
}
