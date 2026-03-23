mod result;

pub mod abilities;
pub mod ball;
pub mod items;
pub mod language;
pub mod levelup;
pub mod moves;
pub mod natures;
pub mod restrictions;
pub mod ribbons;
pub mod species;
pub mod stats;

pub use result::*;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn console_log(s: &str);
}

#[cfg(feature = "wasm")]
pub fn log<T: ToString>(s: T) {
    console_log(&s.to_string());
}

#[cfg(not(feature = "wasm"))]
pub fn log<T: ToString>(s: T) {
    println!("{}", s.to_string());
}

#[macro_export]
macro_rules! log {
    ($($arg:tt)*) => {{
        $crate::log(format!($($arg)*));
    }};
}
