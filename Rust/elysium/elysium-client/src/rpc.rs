use elysium_core::{Block, Transaction, Address};
use elysium_node::Node;
use jsonrpc_core::{Error, ErrorCode, Result as JsonRpcResult, Params, Value};
use std::sync::Arc;

/// RPC methods implementation for the Elysium blockchain
pub struct ElysiumRpcMethods {
    node: Node,
}

impl ElysiumRpcMethods {
    pub fn new(node: Node) -> Self {
        Self { node }
    }
    
    pub fn get_height(&self) -> JsonRpcResult<u64> {
        let rt = tokio::runtime::Runtime::new()
            .map_err(|_| Error::internal_error())?;
        rt.block_on(async {
            Ok(self.node.height().await)
        })
    }
    
    pub fn get_block_by_number(&self, number: u64) -> JsonRpcResult<Option<Block>> {
        let rt = tokio::runtime::Runtime::new()
            .map_err(|_| Error::internal_error())?;
        rt.block_on(async {
            let blockchain = self.node.blockchain().await;
            Ok(blockchain.blocks.get(number as usize).cloned())
        })
    }
    
    pub fn get_latest_block(&self) -> JsonRpcResult<Block> {
        let rt = tokio::runtime::Runtime::new()
            .map_err(|_| Error::internal_error())?;
        rt.block_on(async {
            let blockchain = self.node.blockchain().await;
            Ok(blockchain.latest_block().clone())
        })
    }
    
    pub fn get_balance(&self, address: String) -> JsonRpcResult<u64> {
        let rt = tokio::runtime::Runtime::new()
            .map_err(|_| Error::internal_error())?;
        rt.block_on(async {
            let addr = Address::from_hex(&address)
                .map_err(|_| Error::invalid_params("Invalid address"))?;
            let blockchain = self.node.blockchain().await;
            Ok(blockchain.get_balance(&addr))
        })
    }
    
    pub fn get_nonce(&self, address: String) -> JsonRpcResult<u64> {
        let rt = tokio::runtime::Runtime::new()
            .map_err(|_| Error::internal_error())?;
        rt.block_on(async {
            let addr = Address::from_hex(&address)
                .map_err(|_| Error::invalid_params("Invalid address"))?;
            let blockchain = self.node.blockchain().await;
            Ok(blockchain.get_nonce(&addr))
        })
    }
    
    pub fn send_transaction(&self, tx: Transaction) -> JsonRpcResult<String> {
        let rt = tokio::runtime::Runtime::new()
            .map_err(|_| Error::internal_error())?;
        rt.block_on(async {
            self.node.add_transaction(tx.clone())
                .await
                .map_err(|_| Error::invalid_params("Transaction failed"))?;
            Ok(tx.hash())
        })
    }
    
    pub fn get_pending_transactions(&self) -> JsonRpcResult<Vec<Transaction>> {
        let rt = tokio::runtime::Runtime::new()
            .map_err(|_| Error::internal_error())?;
        rt.block_on(async {
            let blockchain = self.node.blockchain().await;
            Ok(blockchain.pending_transactions.clone())
        })
    }
    
    pub fn mine_block(&self) -> JsonRpcResult<Block> {
        let rt = tokio::runtime::Runtime::new()
            .map_err(|_| Error::internal_error())?;
        rt.block_on(async {
            self.node.mine_block()
                .await
                .map_err(|_| Error::internal_error())
        })
    }
}

/// RPC implementation wrapper for jsonrpc
pub struct ElysiumRpcImpl {
    methods: Arc<ElysiumRpcMethods>,
}

impl ElysiumRpcImpl {
    pub fn new(node: Node) -> Self {
        Self {
            methods: Arc::new(ElysiumRpcMethods::new(node)),
        }
    }
    
    pub fn to_delegate(self) -> impl Fn(String, Params) -> jsonrpc_core::BoxFuture<jsonrpc_core::Result<Value>> + Clone {
        let methods = self.methods.clone();
        move |method, params| {
            let methods = methods.clone();
            Box::pin(async move {
                match method.as_str() {
                    "elysium_getHeight" => {
                        let result = methods.get_height()?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                    "elysium_getBlockByNumber" => {
                        let params: Vec<Value> = params.parse()
                            .map_err(|_| Error::invalid_params("Invalid params"))?;
                        let number = params[0].as_u64()
                            .ok_or_else(|| Error::invalid_params("Invalid block number"))?;
                        let result = methods.get_block_by_number(number)?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                    "elysium_getLatestBlock" => {
                        let result = methods.get_latest_block()?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                    "elysium_getBalance" => {
                        let params: Vec<Value> = params.parse()
                            .map_err(|_| Error::invalid_params("Invalid params"))?;
                        let address = params[0].as_str()
                            .ok_or_else(|| Error::invalid_params("Invalid address"))?;
                        let result = methods.get_balance(address.to_string())?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                    "elysium_getNonce" => {
                        let params: Vec<Value> = params.parse()
                            .map_err(|_| Error::invalid_params("Invalid params"))?;
                        let address = params[0].as_str()
                            .ok_or_else(|| Error::invalid_params("Invalid address"))?;
                        let result = methods.get_nonce(address.to_string())?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                    "elysium_sendTransaction" => {
                        let params: Vec<Value> = params.parse()
                            .map_err(|_| Error::invalid_params("Invalid params"))?;
                        let tx: Transaction = serde_json::from_value(params[0].clone())
                            .map_err(|_| Error::invalid_params("Invalid transaction"))?;
                        let result = methods.send_transaction(tx)?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                    "elysium_getPendingTransactions" => {
                        let result = methods.get_pending_transactions()?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                    "elysium_mineBlock" => {
                        let result = methods.mine_block()?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                    _ => Err(Error::method_not_found()),
                }
            })
        }
    }
}
