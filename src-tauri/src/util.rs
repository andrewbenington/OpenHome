use base64::engine::general_purpose;
use base64::Engine;
use reqwest;
use serde;
use std::fs;
use std::fs::{create_dir_all, File};
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

pub fn parse_path_data(path: &PathBuf) -> PathData {
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
        .unwrap_or_else(|| String::new());
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
    let appdata_dir = get_appdata_dir(app_handle)?;
    let full_path = Path::new(&appdata_dir).join(path);

    return Ok(full_path);
}

pub fn prepend_appdata_storage_to_path(
    app_handle: &tauri::AppHandle,
    path: &PathBuf,
) -> Result<PathBuf, String> {
    let appdata_dir = get_appdata_dir(app_handle)?;
    let mut full_path = PathBuf::new();

    full_path.push(&appdata_dir);
    full_path.push("storage".to_owned());
    full_path.push(path);
    return Ok(full_path);
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

    return Ok(contents);
}

pub fn get_storage_file_text(
    app_handle: &tauri::AppHandle,
    relative_path: &PathBuf,
) -> Result<String, String> {
    let full_path = prepend_appdata_storage_to_path(app_handle, relative_path)?;

    // Open the file, and return any error up the call stack
    let mut file = File::open(full_path).map_err(|e| e.to_string())?;

    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| e.to_string())?;

    return Ok(contents);
}

pub fn get_storage_file_json<T>(
    app_handle: &tauri::AppHandle,
    relative_path: &PathBuf,
) -> Result<T, String>
where
    T: serde::de::DeserializeOwned,
{
    let json_str = get_storage_file_text(app_handle, relative_path)?;
    return serde_json::from_str(json_str.as_str())
        .map_err(|e| format!("error opening {:#?}: {e}", relative_path));
}

pub fn get_appdata_dir(app_handle: &tauri::AppHandle) -> Result<String, String> {
    // Open the file, and return any error up the call stack
    let path_buf_o = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    return match path_buf_o.to_str() {
        Some(path_buf) => Ok(path_buf.to_owned()),
        None => Err("Invalid appdata path".to_owned()),
    };
}

pub fn dedupe_paths(paths: Vec<PathData>) -> Vec<PathData> {
    let mut seen = HashSet::new();
    paths
        .into_iter()
        .filter(|path| seen.insert(path.raw.clone()))
        .collect()
}

pub fn create_openhome_directory(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let appdata_dir = get_appdata_dir(app_handle)?;
    let mut full_path = PathBuf::new();

    full_path.push(appdata_dir);
    full_path.push("storage".to_owned());

    create_dir_all(full_path).map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn download_text_file(url: String) -> Result<String, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();

    return Ok(client
        .get(url)
        .header("User-Agent", "OpenHome")
        .send()
        .await?
        .text()
        .await?);
}

pub async fn download_binary_file(url: &str) -> Result<bytes::Bytes, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let response = client
        .get(url)
        .header("User-Agent", "OpenHome")
        .send()
        .await?;

    return Ok(response.bytes().await?);
}

pub async fn download_extract_zip_file<F>(
    url: &str,
    output_dir: &str,
    progress_callback: F,
) -> Result<(), Box<dyn std::error::Error>>
where
    F: Fn(f64) -> (),
{
    let client = reqwest::Client::new();
    let response = client
        .get(url)
        .header("User-Agent", "OpenHome")
        .send()
        .await?;

    let bytes = response.bytes().await?; // Read the entire body as bytes
    let cursor = Cursor::new(bytes); // Create an in-memory cursor
    let mut zip = ZipArchive::new(cursor)?;
    let file_count = zip.len();

    for i in 0..file_count {
        progress_callback(50.0 + (i as f64 / file_count as f64) * 50.0);
        let mut file = zip.by_index(i)?; // Get file by index
        let outpath = Path::new(output_dir).join(file.name());

        if file.is_dir() {
            fs::create_dir_all(&outpath)?;
        } else {
            if let Some(parent) = outpath.parent() {
                fs::create_dir_all(parent)?;
            }
            let mut outfile = fs::File::create(&outpath)?;
            std::io::copy(&mut file, &mut outfile)?;
        }
    }
    return Ok(());
}

pub async fn download_json_file<T>(url: String) -> Result<T, Box<dyn std::error::Error>>
where
    T: serde::de::DeserializeOwned,
    T: serde::ser::Serialize,
{
    let client = reqwest::Client::new();

    let response = client
        .get(url)
        .header("User-Agent", "OpenHome")
        .send()
        .await?;

    let body_text = response.text().await?;
    println!("body text: {}", body_text);

    let body: T = serde_json::from_str(&body_text)?;
    println!(
        "body json: {}",
        serde_json::to_string_pretty(&body)
            .unwrap_or_else(|err| format!("deserialize metadata: {}", err))
    );

    return Ok(body);
}

pub fn get_image_data(absolute_path: &String) -> Result<ImageResponse, String> {
    let absolute_path_pb = PathBuf::from(&absolute_path);

    // Make sure folder exists
    if !absolute_path_pb.exists() {
        return Err(format!("File does not exist: {}", absolute_path));
    }

    let mut file = File::open(&absolute_path).map_err(|e| e.to_string())?;

    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes).map_err(|e| e.to_string())?;

    let extension = absolute_path_pb.extension();
    if extension.is_none() {
        return Err("Image format not supported".to_owned());
    }

    let extension_lower = extension.unwrap().to_string_lossy().to_lowercase();

    if extension_lower != "png"
        && extension_lower != "gif"
        && extension_lower != "jpg"
        && extension_lower != "jpeg"
    {
        return Err(format!("Image format not supported: {}", extension_lower).to_owned());
    }

    let response = ImageResponse {
        base64: general_purpose::STANDARD.encode(bytes),
        extension: extension_lower,
    };

    return Ok(response);
}
