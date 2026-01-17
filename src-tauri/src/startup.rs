use std::path::{Path, PathBuf};
use tauri::{App, Manager};

use crate::{
    error::{Error, Result},
    pkm_storage::StoredBankData,
    util,
    versioning::{self, UpdateFeatures},
};

#[cfg(target_os = "linux")]
use dialog::DialogBox;

pub fn run_app_startup(app: &App) -> Result<Vec<UpdateFeatures>> {
    let handle = app.handle();

    let update_features: Vec<UpdateFeatures> =
        match versioning::handle_updates_get_features(handle, false) {
            Err(error) => match error {
                Error::OutdatedVersion { .. } => {
                    let should_launch = show_version_error_prompt(app, &error);

                    if should_launch {
                        return Err(error);
                    }

                    versioning::handle_updates_get_features(handle, true)?
                }
                other => return Err(other),
            },
            Ok(feature_messages) => feature_messages,
        };

    versioning::update_version_last_used(handle)?;

    // IMPORTANT: should occur after any migrations (above)
    initialize_storage(handle)?;

    let result = set_theme_from_settings(app);
    if let Err(error) = result {
        eprintln!("{error}")
    }

    Ok(update_features)
}

fn initialize_storage(app_handle: &tauri::AppHandle) -> Result<()> {
    let storage_path = util::get_storage_path(app_handle)?;
    util::create_directory(&storage_path)?;

    let obj_files = [
        "gen12_lookup.json",
        "gen345_lookup.json",
        "pokedex.json",
        "recent_saves.json",
        "settings.json",
    ];

    for obj_file in obj_files {
        init_storage_json_file(app_handle, obj_file.into(), false)?;
    }

    let arr_files = ["save-folders.json"];

    for arr_file in arr_files {
        init_storage_json_file(app_handle, arr_file.into(), true)?;
    }

    if !storage_path.join("banks.json").exists() {
        util::write_storage_file_json(app_handle, "banks.json", StoredBankData::default())?;
    }

    let mons_path = util::get_storage_path(app_handle)?.join("mons_v2");
    util::create_directory(&mons_path)
}

fn init_storage_json_file(
    app_handle: &tauri::AppHandle,
    relative_path: PathBuf,
    is_array: bool,
) -> Result<()> {
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

fn set_theme_from_settings(app: &App) -> Result<()> {
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
        .ok_or(Error::WindowAccess { source: None })?
        .set_theme(theme_option)
        .map_err(|e| Error::other_with_source("Could not set theme", e))
}

pub fn show_version_error_prompt(_app: &tauri::App, error: &Error) -> bool {
    #[cfg(not(target_os = "linux"))]
    return !_app
        .dialog()
        .message(message)
        .title("OpenHome Version Error")
        .kind(MessageDialogKind::Error)
        .buttons(MessageDialogButtons::OkCancelCustom(
            "Quit",
            "Launch App Anyways",
        ))
        .blocking_show();

    #[cfg(target_os = "linux")]
    dialog::Question::new(format!(
        "{error}\nDo you want to accept the risk and launch anyways?"
    ))
    .title("OpenHome Version Error")
    .show()
    .expect("Could not display dialog box")
    .eq(&dialog::Choice::Yes)
}
