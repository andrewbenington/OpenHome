pub mod sectioned_data;
mod v1;

mod v2;
mod v2_sections;

pub use v1::*;
pub use v2::*;
#[cfg(feature = "wasm")]
use wasm_bindgen::JsValue;

#[cfg(feature = "wasm")]
type JsResult<T> = core::result::Result<T, JsValue>;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn console_log(s: &str);
}

pub fn log<T: ToString>(s: T) {
    #[cfg(not(feature = "wasm"))]
    println!("{}", s.to_string());

    #[cfg(feature = "wasm")]
    console_log(&s.to_string());
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = updatePidIfWouldBecomeShinyGen345))]
#[allow(clippy::missing_const_for_fn)]
pub fn update_pid_if_would_become_shiny_gen_345(pid: u32, tid: u16, sid: u16) -> u32 {
    if !is_shiny_gen_3_to_5(pid, tid, sid) && is_shiny_gen_6_plus(pid, tid, sid) {
        log(format!(
            "ALTERING PID: {pid} (shiny xor value: {})",
            shiny_xor_value(pid, tid, sid)
        ));
        pid ^ 0x10000000
    } else {
        log(format!("KEEPING PID: {pid}"));
        pid
    }
}

const fn shiny_xor_value(pid: u32, tid: u16, sid: u16) -> u16 {
    ((pid & 0xffff) as u16) ^ (((pid >> 16) & 0xffff) as u16) ^ tid ^ sid
}

const fn is_shiny_gen_3_to_5(pid: u32, tid: u16, sid: u16) -> bool {
    shiny_xor_value(pid, tid, sid) < 8
}

const fn is_shiny_gen_6_plus(pid: u32, tid: u16, sid: u16) -> bool {
    shiny_xor_value(pid, tid, sid) < 16
}
