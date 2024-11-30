use tauri::{menu::*, AppHandle, Wry};

pub fn create_menu(handle: &AppHandle) -> Result<Menu<Wry>, Box<dyn std::error::Error>> {
    let menu = Menu::new(handle)?;

    // I don't why there is a new item command submenu. What will be created with this?
    // let new_item = MenuItem::with_id(handle, "new", "New", true, Some("CmdOrCtrl+N"))?;
    let open_item = MenuItem::with_id(handle, "open", "Open", true, Some("CmdOrCtrl+O"))?;
    let save_item = MenuItem::with_id(handle, "save", "Save", true, Some("CmdOrCtrl+S"))?;
    let exit_item = MenuItem::with_id(handle, "exit", "Exit", true, Some("CmdOrCtrl+Q"))?;

    let file_submenu = SubmenuBuilder::new(handle, "File")
        // .item(&new_item)
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

    Ok(menu)

}

pub fn handle_menu_event(event: MenuEvent) {
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
        "show_toolbar" => println!("Show Toolbar action triggered!"),

        // Help menu actions
        "about" => println!("About action triggered!"),
        "check_updates" => println!("Check for updates action triggered!"),

        _ => println!("Nothing triggered!"),
    }
}
