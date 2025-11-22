pub mod sectioned_data;
mod v1;

mod v2;
mod v2_sections;

pub use v1::*;
pub use v2::*;
use wasm_bindgen::JsValue;

type JsResult<T> = core::result::Result<T, JsValue>;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

pub fn console_log<T: ToString>(s: T) {
    log(&s.to_string());
}
