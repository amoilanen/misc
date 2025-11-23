use axum::{
    extract::State,
    response::Json,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::dal::Database;
use crate::cache::Cache;
use crate::auth::{jwt::create_token, password::verify_password};
use crate::error::{AppError, Result};

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email)]
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user_id: String,
    pub email: String,
    pub role: String,
}

pub async fn login(
    State((db, _cache, auth_state)): State<(Database, Option<Cache>, crate::auth::middleware::AuthState)>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>> {
    payload.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let user_service = crate::service::UserService::new(db);
    
    // Find user by email
    let user = user_service
        .get_user_by_email(&payload.email)
        .await?
        .ok_or_else(|| AppError::BadRequest("Invalid email or password".to_string()))?;

    // Verify password
    let password_hash = user_service
        .get_password_hash(&user.id)
        .await?
        .ok_or_else(|| AppError::BadRequest("Invalid email or password".to_string()))?;

    if !verify_password(&payload.password, &password_hash)? {
        return Err(AppError::BadRequest("Invalid email or password".to_string()));
    }

    // Create JWT token
    let claims = crate::auth::jwt::Claims::new(user.id, user.email.clone(), user.role.clone());
    let token = create_token(&claims, &auth_state.jwt_secret)?;

    Ok(Json(LoginResponse {
        token,
        user_id: user.id.to_string(),
        email: user.email,
        role: user.role,
    }))
}

