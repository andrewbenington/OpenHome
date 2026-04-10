use std::{
    fs,
    path::{Path, PathBuf},
};

use tauri::Emitter;

use crate::{
    data_controller::{DataController, DataDir},
    error::{Error, Result},
    util::{self, ImageResponse},
};

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct PluginMetadata {
    pub id: String,
    pub name: String,
    pub version: String,
    pub api_version: u32,
}

impl PluginMetadata {
    pub fn with_icon_bytes(self, path: &Path) -> PluginMetadataWithIcon {
        PluginMetadataWithIcon {
            id: self.id,
            name: self.name,
            version: self.version,
            api_version: self.api_version,
            icon_image: util::get_image_data(path).ok(),
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct PluginMetadataWithIcon {
    pub id: String,
    pub name: String,
    pub version: String,
    pub api_version: u32,
    pub icon_image: Option<ImageResponse>,
}

pub fn list_downloaded_plugins(
    data_controller: &impl DataController,
) -> Result<Vec<PluginMetadataWithIcon>> {
    let plugins_path = data_controller.absolute_dir_path(DataDir::Plugins)?;
    if !plugins_path.exists() {
        return Ok(Vec::new());
    }

    let plugin_dir_entries =
        fs::read_dir(&plugins_path).map_err(|err| Error::file_access(&plugins_path, err))?;

    let mut plugins: Vec<PluginMetadataWithIcon> = vec![];

    for dir_entry in plugin_dir_entries.flatten() {
        if !dir_entry.path().is_dir() {
            continue;
        }

        let plugin_dir_name = PathBuf::from(dir_entry.file_name());
        let metadata_r: Result<PluginMetadata> =
            data_controller.read_file_json(DataDir::Plugins, plugin_dir_name.join("plugin.json"));

        match metadata_r {
            Err(err) => eprintln!("Broken plugin entry: {err}"),
            Ok(metadata) => {
                plugins.push(metadata.with_icon_bytes(&dir_entry.path().join("icon.png")))
            }
        }
    }

    Ok(plugins)
}

fn emit_download_progress(app_handle: &tauri::AppHandle, plugin_id: String, progress: f64) {
    let result = app_handle.emit(
        format!("plugin:download-progress:{plugin_id}").as_str(),
        progress,
    );
    if let Err(err) = result {
        eprintln!("error emitting download progress: {}", err)
    }
}

async fn download_to_file(url: &str, dest: &Path) -> Result<()> {
    let body = util::download_binary_file(url)
        .await
        .map_err(|e| Error::file_download(url, e))?;

    util::write_file_contents(dest, body)
}

const ASSETS_PCT: f64 = 80.0;

pub async fn download_async(
    app_handle: tauri::AppHandle,
    remote_url: String,
    plugin_metadata: PluginMetadata,
) -> Result<String> {
    let new_plugin_dir = app_handle.absolute_path(DataDir::Plugins, &plugin_metadata.id)?;

    let dist_dir = new_plugin_dir.join("dist");
    util::create_directory(&dist_dir)?;

    let plugin_json_path = new_plugin_dir.join("plugin.json");
    download_to_file(&format!("{remote_url}/plugin.json"), &plugin_json_path).await?;

    let index_js_body = util::download_text_file(&format!("{remote_url}/dist/index.js")).await?;
    let index_js_path = new_plugin_dir.join("dist").join("index.js");
    util::write_file_contents(index_js_path, &index_js_body)?;

    emit_download_progress(&app_handle, plugin_metadata.id.clone(), 10.0);

    let zip_file_url = format!("{}/assets.zip", remote_url);

    // Decompress assets directory
    util::download_extract_zip_file(&zip_file_url, &new_plugin_dir.join("assets"), |pct| {
        let overall_pct = 10.0 + ((pct / 100.0) * ASSETS_PCT);
        emit_download_progress(&app_handle, plugin_metadata.id.clone(), overall_pct)
    })
    .await
    .map_err(|err| Error::other_with_source("Could not extract assets.zip", err))?;

    emit_download_progress(&app_handle, plugin_metadata.id.clone(), 10.0 + ASSETS_PCT);

    download_to_file(
        &format!("{}/icon.png", remote_url),
        &new_plugin_dir.join("icon.png"),
    )
    .await?;

    emit_download_progress(&app_handle, plugin_metadata.id.clone(), 100.0);

    Ok(index_js_body)
}
