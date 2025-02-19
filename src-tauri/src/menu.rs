use std::process::Command;

use tauri::{image::Image, include_image, menu::*, App, AppHandle, Emitter, Manager, Wry};
const APP_ICON: Image<'_> = include_image!("icons/128x128.png");

#[cfg(target_os = "macos")]
const OPEN_CMD: &str = "open";
#[cfg(target_os = "linux")]
const OPEN_CMD: &str = "xdg-open";
#[cfg(target_os = "windows")]
const OPEN_CMD: &str = "explorer";

pub fn create_menu(app: &App) -> Result<Menu<Wry>, Box<dyn std::error::Error>> {
    let handle = app.handle();
    let menu = Menu::new(handle)?;

    let about = AboutMetadataBuilder::new()
        .name(Some("OpenHome"))
        .version(Some(app.package_info().version.to_string()))
        .authors(Some(vec![app.package_info().authors.to_string()]))
        .icon(Some(APP_ICON))
        .build();

    if cfg!(target_os = "macos") {
        let app_submenu_r = SubmenuBuilder::new(handle, "OpenHome")
            .about(Some(about.clone()))
            .separator()
            .services()
            .separator()
            .hide()
            .hide_others()
            .show_all()
            .separator()
            .quit()
            .build();
        if let Ok(app_submenu) = app_submenu_r {
            menu.append(&app_submenu)?;
        }
    }

    let open_item = MenuItem::with_id(handle, "open", "Open", true, Some("CmdOrCtrl+O"))?;
    let save_item = MenuItem::with_id(handle, "save", "Save", true, Some("CmdOrCtrl+S"))?;
    let reset_item = MenuItem::with_id(handle, "reset", "Reset", true, Some("CmdOrCtrl+T"))?;
    let open_appdata_item = MenuItem::with_id(
        handle,
        "open-appdata",
        "Open Data Folder",
        true,
        Some("CmdOrCtrl+D"),
    )?;
    let file_submenu_items = SubmenuBuilder::new(handle, "File")
        .item(&open_item)
        .item(&save_item)
        .item(&reset_item)
        .separator()
        .item(&open_appdata_item);

    let exit_item = MenuItem::with_id(handle, "exit", "Exit", true, Some("CmdOrCtrl+Q"))?;
    let file_submenu = match cfg!(target_os = "macos") {
        true => file_submenu_items.build(),
        false => file_submenu_items
            .separator()
            .about(Some(about))
            .item(&exit_item)
            .build(),
    }?;

    menu.append(&file_submenu)?;
    let zoom_in_item = MenuItem::with_id(handle, "zoom_in", "Zoom In", true, None::<&str>)?;
    let zoom_out_item = MenuItem::with_id(handle, "zoom_out", "Zoom Out", true, None::<&str>)?;
    let show_toolbar_item =
        MenuItem::with_id(handle, "show_toolbar", "Show Toolbar", true, None::<&str>)?;

    let view_submenu = SubmenuBuilder::new(handle, "View")
        .item(&zoom_in_item)
        .item(&zoom_out_item)
        .item(&show_toolbar_item)
        .build()?;

    menu.append(&view_submenu)?;

    // let about_item = MenuItem::with_id(handle, "about", "About", true, None::<&str>)?;
    let check_updates_item = MenuItem::with_id(
        handle,
        "check-updates",
        "Check for Updates",
        true,
        Some("CmdOrCtrl+U"),
    )?;
    let visit_github_item = MenuItem::with_id(
        handle,
        "visit-github",
        "Visit Github",
        true,
        Some("CmdOrCtrl+G"),
    )?;

    let help_submenu = SubmenuBuilder::new(handle, "Help")
        .item(&check_updates_item)
        .item(&visit_github_item)
        .build()?;

    menu.append(&help_submenu)?;
    Ok(menu)
}

fn command_open(target: &str) {
    let child = Command::new(OPEN_CMD)
        .arg(target) // <- Specify the directory you'd like to open.
        .spawn();

    if let Err(err) = child {
        println!("{}", err)
    }
}

pub fn handle_menu_event(app_handle: &AppHandle, event: MenuEvent) {
    handle_menu_event_id(app_handle, event.id.as_ref());
}

pub fn handle_menu_event_id(app_handle: &AppHandle, event_id: &str) {
    match event_id {
        // File menu actions
        // "new" => println!("New file action triggered!"),
        "open" => app_handle
            .emit("open", ())
            .unwrap_or_else(|err| println!("Error emitting 'open' event: {err}")),
        "save" => {
            let result = app_handle.emit("save", ());
            if let Err(error) = result {
                println!("Error saving: {}", error);
            } else {
                println!("Save successful");
            }
            return ();
        }
        "reset" => {
            let _ = app_handle.emit("reset", ());
            return ();
        }
        "open-appdata" => match app_handle.path().app_data_dir() {
            Err(err) => {
                println!["Error getting data directory: {}", err];
            }
            Ok(dir) => command_open(dir.to_str().unwrap_or_default()),
        },
        "exit" => std::process::exit(0),

        // Edit menu actions
        // "cut" => println!("Cut action triggered!"),
        // "copy" => println!("Copy action triggered!"),
        // "paste" => println!("Paste action triggered!"),

        // View menu actions
        // "zoom_in" => println!("Zoom In action triggered!"),
        // "zoom_out" => println!("Zoom Out action triggered!"),
        // "show_toolbar" => println!("Show Toolbar action triggered!"),

        // Help menu actions
        // "about" => println!("About action triggered!"),
        "check-updates" => command_open("https://andrewbenington.github.io/OpenHome/download.html"),
        "visit-github" => command_open("https://github.com/andrewbenington/OpenHome"),

        _ => (),
    }
}
