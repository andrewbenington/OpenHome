use std::{collections::HashMap, fs};

use crate::{
    error::{Error, Result},
    pkm_storage::FilenameToBytesMap,
    util,
};

pub fn get_all_ohpkm_v1_bytes(app_handle: &tauri::AppHandle) -> Result<FilenameToBytesMap> {
    let mons_path = util::prepend_appdata_storage_to_path(app_handle, "mons")?;
    if !mons_path.try_exists().is_ok_and(|exists| exists) {
        return Ok(HashMap::new());
    }

    let mon_files = fs::read_dir(&mons_path).map_err(|e| Error::file_access(&mons_path, e))?;

    let mut map = HashMap::new();
    for mon_file_os_str in mon_files.flatten() {
        let path = mon_file_os_str.path();
        if !path
            .extension()
            .is_some_and(|ext| ext.eq_ignore_ascii_case("ohpkm"))
        {
            continue;
        }

        if let Ok(mon_bytes) = util::read_file_bytes(path) {
            let mon_filename = mon_file_os_str.file_name().to_string_lossy().into_owned();
            map.insert(mon_filename, mon_bytes);
        }
    }

    Ok(map)
}
