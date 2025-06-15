use simple_dht::*;
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::time::Duration;
use tokio::net::TcpStream;
use tokio::io::{AsyncWriteExt, AsyncBufReadExt, BufReader};
use crate::{DhtNode, DhtKey};
use crate::utils::random_port;
use crate::rpc::{RpcServer, RpcClient, RpcRequest, RpcResponse, RpcError};

#[derive(Debug)]
struct TestError(RpcError);

impl std::fmt::Display for TestError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for TestError {}

impl From<RpcError> for TestError {
    fn from(err: RpcError) -> Self {
        TestError(err)
    }
}

fn create_test_node() -> DhtNode {
    let port = random_port(4000, 5000);
    let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), port);
    DhtNode::new(addr)
}

async fn wait_for_server(addr: SocketAddr, timeout: Duration) -> bool {
    let start = std::time::Instant::now();
    while start.elapsed() < timeout {
        if TcpStream::connect(addr).await.is_ok() {
            return true;
        }
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    false
}

async fn ensure_nodes_connected(nodes: &[&DhtNode], timeout: Duration) -> bool {
    let start = std::time::Instant::now();
    while start.elapsed() < timeout {
        let mut all_connected = true;
        for node in nodes {
            let routing_table = node.routing_table.lock().await;
            let closest = routing_table.find_closest(&node.id, nodes.len());
            if closest.len() < nodes.len() - 1 {
                all_connected = false;
                break;
            }
        }
        if all_connected {
            return true;
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    false
}

const WAIT_FOR_SERVER_TIMEOUT: Duration = Duration::from_secs(2);

async fn start_node(node: &DhtNode) -> tokio::task::JoinHandle<()> {
    let server = crate::rpc::RpcServer::new(node.clone());
    let handle = tokio::spawn(async move {
        server.start().await.unwrap();
    });

    assert!(
        wait_for_server(node.addr, WAIT_FOR_SERVER_TIMEOUT).await,
        "Server failed to start"
    );

    handle
}

async fn bootstrap_node_to(node: &DhtNode, bootstrap_addr: SocketAddr) {
    node.bootstrap(bootstrap_addr).await.unwrap();
    tokio::time::sleep(Duration::from_millis(500)).await;
}

#[tokio::test]
async fn test_basic_node_operations() {
    let bootstrap_node = create_test_node();
    let server = crate::rpc::RpcServer::new(bootstrap_node.clone());
    let server_handle = tokio::spawn(async move {
        server.start().await.unwrap();
    });

    assert!(wait_for_server(bootstrap_node.addr, WAIT_FOR_SERVER_TIMEOUT).await, "Bootstrap server failed to start");

    let node1 = create_test_node();
    let node2 = create_test_node();
    let node3 = create_test_node();

    let server1 = crate::rpc::RpcServer::new(node1.clone());
    let server2 = crate::rpc::RpcServer::new(node2.clone());
    let server3 = crate::rpc::RpcServer::new(node3.clone());

    let handle1 = tokio::spawn(async move {
        server1.start().await.unwrap();
    });
    let handle2 = tokio::spawn(async move {
        server2.start().await.unwrap();
    });
    let handle3 = tokio::spawn(async move {
        server3.start().await.unwrap();
    });

    assert!(wait_for_server(node1.addr, WAIT_FOR_SERVER_TIMEOUT).await, "Node1 server failed to start");
    assert!(wait_for_server(node2.addr, WAIT_FOR_SERVER_TIMEOUT).await, "Node2 server failed to start");
    assert!(wait_for_server(node3.addr, WAIT_FOR_SERVER_TIMEOUT).await, "Node3 server failed to start");

    node1.bootstrap(bootstrap_node.addr).await.expect("Node1 bootstrap failed");
    node2.bootstrap(bootstrap_node.addr).await.expect("Node2 bootstrap failed");
    node3.bootstrap(bootstrap_node.addr).await.expect("Node3 bootstrap failed");

    tokio::time::sleep(Duration::from_secs(2)).await;

    let nodes: Vec<&DhtNode> = vec![&bootstrap_node, &node1, &node2, &node3];
    for (_, node) in nodes.iter().enumerate() {
        let rt = node.routing_table.lock().await;
        let closest = rt.find_closest(&node.id, nodes.len());
        println!("Node {} routing table size: {}. Nodes: [{}]", 
            node.as_info(), 
            closest.len(), 
            closest.iter()
                .map(|n| n.to_string())
                .collect::<Vec<_>>()
                .join(", ")
        );
    }

    assert!(
        ensure_nodes_connected(&nodes, Duration::from_secs(5)).await,
        "Nodes failed to connect properly"
    );

    server_handle.abort();
    handle1.abort();
    handle2.abort();
    handle3.abort();
}

#[tokio::test]
async fn test_data_storage_and_retrieval() {
    // Start bootstrap node
    let bootstrap_node = create_test_node();
    let server_handle = start_node(&bootstrap_node).await;

    // Start nodes connecting to bootstrap
    let node1 = create_test_node();
    let node2 = create_test_node();
    let node3 = create_test_node();

    let handle1 = start_node(&node1).await;
    let handle2 = start_node(&node2).await;
    let handle3 = start_node(&node3).await;

    // Bootstrap nodes
    bootstrap_node_to(&node1, bootstrap_node.addr).await;
    bootstrap_node_to(&node2, bootstrap_node.addr).await;
    bootstrap_node_to(&node3, bootstrap_node.addr).await;

    // Ensure all nodes are connected
    let nodes: Vec<&DhtNode> = vec![&bootstrap_node, &node1, &node2, &node3];
    assert!(
        ensure_nodes_connected(&nodes, Duration::from_secs(2)).await,
        "Nodes failed to connect"
    );

    // Store and retrieve data
    let key = DhtKey::from("hello");
    let value = b"world".to_vec();

    // Store on node1
    node1.store(key.clone(), value.clone()).await.unwrap();

    // Give some time for replication
    tokio::time::sleep(Duration::from_millis(500)).await;

    // Retrieve from node3
    let found = node3.find_value(key).await.unwrap();
    assert_eq!(found, Some(value));

    // Cleanup
    server_handle.abort();
    handle1.abort();
    handle2.abort();
    handle3.abort();
}

#[tokio::test]
async fn test_multiple_key_value_pairs() {
    // Start bootstrap node
    let bootstrap_node = create_test_node();
    let server_handle = start_node(&bootstrap_node).await;

    // Start nodes connecting to bootstrap
    let node1 = create_test_node();
    let node2 = create_test_node();

    let handle1 = start_node(&node1).await;
    let handle2 = start_node(&node2).await;

    // Bootstrap nodes
    bootstrap_node_to(&node1, bootstrap_node.addr).await;
    bootstrap_node_to(&node2, bootstrap_node.addr).await;

    // Ensure all nodes are connected
    let nodes: Vec<&DhtNode> = vec![&bootstrap_node, &node1, &node2];
    assert!(
        ensure_nodes_connected(&nodes, Duration::from_secs(2)).await,
        "Nodes failed to connect"
    );

    // Store multiple key-value pairs on node1
    let pairs = vec![
        ("key1", "value1"),
        ("key2", "value2"),
        ("key3", "value3"),
    ];

    for (key_str, value_str) in &pairs {
        let key = DhtKey::from(*key_str);
        let value = value_str.as_bytes().to_vec();
        node1.store(key, value).await.unwrap();
        // Give some time for replication
        tokio::time::sleep(Duration::from_millis(500)).await;
    }

    // Retrieve from node2
    for (key_str, value_str) in &pairs {
        let key = DhtKey::from(*key_str);
        let value = value_str.as_bytes().to_vec();
        let found = node2.find_value(key).await.unwrap();
        assert_eq!(found, Some(value));
    }

    // Cleanup
    server_handle.abort();
    handle1.abort();
    handle2.abort();
}

#[tokio::test]
async fn test_large_value_storage() {
    // Start bootstrap node
    let bootstrap_node = create_test_node();
    let server = crate::rpc::RpcServer::new(bootstrap_node.clone());
    let server_handle = tokio::spawn(async move {
        server.start().await.unwrap();
    });

    // Wait for bootstrap server to be ready
    assert!(wait_for_server(bootstrap_node.addr, Duration::from_secs(1)).await, "Bootstrap server failed to start");

    // Start node connecting to bootstrap
    let node1 = create_test_node();
    let server1 = crate::rpc::RpcServer::new(node1.clone());
    let handle1 = tokio::spawn(async move {
        server1.start().await.unwrap();
    });

    // Wait for node1 server to be ready
    assert!(wait_for_server(node1.addr, Duration::from_secs(1)).await, "Node1 server failed to start");

    // Bootstrap node
    node1.bootstrap(bootstrap_node.addr).await.unwrap();

    // Generate large value (1MB)
    let large_value = vec![0u8; 1024 * 1024]; // 1MB of zeros
    let key = DhtKey::from("large_key");

    // Store large value
    node1.store(key.clone(), large_value.clone()).await.unwrap();

    // Retrieve large value
    let found = node1.find_value(key).await.unwrap();
    assert_eq!(found, Some(large_value));

    // Cleanup
    server_handle.abort();
    handle1.abort();
}

#[tokio::test]
async fn test_node_failure_recovery() {
    // Start bootstrap node
    let bootstrap_node = create_test_node();
    let server = crate::rpc::RpcServer::new(bootstrap_node.clone());
    let server_handle = tokio::spawn(async move {
        server.start().await.unwrap();
    });

    // Wait for bootstrap server to be ready
    assert!(wait_for_server(bootstrap_node.addr, Duration::from_secs(1)).await, "Bootstrap server failed to start");

    // Start nodes connecting to bootstrap
    let node1 = create_test_node();
    let node2 = create_test_node();
    let node3 = create_test_node();

    let server1 = crate::rpc::RpcServer::new(node1.clone());
    let server2 = crate::rpc::RpcServer::new(node2.clone());
    let server3 = crate::rpc::RpcServer::new(node3.clone());

    let handle1 = tokio::spawn(async move {
        server1.start().await.unwrap();
    });
    let handle2 = tokio::spawn(async move {
        server2.start().await.unwrap();
    });
    let handle3 = tokio::spawn(async move {
        server3.start().await.unwrap();
    });

    // Wait for all servers to be ready
    assert!(wait_for_server(node1.addr, Duration::from_secs(1)).await, "Node1 server failed to start");
    assert!(wait_for_server(node2.addr, Duration::from_secs(1)).await, "Node2 server failed to start");
    assert!(wait_for_server(node3.addr, Duration::from_secs(1)).await, "Node3 server failed to start");

    // Bootstrap nodes
    node1.bootstrap(bootstrap_node.addr).await.unwrap();
    node2.bootstrap(bootstrap_node.addr).await.unwrap();
    node3.bootstrap(bootstrap_node.addr).await.unwrap();

    // Store data on node1
    let key = DhtKey::from("test_key");
    let value = b"test_value".to_vec();
    node1.store(key.clone(), value.clone()).await.unwrap();

    // Simulate node1 failure by aborting its server
    handle1.abort();

    // Wait for failure to be detected
    tokio::time::sleep(Duration::from_secs(1)).await;

    // Try to retrieve from other nodes
    let found2 = node2.find_value(key.clone()).await.unwrap();
    assert_eq!(found2, Some(value.clone()));

    let found3 = node3.find_value(key).await.unwrap();
    assert_eq!(found3, Some(value));

    // Cleanup
    server_handle.abort();
    handle2.abort();
    handle3.abort();
}

#[tokio::test]
async fn test_bootstrap_node_failure() {
    // Start bootstrap node
    let bootstrap_node = create_test_node();
    let server = crate::rpc::RpcServer::new(bootstrap_node.clone());
    let server_handle = tokio::spawn(async move {
        server.start().await.unwrap();
    });

    // Wait for bootstrap server to be ready
    assert!(wait_for_server(bootstrap_node.addr, Duration::from_secs(1)).await, "Bootstrap server failed to start");

    // Start nodes connecting to bootstrap
    let node1 = create_test_node();
    let node2 = create_test_node();

    let server1 = crate::rpc::RpcServer::new(node1.clone());
    let server2 = crate::rpc::RpcServer::new(node2.clone());

    let handle1 = tokio::spawn(async move {
        server1.start().await.unwrap();
    });
    let handle2 = tokio::spawn(async move {
        server2.start().await.unwrap();
    });

    // Wait for all servers to be ready
    assert!(wait_for_server(node1.addr, Duration::from_secs(1)).await, "Node1 server failed to start");
    assert!(wait_for_server(node2.addr, Duration::from_secs(1)).await, "Node2 server failed to start");

    // Bootstrap nodes
    node1.bootstrap(bootstrap_node.addr).await.unwrap();
    node2.bootstrap(bootstrap_node.addr).await.unwrap();

    // Store data on node1
    let key = DhtKey::from("test_key");
    let value = b"test_value".to_vec();
    node1.store(key.clone(), value.clone()).await.unwrap();

    // Simulate bootstrap node failure
    server_handle.abort();

    // Wait for failure to be detected
    tokio::time::sleep(Duration::from_secs(1)).await;

    // Try to retrieve from remaining nodes
    let found1 = node1.find_value(key.clone()).await.unwrap();
    assert_eq!(found1, Some(value.clone()));

    let found2 = node2.find_value(key).await.unwrap();
    assert_eq!(found2, Some(value));

    // Cleanup
    handle1.abort();
    handle2.abort();
}

#[tokio::test]
async fn test_concurrent_operations() {
    // Start bootstrap node
    let bootstrap_node = create_test_node();
    let server_handle = start_node(&bootstrap_node).await;

    // Start nodes connecting to bootstrap
    let node1 = create_test_node();
    let node2 = create_test_node();

    let handle1 = start_node(&node1).await;
    let handle2 = start_node(&node2).await;

    // Bootstrap nodes
    bootstrap_node_to(&node1, bootstrap_node.addr).await;
    bootstrap_node_to(&node2, bootstrap_node.addr).await;

    // Ensure all nodes are connected
    let nodes: Vec<&DhtNode> = vec![&bootstrap_node, &node1, &node2];
    assert!(
        ensure_nodes_connected(&nodes, Duration::from_secs(2)).await,
        "Nodes failed to connect"
    );

    // Spawn multiple concurrent operations
    let mut handles = Vec::new();
    for i in 0..5 {
        let node1 = node1.clone();
        let node2 = node2.clone();
        let handle = tokio::spawn(async move {
            let key = DhtKey::from(format!("key{}", i).as_str());
            let value = format!("value{}", i).into_bytes();

            // Store on node1
            node1.store(key.clone(), value.clone()).await.unwrap();
            
            // Give some time for replication
            tokio::time::sleep(Duration::from_millis(500)).await;

            // Retrieve from node2
            let found = node2.find_value(key).await.unwrap();
            assert_eq!(found, Some(value));
        });
        handles.push(handle);
    }

    // Wait for all operations to complete
    for handle in handles {
        handle.await.unwrap();
    }

    // Cleanup
    server_handle.abort();
    handle1.abort();
    handle2.abort();
}

#[tokio::test]
async fn test_node_id_exchange() -> Result<(), TestError> {
    let node = create_test_node();
    let server = RpcServer::new(node.clone());
    
    let server_handle = tokio::spawn(async move {
        server.start().await.unwrap();
    });

    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    let test_node = create_test_node();
    let client = RpcClient::new(node.addr);
    let response = client.send_request(RpcRequest::GetNodeId(test_node.id.clone(), test_node.addr)).await?;
    
    match response {
        RpcResponse::NodeId(id) => assert_eq!(id, node.id),
        _ => panic!("Expected NodeId response"),
    }

    server_handle.abort();
    Ok(())
} 