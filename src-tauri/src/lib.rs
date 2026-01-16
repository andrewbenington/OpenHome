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

use crate::{error::Error, state::synced_state::AllSyncedState};

#[cfg(target_os = "linux")]
use dialog::DialogBox;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let update_features_r = startup::run_app_startup(app);
            let Ok(update_features) = update_features_r else {
                let launch_error = update_features_r.unwrap_err();
                match launch_error {
                    Error::OutdatedVersion { .. } => app.handle().exit(1),
                    _ => {
                        #[cfg(not(target_os = "linux"))]
                        app.dialog()
                            .message(launch_error.to_string())
                            .title("OpenHome Failed to Launch")
                            .kind(MessageDialogKind::Error)
                            .blocking_show();

                        #[cfg(target_os = "linux")]
                        dialog::Message::new(launch_error.to_string())
                            .title("OpenHome Failed to Launch")
                            .show()
                            .expect("Could not display dialog box");

                        app.handle().exit(1);
                    }
                };
                std::process::exit(1);
            };

            let ohpkm_store = match state::OhpkmBytesStore::load_from_mons_v2(app.handle()) {
                Ok(state) => state,
                Err(err) => {
                    app.dialog()
                        .message(err.to_string())
                        .title("OpenHome Failed to Launch - OHPKM load error")
                        .kind(MessageDialogKind::Error)
                        .blocking_show();
                    app.handle().exit(1);
                    std::process::exit(1);
                }
            };

            let lookup_state = match state::LookupState::load_from_storage(app.handle()) {
                Ok(lookup) => lookup,
                Err(err) => {
                    #[cfg(not(target_os = "linux"))]
                    app.dialog()
                        .message(err.to_string())
                        .title("OpenHome Failed to Launch - Lookup File Error")
                        .kind(MessageDialogKind::Error)
                        .blocking_show();

                    #[cfg(target_os = "linux")]
                    dialog::Message::new(err.to_string())
                        .title("OpenHome Failed to Launch - Lookup File Error")
                        .show()
                        .expect("Could not display dialog box");

                    app.handle().exit(1);
                    std::process::exit(1);
                }
            };

            let synced_state = AllSyncedState::from_states(lookup_state, ohpkm_store);
            app.manage(synced_state);

            let pokedex_state = match state::PokedexState::load_from_storage(app.handle()) {
                Ok(pokedex) => pokedex,
                Err(err) => {
                    app.dialog()
                        .message(err.to_string())
                        .title("OpenHome Failed to Launch - Pokedex File Error")
                        .kind(MessageDialogKind::Error)
                        .blocking_show();
                    app.handle().exit(1);
                    std::process::exit(1);
                }
            };
            app.manage(pokedex_state);

            app.manage(state::AppState::from_update_features(update_features));

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
            commands::find_suggested_saves,
            commands::set_app_theme,
            commands::validate_recent_saves,
            commands::download_plugin,
            commands::list_installed_plugins,
            commands::load_plugin_code,
            commands::delete_plugin,
            commands::handle_windows_accellerator,
            commands::open_directory,
            commands::open_file_location,
            pkm_storage::load_banks,
            pkm_storage::write_banks,
            state::get_lookups,
            state::add_to_lookups,
            state::get_ohpkm_store,
            state::add_to_ohpkm_store,
            state::get_pokedex,
            state::update_pokedex,
            state::start_transaction,
            state::rollback_transaction,
            state::commit_transaction,
            state::synced_state::save_synced_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
