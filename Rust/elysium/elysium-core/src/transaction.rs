use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use ed25519_dalek::{VerifyingKey, Signature, Verifier, SigningKey, Signer};
use crate::{Address, Result, ElysiumError};
use std::fmt;

/// Transaction type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TransactionType {
    Transfer,
}

/// Transaction in the blockchain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub from: Address,
    pub to: Address,
    pub amount: u64,
    pub nonce: u64,
    pub transaction_type: TransactionType,
    pub signature: String,
    /// Public key (verifying key) in hex format - required for signature verification
    /// This is public information and necessary to verify the signature
    pub public_key: String,
}

impl Transaction {
    /// Create a new transaction
    pub fn new(from: Address, to: Address, amount: u64, nonce: u64) -> Self {
        Self {
            from,
            to,
            amount,
            nonce,
            transaction_type: TransactionType::Transfer,
            signature: String::new(),
            public_key: String::new(),
        }
    }
    
    /// Sign the transaction
    pub fn sign(&mut self, signing_key: &SigningKey) -> Result<()> {
        let data = self.to_bytes_for_signing();
        let signature = signing_key.sign(&data);
        self.signature = hex::encode(signature.to_bytes());
        
        // Store the public key for verification
        let verifying_key = signing_key.verifying_key();
        self.public_key = hex::encode(verifying_key.to_bytes());
        
        Ok(())
    }
    
    /// Verify the transaction signature using the stored public key
    /// This is the primary verification method for production use
    pub fn verify(&self) -> Result<()> {
        // Check signature is present
        if self.signature.is_empty() {
            return Err(ElysiumError::InvalidSignature);
        }
        
        // Check public key is present
        if self.public_key.is_empty() {
            return Err(ElysiumError::InvalidSignature);
        }
        
        // Decode public key
        let pub_key_bytes = hex::decode(&self.public_key)
            .map_err(|_| ElysiumError::InvalidSignature)?;
        
        let verifying_key = VerifyingKey::from_bytes(&pub_key_bytes.try_into()
            .map_err(|_| ElysiumError::InvalidSignature)?)
            .map_err(|_| ElysiumError::InvalidSignature)?;
        
        // Verify address matches public key
        let expected_address = Address::from_verifying_key(&verifying_key);
        if expected_address != self.from {
            return Err(ElysiumError::InvalidTransaction(
                "Address does not match public key".to_string()
            ));
        }
        
        // Verify signature
        let data = self.to_bytes_for_signing();
        let sig_bytes = hex::decode(&self.signature)
            .map_err(|_| ElysiumError::InvalidSignature)?;
        
        let signature = Signature::from_bytes(&sig_bytes.try_into()
            .map_err(|_| ElysiumError::InvalidSignature)?);
        
        verifying_key.verify(&data, &signature)
            .map_err(|_| ElysiumError::InvalidSignature)?;
        
        Ok(())
    }
    
    /// Verify the transaction signature with an explicit verifying key
    /// Useful for testing or when you already have the key
    pub fn verify_with_key(&self, verifying_key: &VerifyingKey) -> Result<()> {
        let data = self.to_bytes_for_signing();
        let sig_bytes = hex::decode(&self.signature)
            .map_err(|_| ElysiumError::InvalidSignature)?;
        
        let signature = Signature::from_bytes(&sig_bytes.try_into()
            .map_err(|_| ElysiumError::InvalidSignature)?);
        
        verifying_key.verify(&data, &signature)
            .map_err(|_| ElysiumError::InvalidSignature)?;
        
        Ok(())
    }
    
    /// Get transaction hash
    pub fn hash(&self) -> String {
        let bytes = serde_json::to_vec(self).unwrap_or_default();
        let hash = Sha256::digest(&bytes);
        hex::encode(hash)
    }
    
    /// Convert transaction to bytes for signing
    fn to_bytes_for_signing(&self) -> Vec<u8> {
        let mut data = Vec::new();
        data.extend_from_slice(self.from.as_bytes().as_slice());
        data.extend_from_slice(self.to.as_bytes().as_slice());
        data.extend_from_slice(&self.amount.to_be_bytes());
        data.extend_from_slice(&self.nonce.to_be_bytes());
        data
    }
}

impl fmt::Display for Transaction {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Tx({} -> {}, amount: {}, nonce: {})", 
            self.from, self.to, self.amount, self.nonce)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::account::KeyPair;
    
    #[test]
    fn test_transaction_creation() {
        let keypair1 = KeyPair::generate();
        let keypair2 = KeyPair::generate();
        
        let mut tx = Transaction::new(
            keypair1.address(),
            keypair2.address(),
            100,
            0,
        );
        
        assert_eq!(tx.amount, 100);
        assert_eq!(tx.nonce, 0);
    }
    
    #[test]
    fn test_transaction_hash() {
        let keypair1 = KeyPair::generate();
        let keypair2 = KeyPair::generate();
        
        let tx1 = Transaction::new(
            keypair1.address(),
            keypair2.address(),
            100,
            0,
        );
        
        let tx2 = Transaction::new(
            keypair1.address(),
            keypair2.address(),
            100,
            0,
        );
        
        // Same transactions should have same hash (before signing)
        assert_eq!(tx1.hash(), tx2.hash());
    }
}

