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
pub struct DhtKey(pub [u8; 32]);

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NodeInfo {
    pub id: DhtKey,
    pub addr: SocketAddr,
}

#[derive(Clone)]
pub struct DhtNode {
    pub id: DhtKey,
    pub addr: SocketAddr,
    pub routing_table: Arc<Mutex<routing::RoutingTable>>,
    pub storage: Arc<Mutex<storage::Storage>>,
}

impl DhtKey {
    pub fn random() -> Self {
        let mut bytes = [0u8; 32];
        getrandom::getrandom(&mut bytes).expect("Failed to generate random bytes");
        DhtKey(bytes)
    }

    // XOR distance https://pdos.csail.mit.edu/~petar/papers/maymounkov-kademlia-lncs.pdf
    pub fn distance(&self, other: &DhtKey) -> [u8; 32] {
        let mut xor_result = [0u8; 32];
        for i in 0..32 {
            xor_result[i] = self.0[i] ^ other.0[i];
        }
        xor_result
    }
}

impl From<&str> for DhtKey {
    fn from(s: &str) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(s.as_bytes());
        let result = hasher.finalize();
        let mut bytes = [0u8; 32];
        bytes.copy_from_slice(&result);
        DhtKey(bytes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_distance_identical_nodes() {
        let id1 = DhtKey([0u8; 32]);
        let id2 = DhtKey([0u8; 32]);
        assert_eq!(id1.distance(&id2), [0u8; 32]);
    }

    #[test]
    fn test_distance_different_msb() {
        let mut id1 = [0u8; 32];
        let mut id2 = [0u8; 32];
        id1[0] = 0b10000000; // MSB is 1
        id2[0] = 0b00000000; // MSB is 0
        let mut expected = [0u8; 32];
        expected[0] = 0b10000000;
        assert_eq!(DhtKey(id1).distance(&DhtKey(id2)), expected);
    }

    #[test]
    fn test_distance_different_lsb() {
        let mut id1 = [0u8; 32];
        let mut id2 = [0u8; 32];
        id1[31] = 0b00000001; // LSB is 1
        id2[31] = 0b00000000; // LSB is 0
        let mut expected = [0u8; 32];
        expected[31] = 0b00000001;
        assert_eq!(DhtKey(id1).distance(&DhtKey(id2)), expected);
    }

    #[test]
    fn test_distance_middle_bytes() {
        let mut id1 = [0u8; 32];
        let mut id2 = [0u8; 32];
        id1[15] = 0b00010000; // Different bit in middle byte
        id2[15] = 0b00000000;
        let mut expected = [0u8; 32];
        expected[15] = 0b00010000;
        assert_eq!(DhtKey(id1).distance(&DhtKey(id2)), expected);
    }

    #[test]
    fn test_distance_random_ids() {
        let id1 = DhtKey::random();
        let id2 = DhtKey::random();
        let distance = id1.distance(&id2);
        assert_ne!(distance, [0u8; 32]); // Distance should not be zero for random IDs
    }
}
