use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::{DhtKey, NodeInfo, DhtNode, routing::RoutingTable, storage::Storage, rpc::{RpcClient, RpcRequest, RpcResponse, RpcServer}, ALPHA};

impl DhtNode {
    pub fn new(addr: SocketAddr) -> Self {
        let id = DhtKey::random();
        Self {
            id: id.clone(),
            addr,
            routing_table: Arc::new(Mutex::new(RoutingTable::new(id))),
            storage: Arc::new(Mutex::new(Storage::new())),
        }
    }

    pub async fn bootstrap(&self, bootstrap_addr: SocketAddr) -> Result<(), Box<dyn std::error::Error>> {
        let client = RpcClient::new(bootstrap_addr);
        let response = client.send_request(RpcRequest::FindNode(self.id.clone())).await?;
        
        if let RpcResponse::Nodes(nodes) = response {
            for node in nodes {
                self.ping_node(&node).await?;
            }
        }
        
        Ok(())
    }

    pub async fn find_node(&self, target: DhtKey) -> Result<Vec<NodeInfo>, Box<dyn std::error::Error>> {
        // First get the closest nodes from our routing table
        let closest = self.routing_table.lock().await.find_closest(&target, ALPHA);
        if closest.is_empty() {
            return Ok(Vec::new());
        }

        let mut queried = std::collections::HashSet::new();
        let mut found = std::collections::HashSet::new();
        let mut current_closest = closest.clone();

        // Add initial nodes to found set
        for node in &current_closest {
            found.insert(node.id.clone());
        }

        while !current_closest.is_empty() {
            let mut new_closest = Vec::new();
            
            for node in current_closest {
                if queried.contains(&node.id) {
                    continue;
                }
                queried.insert(node.id.clone());

                let client = RpcClient::new(node.addr);
                if let Ok(RpcResponse::Nodes(nodes)) = client.send_request(RpcRequest::FindNode(target.clone())).await {
                    for new_node in nodes {
                        if !found.contains(&new_node.id) {
                            found.insert(new_node.id.clone());
                            new_closest.push(new_node);
                        }
                    }
                }
            }

            if new_closest.is_empty() {
                break;
            }

            current_closest = new_closest;
            current_closest.sort_by(|a, b| {
                let dist_a = target.distance(&a.id);
                let dist_b = target.distance(&b.id);
                dist_a.cmp(&dist_b)
            });
            current_closest.truncate(ALPHA);
        }

        // Convert found node IDs back to NodeInfo
        let mut result = Vec::new();
        for id in found {
            if let Some(node) = closest.iter().find(|n| n.id == id) {
                result.push(node.clone());
            }
        }

        // Sort by distance to target
        result.sort_by(|a, b| {
            let dist_a = target.distance(&a.id);
            let dist_b = target.distance(&b.id);
            dist_a.cmp(&dist_b)
        });

        Ok(result)
    }

    pub async fn store(&self, key: DhtKey, value: Vec<u8>) -> Result<(), Box<dyn std::error::Error>> {
        // First store locally
        self.storage.lock().await.store(key.clone(), value.clone(), None);
        
        // Find the k closest nodes to the key
        let closest = self.find_node(key.clone()).await?;
        
        // Store on the k closest nodes
        for node in closest {
            let client = RpcClient::new(node.addr);
            if let Err(e) = client.send_request(RpcRequest::Store(key.clone(), value.clone())).await {
                eprintln!("Failed to store value on node {}: {}", node.addr, e);
                // Continue with other nodes even if one fails
            }
        }

        Ok(())
    }

    pub async fn find_value(&self, key: DhtKey) -> Result<Option<Vec<u8>>, Box<dyn std::error::Error>> {
        // First check local storage
        if let Some(value) = self.storage.lock().await.get(&key) {
            return Ok(Some(value.to_vec()));
        }

        // If not found locally, search the network
        let closest = self.find_node(key.clone()).await?;
        
        for node in closest {
            let client = RpcClient::new(node.addr);
            if let Ok(RpcResponse::Value(value)) = client.send_request(RpcRequest::FindValue(key.clone())).await {
                return Ok(Some(value));
            }
        }

        Ok(None)
    }

