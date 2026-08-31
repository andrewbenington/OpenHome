use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use pkm_rs::ohpkm::OpenHomeId;

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct OhpkmStorePartial(pub HashMap<OpenHomeId, Vec<u8>>);

impl OhpkmStorePartial {

    // TODO fill these in

    pub fn read() {

    }

    pub fn update() {

    }

    pub fn replace() {

    }

}