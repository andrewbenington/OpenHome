use crate::data_controller::ToDataController;
use crate::versioning;
use crate::{logging, util};
use openhome_core::data_controller::{DataController, DataDir, MONS_V2_DIR};
use openhome_core::lookup::{GEN12_FILENAME, GEN345_FILENAME};
use openhome_core::pkm_storage::StoredBankData;
use openhome_core::{Error, Result};
use std::path::Path;
use tauri::{App, Emitter, Manager};

const BANKS_FILENAME: &str = "banks.json";
const LOGS_DIR: &str = "logs";

#[cfg(target_os = "linux")]
use dialog::DialogBox;
#[cfg(not(target_os = "linux"))]
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

pub fn run_app_startup(app: &App) -> Result<Vec<versioning::UpdateFeatures>> {
    let handle = app.handle().clone();
    logging::init_logging(
        &Path::join(
            &tauri::Manager::path(&handle)
                .app_data_dir()
                .map_err(|e| Error::other_with_source("Tauri error", e))?,
            LOGS_DIR,
        ),
        Some(move |event: logging::NewLogNotification| {
            let result = handle.emit("tracing::log", event);
            if let Err(err) = result {
                tracing::error!("{err}");
            }
        }),
    );

    let current_version = &app.handle().package_info().version;
    let controller = app.handle().controller();
    let update_features: Vec<versioning::UpdateFeatures> =
        match versioning::handle_updates_get_features(&controller, current_version, false) {
            Err(error) => match error {
                Error::OutdatedVersion { .. } => {
                    let should_launch = show_version_error_prompt(app, &error);

                    if should_launch {
                        return Err(error);
                    }

                    versioning::handle_updates_get_features(&controller, current_version, true)?
                }
                other => return Err(other),
            },
            Ok(feature_messages) => feature_messages,
        };

    versioning::update_version_last_used(&controller, current_version)?;

    // IMPORTANT: should occur after any migrations (above)
    initialize_storage(&controller)?;

    let result = set_theme_from_settings(app);
    if let Err(error) = result {
        eprintln!("{error}")
    }

    Ok(update_features)
}

fn initialize_storage(data_controller: &impl DataController) -> Result<()> {
    util::create_directory(data_controller.absolute_dir_path(DataDir::Storage)?)?;

    let obj_files = [
        GEN12_FILENAME,
        GEN345_FILENAME,
        "pokedex.json",
        "recent_saves.json",
        "settings.json",
    ];

    for obj_file in obj_files {
        data_controller.create_default_json_file_if_not_exists::<&str, serde_json::Map<_, _>>(
            DataDir::Storage,
            &obj_file,
        )?;
    }

    let arr_files = ["save-folders.json"];

    for arr_file in arr_files {
        data_controller.create_default_json_file_if_not_exists::<&str, Vec<String>>(
            DataDir::Storage,
            &arr_file,
        )?;
    }

    data_controller.create_default_json_file_if_not_exists::<&'static str, StoredBankData>(
        DataDir::Storage,
        &BANKS_FILENAME,
    )?;

    util::create_directory(data_controller.absolute_path(DataDir::Storage, MONS_V2_DIR)?)
}

const SETTINGS_FILENAME: &str = "settings.json";

fn set_theme_from_settings(app: &App) -> Result<()> {
    let settings_json: serde_json::Value = app
        .app_handle()
        .controller()
        .read_or_create_default_json_file(DataDir::Storage, SETTINGS_FILENAME)?;

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
    return _app
        .dialog()
        .message(error.to_string())
        .title("OpenHome Version Error")
        .kind(MessageDialogKind::Error)
        .buttons(MessageDialogButtons::OkCancelCustom(
            "Quit".to_owned(),
            "Launch App Anyways".to_owned(),
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
