use std::fmt::Display;
use std::str::FromStr;

use crate::commands::CommandResult;
use crate::data_controller::ToDataController;
use crate::{Error, Result};
use chrono::{DateTime, NaiveDate, Utc};
use openhome_core::data_controller::{DataController, DataDir};
use serde::Serialize;
use tauri::AppHandle;
use tracing::Subscriber;
use tracing_subscriber::EnvFilter;
use tracing_subscriber::fmt::format::FmtSpan;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

pub fn init_logging<F>(log_dir: &std::path::Path, callback: Option<F>)
where
    F: Fn(NewLogNotification) + Send + Sync + 'static,
{
    // Rolling daily log files suffixed with the date
    let file_appender = tracing_appender::rolling::daily(log_dir, "app.log");
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

    // guard must be kept alive for the lifetime of the app!
    Box::leak(Box::new(guard));

    // JSON layer sent to file
    let file_layer = tracing_subscriber::fmt::layer()
        .json()
        .with_current_span(true)
        .with_span_list(true)
        .with_file(true)
        .with_line_number(true)
        .with_target(true)
        .with_span_events(FmtSpan::CLOSE)
        .with_writer(non_blocking);

    // Human-readable layer sent to console
    let stderr_layer = tracing_subscriber::fmt::layer()
        .pretty()
        .with_writer(std::io::stderr);

    let registry = tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("debug")))
        .with(file_layer)
        .with(stderr_layer);

    // Notification callback if provided. Used to notify Tauri frontend of new logs
    match callback {
        Some(cb) => registry.with(LogNotificationCallback(cb)).init(),
        None => registry.init(),
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize, specta::Type)]
#[serde(rename_all = "UPPERCASE")]
pub enum LogLevel {
    #[serde(alias = "trace")]
    Trace,
    #[serde(alias = "debug")]
    Debug,
    #[serde(alias = "info")]
    Info,
    #[serde(alias = "warn")]
    Warn,
    #[serde(alias = "error")]
    Error,
}

impl FromStr for LogLevel {
    type Err = String;

    fn from_str(s: &str) -> std::prelude::v1::Result<Self, Self::Err> {
        match s.to_uppercase().as_str() {
            "TRACE" => Ok(LogLevel::Trace),
            "DEBUG" => Ok(LogLevel::Debug),
            "INFO" => Ok(LogLevel::Info),
            "WARN" => Ok(LogLevel::Warn),
            "ERROR" => Ok(LogLevel::Error),
            _ => Err(format!("invalid log level: {s}")),
        }
    }
}

impl From<&tracing::Level> for LogLevel {
    fn from(value: &tracing::Level) -> Self {
        use tracing::Level;
        match *value {
            Level::TRACE => Self::Trace,
            Level::DEBUG => Self::Debug,
            Level::INFO => Self::Info,
            Level::WARN => Self::Warn,
            Level::ERROR => Self::Error,
        }
    }
}

impl From<LogLevel> for tracing::Level {
    fn from(value: LogLevel) -> Self {
        use tracing::Level;
        match value {
            LogLevel::Trace => Level::TRACE,
            LogLevel::Debug => Level::DEBUG,
            LogLevel::Info => Level::INFO,
            LogLevel::Warn => Level::WARN,
            LogLevel::Error => Level::ERROR,
        }
    }
}

#[derive(Debug, serde::Serialize, Clone, specta::Type)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: LogLevel,
    #[specta(optional)]
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
        let level: LogLevel = v["level"].as_str()?.parse().ok()?;
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

        let target = if let Some(js_callsite) = context.pop_string("callsite")
            && let Some((function_name, url)) = js_callsite.split_once("@")
        {
            let path_only = url
                .split('/')
                .skip_while(|s| !s.starts_with("src"))
                .collect::<Vec<_>>()
                .join("/");
            Some(format!("{function_name}@{path_only}"))
        } else {
            target
        };

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

    pub fn from_json_str(v: &str) -> Option<Self> {
        serde_json::Value::from_str(v)
            .ok()
            .and_then(Self::from_json)
    }
}

fn log_file_path(date: NaiveDate) -> String {
    format!("app.log.{}", date.format("%Y-%m-%d"))
}

fn try_build_datetime_utc(epoch_seconds: i64) -> Result<DateTime<Utc>> {
    DateTime::from_timestamp(epoch_seconds, 0)
        .map(|dt| dt.with_timezone(&Utc))
        .ok_or(Error::other(&format!(
            "invalid epoch_seconds: {epoch_seconds}"
        )))
}

