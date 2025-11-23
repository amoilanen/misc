use crate::Node;
use elysium_core::Result;
use tracing::{info, error};
use std::time::Duration;

/// Miner that continuously mines blocks
pub struct Miner {
    node: Node,
    mining_interval: Duration,
}

impl Miner {
    /// Create a new miner
    pub fn new(node: Node, mining_interval: Duration) -> Self {
        Self {
            node,
            mining_interval,
        }
    }
    
    /// Start mining
    pub async fn start(&self) -> Result<tokio::task::JoinHandle<()>> {
        let node = self.node.clone();
        let interval = self.mining_interval;
        
        let handle = tokio::spawn(async move {
            loop {
                // Check if there are pending transactions
                let has_pending = {
                    let blockchain = node.blockchain().await;
                    !blockchain.pending_transactions.is_empty()
                };
                
                if has_pending {
                    info!("Mining new block...");
                    match node.mine_block().await {
                        Ok(block) => {
                            info!("Mined block: {}", block);
                        }
                        Err(e) => {
                            error!("Error mining block: {}", e);
                        }
                    }
                }
                
                tokio::time::sleep(interval).await;
            }
        });
        
        Ok(handle)
    }
}

