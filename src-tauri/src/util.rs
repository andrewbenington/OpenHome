use std::fs;
use std::io::Cursor;
use std::path::Path;
use std::process::Command;
use zip::ZipArchive;

use openhome_core::{Error, Result};

#[cfg(not(target_os = "linux"))]
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

pub fn write_file_contents<P, C>(path: P, contents: C) -> Result<()>
where
    P: AsRef<Path>,
    C: AsRef<[u8]>,
{
    fs::write(&path, contents).map_err(|err| Error::file_access(&path, err))
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

pub async fn download_text_file(url: &str) -> Result<String> {
    let response = reqwest::get(url)
        .await
        .map_err(|err| Error::file_download(url, err))?;

    response
        .text()
        .await
        .map_err(|err| Error::file_download(url, err))
}

pub async fn download_binary_file(url: &str) -> Result<bytes::Bytes> {
    let response = reqwest::get(url)
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

pub fn show_error_dialog(
    _app: &tauri::App,
    message: impl Into<String> + ToString,
    title: impl Into<String> + ToString,
) {
    #[cfg(not(target_os = "linux"))]
    _app.dialog()
        .message(message)
        .title(title)
        .kind(MessageDialogKind::Error)
        .blocking_show();

    #[cfg(target_os = "linux")]
    native_dialog::DialogBuilder::message()
        .set_level(native_dialog::MessageLevel::Error)
        .set_title(title)
        .set_text(message)
        .alert()
        .show()
        .expect("Could not display dialog box");
}