#[derive(Debug, Clone, serde::Deserialize, specta::Type)]
pub struct LogFilterJs {
    start_epoch_seconds: i64,
    end_epoch_seconds: i64,

    #[specta(optional)]
    ohpkm_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
pub struct LogFilter {
    start: chrono::DateTime<Utc>,
    end: chrono::DateTime<Utc>,

    #[specta(optional)]
    ohpkm_id: Option<String>,
}

impl TryFrom<LogFilterJs> for LogFilter {
    type Error = crate::Error;

    fn try_from(value: LogFilterJs) -> std::prelude::v1::Result<Self, Self::Error> {
        Ok(Self {
            start: try_build_datetime_utc(value.start_epoch_seconds)?,
            end: try_build_datetime_utc(value.end_epoch_seconds)?,
            ohpkm_id: value.ohpkm_id,
        })
    }
}

impl LogFilter {
    fn applies_to(&self, log_entry: &LogEntry) -> bool {
        if let Some(filter_ohpkm_id) = &self.ohpkm_id
            && log_entry
                .ohpkm_id
                .as_ref()
                .is_none_or(|log_ohpkm_id| filter_ohpkm_id != log_ohpkm_id)
        {
            return false;
        }

        let Ok(timestamp) = log_entry.timestamp.parse::<DateTime<Utc>>() else {
            return false;
        };

        if timestamp < self.start || timestamp > self.end {
            return false;
        }

        true
    }

    fn advanced_one_day(&self) -> Self {
        Self {
            start: self.start - chrono::Duration::days(1),
            end: self.start,
            ohpkm_id: self.ohpkm_id.clone(),
        }
    }
}

enum Direction {
    Normal,
    // Reverse,
}

fn load_file_lines(
    data_controller: &impl DataController,
    date: chrono::NaiveDate,
    direction: Direction,
) -> Option<Vec<String>> {
    data_controller
        .read_file_text(DataDir::Logs, log_file_path(date))
        .ok()
        .map(|file_text| match direction {
            Direction::Normal => file_text.lines().map(&str::to_owned).collect(),
            // Direction::Reverse => file_text.lines().rev().map(&str::to_owned).collect(),
        })
}

fn load_file_logs(
    data_controller: &impl DataController,
    filter: &LogFilter,
    date: chrono::NaiveDate,
) -> Option<Vec<LogEntry>> {
    let file_text = data_controller
        .read_file_text(DataDir::Logs, log_file_path(date))
        .ok()?;
    Some(
        file_text
            .lines()
            .rev()
            .filter_map(LogEntry::from_json_str)
            .filter(|log_entry| filter.applies_to(log_entry))
            .collect(),
    )
}

fn load_logs(data_controller: &impl DataController, filter: &LogFilter) -> Result<Vec<LogEntry>> {
    let mut logs = Vec::<LogEntry>::new();
    let mut current_timestamp = filter.end.date_naive();
    while current_timestamp >= filter.start.date_naive() {
        if let Some(file_logs) = load_file_logs(data_controller, filter, current_timestamp) {
            logs.extend_from_slice(&file_logs);
        }
        current_timestamp -= chrono::Duration::days(1);
    }

    Ok(logs)
}

#[derive(Debug, Clone, Serialize, specta::Type)]
pub struct LogsResponse {
    current: LogFilter,
    next: LogFilter,
    remaining_file_lines: Vec<LogEntry>,
}

impl LogsResponse {
    pub fn fetch(data_controller: &impl DataController, filter: LogFilter) -> Result<Self> {
        let next = filter.advanced_one_day();
        load_logs(data_controller, &filter).map(|remaining_file_lines| Self {
            current: filter,
            next,
            remaining_file_lines,
        })
    }
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

#[derive(serde::Deserialize, specta::Type)]
pub struct JsLogEntry {
    level: LogLevel,
    message: String,
    // any extra fields the frontend wants to attach
    #[specta(optional)]
    context: Option<serde_json::Value>,
}

const MAX_COMPONENT_LENGTH: usize = 100000;

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum FrontendLogError {
    EventName,
    Context,
    Message,
}

impl Display for FrontendLogError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            FrontendLogError::EventName => "logging::event_name_too_long",
            FrontendLogError::Context => "logging::context_data_too_large",
            FrontendLogError::Message => "logging::message_too_long",
        })
    }
}

#[derive(serde::Serialize, Clone, Copy)]
pub struct NewLogNotification {
    level: LogLevel,
    timestamp_unix: i64,
}

impl NewLogNotification {
    pub fn now(level: &tracing::Level) -> Self {
        Self {
            level: level.into(),
            timestamp_unix: Utc::now().timestamp(),
        }
    }
}

