use semver::Version;
use std::path::PathBuf;

use crate::{
    error::{OpenHomeError, OpenHomeResult},
    util::{prepend_appdata_to_path, read_file_text},
};

const VERSION_FILE: &str = "version.txt";

pub fn get_version_last_used(app_handle: &tauri::AppHandle) -> OpenHomeResult<Option<String>> {
    let last_version_path = prepend_appdata_to_path(app_handle, VERSION_FILE)?;

    match read_file_text(&last_version_path) {
        Ok(version) => Ok(Some(version.trim().to_owned())),
        Err(OpenHomeError::FileMissing { .. }) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn handle_version_migration(app_handle: &tauri::AppHandle) -> OpenHomeResult<()> {
    let last_used_version = get_version_last_used(app_handle)?;
    match last_used_version {
        Some(ref from_file) => println!("User last used OpenHome version {from_file}"),
        None => println!("User last used OpenHome version 1.4.12 or earlier"),
    }

    let last_used_version = match last_used_version {
        Some(ref version) => version,
        None => "1.4.12",
    };

    let Ok(last_used_semver) = Version::parse(last_used_version) else {
        return Err(OpenHomeError::other(&format!(
            "Invalid version number: {last_used_version}"
        )));
    };

    let current_version = app_handle.package_info().version.clone();

    if current_version < last_used_semver {
        return Err(OpenHomeError::other(&format!(
            "Last used version ({last_used_semver}) is newer than this version ({current_version}). Using this version may corrupt your data. Please use version {last_used_semver} or later."
        )));
    }

    if current_version == last_used_semver {
        println!("Version has not changed since last launch")
    } else {
        println!(
            "This version ({current_version}) is newer than last used version ({last_used_semver})"
        )
    }

    Ok(())
}
