use std::net::SocketAddr;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::{TcpListener, TcpStream};
use serde::{Serialize, Deserialize};
use crate::{DhtKey, NodeInfo, DhtNode, ALPHA};
use crate::utils::random_port;
use std::fmt;
use tokio::task::JoinError;

#[derive(Debug)]
pub enum RpcError {
    IoError(std::io::Error),
    SerializationError(serde_json::Error),
    ConnectionError(String),
    StorageError(String),
}

impl std::fmt::Display for RpcError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RpcError::IoError(e) => write!(f, "IO error: {}", e),
            RpcError::SerializationError(e) => write!(f, "Serialization error: {}", e),
            RpcError::ConnectionError(e) => write!(f, "Connection error: {}", e),
            RpcError::StorageError(e) => write!(f, "Storage error: {}", e),
        }
    }
}

impl std::error::Error for RpcError {}

impl From<std::io::Error> for RpcError {
    fn from(err: std::io::Error) -> Self {
        RpcError::IoError(err)
    }
}

impl From<serde_json::Error> for RpcError {
    fn from(err: serde_json::Error) -> Self {
        RpcError::SerializationError(err)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub enum RpcRequest {
    Ping,
    FindNode(DhtKey),
    Store(DhtKey, Vec<u8>),
    FindValue(DhtKey),
    GetNodeId(DhtKey),
}

#[derive(Debug, Serialize, Deserialize)]
pub enum RpcResponse {
    Pong,
    Nodes(Vec<NodeInfo>),
    Value(Vec<u8>),
    NotFound,
    Ok,
    NodeId(DhtKey),
}

pub struct RpcServer {
    node: DhtNode,
}

impl RpcServer {
    pub fn new(node: DhtNode) -> Self {
        Self { node }
    }

    pub async fn start(&self) -> Result<(), RpcError> {
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

    async fn handle_connection(stream: TcpStream, node: DhtNode) -> Result<(), RpcError> {
        let peer_addr = stream.peer_addr()?;

        let (r, mut w) = stream.into_split();
        let mut reader = BufReader::new(r);
        let mut line = String::new();

        while reader.read_line(&mut line).await? > 0 {
            let request: RpcRequest = serde_json::from_str(&line)?;
            let response = Self::handle_request(&node, request, peer_addr.clone()).await?;
            w.write_all(serde_json::to_string(&response)?.as_bytes()).await?;
            w.write_all(b"\n").await?;
            line.clear();
        }

        Ok(())
    }

    async fn handle_request(node: &DhtNode, request: RpcRequest, sender_addr: SocketAddr) -> Result<RpcResponse, RpcError> {
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
                Ok(RpcResponse::Ok)
            }

            RpcRequest::FindValue(key) => {
                let storage = node.storage.lock().await;
                match storage.get(&key) {
                    Some(value) => Ok(RpcResponse::Value(value.to_vec())),
                    None => Ok(RpcResponse::NotFound),
                }
            }

            RpcRequest::GetNodeId(sender_id) => {
                let sender_node = NodeInfo {
                    id: sender_id,
                    addr: sender_addr,
                };
                node.routing_table.lock().await.update(sender_node);
                Ok(RpcResponse::NodeId(node.id.clone()))
            },
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

    pub async fn send_request(&self, request: RpcRequest) -> Result<RpcResponse, RpcError> {
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
    use crate::DhtNode;
    use std::fmt;

    #[derive(Debug)]
    struct TestError(RpcError);

    impl fmt::Display for TestError {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "{}", self.0)
        }
    }

    impl std::error::Error for TestError {}

    impl From<RpcError> for TestError {
        fn from(err: RpcError) -> Self {
            TestError(err)
        }
    }

    impl From<JoinError> for TestError {
        fn from(err: JoinError) -> Self {
            TestError(RpcError::ConnectionError(err.to_string()))
        }
    }

    // Make TestError Send + Sync
    unsafe impl Send for TestError {}
    unsafe impl Sync for TestError {}

    fn create_test_node() -> DhtNode {
        let port = random_port(4000, 5000);
        let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), port);
        DhtNode::new(addr)
    }

    #[tokio::test]
    async fn test_rpc_client_server_basic() -> Result<(), TestError> {
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
        let response = client.send_request(RpcRequest::Ping).await?;
        assert!(matches!(response, RpcResponse::Pong));

        // Test find node
        let target = DhtKey::random();
        let target_node = DhtNode::new_with_id(node.addr, target.clone());
        let target_info = NodeInfo {
            id: target_node.id.clone(),
            addr: target_node.addr.clone(),
        };

        node.routing_table.lock().await.update(target_info.clone());

        let response = client.send_request(RpcRequest::FindNode(target.clone())).await?;
        match response {
            RpcResponse::Nodes(nodes) => {
                assert!(nodes.iter().any(|n| n.id == target), "Target node not found in response");
            }
            _ => panic!("Expected Nodes response"),
        }

        // Test store and find value
        let key = DhtKey::random();
        let value = b"test value".to_vec();
        
        let response = client.send_request(RpcRequest::Store(key.clone(), value.clone())).await?;
        assert!(matches!(response, RpcResponse::Ok));

        let response = client.send_request(RpcRequest::FindValue(key)).await?;
        match response {
            RpcResponse::Value(v) => assert_eq!(v, value),
            _ => panic!("Expected Value response"),
        }

        // Cleanup
        server_handle.abort();
        Ok(())
    }

    #[tokio::test]
    async fn test_rpc_error_handling() -> Result<(), TestError> {
        let client = RpcClient::new(SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 9999));
        
        // Test connection error
        let result = client.send_request(RpcRequest::Ping).await;
        assert!(result.is_err());
        Ok(())
    }

    #[tokio::test]
    async fn test_rpc_concurrent_requests() -> Result<(), TestError> {
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
            let key = DhtKey::random();
            let value = format!("test value {}", i).into_bytes();
            
            handles.push(tokio::spawn(async move {
                let response = client.send_request(RpcRequest::Store(key.clone(), value.clone())).await?;
                assert!(matches!(response, RpcResponse::Ok));
                
                let response = client.send_request(RpcRequest::FindValue(key)).await?;
                match response {
                    RpcResponse::Value(v) => assert_eq!(v, value),
                    _ => panic!("Expected Value response"),
                }
                Ok::<(), TestError>(())
            }));
        }

        // Wait for all requests to complete
        for handle in handles {
            handle.await??;
        }

        // Cleanup
        server_handle.abort();
        Ok(())
    }

    #[tokio::test]
    async fn test_node_id_exchange() -> Result<(), TestError> {
        let node = create_test_node();
        let server = RpcServer::new(node.clone());
        
        let server_handle = tokio::spawn(async move {
            server.start().await.unwrap();
        });

        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        let client = RpcClient::new(node.addr);
        let response = client.send_request(RpcRequest::GetNodeId(DhtKey::random())).await?;
        
        match response {
            RpcResponse::NodeId(id) => assert_eq!(id, node.id),
            _ => panic!("Expected NodeId response"),
        }

        server_handle.abort();
        Ok(())
    }
} 