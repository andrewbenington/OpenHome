use base64::Engine;
use base64::engine::general_purpose;
use std::fs;
use std::hash::{Hash, Hasher};
use std::io::Cursor;
use std::path::Path;
use std::process::Command;
use std::{collections::HashSet, path::PathBuf};
use tauri::Manager;
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
use zip::ZipArchive;

use crate::error::{Error, Result};

#[cfg(target_os = "linux")]
use dialog::DialogBox;

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct ImageResponse {
    pub base64: String,
    pub extension: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct PathData {
    pub raw: String,
    pub name: String,
    pub dir: String,
    pub ext: String,
    pub separator: String,
}

impl PartialEq for PathData {
    fn eq(&self, other: &Self) -> bool {
        self.raw == other.raw
    }
}

impl Eq for PathData {}
impl Hash for PathData {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.raw.hash(state);
    }
}

pub fn parse_path_data(path: &Path) -> PathData {
    let raw = path.to_string_lossy().to_string();
    let name = path
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .into();
    let ext = path
        .extension()
        .unwrap_or_default()
        .to_string_lossy()
        .into();
    let dir = path
        .parent()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();
    let separator = std::path::MAIN_SEPARATOR.to_string();
    PathData {
        raw,
        name,
        dir,
        ext,
        separator,
    }
}

pub fn prepend_appdata_to_path<P>(app_handle: &tauri::AppHandle, path: P) -> Result<PathBuf>
where
    P: AsRef<Path>,
{
    app_handle
        .path()
        .app_data_dir()
        .map(|appdata| appdata.join(path))
        .map_err(Error::appdata)
}

pub fn get_storage_path(app_handle: &tauri::AppHandle) -> Result<PathBuf> {
    prepend_appdata_to_path(app_handle, "storage")
}

pub fn prepend_appdata_storage_to_path<P>(app_handle: &tauri::AppHandle, path: P) -> Result<PathBuf>
where
    P: AsRef<Path>,
{
    get_storage_path(app_handle).map(|storage| storage.join(path))
}

pub fn get_appdata_file_text(
    app_handle: &tauri::AppHandle,
    relative_path: &Path,
) -> Result<String> {
    let full_path = prepend_appdata_to_path(app_handle, relative_path)?;
    read_file_text(&full_path)
}

pub fn write_file_contents<P, C>(path: P, contents: C) -> Result<()>
where
    P: AsRef<Path>,
    C: AsRef<[u8]>,
{
    fs::write(&path, contents).map_err(|err| Error::file_access(&path, err))
}

pub fn write_file_json<P, V>(path: P, value: V) -> Result<()>
where
    P: AsRef<Path>,
    V: serde::ser::Serialize,
{
    let text = serde_json::to_string(&value).map_err(|err| Error::file_malformed(&path, err))?;
    write_file_contents(path, text)
}

pub fn write_storage_file_json<P, V>(
    app_handle: &tauri::AppHandle,
    relative_path: P,
    value: V,
) -> Result<()>
where
    P: AsRef<Path>,
    V: serde::ser::Serialize,
{
    let full_path = prepend_appdata_storage_to_path(app_handle, relative_path)?;
    write_file_json(&full_path, value)
}

pub fn create_directory<P>(path: P) -> Result<()>
where
    P: AsRef<Path>,
{
    fs::create_dir_all(&path).map_err(|err| Error::file_access(&path, err))
}

pub fn read_file_bytes<P>(path: P) -> Result<Vec<u8>>
where
    P: AsRef<Path>,
{
    fs::read(&path).map_err(|err| Error::file_access(&path, err))
}

pub fn read_file_text(full_path: &Path) -> Result<String> {
    if !full_path.exists() {
        return Err(Error::file_missing(full_path));
    }

    fs::read_to_string(full_path).map_err(|e| Error::file_malformed(&full_path, e))
}

pub fn read_file_json<T>(full_path: &Path) -> Result<T>
where
    T: serde::de::DeserializeOwned,
{
    if !full_path.exists() {
        return Err(Error::file_missing(full_path));
    }
    let json_str = read_file_text(full_path)?;
    serde_json::from_str(&json_str).map_err(|e| Error::file_malformed(&full_path, e))
}

