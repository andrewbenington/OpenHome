use openhome_core::convert_strategies::ConvertStrategies;
use openhome_core::lookup::LookupState;
use openhome_core::ohpkm_store_changes::OhpkmStoreChanges;
use openhome_core::pkm_storage::BoxPointer;
use crate::synced_state::SyncedStateWrapper;

pub struct LazyStateInner {
    pub lookups: SyncedStateWrapper<LookupState>,
    pub current_box: BoxPointer,
    pub convert_strategies: SyncedStateWrapper<ConvertStrategies>,
    pub ohpkm_store_changes: OhpkmStoreChanges
}