use std::path::Path;
use std::path::PathBuf;
use thiserror::Error;

use semver::Version;
use serde::{Serialize, Serializer};

type SourceError = Box<dyn std::error::Error + 'static>;

#[derive(Debug, Error)]
pub enum Error {
    #[error("{0}")]
    PkmRs(#[from] pkm_rs::result::Error),
    #[error("Could not access the OpenHome data directory: {0}")]
    DataFolderAccess(#[from] SourceError),
    #[error("File could not be accessed at '{path:?}': ({source})")]
    FileAccess {
        path: PathBuf,
        #[source]
        source: SourceError,
    },
    #[error("File could not be downloaded: '{url}' ({source})")]
    FileDownload {
        url: String,
        #[source]
        source: SourceError,
    },
    #[error("File is malformed or corrupted at '{path:?}': {source:?}")]
    FileMalformed {
        path: PathBuf,
        #[source]
        source: SourceError,
    },
    #[error("File could not be written: {0}")]
    FileWrite(#[from] ErroredFile),
    #[error("File could not be written: {0:?}")]
    FileWrites(Vec<ErroredFile>),
    #[error("File does not exist: '{path:?}'")]
    FileMissing { path: PathBuf },
    #[error("OpenHome encountered fatal synchronization error")]
    MutexFailure,
    #[error(
        "OpenHome attempted to open a second transaction without closing the first. The application may need to be restarted"
    )]
    TransactionOpen,
    #[error("UNEXPECTED CONDITION - {context}{}'", source.as_ref().map(|msg| format!(": {msg}")).unwrap_or_default())]
    UnexpectedCondition {
        context: String,
        source: Option<SourceError>,
    },
    #[error("Could not access app window: {source:?}")]
    WindowAccess {
        #[source]
        source: Option<SourceError>,
    },
    #[error(
        "Last used version ({last_opened}) is newer than this version ({this_version}). Using this version may corrupt your data. Please use version {last_opened} or later"
    )]
    OutdatedVersion {
        last_opened: Version,
        this_version: Version,
    },
    #[error("{context}: {source:?}")]
    Other {
        context: String,
        #[source]
        source: Option<SourceError>,
    },
}

impl Error {
    pub fn data_folder<E: std::error::Error + 'static>(source: E) -> Self {
        Self::DataFolderAccess(Box::new(source))
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
        Self::FileWrite(ErroredFile::new(path, Some(source)))
    }

    pub fn file_write_no_path<E: std::error::Error + 'static>(source: E) -> Self {
        Self::FileWrite(ErroredFile::no_path(source))
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

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> core::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl<T> From<std::sync::PoisonError<T>> for Error {
    fn from(_: std::sync::PoisonError<T>) -> Self {
        Error::MutexFailure
    }
}

impl From<Error> for String {
    fn from(value: Error) -> Self {
        value.to_string()
    }
}

pub type Result<T> = core::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum ErroredFile {
    #[error("location: {0:?}")]
    PathOnly(PathBuf),
    #[error("{0}")]
    SourceOnly(#[source] SourceError),
    #[error("{0}; location: {1:?}")]
    SourceAndPath(#[source] SourceError, PathBuf),
}

impl ErroredFile {
    pub fn new<P, E: std::error::Error + 'static>(path: &P, source: Option<E>) -> Self
    where
        P: AsRef<Path>,
    {
        let path_buf = path.as_ref().to_path_buf();
        match source {
            Some(source) => Self::SourceAndPath(Box::new(source), path_buf),
            None => Self::PathOnly(path_buf),
        }
    }

    pub fn no_path<E: std::error::Error + 'static>(source: E) -> Self {
        Self::SourceOnly(Box::new(source))
    }
}
