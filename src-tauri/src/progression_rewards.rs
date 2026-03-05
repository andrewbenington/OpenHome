use crate::error::{Error, Result};
use std::io;

#[tauri::command]
pub fn get_reward_template_bytes(reward_id: String) -> Result<Vec<u8>> {
    match reward_id.as_str() {
        // TODO: Convert additional reward PKM files to .ohpkm templates using the following steps:
        // 1. In OpenHome, import/deposit the Pokémon into the vault so it is written to mons_v2
        // 2. Close OpenHome
        // 3. Copy the corresponding generated .ohpkm file from app data mons_v2 directory
        // 4. Paste into src-tauri/src/rewards folder
        // 5. Rename to match reward template name (e.g., genesect_event.ohpkm)
        // 6. Add mapping below using include_bytes!("rewards/name.ohpkm")
        "reward_victini_event" => Ok(include_bytes!("rewards/victini_event.ohpkm").to_vec()),
        "reward_arceus_event" => Ok(include_bytes!("rewards/arceus_event.ohpkm").to_vec()),
        "reward_celebi_event" => Ok(include_bytes!("rewards/celebi_event.ohpkm").to_vec()),
        _ => {
            let e = io::Error::new(io::ErrorKind::InvalidInput, format!("Unknown reward_id {}", reward_id));
            Err(Error::appdata(e))
        }
    }
}