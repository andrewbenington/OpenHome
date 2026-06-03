use crate::Result;

use tauri::AppHandle;
use tracing::info;

use crate::data_controller::{DataController, DataDir};
use chrono::Utc;
use tracing_subscriber::EnvFilter;
use tracing_subscriber::fmt::format::FmtSpan;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

pub fn init_logging(log_dir: &std::path::Path) {
    // Non-blocking rolling daily file writer
    let file_appender = tracing_appender::rolling::daily(log_dir, "app.log");
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

    // guard must be kept alive for the lifetime of the app!
    Box::leak(Box::new(guard));

    // JSON layer → file (structured, queryable)
    let file_layer = tracing_subscriber::fmt::layer()
        .json()
        .with_current_span(true)
        .with_span_list(true)
        .with_file(true)
        .with_line_number(true)
        .with_target(true)
        .with_span_events(FmtSpan::CLOSE)
        .with_writer(non_blocking);

    // Human-readable layer → stderr (dev only)
    let stderr_layer = tracing_subscriber::fmt::layer()
        .pretty()
        .with_writer(std::io::stderr);

    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with(file_layer)
        .with(stderr_layer)
        .init();
}

#[derive(serde::Serialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: String,
    pub target: String,
    pub message: String,
    pub fields: serde_json::Value,
}

#[tauri::command]
pub fn get_logs_today(app: AppHandle) -> Result<Vec<LogEntry>> {
    info!("getting logs");
    let content = app.read_file_text(
        DataDir::Logs,
        format!("app.log.{}", Utc::now().format("%Y-%m-%d")),
    )?;

    let entries = content
        .lines()
        .rev() // newest first
        .filter_map(|line| serde_json::from_str::<serde_json::Value>(line).ok())
        .filter_map(|v| {
            Some(LogEntry {
                timestamp: v["timestamp"].as_str()?.to_string(),
                level: v["level"].as_str()?.to_string(),
                target: v["target"].as_str().unwrap_or("").to_string(),
                message: v["fields"]["message"].as_str().unwrap_or("").to_string(),
                fields: v["fields"].clone(),
            })
        })
        .collect();

    Ok(entries)
}

#[derive(serde::Deserialize)]
pub struct JsLogEntry {
    level: String,
    message: String,
    // any extra fields the frontend wants to attach
    fields: Option<serde_json::Value>,
}

#[tauri::command]
pub fn log(entry: JsLogEntry) {
    let fields = entry.fields.unwrap_or(serde_json::Value::Null);

    info!("received command: {fields:?}");

    match entry.level.to_lowercase().as_str() {
        "error" => tracing::error!(source = "js", fields = %fields, "{}", entry.message),
        "warn" => tracing::warn! (source = "js", fields = %fields, "{}", entry.message),
        "info" => tracing::info! (source = "js", fields = %fields, "{}", entry.message),
        "debug" => tracing::debug!(source = "js", fields = %fields, "{}", entry.message),
        "trace" => tracing::trace!(source = "js", fields = %fields, "{}", entry.message),
        _ => tracing::info! (source = "js", fields = %fields, "{}", entry.message),
    }
}
