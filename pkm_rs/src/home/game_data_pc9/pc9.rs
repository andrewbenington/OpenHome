use super::PkhPc9Buffer;
use super::pc9_buffer::PkhPc9BufferMut;
use crate::result::{Error, Result};

use num_enum::TryFromPrimitive;
use serde::Serialize;
use strum::EnumString;
use uuid::Uuid;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, TryFromPrimitive, EnumString, Serialize)]
#[repr(u8)]
pub enum ChampionsTransferState {
    #[default]
    None = 0,
    Transferred = 1,
    Returned = 2,
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "PkhPc9DataWasm"))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct HomePc9Data {
    pub transfer_state: ChampionsTransferState,
    pub timestamp_unix_seconds: u64,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tag: Uuid,
}

impl HomePc9Data {
    // ------------------------------------------------------------------
    // Deserialise from a PkhPc9Buffer (the single source of all byte offsets)
    // ------------------------------------------------------------------

    pub fn from_buffer<S: AsRef<[u8]>>(buf: &PkhPc9Buffer<S>) -> Result<Self> {
        let data = HomePc9Data {
            transfer_state: buf
                .transfer_state_raw()
                .try_into()
                .map_err(|e| Error::Other(format!("invalid champions transfer state: {e}")))?,
            timestamp_unix_seconds: buf.timestamp_unix_seconds(),
            tag: Uuid::from_bytes_le(buf.tag_bytes()),
        };
        Ok(data)
    }

    pub fn write_to_box_buffer(&self, buf: &mut PkhPc9BufferMut) {
        buf.set_transfer_state_raw(self.transfer_state as u8);
        buf.set_timestamp_unix_seconds(self.timestamp_unix_seconds);
        buf.set_tag_bytes(&self.tag.to_bytes_le());
    }

    pub fn try_from_bytes(bytes: &[u8]) -> Result<Self> {
        let size = bytes.len();
        match size {
            super::HOME_PC9_DATA_SIZE => Self::from_buffer(&PkhPc9Buffer::new(bytes)),
            _ => Err(Error::buffer_size(super::HOME_PC9_DATA_SIZE, size)),
        }
    }

    pub fn to_bytes(self) -> [u8; super::HOME_PC9_DATA_SIZE] {
        let mut bytes = [0u8; super::HOME_PC9_DATA_SIZE];
        self.write_to_box_buffer(&mut PkhPc9BufferMut::new_mut(&mut bytes));

        bytes
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(js_class = "PkhPc9DataWasm")]
#[allow(clippy::missing_const_for_fn)]
impl HomePc9Data {
    #[wasm_bindgen(getter)]
    pub fn tag_wasm(&self) -> String {
        self.tag.to_string()
    }
}
