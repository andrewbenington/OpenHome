use std::path::{Path, PathBuf};

use tauri::{App, Manager};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

use crate::{
    error::{OpenHomeError, OpenHomeResult},
    util, versioning,
};

pub fn run_app_startup(app: &App) -> OpenHomeResult<()> {
    let handle = app.handle();

    if let Err(error) = versioning::handle_version_migration(handle, false) {
        match error {
            OpenHomeError::OutdatedVersion { .. } => {
                let should_quit = app
                    .dialog()
                    .message(error.to_string())
                    .title("OpenHome Version Error")
                    .kind(MessageDialogKind::Error)
                    .buttons(MessageDialogButtons::OkCancelCustom(
                        "Quit".to_owned(),
                        "Launch App Anyways".to_owned(),
                    ))
                    .blocking_show();

                if should_quit {
                    return Err(error);
                }
                versioning::handle_version_migration(handle, true)?;
            }
            other => return Err(other),
        }
    }

    versioning::update_version_last_used(handle)?;
    initialize_storage(handle)?;

    let result = set_theme_from_settings(app);
    if let Err(error) = result {
        eprintln!("{}", error)
    }

    Ok(())
}

fn initialize_storage(app_handle: &tauri::AppHandle) -> OpenHomeResult<()> {
    let storage_path = util::get_storage_path(app_handle)?;
    util::create_directory(&storage_path)?;

    let obj_files = [
        "gen12_lookup.json",
        "gen345_lookup.json",
        "recent_saves.json",
    ];

    for obj_file in obj_files {
        init_storage_json_file(app_handle, obj_file.into(), false)?;
    }

    let arr_files = ["box-data.json", "box-names.json", "save-folders.json"];

    for arr_file in arr_files {
        init_storage_json_file(app_handle, arr_file.into(), true)?;
    }

    let mons_path = util::get_appdata_dir(app_handle)?.join("mons");
    util::create_directory(&mons_path)
}

fn init_storage_json_file(
    app_handle: &tauri::AppHandle,
    relative_path: PathBuf,
    is_array: bool,
) -> OpenHomeResult<()> {
    let absolute_path = util::prepend_appdata_storage_to_path(app_handle, &relative_path)?;
    if !Path::new(&absolute_path).exists() {
        let contents = match is_array {
            true => b"[]",
            false => b"{}",
        };

        util::write_file_contents(absolute_path, contents)?;
    }
    Ok(())
}

fn set_theme_from_settings(app: &App) -> OpenHomeResult<()> {
    let settings_json: serde_json::Value =
        util::get_storage_file_json(app.app_handle(), "settings.json")?;

    let app_theme = settings_json["appTheme"].as_str().unwrap_or("light");

    let theme_option = match app_theme {
        "dark" => Some(tauri::Theme::Dark),
        "light" => Some(tauri::Theme::Light),
        "system" => None::<tauri::Theme>,
        _ => Some(tauri::Theme::Light),
    };

    app.get_webview_window("main")
        .ok_or(OpenHomeError::WindowAccess { source: None })?
        .set_theme(theme_option)
        .map_err(|e| OpenHomeError::other_with_source("Could not set theme", e))
}
