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

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn console_log(s: &str);
}

#[cfg(target_arch = "wasm32")]
pub fn log<T: ToString>(s: T) {
    console_log(&s.to_string());
}

#[cfg(not(target_arch = "wasm32"))]
pub fn log<T: ToString>(s: T) {
    println!("{}", s.to_string());
}

pub fn fatal_log<T: ToString>(s: T) -> ! {
    let message = s.to_string();
    log(&message);
    panic!("{message}");
}

#[macro_export]
macro_rules! log {
    ($($arg:tt)*) => {{
        $crate::log(format!($($arg)*));
    }};
}

#[macro_export]
macro_rules! fatal_log {
    ($($arg:tt)*) => {{
        $crate::fatal_log(format!($($arg)*));
    }};
}

pub trait ExpectLog<T> {
    fn expect_log<S: ToString>(self, msg: S) -> T;
}

impl<T> ExpectLog<T> for Option<T> {
    fn expect_log<S: ToString>(self, msg: S) -> T {
        match self {
            Some(value) => value,
            None => fatal_log(msg),
        }
    }
}

impl<T, E: std::error::Error> ExpectLog<T> for std::result::Result<T, E> {
    fn expect_log<S: ToString>(self, msg: S) -> T {
        match self {
            Ok(value) => value,
            Err(e) => fatal_log(format!("{}: {}", msg.to_string(), e)),
        }
    }
}
