use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::{error::OpenHomeResult, util};

pub type BoxIdentifiers = HashMap<u8, String>;

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct Box {
    pub name: Option<String>,
    pub index: usize,
    pub identifiers: BoxIdentifiers,
}

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct Bank {
    name: Option<String>,
    index: usize,
    boxes: Vec<Box>,
}

impl Bank {
    pub fn add_box(&mut self, mut new_box: Box) {
        new_box.index = self.boxes.len();
        self.boxes.push(new_box);
    }
}

pub fn load_banks(app_handle: &tauri::AppHandle) -> OpenHomeResult<Vec<Bank>> {
    util::get_storage_file_json(app_handle, "banks.json")
}
