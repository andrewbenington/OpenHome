use base64::engine::general_purpose;
use base64::Engine;
use std::fs;
use std::fs::{create_dir_all, File};
use std::hash::{Hash, Hasher};
use std::io::Cursor;
use std::path::Path;
use std::{collections::HashSet, io::Read, path::PathBuf};
use tauri::Manager;
use zip::ZipArchive;

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
        .to_string();
    let ext = path
        .extension()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
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

pub fn prepend_appdata_to_path(
    app_handle: &tauri::AppHandle,
    path: &PathBuf,
) -> Result<PathBuf, String> {
    app_handle
        .path()
        .app_data_dir()
        .map(|appdata| appdata.join(path))
        .map_err(|e| format!("get appdata dir: {e}"))
}

pub fn prepend_appdata_storage_to_path(
    app_handle: &tauri::AppHandle,
    path: &Path,
) -> Result<PathBuf, String> {
    prepend_appdata_to_path(app_handle, &PathBuf::from("storage").join(path))
}

pub fn get_appdata_file_text(
    app_handle: &tauri::AppHandle,
    relative_path: &PathBuf,
) -> Result<String, String> {
    let full_path = prepend_appdata_to_path(app_handle, relative_path)?;

    // Open the file, and return any error up the call stack
    let mut file = File::open(full_path).map_err(|e| e.to_string())?;

    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| e.to_string())?;

    Ok(contents)
}

pub fn get_storage_file_text(
    app_handle: &tauri::AppHandle,
    relative_path: &Path,
) -> Result<String, String> {
    let full_path = prepend_appdata_storage_to_path(app_handle, relative_path)?;
    fs::read_to_string(full_path).map_err(|e| e.to_string())
}

pub fn get_storage_file_json<T>(
    app_handle: &tauri::AppHandle,
    relative_path: &Path,
) -> Result<T, String>
where
    T: serde::de::DeserializeOwned,
{
    let json_str = get_storage_file_text(app_handle, relative_path)
        .map_err(|e| format!("error reading {}: {e}", relative_path.to_string_lossy()))?;
    serde_json::from_str(json_str.as_str())
        .map_err(|e| format!("error parsing {}: {e}", relative_path.to_string_lossy()))
}

pub fn get_appdata_dir(app_handle: &tauri::AppHandle) -> Result<String, String> {
    let path_buf = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    Ok(path_buf.to_string_lossy().into_owned())
}

pub fn dedupe_paths(paths: Vec<PathData>) -> Vec<PathData> {
    let set: HashSet<PathData> = paths.into_iter().collect();
    set.into_iter().collect()
}

pub fn create_openhome_directory(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let appdata_dir = get_appdata_dir(app_handle)?;
    let full_path = PathBuf::from(appdata_dir).join("storage");

    create_dir_all(full_path).map_err(|e| e.to_string())
}

pub async fn download_text_file(url: String) -> Result<String, Box<dyn std::error::Error>> {
    let response = reqwest::Client::new().get(url).send().await?;
    Ok(response.text().await?)
}

pub async fn download_binary_file(url: &str) -> Result<bytes::Bytes, Box<dyn std::error::Error>> {
    let response = reqwest::Client::new().get(url).send().await?;
    Ok(response.bytes().await?)
}

pub async fn download_extract_zip_file<F>(
    url: &str,
    output_dir: &Path,
    progress_callback: F,
) -> Result<(), Box<dyn std::error::Error>>
where
    F: Fn(f64),
{
    let bytes = download_binary_file(url).await?;

    let mut zip = ZipArchive::new(Cursor::new(bytes))?;
    let file_count = zip.len();

    fs::create_dir_all(output_dir)?;

    for i in 0..file_count {
        progress_callback(50.0 + (i as f64 / file_count as f64) * 50.0);
        let mut file = zip.by_index(i)?;
        let outpath = Path::new(output_dir).join(file.name());

        if file.is_dir() {
            fs::create_dir_all(&outpath)?;
        } else {
            let mut outfile = fs::File::create(&outpath)?;
            std::io::copy(&mut file, &mut outfile)?;
        }
    }
    Ok(())
}

pub async fn download_json_file<T>(url: String) -> Result<T, Box<dyn std::error::Error>>
where
    T: serde::de::DeserializeOwned,
    T: serde::ser::Serialize,
{
    let body_text = download_text_file(url).await?;

    let body: T = serde_json::from_str(&body_text)?;

    Ok(body)
}

pub fn get_image_data(absolute_path: &Path) -> Result<ImageResponse, String> {
    if !absolute_path.exists() {
        return Err(format!("File does not exist: {:?}", absolute_path));
    }

    let mut file = File::open(absolute_path).map_err(|e| e.to_string())?;

    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes).map_err(|e| e.to_string())?;

    let extension = absolute_path
        .extension()
        .ok_or("Image format not supported")?;

    let extension_lower = extension.to_string_lossy().to_lowercase();

    if extension_lower != "png"
        && extension_lower != "gif"
        && extension_lower != "jpg"
        && extension_lower != "jpeg"
    {
        return Err(format!("Image format not supported: {}", extension_lower));
    }

    let response = ImageResponse {
        base64: general_purpose::STANDARD.encode(bytes),
        extension: extension_lower,
    };

    Ok(response)
}

pub fn delete_folder(folder_path: &Path) -> Result<(), String> {
    if !folder_path.exists() {
        return Err(format!(
            "Folder does not exist: {}",
            folder_path.to_string_lossy()
        ));
    }

    fs::remove_dir_all(folder_path).map_err(|err| {
        format!(
            "Failed to delete the folder located at {}: {}",
            folder_path.to_string_lossy(),
            err
        )
    })
}
