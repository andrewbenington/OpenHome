use std::{
    fs::{self, File},
    io::Write,
    path::PathBuf,
};

use tauri::Emitter;

use crate::util::{self, ImageResponse};

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct PluginMetadata {
    pub id: String,
    pub name: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct PluginMetadataWithIcon {
    pub id: String,
    pub name: String,
    pub icon_image: Option<ImageResponse>,
}

pub fn list_plugins(
    app_handle: &tauri::AppHandle,
) -> Result<Vec<PluginMetadataWithIcon>, Box<dyn std::error::Error>> {
    let plugins_path = util::prepend_appdata_to_path(&app_handle, &PathBuf::from("plugins"))
        .map_err(|e| format!("Error building plugin path: {}", e))?;

    if !plugins_path.exists() {
        return Ok(vec![]);
    }

    let plugin_dirs = fs::read_dir(&plugins_path).map_err(|e| {
        format!(
            "Error reading directory {}: {}",
            plugins_path.to_string_lossy().to_string(),
            e
        )
    })?;

    let mut plugins: Vec<PluginMetadataWithIcon> = vec![];

    for plugin_dir_r in plugin_dirs {
        if let Err(err) = plugin_dir_r {
            eprintln!("Broken plugin entry: {}", err);
            continue;
        }

        let plugin_dir_path = plugin_dir_r.unwrap().path();

        if !plugin_dir_path.is_dir() {
            continue;
        }

        let file_r = File::open(plugin_dir_path.clone().join("plugin.json"));

        if let Err(err) = file_r {
            eprintln!(
                "Error opening plugin {}: {}",
                plugin_dir_path.to_string_lossy().to_string(),
                err
            );
            continue;
        }

        let metadata: PluginMetadata = serde_json::from_reader(file_r.unwrap())?;

        let icon_path = plugin_dir_path
            .join("icon.png")
            .to_string_lossy()
            .to_string();
        let image_response_r = util::get_image_data(&icon_path);

        if let Err(err) = image_response_r {
            eprintln!("Bad image response for {}: {}", &icon_path, err);

            let metadata_with_icon = PluginMetadataWithIcon {
                id: metadata.id,
                name: metadata.name,
                icon_image: None,
            };

            plugins.push(metadata_with_icon);
            continue;
        }

        let metadata_with_icon = PluginMetadataWithIcon {
            id: metadata.id,
            name: metadata.name,
            icon_image: image_response_r.ok(),
        };

        plugins.push(metadata_with_icon);
    }

    return Ok(plugins);
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct DownloadProgress {
    pub plugin_id: String,
    pub progress: usize,
}

fn emit_download_progress(app_handle: &tauri::AppHandle, plugin_id: String, progress: f64) {
    let result = app_handle.emit(
        format!("plugin:download-progress:{}", plugin_id).as_str(),
        progress,
    );
    if let Err(err) = result {
        eprintln!("error emitting download progress: {}", err)
    }
}

const ASSETS_PCT: f64 = 80.0;

pub async fn download_async(
    app_handle: tauri::AppHandle,
    remote_url: String,
    plugin_metadata: PluginMetadata,
) -> Result<String, String> {
    let plugins_dir = util::prepend_appdata_to_path(&app_handle, &PathBuf::from("plugins"))
        .map_err(|err| format!("get plugins directory: {}", err))?;

    let new_plugin_dir = plugins_dir.join(plugin_metadata.id.clone());
    let dist_dir = new_plugin_dir.join("dist");
    fs::create_dir_all(&dist_dir).map_err(|err| format!("create plugin directory: {}", err))?;

    let metadata_path = new_plugin_dir.join("plugin.json");
    let index_js_path = dist_dir.join("index.js");
    let icon_path = new_plugin_dir.join("icon.png");

    let metadata_string = serde_json::to_string_pretty(&plugin_metadata)
        .map_err(|err| format!("download metadata: {}", err))?;

    let mut metadata_file =
        File::create(&metadata_path).map_err(|err| format!("create metadata file: {}", err))?;

    metadata_file
        .write(metadata_string.as_bytes())
        .map_err(|err| format!("write metadata file: {}", err))?;

    let index_js_url = format!("{}/dist/index.js", remote_url);
    let mut index_js_file =
        File::create(&index_js_path).map_err(|err| format!("create index.js file: {}", err))?;

    let index_js_body = util::download_text_file(index_js_url)
        .await
        .map_err(|err| format!("download index.js file: {}", err))?;
    emit_download_progress(&app_handle, plugin_metadata.id.clone(), 10.0);

    write!(index_js_file, "{}", index_js_body)
        .map_err(|err| format!("write index.js file: {}", err))?;

    let zip_file_url = format!("{}/assets.zip", remote_url);

    // Decompress assets directory
    let output_path = new_plugin_dir.join("assets");
    match output_path.to_str() {
        Some(output_dir) => util::download_extract_zip_file(&zip_file_url, output_dir, |pct| {
            emit_download_progress(
                &app_handle,
                plugin_metadata.id.clone(),
                10.0 + ((pct / 100.0) * ASSETS_PCT),
            )
        })
        .await
        .map_err(|err| format!("extract assets.zip: {}", err)),
        None => Err(format!(
            "could not get local assets directory path ({:?})",
            output_path
        )),
    }?;

    emit_download_progress(&app_handle, plugin_metadata.id.clone(), 10.0 + ASSETS_PCT);

    let icon_url = format!("{}/icon.png", remote_url);
    let icon_body = util::download_binary_file(&icon_url)
        .await
        .map_err(|err| format!("download icon file: {}", err))?;

    let mut icon_file =
        File::create(&icon_path).map_err(|err| format!("create icon file: {}", err))?;
    icon_file
        .write(&icon_body)
        .map_err(|err| format!("write icon file: {}", err))?;

    emit_download_progress(&app_handle, plugin_metadata.id.clone(), 100.0);

    return Ok(index_js_body);
}
