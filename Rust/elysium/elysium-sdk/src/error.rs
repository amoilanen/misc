use thiserror::Error;

#[derive(Error, Debug)]
pub enum SdkError {
    #[error("HTTP error: {0}")]
    HttpError(#[from] reqwest::Error),
    
    #[error("JSON-RPC error: {0}")]
    JsonRpcError(String),
    
    #[error("Serialization error: {0}")]
    SerializationError(String),
    
    #[error("Invalid address: {0}")]
    InvalidAddress(String),
}

pub type Result<T> = std::result::Result<T, SdkError>;