struct LogNotificationCallback<F>(F)
where
    F: Fn(NewLogNotification) + Send + Sync + 'static;

impl<S, F> tracing_subscriber::Layer<S> for LogNotificationCallback<F>
where
    S: Subscriber,
    F: Fn(NewLogNotification) + Send + Sync + 'static,
{
    fn on_event(
        &self,
        event: &tracing::Event<'_>,
        _ctx: tracing_subscriber::layer::Context<'_, S>,
    ) {
        (self.0)(NewLogNotification::now(event.metadata().level()))
    }
}

#[tauri::command]
#[specta::specta]
pub fn get_logs_today(app: AppHandle, filter: LogFilterJs) -> CommandResult<LogsResponse> {
    let filter = LogFilter::try_from(filter)?;

    Ok(LogsResponse::fetch(&app.controller(), filter)?)
}

fn date_range_inclusive(start: NaiveDate, end: NaiveDate) -> impl Iterator<Item = NaiveDate> {
    std::iter::successors(Some(start), |d| d.checked_add_days(chrono::Days::new(1)))
        .take_while(move |d| *d <= end)
}

#[tauri::command]
#[specta::specta]
pub fn clear_logs_for_range(
    app: AppHandle,
    start_epoch_seconds: i64,
    end_epoch_seconds: i64,
) -> CommandResult<()> {
    let start = try_build_datetime_utc(start_epoch_seconds)?;
    let start_date = start.date_naive();

    let end = try_build_datetime_utc(end_epoch_seconds)?;
    let end_date = start.date_naive();

    let today = Utc::now().date_naive();
    let controller = app.controller();

    for date in date_range_inclusive(start.date_naive(), end.date_naive()) {
        let file_path = log_file_path(date);

        if date == today {
            controller.truncate_file(DataDir::Logs, &file_path)?;
            continue;
        } else if date > start_date && date < end_date {
            controller.delete_file(DataDir::Logs, log_file_path(date))?;
            continue;
        }

        let Some(file_lines) = load_file_lines(&controller, date, Direction::Normal) else {
            continue;
        };

        let lines_in_range: Vec<String> = file_lines
            .into_iter()
            .filter(|line| {
                LogEntry::from_json_str(line).is_none_or(|log| {
                    log.timestamp
                        .parse()
                        .is_ok_and(|timestamp: DateTime<Utc>| (start..end).contains(&timestamp))
                })
            })
            .collect();

        if lines_in_range.is_empty() {
            controller.delete_file(DataDir::Logs, log_file_path(date))?;
        } else {
            controller
                .write_file_text(
                    DataDir::Logs,
                    log_file_path(date),
                    &lines_in_range.join("\n"),
                )
                .map_err(|e| Error::file_write(&file_path, e))?;
        }
    }

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn log(entry: JsLogEntry) {
    let mut context = entry.context.unwrap_or(serde_json::Value::Null);

    let ohpkm_id = context.pop_string("ohpkm_id");

    let event = context.pop_string("event");
    if let Some(event) = &event
        && event.len() > MAX_COMPONENT_LENGTH
    {
        tracing::error!(
            event = %FrontendLogError::EventName,
            ohpkm_id,
            "attempting to log event name of {} characters",
            event.len()
        );
        return;
    }

    let message = context.pop_string("message").unwrap_or(entry.message);
    if message.len() > MAX_COMPONENT_LENGTH {
        tracing::error!(
            event = %FrontendLogError::Message,
            ohpkm_id,
            "attempting to log message of {} characters",
            message.len()
        );
        return;
    }

    let context = match serde_json::to_string(&context) {
        Ok(context_json) if context_json.len() > MAX_COMPONENT_LENGTH => {
            tracing::error!(
            event = %FrontendLogError::Context,
                ohpkm_id,
                "attempting to log context data of {} characters",
                context_json.len()
            );
            return;
        }
        Ok(context_json) => context_json,
        Err(err) => format!("ERROR SERIALIZING LOG CONTEXT: {err}"),
    };

    match entry.level {
        LogLevel::Error => tracing::error!(event, ohpkm_id, context, "{}", message),
        LogLevel::Warn => tracing::warn!(event, ohpkm_id, context, "{}", message),
        LogLevel::Info => tracing::info!(event, ohpkm_id, context, "{}", message),
        LogLevel::Debug => tracing::debug!(event, ohpkm_id, context, "{}", message),
        LogLevel::Trace => tracing::trace!(event, ohpkm_id, context, "{}", message),
    }
}
