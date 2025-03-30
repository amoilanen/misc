//! AES (Advanced Encryption Standard) implementation
//! Based on FIPS 197 specification: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197.pdf

mod tables;
mod transformations;
mod key_expansion;
pub mod cipher;

pub use tables::*;
pub use transformations::*;
pub use key_expansion::*;
pub use cipher::*;

/// AES block size in bytes (128 bits)
pub const BLOCK_SIZE: usize = 16;

/// AES key sizes in bits
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum KeySize {
    /// 128-bit key (AES-128)
    Bits128 = 128,
    /// 192-bit key (AES-192)
    Bits192 = 192,
    /// 256-bit key (AES-256)
    Bits256 = 256,
}

impl TryFrom<usize> for KeySize {
    type Error = &'static str;

    fn try_from(value: usize) -> Result<Self, Self::Error> {
        match value {
            128 => Ok(KeySize::Bits128),
            192 => Ok(KeySize::Bits192),
            256 => Ok(KeySize::Bits256),
            _ => Err("Invalid key size. Must be 128, 192, or 256 bits"),
        }
    }
}

/// AES block type (4x4 matrix of bytes)
#[derive(Debug, Clone)]
pub struct Block {
    state: [[u8; 4]; 4],
    size: usize,
    extra_words: Vec<u8>,
}

impl Block {
    /// Create a new block from a byte array
    pub fn new(bytes: &[u8]) -> Self {
        let mut state = [[0u8; 4]; 4];
        let size = bytes.len();
        let mut extra_words = Vec::new();
        
        // Fill the main state matrix
        for i in 0..4 {
            for j in 0..4 {
                let idx = i * 4 + j;
                if idx < size {
                    state[j][i] = bytes[idx];
                }
            }
        }
        
        // Handle extra words for AES-192 and AES-256
        if size > 16 {
            extra_words = bytes[16..].to_vec();
        }
        
        Block { state, size, extra_words }
    }

    /// Convert block to bytes
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::with_capacity(self.size);
        for i in 0..4 {
            for j in 0..4 {
                let idx = i * 4 + j;
                if idx < self.size {
                    bytes.push(self.state[j][i]);
                }
            }
        }
        bytes.extend(&self.extra_words);
        bytes
    }
}

/// AES encryption modes
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Mode {
    /// Electronic Codebook mode (not recommended for most uses)
    ECB,
    /// Cipher Block Chaining mode (recommended)
    CBC,
}