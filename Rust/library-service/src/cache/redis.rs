use redis::Client;
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use tracing::{error, warn};
use uuid::Uuid;
use crate::error::{AppError, Result};

#[derive(Clone)]
pub struct Cache {
    client: Client,
    ttl_seconds: u64,
}

impl Cache {
    pub async fn new(url: &str, ttl_seconds: u64) -> Result<Self> {
        let client = Client::open(url)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to create Redis client: {}", e)))?;
        
        // Test connection
        let mut conn = client.get_connection_manager().await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to connect to Redis: {}", e)))?;
        
        let _: String = redis::cmd("PING")
            .query_async(&mut conn)
            .await
            .map_err(|e| {
                warn!("Redis connection test failed: {}", e);
                AppError::Internal(anyhow::anyhow!("Redis connection failed: {}", e))
            })?;
        
        Ok(Self {
            client,
            ttl_seconds,
        })
    }

    pub async fn get<T>(&self, key: &str) -> Result<Option<T>>
    where
        T: for<'de> Deserialize<'de>,
    {
        let mut conn = self.client.get_connection_manager().await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Redis connection error: {}", e)))?;
        
        let value: Option<String> = conn.get(key).await
            .map_err(|e| {
                error!("Redis GET error: {}", e);
                AppError::Internal(anyhow::anyhow!("Redis GET failed: {}", e))
            })?;
        
        match value {
            Some(v) => {
                serde_json::from_str(&v)
                    .map(Some)
                    .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to deserialize cached value: {}", e)))
            }
            None => Ok(None),
        }
    }

    pub async fn set<T>(&self, key: &str, value: &T) -> Result<()>
    where
        T: Serialize,
    {
        let mut conn = self.client.get_connection_manager().await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Redis connection error: {}", e)))?;
        
        let serialized = serde_json::to_string(value)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize value: {}", e)))?;
        
        conn.set_ex::<_, _, ()>(key, serialized, self.ttl_seconds).await
            .map_err(|e| {
                error!("Redis SET error: {}", e);
                AppError::Internal(anyhow::anyhow!("Redis SET failed: {}", e))
            })?;
        
        Ok(())
    }

    pub async fn delete(&self, key: &str) -> Result<()> {
        let mut conn = self.client.get_connection_manager().await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Redis connection error: {}", e)))?;
        
        conn.del::<_, ()>(key).await
            .map_err(|e| {
                error!("Redis DELETE error: {}", e);
                AppError::Internal(anyhow::anyhow!("Redis DELETE failed: {}", e))
            })?;
        
        Ok(())
    }

    pub async fn delete_pattern(&self, pattern: &str) -> Result<()> {
        let mut conn = self.client.get_connection_manager().await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Redis connection error: {}", e)))?;
        
        let keys: Vec<String> = conn.keys(pattern).await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Redis KEYS failed: {}", e)))?;
        
        if !keys.is_empty() {
            conn.del::<_, ()>(keys).await
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Redis DELETE failed: {}", e)))?;
        }
        
        Ok(())
    }
}

// Cache key helpers
pub fn book_key(id: &Uuid) -> String {
    format!("book:{}", id)
}

pub fn book_search_key(author: Option<&str>, genre: Option<&str>, title: Option<&str>) -> String {
    format!("book:search:{}:{}:{}", 
        author.unwrap_or(""), 
        genre.unwrap_or(""), 
        title.unwrap_or(""))
}

pub fn user_key(id: &Uuid) -> String {
    format!("user:{}", id)
}

