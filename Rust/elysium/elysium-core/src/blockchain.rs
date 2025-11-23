use std::collections::{HashMap, HashSet};
use crate::{Block, Transaction, Address, Account, Result, ElysiumError};
use sha2::Sha256;

/// Blockchain state
#[derive(Debug, Clone)]
pub struct Blockchain {
    pub blocks: Vec<Block>,
    pub accounts: HashMap<Address, Account>,
    pub pending_transactions: Vec<Transaction>,
    pub difficulty: u64,
}

impl Blockchain {
    /// Create a new blockchain
    pub fn new(difficulty: u64) -> Self {
        let mut blockchain = Self {
            blocks: Vec::new(),
            accounts: HashMap::new(),
            pending_transactions: Vec::new(),
            difficulty,
        };
        
        // Create genesis block
        blockchain.create_genesis_block();
        blockchain
    }
    
    /// Create the genesis block
    fn create_genesis_block(&mut self) {
        let mut genesis = Block::new(0, "0".repeat(64), self.difficulty);
        genesis.mine();
        self.blocks.push(genesis);
    }
    
    /// Get the latest block
    pub fn latest_block(&self) -> &Block {
        self.blocks.last().unwrap()
    }
    
    /// Get account balance
    pub fn get_balance(&self, address: &Address) -> u64 {
        self.accounts.get(address)
            .map(|acc| acc.balance)
            .unwrap_or(0)
    }
    
    /// Get account nonce
    pub fn get_nonce(&self, address: &Address) -> u64 {
        self.accounts.get(address)
            .map(|acc| acc.nonce)
            .unwrap_or(0)
    }
    
    /// Add a transaction to the pending pool
    pub fn add_transaction(&mut self, tx: Transaction) -> Result<()> {
        // Validate transaction
        self.validate_transaction(&tx)?;
        
        // Check balance
        let balance = self.get_balance(&tx.from);
        if balance < tx.amount {
            return Err(ElysiumError::InsufficientBalance);
        }
        
        // Check nonce
        let nonce = self.get_nonce(&tx.from);
        if tx.nonce != nonce {
            return Err(ElysiumError::InvalidTransaction(
                format!("Invalid nonce: expected {}, got {}", nonce, tx.nonce)
            ));
        }
        
        self.pending_transactions.push(tx);
        Ok(())
    }
    
    /// Validate a transaction with comprehensive security checks
    fn validate_transaction(&self, tx: &Transaction) -> Result<()> {
        // Validate amount
        if tx.amount == 0 {
            return Err(ElysiumError::InvalidTransaction(
                "Transaction amount must be greater than 0".to_string()
            ));
        }
        
        // Validate addresses are not the same (prevent self-transfers that waste resources)
        if tx.from == tx.to {
            return Err(ElysiumError::InvalidTransaction(
                "Sender and receiver addresses cannot be the same".to_string()
            ));
        }
        
        // Verify signature - CRITICAL for security
        tx.verify()?;
        
        // Check for duplicate transactions in pending pool (prevent replay attacks)
        if self.pending_transactions.iter().any(|pending_tx| {
            pending_tx.from == tx.from &&
            pending_tx.nonce == tx.nonce &&
            pending_tx.hash() == tx.hash()
        }) {
            return Err(ElysiumError::InvalidTransaction(
                "Duplicate transaction detected in pending pool".to_string()
            ));
        }
        
        // Check for duplicate transactions in recent blocks (prevent replay attacks)
        // Check last 10 blocks for duplicates
        let recent_blocks = self.blocks.iter().rev().take(10);
        for block in recent_blocks {
            if block.transactions.iter().any(|block_tx| {
                block_tx.from == tx.from &&
                block_tx.nonce == tx.nonce &&
                block_tx.hash() == tx.hash()
            }) {
                return Err(ElysiumError::InvalidTransaction(
                    "Duplicate transaction detected in recent blocks".to_string()
                ));
            }
        }
        
        Ok(())
    }
    
    /// Mine a new block with pending transactions
    pub fn mine_block(&mut self) -> Result<Block> {
        if self.pending_transactions.is_empty() {
            return Err(ElysiumError::BlockchainError(
                "No pending transactions to mine".to_string()
            ));
        }
        
        let latest = self.latest_block();
        let mut new_block = Block::new(
            latest.header.number + 1,
            latest.hash(),
            self.difficulty,
        );
        
        // Move pending transactions to the block
        let transactions = self.pending_transactions.drain(..).collect::<Vec<_>>();
        for tx in &transactions {
            new_block.add_transaction(tx.clone());
        }
        
        // Mine the block
        new_block.mine();
        
        // Validate the block
        new_block.validate()?;
        
        // Apply transactions to state
        self.apply_transactions(&transactions)?;
        
        // Add block to chain
        self.blocks.push(new_block.clone());
        
        Ok(new_block)
    }
    
