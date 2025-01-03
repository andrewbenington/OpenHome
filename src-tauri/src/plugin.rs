use std::{
    fs::{self, File},
    io::Write,
    path::{Path, PathBuf},
};

use tauri::Emitter;

use crate::util::{self, ImageResponse};

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct PluginMetadata {
    pub id: String,
    pub name: String,
    pub version: String,
    pub api_version: u32,
}

impl PluginMetadata {
    pub fn with_icon_bytes(self, path: &Path) -> PluginMetadataWithIcon {
        return PluginMetadataWithIcon {
            id: self.id,
            name: self.name,
            version: self.version,
            api_version: self.api_version,
            icon_image: util::get_image_data(path).ok(),
        };
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

        let metadata_r: Result<PluginMetadata, serde_json::Error> =
            serde_json::from_reader(file_r.unwrap());

        match metadata_r {
            Err(err) => eprintln!("Broken plugin entry: {}", err),
            Ok(metadata) => {
                plugins.push(metadata.with_icon_bytes(&plugin_dir_path.join("icon.png")))
            }
        }
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

async fn download_to_file(source: &str, dest: &Path) -> Result<(), String> {
    let body = util::download_binary_file(source)
        .await
        .map_err(|err| format!("download {:?}: {}", dest, err))?;

    File::create(dest)
        .map_err(|err| format!("create {:?}: {}", dest, err))
        .and_then(|mut f| {
            f.write(&body)
                .map_err(|err| format!("write {:?}: {}", dest, err))
        })?;

    return Ok(());
}

const ASSETS_PCT: f64 = 80.0;

pub async fn download_async(
    app_handle: tauri::AppHandle,
    remote_url: String,
    plugin_metadata: PluginMetadata,
) -> Result<String, String> {
    let new_plugin_dir =
        util::prepend_appdata_to_path(&app_handle, &Path::new("plugins").join(&plugin_metadata.id))
            .map_err(|err| format!("get plugins directory: {}", err))?;

    fs::create_dir_all(&new_plugin_dir.join("dist"))
        .map_err(|err| format!("create plugin directory: {}", err))?;

    download_to_file(
        &format!("{}/plugin.json", remote_url),
        &new_plugin_dir.join("plugin.json"),
    )
    .await?;

    let index_js_body = util::download_text_file(format!("{}/dist/index.js", remote_url))
        .await
        .map_err(|err| format!("download index.js file: {}", err))?;

    File::create(&new_plugin_dir.join("dist").join("index.js"))
        .map_err(|err| format!("create index.js file: {}", err))
        .and_then(|mut f| {
            write!(f, "{}", index_js_body).map_err(|err| format!("write index.js file: {}", err))
        })?;
    emit_download_progress(&app_handle, plugin_metadata.id.clone(), 10.0);

    let zip_file_url = format!("{}/assets.zip", remote_url);

    // Decompress assets directory
    util::download_extract_zip_file(&zip_file_url, &new_plugin_dir.join("assets"), |pct| {
        emit_download_progress(
            &app_handle,
            plugin_metadata.id.clone(),
            10.0 + ((pct / 100.0) * ASSETS_PCT),
        )
    })
    .await
    .map_err(|err| format!("extract assets.zip: {}", err))?;

    emit_download_progress(&app_handle, plugin_metadata.id.clone(), 10.0 + ASSETS_PCT);

    download_to_file(
        &format!("{}/icon.png", remote_url),
        &new_plugin_dir.join("icon.png"),
    )
    .await?;

    emit_download_progress(&app_handle, plugin_metadata.id.clone(), 100.0);

    return Ok(index_js_body);
}
