use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use crate::{Transaction, Result, ElysiumError};
use std::fmt;

/// Block header
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockHeader {
    pub number: u64,
    pub parent_hash: String,
    pub transactions_root: String,
    pub state_root: String,
    pub timestamp: u64,
    pub nonce: u64,
    pub difficulty: u64,
}

impl BlockHeader {
    pub fn new(number: u64, parent_hash: String, difficulty: u64) -> Self {
        Self {
            number,
            parent_hash,
            transactions_root: String::new(),
            state_root: String::new(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            nonce: 0,
            difficulty,
        }
    }
    
    /// Calculate hash of the block header
    pub fn hash(&self) -> String {
        let bytes = serde_json::to_vec(self).unwrap_or_default();
        let hash = Sha256::digest(&bytes);
        hex::encode(hash)
    }
    
    /// Check if the block meets the difficulty requirement
    pub fn meets_difficulty(&self) -> bool {
        let hash = self.hash();
        let hash_bytes = hex::decode(&hash).unwrap_or_default();
        
        // Count leading zero bytes
        let leading_zeros = hash_bytes.iter()
            .take_while(|&&b| b == 0)
            .count();
        
        // Difficulty is number of leading zero bytes required
        leading_zeros >= self.difficulty as usize
    }
}

/// Block in the blockchain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub header: BlockHeader,
    pub transactions: Vec<Transaction>,
}

impl Block {
    /// Create a new block
    pub fn new(number: u64, parent_hash: String, difficulty: u64) -> Self {
        let mut block = Self {
            header: BlockHeader::new(number, parent_hash, difficulty),
            transactions: Vec::new(),
        };
        // Initialize transactions root for empty block
        block.update_transactions_root();
        block
    }
    
    /// Add a transaction to the block
    pub fn add_transaction(&mut self, tx: Transaction) {
        self.transactions.push(tx);
        self.update_transactions_root();
    }
    
    /// Update the transactions root hash
    fn update_transactions_root(&mut self) {
        if self.transactions.is_empty() {
            // For empty blocks, use hash of empty string
            let hash = Sha256::digest(b"");
            self.header.transactions_root = hex::encode(hash);
        } else {
            let tx_hashes: Vec<String> = self.transactions.iter()
                .map(|tx| tx.hash())
                .collect();
            let combined = tx_hashes.join("");
            let hash = Sha256::digest(combined.as_bytes());
            self.header.transactions_root = hex::encode(hash);
        }
    }
    
    /// Mine the block (find a nonce that meets difficulty)
    pub fn mine(&mut self) {
        while !self.header.meets_difficulty() {
            self.header.nonce += 1;
        }
    }
    
    /// Get block hash
    pub fn hash(&self) -> String {
        self.header.hash()
    }
    
    /// Validate the block with comprehensive security checks
    pub fn validate(&self) -> Result<()> {
        // Verify difficulty
        if !self.header.meets_difficulty() {
            return Err(ElysiumError::InvalidBlock(
                "Block does not meet difficulty requirement".to_string()
            ));
        }
        
        // Verify transactions root
        // If transactions_root is empty, it means it hasn't been calculated yet
        // Calculate it and compare
        let mut temp_block = self.clone();
        temp_block.update_transactions_root();
        
        if temp_block.header.transactions_root != self.header.transactions_root {
            return Err(ElysiumError::InvalidBlock(
                "Invalid transactions root".to_string()
            ));
        }
        
        // Validate all transactions in the block (if any)
        // Empty blocks (like genesis blocks) are valid
        if !self.transactions.is_empty() {
            for tx in &self.transactions {
                // Verify signature
                tx.verify()?;
            }
            
            // Check for duplicate transactions in the block
            let mut seen_hashes = std::collections::HashSet::new();
            for tx in &self.transactions {
                let tx_hash = tx.hash();
                if !seen_hashes.insert(tx_hash) {
                    return Err(ElysiumError::InvalidBlock(
                        "Duplicate transaction in block".to_string()
                    ));
                }
            }
        }
        
        Ok(())
    }
}

impl fmt::Display for Block {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Block #{} (hash: {}, txs: {})", 
            self.header.number, 
            &self.hash()[..16],
            self.transactions.len())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_block_creation() {
        let block = Block::new(0, "0".repeat(64), 1);
        assert_eq!(block.header.number, 0);
        assert_eq!(block.transactions.len(), 0);
    }
    
    #[test]
    fn test_block_mining() {
        let mut block = Block::new(0, "0".repeat(64), 1);
        block.mine();
        assert!(block.header.meets_difficulty());
    }
    
    #[test]
    fn test_block_validation() {
        let mut block = Block::new(0, "0".repeat(64), 1);
        block.mine();
        // Empty blocks are valid (genesis block)
        assert!(block.validate().is_ok());
    }
}

