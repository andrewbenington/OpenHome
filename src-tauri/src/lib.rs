mod commands;
mod error;
mod menu;
mod plugin;
mod saves;
mod state;
mod util;
mod versioning;

use std::{
    env,
    path::{Path, PathBuf},
};

use tauri::{App, Manager};

use crate::error::{OpenHomeError, OpenHomeResult};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let handle = app.handle();
            initialize_appdata(handle)?;

            let result = set_theme_from_settings(app);
            if let Err(error) = result {
                eprintln!("{}", error)
            }

            match menu::create_menu(app) {
                Ok(menu) => {
                    let _ = app.set_menu(menu);
                    Ok(())
                }
                Err(e) => {
                    eprintln!("Error creating menu: {}", e);
                    Err(e)
                }
            }
        })
        .on_menu_event(|app_handle, event| {
            menu::handle_menu_event(app_handle, event);
        })
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(state::AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::get_state,
            commands::get_file_bytes,
            commands::get_file_created,
            commands::get_image_data,
            commands::get_storage_file_json,
            commands::write_storage_file_json,
            commands::write_file_bytes,
            commands::write_storage_file_bytes,
            commands::get_ohpkm_files,
            commands::delete_storage_files,
            commands::start_transaction,
            commands::rollback_transaction,
            commands::commit_transaction,
            commands::find_suggested_saves,
            commands::set_app_theme,
            commands::validate_recent_saves,
            commands::download_plugin,
            commands::list_installed_plugins,
            commands::load_plugin_code,
            commands::delete_plugin,
            commands::handle_windows_accellerator,
            commands::open_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn initialize_appdata(app_handle: &tauri::AppHandle) -> OpenHomeResult<()> {
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
