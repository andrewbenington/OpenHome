use pkm_rs::ohpkm::{v1::OhpkmV1, OhpkmV2};
use semver::Version;
use serde::Serialize;
use std::{fs, path::PathBuf};
use strum::{self, EnumIter, IntoEnumIterator};

use crate::data_controller::{DataDir, MONS_V2_DIR};
use crate::error::{Error, Result};
use crate::pkm_storage::{Bank, StoredBankData};
use crate::util;
use crate::{data_controller::DataController, deprecated};

const VERSION_FILE: &str = "version.txt";

pub fn get_version_last_used(app_handle: &tauri::AppHandle) -> Result<Option<String>> {
    match app_handle.read_file_text(DataDir::OpenHomeRoot, VERSION_FILE) {
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

    let last_version_path = app_handle.absolute_path(DataDir::OpenHomeRoot, VERSION_FILE)?;

    // Create OpenHome directory if it doesn't exist
    if let Some(parent) = last_version_path.parent() {
        util::create_directory(parent)?;
    }

    util::write_file_contents(
        &last_version_path,
        app_handle.package_info().version.to_string(),
    )
    .map_err(|err| Error::file_write(&last_version_path, err))?;

    util::create_directory(app_handle.get_config_folder()?)?;
    let cfg_path = app_handle.get_data_folder()?.join(VERSION_FILE);

    util::write_file_contents(&cfg_path, app_handle.package_info().version.to_string())
        .map_err(|err| Error::file_write(&cfg_path, err))
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
                    if prev.version_matches(update.version()) {
                        prev.add_feature_messages(&update_features);
                    } else {
                        all_update_features.push(prev.clone());
                        prev_o = Some(UpdateFeatures::new(update.version(), update_features))
                    }
                } else {
                    prev_o = Some(UpdateFeatures::new(update.version(), update_features));
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
        .map_err(Error::data_folder)?
        .try_exists()
        .map_err(Error::data_folder)
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
    V1_9_2,
    V1_10_0,
    V1_10_1,
    V1_10_2,
    V1_10_3,
    V1_10_5,
    V1_11_0Beta2,
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
            Self::V1_9_2 => Version::parse("1.9.2").unwrap(),
            Self::V1_10_0 => Version::parse("1.10.0").unwrap(),
            Self::V1_10_1 => Version::parse("1.10.1").unwrap(),
            Self::V1_10_2 => Version::parse("1.10.2").unwrap(),
            Self::V1_10_3 => Version::parse("1.10.3").unwrap(),
            Self::V1_10_5 => Version::parse("1.10.5").unwrap(),
            Self::V1_11_0Beta2 => Version::parse("1.11.0-beta.2").unwrap(),
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

    pub fn get_features(&self) -> Option<Vec<&'static str>> {
        match self {
            Self::V1_8_0AlphaOhpkmV2 => Some(vec![
                "Tracked Pokémon may now have associated notes, using the 'Notes' tab in the Pokémon details popup",
                "Multiple past trainers' data are persisted, meaning friendship, etc can be independently tracked across many games for the same Pokémon",
            ]),
            Self::V1_8_0AlphaFeatureMessages => Some(vec![
                "Right clicking on some elements now offers actions in a context menu",
            ]),
            Self::V1_8_1 => Some(vec!["A bug present when launching v1.8.0 has been fixed"]),
            Self::V1_8_2 => Some(vec![
                "Pokémon can optionally display extra information on the top-right of box view icons. This can be changed using the \"Display\" tab on the right panel of the home screen",
                "A bug preventing new users from launching v1.8.0 or v1.8.1 has been fixed",
            ]),
            Self::V1_9_0 => Some(vec![
                "Save files and Pokémon from Pokémon Legends: Z-A are now supported",
                "Tools for finding and recovering tracked Pokémon have been added to the \"Tracked Pokémon\" tab",
            ]),
            Self::V1_9_1 => Some(vec![
                "Bugs related to form updates, the item bag, and Pokédex display have been fixed",
            ]),
            Self::V1_9_2 => Some(vec!["Fixed a regression causing some Pokémon to 'devolve'"]),
            Self::V1_10_0 => Some(vec![
                "Multi-select/drag is now supported in OpenHome boxes. Use the button in the Home boxes to the top right (next to the name edit button) to toggle multi-select",
                "Support for Pokémon Luminescent Platinum has been added",
                "Cosplay Pikachu and Pokémon with forms exclusive to ROM hacks can now be moved into OpenHome and to supported save files",
                "Using the Display tab in the Pokémon details modal, you can assign tags and background colors to your Pokémon",
                "Image resources have been replaced to reduce bundle size and loading times",
            ]),
            Self::V1_10_1 => Some(vec![
                "All newly tracked Pokémon will now keep a backup copy of their original data in its raw byte format. This should increase the chance of data recovery in case of future bugs or oversights. Backup data can be viewed via the toggle in the bottom left of that Pokémon details modal, but Pokémon tracked from before version 1.10.1 will not have backup data or this toggle.",
                "More columns have been added to the \"Tracked Pokémon\" tab, including stats, types, gender, shiny status, and moves",
            ]),
            Self::V1_10_2 => Some(vec![
                "Some PKM format conversion options have been added to the Settings page. These settings will be used whenever you move a Pokémon from OpenHome into a save file.",
                "A Pokémon's level-up moveset and compatible games are now viewable in the Pokédex.",
                "If a Pokémon is moved into a game where none of its known moves are present, it will instead be assigned the four most recent moves from its level-up learnset.",
                "A bug caused by moving a Pokémon into Legends Arceus when it has no compatible moves has been fixed.",
                "A bug causing certain Pokémon to keep their pre-evolution's species name has been fixed (English names only). This will be fixed for other languages soon.",
            ]),
            Self::V1_10_3 => Some(vec![
                "An issue with move filtering, which caused issues with some Pokémon transferred to Legends Arceus, has been fixed.",
            ]),
            Self::V1_10_5 => Some(vec![
                "A bug causing Bad Eggs to appear in empty box slots in Gen 4 has been fixed.",
                "Hisui Poké balls are now converted to regular Poké balls when moving into Radical Red or Unbound. These games do not support Hisui balls and glitched/crashed when trying to display them.",
            ]),
            Self::V1_11_0Beta2 => Some(vec![
                "The data folder location can now be changed under Settings. NOTE: if you want to return to OpenHome version 1.10.*, make sure you set the data folder back to its original location in AppData first.",
                "The UI tabs have been moved to the left side of the window for a cleaner look.",
            ]),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct UpdateFeatures {
    version: String,
    feature_messages: Vec<&'static str>,
}

impl UpdateFeatures {
    pub fn new(version: Version, feature_messages: Vec<&'static str>) -> Self {
        Self {
            version: version.to_string(),
            feature_messages,
        }
    }

    pub fn add_feature_messages(&mut self, feature_messages: &[&'static str]) {
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
    let Some(old_boxes_r) = app_handle
        .read_file_json_if_exists::<_, Vec<deprecated::BoxPreV1_5_0>>(
            DataDir::Storage,
            deprecated::BOXDATA_FILE,
        )
    else {
        // Skip migration logic if no box data file exists
        return Ok(());
    };

    let mut old_boxes = old_boxes_r?;

    old_boxes.sort_by_key(|b| b.index);

    let mut new_bank = Bank::default();

    for old_box in old_boxes {
        new_bank.add_box(old_box.upgrade());
    }

    app_handle.write_file_json(
        DataDir::Storage,
        "banks.json",
        StoredBankData::from_banks(vec![new_bank]),
    )
}

pub fn do_migration_1_8_0(app_handle: &tauri::AppHandle) -> Result<()> {
    let mon_bytes = deprecated::get_all_ohpkm_v1_bytes(app_handle)?;
    for (path, bytes) in mon_bytes {
        let ohpkm_v1 = OhpkmV1::from_bytes(&bytes).map_err(|e| {
            Error::other(&format!(
                "Failed to parse OHPKM file during migration: {path}: {e}"
            ))
        })?;

        let v2_dir = app_handle.absolute_path(DataDir::Storage, MONS_V2_DIR)?;
        fs::create_dir_all(&v2_dir).map_err(|e| Error::FileWrite {
            path: v2_dir,
            source: Box::new(e),
        })?;

        let ohpkm_v2 = OhpkmV2::from_v1(ohpkm_v1);
        let bytes_v2 = ohpkm_v2.to_bytes();

        if let Some(filename) = PathBuf::from(&path).file_name() {
            let v2_path = app_handle
                .absolute_path(DataDir::Storage, MONS_V2_DIR)?
                .join(filename);
            util::write_file_contents(v2_path, bytes_v2)?;
        }
    }

    Ok(())
}

const MONS_DIR_OLD: &str = "mons";
const MONS_V1_DIR: &str = "mons_v1";

pub fn handle_old_mons_directories_for_ohpkm_v2(app_handle: &tauri::AppHandle) -> Result<()> {
    let old_mons_dir = app_handle.absolute_path(DataDir::Storage, MONS_DIR_OLD)?;

    if !fs::exists(&old_mons_dir).map_err(|e| Error::file_access(&old_mons_dir, e))? {
        return Ok(());
    }

    let v1_dir = app_handle.absolute_path(DataDir::Storage, MONS_V1_DIR)?;

    if fs::exists(&v1_dir).map_err(|e| Error::file_access(&v1_dir, e))? {
        fs::remove_dir_all(&v1_dir).map_err(|e| Error::file_access(&v1_dir, e))?;
    }

    fs::rename(&old_mons_dir, &v1_dir).map_err(|e| Error::file_access(&v1_dir, e))
}
