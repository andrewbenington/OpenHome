use std::ops::Deref;
use std::sync::Mutex;
use crate::synced_state::box_pointer::BoxPointer;
use openhome_core::convert_strategies::ConvertStrategies;
use openhome_core::{data_controller, Error};
use openhome_core::lookup::LookupState;
use openhome_core::ohpkm_store::OhpkmBytesStore;
use openhome_core::ohpkm_store_partial::OhpkmStorePartial;
use crate::synced_state::lazy_state_inner::LazyStateInner;
use crate::synced_state::ohpkm_cache::OhpkmCache;
use crate::synced_state::{SyncedState, SyncedStateWrapper};
use crate::synced_state::lazy_state_change::LazyStateChange;
use crate::synced_state::lazy_state_change_list::LazyStateChangeList;

pub struct LazyState(pub Mutex<LazyStateInner>);


impl LazyState {
    pub(crate) fn from_partial_states(
        lookups: LookupState,
        bank_pointer: BoxPointer,
        convert_strategies: ConvertStrategies,
    ) -> Self {
        Self(Mutex::new(LazyStateInner {
            lookups: SyncedStateWrapper(lookups),
            convert_strategies: SyncedStateWrapper(convert_strategies),

            // TODO initialize properly
            current_box: SyncedStateWrapper(bank_pointer),
            ohpkm_cache: SyncedStateWrapper(OhpkmCache {}),
            lazy_state_change_list: SyncedStateWrapper(LazyStateChangeList {})
        }))
    }
}

impl LazyState {


    pub fn clone_lookups(&self) -> openhome_core::Result<LookupState> {
        Ok(self.lock()?.lookups.0.clone())
    }

    pub fn get_convert_strategies(&self) -> openhome_core::Result<ConvertStrategies> {
        Ok(self.lock()?.convert_strategies.0.clone())
    }

    pub fn save_to_files(
        &self,
        data_controller: &impl data_controller::DataController,
    ) -> openhome_core::Result<()> {
        let locked = self.lock()?;
        locked
            .lazy_state_change_list
            .0
            .write_to_mons_v2(data_controller)?;
        locked.lookups.0.write_to_files(data_controller)?;
        locked.convert_strategies.0.write_to_files(data_controller)
    }

    pub(crate) fn update_from_frontend(
        &self,
        state_identifier: &str,
        action: serde_json::Value,
    ) -> openhome_core::Result<()> {
        match state_identifier {
            ConvertStrategies::ID => {
                let action: <ConvertStrategies as SyncedState>::Action =
                    serde_json::from_value(action).map_err(|e| {
                        Error::unexpeted_condition_with_source(
                            "update_from_frontend: invalid ConvertStrategies action received"
                                .to_owned(),
                            e,
                        )
                    })?;
                self.lock()?.convert_strategies.0.update(action);
            }
            LookupState::ID => {
                let action: <LookupState as SyncedState>::Action = serde_json::from_value(action)
                    .map_err(|e| {
                    Error::unexpeted_condition_with_source(
                        "update_from_frontend: invalid LookupState action received".to_owned(),
                        e,
                    )
                })?;
                self.lock()?.lookups.0.update(action);
            }
            LazyStateChange::ID => {
                let action: <OhpkmBytesStore as SyncedState>::Action =
                    serde_json::from_value(action).map_err(|e| {
                        Error::unexpeted_condition_with_source(
                            "update_from_frontend: invalid OhpkmBytesStore action received"
                                .to_owned(),
                            e,
                        )
                    })?;
                self.lock()?.lazy_state_change_list.0.update(action);
            }
            _ => {
                return Err(Error::unexpeted_condition(format!(
                    "update_from_frontend: invalid state identifier received - '{state_identifier}'"
                )));
            }
        }

        Ok(())
    }
}

impl Deref for LazyState {
    type Target = Mutex<LazyStateInner>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}