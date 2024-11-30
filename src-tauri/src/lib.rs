mod commands;
mod menu;
use std::env;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()        
        .setup(|app| {
            let handle = app.handle();
        
            match menu::create_menu(&handle) {
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
        .on_menu_event(|_, event| {
            menu::handle_menu_event(event);
        })
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_file_bytes,
            commands::get_file_created,
            commands::get_storage_file_json,
            commands::write_storage_file_json,
            commands::write_file_bytes,
            commands::write_storage_file_bytes,
            commands::get_ohpkm_files,
            commands::delete_storage_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
