// Cache tests

use library_service::cache::Cache;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
struct TestData {
    id: u32,
    name: String,
}

#[tokio::test]
#[ignore]
async fn test_cache_operations() {
    let redis_url = std::env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://localhost:6379".to_string());
    
    let cache = Cache::new(&redis_url, 60).await.expect("Failed to create cache");
    
    // Test set and get
    let test_data = TestData {
        id: 1,
        name: "Test".to_string(),
    };
    
    let key = "test:key:1";
    cache.set(key, &test_data).await.expect("Failed to set cache");
    
    let retrieved: Option<TestData> = cache.get(key).await.expect("Failed to get cache");
    assert_eq!(retrieved, Some(test_data.clone()));
    
    // Test delete
    cache.delete(key).await.expect("Failed to delete cache");
    
    let deleted: Option<TestData> = cache.get(key).await.expect("Failed to get cache");
    assert_eq!(deleted, None);
}

