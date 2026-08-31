use serde::{Deserialize, Serialize};
use tauri::ipc::IpcResponse;
use openhome_core::data_controller::DataController;
use crate::synced_state::SyncedState;

impl SyncedState for LazyStateChangeList {
    // TODO
    type Action = ();
    const ID: &'static str = "lazy_state_change_list";

    fn update(&mut self, action: Self::Action) {
        todo!()
    }

    fn to_command_response(&self) -> impl Clone + Serialize + IpcResponse {
        todo!()
    }
}


#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub(crate) struct LazyStateChangeList {

}

impl LazyStateChangeList {
    pub(crate) fn write_to_mons_v2(&self, p0: &impl DataController) -> _ {
        todo!()
    }

    fn emit_update() {

    }

    fn read() {

    }

    fn update() {

    }

    fn replace() {

    }
}
