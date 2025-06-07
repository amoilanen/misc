use std::time::Instant;
use std::net::SocketAddr;
use crate::{DhtKey, NodeInfo, K, KEY_SIZE};

#[derive(Clone, Debug)]
pub struct Bucket {
    pub nodes: Vec<NodeInfo>,
    pub last_updated: Instant,
}

impl Bucket {
    pub fn new() -> Self {
        Self {
            nodes: Vec::with_capacity(K),
            last_updated: Instant::now(),
        }
    }

    pub fn update(&mut self, node: NodeInfo) -> bool {
        self.last_updated = Instant::now();
        if let Some(pos) = self.nodes.iter().position(|n| n.id == node.id) {
            self.nodes.remove(pos);
            self.nodes.push(node);
            return true;
        }
        if self.nodes.len() < K {
            self.nodes.push(node);
            return true;
        }
        false
    }

    pub fn remove(&mut self, node_id: &DhtKey) {
        if let Some(pos) = self.nodes.iter().position(|n| &n.id == node_id) {
            self.nodes.remove(pos);
        }
    }
}

pub struct RoutingTable {
    pub buckets: Vec<Bucket>,
    node_id: DhtKey,
}

impl RoutingTable {
    pub fn new(node_id: DhtKey) -> Self {
        Self {
            buckets: vec![Bucket::new(); KEY_SIZE],
            node_id,
        }
    }

    pub fn update(&mut self, node: NodeInfo) -> bool {
        let distance = self.node_id.distance(&node.id);
        let bucket_index = self.get_bucket_index(distance);
        self.buckets[bucket_index].update(node)
    }

    pub fn remove(&mut self, node_id: &DhtKey) {
        let distance = self.node_id.distance(node_id);
        let bucket_index = self.get_bucket_index(distance);
        self.buckets[bucket_index].remove(node_id);
    }

    pub fn find_closest(&self, target: &DhtKey, count: usize) -> Vec<NodeInfo> {
        let mut nodes = Vec::new();
        let distance = self.node_id.distance(target);
        let bucket_index = self.get_bucket_index(distance);

        // Add nodes from the target bucket
        nodes.extend(self.buckets[bucket_index].nodes.clone());

        // Add nodes from buckets to the right (closer nodes) if needed
        let mut right = bucket_index + 1;
        while nodes.len() < count && right < self.buckets.len() {
            nodes.extend(self.buckets[right].nodes.clone());
            right += 1;
        }

        // Add nodes from buckets to the left (further nodes) if needed
        let mut left = bucket_index;
        while nodes.len() < count && left > 0 {
            left -= 1;
            nodes.extend(self.buckets[left].nodes.clone());
        }

        // Sort by distance to target
        nodes.sort_by(|a, b| {
            let dist_a = target.distance(&a.id);
            let dist_b = target.distance(&b.id);
            dist_a.cmp(&dist_b)
        });

        nodes.truncate(count);
        nodes
    }