    /// Apply transactions to the state
    fn apply_transactions(&mut self, transactions: &[Transaction]) -> Result<()> {
        for tx in transactions {
            // Update sender account
            let sender = self.accounts.entry(tx.from.clone())
                .or_insert_with(|| Account::new(tx.from.clone()));
            sender.balance = sender.balance.saturating_sub(tx.amount);
            sender.nonce += 1;
            
            // Update receiver account
            let receiver = self.accounts.entry(tx.to.clone())
                .or_insert_with(|| Account::new(tx.to.clone()));
            receiver.balance += tx.amount;
        }
        
        Ok(())
    }
    
    /// Add a block to the chain (for syncing)
    pub fn add_block(&mut self, block: Block) -> Result<()> {
        // Validate block structure
        block.validate()?;
        
        // Check parent hash
        let latest = self.latest_block();
        if block.header.parent_hash != latest.hash() {
            return Err(ElysiumError::InvalidBlock(
                "Parent hash mismatch".to_string()
            ));
        }
        
        // Validate block number is sequential
        if block.header.number != latest.header.number + 1 {
            return Err(ElysiumError::InvalidBlock(
                format!("Invalid block number: expected {}, got {}", 
                    latest.header.number + 1, block.header.number)
            ));
        }
        
        // Validate all transactions in the block
        for tx in &block.transactions {
            // Verify signature
            tx.verify()?;
            
            // Check balance
            let balance = self.get_balance(&tx.from);
            if balance < tx.amount {
                return Err(ElysiumError::InsufficientBalance);
            }
            
            // Check nonce
            let nonce = self.get_nonce(&tx.from);
            if tx.nonce != nonce {
                return Err(ElysiumError::InvalidTransaction(
                    format!("Invalid nonce: expected {}, got {}", nonce, tx.nonce)
                ));
            }
        }
        
        // Check for duplicate transactions in the block
        let mut seen_hashes = std::collections::HashSet::new();
        for tx in &block.transactions {
            let tx_hash = tx.hash();
            if !seen_hashes.insert(tx_hash) {
                return Err(ElysiumError::InvalidBlock(
                    "Duplicate transaction in block".to_string()
                ));
            }
        }
        
        // Apply transactions to state
        self.apply_transactions(&block.transactions)?;
        
        // Add block
        self.blocks.push(block);
        
        Ok(())
    }
    
    /// Get blockchain height
    pub fn height(&self) -> u64 {
        self.blocks.len() as u64
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::account::KeyPair;
    
    #[test]
    fn test_blockchain_creation() {
        let blockchain = Blockchain::new(1);
        assert_eq!(blockchain.height(), 1); // Genesis block
    }
    
    #[test]
    fn test_add_transaction() {
        let mut blockchain = Blockchain::new(1);
        let keypair1 = KeyPair::generate();
        let keypair2 = KeyPair::generate();
        
        // Give keypair1 some balance
        let mut account = Account::new(keypair1.address());
        account.balance = 100;
        blockchain.accounts.insert(keypair1.address(), account);
        
        let mut tx = Transaction::new(
            keypair1.address(),
            keypair2.address(),
            50,
            0,
        );
        
        // Sign the transaction
        tx.sign(keypair1.signing_key()).unwrap();
        
        assert!(blockchain.add_transaction(tx).is_ok());
    }
    
    #[test]
    fn test_insufficient_balance() {
        let mut blockchain = Blockchain::new(1);
        let keypair1 = KeyPair::generate();
        let keypair2 = KeyPair::generate();
        
        let tx = Transaction::new(
            keypair1.address(),
            keypair2.address(),
            100,
            0,
        );
        
        assert!(blockchain.add_transaction(tx).is_err());
    }
    
    #[test]
    fn test_mine_block() {
        let mut blockchain = Blockchain::new(1);
        let keypair1 = KeyPair::generate();
        let keypair2 = KeyPair::generate();
        
        // Give keypair1 some balance
        let mut account = Account::new(keypair1.address());
        account.balance = 100;
        blockchain.accounts.insert(keypair1.address(), account);
        
        let mut tx = Transaction::new(
            keypair1.address(),
            keypair2.address(),
            50,
            0,
        );
        
        // Sign the transaction
        tx.sign(keypair1.signing_key()).unwrap();
        
        blockchain.add_transaction(tx).unwrap();
        let block = blockchain.mine_block().unwrap();
        
        assert_eq!(block.transactions.len(), 1);
        assert_eq!(blockchain.get_balance(&keypair2.address()), 50);
    }
}

