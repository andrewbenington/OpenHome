use openhome_core::convert_strategies::ConvertStrategies;
use openhome_core::lookup::LookupState;
use crate::synced_state::box_pointer::BoxPointer;
use crate::synced_state::lazy_state_change_list::LazyStateChangeList;
use crate::synced_state::ohpkm_cache::OhpkmCache;
use crate::synced_state::SyncedStateWrapper;

pub struct LazyStateInner {
    pub lookups: SyncedStateWrapper<LookupState>,
    pub convert_strategies: SyncedStateWrapper<ConvertStrategies>,

    pub current_box: SyncedStateWrapper<BoxPointer>,
    pub ohpkm_cache: SyncedStateWrapper<OhpkmCache>,
    pub lazy_state_change_list: SyncedStateWrapper<LazyStateChangeList>,
}