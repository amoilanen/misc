use std::net::SocketAddr;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::{TcpListener, TcpStream};
use serde::{Serialize, Deserialize};
use crate::{NodeId, NodeInfo, DhtNode, ALPHA};
use crate::utils::random_port;

#[derive(Debug, Serialize, Deserialize)]
pub enum RpcRequest {
    Ping,
    FindNode(NodeId),
    Store(NodeId, Vec<u8>),
    FindValue(NodeId),
}

#[derive(Debug, Serialize, Deserialize)]
pub enum RpcResponse {
    Pong,
    Nodes(Vec<NodeInfo>),
    Value(Vec<u8>),
    NotFound,
}

pub struct RpcServer {
    node: DhtNode,
}

impl RpcServer {
    pub fn new(node: DhtNode) -> Self {
        Self { node }
    }

    pub async fn start(&self) -> Result<(), Box<dyn std::error::Error>> {
        let listener = TcpListener::bind(self.node.addr).await?;
        println!("RPC server listening on {}", self.node.addr);

        loop {
            let (stream, _) = listener.accept().await?;
            let node = self.node.clone();
            tokio::spawn(async move {
                if let Err(e) = Self::handle_connection(stream, node).await {
                    eprintln!("Error handling connection: {}", e);
                }
            });
        }
    }

    async fn handle_connection(stream: TcpStream, node: DhtNode) -> Result<(), Box<dyn std::error::Error>> {
        let (r, mut w) = stream.into_split();
        let mut reader = BufReader::new(r);
        let mut line = String::new();

        while reader.read_line(&mut line).await? > 0 {
            let request: RpcRequest = serde_json::from_str(&line)?;
            let response = Self::handle_request(&node, request).await?;
            w.write_all(serde_json::to_string(&response)?.as_bytes()).await?;
            w.write_all(b"\n").await?;
            line.clear();
        }

        Ok(())
    }

    async fn handle_request(node: &DhtNode, request: RpcRequest) -> Result<RpcResponse, Box<dyn std::error::Error>> {
        match request {
            RpcRequest::Ping => Ok(RpcResponse::Pong),
            
            RpcRequest::FindNode(target) => {
                let routing_table = node.routing_table.lock().await;
                let nodes = routing_table.find_closest(&target, ALPHA);
                Ok(RpcResponse::Nodes(nodes))
            }

            RpcRequest::Store(key, value) => {
                let mut storage = node.storage.lock().await;
                storage.store(key, value, None);
                Ok(RpcResponse::Pong)
            }

            RpcRequest::FindValue(key) => {
                let storage = node.storage.lock().await;
                match storage.get(&key) {
                    Some(value) => Ok(RpcResponse::Value(value.to_vec())),
                    None => Ok(RpcResponse::NotFound),
                }
            }
        }
    }
}

pub struct RpcClient {
    addr: SocketAddr,
}

impl RpcClient {
    pub fn new(addr: SocketAddr) -> Self {
        Self { addr }
    }

    pub async fn send_request(&self, request: RpcRequest) -> Result<RpcResponse, Box<dyn std::error::Error>> {
        let mut stream = TcpStream::connect(self.addr).await?;
        let request_str = serde_json::to_string(&request)?;
        stream.write_all(request_str.as_bytes()).await?;
        stream.write_all(b"\n").await?;

        let mut reader = BufReader::new(stream);
        let mut line = String::new();
        reader.read_line(&mut line).await?;
        
        Ok(serde_json::from_str(&line)?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{IpAddr, Ipv4Addr};
    use tokio::runtime::Runtime;
    use std::sync::Arc;
    use tokio::sync::Mutex;
    use crate::{DhtNode, routing::RoutingTable, storage::Storage};

    fn create_test_node() -> DhtNode {
        let port = random_port(4000, 5000);
        let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), port);
        DhtNode::new(addr)
    }

    #[tokio::test]
    async fn test_rpc_client_server_basic() {
        let node = create_test_node();
        let server = RpcServer::new(node.clone());
        
        // Start server in background
        let server_handle = tokio::spawn(async move {
            server.start().await.unwrap();
        });

        // Give server time to start
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        // Test ping
        let client = RpcClient::new(node.addr);
        let response = client.send_request(RpcRequest::Ping).await.unwrap();
        assert!(matches!(response, RpcResponse::Pong));

        // Test find node
        let target = NodeId::random();
        let response = client.send_request(RpcRequest::FindNode(target.clone())).await.unwrap();
        assert!(matches!(response, RpcResponse::Nodes(_)));

        // Test store and find value
        let key = NodeId::random();
        let value = b"test value".to_vec();
        
        let response = client.send_request(RpcRequest::Store(key.clone(), value.clone())).await.unwrap();
        assert!(matches!(response, RpcResponse::Pong));

        let response = client.send_request(RpcRequest::FindValue(key)).await.unwrap();
        match response {
            RpcResponse::Value(v) => assert_eq!(v, value),
            _ => panic!("Expected Value response"),
        }

        // Cleanup
        server_handle.abort();
    }

    #[tokio::test]
    async fn test_rpc_error_handling() {
        let client = RpcClient::new(SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 9999));
        
        // Test connection error
        let result = client.send_request(RpcRequest::Ping).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_rpc_concurrent_requests() {
        let node = create_test_node();
        let server = RpcServer::new(node.clone());
        
        // Start server in background
        let server_handle = tokio::spawn(async move {
            server.start().await.unwrap();
        });

        // Give server time to start
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        // Send multiple concurrent requests
        let mut handles = Vec::new();
        for i in 0..5 {
            let client = RpcClient::new(node.addr);
            let key = NodeId::random();
            let value = format!("test value {}", i).into_bytes();
            
            handles.push(tokio::spawn(async move {
                let response = client.send_request(RpcRequest::Store(key.clone(), value.clone())).await.unwrap();
                assert!(matches!(response, RpcResponse::Pong));
                
                let response = client.send_request(RpcRequest::FindValue(key)).await.unwrap();
                match response {
                    RpcResponse::Value(v) => assert_eq!(v, value),
                    _ => panic!("Expected Value response"),
                }
            }));
        }

        // Wait for all requests to complete
        for handle in handles {
            handle.await.unwrap();
        }

        // Cleanup
        server_handle.abort();
    }
} 