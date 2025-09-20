use semver::Version;
use strum::{self, EnumIter, IntoEnumIterator};

use crate::{
    deprecated::{self, BoxPreV1_5_0},
    error::{Error, Result},
    pkm_storage::{Bank, StoredBankData},
    util::{self, prepend_appdata_to_path, read_file_text, write_file_contents},
};

const VERSION_FILE: &str = "version.txt";

pub fn get_version_last_used(app_handle: &tauri::AppHandle) -> Result<Option<String>> {
    let last_version_path = prepend_appdata_to_path(app_handle, VERSION_FILE)?;

    match read_file_text(&last_version_path) {
        Ok(version) => Ok(Some(version.trim().to_owned())),
        Err(Error::FileMissing { .. }) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn update_version_last_used(app_handle: &tauri::AppHandle) -> Result<()> {
    let last_version_path = prepend_appdata_to_path(app_handle, VERSION_FILE)?;

    // Create OpenHome directory if it doesn't exist
    if let Some(parent) = last_version_path.parent() {
        util::create_directory(parent)?;
    }

    write_file_contents(
        &last_version_path,
        app_handle.package_info().version.to_string(),
    )
    .map_err(|err| Error::file_write(last_version_path, err))
}

pub fn handle_version_migration(
    app_handle: &tauri::AppHandle,
    ignore_version_error: bool,
) -> Result<()> {
    let last_used_version = get_version_last_used(app_handle)?;
    match last_used_version {
        Some(ref from_file) => println!("User last used OpenHome version {from_file}"),
        None => println!("User last used OpenHome version 1.4.13 or earlier"),
    }

    let last_used_version = match last_used_version {
        Some(ref version) => version,
        None => "1.4.13",
    };

    let Ok(last_used_semver) = Version::parse(last_used_version) else {
        return Err(Error::other(&format!(
            "Invalid version number: {last_used_version}"
        )));
    };

    let current_version = app_handle.package_info().version.clone();
    // let current_version = Version::new(1, 5, 0);

    if current_version < last_used_semver && !ignore_version_error {
        return Err(Error::outdated_version(last_used_semver, current_version));
    }

    if current_version == last_used_semver {
        println!("Version has not changed since last launch")
    } else {
        println!(
            "This version ({current_version}) is newer than last used version ({last_used_semver})"
        );
        let necessary_migrations = get_necessary_migrations(last_used_semver, current_version);
        println!("Necessary migrations: {necessary_migrations:?}");

        for migration in necessary_migrations {
            println!("Running migration {migration}...");
            migration.do_migration(app_handle)?;
            println!("Migration complete");
        }
    }

    Ok(())
}

#[derive(EnumIter, Clone, Copy, strum::Display, Debug)]
pub enum Migration {
    V1_5_0ALPHA,
}

impl Migration {
    pub fn version(&self) -> Version {
        match self {
            Migration::V1_5_0ALPHA => Version::parse("1.5.0-alpha-multiple-banks").unwrap(),
        }
    }

    pub fn do_migration(&self, app_handle: &tauri::AppHandle) -> Result<()> {
        match self {
            Migration::V1_5_0ALPHA => do_migration_1_5_0(app_handle),
        }
    }
}

pub fn get_necessary_migrations(
    last_launch_version: Version,
    current_version: Version,
) -> Vec<Migration> {
    Migration::iter()
        .filter(|m| m.version() > last_launch_version && m.version() <= current_version)
        .collect()
}

pub fn do_migration_1_5_0(app_handle: &tauri::AppHandle) -> Result<()> {
    // Skip migration logic if no box data file exists
    let full_path = util::prepend_appdata_storage_to_path(app_handle, deprecated::BOXDATA_FILE)?;
    if !full_path.exists() {
        return Ok(());
    }

    let mut old_boxes =
        util::get_storage_file_json::<_, Vec<BoxPreV1_5_0>>(app_handle, deprecated::BOXDATA_FILE)?;
    old_boxes.sort_by_key(|b| b.index);

    let mut new_bank = Bank::default();

    for old_box in old_boxes {
        new_bank.add_box(old_box.upgrade());
    }

    let banks_path = util::prepend_appdata_storage_to_path(app_handle, "banks.json")?;

    util::write_file_json(banks_path, StoredBankData::from_banks(vec![new_bank]))
}
