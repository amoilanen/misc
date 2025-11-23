use axum::{
    extract::{Path, State},
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::dal::Database;
use crate::service::UserService;
use crate::cache::Cache;
use crate::error::Result;

#[derive(Debug, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    #[validate(length(min = 1, max = 50))]
    pub role: String,
    #[validate(length(min = 8))]
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub role: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<crate::dal::user::User> for UserResponse {
    fn from(user: crate::dal::user::User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }
    }
}

pub fn routes() -> Router<(Database, Option<Cache>, crate::auth::middleware::AuthState)> {
    Router::new()
        .route("/", post(create_user))
        .route("/:id", get(get_user))
}

async fn create_user(
    State((db, _cache, _auth_state)): State<(Database, Option<Cache>, crate::auth::middleware::AuthState)>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<UserResponse>> {
    payload.validate().map_err(|e| crate::error::AppError::Validation(e.to_string()))?;

    let service = UserService::new(db);
    let create = crate::dal::user::CreateUser {
        email: payload.email,
        name: payload.name,
        role: payload.role,
        password_hash: None, // Will be set by service
    };

    let user = service.create_user(create, Some(payload.password)).await?;
    Ok(Json(UserResponse::from(user)))
}

async fn get_user(
    State((db, cache, _auth_state)): State<(Database, Option<Cache>, crate::auth::middleware::AuthState)>,
    Path(id): Path<Uuid>,
) -> Result<Json<UserResponse>> {
    use crate::cache::redis::user_key;
    
    let cache_key = user_key(&id);
    
    // Try cache first
    if let Some(ref cache) = cache {
        if let Ok(Some(cached)) = cache.get::<UserResponse>(&cache_key).await {
            return Ok(Json(cached));
        }
    }
    
    let service = UserService::new(db);
    let user = service.get_user(id).await?;
    let response = UserResponse::from(user);
    
    // Cache the result
    if let Some(ref cache) = cache {
        let _ = cache.set(&cache_key, &response).await;
    }
    
    Ok(Json(response))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_user_request_validation() {
        let valid_request = CreateUserRequest {
            email: "test@example.com".to_string(),
            name: "Test User".to_string(),
            role: "user".to_string(),
            password: "password123".to_string(),
        };
        
        assert!(valid_request.validate().is_ok());
    }

    #[test]
    fn test_create_user_request_invalid_email() {
        let invalid_request = CreateUserRequest {
            email: "not-an-email".to_string(),
            name: "Test User".to_string(),
            role: "user".to_string(),
            password: "password123".to_string(),
        };
        
        assert!(invalid_request.validate().is_err());
    }

    #[test]
    fn test_create_user_request_short_password() {
        let invalid_request = CreateUserRequest {
            email: "test@example.com".to_string(),
            name: "Test User".to_string(),
            role: "user".to_string(),
            password: "short".to_string(), // Less than 8 characters
        };
        
        assert!(invalid_request.validate().is_err());
    }

    #[test]
    fn test_user_response_from_user() {
        use chrono::Utc;
        let user = crate::dal::user::User {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            name: "Test User".to_string(),
            role: "user".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        let response = UserResponse::from(user);
        assert_eq!(response.email, "test@example.com");
        assert_eq!(response.role, "user");
    }
}

