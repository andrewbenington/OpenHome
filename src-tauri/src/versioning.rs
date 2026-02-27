use pkm_rs::pkm::ohpkm::{OhpkmV1, OhpkmV2};
use semver::Version;
use serde::Serialize;
use std::{
    fs,
    path::{Path, PathBuf},
};
use strum::{self, EnumIter, IntoEnumIterator};

use crate::{
    deprecated,
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

#[cfg(debug_assertions)]
const SKIP_LAST_USED_UPDATE: bool = false;

pub fn update_version_last_used(app_handle: &tauri::AppHandle) -> Result<()> {
    #[cfg(debug_assertions)]
    if SKIP_LAST_USED_UPDATE {
        return Ok(());
    }

    let last_version_path = prepend_appdata_to_path(app_handle, VERSION_FILE)?;

    // Create OpenHome directory if it doesn't exist
    if let Some(parent) = last_version_path.parent() {
        util::create_directory(parent)?;
    }

    write_file_contents(
        &last_version_path,
        app_handle.package_info().version.to_string(),
    )
    .map_err(|err| Error::file_write(&last_version_path, err))
}

pub fn handle_updates_get_features(
    app_handle: &tauri::AppHandle,
    ignore_version_error: bool,
) -> Result<Vec<UpdateFeatures>> {
    if !appdata_dir_exists(app_handle)? {
        return Ok(vec![]);
    }

    let last_used_version = get_version_last_used(app_handle)?;
    match last_used_version {
        Some(ref from_file) => println!("User last used OpenHome version {from_file}"),
        None => println!("User last used OpenHome version 1.4.13 or earlier"),
    }

    let last_version_or_1_4_13 = match last_used_version {
        Some(ref version) => version,
        None => "1.4.13",
    };

    let Ok(last_used_semver) = Version::parse(last_version_or_1_4_13) else {
        return Err(Error::other(&format!(
            "Invalid version number: {last_version_or_1_4_13}"
        )));
    };

    let current_version = app_handle.package_info().version.clone();
    // let current_version = Version::new(1, 5, 0);

    if current_version < last_used_semver && !ignore_version_error {
        return Err(Error::outdated_version(last_used_semver, current_version));
    }

    let mut all_update_features: Vec<UpdateFeatures> = vec![];

    if current_version == last_used_semver && !cfg!(debug_assertions) {
        println!("Version has not changed since last launch")
    } else {
        if last_used_semver != current_version {
            println!(
                "This version ({current_version}) is newer than last used version ({last_used_semver})"
            );
        }
        let significant_updates = get_significant_updates(last_used_semver, current_version);
        println!("Significant update: {significant_updates:?}");

        let mut prev_o: Option<UpdateFeatures> = None;

        for update in significant_updates {
            println!("Running migration for {update}...");
            update.do_migration(app_handle)?;
            println!("Migration complete");

            if last_used_version.is_none() {
                // don't display new features if user is new to OpenHome
                continue;
            }

            if let Some(update_features) = update.get_features() {
                if let Some(prev) = &mut prev_o {
                    if prev.version_matches(update.get_non_prerelease()) {
                        prev.add_feature_messages(&update_features);
                    } else {
                        all_update_features.push(prev.clone());
                        prev_o = Some(UpdateFeatures::new(
                            update.get_non_prerelease(),
                            update_features,
                        ))
                    }
                } else {
                    prev_o = Some(UpdateFeatures::new(
                        update.get_non_prerelease(),
                        update_features,
                    ));
                }
            }
        }

        if let Some(prev) = prev_o {
            all_update_features.push(prev);
        }
    }

    Ok(all_update_features)
}

fn appdata_dir_exists(app_handle: &tauri::AppHandle) -> Result<bool> {
    tauri::Manager::path(app_handle)
        .app_data_dir()
        .map_err(Error::appdata)?
        .try_exists()
        .map_err(Error::appdata)
}

#[derive(EnumIter, Clone, Copy, strum::Display, Debug, PartialEq, Eq, Hash, Serialize)]
pub enum SignificantUpdate {
    V1_5_0AlphaMultipleBanks,
    V1_8_0AlphaOhpkmV2,
    V1_8_0AlphaFeatureMessages,
    V1_8_1,
    V1_8_2,
    V1_9_0,
    V1_9_1,
}

impl SignificantUpdate {
    pub fn version(&self) -> Version {
        match self {
            Self::V1_5_0AlphaMultipleBanks => Version::parse("1.5.0-alpha-multiple-banks").unwrap(),
            Self::V1_8_0AlphaOhpkmV2 => Version::parse("1.8.0-alpha-ohpkm-v2").unwrap(),
            Self::V1_8_0AlphaFeatureMessages => {
                Version::parse("1.8.0-x-alpha.1.feature-messages").unwrap()
            }
            Self::V1_8_1 => Version::parse("1.8.1").unwrap(),
            Self::V1_8_2 => Version::parse("1.8.2").unwrap(),
            Self::V1_9_0 => Version::parse("1.9.0").unwrap(),
            Self::V1_9_1 => Version::parse("1.9.1").unwrap(),
        }
    }

    pub fn do_migration(&self, app_handle: &tauri::AppHandle) -> Result<()> {
        match self {
            Self::V1_5_0AlphaMultipleBanks => do_migration_1_5_0(app_handle),
            Self::V1_8_0AlphaOhpkmV2 => do_migration_1_8_0(app_handle),
            Self::V1_8_0AlphaFeatureMessages => Ok(()),
            Self::V1_8_1 => handle_old_mons_directories_for_ohpkm_v2(app_handle),
            _ => Ok(()),
        }
    }

    pub fn get_features(&self) -> Option<Vec<String>> {
        match self {
            Self::V1_8_0AlphaOhpkmV2 => Some(vec![
                String::from(
                    "Tracked Pokémon may now have associated notes, using the 'Notes' tab in the Pokémon details popup",
                ),
                String::from(
                    "Multiple past trainers' data are persisted, meaning friendship, etc can be independently tracked across many games for the same Pokémon",
                ),
            ]),
            Self::V1_8_0AlphaFeatureMessages => Some(vec![String::from(
                "Right clicking on some elements now offers actions in a context menu",
            )]),
            Self::V1_8_1 => Some(vec![String::from(
                "A bug present when launching v1.8.0 has been fixed",
            )]),
            Self::V1_8_2 => Some(vec![
                String::from(
                    "Pokémon can optionally display extra information on the top-right of box view icons. This can be changed using the \"Display\" tab on the right panel of the home screen",
                ),
                String::from(
                    "A bug preventing new users from launching v1.8.0 or v1.8.1 has been fixed",
                ),
            ]),
            Self::V1_9_0 => Some(vec![
                String::from("Save files and Pokémon from Pokémon Legends: Z-A are now supported"),
                String::from(
                    "Tools for finding and recovering tracked Pokémon have been added to the \"Tracked Pokémon\" tab",
                ),
            ]),
            Self::V1_9_1 => Some(vec![String::from(
                "Bugs related to form updates, the item bag, and Pokédex display have been fixed",
            )]),
            _ => None,
        }
    }

    pub fn get_non_prerelease(&self) -> Version {
        let version = self.version();

        Version::new(version.major, version.minor, version.patch)
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct UpdateFeatures {
    version: String,
    feature_messages: Vec<String>,
}

impl UpdateFeatures {
    pub fn new(version: Version, feature_messages: Vec<String>) -> Self {
        Self {
            version: version.to_string(),
            feature_messages,
        }
    }

    pub fn add_feature_messages(&mut self, feature_messages: &[String]) {
        self.feature_messages.extend_from_slice(feature_messages);
    }

    pub fn version_matches(&self, other: Version) -> bool {
        self.version == other.to_string()
    }
}

pub fn get_significant_updates(
    last_launch_version: Version,
    current_version: Version,
) -> Vec<SignificantUpdate> {
    SignificantUpdate::iter()
        .filter(|m| m.version() > last_launch_version && m.version() <= current_version)
        .collect()
}

pub fn do_migration_1_5_0(app_handle: &tauri::AppHandle) -> Result<()> {
    // Skip migration logic if no box data file exists
    let full_path = util::prepend_appdata_storage_to_path(app_handle, deprecated::BOXDATA_FILE)?;
    if !full_path.exists() {
        return Ok(());
    }

    let mut old_boxes = util::get_storage_file_json::<_, Vec<deprecated::BoxPreV1_5_0>>(
        app_handle,
        deprecated::BOXDATA_FILE,
    )?;
    old_boxes.sort_by_key(|b| b.index);

    let mut new_bank = Bank::default();

    for old_box in old_boxes {
        new_bank.add_box(old_box.upgrade());
    }

    let banks_path = util::prepend_appdata_storage_to_path(app_handle, "banks.json")?;

    util::write_file_json(banks_path, StoredBankData::from_banks(vec![new_bank]))
}

pub fn do_migration_1_8_0(app_handle: &tauri::AppHandle) -> Result<()> {
    let mon_bytes = deprecated::get_all_ohpkm_v1_bytes(app_handle)?;
    for (path, bytes) in mon_bytes {
        let ohpkm_v1 = OhpkmV1::from_bytes(&bytes).map_err(|e| {
            Error::other(&format!(
                "Failed to parse OHPKM file during migration: {path}: {e}"
            ))
        })?;

        let v2_dir = util::prepend_appdata_storage_to_path(app_handle, "mons_v2")?;
        fs::create_dir_all(&v2_dir).map_err(|e| Error::FileWrite {
            path: v2_dir,
            source: Box::new(e),
        })?;

        let ohpkm_v2 = OhpkmV2::from_v1(ohpkm_v1);
        let bytes_v2 = ohpkm_v2.to_bytes();
        if let Ok(bytes_v2) = bytes_v2
            && let Some(filename) = PathBuf::from(&path).file_name()
        {
            let v2_path = Path::join(
                &util::prepend_appdata_storage_to_path(app_handle, "mons_v2")?,
                filename,
            );

            util::write_file_contents(v2_path, bytes_v2)?;
        }
    }

    Ok(())
}

pub fn handle_old_mons_directories_for_ohpkm_v2(app_handle: &tauri::AppHandle) -> Result<()> {
    let old_mons_dir = util::prepend_appdata_storage_to_path(app_handle, "mons")?;

    if !fs::exists(&old_mons_dir).map_err(|e| Error::file_access(&old_mons_dir, e))? {
        return Ok(());
    }

    let v1_dir = util::prepend_appdata_storage_to_path(app_handle, "mons_v1")?;

    if fs::exists(&v1_dir).map_err(|e| Error::file_access(&v1_dir, e))? {
        fs::remove_dir_all(&v1_dir).map_err(|e| Error::file_access(&v1_dir, e))?;
    }

    fs::rename(&old_mons_dir, &v1_dir).map_err(|e| Error::file_access(&v1_dir, e))
}
