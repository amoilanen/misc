use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(String),
    #[error("Not a directory: {0}")]
    NotADirectory(String),
    #[error("Path not found: {0}")]
    NotFound(String),
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    #[error("Already exists: {0}")]
    AlreadyExists(String),
    #[error("Invalid name: {0}")]
    InvalidName(String),
    #[error("Operation cancelled")]
    Cancelled,
    #[error("Watcher error: {0}")]
    Watcher(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        match err.kind() {
            std::io::ErrorKind::NotFound => AppError::NotFound(err.to_string()),
            std::io::ErrorKind::PermissionDenied => AppError::PermissionDenied(err.to_string()),
            std::io::ErrorKind::AlreadyExists => AppError::AlreadyExists(err.to_string()),
            _ => AppError::Io(err.to_string()),
        }
    }
}

impl From<notify::Error> for AppError {
    fn from(err: notify::Error) -> Self {
        AppError::Watcher(err.to_string())
    }
}
