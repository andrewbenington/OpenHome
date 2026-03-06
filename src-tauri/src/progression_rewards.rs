use crate::error::{Error, Result};
use std::io;

#[tauri::command]
pub fn get_reward_template_bytes(reward_id: String) -> Result<Vec<u8>> {
    match reward_id.as_str() {
        "reward_arceus_event" => Ok(include_bytes!("rewards/arceus_event.ohpkm").to_vec()),
        "reward_celebi_event" => Ok(include_bytes!("rewards/celebi_event.ohpkm").to_vec()),
        "reward_darkrai_event" => Ok(include_bytes!("rewards/darkrai_event.ohpkm").to_vec()),
        "reward_diancie_event" => Ok(include_bytes!("rewards/diancie_event.ohpkm").to_vec()),
        "reward_genesect_event" => Ok(include_bytes!("rewards/genesect_event.ohpkm").to_vec()),
        "reward_hoopa_event" => Ok(include_bytes!("rewards/hoopa_event.ohpkm").to_vec()),
        "reward_jirachi_event" => Ok(include_bytes!("rewards/jirachi_event.ohpkm").to_vec()),
        "reward_keldeo_event" => Ok(include_bytes!("rewards/keldeo_event.ohpkm").to_vec()),
        "reward_magearna_event" => Ok(include_bytes!("rewards/magearna_event.ohpkm").to_vec()),
        "reward_manaphy_event" => Ok(include_bytes!("rewards/manaphy_event.ohpkm").to_vec()),
        "reward_marshadow_event" => Ok(include_bytes!("rewards/marshadow_event.ohpkm").to_vec()),
        "reward_meloetta_event" => Ok(include_bytes!("rewards/meloetta_event.ohpkm").to_vec()),
        "reward_mew_event" => Ok(include_bytes!("rewards/mew_event.ohpkm").to_vec()),
        "reward_pecharunt_event" => Ok(include_bytes!("rewards/pecharunt_event.ohpkm").to_vec()),
        "reward_phione_event" => Ok(include_bytes!("rewards/phione_event.ohpkm").to_vec()),
        "reward_shaymin_event" => Ok(include_bytes!("rewards/shaymin_event.ohpkm").to_vec()),
        "reward_victini_event" => Ok(include_bytes!("rewards/victini_event.ohpkm").to_vec()),
        "reward_volcanion_event" => Ok(include_bytes!("rewards/volcanion_event.ohpkm").to_vec()),
        "reward_zarude_event" => Ok(include_bytes!("rewards/zarude_event.ohpkm").to_vec()),
        "reward_zeraora_event" => Ok(include_bytes!("rewards/zeraora_event.ohpkm").to_vec()),
        _ => {
            let e = io::Error::new(io::ErrorKind::InvalidInput, format!("Unknown reward_id {}", reward_id));
            Err(Error::appdata(e))
        }
    }
}