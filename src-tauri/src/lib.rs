mod commands;
mod menu;
mod plugin;
mod saves;
mod state;
mod util;

use std::{
    env,
    fs::{self, create_dir_all},
    path::{Path, PathBuf},
    sync::Mutex,
};

use tauri::{App, Manager};

use crate::state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let handle = app.handle();
            init_files(handle)?;

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
        .manage(AppState::default())
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

fn init_files(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let obj_files = [
        "gen12_lookup.json",
        "gen345_lookup.json",
        "recent_saves.json",
    ];

    for obj_file in obj_files {
        init_storage_json_file(app_handle, obj_file.into(), false)
            .map_err(|e| format!("Could not initialize {}: {}", obj_file, e))?;
    }

    let arr_files = ["box-data.json", "box-names.json", "save-folders.json"];

    for arr_file in arr_files {
        init_storage_json_file(app_handle, arr_file.into(), true)
            .map_err(|e| format!("Could not initialize {}: {}", arr_file, e))?;
    }

    let mon_path = util::prepend_appdata_storage_to_path(app_handle, &PathBuf::from("mons"))?;
    create_dir_all(&mon_path).map_err(|e| e.to_string())
}

fn init_storage_json_file(
    app_handle: &tauri::AppHandle,
    relative_path: PathBuf,
    is_array: bool,
) -> Result<(), String> {
    let absolute_path = util::prepend_appdata_storage_to_path(app_handle, &relative_path)?;
    if !Path::new(&absolute_path).exists() {
        util::create_openhome_directory(app_handle)
            .map_err(|e| format!("create OpenHome directory: {}", e))?;

        let contents = match is_array {
            true => b"[]",
            false => b"{}",
        };

        fs::write(&absolute_path, contents)
            .map_err(|e| format!("initialize file {}: {}", absolute_path.to_string_lossy(), e))?;
    }
    Ok(())
}

fn set_theme_from_settings(app: &App) -> Result<(), String> {
    let settings_json: serde_json::Value =
        util::get_storage_file_json(app.app_handle(), &PathBuf::from("settings.json"))
            .map_err(|e| format!("error getting settings: {e}"))?;

    let app_theme = settings_json["appTheme"]
        .as_str()
        .ok_or("No appTheme in settings.json")?;

    let theme_option = match app_theme {
        "dark" => Some(tauri::Theme::Dark),
        "light" => Some(tauri::Theme::Light),
        "system" => None::<tauri::Theme>,
        _ => return Err(format!("Unknown app theme: {app_theme}")),
    };

    app.get_webview_window("main")
        .ok_or("Main window not found")?
        .set_theme(theme_option)
        .map_err(|e| e.to_string())
}
