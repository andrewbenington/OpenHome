use std::path::Path;
use std::{fmt::Display, path::PathBuf};

use semver::Version;
use serde::{Serialize, Serializer};

type SourceError = Box<dyn std::error::Error + 'static>;

#[derive(Debug)]
pub enum Error {
    DataFolderAccess {
        source: SourceError,
    },
    FileAccess {
        path: PathBuf,
        source: SourceError,
    },
    FileDownload {
        url: String,
        source: SourceError,
    },
    FileMalformed {
        path: PathBuf,
        source: SourceError,
    },
    FileWrite(FileContext),
    FileWrites(Vec<(PathBuf, SourceError)>),
    FileMissing {
        path: PathBuf,
    },
    MutexFailure,
    TransactionOpen,
    UnexpectedCondition {
        context: String,
        source: Option<SourceError>,
    },
    WindowAccess {
        source: Option<SourceError>,
    },
    OutdatedVersion {
        last_opened: Version,
        this_version: Version,
    },
    Other {
        context: String,
        source: Option<SourceError>,
    },
    Tauri(tauri::Error),
}

impl Error {
    pub fn data_folder<E: std::error::Error + 'static>(source: E) -> Self {
        Self::DataFolderAccess {
            source: Box::new(source),
        }
    }

    pub fn file_access<P, E: std::error::Error + 'static>(path: &P, source: E) -> Self
    where
        P: AsRef<Path>,
    {
        Self::FileAccess {
            path: path.as_ref().to_path_buf(),
            source: Box::new(source),
        }
    }

    pub fn file_download<E: std::error::Error + 'static>(url: &str, source: E) -> Self {
        Self::FileDownload {
            url: url.to_owned(),
            source: Box::new(source),
        }
    }

    pub fn file_malformed<P, E: std::error::Error + 'static>(path: &P, source: E) -> Self
    where
        P: AsRef<Path>,
    {
        Self::FileMalformed {
            path: path.as_ref().to_path_buf(),
            source: Box::new(source),
        }
    }

    pub fn file_missing(path: &Path) -> Self {
        Self::FileMissing {
            path: path.to_path_buf(),
        }
    }

    pub fn file_write<P, E: std::error::Error + 'static>(path: &P, source: E) -> Self
    where
        P: AsRef<Path>,
    {
        Self::FileWrite(FileContext::new(path, Some(source)))
    }

    pub fn file_write_no_path<E: std::error::Error + 'static>(source: E) -> Self {
        Self::FileWrite(FileContext::no_path(source))
    }

    pub fn outdated_version(last_opened: Version, this_version: Version) -> Self {
        Self::OutdatedVersion {
            last_opened,
            this_version,
        }
    }

    pub fn other(context: &str) -> Self {
        Self::Other {
            context: context.to_owned(),
            source: None,
        }
    }

    pub fn other_with_source<E: std::error::Error + 'static>(context: &str, source: E) -> Self {
        Self::Other {
            context: context.to_owned(),
            source: Some(Box::new(source)),
        }
    }

    pub fn unexpeted_condition(context: String) -> Self {
        Self::UnexpectedCondition {
            context,
            source: None,
        }
    }

    pub fn unexpeted_condition_with_source<E: std::error::Error + 'static>(
        context: String,
        source: E,
    ) -> Self {
        Self::UnexpectedCondition {
            context,
            source: Some(Box::new(source)),
        }
    }
}

impl Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let message = match self {
            Self::DataFolderAccess { source } => {
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
            Self::FileWrite(context) => format!("File could not be written: {context}"),
            Self::FileWrites(errors) => {
                let mut msg = format!("{} file write errors:", errors.len());

                errors.iter().for_each(|(path, source)| {
                    msg.push_str(&format!(
                        "\nFile could not be written: '{}' ({source})",
                        path.to_string_lossy()
                    ))
                });

                msg
            }
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
            Self::Tauri(source) => {
                format!("Tauri error: ({source})")
            }
            Self::UnexpectedCondition { context, source } => {
                let source_str = source
                    .as_ref()
                    .map(|msg| format!(": {msg}"))
                    .unwrap_or_default();
                format!("UNEXPECTED CONDITION - {context}{source_str}'")
            }
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
            Self::DataFolderAccess { source }
            | Self::FileAccess { source, .. }
            | Self::FileDownload { source, .. }
            | Self::FileMalformed { source, .. } => Some(source.as_ref()),
            Self::FileWrite(context) => context.source.as_deref(),

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

impl From<tauri::Error> for Error {
    fn from(source: tauri::Error) -> Self {
        Self::Tauri(source)
    }
}

impl From<Error> for String {
    fn from(value: Error) -> Self {
        value.to_string()
    }
}

pub type Result<T> = core::result::Result<T, Error>;

#[derive(Debug)]
pub struct FileContext {
    path: Option<PathBuf>,
    source: Option<SourceError>,
}

impl FileContext {
    pub fn new<P, E: std::error::Error + 'static>(path: &P, source: Option<E>) -> Self
    where
        P: AsRef<Path>,
    {
        Self {
            path: Some(path.as_ref().to_path_buf()),
            source: match source {
                Some(e) => Some(Box::new(e)),
                None => None,
            },
        }
    }

    pub fn no_path<E: std::error::Error + 'static>(source: E) -> Self {
        Self {
            path: None,
            source: Some(Box::new(source)),
        }
    }
}

impl Display for FileContext {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match (&self.source, &self.path) {
            (None, None) => f.write_str("(no context provided)"),
            (None, Some(path)) => write!(f, "location: {path:?}"),
            (Some(source), None) => write!(f, "{source}"),
            (Some(source), Some(path)) => write!(f, "{source}; location: {path:?}"),
        }
    }
}
