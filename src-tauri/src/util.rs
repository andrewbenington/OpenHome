use reqwest::blocking::Client;
use serde;
use std::{
    collections::HashSet,
    fs::{self, create_dir_all, File},
    io::{self, Read, Write},
    path::{Path, PathBuf},
};
use tauri::Manager;
use zip::ZipArchive;

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

// pub fn download_images_from_github_folder(
//     folder_url: &str,
//     save_dir: &str,
// ) -> Result<(), Box<dyn std::error::Error>> {
//     let client = Client::new();

//     let response = client
//         .get(folder_url)
//         .header("User-Agent", "OpenHome")
//         .send()?
//         .text()?;

//     let files: serde_json::Value = serde_json::from_str(&response)?;
//     let file_urls = files
//         .as_array()
//         .unwrap()
//         .iter()
//         .filter_map(|file| file.get("download_url")?.as_str())
//         .filter(|url| url.ends_with(".png"));

//     fs::create_dir_all(save_dir)?;

//     for url in file_urls {
//         let parsed_url = Url::parse(url)?;
//         let image_name = parsed_url
//             .path_segments()
//             .and_then(|segments| segments.last())
//             .unwrap();

//         let response = client.get(url).send()?;
//         let mut file = fs::File::create(format!("{}/{}", save_dir, image_name))?;
//         file.write_all(&response.bytes()?)?;
//         println!("Downloaded: {}", image_name);
//     }

//     println!("All images downloaded successfully!");
//     Ok(())
// }

pub fn download_and_unpack_zip(
    zip_url: &str,
    save_dir: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Downloading zip file from: {}", zip_url);
    let response = Client::new()
        .get(zip_url)
        .header("User-Agent", "OpenHome")
        .send()?
        .bytes()?;

    let zip_path = format!("{}/temp_sprites.zip", save_dir);
    fs::create_dir_all(save_dir)?;
    let mut zip_file = File::create(&zip_path)?;
    zip_file.write_all(&response)?;

    println!("Zip saved to: {}. Unzipping now...", zip_path);

    let zip_file = File::open(&zip_path)?;
    let mut zip_archive = ZipArchive::new(zip_file)?;

    for i in 0..zip_archive.len() {
        let mut file = zip_archive.by_index(i)?;
        let out_path = Path::new(save_dir).join(file.name());

        if file.is_dir() {
            fs::create_dir_all(&out_path)?;
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent)?;
            }
            let mut out_file = File::create(&out_path)?;
            io::copy(&mut file, &mut out_file)?;
        }
        println!("Extracted: {}", out_path.display());
    }

    fs::remove_file(zip_path)?;

    println!("Expanded into {}", save_dir);

    Ok(())
}