pub fn get_storage_file_json<P, T>(app_handle: &tauri::AppHandle, relative_path: P) -> Result<T>
where
    P: AsRef<Path>,
    T: serde::de::DeserializeOwned,
{
    let full_path = prepend_appdata_storage_to_path(app_handle, relative_path)?;
    read_file_json(&full_path)
}

pub fn get_appdata_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf> {
    app_handle.path().app_data_dir().map_err(Error::appdata)
}

pub fn dedupe_paths(paths: Vec<PathData>) -> Vec<PathData> {
    let set: HashSet<PathData> = paths.into_iter().collect();
    set.into_iter().collect()
}

pub async fn download_text_file(url: &str) -> Result<String> {
    let response = reqwest::Client::new()
        .get(url)
        .send()
        .await
        .map_err(|err| Error::file_download(url, err))?;

    response
        .text()
        .await
        .map_err(|err| Error::file_download(url, err))
}

pub async fn download_binary_file(url: &str) -> Result<bytes::Bytes> {
    let response = reqwest::Client::new()
        .get(url)
        .send()
        .await
        .map_err(|err| Error::file_download(url, err))?;

    response
        .bytes()
        .await
        .map_err(|err| Error::file_download(url, err))
}

pub async fn download_extract_zip_file<F>(
    url: &str,
    output_dir: &Path,
    progress_callback: F,
) -> Result<()>
where
    F: Fn(f64),
{
    let bytes = download_binary_file(url).await?;

    let mut zip_archive = ZipArchive::new(Cursor::new(bytes))
        .map_err(|err| Error::other_with_source("Could not extract zip archive", err))?;
    let file_count = zip_archive.len();

    create_directory(output_dir)?;

    for i in 0..file_count {
        progress_callback(50.0 + (i as f64 / file_count as f64) * 50.0);
        let mut file = zip_archive.by_index(i).map_err(|err| {
            Error::other_with_source("Failed to extract file from zip archive", err)
        })?;
        let outpath = Path::new(output_dir).join(file.name());

        if file.is_dir() {
            create_directory(&outpath)?;
        } else {
            let mut outfile =
                fs::File::create(&outpath).map_err(|err| Error::file_access(&outpath, err))?;
            std::io::copy(&mut file, &mut outfile)
                .map_err(|err| Error::file_write(&outpath, err))?;
        }
    }
    Ok(())
}

pub async fn download_json_file<T>(url: &str) -> Result<T>
where
    T: serde::de::DeserializeOwned,
    T: serde::ser::Serialize,
{
    let body_text = download_text_file(url).await?;

    let body: T =
        serde_json::from_str(&body_text).map_err(|err| Error::file_malformed(&url, err))?;

    Ok(body)
}

pub fn get_image_data(absolute_path: &Path) -> Result<ImageResponse> {
    if !absolute_path.exists() {
        return Err(Error::file_missing(absolute_path));
    }

    let bytes = read_file_bytes(absolute_path)?;

    let extension = absolute_path
        .extension()
        .ok_or(Error::other("Image format not supported (no extension)"))?;

    let extension_lower = extension.to_string_lossy().to_lowercase();

    if extension_lower != "png"
        && extension_lower != "gif"
        && extension_lower != "jpg"
        && extension_lower != "jpeg"
    {
        return Err(Error::other(&format!(
            "Image format not supported: {extension_lower}"
        )));
    }

    let response = ImageResponse {
        base64: general_purpose::STANDARD.encode(bytes),
        extension: extension_lower,
    };

    Ok(response)
}

pub fn delete_directory(directory_path: &Path) -> Result<()> {
    if !directory_path.exists() {
        return Err(Error::file_missing(directory_path));
    }

    fs::remove_dir_all(directory_path)
        .map_err(|err| Error::other_with_source("Failed to delete directory", err))
}

pub fn open_directory(directory_path: &Path) -> Result<()> {
    if let Err(err) = Command::new("open").arg(directory_path).spawn() {
        Err(Error::other_with_source(
            "Failed to open directory in file browser",
            err,
        ))
    } else {
        Ok(())
    }
}

pub fn show_error_dialog(_app: &tauri::App, message: impl Into<String>, title: impl Into<String>) {
    _app.dialog()
        .message(message)
        .title(title)
        .kind(MessageDialogKind::Error)
        .blocking_show();

    #[cfg(target_os = "linux")]
    dialog::Message::new(message)
        .title(title)
        .show()
        .expect("Could not display dialog box");
}
