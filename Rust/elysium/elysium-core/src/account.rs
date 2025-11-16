use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use ed25519_dalek::{SigningKey, VerifyingKey, Signature, Signer, Verifier};
use rand::rngs::OsRng;
use std::fmt;

/// Account address (32 bytes, hex-encoded)
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Address(String);

impl Address {
    /// Create an address from a verifying key
    pub fn from_verifying_key(key: &VerifyingKey) -> Self {
        let bytes = key.to_bytes();
        let hash = Sha256::digest(&bytes);
        Address(hex::encode(hash))
    }
    
    /// Create an address from hex string
    pub fn from_hex(hex: &str) -> Result<Self, String> {
        if hex.len() != 64 {
            return Err("Address must be 64 hex characters".to_string());
        }
        hex::decode(hex)
            .map_err(|e| format!("Invalid hex: {}", e))
            .map(|_| Address(hex.to_string()))
    }
    
    /// Get address as hex string
    pub fn as_hex(&self) -> &str {
        &self.0
    }
    
    /// Get address as bytes
    pub fn as_bytes(&self) -> Vec<u8> {
        hex::decode(&self.0).unwrap_or_default()
    }
}

impl fmt::Display for Address {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "0x{}", &self.0[..16])
    }
}

/// Account with balance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub address: Address,
    pub balance: u64,
    pub nonce: u64,
}

impl Account {
    pub fn new(address: Address) -> Self {
        Self {
            address,
            balance: 0,
            nonce: 0,
        }
    }
}

/// Key pair for signing transactions
#[derive(Debug, Clone)]
pub struct KeyPair {
    signing_key: SigningKey,
    verifying_key: VerifyingKey,
}

impl KeyPair {
    /// Generate a new random key pair
    pub fn generate() -> Self {
        let signing_key = SigningKey::generate(&mut OsRng);
        let verifying_key = signing_key.verifying_key();
        Self {
            signing_key,
            verifying_key,
        }
    }
    
    /// Get the address for this key pair
    pub fn address(&self) -> Address {
        Address::from_verifying_key(&self.verifying_key)
    }
    
    /// Sign data
    pub fn sign(&self, data: &[u8]) -> Signature {
        self.signing_key.sign(data)
    }
    
    /// Get verifying key
    pub fn verifying_key(&self) -> &VerifyingKey {
        &self.verifying_key
    }
    
    /// Get signing key
    pub fn signing_key(&self) -> &SigningKey {
        &self.signing_key
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_address_generation() {
        let keypair = KeyPair::generate();
        let address = keypair.address();
        assert_eq!(address.as_hex().len(), 64);
    }
    
    #[test]
    fn test_keypair_sign_verify() {
        let keypair = KeyPair::generate();
        let data = b"test data";
        let signature = keypair.sign(data);
        
        assert!(keypair.verifying_key().verify(data, &signature).is_ok());
    }
}

