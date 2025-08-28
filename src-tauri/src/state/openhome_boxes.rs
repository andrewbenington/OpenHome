use std::{ops::Deref, sync::Mutex};

use serde::Serialize;

use crate::{error::OpenHomeResult, pkm_storage::Bank};

#[derive(Default, Serialize)]
pub struct OpenHomeBoxStateInner {
    pub current_bank_index: usize,
    pub current_box_index: usize,
    pub banks: Vec<Bank>,
}

pub struct OpenHomeBoxState(pub Mutex<OpenHomeBoxStateInner>);

impl OpenHomeBoxState {
    pub fn new(banks: Vec<Bank>) -> OpenHomeBoxState {
        Self(Mutex::new(OpenHomeBoxStateInner {
            banks,
            ..Default::default()
        }))
    }
}

impl Deref for OpenHomeBoxState {
    type Target = Mutex<OpenHomeBoxStateInner>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl Default for OpenHomeBoxState {
    fn default() -> Self {
        OpenHomeBoxState(Mutex::new(OpenHomeBoxStateInner::default()))
    }
}

#[tauri::command]
async fn set_bank(
    state: tauri::State<'_, OpenHomeBoxState>,
    bank_index: usize,
) -> OpenHomeResult<()> {
    state.lock()?.current_bank_index = bank_index;

    Ok(())
}

#[tauri::command]
async fn set_box(
    state: tauri::State<'_, OpenHomeBoxState>,
    box_index: usize,
) -> OpenHomeResult<()> {
    state.lock()?.current_box_index = box_index;

    Ok(())
}
