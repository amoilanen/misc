use std::collections::HashMap;
use std::time::{Duration, Instant};
use crate::NodeId;

#[derive(Clone, Debug)]
pub struct Value {
    data: Vec<u8>,
    expires_at: Option<Instant>,
}

impl Value {
    pub fn new(data: Vec<u8>, ttl: Option<Duration>) -> Self {
        Self {
            data,
            expires_at: ttl.map(|d| Instant::now() + d),
        }
    }

    pub fn is_expired(&self) -> bool {
        self.expires_at.map_or(false, |t| t <= Instant::now())
    }
}

pub struct Storage {
    values: HashMap<NodeId, Value>,
}

impl Storage {
    pub fn new() -> Self {
        Self {
            values: HashMap::new(),
        }
    }

    pub fn store(&mut self, key: NodeId, value: Vec<u8>, ttl: Option<Duration>) {
        self.values.insert(key, Value::new(value, ttl));
    }

    pub fn get(&self, key: &NodeId) -> Option<&[u8]> {
        self.values.get(key).and_then(|v| {
            if v.is_expired() {
                None
            } else {
                Some(v.data.as_slice())
            }
        })
    }

    pub fn remove(&mut self, key: &NodeId) {
        self.values.remove(key);
    }

    pub fn cleanup(&mut self) {
        self.values.retain(|_, v| !v.is_expired());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn test_storage_basic_operations() {
        let mut storage = Storage::new();
        let key = NodeId::random();
        let value = b"test value".to_vec();

        // Test store and get
        storage.store(key.clone(), value.clone(), None);
        assert_eq!(storage.get(&key), Some(value.as_slice()));

        // Test remove
        storage.remove(&key);
        assert_eq!(storage.get(&key), None);
    }

    #[test]
    fn test_storage_ttl() {
        let mut storage = Storage::new();
        let key = NodeId::random();
        let value = b"test value".to_vec();

        // Store with short TTL
        storage.store(key.clone(), value.clone(), Some(Duration::from_millis(100)));
        assert_eq!(storage.get(&key), Some(value.as_slice()));

        // Wait for TTL to expire
        std::thread::sleep(Duration::from_millis(200));
        assert_eq!(storage.get(&key), None);
    }

    #[test]
    fn test_storage_cleanup() {
        let mut storage = Storage::new();
        let key1 = NodeId::random();
        let key2 = NodeId::random();
        let value = b"test value".to_vec();

        // Store one value with TTL and one without
        storage.store(key1.clone(), value.clone(), Some(Duration::from_millis(100)));
        storage.store(key2.clone(), value.clone(), None);

        // Wait for TTL to expire
        std::thread::sleep(Duration::from_millis(200));

        // Cleanup should remove expired values
        storage.cleanup();
        assert_eq!(storage.get(&key1), None);
        assert_eq!(storage.get(&key2), Some(value.as_slice()));
    }
} 