use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::{
    deprecated,
    error::{OpenHomeError, OpenHomeResult},
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
        Self {
            banks,
            current_bank: 0,
        }
    }
}

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct Bank {
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
}

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct Box {
    pub name: Option<String>,
    pub index: usize,
    pub identifiers: BoxIdentifiers,
}

pub type BoxIdentifiers = HashMap<u8, String>;

#[tauri::command]
pub fn load_banks(app_handle: tauri::AppHandle) -> OpenHomeResult<StoredBankData> {
    util::get_storage_file_json(&app_handle, "banks.json")
}

#[tauri::command]
pub fn write_banks(app_handle: tauri::AppHandle, bank_data: StoredBankData) -> OpenHomeResult<()> {
    util::write_storage_file_json(&app_handle, "banks.json", &bank_data)?;

    // For now, we will also update box-data.json with Bank 1 data to work with previous versions of OpenHome
    let first_bank = bank_data.banks.into_iter().find(|bank| bank.index == 0);
    let Some(first_bank) = first_bank else {
        return Err(OpenHomeError::other(
            "No bank with index 0; Previous versions of OpenHome will not see updated data.",
        ));
    };

    let old_box_data: Vec<deprecated::BoxPreV1_5_0> = first_bank
        .boxes
        .into_iter()
        .map(deprecated::BoxPreV1_5_0::from_current)
        .collect();
    util::write_storage_file_json(&app_handle, "box-data.json", old_box_data)
}
