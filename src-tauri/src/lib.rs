mod commands;
use std::env;
use tauri::menu::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()        
        .setup(|app| {
            let handle = app.handle();
            let menu = Menu::new(handle)?;

            let new_item = MenuItem::with_id(handle, "new", "New", true, Some("CmdOrCtrl+N"))?;
            let open_item = MenuItem::with_id(handle, "open", "Open", true, Some("CmdOrCtrl+O"))?;
            let save_item = MenuItem::with_id(handle, "save", "Save", true, Some("CmdOrCtrl+S"))?;
            let exit_item = MenuItem::with_id(handle, "exit", "Exit", true, Some("CmdOrCtrl+Q"))?;

            let file_submenu = SubmenuBuilder::new(handle, "File")
                .item(&new_item)
                .item(&open_item)
                .item(&save_item)
                .separator()
                .item(&exit_item)
                .build()?;

            menu.append(&file_submenu)?;

            let undo_item = MenuItem::with_id(handle, "undo", "Undo", true, Some("CmdOrCtrl+Z"))?;
            let redo_item = MenuItem::with_id(handle, "redo", "Redo", true, Some("CmdOrCtrl+Y"))?;
            let cut_item = MenuItem::with_id(handle, "cut", "Cut", true, Some("CmdOrCtrl+X"))?;
            let copy_item = MenuItem::with_id(handle, "copy", "Copy", true, Some("CmdOrCtrl+C"))?;
            let paste_item = MenuItem::with_id(handle, "paste", "Paste", true, Some("CmdOrCtrl+V"))?;

            let edit_submenu = SubmenuBuilder::new(handle, "Edit")
                .item(&undo_item)
                .item(&redo_item)
                .item(&cut_item)
                .item(&copy_item)
                .item(&paste_item)
                .build()?;

            menu.append(&edit_submenu)?;

            let zoom_in_item = MenuItem::with_id(handle, "zoom_in", "Zoom In", true, Some("CmdOrCtrl++"))?;
            let zoom_out_item = MenuItem::with_id(handle, "zoom_out", "Zoom Out", true, Some("CmdOrCtrl+-"))?;
            let show_devbar_item = MenuItem::with_id(handle, "show_dev_bar", "Show Developer Menu", true, None::<&str>)?;

            let view_submenu = SubmenuBuilder::new(handle, "View")
                .item(&zoom_in_item)
                .item(&zoom_out_item)
                .item(&show_devbar_item)
                .build()?;

            menu.append(&view_submenu)?;

            let about_item = MenuItem::with_id(handle, "about", "About", true, None::<&str>)?;
            let check_updates_item = MenuItem::with_id(handle, "check_updates", "Check for Updates", true, None::<&str>)?;

            let help_submenu = SubmenuBuilder::new(handle, "Help")
                .item(&about_item)
                .item(&check_updates_item)
                .build()?;

            menu.append(&help_submenu)?;            
            
            let zoom_in_item = MenuItem::with_id(handle, "zoom_in", "Zoom In", true, None::<&str>)?;
            let zoom_out_item = MenuItem::with_id(handle, "zoom_out", "Zoom Out", true, None::<&str>)?;
            let show_toolbar_item = MenuItem::with_id(handle, "show_toolbar", "Show Toolbar", true, None::<&str>)?;

            let view_submenu = SubmenuBuilder::new(handle, "View")
                .item(&zoom_in_item)
                .item(&zoom_out_item)
                .item(&show_toolbar_item)
                .build()?;

            menu.append(&view_submenu)?;

            let about_item = MenuItem::with_id(handle, "about", "About", true, None::<&str>)?;
            let check_updates_item = MenuItem::with_id(handle, "check_updates", "Check for Updates", true, None::<&str>)?;

            let help_submenu = SubmenuBuilder::new(handle, "Help")
                .item(&about_item)
                .item(&check_updates_item)
                .build()?;

            menu.append(&help_submenu)?;

            let _ = app.set_menu(menu);

            Ok(())
        })
        .on_menu_event(|_, event| {
            println!("Triggered menu event ID: {}", event.id.as_ref());
            match event.id.as_ref() {
                // File menu actions
                "new" => println!("New file action triggered!"),
                "open" => println!("Open file action triggered!"),
                "save" => println!("Save file action triggered!"),
                "exit" => std::process::exit(0),

                // Edit menu actions
                "undo" => println!("Undo action triggered!"),
                "redo" => println!("Redo action triggered!"),
                "cut" => println!("Cut action triggered!"),
                "copy" => println!("Copy action triggered!"),
                "paste" => println!("Paste action triggered!"),

                // View menu actions
                "zoom_in" => println!("Zoom In action triggered!"),
                "zoom_out" => println!("Zoom Out action triggered!"),
                "show_toolbar" => println!("Dev window triggered!"),

                // Help menu actions
                "about" => println!("About action triggered!"),
                "check_updates" => println!("Check for updates action triggered!"),

                _ => println!("Nothing triggered!"),
            }
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
