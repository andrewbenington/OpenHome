use serde::Serialize;
use tauri::ipc::IpcResponse;
use openhome_core::box_pointer::BoxPointer;
use crate::synced_state::SyncedState;



impl SyncedState for BoxPointer {
    // TODO
    type Action = Self;
    const ID: &'static str = "box_pointer";

    fn update(&mut self, action: Self::Action) {
        self.bank_index = action.bank_index;
        self.box_index = action.box_index;
    }

    fn to_command_response(&self) -> impl Clone + Serialize + IpcResponse {
        self
    }
}