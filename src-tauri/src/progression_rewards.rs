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
        "reward_bulbasaur_event" => Ok(include_bytes!("rewards/bulbasaur_event.ohpkm").to_vec()),
        "reward_charmander_event" => Ok(include_bytes!("rewards/charmander_event.ohpkm").to_vec()),
        "reward_eevee_event" => Ok(include_bytes!("rewards/eevee_event.ohpkm").to_vec()),
        "reward_entei_event" => Ok(include_bytes!("rewards/entei_event.ohpkm").to_vec()),
        "reward_gastly_event" => Ok(include_bytes!("rewards/gastly_event.ohpkm").to_vec()),
        "reward_beldum_event" => Ok(include_bytes!("rewards/beldum_event.ohpkm").to_vec()),
        "reward_gholdengo_event" => Ok(include_bytes!("rewards/gholdengo_event.ohpkm").to_vec()),
        "reward_giratina_event" => Ok(include_bytes!("rewards/giratina_event.ohpkm").to_vec()),
        "reward_koraidon_event" => Ok(include_bytes!("rewards/koraidon_event.ohpkm").to_vec()),
        "reward_lunala_event" => Ok(include_bytes!("rewards/lunala_event.ohpkm").to_vec()),
        "reward_machamp_event" => Ok(include_bytes!("rewards/machamp_event.ohpkm").to_vec()),
        "reward_mewtwo_event" => Ok(include_bytes!("rewards/mewtwo_event.ohpkm").to_vec()),
        "reward_necrozma_event" => Ok(include_bytes!("rewards/necrozma_event.ohpkm").to_vec()),
        "reward_onix_event" => Ok(include_bytes!("rewards/onix_event.ohpkm").to_vec()),
        "reward_porygon_event" => Ok(include_bytes!("rewards/porygon_event.ohpkm").to_vec()),
        "reward_reshiram_event" => Ok(include_bytes!("rewards/reshiram_event.ohpkm").to_vec()),
        "reward_zamazenta_event" => Ok(include_bytes!("rewards/zamazenta_event.ohpkm").to_vec()),
        "reward_zacian_event" => Ok(include_bytes!("rewards/zacian_event.ohpkm").to_vec()),
        _ => {
            let e = io::Error::new(io::ErrorKind::InvalidInput, format!("Unknown reward_id {}", reward_id));
            Err(Error::appdata(e))
        }
    }
}