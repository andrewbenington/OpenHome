use pkm_rs_derive::{IsShiny8192};
use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::wasm_bindgen;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;


#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = Pk2PolishedCrystalWasm))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy, IsShiny8192)]
pub struct Pk2PolishedCrystal {

  pub secret_id: u16,
  pub trainer_id: u16,
  pub personality_value: u32
}