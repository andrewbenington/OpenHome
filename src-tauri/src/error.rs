use std::error::Error;
use std::path::Path;
use std::{fmt::Display, path::PathBuf};

use serde::{Serialize, Serializer};

#[derive(Debug)]
pub enum OpenHomeError {
    AppDataAccess {
        source: Box<dyn Error>,
    },
    FileAccess {
        path: PathBuf,
        source: Box<dyn Error>,
    },
    FileDownload {
        url: String,
        source: Box<dyn Error>,
    },
    FileMalformed {
        path: PathBuf,
        source: Box<dyn Error>,
    },
    FileWrite {
        path: PathBuf,
        source: Box<dyn Error>,
    },
    FileMissing {
        path: PathBuf,
    },
    MutexFailure,
    TransactionOpen,
    WindowAccess {
        source: Option<Box<dyn Error>>,
    },
    Other {
        context: String,
        source: Option<Box<dyn Error>>,
    },
}

impl OpenHomeError {
    pub fn appdata<E: Error + 'static>(source: E) -> OpenHomeError {
        OpenHomeError::AppDataAccess {
            source: Box::new(source),
        }
    }

    pub fn file_access<P, E: Error + 'static>(path: P, source: E) -> OpenHomeError
    where
        P: AsRef<Path>,
    {
        OpenHomeError::FileAccess {
            path: path.as_ref().to_path_buf(),
            source: Box::new(source),
        }
    }

    pub fn file_download<E: Error + 'static>(url: &str, source: E) -> OpenHomeError {
        OpenHomeError::FileDownload {
            url: url.to_owned(),
            source: Box::new(source),
        }
    }

    pub fn file_malformed<P, E: Error + 'static>(path: P, source: E) -> OpenHomeError
    where
        P: AsRef<Path>,
    {
        OpenHomeError::FileMalformed {
            path: path.as_ref().to_path_buf(),
            source: Box::new(source),
        }
    }

    pub fn file_missing(path: &Path) -> OpenHomeError {
        OpenHomeError::FileMissing {
            path: path.to_path_buf(),
        }
    }

    pub fn file_write<P, E: Error + 'static>(path: P, source: E) -> OpenHomeError
    where
        P: AsRef<Path>,
    {
        OpenHomeError::FileWrite {
            path: path.as_ref().to_path_buf(),
            source: Box::new(source),
        }
    }

    pub fn other(context: &str) -> OpenHomeError {
        OpenHomeError::Other {
            context: context.to_owned(),
            source: None,
        }
    }

    pub fn other_with_source<E: Error + 'static>(context: &str, source: E) -> OpenHomeError {
        OpenHomeError::Other {
            context: context.to_owned(),
            source: Some(Box::new(source)),
        }
    }
}

impl Display for OpenHomeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let message = match self {
            Self::AppDataAccess { source } => {
                format!("Could not access app data directory: {source}")
            }
            Self::FileAccess { path, source } => format!(
                "File could not be accessed: '{}' ({source})",
                path.to_string_lossy()
            ),
            Self::FileDownload { url, source } => {
                format!("File could not be downloaded: '{url}' ({source})")
            }
            Self::FileMalformed { path, source } => format!(
                "File is malformed or corrupted: '{}' ({source})",
                path.to_string_lossy()
            ),
            Self::FileWrite { path, source } => format!(
                "File could not be written: '{}' ({source})",
                path.to_string_lossy()
            ),
            Self::FileMissing { path } => {
                format!("File does not exist: '{}'", path.to_string_lossy())
            }
            Self::MutexFailure => "Application encountered fatal synchronization error".to_owned(),
            Self::TransactionOpen => {
                "Attempting to open new transaction when one exists".to_owned()
            }
            Self::WindowAccess { source } => match source {
                Some(source) => format!("Could not access app window: {source}"),
                None => "Could not access app window".to_owned(),
            },
            Self::Other { context, source } => match source {
                Some(source) => format!("{context}: {source}"),
                None => context.clone(),
            },
        };

        f.write_str(&message)
    }
}

impl Serialize for OpenHomeError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl Error for OpenHomeError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::AppDataAccess { source }
            | Self::FileAccess { source, .. }
            | Self::FileDownload { source, .. }
            | Self::FileMalformed { source, .. }
            | Self::FileWrite { source, .. } => Some(source.as_ref()),

            Self::WindowAccess { source } | Self::Other { source, .. } => source.as_deref(),

            _ => None,
        }
    }
}

impl<T> From<std::sync::PoisonError<T>> for OpenHomeError {
    fn from(_: std::sync::PoisonError<T>) -> Self {
        OpenHomeError::MutexFailure
    }
}

pub type OpenHomeResult<T> = Result<T, OpenHomeError>;
