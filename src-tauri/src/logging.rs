use crate::Result;

use tauri::AppHandle;

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
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("debug")))
        .with(file_layer)
        .with(stderr_layer)
        .init();
}

#[derive(serde::Serialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: String,
    pub target: Option<String>,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub event: Option<String>,
    #[serde(skip_serializing_if = "option_null_or_empty")]
    pub fields: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "option_null_or_empty")]
    pub context: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ohpkm_id: Option<String>,
    pub is_tauri: bool,
}

impl LogEntry {
    pub fn from_json(mut v: serde_json::Value) -> Option<Self> {
        let timestamp = v["timestamp"].as_str()?.to_owned();
        let level = v["level"].as_str()?.to_owned();
        let target = v["target"].as_str().map(&str::to_owned);

        let fields = &mut v["fields"];

        let message = fields
            .pop_string("message")
            .unwrap_or(String::from("(empty)"));

        let is_tauri = message.starts_with("[TAURI]");

        let mut context: Option<serde_json::Value> = fields
            .pop_string("context")
            .and_then(|context_json| serde_json::from_str(&context_json).ok());

        let ohpkm_id = fields
            .pop_string("ohpkm_id")
            .or(context.pop_string("ohpkm_id"));

        let event = fields.pop_string("event").or(context.pop_string("event"));

        Some(LogEntry {
            timestamp,
            level,
            target,
            message,
            event,
            is_tauri,
            fields: if *fields == serde_json::Value::Null {
                None
            } else {
                Some(fields.clone())
            },
            context,
            ohpkm_id,
        })
    }
}

#[tauri::command]
pub fn get_logs_today(app: AppHandle) -> Result<Vec<LogEntry>> {
    let content = app.read_file_text(
        DataDir::Logs,
        format!("app.log.{}", Utc::now().format("%Y-%m-%d")),
    )?;

    let entries = content
        .lines()
        .rev() // newest first
        .filter_map(|line| serde_json::from_str::<serde_json::Value>(line).ok())
        .filter_map(LogEntry::from_json)
        .collect();

    Ok(entries)
}

fn option_null_or_empty(value: &Option<serde_json::Value>) -> bool {
    value.as_ref().is_none_or(null_or_empty)
}

fn null_or_empty(value: &serde_json::Value) -> bool {
    match value {
        serde_json::Value::Null => true,
        serde_json::Value::String(s) => s.is_empty(),
        serde_json::Value::Array(a) => a.is_empty(),
        serde_json::Value::Object(o) => o.is_empty(),
        _ => false,
    }
}

fn pop_value(value: &mut serde_json::Value, value_key: &str) -> Option<serde_json::Value> {
    if let Some(obj) = value.as_object_mut()
        && let Some(msg_value) = obj.remove(value_key)
    {
        Some(msg_value)
    } else {
        None
    }
}

trait PopString {
    fn pop_string(&mut self, key: &str) -> Option<String>;
}

impl PopString for serde_json::Value {
    fn pop_string(&mut self, key: &str) -> Option<String> {
        pop_value(self, key)?.as_str().map(str::to_owned)
    }
}

impl PopString for Option<serde_json::Value> {
    fn pop_string(&mut self, key: &str) -> Option<String> {
        self.as_mut().and_then(|v| v.pop_string(key))
    }
}

struct Level(tracing::Level);

impl<'de> serde::Deserialize<'de> for Level {
    fn deserialize<D>(deserializer: D) -> std::prelude::v1::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        deserializer.deserialize_str(LevelVisitor)
    }
}

struct LevelVisitor;

impl<'de> serde::de::Visitor<'de> for LevelVisitor {
    type Value = Level;

    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        formatter.write_str("'trace', 'log', 'info', 'warn', 'error'")
    }

    fn visit_str<E>(self, v: &str) -> std::prelude::v1::Result<Self::Value, E>
    where
        E: serde::de::Error,
    {
        match v {
            "trace" => Ok(Level(tracing::Level::TRACE)),
            "log" => Ok(Level(tracing::Level::DEBUG)),
            "info" => Ok(Level(tracing::Level::INFO)),
            "warn" => Ok(Level(tracing::Level::WARN)),
            "error" => Ok(Level(tracing::Level::ERROR)),
            _ => Err(serde::de::Error::invalid_value(
                serde::de::Unexpected::Str(v),
                &self,
            )),
        }
    }

    fn visit_borrowed_str<E>(self, v: &'de str) -> std::prelude::v1::Result<Self::Value, E>
    where
        E: serde::de::Error,
    {
        match v {
            "trace" => Ok(Level(tracing::Level::TRACE)),
            "log" => Ok(Level(tracing::Level::DEBUG)),
            "info" => Ok(Level(tracing::Level::INFO)),
            "warn" => Ok(Level(tracing::Level::WARN)),
            "error" => Ok(Level(tracing::Level::ERROR)),
            _ => Err(serde::de::Error::invalid_value(
                serde::de::Unexpected::Str(v),
                &self,
            )),
        }
    }
}

#[derive(serde::Deserialize)]
pub struct JsLogEntry {
    level: Level,
    message: String,
    // any extra fields the frontend wants to attach
    context: Option<serde_json::Value>,
}

#[tauri::command]
pub fn log(entry: JsLogEntry) {
    let mut context = entry.context.unwrap_or(serde_json::Value::Null);

    let message = context.pop_string("message").unwrap_or(entry.message);
    let ohpkm_id = context.pop_string("ohpkm_id");
    let event = context.pop_string("event");

    use tracing::Level;
    match entry.level.0 {
        Level::ERROR => tracing::error!(event, ohpkm_id, context = %context, "{}", message),
        Level::WARN => tracing::warn!(event, ohpkm_id, context = %context, "{}", message),
        Level::INFO => tracing::info!(event, ohpkm_id, context = %context, "{}", message),
        Level::DEBUG => tracing::debug!(event, ohpkm_id, context = %context, "{}", message),
        Level::TRACE => tracing::trace!(event, ohpkm_id, context = %context, "{}", message),
    }
}
