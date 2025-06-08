use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::{DhtKey, NodeInfo, DhtNode, routing::RoutingTable, storage::Storage, rpc::{RpcClient, RpcRequest, RpcResponse, RpcServer, RpcError}, ALPHA};

pub const MIN_VALUE_REPLICATION_TO_NODES: usize = 3;

impl DhtNode {
    pub fn new(addr: SocketAddr) -> Self {
        let id = DhtKey::random();
        Self::new_with_id(addr, id)
    }

    pub fn new_with_id(addr: SocketAddr, id: DhtKey) -> Self {
        Self {
            id: id.clone(),
            addr,
            routing_table: Arc::new(Mutex::new(RoutingTable::new(id))),
            storage: Arc::new(Mutex::new(Storage::new())),
        }
    }

    pub async fn bootstrap(&self, bootstrap_addr: SocketAddr) -> Result<(), RpcError> {
        let client = RpcClient::new(bootstrap_addr);
        let response = client.send_request(RpcRequest::FindNode(self.id.clone())).await?;
        
        if let RpcResponse::Nodes(nodes) = response {
            for node in nodes {
                self.ping_node(&node).await?;
            }
        }
        
        Ok(())
    }

    pub async fn find_node(&self, target: DhtKey) -> Result<Vec<NodeInfo>, RpcError> {
        let closest = self.routing_table.lock().await.find_closest(&target, ALPHA);
        if closest.is_empty() {
            return Ok(Vec::new());
        }

        let mut queried = std::collections::HashSet::new();
        let mut found = std::collections::HashSet::new();
        let mut all_found_nodes = Vec::new();
        let mut current_closest = closest.clone();

        for node in &current_closest {
            found.insert(node.id.clone());
            all_found_nodes.push(node.clone());
        }

        while !current_closest.is_empty() && all_found_nodes.len() < ALPHA {
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
                            all_found_nodes.push(new_node.clone());
                            new_closest.push(new_node.clone());
                            // Ping and add new nodes to routing table
                            if let Err(e) = self.ping_node(&new_node).await {
                                eprintln!("Failed to ping new node {}: {}", new_node.addr, e);
                            }
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

        // Sort all found nodes by distance to target
        all_found_nodes.sort_by(|a, b| {
            let dist_a = target.distance(&a.id);
            let dist_b = target.distance(&b.id);
            dist_a.cmp(&dist_b)
        });

        // Truncate to ALPHA nodes
        all_found_nodes.truncate(ALPHA);

        Ok(all_found_nodes)
    }

    pub async fn store(&self, key: DhtKey, value: Vec<u8>) -> Result<(), RpcError> {
        self.storage.lock().await.store(key.clone(), value.clone(), None);
        
        let closest = self.find_node(key.clone()).await?;
        if closest.is_empty() {
            return Ok(());
        }

        let mut success_count = 0;
        
        for node in closest {
            let client = RpcClient::new(node.addr);
            if let Ok(_) = client.send_request(RpcRequest::Store(key.clone(), value.clone())).await {
                success_count += 1;
                if success_count >= MIN_VALUE_REPLICATION_TO_NODES {
                    return Ok(());
                }
            }
        }

        if success_count == 0 {
            return Err(RpcError::StorageError("Failed to store value on any remote nodes".into()));
        }
        eprintln!("Warning: Only stored value on {}/{} nodes", success_count, MIN_VALUE_REPLICATION_TO_NODES);
        Ok(())
    }

    pub async fn find_value(&self, key: DhtKey) -> Result<Option<Vec<u8>>, RpcError> {
        if let Some(value) = self.storage.lock().await.get(&key) {
            return Ok(Some(value.to_vec()));
        }

        let closest = self.find_node(key.clone()).await?;

        for node in closest {
            let client = RpcClient::new(node.addr);
            if let Ok(RpcResponse::Value(value)) = client.send_request(RpcRequest::FindValue(key.clone())).await {
                return Ok(Some(value));
            }
        }

        Ok(None)
    }

    async fn ping_node(&self, node: &NodeInfo) -> Result<(), RpcError> {
        let client = RpcClient::new(node.addr);
        if client.send_request(RpcRequest::Ping).await.is_ok() {
            self.routing_table.lock().await.update(node.clone());
        }
        Ok(())
    }

    /// Start periodic maintenance tasks for the DHT node
    pub async fn start_maintenance(&self) {
        let node = self.clone();
        tokio::spawn(async move {
            loop {
                // Periodically refresh routing table
                let target = DhtKey::random();
                if let Ok(nodes) = node.find_node(target).await {
                    for node_info in nodes {
                        if let Err(e) = node.ping_node(&node_info).await {
                            eprintln!("Failed to ping node during maintenance: {}", e);
                        }
                    }
                }

                // Remove failed nodes
                node.remove_failed_nodes().await;

                // Sleep for some interval (1 hour)
                tokio::time::sleep(tokio::time::Duration::from_secs(3600)).await;
            }
        });
    }

    /// Check if a node is healthy by sending a ping
    async fn check_node_health(&self, node: &NodeInfo) -> bool {
        let client = RpcClient::new(node.addr);
        match client.send_request(RpcRequest::Ping).await {
            Ok(RpcResponse::Pong) => true,
            _ => false,
        }
    }

    /// Remove failed nodes from the routing table
    async fn remove_failed_nodes(&self) {
        // First, get all nodes from the routing table
        let nodes: Vec<NodeInfo> = {
            let rt = self.routing_table.lock().await;
            rt.buckets.iter()
                .flat_map(|bucket| bucket.nodes.clone())
                .collect()
        };

        // Check health of all nodes
        let mut failed_nodes = Vec::new();
        for node in nodes {
            let is_healthy = self.check_node_health(&node).await;
            if !is_healthy {
                failed_nodes.push(node.id.clone());
            }
        }

        // Remove failed nodes from routing table
        if !failed_nodes.is_empty() {
            let mut rt = self.routing_table.lock().await;
            for node_id in &failed_nodes {
                rt.remove(node_id);
            }
        }
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
    use std::time::Duration;
    use crate::rpc::RpcServer;

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
        
        // Create test nodes with deterministic IDs for more stable testing
        let test_nodes: Vec<_> = (0..3).map(|i| {
            let id = DhtKey::random();
            // Ensure nodes are at different distances from target
            let mut bytes = id.0;
            bytes[0] = i as u8;  // Make IDs deterministic but different
            NodeInfo {
                id: DhtKey(bytes),
                addr: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 4001 + i as u16),
            }
        }).collect();

        // Add nodes to routing table and verify they were added
        for test_node in &test_nodes {
            let added = node.routing_table.lock().await.update(test_node.clone());
            assert!(added, "Failed to add node to routing table");
        }

        // Wait a bit to ensure routing table updates are processed
        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

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

        // Additional verification: ensure we got all test nodes back
        assert_eq!(nodes.len(), test_nodes.len(), 
            "Expected {} nodes but got {}", test_nodes.len(), nodes.len());

        // Verify nodes are sorted by distance to target
        for i in 0..nodes.len() - 1 {
            let dist1 = target.distance(&nodes[i].id);
            let dist2 = target.distance(&nodes[i + 1].id);
            assert!(dist1 <= dist2, 
                "Nodes not sorted by distance: dist1 {:?} > dist2 {:?}", dist1, dist2);
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

    #[tokio::test]
    async fn test_node_maintenance() {
        let node = create_test_node();
        
        // Create and start a test node with RPC server
        let test_node = NodeInfo {
            id: DhtKey::random(),
            addr: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), random_port(4000, 5000)),
        };
        let test_dht_node = DhtNode::new(test_node.addr);
        let server = RpcServer::new(test_dht_node.clone());
        
        // Start the test node's RPC server
        let server_handle = tokio::spawn(async move {
            if let Err(e) = server.start().await {
                eprintln!("Server error: {}", e);
            }
        });

        // Give server time to start
        tokio::time::sleep(Duration::from_millis(500)).await;

        // Add test node to routing table
        {
            let mut rt = node.routing_table.lock().await;
            assert!(rt.update(test_node.clone()));
        }

        // Start maintenance task
        node.start_maintenance().await;

        // Wait a bit for maintenance to run
        tokio::time::sleep(Duration::from_secs(2)).await;

        // Verify node is still in routing table
        {
            let rt = node.routing_table.lock().await;
            let closest = rt.find_closest(&test_node.id, 1);
            assert!(!closest.is_empty(), "Node should still be in routing table after maintenance");
            assert_eq!(closest[0].id, test_node.id);
        }

        // Cleanup
        server_handle.abort();
    }