    pub fn get_bucket_index(&self, distance: [u8; 32]) -> usize {
        if distance == [0u8; 32] {
            return 0;
        }
        
        // Find the first non-zero byte
        for (i, &byte) in distance.iter().enumerate() {
            if byte != 0 {
                // Calculate the bit position from the left (0-based)
                let bit_pos = i * 8 + byte.leading_zeros() as usize;
                return if bit_pos >= KEY_SIZE {
                    KEY_SIZE - 1
                } else {
                    bit_pos
                };
            }
        }
        0 // Should never reach here if distance != [0u8; 32]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{IpAddr, Ipv4Addr};

    fn create_test_node(port: u16) -> NodeInfo {
        NodeInfo {
            id: DhtKey::random(),
            addr: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), port),
        }
    }

    #[test]
    fn test_bucket_basic() {
        let mut bucket = Bucket::new();
        let node = create_test_node(4000);

        // Test adding node
        assert!(bucket.update(node.clone()));
        assert_eq!(bucket.nodes.len(), 1);

        // Test updating existing node
        assert!(bucket.update(node.clone()));
        assert_eq!(bucket.nodes.len(), 1);

        // Test removing node
        bucket.remove(&node.id);
        assert_eq!(bucket.nodes.len(), 0);
    }

    #[test]
    fn test_bucket_capacity() {
        let mut bucket = Bucket::new();
        
        // Fill bucket to capacity
        for i in 0..K {
            let node = create_test_node(4000 + i as u16);
            assert!(bucket.update(node));
        }

        // Try to add one more node
        let extra_node = create_test_node(4100);
        assert!(!bucket.update(extra_node));
        assert_eq!(bucket.nodes.len(), K);
    }

    #[test]
    fn test_routing_table_basic() {
        let node_id = DhtKey::random();
        let rt = RoutingTable::new(node_id.clone());
        assert_eq!(rt.buckets.len(), KEY_SIZE);
    }

    #[test]
    fn test_routing_table_update() {
        let node_id = DhtKey::random();
        let mut rt = RoutingTable::new(node_id.clone());
        let test_node = create_test_node(4000);

        assert!(rt.update(test_node.clone()));
        
        let closest = rt.find_closest(&test_node.id, 1);
        assert_eq!(closest.len(), 1);
        assert_eq!(closest[0].id, test_node.id);
    }

    #[test]
    fn test_routing_table_find_closest() {
        let node_id = DhtKey::random();
        let mut rt = RoutingTable::new(node_id.clone());
        
        // Create nodes with deterministic distances
        let nodes: Vec<_> = (0..5).map(|i| {
            let id = DhtKey::random();
            // Make IDs deterministic but different
            let mut bytes = id.0;
            bytes[0] = i as u8;
            NodeInfo {
                id: DhtKey(bytes),
                addr: SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 4000 + i as u16),
            }
        }).collect();

        // Add nodes to routing table
        for node in &nodes {
            assert!(rt.update(node.clone()), "Failed to add node to routing table");
        }

        // Find closest nodes
        let target = DhtKey::random();
        let closest = rt.find_closest(&target, 3);
        assert_eq!(closest.len(), 3, "Expected 3 closest nodes");

        // Verify they are sorted by distance to target
        for i in 0..closest.len() - 1 {
            let dist1 = target.distance(&closest[i].id);
            let dist2 = target.distance(&closest[i + 1].id);
            assert!(dist1 <= dist2, 
                "Nodes not sorted by distance: dist1 {:?} > dist2 {:?}", dist1, dist2);
        }

        // Verify all returned nodes are from our test set
        let test_node_ids: std::collections::HashSet<_> = nodes.iter()
            .map(|n| n.id.clone())
            .collect();
        for node in &closest {
            assert!(test_node_ids.contains(&node.id), 
                "Returned node not in test nodes: {:?}", node);
        }
    }

    #[test]
    fn test_bucket_index_calculation() {
        let node_id = DhtKey::random();
        let rt = RoutingTable::new(node_id.clone());

        // Test edge cases
        assert_eq!(rt.get_bucket_index([0u8; 32]), 0, "Zero distance should map to bucket 0");
        
        // Test maximum distance (all bits set)
        let mut max_distance = [0u8; 32];
        max_distance[0] = 0b10000000; // Set MSB
        assert_eq!(rt.get_bucket_index(max_distance), 0, "MSB set should map to bucket 0");

        // Test minimum non-zero distance (LSB set)
        let mut min_distance = [0u8; 32];
        min_distance[31] = 0b00000001; // Set LSB
        assert_eq!(rt.get_bucket_index(min_distance), 255, "LSB set should map to bucket 255");

        // Test middle distances
        for i in 0..32 {
            for bit in 0..8 {
                let mut distance = [0u8; 32];
                distance[i] = 1 << bit;
                let expected_bucket = i * 8 + (7 - bit);
                assert_eq!(
                    rt.get_bucket_index(distance),
                    expected_bucket,
                    "Distance with bit {} set in byte {} should map to bucket {}",
                    bit,
                    i,
                    expected_bucket
                );
            }
        }
    }
} 