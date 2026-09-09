use crate::synced_state::SyncedState;
pub(crate) use openhome_core::ohpkm_cache::OhpkmCache;
use serde::Serialize;
use crate::synced_state::ohpkm_cache_changes::OhpkmCacheChanges;

impl SyncedState for OhpkmCache {
    type Action = OhpkmCacheChanges;
    const ID: &'static str = "ohpkm_cache";

    fn update(&mut self, other: OhpkmCacheChanges) {
        other.all_entries().for_each(|(k, v)| {
            self.insert(k, v);
        });
    }

    fn to_command_response(&self) -> impl Clone + Serialize + tauri::ipc::IpcResponse {
        self.to_b64_map()
    }
}