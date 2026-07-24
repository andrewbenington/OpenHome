use clap::Parser;
use openhome_core::ohpkm_store::OhpkmBytesStore;
use openhome_core::saves::get_recent_saves;
use openhome_core::{Error, Result};
use pkm_rs_types::OriginGame;

use crate::cli::CliDataController;

#[derive(Parser, Debug, Clone, Copy)]
pub enum PkmCommand {
    ListOhpkm,
}

impl PkmCommand {
    pub fn execute(self) -> Result<()> {
        match self {
            Self::ListOhpkm => list_ohpkms(),
        }
    }
}

fn list_ohpkms() -> Result<()> {
    let controller = CliDataController::load()?;
    let ohpkms = OhpkmBytesStore::load_from_mons_v2(&controller)?;

    for (id, bytes) in ohpkms.all_entries() {
        tracing::info!("{id}:");
        // tracing::info!(
        //     "\tGame: {}",
        //     OriginGame::try_from_u8(save.game as u8)
        //         .as_ref()
        //         .map(OriginGame::game_name_full)
        //         .unwrap_or("(invalid game)")
        // );
        // tracing::info!("\tTrainer: {}", save.trainer_name);
        // tracing::info!("");
    }

    Ok(())
}