    #[tokio::test]
    async fn test_node_health_check() {
        let node = create_test_node();
        
        // Create and start a test node with RPC server
        let test_node = NodeInfo {
            id: DhtKey::random(),
            addr: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 4001),
        };
        let test_dht_node = DhtNode::new(test_node.addr);
        let server = RpcServer::new(test_dht_node.clone());
        
        // Start the test node's RPC server
        let server_handle = tokio::spawn(async move {
            server.start().await.unwrap();
        });

        // Give server time to start
        tokio::time::sleep(Duration::from_millis(100)).await;

        // Add test node to routing table
        {
            let mut rt = node.routing_table.lock().await;
            assert!(rt.update(test_node.clone()));
        }

        // Check node health
        let is_healthy = node.check_node_health(&test_node).await;
        assert!(is_healthy); // Should be true since node is running

        // Cleanup
        server_handle.abort();
    }

    #[tokio::test]
    async fn test_remove_failed_nodes() {
        let node = create_test_node();
        
        // Create test nodes with unique ports
        let test_nodes: Vec<_> = (0..3).map(|i| {
            NodeInfo {
                id: DhtKey::random(),
                addr: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), random_port(4000, 5000)),
            }
        }).collect();

        // Start RPC server for first node only
        let test_dht_node = DhtNode::new(test_nodes[0].addr);
        let server = RpcServer::new(test_dht_node.clone());
        let server_handle = tokio::spawn(async move {
            if let Err(e) = server.start().await {
                eprintln!("Server error: {}", e);
            }
        });

        // Give server time to start
        tokio::time::sleep(Duration::from_millis(500)).await;

        // Add test nodes to routing table
        {
            let mut rt = node.routing_table.lock().await;
            for test_node in &test_nodes {
                assert!(rt.update(test_node.clone()));
            }
        }

        // Verify initial state
        {
            let rt = node.routing_table.lock().await;
            for test_node in &test_nodes {
                let closest = rt.find_closest(&test_node.id, 1);
                assert!(!closest.is_empty(), "Node should be in routing table initially");
            }
        }

        // Remove failed nodes
        node.remove_failed_nodes().await;

        // Wait a bit for the removal to take effect
        tokio::time::sleep(Duration::from_millis(500)).await;

        // Verify only the first node remains (since it's the only one running)
        {
            let rt = node.routing_table.lock().await;
            let closest = rt.find_closest(&test_nodes[0].id, 1);
            assert!(!closest.is_empty(), "First node should still be in routing table");
            assert_eq!(closest[0].id, test_nodes[0].id);

            // Verify other nodes are removed
            for test_node in &test_nodes[1..] {
                let closest = rt.find_closest(&test_node.id, 1);
                assert!(closest.is_empty(), "Failed node should be removed from routing table");
            }

            // Verify total number of nodes in routing table
            let mut total_nodes = 0;
            for bucket in &rt.buckets {
                total_nodes += bucket.nodes.len();
            }
            assert_eq!(total_nodes, 1, "Should only have one node in routing table");
        }

        // Cleanup
        server_handle.abort();
    }
} 