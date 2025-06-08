use simple_dht::*;
use simple_dht::rpc::{RpcServer, RpcClient, RpcRequest, RpcResponse};
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::time::Duration;
use tokio::runtime::Runtime;
use std::sync::Arc;
use tokio::sync::Mutex;

// Helper functions
fn create_test_node(port: u16) -> DhtNode {
    let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), port);
    DhtNode::new(addr)
}

#[cfg(test)]
mod tests {
    use super::*;

    // NodeId tests
    #[test]
    fn test_node_id_creation() {
        let id1 = DhtKey::random();
        let id2 = DhtKey::random();
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_node_id_from_str() {
        let id1 = DhtKey::from("test");
        let id2 = DhtKey::from("test");
        let id3 = DhtKey::from("different");
        assert_eq!(id1, id2);
        assert_ne!(id1, id3);
    }

    #[test]
    fn test_node_id_distance() {
        let id1 = DhtKey::from("test1");
        let id2 = DhtKey::from("test2");
        let id3 = DhtKey::from("test1");
        let dist1 = id1.distance(&id2);
        let dist2 = id1.distance(&id3);
        assert!(dist1 != [0u8; 32]);
        assert_eq!(dist2, [0u8; 32]);
    }

    // Routing table tests
    #[tokio::test]
    async fn test_routing_table_basic() {
        let node = create_test_node(4000);
        let rt = node.routing_table.lock().await;
        assert_eq!(rt.buckets.len(), KEY_SIZE);
    }

    #[tokio::test]
    async fn test_routing_table_update() {
        let node = create_test_node(4000);
        let test_node = NodeInfo {
            id: DhtKey::random(),
            addr: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 4001),
        };

        {
            let mut rt = node.routing_table.lock().await;
            assert!(rt.update(test_node.clone()));
        }

        {
            let rt = node.routing_table.lock().await;
            let closest = rt.find_closest(&test_node.id, 1);
            assert_eq!(closest.len(), 1);
            assert_eq!(closest[0].id, test_node.id);
        }
    }

    #[tokio::test]
    async fn test_routing_table_remove() {
        let node = create_test_node(4000);
        let test_node = NodeInfo {
            id: DhtKey::random(),
            addr: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 4001),
        };

        {
            let mut rt = node.routing_table.lock().await;
            rt.update(test_node.clone());
            rt.remove(&test_node.id);
        }

        {
            let rt = node.routing_table.lock().await;
            let closest = rt.find_closest(&test_node.id, 1);
            assert!(closest.is_empty());
        }
    }

    // Storage tests
    #[tokio::test]
    async fn test_storage_basic() {
        let node = create_test_node(4000);
        let key = DhtKey::from("test_key");
        let value = b"test_value".to_vec();

        {
            let mut storage = node.storage.lock().await;
            storage.store(key.clone(), value.clone(), None);
        }

        {
            let storage = node.storage.lock().await;
            let retrieved = storage.get(&key).unwrap();
            assert_eq!(retrieved, value.as_slice());
        }
    }

    #[tokio::test]
    async fn test_storage_ttl() {
        let node = create_test_node(4000);
        let key = DhtKey::from("test_key");
        let value = b"test_value".to_vec();

        {
            let mut storage = node.storage.lock().await;
            storage.store(key.clone(), value.clone(), Some(Duration::from_millis(100)));
        }

        // Value should be available immediately
        {
            let storage = node.storage.lock().await;
            assert!(storage.get(&key).is_some());
        }

        // Wait for TTL to expire
        tokio::time::sleep(Duration::from_millis(150)).await;

        // Value should be expired
        {
            let storage = node.storage.lock().await;
            assert!(storage.get(&key).is_none());
        }
    }

    #[tokio::test]
    async fn test_storage_cleanup() {
        let node = create_test_node(4000);
        let key1 = DhtKey::from("test_key1");
        let key2 = DhtKey::from("test_key2");
        let value = b"test_value".to_vec();

        {
            let mut storage = node.storage.lock().await;
            storage.store(key1.clone(), value.clone(), Some(Duration::from_millis(100)));
            storage.store(key2.clone(), value.clone(), None);
        }

        // Wait for first key to expire
        tokio::time::sleep(Duration::from_millis(150)).await;

        {
            let mut storage = node.storage.lock().await;
            storage.cleanup();
        }

        {
            let storage = node.storage.lock().await;
            assert!(storage.get(&key1).is_none());
            assert!(storage.get(&key2).is_some());
        }
    }

    // RPC tests
    #[tokio::test]
    async fn test_rpc_communication() {
        let node1 = create_test_node(4001);
        let node2 = create_test_node(4002);

        // Start RPC servers
        let server1 = RpcServer::new(node1.clone());
        let server2 = RpcServer::new(node2.clone());

        tokio::spawn(async move {
            server1.start().await.unwrap();
        });

        tokio::spawn(async move {
            server2.start().await.unwrap();
        });

        // Wait for servers to start
        tokio::time::sleep(Duration::from_millis(100)).await;

        // Test ping
        let client = RpcClient::new(node1.addr);
        let response = client.send_request(RpcRequest::Ping).await.unwrap();
        assert!(matches!(response, RpcResponse::Pong));

        // Test store and find value
        let key = DhtKey::from("test_key");
        let value = b"test_value".to_vec();

        let client = RpcClient::new(node1.addr);
        let response = client.send_request(RpcRequest::Store(key.clone(), value.clone())).await.unwrap();
        assert!(matches!(response, RpcResponse::Pong));

        let client = RpcClient::new(node1.addr);
        let response = client.send_request(RpcRequest::FindValue(key)).await.unwrap();
        assert!(matches!(response, RpcResponse::Value(v) if v == value));
    }

    // DHT node tests
    #[tokio::test]
    async fn test_dht_node_operations() {
        let node1 = create_test_node(4001);
        let node2 = create_test_node(4002);

        // Start RPC servers
        let server1 = RpcServer::new(node1.clone());
        let server2 = RpcServer::new(node2.clone());

        tokio::spawn(async move {
            server1.start().await.unwrap();
        });

        tokio::spawn(async move {
            server2.start().await.unwrap();
        });

        // Wait for servers to start
        tokio::time::sleep(Duration::from_millis(100)).await;

        // Test bootstrap
        node2.bootstrap(node1.addr).await.unwrap();

        // Test store and find value
        let key = DhtKey::from("test_key");
        let value = b"test_value".to_vec();

        node1.store(key.clone(), value.clone()).await.unwrap();
        
        let found = node2.find_value(key).await.unwrap();
        assert_eq!(found, Some(value));
    }

    // Error handling tests
    #[tokio::test]
    async fn test_error_handling() {
        let node = create_test_node(4000);
        let invalid_addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 9999);

        // Test bootstrap with invalid address
        assert!(node.bootstrap(invalid_addr).await.is_err());

        // Test find_value with non-existent key
        let key = DhtKey::random();
        let result = node.find_value(key).await.unwrap();
        assert!(result.is_none());
    }
} 