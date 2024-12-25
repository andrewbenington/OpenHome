use std::{
    collections::HashMap,
    fs::{self, File},
    path::PathBuf,
};

use crate::util::{self, ImageResponse};

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct PluginMetadata {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub assets: HashMap<String, String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct PluginMetadataWithIcon {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub assets: HashMap<String, String>,
    pub icon_image: Option<ImageResponse>,
}

pub fn list_plugins(
    app_handle: &tauri::AppHandle,
) -> Result<Vec<PluginMetadataWithIcon>, Box<dyn std::error::Error>> {
    let plugins_path = util::prepend_appdata_to_path(&app_handle, &PathBuf::from("plugins"))
        .map_err(|e| format!("Error building plugin path: {}", e))?;

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

        let image_response_r = util::get_image_data(
            plugin_dir_path
                .join(&metadata.icon)
                .to_string_lossy()
                .to_string(),
        );

        if let Err(err) = image_response_r {
            eprintln!(
                "Bad image response for {}: {}",
                plugin_dir_path
                    .join(&metadata.icon)
                    .to_string_lossy()
                    .to_string(),
                err
            );

            let metadata_with_icon = PluginMetadataWithIcon {
                id: metadata.id,
                name: metadata.name,
                icon: metadata.icon,
                assets: metadata.assets,
                icon_image: None,
            };

            plugins.push(metadata_with_icon);
            continue;
        }

        let metadata_with_icon = PluginMetadataWithIcon {
            id: metadata.id,
            name: metadata.name,
            icon: metadata.icon,
            assets: metadata.assets,
            icon_image: image_response_r.ok(),
        };

        plugins.push(metadata_with_icon);
    }

    return Ok(plugins);
}
