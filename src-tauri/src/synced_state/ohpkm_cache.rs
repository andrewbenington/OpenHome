use serde::{Deserialize, Serialize};
use tauri::ipc::IpcResponse;
use crate::synced_state::SyncedState;

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct OhpkmCache {



}

impl OhpkmCache {
    pub const CAPACITY : i32 = 1500;
}

impl SyncedState for OhpkmCache {

    // TODO
    type Action = ();

    // TODO
    const ID: &'static str = "";

    fn update(&mut self, action: Self::Action) {
        todo!()
    }

    fn to_command_response(&self) -> impl Clone + Serialize + IpcResponse {
        todo!()
    }
}