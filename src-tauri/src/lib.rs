mod commands;
mod menu;
mod saves;
mod state;
mod util;

use std::{
    env,
    fs::{create_dir_all, File},
    io::Write,
    path::{Path, PathBuf},
};

use tauri::{App, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let handle = app.handle();
            init_files(handle)?;

            let result = set_theme_from_settings(&app);
            if let Err(error) = result {
                eprintln!("{}", error)
            }

            match menu::create_menu(&app) {
                Ok(menu) => {
                    let _ = app.set_menu(menu);
                    Ok(())
                }
                Err(e) => {
                    eprintln!("Error creating menu: {}", e);
                    Err(e.into())
                }
            }
        })
        .on_menu_event(|app_handle, event| {
            menu::handle_menu_event(&app_handle, event);
        })
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(state::AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::get_state,
            commands::get_file_bytes,
            commands::get_file_created,
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn init_files(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let obj_files = vec![
        "gen12_lookup.json",
        "gen345_lookup.json",
        "recent_saves.json",
    ];

    for obj_file in obj_files {
        let result = init_storage_json_file(app_handle, obj_file.into(), false);
        if let Err(err) = result {
            return Err(format!("Could not initialize {}: {}", obj_file, err));
        }
    }

    let arr_files = vec!["box-data.json", "box-names.json", "save-folders.json"];

    for arr_file in arr_files {
        let result = init_storage_json_file(app_handle, arr_file.into(), true);
        if let Err(err) = result {
            return Err(format!("Could not initialize {}: {}", arr_file, err));
        }
    }

    let mon_path = util::prepend_appdata_storage_to_path(app_handle, &"mons".into())?;
    return create_dir_all(&mon_path).map_err(|e| e.to_string());
}

fn init_storage_json_file(
    app_handle: &tauri::AppHandle,
    relative_path: PathBuf,
    is_array: bool,
) -> Result<(), String> {
    let absolute_path = util::prepend_appdata_storage_to_path(app_handle, &relative_path)?;
    if !Path::new(&absolute_path).exists() {
        util::create_openhome_directory(app_handle)?;
        let mut file = File::create(&absolute_path).map_err(|e| e.to_string())?;
        if is_array {
            file.write_all(b"[]").map_err(|e| e.to_string())?;
        } else {
            file.write_all(b"{}").map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

fn set_theme_from_settings(app: &App) -> Result<(), String> {
    let settings_result =
        util::get_storage_file_json(app.app_handle(), &"settings.json".to_string().into());
    if let Err(error) = settings_result {
        return Err(format!("Error getting settings: {}", error));
    }

    let settings_json = settings_result.unwrap();

    let theme_option: Option<tauri::Theme>;
    if let Some(string_value) = settings_json["appTheme"].as_str() {
        if string_value == "dark" {
            theme_option = Some(tauri::Theme::Dark);
        } else if string_value == "light" {
            theme_option = Some(tauri::Theme::Light);
        } else if string_value == "system" {
            theme_option = None::<tauri::Theme>;
        } else {
            return Err(format!("Unknown app theme: {}", string_value));
        }
    } else {
        return Err("No appTheme in settings.json".to_string());
    }

    let main_window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    return main_window
        .set_theme(theme_option)
        .map_err(|e| e.to_string());
}
