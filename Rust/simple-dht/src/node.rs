use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::{DhtKey, NodeInfo, DhtNode, routing::RoutingTable, storage::Storage, rpc::{RpcClient, RpcRequest, RpcResponse, RpcServer, RpcError}, ALPHA};

pub const MIN_VALUE_REPLICATION_TO_NODES: usize = 3;
pub const MAINTENANCE_INTERVAL_SECONDS: u64 = 3600;

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
        
        let bootstrap_id = match client.send_request(RpcRequest::GetNodeId(self.id.clone(), self.addr)).await? {
            RpcResponse::NodeId(id) => id,
            _ => return Err(RpcError::ConnectionError("Failed to get bootstrap node ID".into())),
        };

        let bootstrap_info = NodeInfo {
            id: bootstrap_id,
            addr: bootstrap_addr,
        };
        self.routing_table.lock().await.update(bootstrap_info.clone());

        let response = client.send_request(RpcRequest::FindNode(self.id.clone())).await?;
        
        if let RpcResponse::Nodes(nodes) = response {
            println!("Found {} nodes: [{}]", nodes.len(), nodes.iter()
            .map(|n| n.to_string())
            .collect::<Vec<_>>()
            .join(", "));
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
        let mut errors = Vec::new();
        
        for node in closest {
            let client = RpcClient::new(node.addr);
            match client.send_request(RpcRequest::Store(key.clone(), value.clone())).await {
                Ok(_) => {
                    success_count += 1;
                    if success_count >= MIN_VALUE_REPLICATION_TO_NODES {
                        return Ok(());
                    }
                }
                Err(e) => {
                    errors.push(e);
                }
            }
        }

        if success_count == 0 {
            return Err(RpcError::StorageError(format!(
                "Failed to store value on any remote nodes. Errors: {:?}",
                errors
            )));
        }

        if success_count < MIN_VALUE_REPLICATION_TO_NODES {
            eprintln!(
                "Warning: Only stored value on {}/{} nodes. Errors: {:?}",
                success_count,
                MIN_VALUE_REPLICATION_TO_NODES,
                errors
            );
        }
        Ok(())
    }

    pub async fn find_value(&self, key: DhtKey) -> Result<Option<Vec<u8>>, RpcError> {
        if let Some(value) = self.storage.lock().await.get(&key) {
            return Ok(Some(value.to_vec()));
        }

        let closest = self.find_node(key.clone()).await?;
        if closest.is_empty() {
            return Ok(None);
        }

        let mut errors = Vec::new();
        for node in closest {
            let client = RpcClient::new(node.addr);
            match client.send_request(RpcRequest::FindValue(key.clone())).await {
                Ok(RpcResponse::Value(value)) => {
                    self.storage.lock().await.store(key.clone(), value.clone(), None);
                    return Ok(Some(value));
                }
                Ok(RpcResponse::NotFound) => continue,
                Err(e) => {
                    errors.push(e);
                    continue;
                }
                _ => continue,
            }
        }

        if !errors.is_empty() {
            eprintln!("Errors while finding value: {:?}", errors);
        }
        Ok(None)
    }

    async fn ping_node(&self, node: &NodeInfo) -> Result<(), RpcError> {
        let client = RpcClient::new(node.addr);
        if client.send_request(RpcRequest::Ping).await.is_ok() {
            self.routing_table.lock().await.update(node.clone());
            println!("Pinged node successfully: {}", node);
        } else {
            println!("Failed to ping node: {}", node);
        }
        Ok(())
    }

    pub async fn start_maintenance(&self) {
        let node = self.clone();
        tokio::spawn(async move {
            loop {
                let target = DhtKey::random();
                if let Ok(nodes) = node.find_node(target).await {
                    for node_info in nodes {
                        if let Err(e) = node.ping_node(&node_info).await {
                            eprintln!("Failed to ping node during maintenance: {}", e);
                        }
                    }
                }

                node.remove_failed_nodes().await;

                tokio::time::sleep(tokio::time::Duration::from_secs(MAINTENANCE_INTERVAL_SECONDS)).await;
            }
        });
    }

    async fn check_node_health(&self, node: &NodeInfo) -> bool {
        let client = RpcClient::new(node.addr);
        match client.send_request(RpcRequest::Ping).await {
            Ok(RpcResponse::Pong) => true,
            _ => false,
        }
    }

    async fn remove_failed_nodes(&self) {
        let nodes: Vec<NodeInfo> = {
            let rt = self.routing_table.lock().await;
            rt.buckets.iter()
                .flat_map(|bucket| bucket.nodes.clone())
                .collect()
        };

        let mut failed_nodes = Vec::new();
        for node in nodes {
            let is_healthy = self.check_node_health(&node).await;
            if !is_healthy {
                failed_nodes.push(node.id.clone());
            }
        }

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

        let test_nodes: Vec<_> = (0..ALPHA).map(|i| {
            let id = DhtKey::random();
            let mut bytes = id.0;
            bytes[0] = i as u8;  // Make IDs different
            NodeInfo {
                id: DhtKey(bytes),
                addr: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 4001 + i as u16),
            }
        }).collect();

        for test_node in &test_nodes {
            let added = node.routing_table.lock().await.update(test_node.clone());
            assert!(added, "Failed to add node to routing table");
        }

        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

        {
            let rt = node.routing_table.lock().await;
            let closest = rt.find_closest(&target, ALPHA);
            assert!(!closest.is_empty(), "No nodes found in routing table");
            assert_eq!(closest.len(), test_nodes.len(), 
                "Expected {} nodes in routing table, but found {}", 
                test_nodes.len(), closest.len());
        }

        let nodes = node.find_node(target.clone()).await.unwrap();
        assert!(!nodes.is_empty(), "find_node returned no nodes");
        assert!(nodes.len() <= ALPHA, "find_node returned more than ALPHA nodes");

        let test_node_ids: std::collections::HashSet<_> = test_nodes.iter()
            .map(|n| n.id.clone())
            .collect();
        for node in &nodes {
            assert!(test_node_ids.contains(&node.id), 
                "Returned node not in test nodes: {:?}", node);
        }

        assert_eq!(nodes.len(), test_nodes.len(), 
            "Expected {} nodes but got {}", test_nodes.len(), nodes.len());

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

        node.storage.lock().await.store(key.clone(), value.clone(), None);

        let found = node.find_value(key).await.unwrap();
        assert_eq!(found, Some(value));
    }

    #[tokio::test]
    async fn test_node_bootstrap() {
        let bootstrap_node = create_test_node();
        let node = create_test_node();

        let server = RpcServer::new(bootstrap_node.clone());
        let server_handle = tokio::spawn(async move {
            server.start().await.unwrap();
        });

        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        let result = node.bootstrap(bootstrap_node.addr).await;
        assert!(result.is_ok());

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

        let test_node = NodeInfo {
            id: DhtKey::random(),
            addr: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), random_port(4000, 5000)),
        };
        let test_dht_node = DhtNode::new(test_node.addr);
        let server = RpcServer::new(test_dht_node.clone());

        let server_handle = tokio::spawn(async move {
            if let Err(e) = server.start().await {
                eprintln!("Server error: {}", e);
            }
        });

        tokio::time::sleep(Duration::from_millis(500)).await;

        {
            let mut rt = node.routing_table.lock().await;
            assert!(rt.update(test_node.clone()));
        }

        node.start_maintenance().await;

        tokio::time::sleep(Duration::from_secs(2)).await;

        {
            let rt = node.routing_table.lock().await;
            let closest = rt.find_closest(&test_node.id, 1);
            assert!(!closest.is_empty(), "Node should still be in routing table after maintenance");
            assert_eq!(closest[0].id, test_node.id);
        }

        server_handle.abort();
    }

    #[tokio::test]
    async fn test_node_health_check() {
        let node = create_test_node();

        let test_node = NodeInfo {
            id: DhtKey::random(),
            addr: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 4001),
        };
        let test_dht_node = DhtNode::new(test_node.addr);
        let server = RpcServer::new(test_dht_node.clone());

        let server_handle = tokio::spawn(async move {
            server.start().await.unwrap();
        });

        tokio::time::sleep(Duration::from_millis(100)).await;

        {
            let mut rt = node.routing_table.lock().await;
            assert!(rt.update(test_node.clone()));
        }

        let is_healthy = node.check_node_health(&test_node).await;
        assert!(is_healthy);

        server_handle.abort();
    }

    #[tokio::test]
    async fn test_remove_failed_nodes() {
        let node = create_test_node();

        let healthy_node = NodeInfo {
            id: DhtKey::random(),
            addr: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), random_port(4000, 5000)),
        };
        let healthy_dht_node = DhtNode::new(healthy_node.addr);
        let healthy_server = RpcServer::new(healthy_dht_node.clone());
        let healthy_server_handle = tokio::spawn(async move {
            if let Err(e) = healthy_server.start().await {
                eprintln!("Healthy server error: {}", e);
            }
        });

        let unhealthy_node = NodeInfo {
            id: DhtKey::random(),
            addr: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), random_port(4000, 5000)),
        };

        {
            let mut rt = node.routing_table.lock().await;
            assert!(rt.update(healthy_node.clone()));
            assert!(rt.update(unhealthy_node.clone()));
        }

        node.start_maintenance().await;
        tokio::time::sleep(Duration::from_secs(2)).await;

        {
            let rt = node.routing_table.lock().await;
            let all_nodes: Vec<_> = rt.buckets.iter()
                .flat_map(|bucket| bucket.nodes.clone())
                .collect();

            assert!(all_nodes.iter().any(|n| n.id == healthy_node.id),
                "Healthy node was incorrectly removed from routing table");
            assert!(!all_nodes.iter().any(|n| n.id == unhealthy_node.id),
                "Unhealthy node was not removed from routing table");
        }

        healthy_server_handle.abort();
    }
} 