use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use chrono::{Duration, Utc};
use uuid::Uuid;
use crate::error::{AppError, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // user_id
    pub email: String,
    pub role: String,
    pub exp: i64,
    pub iat: i64,
}

impl Claims {
    pub fn new(user_id: Uuid, email: String, role: String) -> Self {
        let now = Utc::now();
        Self {
            sub: user_id.to_string(),
            email,
            role,
            exp: (now + Duration::hours(24)).timestamp(),
            iat: now.timestamp(),
        }
    }

    pub fn user_id(&self) -> Result<Uuid> {
        Uuid::parse_str(&self.sub)
            .map_err(|_| AppError::BadRequest("Invalid user ID in token".to_string()))
    }
}

pub fn create_token(claims: &Claims, secret: &str) -> Result<String> {
    let key = EncodingKey::from_secret(secret.as_ref());
    encode(&Header::default(), claims, &key)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to create token: {}", e)))
}

pub fn verify_token(token: &str, secret: &str) -> Result<Claims> {
    let key = DecodingKey::from_secret(secret.as_ref());
    let validation = Validation::default();
    
    decode::<Claims>(token, &key, &validation)
        .map(|data| data.claims)
        .map_err(|e| AppError::BadRequest(format!("Invalid token: {}", e)))
}

