use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    deprecated,
    error::{Error, Result},
    util,
};

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct StoredBankData {
    banks: Vec<Bank>,
    #[serde(default)]
    current_bank: usize,
}

impl StoredBankData {
    pub fn from_banks(banks: Vec<Bank>) -> Self {
        let mut bank_data = StoredBankData {
            banks,
            current_bank: 0,
        };
        bank_data.reset_box_indices();

        bank_data
    }

    pub fn create_with_default_bank() -> Self {
        Self {
            banks: vec![Bank::default()],
            current_bank: 0,
        }
    }

    fn reset_box_indices(&mut self) {
        self.banks.iter_mut().for_each(Bank::reset_box_indices);
    }

    fn order_boxes_by_indices(&mut self) {
        self.banks.iter_mut().for_each(Bank::order_boxes_by_indices);
    }
}

fn default_id() -> Uuid {
    Uuid::new_v4()
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Bank {
    #[serde(default = "default_id")]
    id: Uuid,
    name: Option<String>,
    index: usize,
    boxes: Vec<Box>,
    #[serde(default)]
    current_box: usize,
}

impl Bank {
    pub fn add_box(&mut self, mut new_box: Box) {
        new_box.index = self.boxes.len();
        self.boxes.push(new_box);
    }

    fn reset_box_indices(&mut self) {
        self.boxes
            .iter_mut()
            .enumerate()
            .for_each(|(index, b)| b.index = index);
    }

    fn order_boxes_by_indices(&mut self) {
        self.boxes.sort_by_key(|b| b.index);
    }
}

impl Default for Bank {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4(),
            name: None,
            boxes: (0..30).map(Box::new).collect(),
            current_box: 0,
            index: 0,
        }
    }
}

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct Box {
    #[serde(default = "default_id")]
    pub id: Uuid,
    pub name: Option<String>,
    pub index: usize,
    pub identifiers: BoxIdentifiers,
    pub customization: Option<BoxCustomization>,
}

impl Box {
    pub fn new(index: usize) -> Self {
        Self {
            id: Uuid::new_v4(),
            index,
            ..Default::default()
        }
    }
}

pub type BoxIdentifiers = HashMap<u8, String>;

#[tauri::command]
pub fn load_banks(app_handle: tauri::AppHandle) -> Result<StoredBankData> {
    let mut storage: StoredBankData = util::get_storage_file_json(&app_handle, "banks.json")?;
    if storage.banks.is_empty() {
        storage = StoredBankData::create_with_default_bank();
    }

    storage.reset_box_indices();

    Ok(storage)
}

#[tauri::command]
pub fn write_banks(app_handle: tauri::AppHandle, mut bank_data: StoredBankData) -> Result<()> {
    bank_data.order_boxes_by_indices();
    bank_data.reset_box_indices();

    util::write_storage_file_json(&app_handle, "banks.json", &bank_data)
}

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct BoxCustomization {
    pub color: Option<String>,
    pub image: Option<String>,
}
