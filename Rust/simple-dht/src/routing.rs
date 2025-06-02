use std::time::Instant;
use std::net::SocketAddr;
use crate::{DhtKey, NodeInfo, K, KEY_SIZE};

#[derive(Clone, Debug)]
pub struct Bucket {
    nodes: Vec<NodeInfo>,
    last_updated: Instant,
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
    buckets: Vec<Bucket>,
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

        // Sort by distance to target and take closest nodes
        nodes.sort_by(|a, b| {
            let dist_a = target.distance(&a.id);
            let dist_b = target.distance(&b.id);
            dist_a.cmp(&dist_b)
        });

        nodes.truncate(count);
        nodes
    }

    fn get_bucket_index(&self, distance: u128) -> usize {
        if distance == 0 {
            return 0;
        }
        
        // For non-zero distances, calculate the bucket index based on the number of bits
        // needed to represent the distance
        let bits = 128 - distance.leading_zeros() as usize;
        if bits >= KEY_SIZE {
            KEY_SIZE - 1
        } else {
            KEY_SIZE - bits
        }
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
        
        // Add nodes with different distances
        let nodes: Vec<_> = (0..5).map(|i| create_test_node(4000 + i as u16)).collect();
        for node in &nodes {
            rt.update(node.clone());
        }

        // Find closest nodes
        let target = DhtKey::random();
        let closest = rt.find_closest(&target, 3);
        assert_eq!(closest.len(), 3);

        // Verify they are sorted by distance
        for i in 0..closest.len() - 1 {
            let dist1 = target.distance(&closest[i].id);
            let dist2 = target.distance(&closest[i + 1].id);
            assert!(dist1 <= dist2);
        }
    }

    #[test]
    fn test_bucket_index_calculation() {
        let node_id = DhtKey::random();
        let rt = RoutingTable::new(node_id.clone());

        // Test special cases
        assert_eq!(rt.get_bucket_index(0), 0, "Zero distance should map to bucket 0");
        assert_eq!(rt.get_bucket_index(u128::MAX), KEY_SIZE - 1, "Maximum distance should map to last bucket");

        // Test powers of 2 (these are important boundary cases)
        for i in 0..KEY_SIZE {
            let distance = 1u128 << i;
            let expected_index = if i >= KEY_SIZE { KEY_SIZE - 1 } else { KEY_SIZE - i - 1 };
            assert_eq!(
                rt.get_bucket_index(distance),
                expected_index,
                "Distance 2^{} should map to bucket {}",
                i,
                expected_index
            );
        }

        // Test values just before and after powers of 2
        for i in 1..KEY_SIZE {
            let power = 1u128 << i;
            let before_power = power - 1;
            let after_power = power + 1;
            let expected_index = KEY_SIZE - i;

            assert_eq!(
                rt.get_bucket_index(before_power),
                expected_index,
                "Distance {} (before 2^{}) should map to bucket {}",
                before_power,
                i,
                expected_index
            );

            assert_eq!(
                rt.get_bucket_index(after_power),
                expected_index,
                "Distance {} (after 2^{}) should map to bucket {}",
                after_power,
                i,
                expected_index
            );
        }

        // Test some random distances to ensure general correctness
        let test_distances = [
            (1, KEY_SIZE - 1),
            (3, KEY_SIZE - 2),
            (7, KEY_SIZE - 3),
            (15, KEY_SIZE - 4),
            (31, KEY_SIZE - 5),
            (63, KEY_SIZE - 6),
            (127, KEY_SIZE - 7),
            (255, KEY_SIZE - 8),
            (511, KEY_SIZE - 9),
            (1023, KEY_SIZE - 10),
        ];

        for (distance, expected_index) in test_distances {
            assert_eq!(
                rt.get_bucket_index(distance),
                expected_index,
                "Distance {} should map to bucket {}",
                distance,
                expected_index
            );
        }

        // Test that all distances in a bucket range map to the same bucket
        for i in 0..KEY_SIZE {
            let bucket_start = if i == 0 { 0 } else { 1u128 << (KEY_SIZE - i - 1) };
            let bucket_end = if i == KEY_SIZE - 1 { u128::MAX } else { (1u128 << (KEY_SIZE - i)) - 1 };
            
            let expected_index = i;
            let test_distances = [
                bucket_start,
                bucket_start + 1,
                (bucket_start + bucket_end) / 2,
                bucket_end - 1,
                bucket_end,
            ];

            for distance in test_distances {
                assert_eq!(
                    rt.get_bucket_index(distance),
                    expected_index,
                    "Distance {} in bucket range [{}, {}] should map to bucket {}",
                    distance,
                    bucket_start,
                    bucket_end,
                    expected_index
                );
            }
        }
    }
} 