use clap::Parser;
use openhome_core::saves::get_recent_saves;
use openhome_core::{Error, Result};
use pkm_rs_types::OriginGame;

use crate::cli::CliDataController;

#[derive(Parser, Debug, Clone, Copy)]
pub enum SaveCommand {
    ListRecents,
}

impl SaveCommand {
    pub fn execute(self) -> Result<()> {
        match self {
            SaveCommand::ListRecents => list_recents(),
        }
    }
}

fn list_recents() -> Result<()> {
    let controller = CliDataController::load()?;
    let recent_saves = get_recent_saves(&controller).map_err(|err| Error::other(&err))?;

    for (path, save) in recent_saves {
        tracing::info!("{path}:");
        tracing::info!(
            "\tGame: {}",
            OriginGame::try_from_u8(save.game as u8)
                .as_ref()
                .map(OriginGame::game_name_full)
                .unwrap_or("(invalid game)")
        );
        tracing::info!("\tTrainer: {}", save.trainer_name);
        tracing::info!("");
    }

    Ok(())
}
