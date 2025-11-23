use thiserror::Error;

#[derive(Error, Debug)]
pub enum ElysiumError {
    #[error("Invalid transaction: {0}")]
    InvalidTransaction(String),
    
    #[error("Invalid block: {0}")]
    InvalidBlock(String),
    
    #[error("Insufficient balance")]
    InsufficientBalance,
    
    #[error("Invalid signature")]
    InvalidSignature,
    
    #[error("Blockchain error: {0}")]
    BlockchainError(String),
    
    #[error("Serialization error: {0}")]
    SerializationError(String),
}

pub type Result<T> = std::result::Result<T, ElysiumError>;

