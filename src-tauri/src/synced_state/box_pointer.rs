use serde::{Serialize, Serializer};
use tauri::ipc::{InvokeResponseBody, IpcResponse};
use crate::synced_state::SyncedState;

pub struct BoxPointer {
    pub box_index: usize,
    pub bank_index: usize
}

impl Clone for BoxPointer {
    fn clone(&self) -> Self {
        todo!()
    }
}

impl Serialize for BoxPointer {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer
    {
        todo!()
    }
}


impl SyncedState for BoxPointer {
    // TODO
    type Action = ();
    const ID: &'static str = "box_pointer";

    fn update(&mut self, action: Self::Action) {
        todo!()
    }

    fn to_command_response(&self) -> impl Clone + Serialize + IpcResponse {
        todo!()
    }
}