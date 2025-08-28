mod commands;
mod deprecated;
mod error;
mod menu;
mod pkm_storage;
mod plugin;
mod saves;
mod startup;
mod state;
mod util;
mod versioning;

use std::env;
use tauri::Manager;
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if let Err(launch_error) = startup::run_app_startup(app) {
                app.dialog()
                    .message(launch_error.to_string())
                    .title("OpenHome Failed to Launch")
                    .kind(MessageDialogKind::Error)
                    .blocking_show();
                app.handle().exit(1);
            }

            // let banks = match pkm_storage::load_banks(app.handle()) {
            //     Ok(banks) => banks,
            //     Err(err) => {
            //         app.dialog()
            //             .message(err.to_string())
            //             .title("OpenHome Failed to Launch")
            //             .kind(MessageDialogKind::Error)
            //             .blocking_show();
            //         app.handle().exit(1);
            //         unreachable!()
            //     }
            // };

            let lookup_state = match state::LookupState::load_from_storage(app.handle()) {
                Ok(lookup) => lookup,
                Err(err) => {
                    app.dialog()
                        .message(err.to_string())
                        .title("OpenHome Failed to Launch")
                        .kind(MessageDialogKind::Error)
                        .blocking_show();
                    app.handle().exit(1);
                    unreachable!()
                }
            };

            app.manage(state::AppState::default());
            app.manage(lookup_state);

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
            state::get_lookups,
            state::update_lookups,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