    async fn ping_node(&self, node: &NodeInfo) -> Result<(), Box<dyn std::error::Error>> {
        let client = RpcClient::new(node.addr);
        if client.send_request(RpcRequest::Ping).await.is_ok() {
            self.routing_table.lock().await.update(node.clone());
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{IpAddr, Ipv4Addr};
    use tokio::runtime::Runtime;
    use std::sync::Arc;
    use tokio::sync::Mutex;
    use crate::utils::random_port;

    fn create_test_node() -> DhtNode {
        let port = random_port(4000, 5000);
        let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), port);
        DhtNode::new(addr)
    }

    #[tokio::test]
    async fn test_node_creation() {
        let node = create_test_node();
        assert!(node.addr.port() >= 4000 && node.addr.port() < 5000);
    }

    #[tokio::test]
    async fn test_node_find_node() {
        let node = create_test_node();
        let target = DhtKey::random();
        
        // Add some nodes to routing table
        let test_nodes: Vec<_> = (0..3).map(|i| {
            NodeInfo {
                id: DhtKey::random(),
                addr: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 4001 + i as u16),
            }
        }).collect();

        // Add nodes to routing table and verify they were added
        for test_node in &test_nodes {
            let added = node.routing_table.lock().await.update(test_node.clone());
            assert!(added, "Failed to add node to routing table");
        }

        // Verify nodes are in routing table
        {
            let rt = node.routing_table.lock().await;
            let closest = rt.find_closest(&target, ALPHA);
            assert!(!closest.is_empty(), "No nodes found in routing table");
            assert_eq!(closest.len(), test_nodes.len(), 
                "Expected {} nodes in routing table, but found {}", 
                test_nodes.len(), closest.len());
        }

        // Now test find_node
        let nodes = node.find_node(target.clone()).await.unwrap();
        assert!(!nodes.is_empty(), "find_node returned no nodes");
        assert!(nodes.len() <= ALPHA, "find_node returned more than ALPHA nodes");

        // Verify returned nodes are from our test nodes
        let test_node_ids: std::collections::HashSet<_> = test_nodes.iter()
            .map(|n| n.id.clone())
            .collect();
        for node in &nodes {
            assert!(test_node_ids.contains(&node.id), 
                "Returned node not in test nodes: {:?}", node);
        }

        // Verify nodes are sorted by distance to target
        for i in 0..nodes.len() - 1 {
            let dist1 = target.distance(&nodes[i].id);
            let dist2 = target.distance(&nodes[i + 1].id);
            assert!(dist1 <= dist2, 
                "Nodes not sorted by distance: {} <= {}", dist1, dist2);
        }
    }

    #[tokio::test]
    async fn test_node_store_find_value() {
        let node = create_test_node();
        let key = DhtKey::random();
        let value = b"test value".to_vec();

        // Store value locally
        node.storage.lock().await.store(key.clone(), value.clone(), None);

        // Find value
        let found = node.find_value(key).await.unwrap();
        assert_eq!(found, Some(value));
    }

    #[tokio::test]
    async fn test_node_bootstrap() {
        let bootstrap_node = create_test_node();
        let node = create_test_node();

        // Start bootstrap node's RPC server
        let server = RpcServer::new(bootstrap_node.clone());
        let server_handle = tokio::spawn(async move {
            server.start().await.unwrap();
        });

        // Give server time to start
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        // Bootstrap should succeed
        let result = node.bootstrap(bootstrap_node.addr).await;
        assert!(result.is_ok());

        // Cleanup
        server_handle.abort();
    }

    #[tokio::test]
    async fn test_node_concurrent_operations() {
        let node = create_test_node();
        let mut handles = Vec::new();

        // Spawn multiple concurrent operations
        for i in 0..5 {
            let node = node.clone();
            let key = DhtKey::random();
            let value = format!("test value {}", i).into_bytes();
            
            handles.push(tokio::spawn(async move {
                // Store value locally
                node.storage.lock().await.store(key.clone(), value.clone(), None);
                
                // Find value
                let found = node.find_value(key).await.unwrap();
                assert_eq!(found, Some(value));
            }));
        }

        // Wait for all operations to complete
        for handle in handles {
            handle.await.unwrap();
        }
    }
} 