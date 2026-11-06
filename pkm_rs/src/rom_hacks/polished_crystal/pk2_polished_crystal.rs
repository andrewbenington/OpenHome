use js_sys::{ArrayBuffer, Uint8Array};
use pkm_rs_derive::{IsShiny8192};
use serde::Serialize;
use tsify::Ts;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::wasm_bindgen;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
use crate::convert_strategy::ConvertStrategy;

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = Pk2PolishedCrystalWasm))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny8192)]
pub struct Pk2PolishedCrystal {

  pub secret_id: u16,
  pub trainer_id: u16,
  pub personality_value: u32

}

impl Pk2PolishedCrystal {

  fn from_ohpkm_bytes(ohpkm_bytes: Uint8Array, strategy: Ts<ConvertStrategy>) -> Pk2PolishedCrystal {
    todo!();
  }
}