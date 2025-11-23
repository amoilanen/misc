use elysium_core::{Block, Transaction, Address, account::KeyPair};
use serde_json::{json, Value};
use crate::{Result, SdkError};
use std::sync::Arc;

/// Elysium SDK client for interacting with the blockchain
pub struct ElysiumClient {
    client: reqwest::Client,
    rpc_url: String,
}

impl ElysiumClient {
    /// Create a new SDK client
    pub fn new(rpc_url: impl Into<String>) -> Self {
        Self {
            client: reqwest::Client::new(),
            rpc_url: rpc_url.into(),
        }
    }
    
    /// Make an RPC call
    async fn call(&self, method: &str, params: Value) -> Result<Value> {
        let request = json!({
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": 1
        });
        
        let response = self.client
            .post(&self.rpc_url)
            .json(&request)
            .send()
            .await?;
        
        let json: Value = response.json().await?;
        
        if let Some(error) = json.get("error") {
            return Err(SdkError::JsonRpcError(
                error.get("message")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Unknown error")
                    .to_string()
            ));
        }
        
        json.get("result")
            .cloned()
            .ok_or_else(|| SdkError::JsonRpcError("No result in response".to_string()))
    }
    
    /// Get the current blockchain height
    pub async fn get_height(&self) -> Result<u64> {
        let result = self.call("elysium_getHeight", json!([])).await?;
        result.as_u64()
            .ok_or_else(|| SdkError::JsonRpcError("Invalid height response".to_string()))
    }
    
    /// Get a block by number
    pub async fn get_block_by_number(&self, number: u64) -> Result<Option<Block>> {
        let result = self.call("elysium_getBlockByNumber", json!([number])).await?;
        
        if result.is_null() {
            return Ok(None);
        }
        
        serde_json::from_value(result)
            .map_err(|e| SdkError::SerializationError(e.to_string()))
    }
    
    /// Get the latest block
    pub async fn get_latest_block(&self) -> Result<Block> {
        let result = self.call("elysium_getLatestBlock", json!([])).await?;
        serde_json::from_value(result)
            .map_err(|e| SdkError::SerializationError(e.to_string()))
    }
    
    /// Get account balance
    pub async fn get_balance(&self, address: &Address) -> Result<u64> {
        let result = self.call("elysium_getBalance", json!([address.as_hex()])).await?;
        result.as_u64()
            .ok_or_else(|| SdkError::JsonRpcError("Invalid balance response".to_string()))
    }
    
    /// Get account nonce
    pub async fn get_nonce(&self, address: &Address) -> Result<u64> {
        let result = self.call("elysium_getNonce", json!([address.as_hex()])).await?;
        result.as_u64()
            .ok_or_else(|| SdkError::JsonRpcError("Invalid nonce response".to_string()))
    }
    
    /// Send a transaction
    pub async fn send_transaction(&self, tx: &Transaction) -> Result<String> {
        let tx_json = serde_json::to_value(tx)
            .map_err(|e| SdkError::SerializationError(e.to_string()))?;
        let result = self.call("elysium_sendTransaction", json!([tx_json])).await?;
        result.as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| SdkError::JsonRpcError("Invalid transaction hash response".to_string()))
    }
    
    /// Get pending transactions
    pub async fn get_pending_transactions(&self) -> Result<Vec<Transaction>> {
        let result = self.call("elysium_getPendingTransactions", json!([])).await?;
        serde_json::from_value(result)
            .map_err(|e| SdkError::SerializationError(e.to_string()))
    }
    
    /// Mine a block
    pub async fn mine_block(&self) -> Result<Block> {
        let result = self.call("elysium_mineBlock", json!([])).await?;
        serde_json::from_value(result)
            .map_err(|e| SdkError::SerializationError(e.to_string()))
    }
    
    /// Create and send a transfer transaction
    pub async fn transfer(&self, from: &KeyPair, to: &Address, amount: u64) -> Result<String> {
        // Get current nonce
        let nonce = self.get_nonce(&from.address()).await?;
        
        // Create transaction
        let mut tx = Transaction::new(
            from.address(),
            to.clone(),
            amount,
            nonce,
        );
        
        // Sign transaction
        tx.sign(from.signing_key())
            .map_err(|e| SdkError::SerializationError(e.to_string()))?;
        
        // Send transaction
        self.send_transaction(&tx).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    #[ignore] // Requires running node
    async fn test_client_creation() {
        let client = ElysiumClient::new("http://127.0.0.1:8545");
        // This test would require a running node
    }
}

