use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::Mutex;
use sha2::{Digest, Sha256};
use serde::{Serialize, Deserialize};

pub mod node;
pub mod routing;
pub mod rpc;
pub mod storage;
pub mod utils;

pub const K: usize = 20; // Kademlia bucket size
pub const ALPHA: usize = 3; // Concurrency parameter
pub const KEY_SIZE: usize = 256; // Size of keys in bits

#[derive(Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct NodeId(pub [u8; 32]);

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NodeInfo {
    pub id: NodeId,
    pub addr: SocketAddr,
}

#[derive(Clone)]
pub struct DhtNode {
    pub id: NodeId,
    pub addr: SocketAddr,
    pub routing_table: Arc<Mutex<routing::RoutingTable>>,
    pub storage: Arc<Mutex<storage::Storage>>,
}

impl NodeId {
    pub fn random() -> Self {
        let mut bytes = [0u8; 32];
        getrandom::getrandom(&mut bytes).expect("Failed to generate random bytes");
        NodeId(bytes)
    }

    pub fn distance(&self, other: &NodeId) -> u128 {
        let mut xor_result = [0u8; 32];
        for i in 0..32 {
            xor_result[i] = self.0[i] ^ other.0[i];
        }

        // Find the first non-zero byte to determine the most significant bit
        for (i, &byte) in xor_result.iter().enumerate() {
            if byte != 0 {
                // Calculate the bit position from the left
                return ((31 - i) * 8 + byte.leading_zeros() as usize) as u128;
            }
        }
        0 // Nodes are identical
    }
}

impl From<&str> for NodeId {
    fn from(s: &str) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(s.as_bytes());
        let result = hasher.finalize();
        let mut bytes = [0u8; 32];
        bytes.copy_from_slice(&result);
        NodeId(bytes)
    }
}
