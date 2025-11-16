use elysium_node::Node;
use elysium_client::rpc::ElysiumRpcImpl;
use jsonrpc_http_server::{ServerBuilder, Server};
use jsonrpc_core::IoHandler;
use std::net::SocketAddr;
use tracing::info;

/// RPC server for the Elysium blockchain
pub struct RpcServer {
    server: Option<Server>,
}

impl RpcServer {
    /// Create a new RPC server
    pub fn new(node: Node, addr: SocketAddr) -> anyhow::Result<Self> {
        let mut io = IoHandler::new();
        let rpc = ElysiumRpcImpl::new(node);
        let handler = rpc.to_delegate();
        
        io.add_method("elysium_getHeight", {
            let handler = handler.clone();
            move |params| handler("elysium_getHeight".to_string(), params)
        });
        
        io.add_method("elysium_getBlockByNumber", {
            let handler = handler.clone();
            move |params| handler("elysium_getBlockByNumber".to_string(), params)
        });
        
        io.add_method("elysium_getLatestBlock", {
            let handler = handler.clone();
            move |params| handler("elysium_getLatestBlock".to_string(), params)
        });
        
        io.add_method("elysium_getBalance", {
            let handler = handler.clone();
            move |params| handler("elysium_getBalance".to_string(), params)
        });
        
        io.add_method("elysium_getNonce", {
            let handler = handler.clone();
            move |params| handler("elysium_getNonce".to_string(), params)
        });
        
        io.add_method("elysium_sendTransaction", {
            let handler = handler.clone();
            move |params| handler("elysium_sendTransaction".to_string(), params)
        });
        
        io.add_method("elysium_getPendingTransactions", {
            let handler = handler.clone();
            move |params| handler("elysium_getPendingTransactions".to_string(), params)
        });
        
        io.add_method("elysium_mineBlock", {
            let handler = handler.clone();
            move |params| handler("elysium_mineBlock".to_string(), params)
        });
        
        let server = ServerBuilder::new(io)
            .start_http(&addr)
            .map_err(|e| anyhow::anyhow!("Failed to start RPC server: {}", e))?;
        
        info!("RPC server started on {}", addr);
        
        Ok(Self {
            server: Some(server),
        })
    }
    
    /// Wait for the server to finish
    pub fn wait(self) {
        if let Some(server) = self.server {
            server.wait();
        }
    }
    
    /// Start the server in a background task
    pub fn start_async(self) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move {
            self.wait();
        })
    }
}

