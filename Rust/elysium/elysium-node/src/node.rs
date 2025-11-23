use elysium_core::{Blockchain, Block, Transaction, Result};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, error};

/// Blockchain node
#[derive(Clone)]
pub struct Node {
    blockchain: Arc<RwLock<Blockchain>>,
    is_mining: Arc<RwLock<bool>>,
}

impl Node {
    /// Create a new node
    pub fn new(difficulty: u64) -> Self {
        Self {
            blockchain: Arc::new(RwLock::new(Blockchain::new(difficulty))),
            is_mining: Arc::new(RwLock::new(false)),
        }
    }
    
    /// Get the blockchain
    pub async fn blockchain(&self) -> tokio::sync::RwLockReadGuard<'_, Blockchain> {
        self.blockchain.read().await
    }
    
    /// Get mutable blockchain
    pub async fn blockchain_mut(&self) -> tokio::sync::RwLockWriteGuard<'_, Blockchain> {
        self.blockchain.write().await
    }
    
    /// Add a transaction
    pub async fn add_transaction(&self, tx: Transaction) -> Result<()> {
        let mut blockchain = self.blockchain.write().await;
        blockchain.add_transaction(tx)
    }
    
    /// Mine a block
    pub async fn mine_block(&self) -> Result<Block> {
        let mut blockchain = self.blockchain.write().await;
        blockchain.mine_block()
    }
    
    /// Add a block (for syncing)
    pub async fn add_block(&self, block: Block) -> Result<()> {
        let mut blockchain = self.blockchain.write().await;
        blockchain.add_block(block)
    }
    
    /// Get blockchain height
    pub async fn height(&self) -> u64 {
        let blockchain = self.blockchain.read().await;
        blockchain.height()
    }
    
    /// Check if node is mining
    pub async fn is_mining(&self) -> bool {
        *self.is_mining.read().await
    }
    
    /// Set mining status
    pub async fn set_mining(&self, mining: bool) {
        *self.is_mining.write().await = mining;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use elysium_core::account::KeyPair;
    
    #[tokio::test]
    async fn test_node_creation() {
        let node = Node::new(1);
        assert_eq!(node.height().await, 1); // Genesis block
    }
    
    #[tokio::test]
    async fn test_node_add_transaction() {
        let node = Node::new(1);
        let keypair1 = KeyPair::generate();
        let keypair2 = KeyPair::generate();
        
        // Give keypair1 some balance
        let mut blockchain = node.blockchain_mut().await;
        let mut account = elysium_core::Account::new(keypair1.address());
        account.balance = 100;
        blockchain.accounts.insert(keypair1.address(), account);
        drop(blockchain);
        
        let tx = Transaction::new(
            keypair1.address(),
            keypair2.address(),
            50,
            0,
        );
        
        assert!(node.add_transaction(tx).await.is_ok());
    }
}

