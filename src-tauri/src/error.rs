use std::path::Path;
use std::{fmt::Display, path::PathBuf};

use semver::Version;
use serde::{Serialize, Serializer};

#[derive(Debug)]
pub enum Error {
    AppDataAccess {
        source: Box<dyn std::error::Error>,
    },
    FileAccess {
        path: PathBuf,
        source: Box<dyn std::error::Error>,
    },
    FileDownload {
        url: String,
        source: Box<dyn std::error::Error>,
    },
    FileMalformed {
        path: PathBuf,
        source: Box<dyn std::error::Error>,
    },
    FileWrite {
        path: PathBuf,
        source: Box<dyn std::error::Error>,
    },
    FileMissing {
        path: PathBuf,
    },
    MutexFailure,
    TransactionOpen,
    WindowAccess {
        source: Option<Box<dyn std::error::Error>>,
    },
    OutdatedVersion {
        last_opened: Version,
        this_version: Version,
    },
    Other {
        context: String,
        source: Option<Box<dyn std::error::Error>>,
    },
}

impl Error {
    pub fn appdata<E: std::error::Error + 'static>(source: E) -> Error {
        Error::AppDataAccess {
            source: Box::new(source),
        }
    }

    pub fn file_access<P, E: std::error::Error + 'static>(path: &P, source: E) -> Error
    where
        P: AsRef<Path>,
    {
        Error::FileAccess {
            path: path.as_ref().to_path_buf(),
            source: Box::new(source),
        }
    }

    pub fn file_download<E: std::error::Error + 'static>(url: &str, source: E) -> Error {
        Error::FileDownload {
            url: url.to_owned(),
            source: Box::new(source),
        }
    }

    pub fn file_malformed<P, E: std::error::Error + 'static>(path: &P, source: E) -> Error
    where
        P: AsRef<Path>,
    {
        Error::FileMalformed {
            path: path.as_ref().to_path_buf(),
            source: Box::new(source),
        }
    }

    pub fn file_missing(path: &Path) -> Error {
        Error::FileMissing {
            path: path.to_path_buf(),
        }
    }

    pub fn file_write<P, E: std::error::Error + 'static>(path: &P, source: E) -> Error
    where
        P: AsRef<Path>,
    {
        Error::FileWrite {
            path: path.as_ref().to_path_buf(),
            source: Box::new(source),
        }
    }

    pub fn outdated_version(last_opened: Version, this_version: Version) -> Error {
        Error::OutdatedVersion {
            last_opened,
            this_version,
        }
    }

    pub fn other(context: &str) -> Error {
        Error::Other {
            context: context.to_owned(),
            source: None,
        }
    }

    pub fn other_with_source<E: std::error::Error + 'static>(context: &str, source: E) -> Error {
        Error::Other {
            context: context.to_owned(),
            source: Some(Box::new(source)),
        }
    }
}

impl Display for Error {
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
            Self::OutdatedVersion {
                last_opened,
                this_version,
            } => format!(
                "Last used version ({last_opened}) is newer than this version ({this_version}). Using this version may corrupt your data. Please use version {last_opened} or later."
            ),
            Self::Other { context, source } => match source {
                Some(source) => format!("{context}: {source}"),
                None => context.clone(),
            },
        };

        f.write_str(&message)
    }
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> core::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl std::error::Error for Error {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
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

impl<T> From<std::sync::PoisonError<T>> for Error {
    fn from(_: std::sync::PoisonError<T>) -> Self {
        Error::MutexFailure
    }
}

pub type Result<T> = core::result::Result<T, Error>;
