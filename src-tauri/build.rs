use std::env;
use std::fmt::Write;
use std::fs;
use std::path::{Path, PathBuf};

fn main() {
    tauri_build::build();
}
